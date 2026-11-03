(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && window.ScrollTrigger;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU');

  /* ---------- скролл ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const scrollToEl = (el) => lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault(); scrollToEl(t);
  }));

  /* ---------- статус студии ---------- */
  const h = new Date().getHours();
  const open = h >= 9 && h < 21;
  $('#status').textContent = open ? 'ОТКРЫТО ДО 21:00' : 'ЗАКРЫТО · ОТКРОЕМСЯ В 09:00';
  $('.dot').classList.toggle('is-off', !open);
  $('#boxes').textContent = open ? String(1 + (new Date().getDate() % 3)) : '4';

  /* ---------- скан-линия hero ---------- */
  const media = $('.hero__media');
  const setH = () => media.style.setProperty('--h', (media.clientHeight - 22) + 'px');
  setH(); window.addEventListener('resize', setH);

  /* ---------- анимации ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = (dec ? o.v.toFixed(dec).replace('.', ',') : fmt(o.v)) + suf; } });
  };
  counters.forEach((el) => { if (el.dataset.decimals) el.textContent = el.textContent.replace('.', ','); });

  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero__title > span', { yPercent: 100, opacity: 0, duration: 1.1, stagger: .12, ease: 'power4.out' });
    gsap.from('.hero__media', { clipPath: 'inset(0 100% 0 0)', duration: 1.4, ease: 'power4.inOut', delay: .3 });
    gsap.from('.hero__side > *, .hero__tag', { y: 20, opacity: 0, duration: .8, stagger: .1, delay: .6 });
    $$('.sec-head').forEach((el) => gsap.from(el.children, { y: 40, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
    gsap.from('.srv__row', { x: -40, opacity: 0, duration: .7, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '.srv', start: 'top 85%' } });
    gsap.from('.opt-group, .receipt', { y: 40, opacity: 0, duration: .8, stagger: .1, scrollTrigger: { trigger: '.calc__grid', start: 'top 85%' } });
    gsap.from('.wizard', { y: 60, opacity: 0, duration: 1, scrollTrigger: { trigger: '.wizard', start: 'top 88%' } });
    gsap.to('.marquee__track', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.marquee', scrub: true } });
    gsap.from('.footer__big', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });
    counters.forEach((el) => { el.textContent = '0'; });
    ScrollTrigger.create({ trigger: '.stats', start: 'top 85%', once: true, onEnter: () => counters.forEach(runCounter) });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- до / после ---------- */
  const ba = $('.ba'), range = $('.ba__range');
  const setPos = (p) => { p = Math.max(0, Math.min(100, p)); ba.style.setProperty('--pos', p + '%'); range.value = p; };
  range.addEventListener('input', () => setPos(+range.value));
  let drag = false;
  const fromEvent = (e) => { const r = ba.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * 100); };
  ba.addEventListener('pointerdown', (e) => { drag = true; ba.setPointerCapture(e.pointerId); fromEvent(e); });
  ba.addEventListener('pointermove', (e) => drag && fromEvent(e));
  ba.addEventListener('pointerup', () => { drag = false; });
  ba.addEventListener('pointercancel', () => { drag = false; });
  if (hasGsap && !reduce) {
    const o = { p: 70 };
    ScrollTrigger.create({ trigger: ba, start: 'top 70%', once: true, onEnter: () => gsap.timeline().to(o, { p: 52, duration: .9, ease: 'power2.inOut', onUpdate: () => setPos(o.p) }).to(o, { p: 92, duration: 1.2, ease: 'power2.inOut', onUpdate: () => setPos(o.p) }).to(o, { p: 70, duration: .8, ease: 'power2.inOut', onUpdate: () => setPos(o.p) }) });
  }

  /* ---------- калькулятор ---------- */
  const HOURS = { 'Двухфазная мойка': .7, 'Химчистка салона': 6, 'Полировка кузова': 12, 'Керамика 9H': 14, 'Бронеплёнка': 20, 'Антидождь + озон': 1 };
  const CONDS = [['СВЕЖИЙ', 1], ['ОБЫЧНОЕ', 1.1], ['ЗАПУЩЕН', 1.25]];
  const calc = $('#calc-form'), cond = $('#cond');
  const totalEl = $('#rc-total');
  let shown = 0;
  $('#rc-date').textContent = new Date().toLocaleDateString('ru-RU');
  $('#rc-no').textContent = String(1000 + Math.floor(Math.random() * 8999));
  const selected = () => $$('input[name="srv"]:checked', calc).map((i) => ({ name: i.dataset.name, price: +i.value }));
  const update = () => {
    const cls = +calc.cls.value;
    const [cName, cK] = CONDS[+cond.value];
    cond.style.setProperty('--fill', (+cond.value / 2) * 100 + '%');
    $('#cond-out').textContent = cName;
    const items = selected();
    const list = $('#rc-list');
    list.innerHTML = items.length ? items.map((s) => `<li><span>${s.name}</span><span>${fmt(s.price * cls)}</span></li>`).join('') : '<li class="is-empty">— ВЫБЕРИТЕ УСЛУГИ —</li>';
    $('#rc-cls').textContent = '×' + cls.toFixed(1);
    $('#rc-cond').textContent = '×' + cK.toFixed(2).replace(/0$/, '');
    const total = items.reduce((a, s) => a + s.price, 0) * cls * cK;
    const hrs = items.reduce((a, s) => a + HOURS[s.name], 0) * (cls > 1 ? 1.15 : 1);
    $('#rc-time').textContent = hrs === 0 ? '0 Ч' : hrs < 9 ? (Math.ceil(hrs * 2) / 2).toString().replace('.', ',') + ' Ч' : Math.ceil(hrs / 9) + (Math.ceil(hrs / 9) === 1 ? ' РАБОЧИЙ ДЕНЬ' : ' РАБОЧИХ ДНЯ');
    if (hasGsap && !reduce) {
      const o = { v: shown };
      gsap.to(o, { v: total, duration: .6, ease: 'power2.out', onUpdate: () => { totalEl.textContent = fmt(o.v); } });
    } else totalEl.textContent = fmt(total);
    shown = total;
  };
  calc.addEventListener('input', update);
  calc.addEventListener('change', update);
  update();

  /* ---------- запись по шагам ---------- */
  const wiz = $('#wizard'), steps = $$('.step', wiz), stepTabs = $$('.wizard__steps li'), bar = $('.wizard__bar i');
  const prev = $('[data-prev]'), next = $('[data-next]'), err = $('.wizard__err');
  const state = { day: null, slot: null };
  let cur = 0;

  $('#to-book').addEventListener('click', () => {
    const names = selected().map((s) => s.name);
    $$('input[name="w-srv"]', wiz).forEach((i) => { i.checked = names.includes(i.value); });
  });

  const days = $('#w-days'), slots = $('#w-slots');
  const WD = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.dataset.i = i; b.dataset.label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    b.innerHTML = `${WD[d.getDay()]}<b>${String(d.getDate()).padStart(2, '0')}</b>`;
    days.append(b);
  }
  const renderSlots = (di) => {
    slots.innerHTML = '';
    for (let hh = 9; hh <= 19; hh += 2) {
      const busy = ((hh * 7 + di * 13) % 5) === 0 || ((hh + di) % 6 === 0);
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.textContent = `${String(hh).padStart(2, '0')}:00`;
      b.disabled = busy;
      if (busy) b.setAttribute('aria-label', b.textContent + ', занято');
      slots.append(b);
    }
  };
  renderSlots(0);
  const pick = (group, btn) => { $$('button', group).forEach((x) => x.setAttribute('aria-checked', String(x === btn))); };
  days.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    pick(days, b); state.day = b.dataset.label; state.slot = null; renderSlots(+b.dataset.i);
  });
  slots.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    pick(slots, b); state.slot = b.textContent;
  });

  const phone = wiz.phone;
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

  const services = () => $$('input[name="w-srv"]:checked', wiz).map((i) => i.value);
  const validate = () => {
    $$('.inp', wiz).forEach((f) => f.classList.remove('is-invalid'));
    if (cur === 0 && !services().length) return 'ОТМЕТЬТЕ ХОТЯ БЫ ОДНУ УСЛУГУ';
    if (cur === 1 && !state.day) return 'ВЫБЕРИТЕ ДЕНЬ';
    if (cur === 1 && !state.slot) return 'ВЫБЕРИТЕ СВОБОДНОЕ ВРЕМЯ';
    if (cur === 2) {
      const bad = [];
      if (wiz.name.value.trim().length < 2) bad.push(wiz.name);
      if (phone.value.replace(/\D/g, '').length !== 11) bad.push(phone);
      if (wiz.car.value.trim().length < 2) bad.push(wiz.car);
      bad.forEach((i) => i.closest('.inp').classList.add('is-invalid'));
      if (bad.length) { bad[0].focus(); return 'ЗАПОЛНИТЕ ИМЯ, ТЕЛЕФОН ПОЛНОСТЬЮ И АВТО'; }
    }
    return '';
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = (n) => {
    cur = n;
    steps.forEach((s, i) => { s.hidden = i !== n; s.classList.toggle('is-active', i === n); });
    stepTabs.forEach((t, i) => { t.classList.toggle('is-active', i === n); t.classList.toggle('is-done', i < n); });
    bar.style.width = ((n + 1) / 4) * 100 + '%';
    prev.disabled = n === 0;
    next.textContent = n === 3 ? 'Подтвердить ✓' : 'Дальше →';
    if (n === 3) {
      $('#w-summary').innerHTML = [
        ['УСЛУГИ', services().join(', ')], ['КОГДА', `${state.day}, ${state.slot}`],
        ['ИМЯ', wiz.name.value.trim()], ['ТЕЛЕФОН', phone.value], ['АВТО', wiz.car.value.trim()],
      ].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    }
    if (hasGsap && !reduce) gsap.from(steps[n], { x: 30, opacity: 0, duration: .45, ease: 'power3.out' });
  };
  next.addEventListener('click', () => {
    const m = validate();
    err.textContent = m ? '! ' + m : '';
    if (m) return;
    if (cur < 3) return go(cur + 1);
    $('#done-id').textContent = '163-' + String(Math.floor(Math.random() * 9000) + 1000);
    wiz.hidden = true; $('.wizard__steps').hidden = true; $('.wizard__bar').hidden = true;
    const done = $('.done'); done.hidden = false; done.focus();
    if (hasGsap && !reduce) gsap.from(done.children, { y: 30, opacity: 0, duration: .6, stagger: .08 });
  });
  prev.addEventListener('click', () => { err.textContent = ''; if (cur > 0) go(cur - 1); });
  $('[data-restart]').addEventListener('click', () => {
    wiz.reset(); state.day = state.slot = null; $$('button', days).forEach((b) => b.setAttribute('aria-checked', 'false')); renderSlots(0);
    $('.done').hidden = true; wiz.hidden = false; $('.wizard__steps').hidden = false; $('.wizard__bar').hidden = false; go(0);
  });

  /* ---------- курсор-прицел ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    document.documentElement.classList.add('has-xhair');
    const hEl = $('.xhair__h'), vEl = $('.xhair__v'), rd = $('.xhair__read');
    let x = -100, y = -100, raf = 0;
    const draw = () => {
      raf = 0;
      hEl.style.transform = `translateY(${y}px)`; vEl.style.transform = `translateX(${x}px)`;
      rd.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
      rd.textContent = `X:${String(Math.round(x)).padStart(4, '0')} Y:${String(Math.round(y + window.scrollY)).padStart(4, '0')}`;
    };
    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(draw); });
  }
})();
