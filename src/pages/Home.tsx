import React from "react";
import { site, url } from "../ctx.js";
import { GROUPS } from "../content.js";
import { Layout, orgLd } from "../components/Layout.js";
import { Icon, CategoryArt } from "../components/Icon.js";
import {
  CategoryCard, QuickAnswers, WhyUs, Steps, DocumentsBlock, CorporateBlock, ReviewsBlock,
  FaqBlock, faqLd, LeadSection, ContactsBlock, RetrainingBlock, SectionHead, Picture,
} from "../components/blocks.js";

function Hero() {
  const { images, categories, config } = site();
  const tiles = ["neftegazovaya-otrasl", "elektrosnabzhenie-i-elektrobezopasnost", "specialnaya-tehnika"].map((s) => categories.find((c) => c.slug === s)!).filter(Boolean);
  return (
    <section className={`hero${images.hero ? " hero--photo" : ""}`}>
      {images.hero && <div className="hero-bg"><Picture img={images.hero} alt="Специалист на производстве" eager sizes="100vw" /></div>}
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow eyebrow--light"><Icon name="pin" size={16} />Янаул · Республика Башкортостан</div>
          <h1 className="hero-title">
            <span>Получите профессию.</span>
            <span>Повысьте квалификацию.</span>
            <span className="accent">Откройте новые возможности</span>
          </h1>
          <p className="hero-sub">Профессиональное обучение и переподготовка по востребованным специальностям. Подберём подходящую программу и поможем сделать следующий шаг в карьере.</p>
          <div className="hero-actions">
            <a className="btn btn--accent btn--lg" href={url.catalog}>Подобрать обучение <Icon name="arrow" size={20} /></a>
            <button type="button" className="btn btn--ghost-light btn--lg" data-open-modal="consult">Получить консультацию</button>
          </div>
          <ul className="hero-points">
            <li><Icon name="check" size={18} strokeWidth={2.4} />Рабочие профессии и спецтехника</li>
            <li><Icon name="check" size={18} strokeWidth={2.4} />Охрана труда и промбезопасность</li>
            <li><Icon name="check" size={18} strokeWidth={2.4} />Переподготовка и повышение квалификации</li>
            <li><Icon name="check" size={18} strokeWidth={2.4} />Обучение сотрудников предприятий</li>
          </ul>
        </div>
        {!images.hero && (
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-tiles">
              {tiles.map((c, i) => (
                <div key={c.slug} className={`hero-tile hero-tile--${i + 1}`}>
                  <CategoryArt icon={c.icon} group={c.group} title={c.title} center />
                  <span className="hero-tile-label">{c.title}</span>
                </div>
              ))}
            </div>
            <div className="hero-float card-glass">
              <span className="hero-float-ico"><Icon name="headset" size={22} /></span>
              <div>
                <b>Поможем выбрать программу</b>
                <a href={`tel:${config.contacts.phones[0].tel}`}>{config.contacts.phones[0].display}</a>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="container hero-quick"><QuickAnswers /></div>
    </section>
  );
}

function Directions() {
  const { categories } = site();
  return (
    <section className="section" id="napravleniya">
      <div className="container">
        <div className="section-head-row">
          <SectionHead eyebrow="Направления обучения" title="Выберите направление" text="Нажмите на карточку, чтобы посмотреть программы и узнать условия." />
          <a href={url.catalog} className="btn btn--outline">Каталог программ <Icon name="search" size={18} /></a>
        </div>
        <div className="tabs" role="tablist" aria-label="Фильтр направлений" data-cat-tabs>
          <button type="button" role="tab" aria-selected="true" className="tab is-active" data-filter="all">Все направления</button>
          {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
            <button key={g} type="button" role="tab" aria-selected="false" className="tab" data-filter={g}>{GROUPS[g].short}</button>
          ))}
        </div>
        <div className="cat-grid" data-cat-grid>
          {categories.map((c) => <CategoryCard key={c.slug} c={c} />)}
          <article className="cat-card cat-card--cta" data-reveal data-group="all">
            <div className="cat-card-body">
              <span className="why-ico"><Icon name="compass" size={26} /></span>
              <h3 className="cat-card-title">Не знаете, что выбрать?</h3>
              <p className="cat-card-text">Расскажите о своей цели — подберём программу и ответим на вопросы.</p>
              <button type="button" className="btn btn--accent" data-open-modal="consult">Подобрать программу</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { faq, config } = site();
  return (
    <Layout
      path="/"
      title={`Профессиональное обучение в Янауле — рабочие профессии, переподготовка | ${config.brand.name}`}
      description="Обучение рабочим профессиям, охране труда и промышленной безопасности, профессиональная переподготовка и повышение квалификации в Янауле и Республике Башкортостан."
      jsonLd={[orgLd(), faqLd(faq)]}
      bodyClass="page-home"
    >
      <Hero />
      <Directions />
      <RetrainingBlock />
      <WhyUs />
      <Steps dark />
      <DocumentsBlock />
      <CorporateBlock />
      <ReviewsBlock limit={6} />
      <FaqBlock />
      <LeadSection id="home-lead" />
      <ContactsBlock />
    </Layout>
  );
}
