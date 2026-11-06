import React from "react";
import { site, url, absUrl, catBySlug, programsOf, fullAddress } from "../ctx.js";
import type { Category, Program } from "../content.js";
import { GROUPS } from "../content.js";
import { Layout, Breadcrumbs, breadcrumbLd, orgLd, Draft, type Crumb } from "../components/Layout.js";
import { Icon } from "../components/Icon.js";
import {
  CategoryCard, ProgramCard, Steps, DocumentsBlock, CorporateBlock, ReviewsBlock, FaqBlock, faqLd,
  LeadSection, ContactsBlock, SectionHead, CategoryVisual, RetrainingDetails, WhyUs, CtaBand, plural,
} from "../components/blocks.js";
import { LeadForm } from "../components/LeadForm.js";

const HOME: Crumb = { name: "Главная", href: "/" };
const brand = () => site().config.brand.name;

function PageHero({ crumbs, title, text, children, aside }: { crumbs: Crumb[]; title: string; text?: React.ReactNode; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="page-hero">
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className={`container page-hero-inner${aside ? " page-hero-inner--aside" : ""}`}>
        <div>
          <Breadcrumbs items={crumbs} />
          <h1 className="page-title">{title}</h1>
          {text && <p className="page-lead">{text}</p>}
          {children}
        </div>
        {aside && <div className="page-hero-aside">{aside}</div>}
      </div>
    </section>
  );
}

/* ---------------- Catalog ---------------- */
export function CatalogPage() {
  const { programs, categories } = site();
  const crumbs = [HOME, { name: "Направления обучения", href: url.catalog }];
  return (
    <Layout path={url.catalog} title={`Каталог программ обучения в Янауле — все направления | ${brand()}`}
      description="Все программы учебного центра в Янауле: рабочие профессии, спецтехника, охрана труда, промышленная безопасность, переподготовка и повышение квалификации. Поиск и фильтр."
      jsonLd={[breadcrumbLd(crumbs)]}>
      <PageHero crumbs={crumbs} title="Направления и программы обучения" text="Найдите программу по названию профессии или выберите направление. Если не уверены в выборе — оставьте заявку, и мы подскажем." />
      <section className="section section--tight">
        <div className="container catalog" data-catalog>
          <aside className="catalog-side">
            <div className="catalog-search">
              <label htmlFor="catalog-q" className="sr-only">Поиск по программам</label>
              <Icon name="search" size={20} />
              <input id="catalog-q" type="search" placeholder="Поиск: профессия или программа" data-catalog-q autoComplete="off" />
            </div>
            <div className="filter-block">
              <div className="filter-title"><Icon name="filter" size={18} />Группы</div>
              <div className="chips" data-catalog-groups>
                <button type="button" className="chip is-active" data-group="">Все</button>
                {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => <button key={g} type="button" className="chip" data-group={g}>{GROUPS[g].short}</button>)}
              </div>
            </div>
            <div className="filter-block">
              <div className="filter-title"><Icon name="layers" size={18} />Направления</div>
              <ul className="filter-list" data-catalog-cats>
                <li><button type="button" className="is-active" data-cat="">Все направления <span>{programs.length}</span></button></li>
                {categories.map((c) => <li key={c.slug} data-group={c.group}><button type="button" data-cat={c.slug}>{c.title} <span>{programsOf(c.slug).length}</span></button></li>)}
              </ul>
            </div>
            <div className="side-cta">
              <b>Нужна помощь с выбором?</b>
              <p>Позвоните или оставьте заявку.</p>
              <button type="button" className="btn btn--accent btn--block" data-open-modal="consult">Подобрать программу</button>
            </div>
          </aside>
          <div className="catalog-main">
            <div className="catalog-bar">
              <span data-catalog-count>Найдено программ: {programs.length}</span>
              <button type="button" className="link-btn" data-catalog-reset hidden>Сбросить фильтры</button>
            </div>
            <div className="prog-grid" data-catalog-grid>
              {programs.map((p) => <ProgramCard key={`${p.category}/${p.slug}`} p={p} />)}
            </div>
            <div className="catalog-empty" data-catalog-empty hidden>
              <Icon name="search" size={34} />
              <h2 className="h3">Ничего не нашли</h2>
              <p>Возможно, нужная программа есть, но ещё не добавлена на сайт. Оставьте заявку — проверим и перезвоним.</p>
              <button type="button" className="btn btn--accent" data-open-modal="consult">Оставить заявку</button>
            </div>
          </div>
        </div>
      </section>
      <LeadSection id="catalog-lead" />
    </Layout>
  );
}

