/*!
 * ЦРВУ — ядро страницы: пространство имён CRVU, утилиты, цели Яндекс Метрики,
 * шапка и мобильное меню, появление блоков при прокрутке, счётчики, мобильная панель.
 */
(function (w, d) {
  'use strict';

  var CRVU = (w.CRVU = w.CRVU || {});
  var METRIKA_ID = 103630235;
  var NBSP = '\u00a0';

  var mq = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : null;
  CRVU.reduced = !!(mq && mq.matches);

  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  CRVU.$ = $;
  CRVU.$$ = $$;

  /* ------------------------------------------------------------------ цели Метрики */
  /* Счётчик Метрики НЕ подключён на странице (см. README). Обёртка безопасна: если ym нет, ничего не происходит.
     Список целей: quiz_start, quiz_step_N, quiz_submit, upload_plan, calc_start, calc_result, calc_pdf,
     planner_select, planner_ics, doc_brief, doc_procurement, case_open, video_play, slider_use,
     click_phone, click_messenger, scroll_75 (раздел 12.1 стратегии) + дополнительные faq_open, swap_click, production_view. */
  var fired = {};
  CRVU.track = function (goal, params) {
    try {
      if (w.CRVU_CONFIG && w.CRVU_CONFIG.analyticsEnabled && w.CRVU_ANALYTICS_CONSENT && typeof w.ym === 'function') {
        if (params) { w.ym(METRIKA_ID, 'reachGoal', goal, params); } else { w.ym(METRIKA_ID, 'reachGoal', goal); }
      }
    } catch (e) { /* аналитика не должна ломать страницу */ }
  };
  CRVU.trackOnce = function (goal, params) {
    if (fired[goal]) { return; }
    fired[goal] = 1;
    CRVU.track(goal, params);
  };

  d.addEventListener('click', function (e) {
    var g = e.target.closest ? e.target.closest('[data-goal]') : null;
    if (g) { CRVU.track(g.getAttribute('data-goal')); }
  });

  /* ------------------------------------------------------------------ типографика в динамических строках */
  var SHORT = /(^|[^0-9A-Za-zА-Яа-яЁё-])([А-Яа-яЁё]{1,3})[ ]+(?=[0-9A-Za-zА-Яа-яЁё«(№₽+])/g;
  CRVU.nb = function (str) {
    var s = String(str);
    s = s.replace(/ +(—|–)(?= )/g, NBSP + '$1');
    for (var i = 0; i < 3; i++) { s = s.replace(SHORT, '$1$2' + NBSP); }
    s = s.replace(/₽\/м²/g, '₽/\u2060м²');
    s = s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NBSP);
    s = s.replace(/(\d) (?=[А-Яа-яЁёA-Za-z₽%°])/g, '$1' + NBSP);
    s = s.replace(/(\+7) (?=\()/g, '$1' + NBSP).replace(/(\)) (?=\d)/g, '$1' + NBSP);
    return s;
  };
  CRVU.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  CRVU.fmtNum = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); };
  CRVU.fmtArea = function (n) {
    var r = Math.round(n * 10) / 10;
    return String(r).replace('.', ',');
  };
  CRVU.plural = function (n, f) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) { return f[2]; }
    if (n1 > 1 && n1 < 5) { return f[1]; }
    if (n1 === 1) { return f[0]; }
    return f[2];
  };

  /* ------------------------------------------------------------------ даты (в UTC, без часовых поясов) */
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  CRVU.parseISO = function (s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); };
  CRVU.todayUTC = function () { var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),o={};parts.forEach(function(p){o[p.type]=p.value;});return CRVU.parseISO(o.year+'-'+o.month+'-'+o.day); };
  CRVU.addDays = function (dt, n) { return new Date(dt.getTime() + n * 86400000); };
  CRVU.addMonths = function (dt, n) {
    var y = dt.getUTCFullYear(), m = dt.getUTCMonth() + n, day = dt.getUTCDate();
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  };
  CRVU.isBusinessDay=function(dt){
    var iso=dt.toISOString().slice(0,10),cal=(w.CRVU_DATA||{}).calendar||{},y=dt.getUTCFullYear();
    if((cal.working||[]).indexOf(iso)>=0)return true;
    if((cal.off||[]).indexOf(iso)>=0)return false;
    var md=iso.slice(5);
    if(dt.getUTCMonth()===0&&dt.getUTCDate()<=8)return false;
    if(['02-23','03-08','05-01','05-09','06-12','11-04'].indexOf(md)>=0)return false;
    return dt.getUTCDay()!==0&&dt.getUTCDay()!==6;
  };
  CRVU.subBdays=function(dt,n){var x=new Date(dt.getTime()),guard=0;while(n>0&&guard++<1000){x=CRVU.addDays(x,-1);if(CRVU.isBusinessDay(x))n--;}return x;};
  CRVU.dayDiff = function (a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); };
  CRVU.fmtDate = function (dt) { return pad(dt.getUTCDate()) + '.' + pad(dt.getUTCMonth() + 1) + '.' + dt.getUTCFullYear(); };
  CRVU.fmtDateLong = function (dt) { return dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear(); };
  CRVU.fmtDateShort = function (dt) { return dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()]; };
  CRVU.weekday = function (dt) { return WD[dt.getUTCDay()]; };
  CRVU.toICS = function (dt) { return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()); };

  /* ------------------------------------------------------------------ телефон, email, ошибки полей */
  CRVU.phoneDigits = function (v) {
    var s=String(v).replace(/\D/g,'');
    if(s.length===11 && /^[78]/.test(s)){s=s.slice(1);}
    return s;
  };
  CRVU.formatPhone = function (s) {
    if(!s)return '';
    var out='+7 ('+s.slice(0,3);
    if(s.length>=3)out+=')';
    if(s.length>3)out+=' '+s.slice(3,6);
    if(s.length>6)out+='-'+s.slice(6,8);
    if(s.length>8)out+='-'+s.slice(8,10);
    return out;
  };
  CRVU.isPhone = function(v){
    var raw=String(v).trim(),n=raw.replace(/\D/g,'');
    if(/[^0-9+()\s-]/.test(raw))return false;
    return n.length===10 && !raw.startsWith('+') || n.length===11 && /^[78]/.test(n) && (!raw.startsWith('+') || raw.startsWith('+7'));
  };
  CRVU.isEmail = function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());};
  CRVU.maskPhone = function(inp){
    if(!inp)return;
    var prev='';
    inp.addEventListener('paste',function(e){
      var v=e.clipboardData&&e.clipboardData.getData('text');
      if(v && CRVU.isPhone(v)){e.preventDefault();inp.value=CRVU.formatPhone(CRVU.phoneDigits(v));prev=CRVU.phoneDigits(v);inp.dispatchEvent(new Event('input',{bubbles:true}));}
    });
    inp.addEventListener('input',function(e){
      var raw=inp.value,ds=CRVU.phoneDigits(raw),pos=inp.selectionStart,atEnd=pos===raw.length;
      if(e.inputType&&e.inputType.indexOf('delete')===0&&ds===prev&&atEnd){ds=ds.slice(0,-1);raw=ds;}
      if(!raw){inp.value='';prev='';return;}
      var n=raw.replace(/\D/g,'');
      if(!raw.startsWith('+')&&n.length===1&&/[78]/.test(n)){inp.value='+7 (';prev='';return;}
      if((n.length<=10&&!raw.startsWith('+'))||(n.length===11&&/^[78]/.test(n))||(raw.startsWith('+7')&&n.length<=11)){
        if(raw.startsWith('+7')&&n.length<11)ds=n.slice(1);
        var val=CRVU.formatPhone(ds);inp.value=val;
        if(atEnd){try{inp.setSelectionRange(val.length,val.length);}catch(er){}}
      }
      prev=ds;
    });
  };

  CRVU.showErr = function (input, msg) {
    var field = input.closest ? input.closest('.field') : null;
    var err = d.getElementById(input.id + '-e');
    if (field) { field.classList.add('has-error'); }
    input.setAttribute('aria-invalid', 'true');
    if (err) { err.textContent = CRVU.nb(msg); err.hidden = false; }
  };
  CRVU.clearErr = function (input) {
    var field = input.closest ? input.closest('.field') : null;
    var err = d.getElementById(input.id + '-e');
    if (field) { field.classList.remove('has-error'); }
    input.setAttribute('aria-invalid', 'false');
    if (err) { err.hidden = true; err.textContent = ''; }
  };
  /* снимаем ошибку, как только пользователь исправил поле */
  CRVU.autoClear = function (form) {
    if (!form) { return; }
    function clear(e) {
      var t = e.target;
      /* ошибка файла управляется отдельно (quiz.js), иначе она исчезнет сразу после показа */
      if (t && t.id && t.type !== 'file' && d.getElementById(t.id + '-e')) { CRVU.clearErr(t); }
    }
    form.addEventListener('input', clear);
    form.addEventListener('change', clear);
  };

  /* Isolated preview. Live delivery requires explicit production configuration. */
  CRVU.lastDraft=null;
  CRVU.withTimeout=function(p,ms){return new Promise(function(resolve,reject){var id=setTimeout(function(){reject(new Error('timeout'));},ms||15000);p.then(function(v){clearTimeout(id);resolve(v);},function(e){clearTimeout(id);reject(e);});});};
  CRVU.submitLead=function(payload,kind){
    var cfg=w.CRVU_CONFIG||{};
    if(cfg.preview!==false){
      CRVU.lastDraft={kind:kind,data:payload.data||payload,plan:payload.file?{name:payload.file.name,size:payload.file.size}:null,notSent:true};
      return Promise.resolve({ok:true,preview:true});
    }
    if(!cfg.leadEndpoint)return Promise.reject(new Error('not-configured'));
    var url=new URL(cfg.leadEndpoint,w.location.href);
    if(url.origin!==w.location.origin)return Promise.reject(new Error('same-origin-endpoint-required'));
    var ac=new AbortController(),timer=setTimeout(function(){ac.abort();},15000),fd=new FormData();
    fd.append('payload',JSON.stringify(payload.data));
    if(payload.file)fd.append('plan',payload.file,payload.file.name);
    return fetch(url.href,{method:'POST',body:fd,signal:ac.signal,credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(v){if(!v||v.ok!==true)throw new Error('invalid-response');return v;}).finally(function(){clearTimeout(timer);});
  };
  CRVU.utm = function () {
    var out = {}, p = new URLSearchParams(w.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid'].forEach(function (k) { if (p.get(k)) { out[k] = p.get(k); } });
    return out;
  };

  /* ------------------------------------------------------------------ мобильное меню */
  var burger = $('#burger'), menu = $('#mmenu');
  function setMenu(open) {
    if (!burger || !menu) { return; }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.classList.toggle('is-open', open);
    d.body.classList.toggle('menu-open', open);
    if(open){var first=menu.querySelector('a');if(first)first.focus();}else if(menu.contains(d.activeElement)){burger.focus();}
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
    d.addEventListener('keydown', function (e) {
      if(e.key==='Tab'&&menu.classList.contains('is-open')){var nodes=[burger].concat($$('a,button',menu)),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&d.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first.focus();}}
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    w.addEventListener('resize', function () { if (w.innerWidth > 1060) { setMenu(false); } });
  }

  /* ------------------------------------------------------------------ переход к квизу с подстановкой данных */
  CRVU.openQuiz = function (prefill, source) {
    var q = $('#quiz');
    if (!q) { return; }
    var details=$('#advancedQuiz');if(details && prefill && Object.keys(prefill).length){details.open=true;}
    if (CRVU.quiz && CRVU.quiz.prefill) { CRVU.quiz.prefill(prefill || {}, source); }
    q.scrollIntoView({ behavior: CRVU.reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () {
      var target = details && !details.open ? $('#quickName') : ($('#quizOk:not([hidden])') || $('.qstep:not([hidden]) input:not([type=radio]):not([type=checkbox]), .qstep:not([hidden]) select'));
      if (target && target.focus) { try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); } }
    }, CRVU.reduced ? 50 : 650);
  };
  d.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-open-quiz]') : null;
    if (!a) { return; }
    e.preventDefault();
    CRVU.openQuiz({}, a.getAttribute('data-open-quiz'));
  });

  /* ------------------------------------------------------------------ появление блоков */
  var rv = $$('.rv, .rv-wipe');
  if (!('IntersectionObserver' in w) || CRVU.reduced) {
    rv.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    rv.forEach(function (el) { rio.observe(el); });
  }

  /* ------------------------------------------------------------------ счётчик в hero */
  $$('[data-count]').forEach(function (el) {
    var target = +el.getAttribute('data-count');
    if (!target || CRVU.reduced || !('IntersectionObserver' in w)) { return; }
    el.textContent = '0';
    var cio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) { return; }
      cio.disconnect();
      var t0 = null, dur = 1400;
      (function tick(ts) {
        if (t0 === null) { t0 = ts; }
        var p = Math.min(1, (ts - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = CRVU.fmtNum(target * k);
        if (p < 1) { w.requestAnimationFrame(tick); } else { el.textContent = CRVU.fmtNum(target); }
      })(w.performance.now());
    }, { threshold: 0.4 });
    cio.observe(el);
  });

  /* ------------------------------------------------------------------ подсветка пункта меню, мобильная панель, «Наверх» */
  if ('IntersectionObserver' in w) {
    var links = $$('.nav a');
    var secs = ['calculator', 'planner', 'cases', 'process', 'faq'].map(function (id) { return d.getElementById(id); }).filter(Boolean);
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function (s) { sio.observe(s); });

    var inQuiz = {};
    var qio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { inQuiz[en.target.id] = en.isIntersecting; });
      d.body.classList.toggle('in-quiz', !!(inQuiz.quiz || inQuiz.contacts));
    }, { threshold: 0.15 });
    ['quiz', 'contacts'].forEach(function (id) { var el = d.getElementById(id); if (el) { qio.observe(el); } });

    $$('[data-goal-view]').forEach(function (el) {
      var vio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { CRVU.trackOnce(el.getAttribute('data-goal-view')); vio.disconnect(); }
      }, { threshold: 0.35 });
      vio.observe(el);
    });
  }

  var toTop = $('#toTop'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = w.pageYOffset || d.documentElement.scrollTop;
    if (toTop) { toTop.classList.toggle('is-on', y > 900); }
    var max = d.documentElement.scrollHeight - w.innerHeight;
    if (max > 0 && y / max >= 0.75) { CRVU.trackOnce('scroll_75'); }
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})(window, document);
