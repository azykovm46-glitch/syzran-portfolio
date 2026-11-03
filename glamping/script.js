(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && window.ScrollTrigger;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const root = document.documentElement;

  /* ---------- плавный скролл ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const scrollToEl = (el) => lenis ? lenis.scrollTo(el, { offset: -90 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); scrollToEl(t);
  }));

  /* ---------- время суток ---------- */
  const THEME = { morning: '#fbf3ec', day: '#f6f1e7', sunset: '#f4e2d3' };
  const todBtns = $$('.tod button');
  const setTime = (t, save) => {
    root.dataset.time = t;
    todBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.t === t)));
    $('meta[name="theme-color"]').setAttribute('content', THEME[t]);
    if (save) { try { localStorage.setItem('sb-time', t); } catch (e) { /* приватный режим */ } }
  };
  setTime(root.dataset.time || 'day', false);
  todBtns.forEach((b) => b.addEventListener('click', () => setTime(b.dataset.t, true)));
  $('.tod').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = todBtns.findIndex((b) => b.dataset.t === root.dataset.time);
    const n = todBtns[(i + (e.key === 'ArrowRight' ? 1 : -1) + 3) % 3];
    setTime(n.dataset.t, true); n.focus();
  });

  /* ---------- анимации ---------- */
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero__content > *', { y: 40, opacity: 0, duration: 1.2, stagger: .12, ease: 'power3.out', delay: .1 });
    gsap.from('.scene .front', { y: 80, duration: 1.6, ease: 'power3.out' });
    [['.hill-far', 40], ['.hill-mid', 70], ['.front', 110], ['.sun-move', -40]].forEach(([s, y]) => {
      gsap.to(s, { y: y, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.from('.perks li', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.perks', start: 'top 90%' } });
    $$('.head').forEach((h) => gsap.from(h.children, { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));
    gsap.from('.card', { y: 60, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 85%' } });
    gsap.from('.bento li', { y: 50, opacity: 0, duration: .9, stagger: .06, ease: 'power3.out', scrollTrigger: { trigger: '.bento', start: 'top 85%' } });
    gsap.from('.acc__item', { y: 30, opacity: 0, duration: .8, stagger: .07, scrollTrigger: { trigger: '.acc', start: 'top 85%' } });
    gsap.from('.cal, .booking', { y: 40, opacity: 0, duration: 1, stagger: .12, scrollTrigger: { trigger: '.dates__grid', start: 'top 80%' } });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- домики и цены ---------- */
  const cards = $$('.card');
  const houses = cards.map((c, i) => ({ id: c.dataset.id, name: c.dataset.name, wd: +c.dataset.wd, we: +c.dataset.we, i }));
  let mode = 'wd';
  $$('.toggle button').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.p;
    $$('.toggle button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    cards.forEach((c) => {
      const el = $('[data-price]', c);
      const to = +c.dataset[mode];
      if (hasGsap && !reduce) {
        const from = +el.textContent.replace(/\D/g, '');
        const o = { v: from };
        gsap.to(o, { v: to, duration: .6, ease: 'power2.out', onUpdate: () => { el.textContent = rub(Math.round(o.v / 100) * 100); } });
      } else el.textContent = rub(to);
    });
  }));

  /* ---------- календарь ---------- */
  const tabs = $('.house-tabs');
  let house = houses[2];
  houses.forEach((h) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = h.name; b.dataset.id = h.id;
    tabs.append(b);
  });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let start = null, end = null;
  const key = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const busy = (d) => {
    const k = key(d) + house.i * 7919;
    const h = Math.abs(Math.sin(k) * 10000) % 1;
    const wkend = d.getDay() === 5 || d.getDay() === 6;
    return h < (wkend ? .42 : .2);
  };
  const isWeekendNight = (d) => d.getDay() === 5 || d.getDay() === 6;
  const grid = $('.cal__grid'), title = $('.cal__title'), prevM = $('.cal__nav[data-m="-1"]');
  const render = () => {
    $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === house.id)));
    cards.forEach((c) => c.classList.toggle('is-picked', c.dataset.id === house.id));
    title.textContent = view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '');
    prevM.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    grid.innerHTML = '';
    const lead = (view.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) grid.append(document.createElement('span'));
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let n = 1; n <= days; n++) {
      const d = new Date(view.getFullYear(), view.getMonth(), n);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'day'; b.textContent = n; b.dataset.k = key(d);
      const past = d < today, bz = !past && busy(d);
      b.disabled = past || bz;
      if (bz) b.classList.add('is-busy');
      if (past) b.classList.add('is-past');
      if (+d === +today) b.classList.add('is-today');
      const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
      b.setAttribute('aria-label', label + (bz ? ', занято' : past ? ', прошло' : ''));
      if (start && +d === +start) b.classList.add('is-start');
      if (end && +d === +end) b.classList.add('is-end');
      if (start && end && d > start && d < end) b.classList.add('is-range');
      if (start && !end && +d === +start) b.classList.add('is-end');
      b._date = d;
      grid.append(b);
    }
    summary();
  };
  const rangeFree = (a, b) => { for (let d = new Date(a); d < b; d.setDate(d.getDate() + 1)) if (busy(d)) return false; return true; };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.day'); if (!b || b.disabled) return;
    const d = b._date;
    if (!start || end || d <= start) { start = d; end = null; }
    else if (rangeFree(start, d)) end = d;
    else { start = d; end = null; err.textContent = 'В этом промежутке есть занятые ночи — начнём с новой даты заезда.'; }
    if (end) err.textContent = '';
    render();
  });
  $$('.cal__nav').forEach((b) => b.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + +b.dataset.m, 1); render(); }));
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    house = houses.find((h) => h.id === b.dataset.id); start = end = null; render();
  });
  $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    house = houses.find((h) => h.id === b.closest('.card').dataset.id); start = end = null; render();
    scrollToEl($('#dates'));
  }));

  const fmtD = (d) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
  let total = 0, nights = 0;
  const summary = () => {
    $('#bk-house').textContent = house.name;
    $('#bk-in').textContent = start ? fmtD(start) + ', с 15:00' : 'выберите дату';
    $('#bk-out').textContent = end ? fmtD(end) + ', до 12:00' : '—';
    nights = 0; total = 0;
    if (start && end) for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) { nights++; total += isWeekendNight(d) ? house.we : house.wd; }
    $('#bk-nights').textContent = nights;
    $('#bk-total').textContent = rub(total);
  };

  /* ---------- бронирование ---------- */
  const form = $('#bk-form'), err = $('.booking__err'), done = $('.booking__done');
  const phone = form.phone;
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    const p = d.slice(1, 11);
    let s = d ? '+7' : '';
    if (p.length) s += ' (' + p.slice(0, 3);
    if (p.length >= 3) s += ') ' + p.slice(3, 6);
    if (p.length >= 6) s += '-' + p.slice(6, 8);
    if (p.length >= 8) s += '-' + p.slice(8, 10);
    phone.value = s;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    $$('.field', form).forEach((f) => f.classList.remove('is-invalid'));
    if (!start || !end) { err.textContent = 'Отметьте в календаре дату заезда и выезда.'; return; }
    const bad = [];
    if (form.name.value.trim().length < 2) bad.push(form.name);
    if (phone.value.replace(/\D/g, '').length !== 11) bad.push(phone);
    if (bad.length) { bad.forEach((i) => i.closest('.field').classList.add('is-invalid')); err.textContent = 'Укажите имя и телефон полностью, чтобы мы могли перезвонить.'; bad[0].focus(); return; }
    err.textContent = '';
    const w = nights % 10 === 1 && nights % 100 !== 11 ? 'ночь' : (nights % 10 >= 2 && nights % 10 <= 4 && (nights % 100 < 10 || nights % 100 >= 20) ? 'ночи' : 'ночей');
    $('#done-text').textContent = `${form.name.value.trim()}, «${house.name}» с ${fmtD(start)} по ${fmtD(end)}: ${nights} ${w}, ${rub(total)}.`;
    form.hidden = true; done.hidden = false; done.focus();
    if (hasGsap && !reduce) gsap.from(done.children, { y: 20, opacity: 0, duration: .6, stagger: .08, ease: 'back.out(2)' });
  });
  $('[data-again]').addEventListener('click', () => { done.hidden = true; form.hidden = false; start = end = null; render(); });
  render();

  /* ---------- галерея ---------- */
  const shots = $$('.shot'), lb = $('.lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let gi = 0;
  const showShot = (i) => {
    gi = (i + shots.length) % shots.length;
    const img = $('img', shots[gi]);
    lbImg.src = shots[gi].dataset.full; lbImg.alt = img.alt;
    lbCap.textContent = `${img.alt} · ${gi + 1} из ${shots.length}`;
    if (hasGsap && !reduce) gsap.fromTo(lbImg, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .45, ease: 'power2.out' });
  };
  shots.forEach((s, i) => s.addEventListener('click', () => { showShot(i); lb.showModal(); if (lenis) lenis.stop(); }));
  $('.lb__prev').addEventListener('click', () => showShot(gi - 1));
  $('.lb__next').addEventListener('click', () => showShot(gi + 1));
  $('.lb__close').addEventListener('click', () => lb.close());
  lb.addEventListener('close', () => { if (lenis) lenis.start(); shots[gi].focus(); });
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') showShot(gi - 1); if (e.key === 'ArrowRight') showShot(gi + 1); });
  let sx = 0;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showShot(gi + (dx < 0 ? 1 : -1)); });

  /* ---------- FAQ ---------- */
  $$('.acc__item button').forEach((b) => b.addEventListener('click', () => {
    const item = b.closest('.acc__item'), open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
  }));
})();
