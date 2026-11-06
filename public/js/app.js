/* Учебный центр — клиентские скрипты (без зависимостей) */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var SITE = window.SITE || { endpoint: "/api/lead", phones: [] };
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };

  function goal(name) {
    try { if (SITE.metrika && window.ym) window.ym(SITE.metrika, "reachGoal", name); } catch (e) { /* ignore */ }
  }
  function phonesHtml() {
    return (SITE.phones || []).map(function (p) { return '<a href="tel:' + p.tel + '">' + p.display + "</a>"; }).join(" или ");
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  /* ---------- UTM: remember source of the visit for CRM ---------- */
  try {
    var qs = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      if (qs.get(k)) sessionStorage.setItem(k, qs.get(k));
    });
  } catch (e) { /* storage unavailable */ }

  /* ---------- Body scroll lock ---------- */
  var locks = 0, lastFocus = null;
  function lock() { if (locks++ === 0) doc.body.classList.add("is-locked"); }
  function unlock() { if (--locks <= 0) { locks = 0; doc.body.classList.remove("is-locked"); } }

  /* ---------- Header ---------- */
  var header = $("[data-header]");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mega menu ---------- */
  var megaTrigger = $("[data-mega-trigger]"), mega = $("#mega-menu"), megaTimer;
  if (megaTrigger && mega) {
    var li = megaTrigger.parentElement;
    var openMega = function () { clearTimeout(megaTimer); mega.classList.add("is-open"); megaTrigger.setAttribute("aria-expanded", "true"); };
    var closeMega = function () { megaTimer = setTimeout(function () { mega.classList.remove("is-open"); megaTrigger.setAttribute("aria-expanded", "false"); }, 160); };
    li.addEventListener("mouseenter", openMega);
    li.addEventListener("mouseleave", closeMega);
    mega.addEventListener("mouseenter", openMega);
    mega.addEventListener("mouseleave", closeMega);
    megaTrigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); openMega(); var f = $("a", mega); if (f) f.focus(); }
    });
    mega.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMega(); megaTrigger.focus(); } });
    mega.addEventListener("focusout", function (e) { if (!mega.contains(e.relatedTarget)) closeMega(); });
    mega.addEventListener("click", function (e) { if (e.target.closest("button")) { mega.classList.remove("is-open"); } });
  }

  /* ---------- Mobile drawer ---------- */
  var drawer = $("[data-drawer]");
  function openDrawer() {
    if (!drawer) return;
    lastFocus = doc.activeElement;
    drawer.hidden = false; lock();
    $$("[data-menu-open]").forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    var c = $("[data-menu-close].icon-btn", drawer); if (c) c.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true; unlock();
    $$("[data-menu-open]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (lastFocus) lastFocus.focus();
  }
  doc.addEventListener("click", function (e) {
    if (e.target.closest("[data-menu-open]")) openDrawer();
    else if (e.target.closest("[data-menu-close]")) closeDrawer();
    else if (drawer && !drawer.hidden && e.target.closest(".drawer a")) closeDrawer();
  });

  /* ---------- Modal ---------- */
  var modal = $("[data-modal]"), modalTexts = {};
  try { modalTexts = JSON.parse(($("#modal-texts") || {}).textContent || "{}"); } catch (e) { /* ignore */ }
  function openModal(type, trigger) {
    if (!modal) return;
    if (drawer && !drawer.hidden) closeDrawer();
    var t = modalTexts[type] || modalTexts.consult || ["Заявка", ""];
    $("[data-modal-title]", modal).textContent = t[0];
    $("[data-modal-sub]", modal).textContent = t[1];
    var form = $("form", modal);
    resetForm(form);
    form.elements.formType.value = type;
    var program = (trigger && trigger.getAttribute("data-program")) || "";
    var direction = (trigger && trigger.getAttribute("data-direction")) || "";
    form.elements.program.value = program;
    var progEl = $("[data-modal-program]", modal);
    progEl.hidden = !program; progEl.textContent = program ? "Программа: " + program : "";
    var sel = form.elements.direction;
    if (sel) {
      sel.value = "";
      if (direction) for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === direction) { sel.value = direction; break; }
      if (type === "corporate") sel.value = "Корпоративное обучение";
    }
    var comment = form.elements.comment;
    if (comment) comment.placeholder = type === "corporate" ? "Сколько сотрудников, какие профессии или программы нужны, сроки" : "Например: какая профессия нужна, есть ли опыт, удобное время для звонка";
    var commentField = comment && comment.closest(".field");
    var dirField = sel && sel.closest(".field");
    if (commentField) commentField.hidden = type === "callback";
    if (dirField) dirField.hidden = type === "callback" || !!program;
    lastFocus = doc.activeElement;
    modal.hidden = false; lock();
    setTimeout(function () { var n = form.elements.name; if (n) n.focus(); }, 60);
    goal("modal_open_" + type);
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true; unlock();
    if (lastFocus) lastFocus.focus();
  }
  doc.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open-modal]");
    if (t) { e.preventDefault(); openModal(t.getAttribute("data-open-modal"), t); return; }
    if (e.target.closest("[data-modal-close]")) closeModal();
  });

  /* ---------- Search overlay ---------- */
  var search = $("[data-search-overlay]"), sInput = $("[data-search-input]"), sResults = $("[data-search-results]"), index = null, focusIdx = -1;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    return fetch("/search-index.json").then(function (r) { return r.json(); }).then(function (d) { index = d; return d; }).catch(function () { index = []; return index; });
  }
  function norm(s) { return s.toLowerCase().replace(/ё/g, "е").trim(); }
  function findPrograms(q) {
    var words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return (index || []).filter(function (it) {
      var s = norm(it.s);
      return words.every(function (w) { return s.indexOf(w) !== -1; });
    });
  }
  function highlight(text, q) {
    var safe = escapeHtml(text);
    norm(q).split(/\s+/).filter(function (w) { return w.length > 1; }).forEach(function (w) {
      safe = safe.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>");
    });
    return safe;
  }
  function renderSearch() {
    var q = sInput.value;
    focusIdx = -1;
    if (!q.trim()) { sResults.innerHTML = ""; return; }
    var hits = findPrograms(q);
    if (!hits.length) {
      sResults.innerHTML = '<div class="search-empty">Ничего не нашли. Попробуйте другое слово или <a class="link-btn" href="#" data-open-modal="consult">оставьте заявку</a> — подскажем.</div>';
      return;
    }
    sResults.innerHTML = hits.slice(0, 8).map(function (h) {
      return '<a class="search-hit" href="' + h.u + '"><b>' + highlight(h.t, q) + "</b><span>" + escapeHtml(h.c) + "</span></a>";
    }).join("") + '<a class="search-all" href="/obuchenie/?q=' + encodeURIComponent(q) + '">Все результаты в каталоге (' + hits.length + ") →</a>";
  }
  function openSearch() {
    if (!search) return;
    if (drawer && !drawer.hidden) closeDrawer();
    lastFocus = doc.activeElement;
    search.hidden = false; lock();
    loadIndex().then(renderSearch);
    setTimeout(function () { sInput.focus(); }, 30);
  }
  function closeSearch() { if (!search || search.hidden) return; search.hidden = true; unlock(); if (lastFocus) lastFocus.focus(); }
  if (search) {
    doc.addEventListener("click", function (e) {
      if (e.target.closest("[data-search-open]")) openSearch();
      else if (e.target.closest("[data-search-close]")) closeSearch();
      else if (e.target.closest(".search-results [data-open-modal]")) closeSearch();
    });
    sInput.addEventListener("input", renderSearch);
    sInput.addEventListener("keydown", function (e) {
      var hits = $$(".search-hit", sResults);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!hits.length) return;
        focusIdx = (focusIdx + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
        hits.forEach(function (h, i) { h.classList.toggle("is-focus", i === focusIdx); });
      } else if (e.key === "Enter" && focusIdx >= 0 && hits[focusIdx]) {
        e.preventDefault(); location.href = hits[focusIdx].href;
      }
    });
  }

  /* ---------- Escape closes overlays ---------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (search && !search.hidden) closeSearch();
    else if (modal && !modal.hidden) closeModal();
    else if (drawer && !drawer.hidden) closeDrawer();
    var lb = $(".lightbox"); if (lb) lb.remove();
  });

  /* ---------- Simple tab filters (home directions, reviews) ---------- */
  function tabFilter(tabsSel, itemsSel, attr) {
    var tabs = $(tabsSel); if (!tabs) return;
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]"); if (!b) return;
      var f = b.getAttribute("data-filter");
      $$("[data-filter]", tabs).forEach(function (t) { var on = t === b; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
      $$(itemsSel).forEach(function (it) {
        var v = it.getAttribute(attr);
        it.classList.toggle("is-hidden", !(f === "all" || v === f || v === "all"));
      });
    });
  }
  tabFilter("[data-cat-tabs]", "[data-cat-grid] > .cat-card", "data-group");
  tabFilter("[data-review-tabs]", ".reviews-grid > .review", "data-type");

  /* ---------- Catalog: search + filters ---------- */
  var catalog = $("[data-catalog]");
  if (catalog) {
    var cq = $("[data-catalog-q]"), state = { q: "", group: "", cat: "" };
    var cards = $$("[data-program-card]", catalog);
    try {
      var p = new URLSearchParams(location.search);
      state.q = p.get("q") || ""; state.group = p.get("group") || ""; state.cat = p.get("cat") || "";
    } catch (e) { /* ignore */ }
    var apply = function () {
      var words = norm(state.q).split(/\s+/).filter(Boolean), shown = 0;
      cards.forEach(function (c) {
        var s = norm(c.getAttribute("data-search") || "");
        var ok = (!state.group || c.getAttribute("data-group") === state.group) &&
          (!state.cat || c.getAttribute("data-cat") === state.cat) &&
          words.every(function (w) { return s.indexOf(w) !== -1; });
        c.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      $("[data-catalog-count]", catalog).textContent = "Найдено программ: " + shown;
      $("[data-catalog-empty]", catalog).hidden = shown > 0;
      $("[data-catalog-reset]", catalog).hidden = !(state.q || state.group || state.cat);
      $$("[data-catalog-groups] [data-group]", catalog).forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-group") === state.group); });
      $$("[data-catalog-cats] li", catalog).forEach(function (li) {
        var g = li.getAttribute("data-group");
        li.classList.toggle("is-hidden", !!(state.group && g && g !== state.group));
        var b = $("button", li); b.classList.toggle("is-active", b.getAttribute("data-cat") === state.cat);
      });
      try {
        var u = new URL(location.href);
        ["q", "group", "cat"].forEach(function (k) { if (state[k]) u.searchParams.set(k, state[k]); else u.searchParams.delete(k); });
        history.replaceState(null, "", u.pathname + (u.search ? u.search : ""));
      } catch (e) { /* ignore */ }
    };
    cq.value = state.q;
    var debounce;
    cq.addEventListener("input", function () { clearTimeout(debounce); debounce = setTimeout(function () { state.q = cq.value; apply(); }, 120); });
    catalog.addEventListener("click", function (e) {
      var g = e.target.closest("[data-catalog-groups] [data-group]");
      if (g) { state.group = g.getAttribute("data-group"); if (state.cat) { var cc = $('[data-catalog-cats] [data-cat="' + state.cat + '"]', catalog); var li2 = cc && cc.closest("li"); if (state.group && li2 && li2.getAttribute("data-group") !== state.group) state.cat = ""; } apply(); return; }
      var c = e.target.closest("[data-catalog-cats] [data-cat]");
      if (c) { state.cat = c.getAttribute("data-cat"); apply(); if (window.innerWidth < 960) $("[data-catalog-grid]", catalog).scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if (e.target.closest("[data-catalog-reset]")) { state = { q: "", group: "", cat: "" }; cq.value = ""; apply(); }
    });
    apply();
  }

  /* ---------- Local search on category page ---------- */
  var lq = $("[data-local-q]");
  if (lq) {
    lq.addEventListener("input", function () {
      var words = norm(lq.value).split(/\s+/).filter(Boolean);
      $$("[data-local-grid] [data-program-card]").forEach(function (c) {
        var s = norm(c.getAttribute("data-search") || "");
        c.classList.toggle("is-hidden", !words.every(function (w) { return s.indexOf(w) !== -1; }));
      });
    });
  }

  /* ---------- Video reviews & lightbox ---------- */
  function embedUrl(u) {
    var m;
    if ((m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/))) return "https://www.youtube.com/embed/" + m[1] + "?autoplay=1";
    if ((m = u.match(/rutube\.ru\/video\/([\w]+)/))) return "https://rutube.ru/play/embed/" + m[1];
    if ((m = u.match(/vk(?:video)?\.(?:com|ru)\/video(-?\d+)_(\d+)/))) return "https://vk.com/video_ext.php?oid=" + m[1] + "&id=" + m[2] + "&autoplay=1";
    return u;
  }
  doc.addEventListener("click", function (e) {
    var v = e.target.closest("[data-video]");
    if (v && !$("iframe", v)) {
      var src = v.getAttribute("data-video");
      if (/\.(mp4|webm)(\?|$)/i.test(src)) v.innerHTML = '<video src="' + escapeHtml(src) + '" controls autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%"></video>';
      else v.innerHTML = '<iframe src="' + escapeHtml(embedUrl(src)) + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="Видеоотзыв"></iframe>';
      return;
    }
    var img = e.target.closest("[data-lightbox-src], img[data-lightbox]");
    if (img) {
      var s = img.getAttribute("data-lightbox-src") || img.getAttribute("src");
      var lb = doc.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Просмотр изображения");
      lb.innerHTML = '<img src="' + escapeHtml(s) + '" alt="">';
      lb.addEventListener("click", function () { lb.remove(); });
      doc.body.appendChild(lb);
    }
  });

  /* ---------- Lazy map ---------- */
  function loadMap(m) {
    if (!m || m.getAttribute("data-loaded")) return;
    m.setAttribute("data-loaded", "1");
    var f = doc.createElement("iframe");
    f.src = m.getAttribute("data-src"); f.title = "Карта: как нас найти"; f.loading = "lazy"; f.allowFullscreen = true;
    m.appendChild(f);
    f.addEventListener("load", function () { var ph = $(".map-placeholder", m); if (ph) ph.remove(); });
  }
  doc.addEventListener("click", function (e) { var b = e.target.closest("[data-map-load]"); if (b) loadMap(b.closest("[data-map]")); });
  if ("IntersectionObserver" in window) {
    var mio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { loadMap(x.target); mio.unobserve(x.target); } }); }, { rootMargin: "300px" });
    $$("[data-map]").forEach(function (m) { mio.observe(m); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-visible"); rio.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("is-visible"); });

  /* ---------- Phone mask ---------- */
  function nationalDigits(v) {
    var s = String(v).trim(), d = s.replace(/\D/g, "");
    if (/^\+7/.test(s)) d = d.slice(1);
    if (d.length > 10 && (d[0] === "7" || d[0] === "8")) d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(d) {
    if (!d) return "";
    var out = "+7 (" + d.slice(0, 3);
    if (d.length >= 3) out += ") " + d.slice(3, 6);
    if (d.length >= 6) out += "-" + d.slice(6, 8);
    if (d.length >= 8) out += "-" + d.slice(8, 10);
    return out;
  }
  function phoneValid(v) { var d = nationalDigits(v); return d.length === 10 && /^[3489]/.test(d); }
  $$("[data-phone]").forEach(function (inp) {
    var prev = "";
    inp.addEventListener("focus", function () { if (!inp.value) inp.value = "+7 ("; });
    inp.addEventListener("blur", function () { if (inp.value === "+7 (" || inp.value === "+7") inp.value = ""; });
    inp.addEventListener("input", function (e) {
      var d = nationalDigits(inp.value);
      if (e.inputType === "deleteContentBackward" && d === prev && d.length) d = d.slice(0, -1);
      if (prev === "" && (d === "8" || d === "7")) d = ""; // trunk prefix typed after +7
      prev = d;
      inp.value = formatPhone(d) || (doc.activeElement === inp ? "+7 (" : "");
      if (inp.closest(".field").classList.contains("has-error") && phoneValid(inp.value)) setError(inp, "");
    });
    inp.addEventListener("paste", function () { setTimeout(function () { var d = nationalDigits(inp.value); prev = d; inp.value = formatPhone(d); }, 0); });
  });

  /* ---------- Forms ---------- */
  function setError(input, msg) {
    var box = input.closest(".field") || input.closest(".consent");
    if (box) box.classList.toggle("has-error", !!msg);
    var err = input.type === "checkbox" ? $(".field-error--consent", input.form) : box && $(".field-error", box);
    if (err) err.textContent = msg;
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }
  function validate(form) {
    var ok = true, first = null, f = form.elements;
    var name = f.name.value.trim();
    if (name.length < 2) { setError(f.name, "Укажите, как к вам обращаться"); ok = false; first = first || f.name; } else setError(f.name, "");
    if (!phoneValid(f.phone.value)) { setError(f.phone, "Введите номер полностью: +7 (XXX) XXX-XX-XX"); ok = false; first = first || f.phone; } else setError(f.phone, "");
    if (!f.consent.checked) { setError(f.consent, "Нужно согласие на обработку персональных данных"); ok = false; first = first || f.consent; } else setError(f.consent, "");
    if (first) first.focus();
    return ok;
  }
  function resetForm(form) {
    if (!form) return;
    var s = $(".form-success", form.parentElement); if (s) s.remove();
    form.hidden = false; form.classList.remove("is-loading");
    $(".form-status", form).textContent = ""; $(".form-status", form).className = "form-status";
    $$(".has-error", form).forEach(function (el) { el.classList.remove("has-error"); });
    $$(".field-error", form).forEach(function (el) { el.textContent = ""; });
  }
  $$("[data-lead-form]").forEach(function (form) {
    form.addEventListener("change", function (e) { if (e.target.name === "consent" && e.target.checked) setError(e.target, ""); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-loading")) return;
      var status = $(".form-status", form);
      status.textContent = ""; status.className = "form-status";
      if (!validate(form)) return;
      var f = form.elements, data = {
        formType: f.formType.value, name: f.name.value.trim(), phone: "+7" + nationalDigits(f.phone.value),
        direction: f.direction ? f.direction.value : "", program: f.program.value, comment: f.comment ? f.comment.value.trim() : "",
        company: f.company ? f.company.value.trim() : "", consent: f.consent.checked, website: f.website.value,
        page: location.href, title: doc.title, utm: {}
      };
      try { ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) { var v = sessionStorage.getItem(k); if (v) data.utm[k] = v; }); } catch (err) { /* ignore */ }
      form.classList.add("is-loading");
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
      fetch(form.getAttribute("action") || SITE.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j && j.ok === true, body: j }; });
      }).then(function (res) {
        clearTimeout(timer);
        form.classList.remove("is-loading");
        if (!res.ok) throw new Error((res.body && res.body.error) || "");
        goal("lead_sent"); goal("lead_" + data.formType);
        var succ = doc.createElement("div");
        succ.className = "form-success"; succ.setAttribute("role", "status");
        succ.innerHTML = '<span class="form-success-ico"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19.5 7"/></svg></span><h3>Заявка отправлена</h3><p>Спасибо, ' + escapeHtml(data.name) + "! Мы свяжемся с вами по номеру " + escapeHtml(formatPhone(nationalDigits(data.phone))) + ".</p>";
        form.hidden = true;
        form.parentElement.insertBefore(succ, form.nextSibling);
        form.reset();
        if (f.program) f.program.value = data.program;
      }).catch(function (err) {
        clearTimeout(timer);
        form.classList.remove("is-loading");
        status.className = "form-status is-error";
        var msg = err && err.message && err.message.length < 200 ? escapeHtml(err.message) : "Не удалось отправить заявку.";
        status.innerHTML = msg + " Пожалуйста, позвоните нам: " + phonesHtml() + ".";
      });
    });
  });

  /* ---------- Fill "page" hidden fields ---------- */
  $$('input[name="page"]').forEach(function (i) { i.value = location.pathname; });
})();
