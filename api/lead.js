// Приём заявок на Vercel (serverless-функция). Каналы настраиваются в Vercel → Settings → Environment Variables
import { deliverLead, channelsConfigured } from "../server/delivery.mjs";
import crypto from "node:crypto";

const LABELS = { consult: "Консультация", callback: "Обратный звонок", price: "Узнать стоимость", corporate: "Корпоративное обучение", program: "Заявка со страницы программы", feedback: "Обратная связь" };
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const hits = new Map();

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 600000);
  list.push(now); hits.set(ip, list);
  if (list.length > Number(process.env.LEADS_RATE_LIMIT || 6)) return res.status(429).json({ ok: false, error: "Слишком много заявок подряд. Попробуйте позже." });

  let data = req.body;
  if (typeof data === "string") { try { data = JSON.parse(data); } catch { data = null; } }
  if (!data || typeof data !== "object") return res.status(400).json({ ok: false, error: "Некорректный запрос." });
  if (clean(data.website, 200)) return res.status(200).json({ ok: true });

  const d = String(data.phone || "").replace(/\D/g, "");
  const formType = clean(data.formType, 30) || "consult";
  const lead = {
    id: crypto.randomUUID(), date: new Date().toISOString(), formType, formLabel: LABELS[formType] || "Заявка с сайта",
    name: clean(data.name, 80), phone: d.length === 11 ? "+7" + d.slice(1) : d.length === 10 ? "+7" + d : "",
    direction: clean(data.direction, 150), program: clean(data.program, 200), company: clean(data.company, 150),
    comment: clean(data.comment, 1000), page: clean(data.page, 300),
    utm: Object.fromEntries(Object.entries(data.utm && typeof data.utm === "object" ? data.utm : {}).filter(([k]) => /^utm_\w+$/.test(k)).map(([k, v]) => [k, clean(v, 150)])),
    ip, userAgent: clean(req.headers["user-agent"], 300),
  };
  const errors = [];
  if (lead.name.length < 2) errors.push("Укажите имя.");
  if (!/^\+7[3489]\d{9}$/.test(lead.phone)) errors.push("Проверьте номер телефона.");
  if (data.consent !== true) errors.push("Нужно согласие на обработку персональных данных.");
  if (errors.length) return res.status(422).json({ ok: false, error: errors.join(" ") });

  if (!channelsConfigured().length) {
    console.error("[lead] Каналы не настроены. Заявка:", JSON.stringify({ ...lead, ip: undefined }));
    return res.status(503).json({ ok: false, error: "Онлайн-заявки временно не принимаются." });
  }
  const delivery = await deliverLead(lead);
  console.log("[lead]", lead.id, JSON.stringify(delivery));
  if (!delivery.some((x) => x.ok)) return res.status(502).json({ ok: false, error: "Не удалось отправить заявку." });
  return res.status(200).json({ ok: true, id: lead.id });
}
