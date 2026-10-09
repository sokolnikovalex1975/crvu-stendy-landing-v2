/*!
 * ЦРВУ — виджеты: слайдер «Рендер / Реальность», фильтр и лайтбокс кейсов,
 * плеер видеоотзывов и карусель, аккордеон FAQ.
 */
(function (w, d) {
  'use strict';

  var CRVU = w.CRVU;
  var $ = CRVU.$, $$ = CRVU.$$;
  var DATA = w.CRVU_DATA || { cases: {} };

  /* ================================================================== слайдер «Рендер / Реальность» */
  (function slider() {
    var root = $('[data-cmp]');
    if (!root) { return; }
    var stage = $('[data-cmp-stage]', root);
    var handle = $('[data-cmp-handle]', root);
    if (!stage || !handle) { return; }
    var pos = 50, used = false, dragging = false, raf = 0;

    function render() {
      var p = Math.round(pos);
      stage.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', String(p));
      handle.setAttribute('aria-valuetext', 'Рендер слева, фотография справа, граница на ' + p + ' ' + CRVU.plural(p, ['проценте', 'процентах', 'процентах']));
    }
    function stopTeaser() { if (raf) { w.cancelAnimationFrame(raf); raf = 0; } }
    function set(p, byUser) {
      pos = Math.max(0, Math.min(100, p));
      render();
      if (byUser) {
        stopTeaser();
        if (!used) { used = true; CRVU.track('slider_use'); }
      }
    }
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) { return; }
      dragging = true;
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ничего */ }
      stage.classList.add('is-drag');
      set(fromEvent(e), true);
      try { handle.focus({ preventScroll: true }); } catch (err2) { handle.focus(); }
    });
    stage.addEventListener('pointermove', function (e) { if (dragging) { set(fromEvent(e), true); } });
    function end() { dragging = false; stage.classList.remove('is-drag'); }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('lostpointercapture', end);

    handle.addEventListener('keydown', function (e) {
      var step = null;
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowDown': step = -5; break;
        case 'ArrowRight': case 'ArrowUp': step = 5; break;
        case 'PageDown': step = -10; break;
        case 'PageUp': step = 10; break;
        case 'Home': set(0, true); e.preventDefault(); return;
        case 'End': set(100, true); e.preventDefault(); return;
        default: return;
      }
      e.preventDefault();
      set(pos + step, true);
    });

    /* короткая подсказка при первом показе: граница чуть качнётся */
    if ('IntersectionObserver' in w && !CRVU.reduced) {
      var tio = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) { return; }
        tio.disconnect();
        if (used) { return; }
        var t0 = null, dur = 2200;
        (function tick(ts) {
          if (used) { return; }
          if (t0 === null) { t0 = ts; }
          var p = Math.min(1, (ts - t0) / dur);
          pos = 50 + 16 * Math.sin(p * Math.PI * 2) * (1 - p * 0.35);
          render();
          if (p < 1) { raf = w.requestAnimationFrame(tick); } else { pos = 50; render(); raf = 0; }
        })(w.performance.now());
      }, { threshold: 0.6 });
      tio.observe(stage);
    }
    render();
  })();

  (function(){var bar=$('#caseFilters'),grid=$('#casesGrid'),more=$('#casesMore'),cards=$$('.case',grid),filter='all',expanded=false;
    if(!bar||!grid)return;
    function apply(){var matching=cards.filter(function(c){return filter==='all'||c.dataset.category===filter;});cards.forEach(function(c){c.hidden=matching.indexOf(c)<0||(!expanded&&matching.indexOf(c)>=6);if(!c.hidden)c.classList.add('is-in');});grid.classList.remove('is-one');grid.classList.add('is-all');$$('[data-filter]',bar).forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.filter===filter));});more.hidden=matching.length<=6;more.textContent=expanded?'Свернуть проекты':'Показать ещё '+Math.max(0,matching.length-6);more.setAttribute('aria-expanded',String(expanded));var live=$('#casesLive');if(live)live.textContent='Показано '+Math.min(matching.length,expanded?matching.length:6)+' из '+matching.length+' проектов.';}
    bar.addEventListener('click',function(e){var b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;expanded=false;apply();}});more.addEventListener('click',function(){expanded=!expanded;apply();if(!expanded)bar.scrollIntoView({behavior:'smooth',block:'center'});});apply();
  })();
  /* ================================================================== «Обсудить похожий стенд» */
  d.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-quote]') : null;
    if (!b) { return; }
    var area = b.getAttribute('data-quote-area');
    var comment = 'Хочу обсудить стенд, похожий на «' + b.getAttribute('data-quote') + '».';
    if (area) { comment += ' Формат: ' + area.replace('-', '–') + ' м².'; }
    CRVU.openQuiz({ comment: comment }, 'case');
  });

  /* ================================================================== лайтбокс кейсов */
  (function lightbox() {
    var dlg = $('#lbDlg');
    if (!dlg || typeof dlg.showModal !== 'function') { return; }
    var img = $('#lbImg'), title = $('#lbTitle'), meta = $('#lbMeta'), count = $('#lbCount');
    var prev = $('#lbPrev'), next = $('#lbNext'), quote = $('#lbQuote');
    var st = { key: '', i: 0, list: [], opener: null, title: '', meta: '' };

    function sources(im) {
      var base = 'assets/real/' + im.f + '.webp', th = 'assets/real/thumbs/' + im.f;
      var set = (im.single ? '' : th+'-640.webp 640w, '+(im.w>=1600?th+'-960.webp 960w, ':''))+base+' '+im.w+'w';
      return { src: base, srcset: set };
    }
    function show() {
      var im = st.list[st.i], s = sources(im);
      img.sizes = '(min-width: 1312px) 1280px, 96vw';
      img.srcset = s.srcset;
      img.src = s.src;
      img.width = im.w; img.height = im.h;
      img.alt = im.alt;
      title.textContent = st.title;
      meta.textContent = st.meta;
      var multi = st.list.length > 1;
      count.textContent = (st.i + 1) + ' / ' + st.list.length;
      count.hidden = prev.hidden = next.hidden = !multi;
      /* подгружаем соседний кадр */
      if (multi) { var nx = sources(st.list[(st.i + 1) % st.list.length]); var pre = new Image(); pre.src = nx.src; }
    }
    function go(dir) {
      if (st.list.length < 2) { return; }
      st.i = (st.i + dir + st.list.length) % st.list.length;
      show();
    }
    function open(key, opener) {
      var data = DATA.cases && DATA.cases[key];
      if (!data || !data.images || !data.images.length) { return; }
      st = { key: key, i: 0, list: data.images, opener: opener || null, title: data.title, meta: data.meta };
      show();
      if (!dlg.open) { dlg.showModal(); d.documentElement.classList.add('dlg-open'); }
      CRVU.track('case_open', { case_id: key });
    }

    d.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-lb]') : null;
      if (b) { open(b.getAttribute('data-lb'), b); }
    });
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(); }
    });
    dlg.addEventListener('close', function () {
      d.documentElement.classList.remove('dlg-open');
      img.removeAttribute('srcset'); img.removeAttribute('src');
      if (st.opener && d.contains(st.opener)) { try { st.opener.focus({ preventScroll: true }); } catch (e) { st.opener.focus(); } }
    });
    quote.addEventListener('click', function () {
      var comment = 'Хочу обсудить стенд, похожий на «' + st.title + ', ' + st.meta + '».';
      dlg.close();
      CRVU.openQuiz({ comment: comment }, 'lightbox');
    });

    /* свайп по фото на тач-экранах */
    var fig = $('.lb__fig', dlg), x0 = null;
    if (fig) {
      fig.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { x0 = e.clientX; } });
      fig.addEventListener('pointerup', function (e) {
        if (x0 === null) { return; }
        var dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) { go(dx < 0 ? 1 : -1); }
      });
    }
  })();

  /* ================================================================== плеер видеоотзывов */
  (function video() {
    var dlg = $('#videoDlg');
    if (!dlg || typeof dlg.showModal !== 'function') { return; }
    var frame = $('#vFrame'), ttl = $('#vTitle'), link = $('#vLink');
    var timer = 0, opener = null;

    function msg(html) {
      var m = d.createElement('div');
      m.className = 'vdlg__msg';
      m.innerHTML = html;
      return m;
    }
    function openVideo(id, name, ar, from) {
      opener = from || null;
      ttl.textContent = name ? 'Видео проекта: ' + name : 'Видео';
      link.href = 'https://vimeo.com/' + id;
      frame.className = 'vdlg__frame' + (ar === 'v' ? ' vdlg__frame--v' : '');
      frame.textContent = '';
      var loading = msg('<div class="spinner" role="status" aria-label="Загрузка видео"></div>');
      frame.appendChild(loading);
      var f = d.createElement('iframe');
      f.title = name ? 'Видео проекта: ' + name : 'Видео';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0&loop=1';
      f.addEventListener('load', function () { clearTimeout(timer); if (loading.parentNode) { loading.parentNode.removeChild(loading); } });
      frame.appendChild(f);
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!loading.parentNode) { return; }
        frame.textContent = '';
        frame.appendChild(msg('<p>Видео не загрузилось. Обновите страницу или откройте проект в новой вкладке.</p><a class="btn btn--accent btn--sm" href="https://vimeo.com/' + id + '" target="_blank" rel="noopener">Открыть на Vimeo</a>'));
      }, 10000);
      dlg.showModal();
      d.documentElement.classList.add('dlg-open');
      CRVU.track('video_play', { video_id: id });
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-video]') : null;
      if (!b) { return; }
      openVideo(b.getAttribute('data-video'), b.getAttribute('data-video-title'), b.getAttribute('data-video-ar'), b);
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(); }
    });
    dlg.addEventListener('close', function () {
      clearTimeout(timer);
      frame.textContent = '';            /* убираем iframe: воспроизведение останавливается */
      d.documentElement.classList.remove('dlg-open');
      if (opener && d.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) { opener.focus(); } }
    });
  })();

  /* ================================================================== карусель видеоотзывов */
  (function carousel() {
    var track = $('#vTrack'), prev = $('#vPrev'), next = $('#vNext');
    if (!track || !prev || !next) { return; }
    var t = 0;
    function update() {
      t = 0;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    function by(dir) {
      track.scrollBy({ left: dir * Math.max(280, track.clientWidth * 0.8), behavior: CRVU.reduced ? 'auto' : 'smooth' });
    }
    prev.addEventListener('click', function () { by(-1); });
    next.addEventListener('click', function () { by(1); });
    track.addEventListener('scroll', function () { if (!t) { t = w.requestAnimationFrame(update); } }, { passive: true });
    w.addEventListener('resize', update);
    update();
  })();

  /* ================================================================== FAQ */
  (function faq() {
    var acc = $('#acc');
    if (!acc) { return; }
    var qs = $$('.acc__q', acc);
    acc.addEventListener('click', function (e) {
      var q = e.target.closest('.acc__q');
      if (!q) { return; }
      var open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      q.closest('.acc__item').classList.toggle('is-open', open);
      if (open) { CRVU.track('faq_open', { question: q.id }); }
    });
    acc.addEventListener('keydown', function (e) {
      var q = e.target.closest ? e.target.closest('.acc__q') : null;
      if (!q) { return; }
      var i = qs.indexOf(q), n = null;
      if (e.key === 'ArrowDown') { n = qs[(i + 1) % qs.length]; }
      else if (e.key === 'ArrowUp') { n = qs[(i - 1 + qs.length) % qs.length]; }
      else if (e.key === 'Home') { n = qs[0]; }
      else if (e.key === 'End') { n = qs[qs.length - 1]; }
      if (n) { e.preventDefault(); n.focus(); }
    });
  })();
})(window, document);
