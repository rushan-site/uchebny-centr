import type { Content, Category, Program, ImageSet } from "./content.js";

export interface Site extends Content {
  images: { hero: ImageSet | null; categories: Record<string, ImageSet | null> };
  assetVersion: string;
}

let current: Site | null = null;
export function setSite(s: Site) { current = s; }
export function site(): Site {
  if (!current) throw new Error("site not initialised");
  return current;
}

export const url = {
  home: "/",
  catalog: "/obuchenie/",
  category: (c: Category | string) => `/obuchenie/${typeof c === "string" ? c : c.slug}/`,
  program: (p: Program) => `/obuchenie/${p.category}/${p.slug}/`,
  worker: "/rabochie-professii/",
  corporate: "/korporativnoe-obuchenie/",
  about: "/o-centre/",
  reviews: "/otzyvy/",
  contacts: "/kontakty/",
  privacy: "/politika-konfidencialnosti/",
  consent: "/soglasie-na-obrabotku-personalnyh-dannyh/",
};

export function absUrl(p: string) {
  return site().config.siteUrl.replace(/\/$/, "") + p;
}

export function catBySlug(slug: string) {
  return site().categories.find((c) => c.slug === slug)!;
}
export function programsOf(slug: string) {
  return site().programs.filter((p) => p.category === slug);
}
export function fullAddress() {
  const c = site().config.contacts;
  return `${c.region}, г. ${c.city}, ${c.street}`;
}
export function messengerLinks() {
  const m = site().config.messengers;
  const norm = (v: string, kind: "wa" | "tg" | "max") => {
    if (!v) return "";
    if (/^https?:\/\//.test(v)) return v;
    if (kind === "wa") return `https://wa.me/${v.replace(/\D/g, "")}`;
    if (kind === "tg") return `https://t.me/${v.replace(/^@/, "")}`;
    return v;
  };
  return [
    { key: "whatsapp", label: "WhatsApp", href: norm(m.whatsapp, "wa") },
    { key: "telegram", label: "Telegram", href: norm(m.telegram, "tg") },
    { key: "max", label: "MAX", href: norm(m.max, "max") },
  ];
}
