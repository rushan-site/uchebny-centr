// Сервер сайта учебного центра: раздача страниц, приём заявок, админ-панель.
// Без внешних зависимостей — нужен только Node.js 18.17+.
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { deliverLead, channelsConfigured } from "./delivery.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const DIST = path.join(ROOT, "dist");
const DATA = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA, "leads.jsonl");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
fs.mkdirSync(DATA, { recursive: true });

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf", ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2",
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg)/;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
}

async function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error("Слишком большой запрос"), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/* ------------------------- static files ------------------------- */
async function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return notFound(req, res); }
  if (rel.includes("\0")) return notFound(req, res);
  let file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST)) return notFound(req, res);
  let stat = await fsp.stat(file).catch(() => null);
  if (stat?.isDirectory()) {
    if (!pathname.endsWith("/")) return send(res, 301, "", { Location: pathname + "/" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") });
    file = path.join(file, "index.html");
    stat = await fsp.stat(file).catch(() => null);
  }
  if (!stat?.isFile()) {
    // pretty URL without trailing slash → redirect
    const alt = await fsp.stat(path.join(DIST, rel, "index.html")).catch(() => null);
    if (alt?.isFile()) return send(res, 301, "", { Location: pathname + "/" });
    return notFound(req, res);
  }
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const versioned = /[?&]v=/.test(req.url);
  const cache = ext === ".html" ? "no-cache" : versioned || ext.match(/\.(webp|jpg|jpeg|png|svg|avif|woff2)$/) ? "public, max-age=2592000" : "public, max-age=3600";
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  if (req.headers["if-none-match"] === etag) return send(res, 304, "", { ETag: etag, "Cache-Control": cache });
  const headers = { "Content-Type": type, "Cache-Control": cache, ETag: etag, Vary: "Accept-Encoding" };
  if (req.method === "HEAD") return send(res, 200, "", headers);
  const accept = String(req.headers["accept-encoding"] || "");
  if (COMPRESSIBLE.test(type) && stat.size > 1024 && /\bgzip\b/.test(accept)) {
    res.writeHead(200, { ...SECURITY_HEADERS, ...headers, "Content-Encoding": "gzip" });
    fs.createReadStream(file).pipe(zlib.createGzip({ level: 6 })).pipe(res);
  } else {
    res.writeHead(200, { ...SECURITY_HEADERS, ...headers, "Content-Length": stat.size });
    fs.createReadStream(file).pipe(res);
  }
}
async function notFound(req, res) {
  const page = await fsp.readFile(path.join(DIST, "404.html")).catch(() => "Страница не найдена");
  send(res, 404, page, { "Content-Type": "text/html; charset=utf-8" });
}

/* ------------------------- leads API ------------------------- */
const rate = new Map();
function rateLimited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = Number(process.env.LEADS_RATE_LIMIT || 6);
  const list = (rate.get(ip) || []).filter((t) => now - t < win);
  list.push(now); rate.set(ip, list);
  if (rate.size > 5000) for (const [k, v] of rate) if (!v.some((t) => now - t < win)) rate.delete(k);
  return list.length > max;
}
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const FORM_LABELS = { consult: "Консультация", callback: "Обратный звонок", price: "Узнать стоимость", corporate: "Корпоративное обучение", program: "Заявка со страницы программы", feedback: "Обратная связь" };

function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return (process.env.TRUST_PROXY === "1" && xf) || req.socket.remoteAddress || "";
}

