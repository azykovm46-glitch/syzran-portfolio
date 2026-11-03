(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Плавный скролл ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : document.body;
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- Навигация ---------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- GSAP-анимации ---------- */
  if (hasGsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);

    // Появление hero
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.6, stagger: .12 })
      .from('.hero__eyebrow, .hero__actions', { y: 24, opacity: 0, duration: 1.2, stagger: .1 }, '-=1.1')
      .from('.hero__lead', { y: 24, duration: 1.2 }, '<')  // без opacity: абзац — LCP-элемент, он должен быть виден сразу
      .from('.nav', { y: -30, opacity: 0, duration: 1 }, '-=1.2')
      .from('.layer--kremlin', { yPercent: 8, duration: 2.2 }, 0)
      .from('.layer--river', { yPercent: 4, duration: 2.2 }, 0);

    // Медленный параллакс слоёв «вечерней Волги»
    const layers = [['.layer--sky', 6], ['.layer--far', 12], ['.layer--kremlin', 22], ['.layer--river', 10]];
    layers.forEach(([sel, amt]) => {
      gsap.to(sel, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero__content', { yPercent: -18, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Лёгкое движение сцены за мышью
    if (window.matchMedia('(pointer: fine)').matches) {
      const qx = layers.map(([sel]) => gsap.quickTo(sel, 'x', { duration: 1.6, ease: 'power3' }));
      window.addEventListener('mousemove', (e) => {
        const r = (e.clientX / innerWidth - .5);
        layers.forEach((_, i) => qx[i](r * -(i + 1) * 8));
      });
    }

    // Блоки при скролле
    $$('.reveal').forEach((el) => {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.frame img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from(img.parentElement, { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: img.parentElement, start: 'top 85%' } });
    });
    gsap.from('.item', { y: 30, opacity: 0, duration: 1, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: '.menu__list', start: 'top 85%' } });
    gsap.from('.facts > div', { y: 30, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.facts', start: 'top 90%' } });

    // Горизонтальная лента фирменных блюд (только десктоп)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const track = $('.signature__track');
      const dist = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.signature', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true }
      });
    });
    mm.add('(max-width: 860px)', () => {
      gsap.from('.dish', { x: 60, opacity: 0, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.signature__track', start: 'top 85%' } });
    });

    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- Фильтр меню ---------- */
  const chips = $$('.chip');
  const items = $$('.item');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', c === chip); });
    const canFlip = hasGsap && window.Flip && !reduce;
    const state = canFlip ? Flip.getState(items) : null;
    items.forEach((it) => { it.hidden = !(f === 'all' || it.dataset.cat === f); });
    if (canFlip) {
      Flip.from(state, {
        duration: .7, ease: 'expo.out', absolute: true, stagger: .02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .7, stagger: .04, ease: 'expo.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, duration: .3 }),
        onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh()
      });
    }
  }));

  /* ---------- Отзывы ---------- */
  const reviews = $$('.review');
  const count = $('.reviews__count b');
  let ri = 0, timer;
  const show = (n) => {
    ri = (n + reviews.length) % reviews.length;
    reviews.forEach((r, i) => r.classList.toggle('is-active', i === ri));
    count.textContent = String(ri + 1).padStart(2, '0');
  };
  const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show(ri + 1), 8000); };
  $$('.reviews__nav .round').forEach((b) => b.addEventListener('click', () => { show(ri + Number(b.dataset.dir)); auto(); }));
  auto();

  /* ---------- Бронирование ---------- */
  const form = $('#booking-form');
  const success = $('.success');
  const dateInput = form.date;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  dateInput.min = iso(today);
  const maxD = new Date(); maxD.setDate(maxD.getDate() + 60); dateInput.max = iso(maxD);
  dateInput.value = iso(today);

  const fillTimes = () => {
    const sel = form.time;
    const keep = sel.value;
    sel.length = 1;
    const now = new Date();
    const isToday = dateInput.value === iso(now);
    for (let h = 12; h <= 22; h++) for (const m of [0, 30]) {
      if (h === 22 && m === 30) continue;
      if (isToday && (h < now.getHours() + 1 || (h === now.getHours() + 1 && m < now.getMinutes()))) continue;
      const v = `${pad(h)}:${pad(m)}`;
      sel.add(new Option(v + (h >= 19 && h < 21 ? ' — закат' : ''), v));
    }
    if ([...sel.options].some((o) => o.value === keep)) sel.value = keep;
    if (sel.length === 1) { // сегодня уже поздно — переносим на завтра
      const t = new Date(); t.setDate(t.getDate() + 1); dateInput.value = iso(t); fillTimes();
    }
  };
  fillTimes();
  dateInput.addEventListener('change', fillTimes);

  let guests = 2;
  const out = form.querySelector('output');
  $$('.stepper button').forEach((b) => b.addEventListener('click', () => {
    guests = Math.min(12, Math.max(1, guests + Number(b.dataset.step)));
    out.textContent = guests;
  }));

  const phone = form.phone;
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let s = '+7';
    if (p.length) s += ' (' + p.slice(0, 3);
    if (p.length >= 3) s += ') ' + p.slice(3, 6);
    if (p.length >= 6) s += '-' + p.slice(6, 8);
    if (p.length >= 8) s += '-' + p.slice(8, 10);
    phone.value = s;
  });

  const err = $('.form__error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const problems = [];
    const mark = (el, bad) => el.closest('.field').classList.toggle('is-invalid', bad);
    const checks = [
      [dateInput, !dateInput.value || dateInput.value < dateInput.min, 'дату'],
      [form.time, !form.time.value, 'время'],
      [form.name, form.name.value.trim().length < 2, 'имя'],
      [phone, phone.value.replace(/\D/g, '').length !== 11, 'телефон полностью'],
    ];
    checks.forEach(([el, bad, label]) => { mark(el, bad); if (bad) problems.push(label); });
    if (problems.length) {
      err.textContent = 'Пожалуйста, укажите ' + problems.join(', ') + '.';
      checks.find(([, bad]) => bad)[0].focus();
      return;
    }
    err.textContent = '';
    const d = new Date(dateInput.value + 'T12:00');
    const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    const g = guests;
    const word = g % 10 === 1 && g % 100 !== 11 ? 'гость' : (g % 10 >= 2 && g % 10 <= 4 && (g % 100 < 10 || g % 100 >= 20) ? 'гостя' : 'гостей');
    $('.success__summary').textContent = `${form.name.value.trim()}, ${dateStr}, ${form.time.value}, ${g} ${word}`;
    form.hidden = true;
    success.hidden = false;
    requestAnimationFrame(() => success.classList.add('is-shown'));
    success.focus();
  });
  $('[data-reset]').addEventListener('click', () => {
    form.reset(); guests = 2; out.textContent = 2; dateInput.value = iso(new Date()); fillTimes();
    success.hidden = true; success.classList.remove('is-shown'); form.hidden = false;
  });
  form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-invalid'); });

  /* ---------- Курсор ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    document.documentElement.classList.add('has-cursor');
    const c = $('.cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
    const loop = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, input, select, label');
      c.classList.toggle('is-view', !!view && !link);
      c.classList.toggle('is-link', !!link);
    });
  }
})();
