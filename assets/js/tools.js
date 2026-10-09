/*!
 * ЦРВУ — инструменты: калькулятор-ориентир и планировщик сроков.
 * Данные и коэффициенты берутся из CRVU_DATA (assets/js/data.js).
 */
(function (w, d) {
  'use strict';

  var CRVU = w.CRVU, D = w.CRVU_DATA;
  var $ = CRVU.$, $$ = CRVU.$$;
  var nb = CRVU.nb, esc = CRVU.esc;
  if (!D) { return; }

  var PHONE = '+7 (495) 106-70-22';
  var ARROW = '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>';

  /* ================================================================== калькулятор */
  (function calc() {
    var form = $('#calcForm');
    if (!form) { return; }
    var C = D.calculator;
    var area = $('#cArea'), led = $('#cLed'), ledWrap = $('#cLedWrap'), ledOut = $('#cLedQty'), venue = $('#cVenue');
    var empty = $('#calcEmpty'), out = $('#calcOut'), val = $('#calcVal'), sub = $('#calcSub'), vnote = $('#calcVenueNote');
    var fail = $('#calcFail'), levelErr = $('#cLevel-e'), resBox = $('#calcRes');
    var toQuiz = $('#calcToQuiz'), pdfBtn = $('#calcPdfBtn'), pdfBox = $('#pdfBox');
    var qty = 1, shown = false, last = null;

    CRVU.autoClear(form);

    function radio(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
    function on(name) { var c = form.querySelector('input[name="' + name + '"]'); return !!(c && c.checked); }
    function parseArea(v) {
      var s = String(v).replace(/\s/g, '').replace(',', '.');
      if (!/^\d+(\.\d+)?$/.test(s)) { return NaN; }
      return parseFloat(s);
    }

    function validate(showErrors) {
      var ok = true, S = parseArea(area.value), msg = '';
      if (!area.value.trim() || !isFinite(S)) { msg = 'Введите площадь стенда в м².'; }
      else if (S < C.areaMin) { msg = 'Для стендов меньше 10 м² пришлите план: посчитаем вручную.'; }
      else if (S > C.areaMax) { msg = 'Для стендов больше 300 м² рассчитываем индивидуально: пришлите план площадки.'; }
      if (msg) { if (showErrors) { CRVU.showErr(area, msg); } ok = false; } else { CRVU.clearErr(area); }
      var level = radio('clevel');
      if (!level) {
        if (showErrors) { levelErr.textContent = 'Выберите уровень стенда.'; levelErr.hidden = false; }
        ok = false;
      } else { levelErr.hidden = true; }
      var fArea=$('#cFloorArea');
      if(on('cfloor2')&&(!isFinite(parseArea(fArea.value))||parseArea(fArea.value)<=0||parseArea(fArea.value)>S)){if(showErrors)CRVU.showErr(fArea,'Укажите площадь второго этажа: больше 0 и не больше площади стенда.');ok=false;}else{CRVU.clearErr(fArea);}
      if (!ok) { return null; }
      return { S: S, level: level, type: radio('ctype') || 'linear', floor2: on('cfloor2'), susp: on('csusp'), urgent: on('curgent'), floorArea: on('cfloor2') ? parseArea($('#cFloorArea').value) : 0, led: led.checked ? qty : 0 };
    }

    function compute(s) {
      var lv=C.levels[s.level],knots=[{s:10,k:1.10},{s:60,k:1.00},{s:100,k:0.92},{s:300,k:0.88}],kA=knots[0].k;
      for(var i=1;i<knots.length;i++){if(s.S<=knots[i].s){var left=knots[i-1],right=knots[i];kA=left.k+(right.k-left.k)*(s.S-left.s)/(right.s-left.s);break;}}
      var kT=C.types[s.type].k,baseLo=s.S*lv.min*kA*kT,baseHi=s.S*lv.max*kA*kT;
      var lo=baseLo,hi=baseHi;
      if(s.floor2){lo+=s.floorArea*lv.min*1.15;hi+=s.floorArea*lv.max*1.30;}
      if(s.susp){lo+=baseLo*C.suspended.min;hi+=baseHi*C.suspended.max;}
      if(s.urgent){lo+=baseLo*C.urgency.min;hi+=baseHi*C.urgency.max;}
      lo+=s.led*C.ledPrice;hi+=s.led*C.ledPrice;
      lo=Math.round(lo/C.round)*C.round;hi=Math.round(hi/C.round)*C.round;
      if(!isFinite(lo)||!isFinite(hi)||lo<=0||hi<lo)throw new Error('calc');
      return {lo:lo,hi:lv.openEnded?null:hi};
    }
    function venueNote(key){return key?'Расходы и сроки площадки проверяем по руководству участника конкретной выставки. В расчёт не включены техконтроль, аренда площади и инженерные подключения.':'';}
    function render(s, r) {
      val.innerHTML =
        '<span class="res__line"><i>от</i><span>' + CRVU.fmtNum(r.lo) + '</span><span class="cur">₽</span></span>' +
        (r.hi===null ? '<span class="res__individual">Верхняя граница — по проекту</span>' : '<span class="res__line"><i>до</i><span>' + CRVU.fmtNum(r.hi) + '</span><span class="cur">₽</span></span>');
      var txt='Демонстрационная модель: '+CRVU.fmtArea(s.S)+' м², '+C.levels[s.level].label+'. Это не цена предложения ЦРВУ.';
      if(s.floor2)txt+=' Площадь второго этажа: '+CRVU.fmtArea(s.floorArea)+' м².';
      if(s.led)txt+=' LED-экранов: '+s.led+'. Размер и тариф уточняются отдельно.';
      sub.textContent = nb(txt);
      var note = venueNote(venue.value);
      vnote.textContent = nb(note);
      vnote.hidden = !note;
      empty.hidden = true;
      out.hidden = false;
    }

    function labels(s) {
      var x = [];
      if (s.floor2) { x.push('Второй этаж'); }
      if (s.susp) { x.push('Подвесные элементы'); }
      if (s.led) { x.push('LED-экран'); }
      if (s.urgent) { x.push('Срочно'); }
      return x;
    }

    function run(explicit) {
      fail.hidden = true;
      var s = validate(explicit);
      if (!s) {
        empty.hidden=false;out.hidden=true;last=null;pdfBox.hidden=true;
        if (explicit) {
          var bad = area.getAttribute('aria-invalid') === 'true' ? area : form.querySelector('input[name="clevel"]');
          if (bad) { bad.focus(); }
        }
        return;
      }
      try {
        var r = compute(s);
        render(s, r);
        shown = true;
        last = { S: s.S, type: s.type, level: s.level, extras: labels(s), ledCount:s.led, floorArea:s.floorArea, venue: venue.value, lo: r.lo, hi: r.hi, demonstration:!(w.CRVU_CONFIG||{}).pricingVerified };
        if (explicit) {
          CRVU.track('calc_result', { area: s.S, level: s.level, type: s.type });
          var rect = resBox.getBoundingClientRect();
          if (rect.top > w.innerHeight * 0.75 || rect.bottom < 0) {
            w.scrollTo({ top: rect.top + (w.pageYOffset || 0) - 88, behavior: CRVU.reduced ? 'auto' : 'smooth' });
          }
        }
      } catch (err) {
        fail.textContent = nb('Не удалось показать ориентир. Пришлите план площадки: посчитаем за 60 минут.');
        fail.hidden = false;
      }
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });
    ['input', 'change', 'focusin'].forEach(function (ev) {
      form.addEventListener(ev, function () { CRVU.trackOnce('calc_start'); });
    });
    form.addEventListener('input', function () { if (shown) { run(false); } });
    form.addEventListener('change', function () { if (shown) { run(false); } });

    /* LED: счётчик 1–6 */
    function syncLed() { ledWrap.hidden = !led.checked; ledOut.textContent = String(qty); }
    led.addEventListener('change', syncLed);
    ledWrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]');
      if (!b) { return; }
      qty = Math.max(1, Math.min(C.ledMax, qty + parseInt(b.getAttribute('data-step'), 10)));
    syncLed();
      if (shown) { run(false); }
    });

    /* переход к заявке с переносом параметров */
    toQuiz.addEventListener('click', function () {
      if (!last) { return; }
      var vOpt = venue.options[venue.selectedIndex];
      CRVU.openQuiz({
        area: last.S, type: last.type, level: last.level, extras: last.extras, ledCount:last.ledCount, floorArea:last.floorArea,
        venueLabel: venue.value ? vOpt.textContent : '',
        comment: 'Ориентир из калькулятора: от '+CRVU.fmtNum(last.lo)+(last.hi===null?' ₽, верхняя граница по проекту.':' до '+CRVU.fmtNum(last.hi)+' ₽.')+' Демонстрационная модель.'
      }, 'calculator');
    });

    /* расчёт на email */
    var pdfOk = $('#pdfOk'), pdfEmail = $('#pdfEmail'), pdfConsent = $('#pdfConsent');
    pdfBtn.addEventListener('click',function(){if(!last)return;w.open('calculation.html#'+encodeURIComponent(JSON.stringify(last)),'_blank','noopener');});
    $('#calcEmailBtn').addEventListener('click',function(){var open=pdfBox.hidden;pdfBox.hidden=!open;this.setAttribute('aria-expanded',String(open));if(open)pdfEmail.focus();});
    CRVU.autoClear(pdfBox);
    pdfBox.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      pdfOk.hidden = true;
      if (!CRVU.isEmail(pdfEmail.value)) { CRVU.showErr(pdfEmail, 'Проверьте email: похоже, в адресе ошибка.'); ok = false; }
      if (!pdfConsent.checked) { CRVU.showErr(pdfConsent, 'Поставьте галочку согласия, чтобы отправить заявку.'); ok = false; }
      if (!ok) { (pdfEmail.getAttribute('aria-invalid') === 'true' ? pdfEmail : pdfConsent).focus(); return; }
      var btn = pdfBox.querySelector('button[type=submit]');
      btn.disabled = true;
      CRVU.withTimeout(CRVU.submitLead({ data: { kind: 'calc_pdf', email: pdfEmail.value.trim(), calc: last, consent: true, page: w.location.href, utm: CRVU.utm() } }, 'calc_pdf'))
        .then(function () {
          pdfOk.textContent = nb((w.CRVU_CONFIG.preview?'Черновик готов. Запрос и расчёт НЕ отправлены: это версия для проверки.':'Запрос передан. Расчёт поступит на '+pdfEmail.value.trim()+'.'));
          pdfOk.hidden = false;
          CRVU.track('calc_pdf');
        })
        .catch(function () {
          pdfOk.textContent = nb('Не удалось отправить. Попробуйте ещё раз или позвоните ' + PHONE + '.');
          pdfOk.hidden = false;
        })
        .then(function () { btn.disabled = false; });
    });

    var floor2=form.querySelector('[name=cfloor2]');function syncFloor(){$('#cFloorWrap').hidden=!floor2.checked;}floor2.addEventListener('change',syncFloor);syncFloor();
    syncLed();
  })();

  /* ================================================================== планировщик сроков */
  var Planner = (CRVU.planner = {});

  function iso(s) { return s ? CRVU.parseISO(s) : null; }
  function period(e) { return String(e.dates).replace(/\s*\(.*?\)\s*/g, '').trim(); }
  function expoById(id) { for (var i = 0; i < D.expos.length; i++) { if (D.expos[i].id === id) { return D.expos[i]; } } return null; }

  /* Модель сроков (см. README): комфортный старт = открытие − 3 месяца; стандартный = первый день монтажа − 6 недель;
     подача документов = монтаж − N рабочих дней (Крокус Экспо 14, Тимирязев Центр 15, иначе не показываем);
     последний старт без наценки = подача документов − 5 рабочих дней; предел экспресса = открытие − 13 дней.
     Праздничные и перенесённые дни не учитываются. */
  function model(open, venueKey, setupISO) {
    var M = D.model, V = D.venues[venueKey] || D.venues.other;
    var assumed = !setupISO;
    var first = setupISO ? iso(setupISO) : CRVU.addDays(open, -M.setupOffsetDays);
    var docs = V.docBdays ? CRVU.subBdays(first, V.docBdays) : null;
    return {
      open: open, first: first, assumed: assumed, rule: V.docBdays || null, venueLabel: V.label,
      comfortable: CRVU.addMonths(open, -M.comfortableMonths),
      standard: CRVU.addDays(first, -M.standardWeeks * 7),
      docs: docs,
      latest: docs ? CRVU.subBdays(docs, M.latestMinusBdays) : null,
      express: CRVU.addDays(open, -(M.expressDays + 1))
    };
  }

  /* даты выставки из списка: берём предрассчитанные значения из data.js; для остальных — модель */
  Planner.get = function (id) {
    var e = expoById(id);
    if (!e || !e.planner || !e.open) { return null; }
    var p=e.planner||{},setup=/^допущение/.test(p.first_setup_day_basis||'')?null:p.first_setup_day;var result=model(iso(e.open),e.venueKey,setup);result.expo=e;result.close=iso(e.close);result.venueLabel=e.venue;return result;
  };
  Planner.model = model;

  /* статус относительно сегодняшней даты: { kind: ok | warn | hot | late | call | gone, text } */
  Planner.status = function (P, today) {
    var t = today.getTime(), fd = CRVU.fmtDateLong;
    if (t > (P.close || P.open).getTime()) { return { kind: 'gone', text: 'Эта выставка уже прошла. Выберите следующую в списке.' }; }
    if (t >= P.open.getTime()) { return { kind: 'gone', text: 'Выставка уже открыта. Выберите следующую или позвоните: ' + PHONE + '.' }; }
    if (t > P.express.getTime()) { return { kind: 'call', text: 'До открытия меньше 12 дней. Позвоните: ' + PHONE + '. Рассмотрим подключение в экстренном порядке.' }; }
    if (P.latest) {
      if (t > P.latest.getTime()) { return { kind: 'late', text: (P.docs&&t<=P.docs.getTime()?'Рекомендуемый срок брифа прошёл; подготовку документов планируем до '+fd(P.docs)+'. Менеджер проверит возможность успеть.':'Рекомендуемый срок подготовки документов прошёл. Это не нормативный дедлайн площадки: уточним условия по руководству участника.') }; }
      if (t > P.standard.getTime()) {
        var n = CRVU.dayDiff(new Date(t), P.latest);
        if (n === 0) { return { kind: 'hot', text: 'Сегодня рекомендуемый день старта: ' + fd(P.latest) + '. Пришлите план площадки сейчас.' }; }
        return { kind: 'hot', text: 'До рекомендуемого старта осталось ' + n + ' ' + CRVU.plural(n, ['день', 'дня', 'дней']) + ': ' + fd(P.latest) + '. Пришлите план площадки сегодня.' };
      }
    } else if (t > P.standard.getTime()) {
      return { kind: 'late', text: 'Стандартный срок прошёл. Возможен экспресс-режим: пришлите план площадки, и мы проверим, успеваем ли.' };
    }
    if (t > P.comfortable.getTime()) {
      var m = CRVU.dayDiff(new Date(t), P.standard);
      if (m === 0) { return { kind: 'warn', text: 'Комфортный срок прошёл. Сегодня последний день стандартного старта: ' + fd(P.standard) + '.' }; }
      return { kind: 'warn', text: 'Комфортный срок прошёл. Стандартный старт: до ' + fd(P.standard) + '. Осталось ' + m + ' ' + CRVU.plural(m, ['день', 'дня', 'дней']) + '.' };
    }
    return { kind: 'ok', text: 'Время есть. Лучше начать до ' + fd(P.comfortable) + ': так остаётся запас на согласование проекта.' };
  };

  Planner.hint = function (id) {
    var P = Planner.get(id);
    if (!P) {
      var e = expoById(id);
      if (e && !e.open) { return { kind: 'wait', text: 'Организатор пока указал только ' + period(e) + '. Покажем сроки, когда он опубликует точные даты.' }; }
      return null;
    }
    return Planner.status(P, CRVU.todayUTC());
  };

  function timeline(P, today) {
    var T = today.getTime(), items = [];
    function add(key, date, end, title, sub, cls) { items.push({ key: key, date: date, end: end || null, title: title, sub: sub, cls: cls || '' }); }
    add('comfort', P.comfortable, null, 'Комфортный старт', 'За 3 месяца до открытия. Остаётся запас на согласование проекта.', 'is-key');
    add('standard', P.standard, null, 'Стандартный старт', 'За 6 недель до первого дня монтажа.');
    if (P.latest) { add('latest', P.latest, null, 'Рекомендуемый день брифа', 'Оставляем 5 рабочих дней на согласование 3D и чертежей до рекомендованной даты документов.', 'is-key'); }
    if (P.docs) { add('docs', P.docs, null, 'Рекомендуемая готовность документов', 'Плановый запас '+P.rule+' рабочих дней до монтажа. Не норматив площадки; требование сверяется по руководству участника.'); }
    if (P.docs) {
      var ps = CRVU.addDays(P.docs, 1), pe = CRVU.addDays(P.first, -1);
      if (ps.getTime() <= pe.getTime()) { add('prod', ps, pe, 'Производство и логистика', 'Конструкции делаем в цеху и доставляем на площадку к монтажу.'); }
    }
    var setupEnd = CRVU.addDays(P.open, -2);
    add('setup', P.first, setupEnd.getTime() > P.first.getTime() ? setupEnd : null, 'Монтаж на площадке', 'Сам монтаж занимает 2–3 дня. Дата первого дня монтажа ' + (P.assumed ? 'принята ориентировочно.' : 'указана организатором.'));
    add('handover', CRVU.addDays(P.open, -1), null, 'Сдача стенда', 'Сдаём накануне открытия и передаём фото- и видеоотчёт.', 'is-key');
    add('open', P.open, null, 'Открытие выставки', (P.expo?'Выставка работает '+P.expo.dates+'.':'Дата открытия указана вами; длительность выставки уточняется отдельно.'), 'is-open');
    add('express', P.express, null, 'Проверка экспресс-возможности', 'Экспресс от 12 дней возможен не для любого проекта. Проверяем объём и готовность допуска; это не обещание даты сдачи.', 'is-dash');
    items.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });

    var nextSet = false, html = '', todayDone = false;
    function todayRow() {
      return '<li class="tl__i tl__i--today"><div class="tl__d">' + CRVU.fmtDate(today) + '<small>сегодня</small></div><div class="tl__n" aria-hidden="true"></div><div class="tl__b"><span class="tl__t">Сегодня</span></div></li>';
    }
    items.forEach(function (it) {
      var dt = it.date.getTime(), endT = (it.end || it.date).getTime();
      var past = endT < T, cls = it.cls;
      if (!todayDone && dt >= T) { html += todayRow(); todayDone = true; }
      if (past) { cls += ' is-past'; }
      else if (!nextSet && it.key !== 'express') { cls += ' is-next'; nextSet = true; }
      var n = CRVU.dayDiff(today, it.date);
      var chip = past ? 'прошло' : (dt <= T ? 'идёт сейчас' : 'через ' + n + ' ' + CRVU.plural(n, ['день', 'дня', 'дней']));
      var small = it.end ? 'по ' + CRVU.fmtDate(it.end).slice(0, 5) : CRVU.weekday(it.date);
      html += '<li class="tl__i ' + cls + '"><div class="tl__d">' + CRVU.fmtDate(it.date) + '<small>' + small + '</small></div>' +
        '<div class="tl__n" aria-hidden="true"></div><div class="tl__b"><span class="tl__t">' + esc(it.title) + '</span>' +
        '<span class="tl__s">' + esc(it.sub) + '</span><span class="tl__c">' + chip + '</span></div></li>';
    });
    if (!todayDone) { html += todayRow(); }
    return { items: items, html: html };
  }

  function ics(P, name, id, items, today) {
    var CR = '\r\n', stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    function esc2(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    function fold(line) {
      var out = '', cur = '', bytes = 0;
      for (var i = 0; i < line.length; i++) {
        var ch = line.charAt(i), b = unescape(encodeURIComponent(ch)).length;
        if (bytes + b > 72) { out += cur + CR + ' '; cur = ''; bytes = 1; }
        cur += ch; bytes += b;
      }
      return out + cur;
    }
    var keep = { comfort: 1, standard: 1, latest: 1, docs: 1, setup: 1, open: 1 };
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CRVU//Planner//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    items.forEach(function (it) {
      if (!keep[it.key]) { return; }
      if ((it.end || it.date).getTime() < today.getTime()) { return; }
      var endEx = CRVU.addDays(it.end || it.date, 1);
      lines.push('BEGIN:VEVENT', 'UID:' + id + '-' + it.key + '@stendy.crvu.ru', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + CRVU.toICS(it.date), 'DTEND;VALUE=DATE:' + CRVU.toICS(endEx),
        'SUMMARY:' + esc2(name + ': ' + it.title),
        'DESCRIPTION:' + esc2(it.sub + ' Ориентировочный расчёт ЦРВУ. Телефон ' + PHONE + ', manager@crvu.ru.'),
        'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join(CR) + CR;
  }

  (function planner() {
    var form = $('#planForm');
    if (!form) { return; }
    var sel = $('#pExpo'), custom = $('#pCustom'), dateInp = $('#pDate'), vWrap = $('#pVenueWrap'), vSel = $('#pVenue');
    var empty = $('#planEmpty'), out = $('#planOut');
    var current = null;

    D.expos.forEach(function (e) {
      var o = d.createElement('option');
      o.value = e.id;
      o.textContent = e.name + ' — ' + e.dates + ' · ' + e.venue;
      sel.appendChild(o);
    });
    var other = d.createElement('option');
    other.value = 'other';
    other.textContent = 'Другая выставка';
    sel.appendChild(other);

    CRVU.autoClear(form);
    var today0 = CRVU.todayUTC();
    dateInp.min = today0.getUTCFullYear() + '-' + ('0' + (today0.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + today0.getUTCDate()).slice(-2);

    function show(html) { empty.hidden = true; out.innerHTML = html; out.hidden = false; }
    function clear() { out.hidden = true; out.innerHTML = ''; empty.hidden = false; current = null; }

    function build(P, name, metaTop, badge, st, notes, today) {
      var tl = timeline(P, today);
      var daysTo = CRVU.dayDiff(today, P.open);
      var meta = metaTop + (daysTo > 0 ? ' До открытия ' + daysTo + ' ' + CRVU.plural(daysTo, ['день', 'дня', 'дней']) + '.' : '');
      var badgeHtml = badge ? '<span class="badge badge--ok">Даты подтверждены</span>' : '<span class="badge badge--wait">Даты уточняются</span>';
      var note = P.expo
        ? 'Даты выставок взяты с сайтов организаторов, проверены ' + CRVU.fmtDate(CRVU.parseISO(D.asOf)) + '. Организаторы могут менять даты и площадки. Правила подачи документов уточняйте в руководстве участника вашей выставки.'
        : 'Расчёт построен по указанной вами дате открытия. Организаторы могут менять даты и площадки. Правила подачи документов уточняйте в руководстве участника вашей выставки.';
      return '<div class="plan__head"><div><h3 class="plan__name">' + esc(name) + '</h3><p class="plan__meta">' + esc(meta) + '</p></div>' + badgeHtml + '</div>' +
        '<div class="plan__status' + (st.kind === 'hot' || st.kind === 'call' ? ' plan__status--hot' : '') + '" role="status"><p class="mono">Статус на ' + CRVU.fmtDate(today) + '</p><p>' + esc(st.text) + '</p></div>' +
        '<ol class="tl" aria-label="Ключевые даты">' + tl.html + '</ol>' +
        (notes.length ? '<p class="plan__ass">' + notes.map(esc).join(' ') + '</p>' : '') +
        '<p class="plan__note">' + esc(note) + '</p>' +
        '<div class="plan__act"><button class="btn btn--line" type="button" data-plan-ics><svg class="ico" aria-hidden="true"><use href="#i-cal"/></svg> Добавить даты в календарь (.ics)</button>' +
        '<button class="btn btn--accent" type="button" data-plan-quote>Запросить смету к этой выставке ' + ARROW + '</button></div>';
    }

    function run(byUser) {
      var id = sel.value, today = CRVU.todayUTC();
      custom.hidden = vWrap.hidden = id !== 'other';
      if (!id) { clear(); return; }
      var P, name, metaTop, confirmed, notes = [], st;
      if (id === 'other') {
        var v = dateInp.value;
        if (!v) { clear(); if (byUser === 'submit') { CRVU.showErr(dateInp, 'Укажите дату открытия выставки.'); dateInp.focus(); } return; }
        var open = CRVU.parseISO(v);
        if (open.getTime() <= today.getTime()) { clear(); CRVU.showErr(dateInp, 'Укажите будущую дату открытия выставки.'); return; }
        CRVU.clearErr(dateInp);
        P = model(open, vSel.value, null);
        P.expo = null; P.close = null;
        name = 'Другая выставка';
        metaTop = 'Открытие ' + CRVU.fmtDateLong(open) + ' · ' + P.venueLabel + '.';
        confirmed = false;
        notes.push('Дату открытия вы указали сами: проверьте её на сайте организатора.');
        current = { id: 'other-' + v, name: 'Выставка', P: P, tl: null, qp: { expo: 'other', date: v, venueLabel: P.venueLabel === 'Другая площадка' ? '' : P.venueLabel } };
      } else {
        var e = expoById(id);
        P = Planner.get(id);
        if (!P) {
          /* даты не опубликованы организатором */
          show('<div class="plan__head"><div><h3 class="plan__name">' + esc(e.name) + '</h3><p class="plan__meta">' + esc(e.dates + ' · ' + e.venue) + '</p></div><span class="badge badge--wait">Даты уточняются</span></div>' +
            '<div class="plan__status" role="status"><p class="mono">Статус на ' + CRVU.fmtDate(today) + '</p><p>' + esc('Организатор пока указал только ' + period(e) + '. Покажем сроки, когда он опубликует точные даты.') + '</p></div>' +
            '<div class="plan__act"><button class="btn btn--accent" type="button" data-plan-quote>Запросить смету к этой выставке ' + ARROW + '</button></div>');
          current = { id: id, name: e.name, P: null, tl: null, qp: { expo: id, venueLabel: e.venue } };
          if (byUser) { CRVU.track('planner_select', { expo: id }); }
          return;
        }
        name = e.name;
        metaTop = e.dates + ' · ' + e.venue + (e.pavilion ? ', ' + e.pavilion : '') + '.';
        confirmed = e.confirmed;
        current = { id: id, name: e.name, P: P, qp: { expo: id, venueLabel: e.venue } };
      }
      if (P.assumed) { notes.push('Первый день монтажа организатор пока не публикует: считаем ориентировочно за ' + D.model.setupOffsetDays + ' дней до открытия.'); }
      if (!P.docs) { notes.push('Нормативный срок документов зависит от руководства участника. Показанные даты являются рекомендациями, а не гарантией отсутствия наценки.'); }
      st = Planner.status(P, today);
      if (st.kind === 'gone') {
        show('<div class="plan__head"><div><h3 class="plan__name">' + esc(name) + '</h3><p class="plan__meta">' + esc(metaTop) + '</p></div></div><div class="plan__status" role="status"><p>' + esc(st.text) + '</p></div>');
        current = null;
        return;
      }
      show(build(P, name, metaTop, confirmed, st, notes, today));
      current.tl = timeline(P, today);
      if (byUser) { CRVU.track('planner_select', { expo: id }); }
    }

    sel.addEventListener('change', function () {
      CRVU.clearErr(dateInp);
      run(true);
    });
    dateInp.addEventListener('change', function () { run(true); });
    vSel.addEventListener('change', function () { run(false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!sel.value) { sel.focus(); return; }
      run('submit');
    });

    out.addEventListener('click', function (e) {
      if (!current) { return; }
      if (e.target.closest('[data-plan-quote]')) {
        var q = current.qp || {};
        var c = 'Нужна смета к выставке: ' + (current.P && current.P.expo ? current.P.expo.name + ' (' + current.P.expo.dates + ')' : current.name) + '.';
        if (current.P && !current.P.expo) { c = 'Нужна смета к выставке с датой открытия ' + CRVU.fmtDateLong(current.P.open) + '.'; }
        CRVU.openQuiz({ expo: q.expo, date: q.date, venueLabel: q.venueLabel, comment: c }, 'planner');
        return;
      }
      if (e.target.closest('[data-plan-ics]') && current.P && current.tl) {
        var text = ics(current.P, current.P.expo ? current.name : 'Выставка', current.id, current.tl.items, CRVU.todayUTC());
        var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
        var url = URL.createObjectURL(blob), a = d.createElement('a');
        a.href = url; a.download = 'crvu-srok-' + current.id + '.ics';
        d.body.appendChild(a); a.click(); d.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        CRVU.track('planner_ics', { expo: current.id });
      }
    });
  })();
})(window, document);
