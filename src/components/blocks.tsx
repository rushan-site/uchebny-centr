import React from "react";
import { site, url, catBySlug, programsOf, fullAddress } from "../ctx.js";
import type { Category, Program, ImageSet } from "../content.js";
import { GROUPS } from "../content.js";
import { Icon, CategoryArt } from "./Icon.js";
import { LeadForm } from "./LeadForm.js";
import { Draft, Messengers } from "./Layout.js";

export function SectionHead({ eyebrow, title, text, center, light, as = "h2" }: { eyebrow?: string; title: React.ReactNode; text?: React.ReactNode; center?: boolean; light?: boolean; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div className={`section-head${center ? " section-head--center" : ""}${light ? " section-head--light" : ""}`} data-reveal>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <H className="section-title">{title}</H>
      {text && <p className="section-text">{text}</p>}
    </div>
  );
}

export function Picture({ img, alt, className, eager, sizes = "(max-width: 768px) 100vw, 33vw" }: { img: ImageSet; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  return (
    <picture className={className}>
      <source type="image/webp" srcSet={img.srcset} sizes={sizes} />
      <img src={img.src} alt={alt} width={img.width} height={img.height} loading={eager ? "eager" : "lazy"} decoding="async" {...(eager ? { fetchPriority: "high" } : {})} />
    </picture>
  );
}

export function CategoryVisual({ c, eager, sizes }: { c: Category; eager?: boolean; sizes?: string }) {
  const img = site().images.categories[c.slug];
  return img ? <Picture img={img} alt={`${c.title} — обучение`} eager={eager} sizes={sizes} className="cat-photo" /> : <CategoryArt icon={c.icon} group={c.group} title={c.title} />;
}

export function CategoryCard({ c }: { c: Category }) {
  const count = programsOf(c.slug).length;
  return (
    <article className="cat-card" data-reveal data-group={c.group}>
      <div className="cat-card-media"><CategoryVisual c={c} /></div>
      <div className="cat-card-body">
        <div className="cat-card-meta">
          <span className="chip chip--soft">{GROUPS[c.group].short}</span>
          {count > 0 && <span className="cat-count">{count} {plural(count, "программа", "программы", "программ")}</span>}
        </div>
        <h3 className="cat-card-title"><a href={url.category(c)} className="stretched">{c.title}</a></h3>
        <p className="cat-card-text">{c.short}</p>
        <span className="cat-card-more">Смотреть программы <Icon name="arrow" size={18} /></span>
      </div>
    </article>
  );
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function ProgramCard({ p, showCategory = true }: { p: Program; showCategory?: boolean }) {
  const c = catBySlug(p.category);
  const searchText = [p.title, c.title, p.description, ...(p.topics ?? [])].join(" ").toLowerCase();
  return (
    <article className="prog-card" data-program-card data-group={c.group} data-cat={c.slug} data-search={searchText}>
      <div className="prog-card-top">
        <span className="prog-ico"><Icon name={c.icon} size={22} /></span>
        {showCategory && <span className="prog-cat">{c.title}</span>}
      </div>
      <h3 className="prog-title"><a href={url.program(p)} className="stretched">{p.title}</a></h3>
      <p className="prog-text">{p.description}</p>
      <dl className="prog-facts">
        <div><dt>Срок</dt><dd>{p.hours || "уточняется"}</dd></div>
        <div><dt>Формат</dt><dd>{p.format || "уточняется"}</dd></div>
        <div><dt>Стоимость</dt><dd className={p.price ? "price" : undefined}>{p.price || "по запросу"}</dd></div>
      </dl>
      <div className="prog-actions">
        <button type="button" className="btn btn--outline btn--sm" data-open-modal="price" data-program={p.title} data-direction={c.title}>Узнать стоимость</button>
        <span className="link-arrow">Подробнее <Icon name="arrow" size={16} /></span>
      </div>
    </article>
  );
}

export function QuickAnswers() {
  const { config, categories } = site();
  const f = config.facts;
  const items = [
    { icon: "layers", title: `${categories.length} направлений`, text: "Рабочие профессии, безопасность, переподготовка и повышение квалификации", href: url.catalog },
    { icon: "compass", title: "Формат обучения", text: f.distanceLearning || f.learningFormats || "Зависит от программы — подскажем на консультации", href: "#faq" },
    { icon: "doc", title: "Документы", text: f.documentsSummary || "Вид документа зависит от выбранной программы", href: "#documents" },
    { icon: "phone", title: "Стоимость", text: "Назовём по телефону или после заявки", href: `tel:${config.contacts.phones[0].tel}` },
  ];
  return (
    <div className="quick">
      {items.map((it) => (
        <a key={it.title} className="quick-item" href={it.href}>
          <span className="quick-ico"><Icon name={it.icon} size={22} /></span>
          <span><b>{it.title}</b><span>{it.text}</span></span>
        </a>
      ))}
    </div>
  );
}

const WHY = [
  { icon: "layers", title: "Широкий выбор программ", text: "Рабочие профессии, охрана труда, промышленная безопасность, переподготовка и повышение квалификации — в одном месте." },
  { icon: "calendar", title: "Удобный формат обучения", text: "Подбираем вариант обучения с учётом вашего графика и требований программы." },
  { icon: "compass", title: "Помощь в выборе направления", text: "Объясним разницу между программами и подскажем, что подойдёт под вашу цель или требования работодателя." },
  { icon: "building", title: "Обучение сотрудников предприятий", text: "Работаем с организациями: подбираем программы для персонала и обучаем группами." },
  { icon: "user", title: "Индивидуальный подход", text: "Учитываем опыт, образование и задачи каждого слушателя." },
  { icon: "headset", title: "Консультационная поддержка", text: "Отвечаем на вопросы до начала, во время и после обучения." },
];

export function WhyUs() {
  return (
    <section className="section section--light" id="why">
      <div className="container">
        <SectionHead eyebrow="Почему выбирают нас" title="Учебный центр, с которым понятно и спокойно" text="Помогаем пройти путь от выбора программы до получения документов без лишней суеты." />
        <div className="why-grid">
          {WHY.map((w, i) => (
            <div className="why-card" key={w.title} data-reveal style={{ ["--d" as string]: `${i * 60}ms` }}>
              <span className="why-ico"><Icon name={w.icon} size={26} /></span>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Оставляете заявку", text: "Позвоните, напишите в мессенджер или заполните короткую форму на сайте." },
  { title: "Консультация и выбор программы", text: "Уточняем задачу, рассказываем о сроках, формате и стоимости, подбираем программу." },
  { title: "Проходите обучение", text: "Изучаете программу в согласованном формате и проходите итоговую проверку знаний." },
  { title: "Получаете документы", text: "По итогам обучения — документы согласно выбранной программе." },
];

export function Steps({ dark }: { dark?: boolean }) {
  return (
    <section className={`section ${dark ? "section--dark" : ""}`} id="process">
      <div className="container">
        <SectionHead eyebrow="Как проходит обучение" title="Четыре простых шага" light={dark} center />
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li className="step" key={s.title} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
              <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="center-actions">
          <button type="button" className="btn btn--accent btn--lg" data-open-modal="consult">Оставить заявку</button>
        </div>
      </div>
    </section>
  );
}

export function DocumentsBlock() {
  const { documents } = site();
  return (
    <section className="section section--light" id="documents">
      <div className="container">
        <SectionHead eyebrow="Документы об обучении" title="Что вы получите по итогам" text="Вид документа зависит от программы и указывается в её описании и договоре. Уточните его у консультанта до начала обучения." />
        <div className="docs-grid">
          {documents.map((d, i) => (
            <figure className="doc-card" key={d.title} data-reveal style={{ ["--d" as string]: `${i * 70}ms` }}>
              <div className="doc-visual">
                {d.image
                  ? <img src={d.image} alt={`Образец: ${d.title}`} loading="lazy" data-lightbox />
                  : (
                    <div className="doc-placeholder" aria-hidden="true">
                      <span className="doc-seal"><Icon name="doc" size={30} /></span>
                      <span className="doc-type">{d.type}</span>
                      <span className="doc-lines"><i /><i /><i /></span>
                    </div>
                  )}
              </div>
              <figcaption>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
                {!d.image && <Draft>фото реального образца (персональные данные скрыть) — content/documents.json</Draft>}
              </figcaption>
            </figure>
          ))}
        </div>
        <Draft block>подтвердите перечень выдаваемых документов и основания для их выдачи (лицензия на образовательную деятельность). До подтверждения тексты сформулированы без обещаний.</Draft>
      </div>
    </section>
  );
}

export function CorporateBlock({ full }: { full?: boolean }) {
  const items = [
    { icon: "users", title: "Групповое обучение", text: "Обучаем сотрудников группами по согласованному графику." },
    { icon: "layers", title: "Подбор программ", text: "Подбираем программы под должности и требования к персоналу." },
    { icon: "headset", title: "Консультации для работодателей", text: "Помогаем разобраться, какое обучение нужно вашим сотрудникам." },
    { icon: "briefcase", title: "Работа с юрлицами", text: "Договор, документы и обратная связь по каждой группе." },
  ];
  return (
    <section className="section section--navy corp" id="corporate">
      <div className="container corp-grid">
        <div className="corp-copy">
          <div className="eyebrow">Для предприятий и организаций</div>
          {full ? <h2 className="section-title">Как мы работаем с организациями</h2> : <h2 className="section-title">Обучение сотрудников для вашего предприятия</h2>}
          <p className="section-text">Возьмём на себя подбор программ и организацию обучения, чтобы ваши сотрудники получили нужную подготовку без лишней нагрузки на отдел кадров.</p>
          <div className="corp-items">
            {items.map((it) => (
              <div className="corp-item" key={it.title} data-reveal>
                <span className="corp-ico"><Icon name={it.icon} size={22} /></span>
                <div><h3>{it.title}</h3><p>{it.text}</p></div>
              </div>
            ))}
          </div>
          {!full && <div className="hero-actions"><button type="button" className="btn btn--accent btn--lg" data-open-modal="corporate">Обсудить сотрудничество</button><a className="btn btn--ghost-light btn--lg" href={url.corporate}>Подробнее</a></div>}
        </div>
        <div className="corp-form card-glass" data-reveal>
          <h3 className="form-title">Заявка от организации</h3>
          <p className="form-sub">Опишите задачу — подготовим предложение.</p>
          <LeadForm id={full ? "corp-page" : "corp"} formType="corporate" defaultDirection="Корпоративное обучение" extraFields="company" submitLabel="Обсудить сотрудничество" dark commentPlaceholder="Сколько сотрудников, какие профессии или программы нужны, сроки" />
        </div>
      </div>
    </section>
  );
}

export function ReviewsBlock({ limit }: { limit?: number }) {
  const { reviews, config } = site();
  if (!reviews.length && !config.draftMode) return null;
  const list = limit ? reviews.slice(0, limit) : reviews;
  const types = [
    { key: "all", label: "Все" },
    { key: "text", label: "Текстовые" },
    { key: "video", label: "Видео" },
    { key: "photo", label: "Фото" },
    { key: "organization", label: "Организации" },
  ].filter((t) => t.key === "all" || reviews.some((r) => r.type === t.key));
  return (
    <section className="section" id="reviews">
      <div className="container">
        <SectionHead eyebrow="Отзывы" title="Что говорят наши слушатели" text="Публикуем только реальные отзывы слушателей и организаций." />
        {reviews.length === 0 ? (
          <div className="reviews-empty" data-reveal>
            <div className="reviews-empty-ico"><Icon name="quote" size={32} /></div>
            <div>
              <h3>Здесь появятся отзывы слушателей</h3>
              <p>Блок поддерживает текстовые отзывы, фото документов и благодарственных писем, видеоотзывы и отзывы организаций.</p>
              <Draft>добавьте реальные отзывы в content/reviews.json или через админ-панель. Пока отзывов нет, при выключенном черновом режиме блок скрывается автоматически.</Draft>
            </div>
          </div>
        ) : (
          <>
            {types.length > 2 && (
              <div className="tabs" role="tablist" data-review-tabs>
                {types.map((t, i) => <button key={t.key} type="button" role="tab" aria-selected={i === 0} className={`tab${i === 0 ? " is-active" : ""}`} data-filter={t.key}>{t.label}</button>)}
              </div>
            )}
            <div className="reviews-grid">
              {list.map((r, i) => (
                <article className={`review review--${r.type}`} key={i} data-type={r.type} data-reveal>
                  {r.type === "video" && r.video && (
                    <div className="review-video" data-video={r.video}>
                      <button type="button" className="review-play" aria-label={`Смотреть видеоотзыв: ${r.author}`}><Icon name="play" size={28} /></button>
                    </div>
                  )}
                  {(r.type === "photo" || r.type === "organization") && r.image && (
                    <button type="button" className="review-photo" data-lightbox-src={r.image} aria-label="Увеличить фото"><img src={r.image} alt={`Отзыв: ${r.author}`} loading="lazy" /></button>
                  )}
                  {r.text && <p className="review-text">{r.text}</p>}
                  <footer className="review-author">
                    <span className="review-avatar" aria-hidden="true">{(r.author || "?").slice(0, 1)}</span>
                    <span><b>{r.author}</b>{r.role && <span>{r.role}</span>}{r.date && <time>{r.date}</time>}</span>
                  </footer>
                </article>
              ))}
            </div>
            {limit && reviews.length > limit && <div className="center-actions"><a className="btn btn--outline" href={url.reviews}>Все отзывы</a></div>}
          </>
        )}
      </div>
    </section>
  );
}

export function FaqBlock({ items, title = "Частые вопросы" }: { items?: { question: string; answer: string; needsConfirmation?: boolean }[]; title?: string }) {
  const faq = items ?? site().faq;
  return (
    <section className="section section--light" id="faq">
      <div className="container faq-grid">
        <div>
          <SectionHead eyebrow="FAQ" title={title} text="Не нашли ответ? Позвоните или оставьте заявку — проконсультируем." />
          <div className="faq-contact" data-reveal>
            {site().config.contacts.phones.map((p) => <a key={p.tel} className="phone-big" href={`tel:${p.tel}`}><Icon name="phone" size={20} />{p.display}</a>)}
            <button type="button" className="btn btn--accent" data-open-modal="consult">Задать вопрос</button>
          </div>
        </div>
        <div className="faq-list">
          {faq.map((q, i) => (
            <details className="faq-item" key={q.question} data-reveal open={i === 0}>
              <summary><span>{q.question}</span><span className="faq-toggle" aria-hidden="true"><Icon name="plus" size={20} /></span></summary>
              <div className="faq-answer">
                <p>{q.answer}</p>
                {q.needsConfirmation && <Draft>проверьте и уточните ответ — content/faq.json</Draft>}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.answer } })),
  };
}

export function LeadSection({ id = "lead", defaultDirection, defaultProgram, title = "Не знаете, какую программу выбрать?", text = "Оставьте заявку — поможем подобрать подходящее обучение." }: { id?: string; defaultDirection?: string; defaultProgram?: string; title?: string; text?: string }) {
  const { config } = site();
  return (
    <section className="section lead-section" id="zayavka">
      <div className="container lead-grid">
        <div className="lead-copy" data-reveal>
          <div className="eyebrow">Заявка на консультацию</div>
          <h2 className="section-title">{title}</h2>
          <p className="section-text">{text}</p>
          <ul className="ticks">
            <li><Icon name="check" size={18} strokeWidth={2.4} />Перезвоним и ответим на вопросы</li>
            <li><Icon name="check" size={18} strokeWidth={2.4} />Подберём программу под вашу цель</li>
            <li><Icon name="check" size={18} strokeWidth={2.4} />Расскажем о сроках, формате и стоимости</li>
          </ul>
          <div className="lead-phones">
            <span>Или позвоните сами:</span>
            {config.contacts.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="phone-big" data-goal="phone_click"><Icon name="phone" size={20} />{p.display}</a>)}
          </div>
        </div>
        <div className="lead-card" data-reveal>
          <LeadForm id={id} formType="consult" defaultDirection={defaultDirection} defaultProgram={defaultProgram} />
        </div>
      </div>
    </section>
  );
}

export function MapEmbed() {
  const { config } = site();
  const c = config.contacts;
  const q = encodeURIComponent(`${c.region}, ${c.city}, ${c.street}`);
  const src = c.geo.lat && c.geo.lon
    ? `https://yandex.ru/map-widget/v1/?ll=${c.geo.lon}%2C${c.geo.lat}&z=16&pt=${c.geo.lon}%2C${c.geo.lat}%2Cpm2rdm`
    : `https://yandex.ru/map-widget/v1/?text=${q}&z=16`;
  return (
    <div className="map" data-map data-src={src}>
      <div className="map-placeholder">
        <Icon name="pin" size={36} />
        <b>{fullAddress()}</b>
        <button type="button" className="btn btn--outline btn--sm" data-map-load>Показать карту</button>
        <a className="link-arrow" href={`https://yandex.ru/maps/?text=${q}`} target="_blank" rel="noopener">Открыть в Яндекс Картах <Icon name="arrow" size={16} /></a>
      </div>
    </div>
  );
}

export function ContactsBlock({ h1 }: { h1?: boolean }) {
  const { config } = site();
  const c = config.contacts;
  return (
    <section className="section" id="contacts">
      <div className="container contacts-grid">
        <div className="contacts-card" data-reveal>
          <SectionHead eyebrow="Контакты" title="Приходите или звоните" as={h1 ? "h1" : "h2"} />
          <div className="contact-rows">
            <div className="contact-row"><span className="contact-ico"><Icon name="pin" size={22} /></span><div><span className="contact-label">Адрес</span><b>{c.region},<br />г. {c.city}, {c.street}</b></div></div>
            <div className="contact-row"><span className="contact-ico"><Icon name="phone" size={22} /></span><div><span className="contact-label">Телефоны</span>{c.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className="contact-phone" data-goal="phone_click">{p.display}</a>)}</div></div>
            {c.email && <div className="contact-row"><span className="contact-ico"><Icon name="mail" size={22} /></span><div><span className="contact-label">E-mail</span><a href={`mailto:${c.email}`}>{c.email}</a></div></div>}
            <div className="contact-row"><span className="contact-ico"><Icon name="clock" size={22} /></span><div><span className="contact-label">Режим работы</span>{c.workHours ? <b>{c.workHours}</b> : <><b>Уточняйте по телефону</b><Draft>режим работы — site.config.json → contacts.workHours</Draft></>}</div></div>
          </div>
          <div className="contact-actions">
            {c.phones.map((p, i) => <a key={p.tel} className={`btn ${i === 0 ? "btn--accent" : "btn--outline"}`} href={`tel:${p.tel}`}><Icon name="phone" size={18} />Позвонить{c.phones.length > 1 ? ` ${i + 1}` : ""}</a>)}
          </div>
          <Messengers />
          {!c.geo.lat && <Draft>координаты для точной метки на карте — site.config.json → contacts.geo (lat, lon)</Draft>}
        </div>
        <div className="contacts-map" data-reveal><MapEmbed /></div>
      </div>
      <div className="container">
        <div className="contacts-form" data-reveal>
          <div>
            <h2 className="h3">Форма обратной связи</h2>
            <p className="muted">Напишите вопрос — ответим по телефону.</p>
          </div>
          <LeadForm id={h1 ? "contacts-page" : "contacts"} formType="feedback" submitLabel="Отправить сообщение" commentPlaceholder="Ваш вопрос" />
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <section className="cta-band">
      <div className="container cta-band-inner" data-reveal>
        <div><h2 className="h2">{title}</h2><p>{text}</p></div>
        <div className="cta-band-actions">
          <button type="button" className="btn btn--accent btn--lg" data-open-modal="consult">Подобрать обучение</button>
          <button type="button" className="btn btn--ghost-light btn--lg" data-open-modal="callback">Заказать звонок</button>
        </div>
      </div>
    </section>
  );
}

export const RETRAINING_BENEFITS = [
  { icon: "compass", title: "Новая сфера деятельности", text: "Возможность работать в новой области, не начиная обучение с нуля." },
  { icon: "briefcase", title: "Соответствие должности", text: "Помогает выполнить требования к квалификации работника на новой должности." },
  { icon: "calendar", title: "Учёба вместе с работой", text: "Формат подбирается с учётом вашей занятости." },
  { icon: "growth", title: "Развитие карьеры", text: "Новые компетенции — больше возможностей для роста." },
];

export const RETRAINING_STEPS = [
  { title: "Консультация", text: "Обсуждаем цель и подходящее направление." },
  { title: "Проверка требований", text: "Программы профессиональной переподготовки осваивают лица со средним профессиональным или высшим образованием, а также получающие такое образование." },
  { title: "Документы и договор", text: "Готовим пакет документов и заключаем договор." },
  { title: "Обучение и итоговая аттестация", text: "Осваиваете программу и проходите итоговую аттестацию." },
  { title: "Получение документа", text: "Получаете документ, предусмотренный программой и договором." },
];

export function RetrainingBlock({ compact }: { compact?: boolean }) {
  const progs = programsOf("perepodgotovka");
  return (
    <section className="section section--dark retrain" id="perepodgotovka">
      <div className="container">
        <div className="retrain-head">
          <SectionHead eyebrow="Профессиональная переподготовка" title="Дополнительная профессиональная квалификация" text="Освойте новую сферу деятельности на базе имеющегося образования." light />
          <a className="btn btn--ghost-light" href={url.category("perepodgotovka")}>Все о переподготовке <Icon name="arrow" size={18} /></a>
        </div>
        <div className="retrain-list">
          {progs.map((p, i) => (
            <a key={p.slug} href={url.program(p)} className="retrain-item" data-reveal style={{ ["--d" as string]: `${i * 50}ms` }}>
              <span className="retrain-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="retrain-name">{p.title}</span>
              <Icon name="arrow" size={20} />
            </a>
          ))}
        </div>
        {!compact && <RetrainingDetails />}
      </div>
    </section>
  );
}

export function RetrainingDetails() {
  const cat = catBySlug("perepodgotovka");
  return (
    <div className="retrain-details">
      <div className="retrain-col" data-reveal>
        <h3 className="h3">Преимущества</h3>
        <div className="mini-grid">
          {RETRAINING_BENEFITS.map((b) => (
            <div className="mini" key={b.title}><Icon name={b.icon} size={22} /><div><b>{b.title}</b><p>{b.text}</p></div></div>
          ))}
        </div>
      </div>
      <div className="retrain-col" data-reveal>
        <h3 className="h3">Порядок поступления</h3>
        <ol className="timeline">
          {RETRAINING_STEPS.map((s) => <li key={s.title}><b>{s.title}</b><p>{s.text}</p></li>)}
        </ol>
      </div>
      <div className="retrain-col retrain-docs" data-reveal>
        <h3 className="h3">Документы</h3>
        <p>{cat.documents || "Вид выдаваемого документа указывается в описании программы и в договоре. Документы о квалификации выдаются в соответствии с требованиями законодательства об образовании."}</p>
        {!cat.documents && <Draft>укажите вид документа по переподготовке и сведения о лицензии после проверки — content/categories.json → perepodgotovka.documents</Draft>}
        <button type="button" className="btn btn--accent" data-open-modal="consult" data-direction="Профессиональная переподготовка">Узнать условия поступления</button>
      </div>
    </div>
  );
}