async function handleLead(req, res) {
  const ip = clientIp(req);
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: "Слишком много заявок подряд. Попробуйте позже." });
  let data;
  try { data = JSON.parse((await readBody(req, 16 * 1024)).toString("utf8")); }
  catch (e) { return json(res, e.status || 400, { ok: false, error: "Некорректный запрос." }); }

  if (clean(data.website, 200)) return json(res, 200, { ok: true }); // honeypot: bot

  const phoneDigits = String(data.phone || "").replace(/\D/g, "");
  const phone = phoneDigits.length === 11 ? "+7" + phoneDigits.slice(1) : phoneDigits.length === 10 ? "+7" + phoneDigits : "";
  const lead = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    formType: clean(data.formType, 30) || "consult",
    formLabel: FORM_LABELS[clean(data.formType, 30)] || "Заявка с сайта",
    name: clean(data.name, 80),
    phone,
    direction: clean(data.direction, 150),
    program: clean(data.program, 200),
    company: clean(data.company, 150),
    comment: clean(data.comment, 1000),
    page: clean(data.page, 300),
    utm: Object.fromEntries(Object.entries(data.utm && typeof data.utm === "object" ? data.utm : {}).filter(([k]) => /^utm_\w+$/.test(k)).map(([k, v]) => [k, clean(v, 150)])),
    ip,
    userAgent: clean(req.headers["user-agent"], 300),
  };
  const errors = [];
  if (lead.name.length < 2) errors.push("Укажите имя.");
  if (!/^\+7[3489]\d{9}$/.test(lead.phone)) errors.push("Проверьте номер телефона.");
  if (data.consent !== true) errors.push("Нужно согласие на обработку персональных данных.");
  if (errors.length) return json(res, 422, { ok: false, error: errors.join(" ") });

  if (!channelsConfigured().length) {
    await appendLead({ ...lead, delivery: [], status: "not_configured" });
    console.error("[lead] Заявка НЕ отправлена: не настроен ни один канал (Telegram / e-mail / CRM). Сохранена в data/leads.jsonl");
    return json(res, 503, { ok: false, error: "Онлайн-заявки временно не принимаются." });
  }
  const delivery = await deliverLead(lead);
  const delivered = delivery.some((d) => d.ok);
  await appendLead({ ...lead, delivery, status: delivered ? "delivered" : "failed" });
  for (const d of delivery) if (!d.ok) console.error(`[lead] Канал ${d.channel}: ошибка — ${d.error}`);
  if (!delivered) return json(res, 502, { ok: false, error: "Не удалось отправить заявку." });
  return json(res, 200, { ok: true, id: lead.id });
}
async function appendLead(rec) {
  await fsp.appendFile(LEADS_FILE, JSON.stringify(rec) + "\n", { mode: 0o600 });
}

