/* Админ-панель: редактирование контента (JSON) и просмотр заявок */
(function () {
  "use strict";
  var app = document.getElementById("app"), tabsEl = document.getElementById("tabs");
  var TABS = [
    { id: "leads", title: "Заявки" },
    { id: "programs", title: "Программы", help: "Пустые поля «Срок», «Формат», «Стоимость» на сайте показываются как «уточняется» / «по запросу». Адрес страницы — латиницей через дефис." },
    { id: "categories", title: "Направления", help: "Фото направления: положите файл public/images/categories/<адрес>.jpg на сервере — сборка подставит и оптимизирует его." },
    { id: "faq", title: "FAQ" },
    { id: "reviews", title: "Отзывы", help: "Только реальные отзывы. Тип: text — текст, photo — фото (благодарственное письмо и т.п.), video — ссылка на YouTube / Rutube / VK или mp4, organization — отзыв организации." },
    { id: "documents", title: "Документы", help: "Загружайте фото реальных образцов с закрытыми персональными данными." },
    { id: "config", title: "Настройки", help: "Контакты, мессенджеры, юридические сведения. Выключите «Черновой режим» перед публикацией — тогда пропадут подсказки и сайт откроется для поисковиков." },
  ];
  var LABELS = {
    slug: ["Адрес страницы", "латиница, цифры, дефис"], title: ["Название"], category: ["Направление"], description: ["Описание"],
    topics: ["Что изучается", "каждый пункт с новой строки"], hours: ["Срок обучения", "например: 72 ч / 2 недели"], format: ["Формат", "очно, дистанционно…"],
    price: ["Стоимость", "например: от 5 000 ₽"], document: ["Документ по итогам"], popular: ["Популярная программа"],
    group: ["Группа"], icon: ["Иконка"], short: ["Краткое описание (карточка)"], h1: ["Заголовок H1"], seoTitle: ["SEO Title"],
    seoDescription: ["SEO Description"], intro: ["Вводный текст"], audience: ["Кому подходит", "каждый пункт с новой строки"], documents: ["Документы направления"],
    question: ["Вопрос"], answer: ["Ответ"], needsConfirmation: ["Показывать подсказку «проверьте ответ»"],
    type: ["Тип"], author: ["Автор"], role: ["Должность / организация"], text: ["Текст"], image: ["Изображение"], video: ["Видео (ссылка)"], date: ["Дата"],
    draftMode: ["Черновой режим"], siteUrl: ["Адрес сайта", "https://ваш-домен.ru"], brand: ["Бренд"], name: ["Название"], fullName: ["Полное название"], tagline: ["Подпись под логотипом"], logoImage: ["Логотип (файл)"],
    contacts: ["Контакты"], region: ["Регион"], city: ["Город"], street: ["Улица, дом"], postalCode: ["Индекс"], phones: ["Телефоны"], display: ["Как показывать"], tel: ["Для звонка", "+79XXXXXXXXX"],
    email: ["E-mail"], workHours: ["Режим работы"], geo: ["Координаты на карте"], lat: ["Широта"], lon: ["Долгота"],
    messengers: ["Мессенджеры"], whatsapp: ["WhatsApp", "номер или ссылка"], telegram: ["Telegram", "@username или ссылка"], max: ["MAX", "ссылка"],
    facts: ["Короткие ответы на первом экране"], distanceLearning: ["Дистанционное обучение"], learningFormats: ["Форматы обучения"], documentsSummary: ["Документы (кратко)"], priceInfo: ["Текст о стоимости"],
    legal: ["Юридические сведения"], organizationName: ["Наименование организации"], inn: ["ИНН"], ogrn: ["ОГРН"], legalAddress: ["Юридический адрес"], license: ["Лицензия", "номер, дата, кем выдана"], director: ["Руководитель"],
    forms: ["Формы"], endpoint: ["Адрес обработчика заявок", "/api/lead или /api/lead.php"], analytics: ["Аналитика"], yandexMetrikaId: ["ID Яндекс Метрики"],
  };
  var LONG = /^(description|intro|answer|text|short|seoDescription|comment|priceInfo|documents|license)$/;
  var IMAGE = /^(image|logoImage)$/;
  var TEMPLATES = {
    programs: { slug: "", category: "", title: "", description: "", topics: [], hours: "", format: "", price: "", document: "", popular: false },
    categories: { slug: "", title: "", group: "rabochie", icon: "sparkle", short: "", h1: "", seoTitle: "", seoDescription: "", intro: "", audience: [], documents: "" },
    faq: { question: "", answer: "", needsConfirmation: false },
    reviews: { type: "text", author: "", role: "", text: "", image: "", video: "", date: "" },
    documents: { type: "", title: "", text: "", image: "" },
  };
  var SELECTS = {
    group: [["rabochie", "Рабочие профессии"], ["bezopasnost", "Охрана труда и безопасность"], ["dpo", "Переподготовка и ПК"]],
    type: [["text", "Текстовый"], ["photo", "Фото"], ["video", "Видео"], ["organization", "Организация"]],
    icon: ["oil", "bolt", "hook", "roller", "wheel", "excavator", "tractor", "helmet", "factory", "cap", "growth", "shield", "users", "briefcase", "doc", "layers", "sparkle"].map(function (x) { return [x, x]; }),
  };
  var state = { tab: "leads", data: null, categories: [], filter: "", catFilter: "", dirty: false };

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "on") for (var ev in attrs.on) el.addEventListener(ev, attrs.on[ev]);
      else if (k === "text") el.textContent = attrs[k];
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function api(url, opts) { return fetch(url, opts).then(function (r) { return r.json().then(function (j) { j.httpStatus = r.status; return j; }); }); }
  function markDirty() { state.dirty = true; }
  window.addEventListener("beforeunload", function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

  function renderTabs() {
    tabsEl.innerHTML = "";
    TABS.forEach(function (t) {
      tabsEl.appendChild(h("button", { class: t.id === state.tab ? "active" : "", text: t.title, on: { click: function () {
        if (state.dirty && !confirm("Есть несохранённые изменения. Уйти без сохранения?")) return;
        state.dirty = false; state.tab = t.id; state.filter = ""; state.catFilter = ""; load();
      } } }));
    });
  }

  function load() {
    renderTabs();
    app.innerHTML = "<p>Загрузка…</p>";
    if (state.tab === "leads") return api("/admin/api/leads").then(renderLeads);
    Promise.all([api("/admin/api/file?name=" + state.tab), api("/admin/api/file?name=categories")]).then(function (r) {
      state.data = r[0].data; state.categories = r[1].data || []; renderEditor();
    });
  }

  /* ---------- Leads ---------- */
  function renderLeads(r) {
    app.innerHTML = "";
    if (!r.channels || !r.channels.length) app.appendChild(h("div", { class: "msg err", text: "Не настроен ни один канал доставки заявок (Telegram, e-mail, CRM). Формы на сайте показывают посетителям ошибку. Заполните файл .env на сервере." }));
    else app.appendChild(h("div", { class: "msg ok", text: "Заявки отправляются: " + r.channels.join(", ") + ". Копия каждой заявки сохраняется здесь." }));
    if (!r.leads.length) { app.appendChild(h("div", { class: "card", text: "Заявок пока нет." })); return; }
    var tbody = h("tbody");
    r.leads.forEach(function (l) {
      tbody.appendChild(h("tr", {}, [
        h("td", { text: new Date(l.date).toLocaleString("ru-RU") }),
        h("td", { text: l.formLabel }),
        h("td", {}, [h("b", { text: l.name }), h("br"), h("a", { href: "tel:" + l.phone, text: l.phone })]),
        h("td", { text: [l.company, l.direction, l.program].filter(Boolean).join(" · ") }),
        h("td", { text: l.comment || "" }),
        h("td", { class: "st-" + l.status, text: { delivered: "доставлена", failed: "ошибка доставки", not_configured: "каналы не настроены" }[l.status] || l.status, title: (l.delivery || []).map(function (d) { return d.channel + ": " + (d.ok ? "ok" : d.error); }).join("\n") }),
      ]));
    });
    app.appendChild(h("table", {}, [h("thead", {}, [h("tr", {}, ["Дата", "Тип", "Контакт", "Направление / программа", "Комментарий", "Статус"].map(function (t) { return h("th", { text: t }); }))]), tbody]));
  }

  /* ---------- Generic editor ---------- */
  function labelFor(key) { var l = LABELS[key] || [key]; return h("label", {}, [l[0], l[1] ? h("small", { text: l[1] }) : null]); }

  function uploadBtn(onDone) {
    var inp = h("input", { type: "file", accept: "image/*,video/mp4,application/pdf", style: "display:none" });
    inp.addEventListener("change", function () {
      var f = inp.files[0]; if (!f) return;
      if (f.size > 8 * 1024 * 1024) { alert("Файл больше 8 МБ"); return; }
      var rd = new FileReader();
      rd.onload = function () {
        api("/admin/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, base64: String(rd.result).split(",")[1] }) })
          .then(function (r) { if (r.ok) onDone(r.path); else alert(r.error); });
      };
      rd.readAsDataURL(f);
    });
    return h("span", {}, [inp, h("button", { type: "button", class: "btn light small", text: "Загрузить файл", on: { click: function () { inp.click(); } } })]);
  }

  function fieldFor(obj, key) {
    var v = obj[key], control;
    var set = function (nv) { obj[key] = nv; markDirty(); };
    if (typeof v === "boolean") {
      control = h("input", { type: "checkbox", style: "margin-top:10px;width:20px;height:20px" });
      control.checked = v; control.addEventListener("change", function () { set(control.checked); });
    } else if (typeof v === "number" || (v === null && (key === "lat" || key === "lon"))) {
      control = h("input", { type: "number", step: "any", value: v === null ? "" : v });
      control.addEventListener("input", function () { set(control.value === "" ? null : Number(control.value)); });
    } else if (Array.isArray(v) && v.every(function (x) { return typeof x === "string"; })) {
      control = h("textarea", {}); control.value = v.join("\n");
      control.addEventListener("input", function () { set(control.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean)); });
    } else if (Array.isArray(v)) {
      control = h("div");
      var draw = function () {
        control.innerHTML = "";
        v.forEach(function (it, i) {
          var fs = h("fieldset", {}, [h("legend", { text: "№ " + (i + 1) })]);
          Object.keys(it).forEach(function (k) { fs.appendChild(fieldFor(it, k)); });
          fs.appendChild(h("button", { type: "button", class: "btn danger small", text: "Удалить", on: { click: function () { v.splice(i, 1); markDirty(); draw(); } } }));
          control.appendChild(fs);
        });
        control.appendChild(h("button", { type: "button", class: "btn light small", text: "+ Добавить", on: { click: function () {
          var t = {}; Object.keys(v[0] || { display: "", tel: "" }).forEach(function (k) { t[k] = ""; }); v.push(t); markDirty(); draw();
        } } }));
      };
      draw();
    } else if (v && typeof v === "object") {
      var fs = h("fieldset", {}, [h("legend", { text: (LABELS[key] || [key])[0] })]);
      Object.keys(v).forEach(function (k) { fs.appendChild(fieldFor(v, k)); });
      return fs;
    } else if (key === "category") {
      control = h("select");
      control.appendChild(h("option", { value: "", text: "— выберите —" }));
      state.categories.forEach(function (c) { var o = h("option", { value: c.slug, text: c.title }); if (c.slug === v) o.selected = true; control.appendChild(o); });
      control.addEventListener("change", function () { set(control.value); });
    } else if (SELECTS[key] && state.tab !== "documents") {
      control = h("select");
      SELECTS[key].forEach(function (o) { var op = h("option", { value: o[0], text: o[1] }); if (o[0] === v) op.selected = true; control.appendChild(op); });
      control.addEventListener("change", function () { set(control.value); });
    } else if (IMAGE.test(key) || key === "video") {
      var inp = h("input", { type: "text", value: v || "", placeholder: key === "video" ? "https://rutube.ru/video/… или загрузите mp4" : "/uploads/… — загрузите файл" });
      inp.addEventListener("input", function () { set(inp.value.trim()); });
      control = h("div", { class: "upload" }, [inp, uploadBtn(function (p) { inp.value = p; set(p); })]);
    } else if (LONG.test(key)) {
      control = h("textarea", {}); control.value = v || "";
      control.addEventListener("input", function () { set(control.value); });
    } else {
      control = h("input", { type: "text", value: v == null ? "" : v });
      control.addEventListener("input", function () { set(control.value); });
    }
    return h("div", { class: "field" }, [labelFor(key), control]);
  }

  function itemTitle(it) { return it.title || it.question || it.author || it.type || "Новый элемент"; }

  function renderEditor() {
    var tab = TABS.filter(function (t) { return t.id === state.tab; })[0];
    app.innerHTML = "";
    if (tab.help) app.appendChild(h("p", { class: "help", text: tab.help }));
    var data = state.data;
    var listEl = h("div");
    if (Array.isArray(data)) {
      var tb = h("div", { class: "toolbar" });
      var search = h("input", { type: "search", placeholder: "Поиск…", value: state.filter });
      search.addEventListener("input", function () { state.filter = search.value.toLowerCase(); drawList(); });
      tb.appendChild(search);
      if (state.tab === "programs") {
        var cs = h("select");
        cs.appendChild(h("option", { value: "", text: "Все направления" }));
        state.categories.forEach(function (c) { var o = h("option", { value: c.slug, text: c.title }); if (c.slug === state.catFilter) o.selected = true; cs.appendChild(o); });
        cs.addEventListener("change", function () { state.catFilter = cs.value; drawList(); });
        tb.appendChild(cs);
      }
      tb.appendChild(h("button", { class: "btn accent", type: "button", text: "+ Добавить", on: { click: function () {
        var t = JSON.parse(JSON.stringify(TEMPLATES[state.tab] || {}));
        if (state.tab === "programs" && state.catFilter) t.category = state.catFilter;
        data.unshift(t); markDirty(); state.filter = ""; search.value = ""; drawList(0);
      } } }));
      app.appendChild(tb);
      app.appendChild(listEl);
      var drawList = function (openIdx) {
        listEl.innerHTML = "";
        data.forEach(function (it, i) {
          if (state.filter && JSON.stringify(it).toLowerCase().indexOf(state.filter) === -1) return;
          if (state.catFilter && it.category !== state.catFilter) return;
          var body = h("div", { class: "item-body" });
          Object.keys(it).forEach(function (k) { body.appendChild(fieldFor(it, k)); });
          body.appendChild(h("div", { class: "row-actions", style: "margin-top:12px" }, [
            h("button", { type: "button", class: "btn light small", text: "↑ Выше", on: { click: function () { if (i > 0) { data.splice(i - 1, 0, data.splice(i, 1)[0]); markDirty(); drawList(i - 1); } } } }),
            h("button", { type: "button", class: "btn light small", text: "↓ Ниже", on: { click: function () { if (i < data.length - 1) { data.splice(i + 1, 0, data.splice(i, 1)[0]); markDirty(); drawList(i + 1); } } } }),
            h("button", { type: "button", class: "btn light small", text: "Копировать", on: { click: function () { var c = JSON.parse(JSON.stringify(it)); if (c.slug) c.slug += "-kopiya"; data.splice(i + 1, 0, c); markDirty(); drawList(i + 1); } } }),
            h("button", { type: "button", class: "btn danger small", text: "Удалить", on: { click: function () { if (confirm("Удалить «" + itemTitle(it) + "»?")) { data.splice(i, 1); markDirty(); drawList(); } } } }),
          ]));
          var cat = it.category && state.categories.filter(function (c) { return c.slug === it.category; })[0];
          var d = h("details", { class: "item" }, [h("summary", {}, [h("span", { text: itemTitle(it) }), h("span", { class: "sp" }), cat ? h("span", { class: "tag", text: cat.title }) : null, it.price ? h("span", { class: "tag", text: it.price }) : null]), body]);
          if (openIdx === i) d.open = true;
          listEl.appendChild(d);
        });
      };
      drawList();
    } else {
      var card = h("div", { class: "card" });
      Object.keys(data).forEach(function (k) { card.appendChild(fieldFor(data, k)); });
      app.appendChild(card);
    }
    var out = h("div");
    var saveBtn = h("button", { class: "btn accent", type: "button", text: "Сохранить и опубликовать", on: { click: function () {
      saveBtn.disabled = true; saveBtn.textContent = "Сохраняю и пересобираю сайт…";
      api("/admin/api/file?name=" + state.tab, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state.data) }).then(function (r) {
        saveBtn.disabled = false; saveBtn.textContent = "Сохранить и опубликовать";
        out.innerHTML = "";
        out.appendChild(h("div", { class: "msg " + (r.ok ? "ok" : "err"), text: r.ok ? "Сохранено. Сайт обновлён." : (r.error || "Ошибка") }));
        if (r.output) out.appendChild(h("div", { class: "output", text: r.output }));
        if (r.ok) state.dirty = false;
      }).catch(function () { saveBtn.disabled = false; saveBtn.textContent = "Сохранить и опубликовать"; alert("Сервер недоступен"); });
    } } });
    app.appendChild(h("div", { class: "savebar" }, [saveBtn, h("span", { class: "help", style: "margin:0", text: "Перед сохранением создаётся резервная копия (папка data/backups)." })]));
    app.appendChild(out);
  }

  load();
})();
