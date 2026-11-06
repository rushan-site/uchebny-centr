import React from "react";
import { site, url } from "../ctx.js";
import { GROUPS } from "../content.js";
import { Icon } from "./Icon.js";

interface Props {
  id: string;
  formType: string;
  compact?: boolean;
  submitLabel?: string;
  defaultDirection?: string;
  defaultProgram?: string;
  showDirection?: boolean;
  commentPlaceholder?: string;
  extraFields?: "company";
  dark?: boolean;
}

export function LeadForm({ id, formType, compact, submitLabel = "Получить консультацию", defaultDirection = "", defaultProgram = "", showDirection = true, commentPlaceholder, extraFields, dark }: Props) {
  const { categories, config } = site();
  const f = (n: string) => `${id}-${n}`;
  return (
    <form className={`lead-form${dark ? " lead-form--dark" : ""}${compact ? " lead-form--compact" : ""}`} data-lead-form noValidate
      action={config.forms.endpoint} method="post">
      <input type="hidden" name="formType" value={formType} />
      <input type="hidden" name="program" value={defaultProgram} />
      <input type="hidden" name="page" value="" />
      <div className="hp" aria-hidden="true">
        <label htmlFor={f("website")}>Не заполняйте это поле</label>
        <input id={f("website")} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={f("name")}>Имя <span aria-hidden="true">*</span></label>
          <input id={f("name")} name="name" type="text" autoComplete="name" required maxLength={80} placeholder="Как к вам обращаться" />
          <span className="field-error" />
        </div>
        <div className="field">
          <label htmlFor={f("phone")}>Телефон <span aria-hidden="true">*</span></label>
          <input id={f("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+7 (___) ___-__-__" data-phone />
          <span className="field-error" />
        </div>
        {extraFields === "company" && (
          <div className="field field--full">
            <label htmlFor={f("company")}>Организация</label>
            <input id={f("company")} name="company" type="text" autoComplete="organization" maxLength={150} placeholder="Название предприятия" />
          </div>
        )}
        {showDirection && !compact && (
          <div className="field field--full">
            <label htmlFor={f("direction")}>Интересующее направление</label>
            <div className="select-wrap">
              <select id={f("direction")} name="direction" defaultValue={defaultDirection}>
                <option value="">Нужна помощь с выбором</option>
                {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
                  <optgroup key={g} label={GROUPS[g].title}>
                    {categories.filter((c) => c.group === g).map((c) => <option key={c.slug} value={c.title}>{c.title}</option>)}
                  </optgroup>
                ))}
                <option value="Корпоративное обучение">Корпоративное обучение сотрудников</option>
              </select>
              <Icon name="chevron" size={18} />
            </div>
          </div>
        )}
        {!compact && (
          <div className="field field--full">
            <label htmlFor={f("comment")}>Комментарий</label>
            <textarea id={f("comment")} name="comment" rows={3} maxLength={1000} placeholder={commentPlaceholder ?? "Например: какая профессия нужна, есть ли опыт, удобное время для звонка"} />
          </div>
        )}
      </div>
      <label className="consent">
        <input type="checkbox" name="consent" value="yes" required />
        <span className="consent-box"><Icon name="check" size={14} strokeWidth={3} /></span>
        <span>Я даю <a href={url.consent} target="_blank" rel="noopener">согласие на обработку персональных данных</a> и принимаю условия <a href={url.privacy} target="_blank" rel="noopener">политики конфиденциальности</a></span>
      </label>
      <span className="field-error field-error--consent" />
      <button className="btn btn--accent btn--lg btn--block" type="submit">
        <span className="btn-label">{submitLabel}</span>
        <span className="spinner" aria-hidden="true" />
      </button>
      <div className="form-status" role="status" aria-live="polite" />
    </form>
  );
}