/* ---------------- Category ---------------- */
export function CategoryPage({ c }: { c: Category }) {
  const progs = programsOf(c.slug);
  const crumbs = [HOME, { name: "Направления", href: url.catalog }, { name: c.title, href: url.category(c) }];
  const related = site().categories.filter((x) => x.slug !== c.slug && x.group === c.group).slice(0, 3);
  const more = related.length < 3 ? site().categories.filter((x) => x.slug !== c.slug && x.group !== c.group).slice(0, 3 - related.length) : [];
  const isRetrain = c.slug === "perepodgotovka";
  const ld: object[] = [breadcrumbLd(crumbs), {
    "@context": "https://schema.org", "@type": "ItemList", name: c.h1,
    itemListElement: progs.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absUrl(url.program(p)), name: p.title })),
  }];
  return (
    <Layout path={url.category(c)} title={`${c.seoTitle} | ${brand()}`} description={c.seoDescription} jsonLd={ld}>
      <PageHero crumbs={crumbs} title={c.h1} text={c.intro}
        aside={<div className="page-hero-media"><CategoryVisual c={c} eager sizes="(max-width: 960px) 100vw, 40vw" /></div>}>
        <div className="hero-actions">
          <button type="button" className="btn btn--accent btn--lg" data-open-modal="consult" data-direction={c.title}>Подобрать программу</button>
          <button type="button" className="btn btn--ghost-light btn--lg" data-open-modal="price" data-direction={c.title}>Узнать стоимость</button>
        </div>
        {progs.length > 0 && <p className="page-hero-meta">{progs.length} {plural(progs.length, "программа", "программы", "программ")} в направлении</p>}
      </PageHero>

      <section className="section section--tight" id="programs">
        <div className="container">
          <div className="section-head-row">
            <SectionHead eyebrow="Программы" title={`Программы: ${c.title.toLowerCase()}`} />
            {progs.length > 6 && (
              <div className="catalog-search catalog-search--inline">
                <Icon name="search" size={20} />
                <input type="search" placeholder="Найти программу" aria-label="Найти программу в направлении" data-local-q />
              </div>
            )}
          </div>
          <Draft block>перечень программ, сроки, формат и стоимость — проверьте и дополните в content/programs.json или через админ-панель. Пустые поля показываются как «уточняется» и «по запросу».</Draft>
          {progs.length ? (
            <div className="prog-grid" data-local-grid>{progs.map((p) => <ProgramCard key={p.slug} p={p} showCategory={false} />)}</div>
          ) : (
            <div className="catalog-empty"><p>Программы этого направления скоро появятся на сайте. Позвоните или оставьте заявку — расскажем о доступных вариантах.</p></div>
          )}
        </div>
      </section>

      {isRetrain ? (
        <section className="section section--dark retrain">
          <div className="container">
            <SectionHead eyebrow="Как устроена переподготовка" title="Преимущества, поступление и документы" light />
            <RetrainingDetails />
          </div>
        </section>
      ) : (
        <section className="section section--light">
          <div className="container info-grid">
            <div className="info-card" data-reveal>
              <span className="why-ico"><Icon name="users" size={26} /></span>
              <h2 className="h3">Кому подходит</h2>
              <ul className="ticks ticks--dark">{c.audience.map((a) => <li key={a}><Icon name="check" size={18} strokeWidth={2.4} />{a}</li>)}</ul>
            </div>
            <div className="info-card" data-reveal>
              <span className="why-ico"><Icon name="doc" size={26} /></span>
              <h2 className="h3">Документы</h2>
              <p>{c.documents || "Вид документа зависит от выбранной программы. Консультант сообщит его до начала обучения."}</p>
              {!c.documents && <Draft>вид документа для этого направления — content/categories.json → documents</Draft>}
            </div>
            <div className="info-card" data-reveal>
              <span className="why-ico"><Icon name="phone" size={26} /></span>
              <h2 className="h3">Стоимость</h2>
              <p>{site().config.facts.priceInfo}</p>
              <button type="button" className="btn btn--outline btn--sm" data-open-modal="price" data-direction={c.title}>Узнать стоимость</button>
            </div>
          </div>
        </section>
      )}

      <Steps />
      <LeadSection id={`lead-${c.slug}`} defaultDirection={c.title} title={`Поможем выбрать программу: ${c.title.toLowerCase()}`} />
      <section className="section section--light">
        <div className="container">
          <SectionHead eyebrow="Смотрите также" title="Другие направления" />
          <div className="cat-grid cat-grid--3">{[...related, ...more].map((x) => <CategoryCard key={x.slug} c={x} />)}</div>
        </div>
      </section>
    </Layout>
  );
}

