/*!
 * ЦРВУ — квиз-заявка (4 шага), форма для закупок и тендеров.
 * Отправка — заглушка CRVU.submitLead (core.js): подключите CRM или почту manager@crvu.ru, см. README.
 */
(function (w, d) {
  'use strict';

  var CRVU = w.CRVU, D = w.CRVU_DATA || { expos: [] };
  var $ = CRVU.$, $$ = CRVU.$$, nb = CRVU.nb;
  var PHONE = '+7 (495) 106-70-22';
  var MSG = {
    area: 'Введите площадь стенда в м².',
    phone: 'Введите телефон с кодом, например +7 (495) 106-70-22.',
    name: 'Укажите, как к вам обращаться.',
    email: 'Проверьте email: похоже, в адресе ошибка.',
    consent: 'Поставьте галочку согласия, чтобы отправить заявку.',
    fileType: 'Этот формат не подходит. Загрузите PDF, DWG, JPG или PNG.',
    fileSize: 'Файл больше 25 МБ. Сожмите его или пришлите ссылку в комментарии.',
    fail: 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните ' + PHONE + ', ежедневно с 9:30 до 18:30.',
    offline: 'Нет соединения. Проверьте интернет и повторите отправку. Введённые данные сохранены.',
    slow: 'Сервер отвечает дольше обычного. Подождите минуту или позвоните ' + PHONE + '.'
  };
  var TIMEOUT = 15000;

  CRVU.maskPhone($('#qPhone'));
  CRVU.maskPhone($('#prPhone'));

  function withTimeout(promise) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timeout')); }, TIMEOUT);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function failText(err) {
    if (w.navigator && w.navigator.onLine === false) { return MSG.offline; }
    if (err && err.message === 'timeout') { return MSG.slow; }
    return MSG.fail;
  }
  function moscowMinutes() {
    try {
      var parts = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) { if (p.type === 'hour') { h = +p.value; } if (p.type === 'minute') { m = +p.value; } });
      return h * 60 + m;
    } catch (e) {
      var t = new Date(Date.now() + 3 * 3600 * 1000);
      return t.getUTCHours() * 60 + t.getUTCMinutes();
    }
  }
  function venueFor(name) {
    var n = String(name || '');
    if (/Крокус/i.test(n)) { return 'Крокус Экспо'; }
    if (/Тимирязев/i.test(n)) { return 'Тимирязев Центр'; }
    if (/ВДНХ/i.test(n)) { return 'ВДНХ'; }
    if (/Экспоцентр/i.test(n)) { return 'Экспоцентр'; }
    if (/Экспофорум/i.test(n)) { return 'Экспофорум'; }
    return 'Другая площадка';
  }
  function fmtSize(b) {
    return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' КБ' : (b / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  }
  function field(form, name) { return form.querySelector('[name="' + name + '"]'); }
  function val(el) { return el ? el.value.trim() : ''; }

  /* ================================================================== квиз */
  var form = $('#quizForm');
  if (form) {
    var steps = $$('.qstep', form), bars = $$('.quiz__bar i'), prog = $('#qProg');
    var back = $('#qBack'), next = $('#qNext'), submit = $('#qSubmit'), okBox = $('#quizOk');
    var area = $('#qArea'), expoSel = $('#qExpo'), dateWrap = $('#qDateWrap'), dateInp = $('#qDate'), venueSel = $('#qVenue'), hint = $('#qExpoHint');
    var fileInp = $('#qFile'), drop = $('#qDrop'), fileOk = $('#qFileOk'), fileName = $('#qFileName'), fileSize = $('#qFileSize'), fileRm = $('#qFileRm'), fileErr = $('#qFile-e');
    var later = $('#qLater'), comment = $('#qComment');
    var nameI = $('#qName'), phoneI = $('#qPhone'), emailI = $('#qEmail'), consent = $('#qConsent'), hp = $('#qHp'), err = $('#qErr');
    var venueManual=false;venueSel.addEventListener('change',function(){venueManual=true;});
    var cur = 1, started = false, file = null, busy = false, source = 'direct', submitHtml = submit.innerHTML;

    CRVU.autoClear(form);

    /* список выставок */
    D.expos.forEach(function (e) {
      var o = d.createElement('option');
      o.value = e.id;
      o.textContent = e.name + ' — ' + e.dates;
      expoSel.appendChild(o);
    });
    [['other', 'Другая выставка'], ['unknown', 'Пока не знаю']].forEach(function (p) {
      var o = d.createElement('option');
      o.value = p[0]; o.textContent = p[1];
      expoSel.appendChild(o);
    });

    function onExpo() {
      var id = expoSel.value;
      dateWrap.hidden = id !== 'other';
      hint.hidden = true;
      hint.classList.remove('plan__status--hot');
      if (id && id !== 'other' && id !== 'unknown') {
        var e = null;
        D.expos.forEach(function (x) { if (x.id === id) { e = x; } });
        if (e && !venueManual) { venueSel.value = venueFor(e.venue); }
        var h = CRVU.planner && CRVU.planner.hint(id);
        if (h && h.kind !== 'gone') {
          hint.textContent = nb(h.text);
          hint.classList.toggle('plan__status--hot', h.kind === 'hot' || h.kind === 'call');
          hint.hidden = false;
        }
      }
    }
    expoSel.addEventListener('change', onExpo);

    /* шаги */
    function showStep(n, focus) {
      cur = n;
      steps.forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== n; });
      bars.forEach(function (b, i) { b.className = i + 1 < n ? 'is-done' : (i + 1 === n ? 'is-cur' : ''); });
      prog.textContent = 'Шаг ' + n + ' из ' + steps.length;
      back.hidden = n === 1;
      next.hidden = n === steps.length;
      submit.hidden = n !== steps.length;
      if (focus) {
        var h = $('#qs' + n);
        if (h) {
          h.setAttribute('tabindex', '-1');
          try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); }
          var r = form.getBoundingClientRect();
          if (r.top < 90 || r.top > w.innerHeight * 0.6) { w.scrollTo({ top: r.top + (w.pageYOffset || 0) - 110, behavior: CRVU.reduced ? 'auto' : 'smooth' }); }
        }
      }
    }
    function parseArea(v) {
      var s = String(v).replace(/\s/g, '').replace(',', '.');
      return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
    }
    function validate(n) {
      var bad = null;
      function fail(el, msg) { CRVU.showErr(el, msg); if (!bad) { bad = el; } }
      if (n === 1) {
        var S = parseArea(area.value);
        if (!$('#qAreaUnknown').checked && (!isFinite(S) || S <= 0)) { fail(area, MSG.area); }
        else if (S > 5000) { fail(area, 'Проверьте площадь: введите значение в м².'); }
      }
      if (n === 4) {
        if (!nameI.value.trim()) { fail(nameI, MSG.name); }
        if (!CRVU.isPhone(phoneI.value)) { fail(phoneI, MSG.phone); }
        if (emailI.value.trim() && !CRVU.isEmail(emailI.value)) { fail(emailI, MSG.email); }
        if (!consent.checked) { fail(consent, MSG.consent); }
      }
      if (bad) { bad.focus(); return false; }
      return true;
    }
    function goNext() {
      if (!validate(cur)) { return; }
      showStep(cur + 1, true);
      CRVU.track('quiz_step_' + cur);
    }
    next.addEventListener('click', goNext);
    back.addEventListener('click', function () { err.hidden = true; showStep(cur - 1, true); });

    ['input', 'change', 'focusin'].forEach(function (ev) {
      form.addEventListener(ev, function () {
        if (!started) { started = true; CRVU.track('quiz_start'); }
      });
    });

    /* файл плана площадки */
    function fileProblem(msg) {
      fileErr.textContent = nb(msg);
      fileErr.hidden = false;
      drop.classList.add('has-error');
      fileInp.setAttribute('aria-invalid', 'true');
      fileInp.value = '';
    }
    function fileClear() {
      fileErr.hidden = true; fileErr.textContent = '';
      drop.classList.remove('has-error');
      fileInp.setAttribute('aria-invalid', 'false');
    }
    function setFile(f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (['pdf', 'dwg', 'jpg', 'jpeg', 'png'].indexOf(ext) < 0) { fileProblem(MSG.fileType); return; }
      if (f.size > 25 * 1024 * 1024) { fileProblem(MSG.fileSize); return; }
      fileClear();
      file = f;
      fileName.textContent = f.name;
      fileSize.textContent = fmtSize(f.size);
      fileOk.hidden = false;
      drop.hidden = true;
      later.checked = false;
      CRVU.track('upload_plan', { ext: ext });
    }
    function removeFile() {
      file = null;
      fileInp.value = '';
      fileOk.hidden = true;
      drop.hidden = false;
      fileClear();
    }
    fileInp.addEventListener('change', function () { var f = fileInp.files && fileInp.files[0]; if (f) { setFile(f); } });
    fileRm.addEventListener('click', function () { removeFile(); try { fileInp.focus(); } catch (e) { /* ничего */ } });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) { setFile(f); }
    });
    later.addEventListener('change', function () { if (later.checked && file) { removeFile(); } });

    /* сбор данных */
    function checkedValues(name) { return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); }
    function collect() {
      var e = null, id = expoSel.value;
      D.expos.forEach(function (x) { if (x.id === id) { e = x; } });
      var type = checkedValues('qtype')[0] || '', level = checkedValues('qlevel')[0] || '';
      var typeLabel = type && D.calculator && D.calculator.types[type] ? D.calculator.types[type].label : '';
      var levelLabel = level === 'unknown' ? 'не знаю' : (level && D.calculator && D.calculator.levels[level] ? D.calculator.levels[level].label : '');
      return {
        form: 'quiz', source: source, ts: new Date().toISOString(), page: w.location.href, utm: CRVU.utm(),
        stand: { area: $('#qAreaUnknown').checked ? null : parseArea(area.value), type: type, typeLabel: typeLabel, level: level, levelLabel: levelLabel, extras: checkedValues('qx'), ledCount:field(form,'qx')&&checkedValues('qx').indexOf('LED-экран')>=0?parseInt($('#qLedCount').value,10)||1:0, floorArea:checkedValues('qx').indexOf('Второй этаж')>=0?parseArea($('#qFloorArea').value)||null:null },
        expo: { id: id, name: e ? e.name : (id === 'other' ? 'Другая выставка' : (id === 'unknown' ? 'Пока не знаю' : '')), dates: e ? e.dates : '', openDate: id === 'other' ? dateInp.value : (e ? e.open : ''), venue: venueSel.value },
        plan: file ? { name: file.name, size: file.size, type: file.type } : (later.checked ? 'пришлёт позже' : null),
        show: checkedValues('qshow'), weight: val($('#qWeight')), comment: comment.value.trim(),
        contact: { name: nameI.value.trim(), phone: '+7' + CRVU.phoneDigits(phoneI.value), email: emailI.value.trim(), company: val($('#qCompany')) },
        consent: true
      };
    }

    function okText(hasPlan) {
      if(w.CRVU_CONFIG.preview)return 'Черновик подготовлен в вашем браузере. Заявка и файл НЕ отправлены в ЦРВУ.';
      var m = moscowMinutes();
      if (m < 570) { return 'Заявка принята. Мы работаем с 9:30 до 18:30. Начнём расчёт сегодня с 9:30.'; }
      if (m >= 1110) { return 'Заявка принята. Мы работаем с 9:30 до 18:30. Начнём расчёт завтра с 9:30.'; }
      return hasPlan
        ? 'Заявка принята. Предварительную смету по вашему плану пришлём в течение 60 минут в рабочее время (ежедневно 9:30–18:30). Если заявка пришла вечером, ответим утром.'
        : 'Заявка принята. Менеджер уточнит детали и запросит план площадки. Предварительную смету подготовим в течение 60 минут после получения плана в рабочее время (ежедневно 9:30–18:30).';
    }
    function showOk(data) {
      $('#quizOkTitle').textContent = (w.CRVU_CONFIG.preview?'Черновик готов':'Заявка передана');
      $('#quizOkText').textContent = nb(okText(!!file));
      var rows = [];
      if (data.stand.area) { rows.push(['Площадь', CRVU.fmtArea(data.stand.area) + ' м²']); }
      if (data.stand.typeLabel) { rows.push(['Тип стенда', data.stand.typeLabel]); }
      if (data.stand.levelLabel) { rows.push(['Уровень', data.stand.levelLabel]); }
      if (data.expo.name) { rows.push(['Выставка', data.expo.name + (data.expo.dates ? ', ' + data.expo.dates : '')]); }
      if (file) { rows.push(['План площадки', file.name]); }
      rows.push(['Контакт', data.contact.name + ', ' + phoneI.value]);
      $('#quizSum').innerHTML = rows.map(function (r) { return '<div><dt>' + CRVU.esc(r[0]) + '</dt><dd>' + CRVU.esc(nb(r[1])) + '</dd></div>'; }).join('');
      form.hidden = true;
      okBox.hidden = false;
      try { okBox.focus({ preventScroll: true }); } catch (e) { okBox.focus(); }
      var r = okBox.getBoundingClientRect();
      if (r.top < 90 || r.top > w.innerHeight * 0.5) { w.scrollTo({ top: r.top + (w.pageYOffset || 0) - 110, behavior: CRVU.reduced ? 'auto' : 'smooth' }); }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) { return; }
      if (cur < steps.length) { goNext(); return; }
      if (!validate(4)) { return; }
      err.hidden = true;
      var data = collect();
      if (hp.value) { showOk(data); return; }   /* поле-ловушка для ботов заполнено: молча «успех» без отправки */
      busy = true;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      submit.textContent=w.CRVU_CONFIG.preview?'Готовим черновик…':'Отправляем…';
      withTimeout(CRVU.submitLead({ data: data, file: file }, 'quiz'))
        .then(function () {
          CRVU.track('quiz_submit', { area: data.stand.area, level: data.stand.level || 'none' });
          showOk(data);
        })
        .catch(function (er) {
          err.textContent = nb(failText(er));
          err.hidden = false;
        })
        .then(function () {
          busy = false;
          submit.disabled = false;
          submit.removeAttribute('aria-busy');
          submit.innerHTML = submitHtml;
        });
    });

    /* подстановка данных из калькулятора, планировщика, кейсов */
    function setChecked(name, value, on) {
      $$('input[name="' + name + '"]', form).forEach(function (i) { if (i.value === value) { i.checked = on; } });
    }
    function reset() {
      form.reset();
      removeFile();
      form.hidden = false;
      okBox.hidden = true;
      err.hidden = true;
      dateWrap.hidden = true;
      hint.hidden = true;
      $$('.has-error', form).forEach(function (f) { f.classList.remove('has-error'); });
      $$('.err', form).forEach(function (f) { f.hidden = true; });
      $$('[aria-invalid="true"]', form).forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
      started = false;
      showStep(1, false);
    }
    $('#quizAgain').addEventListener('click', function () { reset(); area.focus(); });

    CRVU.quiz = {
      reset: reset,
      prefill: function (o, src) {
        if (src) { source = src; }
        if (!okBox.hidden) { reset(); }
        var any = false;
        if (o.area) { $('#qAreaUnknown').checked=false;area.disabled=false;area.value = CRVU.fmtArea(o.area); any = true; CRVU.clearErr(area); }
        if (o.type) { setChecked('qtype', o.type, true); any = true; }
        if (o.level) { setChecked('qlevel', o.level, true); any = true; }
        if (Array.isArray(o.extras)) {
          $$('input[name="qx"]', form).forEach(function (i) { i.checked = o.extras.indexOf(i.value) >= 0; });
          any = true;
        }
        if(o.ledCount!==undefined){$('#qLedCount').value=o.ledCount||1;}if(o.floorArea!==undefined){$('#qFloorArea').value=o.floorArea||'';}if(CRVU.syncQuizExtras)CRVU.syncQuizExtras();
        if (o.expo) {
          expoSel.value = o.expo;
          if (expoSel.value !== o.expo) { expoSel.value = 'other'; }
          if (o.date) { dateInp.value = o.date; }
          any = true;
        }
        if (o.venueLabel) {
          var v = venueFor(o.venueLabel);
          venueSel.value = v;
        }
        if (o.expo) { onExpo(); }
        if (o.comment) {
          if(src==='calculator'){comment.value=comment.value.split('\n').filter(function(l){return l.indexOf('Ориентир из калькулятора:')!==0;}).join('\n').trim();}
          if (comment.value && comment.value.indexOf(o.comment) < 0) { comment.value += '\n' + o.comment; } else { comment.value = o.comment; }
          any = true;
        }
        if (any) {
          var ok = isFinite(parseArea(area.value)) && parseArea(area.value) > 0;
          showStep(o.expo && ok ? 2 : 1, false);
        }
      }
    };

    showStep(1, false);
  }

  /* ================================================================== форма «для закупок и тендеров» */
  var pf = $('#procForm');
  if (pf) {
    var pErr = $('#prErr'), pOk = $('#prOk'), pBusy = false;
    var pBtn = pf.querySelector('button[type=submit]'), pBtnHtml = pBtn.innerHTML;
    CRVU.autoClear(pf);
    var pCompany = $('#prCompany'), pName = $('#prName'), pEmail = $('#prEmail'), pPhone = $('#prPhone'), pConsent = $('#prConsent');
    pf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (pBusy) { return; }
      pErr.hidden = true; pOk.hidden = true;
      var bad = null;
      function fail(el, msg) { CRVU.showErr(el, msg); if (!bad) { bad = el; } }
      if (!pCompany.value.trim()) { fail(pCompany, 'Укажите название компании.'); }
      if (!pName.value.trim()) { fail(pName, MSG.name); }
      if (!CRVU.isEmail(pEmail.value)) { fail(pEmail, MSG.email); }
      if (pPhone.value.trim() && !CRVU.isPhone(pPhone.value)) { fail(pPhone, MSG.phone); }
      if (!pConsent.checked) { fail(pConsent, MSG.consent); }
      if (bad) { bad.focus(); return; }
      var hpEl = pf.querySelector('.hp input');
      var data = {
        form: 'procurement', ts: new Date().toISOString(), page: w.location.href, utm: CRVU.utm(),
        company: pCompany.value.trim(), name: pName.value.trim(), role: val($('#prRole')), email: pEmail.value.trim(),
        phone: pPhone.value.trim()?'+7'+CRVU.phoneDigits(pPhone.value):'', procedure: val($('#prProc')), consent: true
      };
      function done() {
        pOk.textContent = nb((w.CRVU_CONFIG.preview?'Черновик готов. Запрос НЕ отправлен в ЦРВУ.':'Запрос передан. Пакет документов подготовим для указанного email.'));
        pOk.hidden = false;
        if(!w.CRVU_CONFIG.preview)pf.reset();
      }
      if (hpEl && hpEl.value) { done(); return; }
      pBusy = true; pBtn.disabled = true; pBtn.textContent=w.CRVU_CONFIG.preview?'Готовим черновик…':'Отправляем…';
      withTimeout(CRVU.submitLead({ data: data }, 'procurement'))
        .then(function () { CRVU.track('doc_procurement'); done(); })
        .catch(function (er) { pErr.textContent = nb(failText(er)); pErr.hidden = false; })
        .then(function () { pBusy = false; pBtn.disabled = false; pBtn.innerHTML = pBtnHtml; });
    });
  }
})(window, document);
