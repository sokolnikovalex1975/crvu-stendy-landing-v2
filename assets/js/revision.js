(function (w, d) {
  'use strict';
  var CRVU = w.CRVU, CFG = w.CRVU_CONFIG || {}, $ = CRVU.$, nb = CRVU.nb;
  if (!CRVU) { return; }

  /* Нижняя панель на мобильном появляется после первого экрана и не дублирует кнопки hero */
  var hero = $('#top');
  if ('IntersectionObserver' in w && hero) {
    new IntersectionObserver(function (e) { d.body.classList.toggle('past-hero', !e[0].isIntersecting); }, { threshold: 0.12 }).observe(hero);
  } else { d.body.classList.add('past-hero'); }

  /* Быстрая форма: телефон и имя; без обязательной площади */
  var qf = $('#quickForm');
  if (qf) {
    var n = $('#quickName'), p = $('#quickPhone'), c = $('#quickConsent'), st = $('#quickStatus'), b = qf.querySelector('button'), html = b.innerHTML, busy = false;
    CRVU.maskPhone(p); CRVU.autoClear(qf);
    qf.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) { return; }
      st.hidden = true; var bad = null;
      function fail(el, msg) { CRVU.showErr(el, msg); if (!bad) { bad = el; } }
      if (!n.value.trim()) { fail(n, 'Укажите, как к вам обращаться.'); }
      if (!CRVU.isPhone(p.value)) { fail(p, 'Введите российский номер: +7 916 123-45-67.'); }
      if (!c.checked) { fail(c, 'Поставьте отметку согласия, чтобы продолжить.'); }
      if (bad) { bad.focus(); return; }
      busy = true; b.disabled = true; b.textContent = 'Подготавливаем…';
      var payload = { data: { form: 'quick', ts: new Date().toISOString(), page: w.location.href, utm: CRVU.utm(), name: n.value.trim(), phone: '+7' + CRVU.phoneDigits(p.value), consent: true } };
      CRVU.withTimeout(CRVU.submitLead(payload, 'quick'))
        .then(function () { st.textContent = nb(CFG.preview ? 'Черновик обращения подготовлен. Он НЕ отправлен в ЦРВУ: это версия для проверки.' : 'Обращение передано. Менеджер свяжется в рабочее время.'); st.hidden = false; if (!CFG.preview) { qf.reset(); } CRVU.track('quick_submit'); })
        .catch(function (er) { st.textContent = nb(er && er.message === 'not-configured' ? 'Приём заявок ещё не подключён. Позвоните +7 (495) 106-70-22.' : 'Не удалось передать обращение. Позвоните +7 (495) 106-70-22 или напишите manager@crvu.ru.'); st.hidden = false; })
        .then(function () { busy = false; b.disabled = false; b.innerHTML = html; });
    });
  }

  /* Квиз: «площадь не знаю», LED и второй этаж */
  var unknown = $('#qAreaUnknown'), area = $('#qArea');
  if (unknown && area) {
    unknown.addEventListener('change', function () { area.disabled = unknown.checked; if (unknown.checked) { area.value = ''; CRVU.clearErr(area); } });
  }
  function syncExtras() {
    var led = d.querySelector('input[name=qx][value="LED-экран"]'), fl = d.querySelector('input[name=qx][value="Второй этаж"]');
    if ($('#qLedWrap') && led) { $('#qLedWrap').hidden = !led.checked; }
    if ($('#qFloorWrap') && fl) { $('#qFloorWrap').hidden = !fl.checked; }
  }
  CRVU.syncQuizExtras = syncExtras;
  d.addEventListener('change', function (e) { if (e.target && e.target.name === 'qx') { syncExtras(); } });
  syncExtras();

  /* Загрузка черновика при проверке (вместо ложной «успешной отправки») */
  d.addEventListener('click', function (e) {
    if (!e.target.closest('[data-download-draft]') || !CRVU.lastDraft) { return; }
    var blob = new Blob([JSON.stringify(CRVU.lastDraft, null, 2)], { type: 'application/json' });
    var a = d.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crvu-draft.json'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  /* Согласие и Метрика подключаются только в рабочей конфигурации */
  function hasConsent() { return /(?:^|;\s*)crvu_consent=1/.test(d.cookie); }
  if (hasConsent()) { w.CRVU_ANALYTICS_CONSENT = true; }
  else if (!CFG.preview && CFG.analyticsEnabled) {
    var bar = d.createElement('div'); bar.className = 'cookie'; bar.innerHTML = '<p>Мы используем cookie для статистики. <a href="https://crvu.ru/policy" target="_blank" rel="noopener">Политика</a></p><button class="btn btn--accent btn--sm" type="button">Принять</button>';
    bar.querySelector('button').addEventListener('click', function () { d.cookie = 'crvu_consent=1; max-age=31536000; path=/; SameSite=Lax; Secure'; w.CRVU_ANALYTICS_CONSENT = true; bar.remove(); });
    d.body.appendChild(bar);
  }
})(window, document);
