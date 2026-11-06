// Доставка заявок: Telegram, e-mail (SMTP), Битрикс24, произвольный webhook (amoCRM через интегратор, Albato, Make и т.п.)
import net from "node:net";
import tls from "node:tls";
import os from "node:os";

const env = (k) => (process.env[k] || "").trim();

export function channelsConfigured() {
  const list = [];
  if (env("TELEGRAM_BOT_TOKEN") && env("TELEGRAM_CHAT_ID")) list.push("telegram");
  if (env("SMTP_HOST") && env("MAIL_TO")) list.push("email");
  if (env("BITRIX24_WEBHOOK_URL")) list.push("bitrix24");
  if (env("CRM_WEBHOOK_URL")) list.push("webhook");
  return list;
}

export function leadText(lead, { html = false } = {}) {
  const e = (s) => html ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : String(s);
  const b = (s) => html ? `<b>${e(s)}</b>` : s;
  const rows = [
    [b(`Новая заявка: ${lead.formLabel}`)],
    ["Имя", lead.name], ["Телефон", lead.phone], ["Организация", lead.company], ["Направление", lead.direction],
    ["Программа", lead.program], ["Комментарий", lead.comment], ["Страница", lead.page],
    ["UTM", Object.entries(lead.utm || {}).map(([k, v]) => `${k}=${v}`).join(", ")],
    ["Время", new Date(lead.date).toLocaleString("ru-RU", { timeZone: env("TIMEZONE") || "Asia/Yekaterinburg" })],
  ];
  return rows.filter((r) => r.length === 1 || r[1]).map((r) => r.length === 1 ? r[0] : `${r[0]}: ${e(r[1])}`).join("\n");
}

async function withTimeout(promise, ms, label) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label}: превышено время ожидания`)), ms); })]).finally(() => clearTimeout(t));
}

async function sendTelegram(lead) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chats = env("TELEGRAM_CHAT_ID").split(",").map((s) => s.trim()).filter(Boolean);
  const base = env("TELEGRAM_API_URL") || "https://api.telegram.org";
  let okCount = 0; const errs = [];
  for (const chat of chats) {
    const r = await fetch(`${base}/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: leadText(lead, { html: true }), parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) okCount++; else errs.push(j.description || `HTTP ${r.status}`);
  }
  if (!okCount) throw new Error(errs.join("; ") || "нет получателей");
}