/* ---------------- Program ---------------- */
export function ProgramPage({ p }: { p: Program }) {
  const c = catBySlug(p.category);
  const crumbs = [HOME, { name: "Направления", href: url.catalog }, { name: c.title, href: url.category(c) }, { name: p.title, href: url.program(p) }];
  const others = programsOf(c.slug).filter((x) => x.slug !== p.slug).slice(0, 3);
  const course: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Course", name: p.title, description: p.description,
    provider: { "@type": "EducationalOrganization", name: site().config.legal.organizationName || brand(), sameAs: absUrl("/") },
    inLanguage: "ru",
  };
  const facts = [
    { icon: "clock", label: "Срок обучения", value: p.hours },
    { icon: "compass", label: "Формат", value: p.format },
    { icon: "doc", label: "Документ", value: p.document || c.documents },
    { icon: "briefcase", label: "Стоимость", value: p.price },
  ];
  return (
    <Layout path={url.program(p)} title={`${p.title} — обучение в Янауле | ${brand()}`}
      description={`${p.title}: ${p.description} Узнайте сроки, формат и стоимость обучения — консультация по телефону.`.slice(0, 300)}
      jsonLd={[breadcrumbLd(crumbs), course]}>
      <PageHero crumbs={crumbs} title={p.title} text="Расскажем о требованиях к слушателям, сроках, формате и стоимости обучения по этой программе.">
        <div className="chips chips--hero"><a className="chip chip--dark" href={url.category(c)}><Icon name={c.icon} size={16} />{c.title}</a></div>
        <div className="hero-actions">
          <button type="button" className="btn btn--accent btn--lg" data-open-modal="price" data-program={p.title} data-direction={c.title}>Узнать стоимость</button>
          <button type="button" className="btn btn--ghost-light btn--lg" data-open-modal="callback" data-program={p.title}>Заказать звонок</button>
        </div>
      </PageHero>
      <section className="section section--tight">
        <div className="container program-layout">
          <div className="program-main">
            <div className="facts-grid">
              {facts.map((f) => (
                <div className="fact" key={f.label}>
                  <Icon name={f.icon} size={22} />
                  <span className="fact-label">{f.label}</span>
                  <b className={f.value ? undefined : "fact-empty"}>{f.value || (f.label === "Стоимость" ? "По запросу" : "Уточняйте у консультанта")}</b>
                </div>
              ))}
            </div>
            <Draft block>срок, формат, стоимость и вид документа для этой программы — content/programs.json</Draft>
            <div className="prose">
              <h2>О программе</h2>
              <p>{p.description}</p>
              {p.topics.length > 0 && (
                <>
                  <h2>Что изучается</h2>
                  <ul className="ticks ticks--dark">{p.topics.map((t) => <li key={t}><Icon name="check" size={18} strokeWidth={2.4} />{t}</li>)}</ul>
                </>
              )}
              <h2>Кому подходит</h2>
              <ul className="ticks ticks--dark">{c.audience.map((a) => <li key={a}><Icon name="check" size={18} strokeWidth={2.4} />{a}</li>)}</ul>
              <h2>Как записаться</h2>
              <p>Оставьте заявку или позвоните. Консультант уточнит ваш опыт и образование, расскажет о требованиях к слушателям, сроках, формате и стоимости обучения, поможет подготовить документы.</p>
            </div>
          </div>
          <aside className="program-aside">
            <div className="sticky-card">
              <h2 className="h3">Записаться или узнать стоимость</h2>
              <p className="muted">Перезвоним и ответим на вопросы по программе.</p>
              <LeadForm id={`prog-${p.slug}`} formType="program" defaultDirection={c.title} defaultProgram={p.title} showDirection={false} compact submitLabel="Узнать стоимость" />
              <div className="aside-phones">
                {site().config.contacts.phones.map((ph) => <a key={ph.tel} href={`tel:${ph.tel}`}><Icon name="phone" size={18} />{ph.display}</a>)}
              </div>
            </div>
          </aside>
        </div>
      </section>
      {others.length > 0 && (
        <section className="section section--light">
          <div className="container">
            <SectionHead eyebrow={c.title} title="Другие программы направления" />
            <div className="prog-grid">{others.map((o) => <ProgramCard key={o.slug} p={o} showCategory={false} />)}</div>
            <div className="center-actions"><a className="btn btn--outline" href={url.category(c)}>Все программы направления</a></div>
          </div>
        </section>
      )}
      <Steps />
    </Layout>
  );
}

