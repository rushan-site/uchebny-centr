import React from "react";
import { site, url, absUrl, fullAddress, messengerLinks } from "../ctx.js";
import { GROUPS } from "../content.js";
import { Icon } from "./Icon.js";
import { LeadForm } from "./LeadForm.js";

export function Draft({ children, block }: { children: React.ReactNode; block?: boolean }) {
  if (!site().config.draftMode) return null;
  return block
    ? <div className="draft-note draft-note--block"><b>Нужно заполнить:</b> {children}</div>
    : <span className="draft-note"><b>Нужно заполнить:</b> {children}</span>;
}

export function Logo({ light }: { light?: boolean }) {
  const { brand } = site().config;
  return (
    <a href={url.home} className={`logo${light ? " logo--light" : ""}`} aria-label={`${brand.name} — на главную`}>
      {brand.logoImage
        ? <img src={brand.logoImage} alt={brand.name} height={44} />
        : (
          <>
            <svg className="logo-mark" viewBox="0 0 44 44" aria-hidden="true">
              <defs>
                <linearGradient id="lg-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc56b" /><stop offset="1" stopColor="#ee8618" /></linearGradient>
              </defs>
              <path d="M22 2 39.3 12v20L22 42 4.7 32V12z" fill="#13284c" stroke="url(#lg-a)" strokeWidth="2" />
              <path d="M12 20l10-5 10 5-10 5z" fill="url(#lg-a)" />
              <path d="M16 22.5v5c3.5 2.6 8.5 2.6 12 0v-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="logo-text">
              <span className="logo-name">{brand.name}</span>
              <span className="logo-tag">{brand.tagline}</span>
            </span>
          </>
        )}
    </a>
  );
}

function PhoneLinks({ className }: { className?: string }) {
  return (
    <div className={className ?? "phones"}>
      {site().config.contacts.phones.map((p) => (
        <a key={p.tel} href={`tel:${p.tel}`} className="phone-link" data-goal="phone_click">{p.display}</a>
      ))}
    </div>
  );
}

export function Messengers({ variant = "chips" }: { variant?: "chips" | "icons" }) {
  const links = messengerLinks();
  const draft = site().config.draftMode;
  return (
    <div className={`messengers messengers--${variant}`}>
      {links.map((m) => m.href
        ? <a key={m.key} href={m.href} className={`msg msg--${m.key}`} target="_blank" rel="noopener" aria-label={`Написать в ${m.label}`} data-goal="messenger_click"><Icon name={m.key} size={18} /><span>{m.label}</span></a>
        : draft ? <span key={m.key} className={`msg msg--${m.key} msg--empty`} title={`Добавьте ссылку ${m.label} в site.config.json → messengers.${m.key}`}><Icon name={m.key} size={18} /><span>{m.label}</span></span> : null)}
    </div>
  );
}

const NAV = () => [
  { href: url.home, label: "Главная" },
  { href: url.catalog, label: "Направления", mega: true },
  { href: url.worker, label: "Рабочие профессии" },
  { href: url.category("perepodgotovka"), label: "Переподготовка" },
  { href: url.category("povyshenie-kvalifikacii"), label: "Повышение квалификации" },
  { href: url.about, label: "О центре" },
  { href: url.contacts, label: "Контакты" },
];

