import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadContent, ROOT, type ImageSet } from "./content.js";
import { setSite, url, absUrl, type Site } from "./ctx.js";
import { HomePage } from "./pages/Home.js";
import {
  CatalogPage, CategoryPage, ProgramPage, WorkerPage, CorporatePage, AboutPage, ReviewsPage,
  ContactsPage, PrivacyPage, ConsentPage, NotFoundPage,
} from "./pages/inner.js";

const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const EXT = [".jpg", ".jpeg", ".png", ".webp"];

async function loadSharp() {
  try { return (await import("sharp")).default; } catch { return null; }
}

function findImage(base: string) {
  for (const e of EXT) { const f = base + e; if (fs.existsSync(f)) return f; }
  return null;
}

async function optimise(sharp: any, src: string, name: string): Promise<ImageSet | null> {
  const outDir = path.join(DIST, "img");
  fs.mkdirSync(outDir, { recursive: true });
  if (!sharp) {
    const rel = "/" + path.relative(PUBLIC, src).split(path.sep).join("/");
    return { src: rel, webp: rel, srcset: rel, width: 1200, height: 800 };
  }
  const meta = await sharp(src).metadata();
  const widths = [480, 960, 1600].filter((w) => w <= (meta.width ?? 1600));
  if (!widths.length) widths.push(meta.width ?? 480);
  const parts: string[] = [];
  for (const w of widths) {
    const out = path.join(outDir, `${name}-${w}.webp`);
    if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs) {
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    }
    parts.push(`/img/${name}-${w}.webp ${w}w`);
  }
  const fbW = Math.min(1200, meta.width ?? 1200);
  const fb = path.join(outDir, `${name}.jpg`);
  await sharp(src).rotate().resize({ width: fbW, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(fb);
  const ratio = (meta.height ?? 800) / (meta.width ?? 1200);
  return { src: `/img/${name}.jpg`, webp: `/img/${name}-${widths[widths.length - 1]}.webp`, srcset: parts.join(", "), width: fbW, height: Math.round(fbW * ratio) };
}

function copyDir(from: string, to: string) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const a = path.join(from, entry.name), b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

function writePage(route: string, el: React.ReactElement) {
  const html = "<!DOCTYPE html>" + renderToStaticMarkup(el);
  const file = route.endsWith(".html") ? path.join(DIST, route) : path.join(DIST, route, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return route;
}

async function main() {
  const t0 = Date.now();
  const content = loadContent();
  const sharp = await loadSharp();

  // keep optimised image cache between builds, rebuild everything else
  const keepImg = path.join(ROOT, ".cache-img");
  if (fs.existsSync(path.join(DIST, "img"))) { fs.rmSync(keepImg, { recursive: true, force: true }); fs.renameSync(path.join(DIST, "img"), keepImg); }
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  if (fs.existsSync(keepImg)) fs.renameSync(keepImg, path.join(DIST, "img"));

  const heroSrc = findImage(path.join(PUBLIC, "images", "hero"));
  const images: Site["images"] = { hero: heroSrc ? await optimise(sharp, heroSrc, "hero") : null, categories: {} };
  for (const c of content.categories) {
    const src = findImage(path.join(PUBLIC, "images", "categories", c.slug));
    images.categories[c.slug] = src ? await optimise(sharp, src, `cat-${c.slug}`) : null;
  }

  const assetVersion = crypto.createHash("md5")
    .update(fs.readFileSync(path.join(PUBLIC, "css", "styles.css")))
    .update(fs.readFileSync(path.join(PUBLIC, "js", "app.js")))
    .digest("hex").slice(0, 8);

  setSite({ ...content, images, assetVersion });
  copyDir(PUBLIC, DIST);

  const routes: string[] = [];
  routes.push(writePage("/", <HomePage />));
  routes.push(writePage(url.catalog, <CatalogPage />));
  for (const c of content.categories) routes.push(writePage(url.category(c), <CategoryPage c={c} />));
  for (const p of content.programs) routes.push(writePage(url.program(p), <ProgramPage p={p} />));
  routes.push(writePage(url.worker, <WorkerPage />));
  routes.push(writePage(url.corporate, <CorporatePage />));
  routes.push(writePage(url.about, <AboutPage />));
  if (content.reviews.length || content.config.draftMode) routes.push(writePage(url.reviews, <ReviewsPage />));
  routes.push(writePage(url.contacts, <ContactsPage />));
  routes.push(writePage(url.privacy, <PrivacyPage />));
  routes.push(writePage(url.consent, <ConsentPage />));
  writePage("/404.html", <NotFoundPage />);

  // search index for header search
  const index = content.programs.map((p) => {
    const c = content.categories.find((x) => x.slug === p.category)!;
    return { t: p.title, c: c.title, u: url.program(p), s: [p.title, c.title, p.description, ...(p.topics ?? [])].join(" ").toLowerCase() };
  }).concat(content.categories.map((c) => ({ t: c.title, c: "Направление", u: url.category(c), s: [c.title, c.short, c.h1].join(" ").toLowerCase() })));
  fs.writeFileSync(path.join(DIST, "search-index.json"), JSON.stringify(index));

  // sitemap + robots
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${absUrl(r)}</loc><lastmod>${today}</lastmod><priority>${r === "/" ? "1.0" : r.split("/").length > 4 ? "0.6" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(DIST, "robots.txt"), content.config.draftMode
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${absUrl("/sitemap.xml")}\nHost: ${content.config.siteUrl}\n`);

  // report of data the owner still has to provide
  const todo: string[] = [];
  const cfg = content.config;
  if (cfg.siteUrl.includes("example.ru")) todo.push("site.config.json → siteUrl: адрес сайта (домен)");
  if (cfg.brand.name === "Учебный центр") todo.push("site.config.json → brand.name: название учебного центра");
  if (!cfg.legal.organizationName) todo.push("site.config.json → legal: юридические сведения");
  if (!cfg.legal.license) todo.push("site.config.json → legal.license: сведения о лицензии (если есть)");
  if (!cfg.contacts.workHours) todo.push("site.config.json → contacts.workHours: режим работы");
  if (!cfg.contacts.email) todo.push("site.config.json → contacts.email: e-mail");
  for (const k of ["whatsapp", "telegram", "max"] as const) if (!cfg.messengers[k]) todo.push(`site.config.json → messengers.${k}: ссылка или номер`);
  if (!heroSrc) todo.push("public/images/hero.jpg: фото для первого экрана");
  const noPhoto = content.categories.filter((c) => !images.categories[c.slug]).length;
  if (noPhoto) todo.push(`public/images/categories/<адрес>.jpg: фото направлений (нет у ${noPhoto})`);
  const noPrice = content.programs.filter((p) => !p.price).length;
  if (noPrice) todo.push(`content/programs.json: стоимость не указана у ${noPrice} программ (показывается «по запросу»)`);
  if (!content.reviews.length) todo.push("content/reviews.json: реальные отзывы");

  console.log(`✔ Собрано страниц: ${routes.length + 1} за ${Date.now() - t0} мс → dist/`);
  if (!sharp) console.log("⚠ Пакет sharp не найден — фото не оптимизируются (npm install sharp)");
  console.log(`  Черновой режим: ${cfg.draftMode ? "ВКЛ (подсказки видны, индексация запрещена)" : "выкл"}`);
  if (todo.length) console.log("\nНе хватает данных:\n  • " + todo.join("\n  • "));
}

main().catch((e) => { console.error("✖ Ошибка сборки:\n" + (e?.message ?? e)); process.exit(1); });