async function sendBitrix(lead) {
  const base = env("BITRIX24_WEBHOOK_URL").replace(/\/+$/, "") + "/";
  const comments = [lead.direction && `Направление: ${lead.direction}`, lead.program && `Программа: ${lead.program}`, lead.company && `Организация: ${lead.company}`, lead.comment && `Комментарий: ${lead.comment}`].filter(Boolean).join("\n");
  const fields = {
    TITLE: `${lead.formLabel}: ${lead.program || lead.direction || "сайт"}`,
    NAME: lead.name,
    PHONE: [{ VALUE: lead.phone, VALUE_TYPE: "WORK" }],
    COMMENTS: comments,
    SOURCE_ID: "WEB",
    SOURCE_DESCRIPTION: lead.page,
    ...(lead.company ? { COMPANY_TITLE: lead.company } : {}),
    ...Object.fromEntries(Object.entries(lead.utm || {}).map(([k, v]) => [k.toUpperCase(), v])),
  };
  const r = await fetch(base + "crm.lead.add.json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: "Y" } }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.result) throw new Error(j.error_description || j.error || `HTTP ${r.status}`);
}

async function sendWebhook(lead) {
  const headers = { "Content-Type": "application/json" };
  if (env("CRM_WEBHOOK_SECRET")) headers["X-Webhook-Secret"] = env("CRM_WEBHOOK_SECRET");
  const { ip, userAgent, ...publicLead } = lead;
  const r = await fetch(env("CRM_WEBHOOK_URL"), { method: "POST", headers, body: JSON.stringify(publicLead) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

/* ---------- Minimal SMTP client (SSL 465, STARTTLS 587, plain for local tests) ---------- */
function b64(s) { return Buffer.from(s, "utf8").toString("base64"); }
function encodeHeader(s) { return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`; }
function wrap76(s) { return s.replace(/.{1,76}/g, "$&\r\n"); }

function smtpSession(sock) {
  let buf = "", waiter = null;
  const onData = (d) => { buf += d.toString("utf8"); check(); };
  function check() {
    if (!waiter) return;
    const lines = buf.split("\r\n");
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const resp = lines.slice(0, i + 1).join("\n");
        buf = lines.slice(i + 1).join("\r\n");
        const w = waiter; waiter = null; w(resp); return;
      }
    }
  }
  sock.on("data", onData);
  const read = () => new Promise((res) => { waiter = res; check(); });
  return {
    read,
    async cmd(line, expect) {
      if (line !== null) sock.write(line + "\r\n");
      const resp = await read();
      if (!expect.some((c) => resp.startsWith(String(c)))) throw new Error(`SMTP: ${resp.split("\n").pop()}`);
      return resp;
    },
    detach() { sock.off("data", onData); },
  };
}

async function sendEmail(lead) {
  const host = env("SMTP_HOST"), port = Number(env("SMTP_PORT") || 465);
  const secure = (env("SMTP_SECURE") || (port === 465 ? "true" : "false")) === "true";
  const user = env("SMTP_USER"), pass = env("SMTP_PASS");
  const from = env("MAIL_FROM") || user, to = env("MAIL_TO").split(",").map((s) => s.trim()).filter(Boolean);
  let sock = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
  await new Promise((res, rej) => { sock.once(secure ? "secureConnect" : "connect", res); sock.once("error", rej); });
  let s = smtpSession(sock);
  try {
    await s.cmd(null, [220]);
    const ehloName = os.hostname() || "localhost";
    let ehlo = await s.cmd(`EHLO ${ehloName}`, [250]);
    if (!secure && /STARTTLS/i.test(ehlo) && env("SMTP_STARTTLS") !== "false") {
      await s.cmd("STARTTLS", [220]);
      s.detach();
      sock = tls.connect({ socket: sock, servername: host });
      await new Promise((res, rej) => { sock.once("secureConnect", res); sock.once("error", rej); });
      s = smtpSession(sock);
      ehlo = await s.cmd(`EHLO ${ehloName}`, [250]);
    }
    if (user) {
      await s.cmd("AUTH LOGIN", [334]);
      await s.cmd(b64(user), [334]);
      await s.cmd(b64(pass), [235]);
    }
    await s.cmd(`MAIL FROM:<${from}>`, [250]);
    for (const rcpt of to) await s.cmd(`RCPT TO:<${rcpt}>`, [250, 251]);
    await s.cmd("DATA", [354]);
    const subject = `Заявка с сайта: ${lead.formLabel} — ${lead.name}`;
    const msg = [
      `From: ${encodeHeader(env("MAIL_FROM_NAME") || "Сайт учебного центра")} <${from}>`,
      `To: ${to.join(", ")}`,
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${lead.id}@${from.split("@")[1] || "localhost"}>`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(b64(leadText(lead))),
    ].join("\r\n");
    await s.cmd(msg + "\r\n.", [250]);
    await s.cmd("QUIT", [221]).catch(() => {});
  } finally {
    sock.end();
  }
}

export async function deliverLead(lead) {
  const tasks = { telegram: sendTelegram, email: sendEmail, bitrix24: sendBitrix, webhook: sendWebhook };
  return Promise.all(channelsConfigured().map(async (ch) => {
    try { await withTimeout(tasks[ch](lead), 15000, ch); return { channel: ch, ok: true }; }
    catch (e) { return { channel: ch, ok: false, error: String(e.message || e).slice(0, 300) }; }
  }));
}