/* ---------------- Worker professions ---------------- */
export function WorkerPage() {
  const cats = site().categories.filter((c) => c.group === "rabochie");
  const crumbs = [HOME, { name: "Рабочие профессии", href: url.worker }];
  return (
    <Layout path={url.worker} title={`Обучение рабочим профессиям в Янауле | ${brand()}`}
      description="Обучение рабочим профессиям в Янауле: нефтегазовая отрасль, электромонтёры, стропальщики, маляры, водители, машинисты спецтехники, трактористы."
      jsonLd={[breadcrumbLd(crumbs)]}>
      <PageHero crumbs={crumbs} title="Обучение рабочим профессиям" text="Профессии для работы в нефтегазовой отрасли, энергетике, строительстве, на складах и в сельском хозяйстве. Выберите направление или оставьте заявку — подберём программу.">
        <div className="hero-actions"><button type="button" className="btn btn--accent btn--lg" data-open-modal="consult" data-direction="Рабочие профессии">Подобрать профессию</button></div>
      </PageHero>
      <section className="section section--tight">
        <div className="container">
          {cats.map((c) => (
            <div className="worker-row" key={c.slug} data-reveal>
              <a href={url.category(c)} className="worker-media"><CategoryVisual c={c} /></a>
              <div className="worker-body">
                <h2 className="h3"><a href={url.category(c)}>{c.title}</a></h2>
                <p className="muted">{c.short}</p>
                <ul className="worker-list">
                  {programsOf(c.slug).map((p) => <li key={p.slug}><a href={url.program(p)}>{p.title}<Icon name="arrow" size={16} /></a></li>)}
                </ul>
                <a className="link-arrow" href={url.category(c)}>Подробнее о направлении <Icon name="arrow" size={18} /></a>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Steps dark />
      <LeadSection id="worker-lead" defaultDirection="" />
    </Layout>
  );
}

/* ---------------- Corporate ---------------- */
export function CorporatePage() {
  const crumbs = [HOME, { name: "Корпоративное обучение", href: url.corporate }];
  const faq = site().faq.filter((q) => /групп|стоимост|документ|отрыва/i.test(q.question));
  const steps = [
    { t: "Заявка", d: "Опишите задачу: профессии, количество сотрудников, сроки." },
    { t: "Подбор программ", d: "Предлагаем программы под должности и требования." },
    { t: "Договор", d: "Согласуем условия, график и формат обучения." },
    { t: "Обучение группы", d: "Проводим обучение и держим вас в курсе." },
    { t: "Документы", d: "Передаём документы по итогам обучения согласно программам." },
  ];
  return (
    <Layout path={url.corporate} title={`Корпоративное обучение сотрудников в Башкортостане | ${brand()}`}
      description="Обучение сотрудников предприятий: охрана труда, промышленная безопасность, рабочие профессии, повышение квалификации. Групповое обучение и подбор программ."
      jsonLd={[breadcrumbLd(crumbs), faqLd(faq)]}>
      <PageHero crumbs={crumbs} title="Обучение сотрудников для вашего предприятия" text="Групповое обучение, подбор программ для персонала и консультации для работодателей. Работаем с организациями Республики Башкортостан.">
        <div className="hero-actions">
          <button type="button" className="btn btn--accent btn--lg" data-open-modal="corporate">Обсудить сотрудничество</button>
          <a className="btn btn--ghost-light btn--lg" href={`tel:${site().config.contacts.phones[0].tel}`}><Icon name="phone" size={18} />{site().config.contacts.phones[0].display}</a>
        </div>
      </PageHero>
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Порядок работы" title="Как организуем обучение сотрудников" />
          <ol className="steps steps--5">
            {steps.map((s, i) => <li className="step" key={s.t} data-reveal><span className="step-num">{String(i + 1).padStart(2, "0")}</span><h3>{s.t}</h3><p>{s.d}</p></li>)}
          </ol>
        </div>
      </section>
      <section className="section section--light">
        <div className="container">
          <SectionHead eyebrow="Направления" title="Чему можем обучить ваших сотрудников" />
          <div className="cat-grid">{site().categories.map((c) => <CategoryCard key={c.slug} c={c} />)}</div>
        </div>
      </section>
      <CorporateBlock full />
      <FaqBlock items={faq} title="Вопросы работодателей" />
    </Layout>
  );
}

/* ---------------- About ---------------- */
export function AboutPage() {
  const { config, categories } = site();
  const crumbs = [HOME, { name: "О центре", href: url.about }];
  const l = config.legal;
  const rows: [string, string][] = [
    ["Полное наименование", l.organizationName], ["ИНН", l.inn], ["ОГРН", l.ogrn],
    ["Юридический адрес", l.legalAddress], ["Лицензия на образовательную деятельность", l.license], ["Руководитель", l.director],
  ];
  return (
    <Layout path={url.about} title={`Об учебном центре в Янауле | ${brand()}`}
      description="Учебный центр в Янауле: профессиональное обучение, подготовка, переподготовка и повышение квалификации специалистов в Республике Башкортостан."
      jsonLd={[breadcrumbLd(crumbs), orgLd()]}>
      <PageHero crumbs={crumbs} title="Об учебном центре" text="Мы занимаемся профессиональным обучением, подготовкой, переподготовкой и повышением квалификации специалистов в Республике Башкортостан." />
      <section className="section">
        <div className="container about-grid">
          <div className="prose" data-reveal>
            <h2>Чем мы занимаемся</h2>
            <p>Помогаем людям получить рабочую профессию, освоить новую сферу деятельности или обновить знания, а предприятиям — подготовить персонал.</p>
            <p>Обучение ведётся по {categories.length} направлениям: от нефтегазовых специальностей и спецтехники до охраны труда, промышленной безопасности и профессиональной переподготовки.</p>
            <p>Наш адрес: {fullAddress()}.</p>
            <Draft block>история центра, преподаватели, учебная база, фото классов — можно добавить на эту страницу (src/pages/inner.tsx → AboutPage) после получения сведений.</Draft>
          </div>
          <div className="about-stats" data-reveal>
            {categories.slice(0, 6).map((c) => <a key={c.slug} href={url.category(c)} className="about-chip"><Icon name={c.icon} size={20} />{c.title}</a>)}
            <a href={url.catalog} className="about-chip about-chip--all">Все направления <Icon name="arrow" size={18} /></a>
          </div>
        </div>
      </section>
      <WhyUs />
      <section className="section" id="svedeniya">
        <div className="container">
          <SectionHead eyebrow="Официальная информация" title="Сведения об организации" />
          <div className="legal-table" data-reveal>
            {rows.map(([k, v]) => (
              <div className="legal-row" key={k}>
                <span>{k}</span>
                {v ? <b>{v}</b> : <Draft>{k.toLowerCase()} — site.config.json → legal</Draft>}
              </div>
            ))}
          </div>
          {!config.draftMode && !rows.some(([, v]) => v) && <p className="muted">Сведения об организации предоставляются по запросу.</p>}
        </div>
      </section>
      <DocumentsBlock />
      <CtaBand title="Остались вопросы?" text="Позвоните или оставьте заявку — расскажем об обучении подробнее." />
    </Layout>
  );
}

/* ---------------- Reviews ---------------- */
export function ReviewsPage() {
  const crumbs = [HOME, { name: "Отзывы", href: url.reviews }];
  return (
    <Layout path={url.reviews} title={`Отзывы слушателей и организаций | ${brand()}`} description="Отзывы слушателей и организаций об обучении в учебном центре в Янауле." jsonLd={[breadcrumbLd(crumbs)]}>
      <PageHero crumbs={crumbs} title="Отзывы слушателей" text="Мнения тех, кто прошёл у нас обучение, и организаций, чьих сотрудников мы обучали." />
      <ReviewsBlock />
      <CtaBand title="Хотите пройти обучение?" text="Оставьте заявку — подберём программу." />
    </Layout>
  );
}

/* ---------------- Contacts ---------------- */
export function ContactsPage() {
  const crumbs = [HOME, { name: "Контакты", href: url.contacts }];
  return (
    <Layout path={url.contacts} title={`Контакты учебного центра в Янауле | ${brand()}`}
      description={`Адрес: ${fullAddress()}. Телефоны: ${site().config.contacts.phones.map((p) => p.display).join(", ")}. Консультация по выбору программы обучения.`}
      jsonLd={[breadcrumbLd(crumbs), orgLd()]}>
      <div className="page-hero page-hero--slim"><div className="container"><Breadcrumbs items={crumbs} /></div></div>
      <ContactsBlock h1 />
    </Layout>
  );
}

/* ---------------- Legal ---------------- */
function LegalLayout({ path, title, children }: { path: string; title: string; children: React.ReactNode }) {
  const crumbs = [HOME, { name: title, href: path }];
  return (
    <Layout path={path} title={`${title} | ${brand()}`} description={`${title} — сайт учебного центра в Янауле.`} jsonLd={[breadcrumbLd(crumbs)]}>
      <PageHero crumbs={crumbs} title={title} />
      <section className="section section--tight"><div className="container"><div className="prose prose--legal">{children}</div></div></section>
    </Layout>
  );
}

function Operator() {
  const { legal, contacts } = site().config;
  return legal.organizationName
    ? <>{legal.organizationName}{legal.inn && <>, ИНН {legal.inn}</>}{legal.ogrn && <>, ОГРН {legal.ogrn}</>}, адрес: {legal.legalAddress || fullAddress()}</>
    : <><Draft>наименование оператора, ИНН, ОГРН, адрес — site.config.json → legal</Draft>{!site().config.draftMode && <>учебный центр, расположенный по адресу: {fullAddress()}{contacts.phones.length ? `, тел. ${contacts.phones[0].display}` : ""}</>}</>;
}

export function PrivacyPage() {
  const { contacts } = site().config;
  return (
    <LegalLayout path={url.privacy} title="Политика конфиденциальности">
      <Draft block>текст является шаблоном. Перед публикацией его должен проверить юрист и дополнить сведениями об операторе. Также оператор обязан уведомить Роскомнадзор об обработке персональных данных (ст. 22 152-ФЗ), если не освобождён от этого.</Draft>
      <h2>1. Общие положения</h2>
      <p>Настоящая политика определяет порядок обработки и защиты персональных данных пользователей сайта в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
      <p>Оператор персональных данных: <Operator />.</p>
      <h2>2. Какие данные мы обрабатываем</h2>
      <p>Имя, номер телефона, название организации (если указано), сведения об интересующей программе обучения и текст комментария, которые пользователь добавляет в форму на сайте, а также технические данные: IP-адрес, сведения о браузере, адрес страницы.</p>
      <h2>3. Цели обработки</h2>
      <ul><li>связь с пользователем для консультации по программам обучения;</li><li>подготовка предложения и заключение договора об обучении;</li><li>улучшение работы сайта.</li></ul>
      <h2>4. Правовые основания</h2>
      <p>Согласие субъекта персональных данных, а также заключение и исполнение договора, стороной которого является субъект.</p>
      <h2>5. Порядок и сроки обработки</h2>
      <p>Обработка осуществляется с использованием средств автоматизации и без них. Данные хранятся не дольше, чем этого требуют цели обработки, и уничтожаются после их достижения или при отзыве согласия, если иное не предусмотрено законом.</p>
      <p>Оператор принимает правовые, организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, распространения и уничтожения.</p>
      <h2>6. Передача данных</h2>
      <p>Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством, а также сервисов, которые используются для приёма и обработки заявок (CRM-система, мессенджер, почтовый сервис), — в объёме, необходимом для связи с пользователем.</p>
      <h2>7. Права пользователя</h2>
      <p>Пользователь вправе получить сведения об обработке своих данных, потребовать их уточнения, блокирования или уничтожения, а также отозвать согласие, направив обращение оператору{contacts.email ? <> на адрес <a href={`mailto:${contacts.email}`}>{contacts.email}</a></> : " по контактам, указанным на сайте"}.</p>
      <h2>8. Файлы cookie и аналитика</h2>
      <p>Сайт может использовать файлы cookie и сервисы веб-аналитики (например, Яндекс Метрику) для анализа посещаемости. Пользователь может отключить cookie в настройках браузера.</p>
      <h2>9. Изменение политики</h2>
      <p>Оператор вправе вносить изменения в политику. Актуальная редакция всегда доступна на этой странице.</p>
    </LegalLayout>
  );
}

export function ConsentPage() {
  return (
    <LegalLayout path={url.consent} title="Согласие на обработку персональных данных">
      <Draft block>шаблон согласия — проверьте с юристом и укажите сведения об операторе.</Draft>
      <p>Отправляя форму на сайте, я свободно, своей волей и в своём интересе даю согласие оператору — <Operator /> — на обработку моих персональных данных: имени, номера телефона, названия организации, сведений об интересующей программе и текста сообщения.</p>
      <p><b>Цель обработки:</b> консультирование по программам обучения, подготовка предложения и заключение договора.</p>
      <p><b>Действия с данными:</b> сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача (предоставление, доступ) сервисам приёма заявок, обезличивание, блокирование, удаление, уничтожение — с использованием средств автоматизации и без них.</p>
      <p><b>Срок действия:</b> согласие действует до достижения целей обработки или до его отзыва. Отозвать согласие можно, направив оператору письменное обращение.</p>
      <p>Я подтверждаю, что ознакомлен(а) с <a href={url.privacy}>политикой конфиденциальности</a>.</p>
    </LegalLayout>
  );
}

/* ---------------- 404 ---------------- */
export function NotFoundPage() {
  return (
    <Layout path="/404.html" title={`Страница не найдена | ${brand()}`} description="Страница не найдена." noindex>
      <section className="page-hero page-hero--404">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="container nf">
          <div className="nf-code">404</div>
          <h1 className="page-title">Страница не найдена</h1>
          <p className="page-lead">Возможно, она была перемещена. Найдите программу в каталоге или свяжитесь с нами.</p>
          <div className="hero-actions">
            <a className="btn btn--accent btn--lg" href={url.catalog}>Каталог программ</a>
            <a className="btn btn--ghost-light btn--lg" href={url.home}>На главную</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
