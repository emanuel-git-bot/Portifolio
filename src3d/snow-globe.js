/* Globo de neve com o mascote dentro. Arrastar gira o globo — e quanto
   mais rápido você arrasta, mais a neve lá dentro se agita; um clique
   (ou o botão "Chacoalhar", pra teclado) dá uma sacudida. A neve é
   simulada de verdade: gravidade, redemoinho, colisão com a parede de
   vidro e acúmulo no montinho do chão. */
import * as THREE from 'three';
import { makeRenderer, makeEnvironment, observeSize, pointer, damp, rand, softDotTexture, PALETTE } from './util.js';
import { buildSnowman } from './snowman.js';

/* vidro desenhado à mão, no espaço da câmera: brilho de borda lilás +
   dois reflexos de "janela" fixos nas laterais de cima. Antes o vidro
   refletia o ambiente inteiro, e uma parede clara desse reflexo caía bem
   em cima do rosto do boneco; aqui os reflexos ficam onde a gente manda. */
const GLASS_VERT = /* glsl */`
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const GLASS_FRAG = /* glsl */`
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    float facing = max(dot(n, normalize(vV)), 0.0);
    float rim = pow(1.0 - facing, 2.6);
    float win1 = smoothstep(0.955, 0.99, dot(n, normalize(vec3(-0.62, 0.6, 0.5))));
    float win2 = smoothstep(0.975, 0.993, dot(n, normalize(vec3(-0.35, 0.78, 0.52)))) * 0.7;
    float win3 = smoothstep(0.985, 0.997, dot(n, normalize(vec3(0.72, 0.38, 0.58)))) * 0.45;
    float band = smoothstep(0.035, 0.0, abs(rim - 0.55)) * step(n.y, -0.1) * 0.35;
    vec3 col = uRim * (rim * 0.95 + band) + vec3(1.0) * (win1 * 0.8 + win2 + win3);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSnowGlobe(container, ctx) {
  const canvas = container.querySelector('canvas');
  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 0.9;
  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.9, 8.3);
  camera.lookAt(0, 0.28, 0);

  scene.add(new THREE.HemisphereLight(0xf2ecff, 0x2a1640, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.PointLight(PALETTE.accentGlow, 60, 12);
  rim.position.set(-3, 1, -2);
  scene.add(rim);

  const globe = new THREE.Group();        // gira com o arrasto
  const wobble = new THREE.Group();       // balança com a sacudida
  wobble.add(globe);
  scene.add(wobble);

  const R = 1.6;
  const C = new THREE.Vector3(0, 0.4, 0);  // centro da bola de vidro
  const FLOOR = -0.72;

  // base
  const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x241a2e, roughness: 0.35, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.2 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.5, 0.62, 64), baseMat);
  base.position.y = FLOOR - 0.28;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.62, 0.14, 64), baseMat);
  plinth.position.y = FLOOR - 0.64;
  const bandMat = new THREE.MeshBasicMaterial({ color: PALETTE.accent, toneMapped: false });
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.39, 0.03, 10, 96), bandMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = FLOOR - 0.38;
  globe.add(base, plinth, band);

  // chão de neve (um montinho achatado)
  const snowMat = new THREE.MeshStandardMaterial({ color: PALETTE.snow, roughness: 0.9, emissive: 0x2a1a44, emissiveIntensity: 0.15 });
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), snowMat);
  mound.scale.set(1, 0.22, 1);
  mound.position.y = FLOOR;
  globe.add(mound);

  // pinheirinhos nevados atrás do boneco
  const treeMat = new THREE.MeshStandardMaterial({ color: 0xb7a3e6, roughness: 0.75, flatShading: true });
  const tree = (x, z, s) => {
    const t = new THREE.Group();
    [0, 0.22, 0.42].forEach((y, i) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34 - i * 0.08, 0.42, 7), treeMat);
      cone.position.y = y + 0.21;
      t.add(cone);
    });
    t.position.set(x, FLOOR + 0.12, z);
    t.scale.setScalar(s);
    globe.add(t);
  };
  tree(-0.72, -0.42, 1.0);
  tree(-0.38, -0.78, 0.75);
  tree(0.78, -0.5, 0.85);

  const man = buildSnowman();
  man.root.scale.setScalar(0.56);
  man.root.position.set(0.05, FLOOR + 0.2, 0.15);
  globe.add(man.root);

  // vidro: reflexo do "estúdio" somado por cima (preto não soma nada) +
  // um brilho de borda (fresnel) em lilás
  const glassGeo = new THREE.SphereGeometry(R, 72, 48);
  const glass = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({
    vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
    uniforms: { uRim: { value: new THREE.Color(PALETTE.accent) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glass.position.copy(C);
  // "água" de dentro: um fundo lilás bem escuro atrás do boneco, pra o
  // globo ler como um objeto cheio e não como um buraco na página
  const inner = new THREE.Mesh(glassGeo, new THREE.MeshBasicMaterial({
    color: 0x2a1846, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false,
  }));
  inner.position.copy(C);
  inner.renderOrder = -1;
  globe.add(inner);
  glass.renderOrder = 2;
  globe.add(glass);

  // neve de dentro
  const N = ctx.coarse ? 260 : 460;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const RIN = R * 0.9;
  const floorAt = (x, z) => FLOOR + 0.264 * Math.max(0, 1 - (x * x + z * z) / 1.44);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 1.1;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    pos[i * 3] = x; pos[i * 3 + 1] = floorAt(x, z) + 0.01; pos[i * 3 + 2] = z;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const flakes = new THREE.Points(snowGeo, new THREE.PointsMaterial({
    size: 0.055, map: softDotTexture(), transparent: true, depthWrite: false, color: 0xffffff, sizeAttenuation: true,
  }));
  flakes.renderOrder = 1;
  globe.add(flakes);

  observeSize(canvas, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  let energy = 0;
  let wobbleZ = 0, wobbleV = 0, wobbleX = 0, wobbleXV = 0;
  let yaw = -0.35, yawV = 0;
  let dragging = false, lastX = 0, lastY = 0, moved = 0;

  function shake(strength) {
    energy = Math.min(2.2, energy + strength);
    for (let i = 0; i < N; i++) {
      vel[i * 3] += rand(-1, 1) * strength * 1.4;
      vel[i * 3 + 1] += rand(0.6, 2.2) * strength;
      vel[i * 3 + 2] += rand(-1, 1) * strength * 1.4;
    }
    wobbleV += rand(-1, 1) * strength * 2.2;
    wobbleXV += rand(-0.5, 0.5) * strength * 1.5;
  }

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    yawV = dx * 0.4;
    wobbleV += dx * 0.012;
    wobbleXV += dy * 0.008;
    const s = Math.min(0.5, (Math.abs(dx) + Math.abs(dy)) * 0.012);
    if (s > 0.05) shake(s);
  });
  const end = () => {
    if (dragging && moved < 6) shake(1.1);   // foi um clique
    dragging = false;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  const btn = container.querySelector('.cta-globe__shake');
  if (btn) btn.addEventListener('click', () => shake(1.3));
  ctx.onBlizzard.push(() => shake(1.6));

  let firstView = true;
  const p = new THREE.Vector3();
  let headYaw = 0, headPitch = 0;

  function simulate(dt) {
    const swirl = energy * 1.6;
    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      let x = pos[ix], y = pos[ix + 1], z = pos[ix + 2];
      let vx = vel[ix], vy = vel[ix + 1], vz = vel[ix + 2];
      const fl = floorAt(x, z);
      const resting = y <= fl + 0.002 && Math.abs(vx) + Math.abs(vy) + Math.abs(vz) < 0.02;
      if (resting && energy < 0.05) continue;
      vy -= 0.55 * dt;                                   // gravidade (lenta: é "água")
      vx += -z * swirl * dt; vz += x * swirl * dt;       // redemoinho em volta do eixo
      vx += Math.sin(y * 7 + i) * 0.05 * dt;             // um pouco de turbulência
      const drag = Math.exp(-1.9 * dt);
      vx *= drag; vy *= drag; vz *= drag;
      x += vx * dt; y += vy * dt; z += vz * dt;
      // parede de vidro
      p.set(x - C.x, y - C.y, z - C.z);
      const d = p.length();
      if (d > RIN) {
        p.multiplyScalar(RIN / d);
        x = p.x + C.x; y = p.y + C.y; z = p.z + C.z;
        const nx = p.x / RIN, ny = p.y / RIN, nz = p.z / RIN;
        const vn = vx * nx + vy * ny + vz * nz;
        if (vn > 0) { vx -= 1.4 * vn * nx; vy -= 1.4 * vn * ny; vz -= 1.4 * vn * nz; }
      }
      // chão
      const f2 = floorAt(x, z);
      if (y < f2) { y = f2; vx *= 0.3; vz *= 0.3; vy = 0; }
      pos[ix] = x; pos[ix + 1] = y; pos[ix + 2] = z;
      vel[ix] = vx; vel[ix + 1] = vy; vel[ix + 2] = vz;
    }
    snowGeo.attributes.position.needsUpdate = true;
    energy *= Math.exp(-0.9 * dt);
  }

  if (ctx.reduced) {
    // estado parado bonito: neve suspensa no meio do caminho
    for (let i = 0; i < N; i++) {
      p.set(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)).normalize().multiplyScalar(Math.cbrt(Math.random()) * RIN * 0.95).add(C);
      pos[i * 3] = p.x; pos[i * 3 + 1] = Math.max(p.y, floorAt(p.x, p.z)); pos[i * 3 + 2] = p.z;
    }
    snowGeo.attributes.position.needsUpdate = true;
  }

  return {
    update(dt) {
      if (firstView && !ctx.reduced) { firstView = false; shake(1.4); }
      if (!ctx.reduced) simulate(dt);

      // giro: segue o arrasto, com inércia; sozinho, gira bem devagar
      if (!dragging) yawV = damp(yawV, ctx.reduced ? 0 : 0.18, 1.2, dt);
      yaw += yawV * dt;
      globe.rotation.y = yaw;
      // mola do balanço
      wobbleV += (-wobbleZ * 38 - wobbleV * 5) * dt; wobbleZ += wobbleV * dt;
      wobbleXV += (-wobbleX * 38 - wobbleXV * 5) * dt; wobbleX += wobbleXV * dt;
      wobble.rotation.z = Math.max(-0.35, Math.min(0.35, wobbleZ));
      wobble.rotation.x = Math.max(-0.25, Math.min(0.25, wobbleX));

      // o boneco vira a cabeça pro mouse (compensando o giro do globo)
      const r = canvas.getBoundingClientRect();
      const mx = ((pointer.x - (r.left + r.width / 2)) / innerWidth) * 2;
      const my = ((pointer.y - (r.top + r.height / 2)) / innerHeight) * 2;
      headYaw = damp(headYaw, Math.max(-1.1, Math.min(1.1, mx * 1.2 - Math.sin(yaw) * 0.9)), 4, dt);
      headPitch = damp(headPitch, Math.max(-0.3, Math.min(0.35, my * 0.5)), 4, dt);
      man.head.rotation.set(headPitch, headYaw, 0);
      // aceno de um braço quando a neve está agitada
      man.armR.rotation.z = -1.0 - Math.min(0.9, energy * 0.6) * (0.6 + 0.4 * Math.sin(performance.now() * 0.012));
      man.scarfTail.rotation.z = 0.16 + Math.sin(performance.now() * 0.002) * 0.08 + wobbleZ * 0.8;

      renderer.render(scene, camera);
    },
  };
}
