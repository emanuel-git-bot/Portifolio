/* Herói: um "</>" de vidro iridescente, extrudado em 3D, flutuando na
   borda da foto com cristais de gelo orbitando em volta. Vira na direção
   do mouse, se "abre" quando o cursor chega perto e gira conforme a
   página rola pra fora do herói. */
import * as THREE from 'three';
import { makeRenderer, makeEnvironment, observeSize, pointer, scroll, damp, clamp, rand, PALETTE } from './util.js';

function chevron(w) {
  // "<" com braços de espessura horizontal w (ponta à esquerda)
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0.82);
  s.lineTo(0.5 + w, 0.82);
  s.lineTo(-0.5 + w, 0);
  s.lineTo(0.5 + w, -0.82);
  s.lineTo(0.5, -0.82);
  s.closePath();
  return s;
}
function slash(w) {
  const s = new THREE.Shape();
  s.moveTo(-0.34, -0.98);
  s.lineTo(-0.34 + w, -0.98);
  s.lineTo(0.34 + w, 0.98);
  s.lineTo(0.34, 0.98);
  s.closePath();
  return s;
}

export function createHeroSculpture(container, ctx) {
  const canvas = container.querySelector('canvas');
  const mark = document.getElementById('heroMark');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  const DIST = 12, FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DIST);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1640, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(PALETTE.accentGlow, 40, 14);
  rim.position.set(-3, -1.5, 2.5);
  scene.add(rim);

  const extrude = { depth: 0.34, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 5, curveSegments: 4 };
  const glass = new THREE.MeshPhysicalMaterial({
    color: PALETTE.accent, metalness: 0.25, roughness: 0.16,
    clearcoat: 1, clearcoatRoughness: 0.08,
    iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 720],
    envMapIntensity: 1.5,
  });
  const glow = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, emissive: PALETTE.accentDeep, emissiveIntensity: 0.9,
    metalness: 0.1, roughness: 0.2, clearcoat: 1, envMapIntensity: 1.2,
  });

  const lt = new THREE.ExtrudeGeometry(chevron(0.38), extrude); lt.center();
  const gt = lt.clone(); gt.rotateY(Math.PI);
  const sl = new THREE.ExtrudeGeometry(slash(0.34), extrude); sl.center();

  const root = new THREE.Group();          // posição/escala na tela
  const tilt = new THREE.Group();          // rotação por mouse/rolagem
  root.add(tilt);
  scene.add(root);
  const glyphs = [
    { mesh: new THREE.Mesh(lt, glass), x: -1.5 },
    { mesh: new THREE.Mesh(sl, glow), x: 0 },
    { mesh: new THREE.Mesh(gt, glass), x: 1.5 },
  ];
  glyphs.forEach((g, i) => { g.mesh.position.x = g.x; g.phase = i * 1.3; tilt.add(g.mesh); });

  // halo: dois anéis finos inclinados, como órbitas
  const ringMat = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.55, toneMapped: false });
  const rings = [
    new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.014, 8, 180), ringMat),
    new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.01, 8, 180), ringMat.clone()),
  ];
  rings[0].rotation.set(1.2, 0.25, 0);
  rings[1].rotation.set(1.9, -0.5, 0.3);
  rings[1].material.opacity = 0.3;
  rings.forEach((r) => tilt.add(r));

  // cristais de gelo (icosaedros facetados) orbitando
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1ecff, metalness: 0.55, roughness: 0.12, flatShading: true,
    iridescence: 0.7, iridescenceIOR: 1.3, clearcoat: 1, envMapIntensity: 1.6,
  });
  const crystals = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.09, 0.26), 0), crystalMat);
    crystals.push({ m, a: rand(2.2, 3.1), b: rand(0.9, 1.6), speed: rand(0.18, 0.42) * (i % 2 ? 1 : -1), phase: rand(0, Math.PI * 2), tiltZ: rand(-0.6, 0.6), spin: rand(0.5, 1.6) });
    tilt.add(m);
  }

  let anchorX = 0, anchorY = 0, baseScale = 1, heroH = 1, wpp = 0.01;
  function layout(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wpp = (2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h; // unidades de mundo por pixel
    heroH = h;
    const cr = container.getBoundingClientRect();
    const r = mark ? mark.getBoundingClientRect() : { left: w * 0.62, top: h * 0.2, width: w * 0.3, height: h * 0.6 };
    const px = r.left - cr.left + r.width * 0.02;
    const py = r.top - cr.top + r.height * 0.62;
    anchorX = (px - w / 2) * wpp;
    anchorY = -(py - h / 2) * wpp;
    const targetPx = clamp(r.width * 0.5, 150, 270);
    baseScale = (targetPx * wpp) / 4.4;
  }
  observeSize(container, layout);
  window.setTimeout(() => layout(container.clientWidth, container.clientHeight), 1200);

  let rx = 0, ry = 0, spread = 1, intro = 0, t = 0;
  const v = new THREE.Vector3();
  return {
    update(dt) {
      if (!container.clientWidth) return;
      t += dt;
      intro = Math.min(1, intro + dt / 1.6);
      const e = 1 - Math.pow(1 - intro, 3);
      const elastic = intro < 1 ? 1 + Math.sin(intro * Math.PI * 2.5) * (1 - intro) * 0.25 : 1;
      const progress = clamp(scroll.y / Math.max(1, heroH * 0.9), 0, 1);

      // o mouse perto da peça "abre" o </>
      v.set(anchorX, anchorY, 0).project(camera);
      const sx = (v.x * 0.5 + 0.5) * container.clientWidth;
      const sy = (-v.y * 0.5 + 0.5) * container.clientHeight + container.getBoundingClientRect().top;
      const near = Math.hypot(pointer.x - (container.getBoundingClientRect().left + sx), pointer.y - sy) < 190;
      spread = damp(spread, near ? 1.32 : 1, 5, dt);

      rx = damp(rx, pointer.ny * 0.35 + progress * 0.9, 3, dt);
      ry = damp(ry, pointer.nx * 0.55 + Math.sin(t * 0.35) * 0.25 - progress * 1.4, 3, dt);
      tilt.rotation.set(rx, ry, Math.sin(t * 0.5) * 0.05);

      root.position.set(anchorX, anchorY + Math.sin(t * 0.8) * 0.06 + progress * 0.5, 0);
      canvas.style.opacity = String(Math.max(0, 1 - progress * 1.4));
      root.scale.setScalar(baseScale * e * elastic * (1 - progress * 0.25));

      glyphs.forEach((g) => {
        g.mesh.position.x = g.x * spread;
        g.mesh.position.y = Math.sin(t * 1.3 + g.phase) * 0.09;
        g.mesh.rotation.y = Math.sin(t * 0.9 + g.phase) * 0.18 + (spread - 1) * (g.x > 0 ? -1.2 : g.x < 0 ? 1.2 : 0);
        g.mesh.rotation.z = (spread - 1) * (g.x === 0 ? -0.9 : 0);
      });
      rings[0].rotation.z += dt * 0.25;
      rings[1].rotation.z -= dt * 0.18;
      crystals.forEach((c) => {
        const a = t * c.speed + c.phase;
        c.m.position.set(Math.cos(a) * c.a * spread, Math.sin(a) * c.b * 0.55 + Math.cos(a) * c.tiltZ, Math.sin(a) * c.b);
        c.m.rotation.x += dt * c.spin;
        c.m.rotation.y += dt * c.spin * 0.7;
      });
      renderer.render(scene, camera);
    },
    relayout() { layout(container.clientWidth, container.clientHeight); },
  };
}
