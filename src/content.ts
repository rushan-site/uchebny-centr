import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

export type Group = "rabochie" | "bezopasnost" | "dpo";

export interface Phone { display: string; tel: string }
export interface SiteConfig {
  draftMode: boolean;
  siteUrl: string;
  brand: { name: string; fullName: string; tagline: string; logoImage: string };
  contacts: {
    region: string; city: string; street: string; postalCode: string;
    phones: Phone[]; email: string; workHours: string;
    geo: { lat: number | null; lon: number | null };
  };
  messengers: { whatsapp: string; telegram: string; max: string };
  facts: { distanceLearning: string; learningFormats: string; documentsSummary: string; priceInfo: string };
  legal: { organizationName: string; inn: string; ogrn: string; legalAddress: string; license: string; director: string };
  forms: { endpoint: string };
  analytics: { yandexMetrikaId: string };
}
export interface Category {
  slug: string; title: string; group: Group; icon: string; short: string;
  h1: string; seoTitle: string; seoDescription: string; intro: string;
  audience: string[]; documents: string;
  image?: ImageSet | null;
}
export interface Program {
  slug: string; category: string; title: string; description: string; topics: string[];
  hours: string; format: string; price: string; document: string; popular: boolean;
}
export interface Faq { question: string; answer: string; needsConfirmation?: boolean }
export interface Review {
  type: "text" | "photo" | "video" | "organization";
  author: string; role?: string; text?: string; image?: string; video?: string; date?: string;
}
export interface DocItem { type: string; title: string; text: string; image: string }
export interface ImageSet { src: string; webp: string; srcset: string; width: number; height: number }

export const GROUPS: Record<Group, { title: string; short: string }> = {
  rabochie: { title: "Рабочие профессии", short: "Рабочие профессии" },
  bezopasnost: { title: "Охрана труда и безопасность", short: "Безопасность" },
  dpo: { title: "Переподготовка и повышение квалификации", short: "Переподготовка и ПК" },
};

function readJson<T>(name: string): T {
  const file = path.join(ROOT, name);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch (e) {
    throw new Error(`Ошибка в файле ${name}: ${(e as Error).message}`);
  }
}

export function loadContent() {
  const config = readJson<SiteConfig>("site.config.json");
  const categories = readJson<Category[]>("content/categories.json");
  const programs = readJson<Program[]>("content/programs.json");
  const faq = readJson<Faq[]>("content/faq.json");
  const reviews = readJson<Review[]>("content/reviews.json");
  const documents = readJson<DocItem[]>("content/documents.json");

  // Validation — fail fast with understandable messages
  const errors: string[] = [];
  const slugRe = /^[a-z0-9-]+$/;
  const catSlugs = new Set<string>();
  for (const c of categories) {
    if (!slugRe.test(c.slug)) errors.push(`Направление «${c.title}»: адрес (slug) может содержать только латиницу, цифры и дефис`);
    if (catSlugs.has(c.slug)) errors.push(`Повторяется адрес направления: ${c.slug}`);
    catSlugs.add(c.slug);
    if (!GROUPS[c.group]) errors.push(`Направление «${c.title}»: неизвестная группа ${c.group}`);
    c.audience ??= [];
  }
  const progKeys = new Set<string>();
  for (const p of programs) {
    if (!slugRe.test(p.slug)) errors.push(`Программа «${p.title}»: адрес (slug) может содержать только латиницу, цифры и дефис`);
    if (!catSlugs.has(p.category)) errors.push(`Программа «${p.title}»: нет направления ${p.category}`);
    const key = `${p.category}/${p.slug}`;
    if (progKeys.has(key)) errors.push(`Повторяется адрес программы: ${key}`);
    progKeys.add(key);
    p.topics ??= [];
  }
  if (errors.length) throw new Error("Найдены ошибки в контенте:\n- " + errors.join("\n- "));

  return { config, categories, programs, faq, reviews, documents };
}

export type Content = ReturnType<typeof loadContent>;