/* ------------------------- admin ------------------------- */
const EDITABLE = {
  config: "site.config.json", categories: "content/categories.json", programs: "content/programs.json",
  faq: "content/faq.json", reviews: "content/reviews.json", documents: "content/documents.json",
};
function checkAuth(req) {
  if (!ADMIN_PASSWORD) return false;
  const h = String(req.headers.authorization || "");
  if (!h.startsWith("Basic ")) return false;
  const [u, ...p] = Buffer.from(h.slice(6), "base64").toString("utf8").split(":");
  const a = Buffer.from(`${u}:${p.join(":")}`), b = Buffer.from(`${ADMIN_USER}:${ADMIN_PASSWORD}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
let building = null;
function runBuild() {
  if (building) return building;
  building = new Promise((resolve) => {
    const bin = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
    const p = spawn(bin, ["src/build.tsx"], { cwd: ROOT, shell: process.platform === "win32" });
    let out = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => { building = null; resolve({ ok: code === 0, output: out }); });
    p.on("error", (e) => { building = null; resolve({ ok: false, output: String(e) }); });
  });
  return building;
}
async function handleAdmin(req, res, url) {
  if (!ADMIN_PASSWORD) return notFound(req, res);
  if (!checkAuth(req)) return send(res, 401, "Требуется авторизация", { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" });
  const p = url.pathname.replace(/\/+$/, "") || "/admin";
  if (p === "/admin") return send(res, 200, await fsp.readFile(path.join(ROOT, "server/admin/index.html")), { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  if (p === "/admin/admin.js") return send(res, 200, await fsp.readFile(path.join(ROOT, "server/admin/admin.js")), { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
  if (p === "/admin/api/file") {
    const name = url.searchParams.get("name");
    const rel = EDITABLE[name];
    if (!rel) return json(res, 404, { ok: false, error: "Неизвестный файл" });
    const file = path.join(ROOT, rel);
    if (req.method === "GET") return json(res, 200, { ok: true, data: JSON.parse(await fsp.readFile(file, "utf8")) });
    if (req.method === "POST") {
      let data;
      try { data = JSON.parse((await readBody(req, 2 * 1024 * 1024)).toString("utf8")); } catch { return json(res, 400, { ok: false, error: "Некорректные данные" }); }
      if (name === "config" ? (typeof data !== "object" || Array.isArray(data)) : !Array.isArray(data)) return json(res, 400, { ok: false, error: "Неверная структура данных" });
      const backupDir = path.join(DATA, "backups"); await fsp.mkdir(backupDir, { recursive: true });
      const prev = await fsp.readFile(file, "utf8");
      await fsp.writeFile(path.join(backupDir, `${name}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`), prev);
      await fsp.writeFile(file, JSON.stringify(data, null, 2) + "\n");
      const result = await runBuild();
      if (!result.ok) { await fsp.writeFile(file, prev); await runBuild(); }
      return json(res, result.ok ? 200 : 422, { ok: result.ok, output: result.output, error: result.ok ? undefined : "Сборка не прошла — изменения отменены. Подробности ниже." });
    }
  }
  if (p === "/admin/api/leads") {
    const text = await fsp.readFile(LEADS_FILE, "utf8").catch(() => "");
    const leads = text.trim() ? text.trim().split("\n").slice(-300).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse() : [];
    return json(res, 200, { ok: true, leads, channels: channelsConfigured() });
  }
  if (p === "/admin/api/upload" && req.method === "POST") {
    let data;
    try { data = JSON.parse((await readBody(req, 12 * 1024 * 1024)).toString("utf8")); } catch { return json(res, 400, { ok: false, error: "Файл слишком большой (до 8 МБ)" }); }
    const ext = (String(data.name || "").match(/\.(jpe?g|png|webp|mp4|pdf)$/i) || [])[0];
    if (!ext) return json(res, 400, { ok: false, error: "Допустимы JPG, PNG, WEBP, MP4, PDF" });
    const base = String(data.name).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
    const fname = `${base}-${Date.now().toString(36)}${ext.toLowerCase()}`;
    const buf = Buffer.from(String(data.base64 || ""), "base64");
    for (const dir of [path.join(ROOT, "public/uploads"), path.join(DIST, "uploads")]) { await fsp.mkdir(dir, { recursive: true }); await fsp.writeFile(path.join(dir, fname), buf); }
    return json(res, 200, { ok: true, path: `/uploads/${fname}` });
  }
  if (p === "/admin/api/rebuild" && req.method === "POST") { const r = await runBuild(); return json(res, r.ok ? 200 : 500, r); }
  return json(res, 404, { ok: false, error: "Не найдено" });
}

/* ------------------------- server ------------------------- */
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/lead") {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
      return await handleLead(req, res);
    }
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return await handleAdmin(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
    return await serveStatic(req, res, url.pathname);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { ok: false, error: "Внутренняя ошибка сервера." });
  }
});

if (!fs.existsSync(path.join(DIST, "index.html"))) console.warn("⚠ Папка dist пуста — сначала выполните: npm run build");
server.listen(PORT, HOST, () => {
  const ch = channelsConfigured();
  console.log(`✔ Сайт запущен: http://localhost:${PORT}`);
  console.log(ch.length ? `  Заявки отправляются: ${ch.join(", ")}` : "  ⚠ Каналы заявок не настроены — формы будут показывать ошибку. Заполните .env (см. .env.example)");
  console.log(ADMIN_PASSWORD ? `  Админ-панель: http://localhost:${PORT}/admin (логин: ${ADMIN_USER})` : "  Админ-панель выключена (задайте ADMIN_PASSWORD в .env)");
});