function MegaMenu() {
  const { categories } = site();
  return (
    <div className="mega" id="mega-menu" role="region" aria-label="Все направления обучения">
      <div className="container mega-inner">
        {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
          <div key={g} className="mega-col">
            <div className="mega-title">{GROUPS[g].title}</div>
            <ul>
              {categories.filter((c) => c.group === g).map((c) => (
                <li key={c.slug}><a href={url.category(c)}><span className="mega-ico"><Icon name={c.icon} size={20} /></span>{c.title}</a></li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mega-cta">
          <div className="mega-cta-title">Не нашли свою профессию?</div>
          <p>Расскажите, какая квалификация нужна, — подскажем подходящую программу.</p>
          <button type="button" className="btn btn--accent" data-open-modal="consult">Подобрать обучение</button>
          <a className="link-arrow" href={url.catalog}>Все программы <Icon name="arrow" size={18} /></a>
        </div>
      </div>
    </div>
  );
}

function Header({ path }: { path: string }) {
  const { config } = site();
  const isActive = (href: string) => href === "/" ? path === "/" : path.startsWith(href);
  return (
    <header className="site-header" data-header>
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="topbar-addr"><Icon name="pin" size={16} />{config.contacts.city}, {config.contacts.street}</span>
          {config.contacts.workHours && <span className="topbar-hours"><Icon name="clock" size={16} />{config.contacts.workHours}</span>}
          <span className="topbar-spacer" />
          <Messengers variant="icons" />
          <PhoneLinks className="phones phones--top" />
        </div>
      </div>
      <div className="mainbar">
        <div className="container mainbar-inner">
          <Logo />
          <nav className="nav" aria-label="Основное меню">
            <ul>
              {NAV().map((n) => (
                <li key={n.href} className={n.mega ? "has-mega" : undefined}>
                  {n.mega
                    ? <a href={n.href} className={isActive(n.href) && !path.startsWith(url.category("perepodgotovka")) && !path.startsWith(url.category("povyshenie-kvalifikacii")) ? "is-active" : undefined} aria-haspopup="true" aria-expanded="false" aria-controls="mega-menu" data-mega-trigger>{n.label}<Icon name="chevron" size={16} /></a>
                    : <a href={n.href} className={isActive(n.href) ? "is-active" : undefined}>{n.label}</a>}
                </li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            <button type="button" className="icon-btn" data-search-open aria-label="Поиск программ"><Icon name="search" size={22} /></button>
            <a className="icon-btn icon-btn--phone" href={`tel:${config.contacts.phones[0].tel}`} aria-label={`Позвонить ${config.contacts.phones[0].display}`}><Icon name="phone" size={21} /></a>
            <button type="button" className="btn btn--accent header-cta" data-open-modal="consult">Оставить заявку</button>
            <button type="button" className="icon-btn burger" data-menu-open aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-menu"><Icon name="menu" size={24} /></button>
          </div>
        </div>
        <MegaMenu />
      </div>
    </header>
  );
}

function MobileMenu() {
  const { categories, config } = site();
  return (
    <div className="drawer" id="mobile-menu" data-drawer hidden>
      <div className="drawer-backdrop" data-menu-close />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Меню">
        <div className="drawer-head">
          <Logo />
          <button type="button" className="icon-btn" data-menu-close aria-label="Закрыть меню"><Icon name="close" size={24} /></button>
        </div>
        <button type="button" className="drawer-search" data-search-open><Icon name="search" size={20} />Найти программу</button>
        <nav aria-label="Мобильное меню">
          <ul className="drawer-nav">
            {NAV().filter((n) => !n.mega).map((n) => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}
            <li>
              <details>
                <summary>Все направления<Icon name="chevron" size={18} /></summary>
                <ul>
                  <li><a href={url.catalog}>Каталог всех программ</a></li>
                  {categories.map((c) => <li key={c.slug}><a href={url.category(c)}>{c.title}</a></li>)}
                </ul>
              </details>
            </li>
            <li><a href={url.corporate}>Корпоративное обучение</a></li>
          </ul>
        </nav>
        <div className="drawer-contacts">
          {config.contacts.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="drawer-phone"><Icon name="phone" size={18} />{p.display}</a>)}
          <Messengers />
          <button type="button" className="btn btn--accent btn--block" data-open-modal="consult">Оставить заявку</button>
        </div>
      </div>
    </div>
  );
}

function SearchOverlay() {
  return (
    <div className="search-overlay" data-search-overlay hidden>
      <div className="search-backdrop" data-search-close />
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Поиск программ">
        <form className="search-field" action={url.catalog} method="get" role="search">
          <Icon name="search" size={22} />
          <input type="search" name="q" placeholder="Например: стропальщик, охрана труда, бухгалтер" autoComplete="off" aria-label="Поиск по программам" data-search-input />
          <button type="button" className="icon-btn" data-search-close aria-label="Закрыть поиск"><Icon name="close" size={22} /></button>
        </form>
        <div className="search-results" data-search-results aria-live="polite" />
      </div>
    </div>
  );
}

const MODAL_TITLES = {
  consult: ["Получить консультацию", "Оставьте контакты — перезвоним, ответим на вопросы и поможем выбрать программу."],
  callback: ["Заказать обратный звонок", "Укажите имя и телефон — мы перезвоним."],
  price: ["Узнать стоимость", "Оставьте контакты — назовём стоимость и условия обучения по выбранной программе."],
  corporate: ["Обсудить сотрудничество", "Расскажите о задачах обучения сотрудников — подготовим предложение."],
};

function Modal() {
  return (
    <div className="modal" data-modal hidden>
      <div className="modal-backdrop" data-modal-close />
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" className="icon-btn modal-close" data-modal-close aria-label="Закрыть"><Icon name="close" size={22} /></button>
        <div className="modal-head">
          <div className="eyebrow">Заявка</div>
          <h2 id="modal-title" className="modal-title" data-modal-title>Получить консультацию</h2>
          <p className="modal-sub" data-modal-sub>{MODAL_TITLES.consult[1]}</p>
          <p className="modal-program" data-modal-program hidden />
        </div>
        <LeadForm id="modal" formType="consult" />
      </div>
      <script type="application/json" id="modal-texts" dangerouslySetInnerHTML={{ __html: JSON.stringify(MODAL_TITLES) }} />
    </div>
  );
}

function MobileBar() {
  const { config } = site();
  const wa = messengerLinks().find((m) => m.href);
  return (
    <div className="mobile-bar">
      <a href={`tel:${config.contacts.phones[0].tel}`} className="mobile-bar-btn" data-goal="phone_click"><Icon name="phone" size={20} /><span>Позвонить</span></a>
      {wa && <a href={wa.href} className="mobile-bar-btn" target="_blank" rel="noopener"><Icon name={wa.key} size={20} /><span>{wa.label}</span></a>}
      <button type="button" className="mobile-bar-btn mobile-bar-btn--accent" data-open-modal="consult"><Icon name="chat" size={20} /><span>Заявка</span></button>
    </div>
  );
}

function Footer() {
  const { config, categories } = site();
  const l = config.legal;
  const hasLegal = Object.values(l).some(Boolean);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p className="footer-about">Профессиональное обучение, переподготовка и повышение квалификации в Республике Башкортостан.</p>
          <Messengers />
        </div>
        <div>
          <div className="footer-title">Разделы</div>
          <ul className="footer-links">
            <li><a href={url.home}>Главная</a></li>
            <li><a href={url.catalog}>Все направления</a></li>
            <li><a href={url.worker}>Рабочие профессии</a></li>
            <li><a href={url.corporate}>Корпоративное обучение</a></li>
            <li><a href={url.about}>О центре</a></li>
            {(site().reviews.length > 0 || config.draftMode) && <li><a href={url.reviews}>Отзывы</a></li>}
            <li><a href={url.contacts}>Контакты</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-title">Направления обучения</div>
          <ul className="footer-links footer-links--cols">
            {categories.map((c) => <li key={c.slug}><a href={url.category(c)}>{c.title}</a></li>)}
          </ul>
        </div>
        <div>
          <div className="footer-title">Контакты</div>
          <address className="footer-contacts">
            <span><Icon name="pin" size={18} />{fullAddress()}</span>
            {config.contacts.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`}><Icon name="phone" size={18} />{p.display}</a>)}
            {config.contacts.email && <a href={`mailto:${config.contacts.email}`}><Icon name="mail" size={18} />{config.contacts.email}</a>}
            {config.contacts.workHours && <span><Icon name="clock" size={18} />{config.contacts.workHours}</span>}
          </address>
          <button type="button" className="btn btn--ghost-light" data-open-modal="callback">Заказать обратный звонок</button>
        </div>
      </div>
      <div className="container footer-legal">
        {hasLegal ? (
          <div className="legal-lines">
            {l.organizationName && <span>{l.organizationName}</span>}
            {l.inn && <span>ИНН {l.inn}</span>}
            {l.ogrn && <span>ОГРН {l.ogrn}</span>}
            {l.legalAddress && <span>Юридический адрес: {l.legalAddress}</span>}
            {l.license && <span>{l.license}</span>}
          </div>
        ) : <Draft>юридические сведения (наименование, ИНН, ОГРН, адрес, сведения о лицензии) — site.config.json → legal</Draft>}
      </div>
      <div className="container footer-bottom">
        <span>© <span data-year>{new Date().getFullYear()}</span> {config.legal.organizationName || config.brand.name}</span>
        <span className="footer-policy">
          <a href={url.privacy}>Политика конфиденциальности</a>
          <a href={url.consent}>Согласие на обработку персональных данных</a>
        </span>
      </div>
    </footer>
  );
}

export interface Crumb { name: string; href: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Навигационная цепочка">
      <ol>
        {items.map((c, i) => (
          <li key={c.href}>{i < items.length - 1 ? <a href={c.href}>{c.name}</a> : <span aria-current="page">{c.name}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absUrl(c.href) })),
  };
}

export function orgLd() {
  const { config } = site();
  const c = config.contacts;
  const o: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: config.legal.organizationName || config.brand.name,
    url: absUrl("/"),
    telephone: c.phones.map((p) => p.tel),
    address: {
      "@type": "PostalAddress",
      addressCountry: "RU",
      addressRegion: c.region,
      addressLocality: c.city,
      streetAddress: c.street,
      ...(c.postalCode ? { postalCode: c.postalCode } : {}),
    },
    areaServed: "Республика Башкортостан",
  };
  if (c.email) o.email = c.email;
  if (c.geo.lat && c.geo.lon) o.geo = { "@type": "GeoCoordinates", latitude: c.geo.lat, longitude: c.geo.lon };
  return o;
}

interface LayoutProps {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
  jsonLd?: object[];
  noindex?: boolean;
  ogImage?: string;
  bodyClass?: string;
}

export function Layout({ title, description, path, children, jsonLd = [], noindex, bodyClass }: LayoutProps) {
  const { config, assetVersion } = site();
  const canonical = absUrl(path);
  const metrika = config.analytics.yandexMetrikaId;
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {(noindex || config.draftMode) && <meta name="robots" content="noindex, nofollow" />}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content={config.brand.name} />
        <meta name="theme-color" content="#0d1424" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap" />
        <link rel="stylesheet" href={`/css/styles.css?v=${assetVersion}`} />
        {jsonLd.map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />)}
        <script dangerouslySetInnerHTML={{ __html: `window.SITE=${JSON.stringify({ endpoint: config.forms.endpoint, metrika: metrika || null, phones: config.contacts.phones })};` }} />
        <script src={`/js/app.js?v=${assetVersion}`} defer />
      </head>
      <body className={bodyClass}>
        <a className="skip-link" href="#main">Перейти к содержанию</a>
        {config.draftMode && (
          <div className="draft-banner">Черновой режим: на сайте показаны подсказки о том, какие данные нужно добавить. Перед публикацией заполните их и выключите <code>draftMode</code> в site.config.json.</div>
        )}
        <Header path={path} />
        <MobileMenu />
        <main id="main">{children}</main>
        <Footer />
        <MobileBar />
        <Modal />
        <SearchOverlay />
        {metrika && (
          <script dangerouslySetInnerHTML={{ __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${Number(metrika)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});` }} />
        )}
      </body>
    </html>
  );
}
