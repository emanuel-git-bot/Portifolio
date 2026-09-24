/* Peças compartilhadas pelas cenas 3D: renderer, ambiente de reflexo,
   observação de tamanho e o estado global de mouse/rolagem. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const PALETTE = {
  accent: 0xc2a4ff,
  accentDeep: 0x7f40ff,
  accentGlow: 0xaa42ff,
  bg: 0x0b080c,
  text: 0xeae5ec,
  snow: 0xf5f7fb,
  hat: 0x1b1d21,
  hatBrim: 0x2a2d33,
  nose: 0xe8792e,
  button: 0x232323,
  wood: 0x6b4a29,
};

/* mouse em coordenadas de janela + normalizado (-1..1), e a rolagem —
   um único listener para todas as cenas */
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, moved: false };
export const scroll = { y: window.scrollY };
window.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.nx = (e.clientX / innerWidth) * 2 - 1;
  pointer.ny = (e.clientY / innerHeight) * 2 - 1;
  pointer.moved = true;
}, { passive: true });
window.addEventListener('scroll', () => { scroll.y = window.scrollY; }, { passive: true });

export function makeRenderer(canvas, { maxDPR = 1.75, antialias = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDPR));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/* "estúdio" neutro pré-filtrado: dá reflexo de verdade a vidro, verniz e
   metal sem precisar baixar nenhum HDRI */
export function makeEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

export function observeSize(el, cb) {
  let w = 0, h = 0;
  const run = () => {
    const nw = el.clientWidth, nh = el.clientHeight;
    if (nw && nh && (nw !== w || nh !== h)) { w = nw; h = nh; cb(w, h); }
  };
  if ('ResizeObserver' in window) new ResizeObserver(run).observe(el);
  else window.addEventListener('resize', run);
  run();
}

export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rand = (a, b) => a + Math.random() * (b - a);

/* sprite redondo e macio, usado pelos floquinhos de neve */
export function softDotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
