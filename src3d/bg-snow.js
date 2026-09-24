/* Neve de fundo: milhares de flocos num volume 3D, cada um numa
   profundidade — os de perto caem mais rápido, são maiores e correm mais
   quando a página rola (paralaxe de verdade, não camadas de CSS).
   Tudo acontece no shader: a CPU só avança dois relógios por quadro. */
import * as THREE from 'three';
import { makeRenderer, observeSize, pointer, scroll, damp, rand } from './util.js';

const VERT = /* glsl */`
  uniform float uFall;
  uniform float uSway;
  uniform float uWind;
  uniform float uScroll;
  uniform float uPR;
  uniform float uH;
  uniform float uW;
  uniform float uOpacity;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aSeed;
  attribute float aTint;
  varying float vAlpha;
  varying float vTint;
  void main() {
    vec3 p = position;
    float depth = clamp((p.z + 14.0) / 17.0, 0.0, 1.0);           // 0 = fundo, 1 = perto
    float y = p.y - uFall * aSpeed + uScroll * (0.25 + depth * 1.15);
    y = mod(y + uH * 0.5, uH) - uH * 0.5;
    float x = p.x + sin(uSway * aSpeed * 0.8 + aSeed * 6.2831) * 0.35 * (0.5 + depth)
                  + uWind * (0.4 + depth);
    x = mod(x + uW * 0.5, uW) - uW * 0.5;
    vec4 mv = modelViewMatrix * vec4(x, y, p.z, 1.0);
    gl_PointSize = aSize * uPR * (95.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.75 + 0.25 * sin(uSway * 1.7 + aSeed * 40.0);
    vAlpha = uOpacity * (0.22 + 0.78 * depth) * twinkle;
    vTint = aTint;
  }
`;

const FRAG = /* glsl */`
  varying float vAlpha;
  varying float vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.5);
    vec3 col = mix(vec3(1.0), vec3(0.76, 0.64, 1.0), vTint);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

export function createSnow(canvas, ctx) {
  const renderer = makeRenderer(canvas, { maxDPR: 1.5, antialias: false });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 60);
  camera.position.z = 8;

  const COUNT = ctx.coarse ? 550 : 1400;
  const H = 26, W = 48;
  const pos = new Float32Array(COUNT * 3);
  const size = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);
  const seed = new Float32Array(COUNT);
  const tint = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = rand(-W / 2, W / 2);
    pos[i * 3 + 1] = rand(-H / 2, H / 2);
    pos[i * 3 + 2] = -14 + 17 * Math.pow(Math.random(), 1.9); // a maioria lá no fundo
    size[i] = Math.random() < 0.06 ? rand(2.4, 3.6) : rand(0.6, 1.8);
    speed[i] = rand(0.55, 1.35);
    seed[i] = Math.random();
    tint[i] = Math.random() < 0.3 ? rand(0.5, 1) : rand(0, 0.25);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));

  const uniforms = {
    uFall: { value: 0 }, uSway: { value: 0 }, uWind: { value: 0 }, uScroll: { value: 0 },
    uPR: { value: renderer.getPixelRatio() }, uH: { value: H }, uW: { value: W }, uOpacity: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  observeSize(canvas, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  let camX = 0, camY = 0;
  let lastNow = performance.now();
  return {
    update(dt) {
      // o fade usa o relógio de verdade (não o dt limitado), então liga/desliga
      // no mesmo tempo mesmo num aparelho que roda a poucos quadros por segundo
      const now = performance.now();
      const realDt = Math.min(1, (now - lastNow) / 1000);
      lastNow = now;
      const storm = ctx.storm;
      uniforms.uFall.value += dt * 0.55 * (1 + storm * 5);
      uniforms.uSway.value += dt * (1 + storm * 3);
      uniforms.uWind.value += dt * storm * 3.2;
      uniforms.uScroll.value = scroll.y * 0.0035;
      uniforms.uOpacity.value = damp(uniforms.uOpacity.value, ctx.snowOn ? 1 : 0, 3, realDt);
      camX = damp(camX, pointer.nx * 0.7, 2, dt);
      camY = damp(camY, -pointer.ny * 0.45, 2, dt);
      camera.position.set(camX, camY, 8);
      camera.lookAt(0, 0, -4);
      canvas.style.visibility = uniforms.uOpacity.value < 0.01 ? 'hidden' : 'visible';
      if (uniforms.uOpacity.value >= 0.01) renderer.render(scene, camera);
    },
  };
}
