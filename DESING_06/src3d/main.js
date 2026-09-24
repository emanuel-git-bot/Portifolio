/* =========================================================
   Emanuel Roque — Portfólio · camada 3D (Three.js)
   Tudo aqui é enfeite progressivo: sem WebGL, o site continua
   inteiro (as classes .has-webgl / .no-webgl no <html> cuidam
   do CSS). Cada cena só nasce quando chega perto da tela e só
   desenha enquanto está visível — um único requestAnimationFrame
   para todas.
   ========================================================= */
import { createSnow } from './bg-snow.js';
import { createHeroSculpture } from './hero-sculpture.js';
import { createStackBalls } from './stack-balls.js';
import { createSnowGlobe } from './snow-globe.js';
import { createCoderDesk, layoutCoderDesk } from './coder-desk.js';

(function () {
  const root = document.documentElement;
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  })();
  if (!hasWebGL) { root.classList.add('no-webgl'); return; }
  root.classList.add('has-webgl');

  const readSnowPref = () => {
    try { return localStorage.getItem('er-neve') !== 'off'; } catch (e) { return true; }
  };
  const ctx = {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarse: window.matchMedia('(pointer: coarse)').matches,
    storm: 0,
    snowOn: readSnowPref(),
    onBlizzard: [],
  };

  const scenes = [];
  function register(el, factory, { always = false } = {}) {
    if (!el) return;
    const entry = { el, factory, inst: null, visible: always, always };
    const boot = () => {
      if (entry.inst) return;
      try {
        entry.inst = factory(el, ctx);
        el.classList.add('is-3d-ready');
        if (ctx.reduced) entry.inst.update(0);
      } catch (err) {
        console.warn('[3D] cena desativada:', err);
        el.classList.add('is-3d-failed');
        entry.dead = true;
      }
    };
    if (always) boot();
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        entry.visible = e.isIntersecting;
        if (e.isIntersecting) boot();
      }, { rootMargin: '250px 0px' }).observe(el);
    } else { entry.visible = true; boot(); }
    scenes.push(entry);
  }

  // neve de fundo: só com movimento liberado (é puro enfeite)
  if (!ctx.reduced) {
    const bg = document.createElement('canvas');
    bg.className = 'bg-snow';
    bg.setAttribute('aria-hidden', 'true');
    document.body.prepend(bg);
    register(bg, (el) => createSnow(el, ctx), { always: true });
  }
  register(document.getElementById('hero3d'), createHeroSculpture);
  register(document.getElementById('stack3d'), createStackBalls);
  register(document.getElementById('snowGlobe'), createSnowGlobe);

  // o boneco programador mora no vão entre o título e os cards do
  // "O que eu faço" — a posição depende do texto, então é medida aqui
  const coderEl = document.getElementById('coder3d');
  const placeCoder = () => layoutCoderDesk(coderEl);
  placeCoder();
  window.addEventListener('resize', placeCoder);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCoder);
  window.setTimeout(placeCoder, 1500);
  register(coderEl, createCoderDesk);

  // loop único
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.storm = Math.max(0, ctx.storm - dt / 6);
    if (!ctx.reduced) {
      for (const s of scenes) {
        if (s.inst && !s.dead && (s.visible || s.always)) s.inst.update(dt);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // botão de liga/desliga da neve
  const toggle = document.getElementById('snowToggle');
  if (toggle) {
    if (ctx.reduced) toggle.hidden = true;
    const sync = () => {
      toggle.setAttribute('aria-pressed', String(ctx.snowOn));
      toggle.title = ctx.snowOn ? 'Desligar a neve' : 'Ligar a neve';
    };
    sync();
    toggle.addEventListener('click', () => {
      ctx.snowOn = !ctx.snowOn;
      try { localStorage.setItem('er-neve', ctx.snowOn ? 'on' : 'off'); } catch (e) { /* sem storage, só não lembra */ }
      sync();
    });
  }

  // easter egg: digitar "neve" em qualquer lugar faz uma nevasca
  const toast = document.getElementById('snowToast');
  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (!e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === 'neve') {
      typed = '';
      ctx.snowOn = true;
      if (toggle) toggle.setAttribute('aria-pressed', 'true');
      ctx.storm = 1;
      ctx.onBlizzard.forEach((fn) => fn());
      if (toast) {
        toast.textContent = '❄ Nevasca!';
        toast.classList.add('is-on');
        window.setTimeout(() => toast.classList.remove('is-on'), 3200);
      }
    }
  });

  console.log('%c❄  Oi, dev curioso! Digite "neve" em qualquer lugar da página.', 'color:#c2a4ff;font:600 13px system-ui');
})();
