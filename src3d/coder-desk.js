/* "O que eu faço": o boneco de neve de óculos, sentado numa cadeira de
   escritório, programando num PC. A tela é uma textura desenhada ao vivo —
   o código aparece letra por letra no ritmo das teclas que acendem no
   teclado. Clicar faz ele parar, olhar pra você e acenar. */
import * as THREE from 'three';
import { makeRenderer, makeEnvironment, observeSize, pointer, damp, rand, softDotTexture, PALETTE } from './util.js';
import { buildSnowman } from './snowman.js';

/* trechos curtos e genéricos, no estilo do que o Emanuel escreve —
   nenhum é código real de projeto de cliente */
const SNIPPETS = [
  { file: 'tramitacao/services.py', lines: [
    'def despachar(proposicao):',
    '    if proposicao.status != "PROTOCOLADA":',
    '        raise EstadoInvalido()',
    '    proposicao.status = "EM_COMISSAO"',
    '    proposicao.save()',
    '    return proposicao',
  ] },
  { file: 'app/Neve.tsx', lines: [
    'export function Neve() {',
    '  const [flocos, setFlocos] = useState(0);',
    '  useEffect(() => nevar(setFlocos), []);',
    '  return <Globo flocos={flocos} />;',
    '}',
  ] },
  { file: 'terminal', lines: [
    '$ git add .',
    '$ git commit -m "boneco de neve 3D"',
    '$ git push origin main',
    '# deploy feito, bora pro próximo',
  ] },
];
const KEYWORDS = /\b(def|if|raise|return|export|function|const|import|from|class|await|async|useState|useEffect)\b/g;

function makeScreen() {
  const W = 640, H = 400;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const font = (px) => `${px}px "Geist Mono", ui-monospace, Consolas, monospace`;

  function colorize(line) {
    // devolve pedaços [texto, cor] com um realce de sintaxe bem simples
    if (/^\s*#/.test(line) || /^\s*\/\//.test(line)) return [[line, '#7d7390']];
    if (line.startsWith('$')) return [['$', '#c2a4ff'], [line.slice(1), '#eae5ec']];
    const parts = [];
    const re = /("[^"]*"?|'[^']*'?)/g;
    let last = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push([line.slice(last, m.index), null]);
      parts.push([m[0], '#9fe3bf']);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push([line.slice(last), null]);
    const out = [];
    parts.forEach(([txt, col]) => {
      if (col) { out.push([txt, col]); return; }
      let l = 0, k;
      KEYWORDS.lastIndex = 0;
      while ((k = KEYWORDS.exec(txt))) {
        if (k.index > l) out.push([txt.slice(l, k.index), '#eae5ec']);
        out.push([k[0], '#c2a4ff']);
        l = k.index + k[0].length;
      }
      if (l < txt.length) out.push([txt.slice(l), '#eae5ec']);
    });
    return out;
  }

  function draw(snippet, typedLines, cursorOn, waving) {
    g.fillStyle = '#100b17';
    g.fillRect(0, 0, W, H);
    // barra do editor
    g.fillStyle = '#1b1426';
    g.fillRect(0, 0, W, 38);
    ['#ff6b81', '#ffd166', '#7ee0a1'].forEach((col, i) => {
      g.fillStyle = col;
      g.beginPath(); g.arc(22 + i * 20, 19, 6, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = '#b9a8d9';
    g.font = font(16);
    g.fillText(snippet.file, 92, 25);
    if (waving) {
      g.fillStyle = '#c2a4ff';
      g.font = font(54);
      g.textAlign = 'center';
      g.fillText('oi! o/', W / 2, H / 2 + 20);
      g.textAlign = 'left';
      tex.needsUpdate = true;
      return;
    }
    g.font = font(23);
    const lh = 36;
    typedLines.forEach((line, i) => {
      const y = 80 + i * lh;
      g.fillStyle = '#4b425a';
      g.fillText(String(i + 1).padStart(2, ' '), 14, y);
      let x = 50;
      colorize(line).forEach(([txt, col]) => {
        g.fillStyle = col;
        g.fillText(txt, x, y);
        x += g.measureText(txt).width;
      });
      if (i === typedLines.length - 1 && cursorOn) {
        g.fillStyle = '#c2a4ff';
        g.fillRect(x + 2, y - 20, 12, 25);
      }
    });
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

/* posiciona o container no vão entre o título e os cards (layout em
   linha); no layout em coluna quem manda é o CSS */
export function layoutCoderDesk(container) {
  if (!container) return;
  const sec = container.parentElement;
  const h2 = sec && sec.querySelector('.what-box h2');
  const cards = sec && sec.querySelector('.what-box-in');
  if (!h2 || !cards) return;
  if (getComputedStyle(sec).flexDirection === 'column') {
    container.style.cssText = '';
    return;
  }
  const sr = sec.getBoundingClientRect();
  const a = h2.getBoundingClientRect();
  const b = cards.getBoundingClientRect();
  const gap = b.left - a.right;
  if (gap < 180) { container.style.cssText = 'display:none'; return; }
  const w = Math.min(gap - 10, 470);
  const h = Math.min(w * 1.12, b.height + 160);
  container.style.cssText =
    `position:absolute;left:${a.right - sr.left + (gap - w) / 2}px;` +
    `top:${(b.top + b.bottom) / 2 - sr.top - h / 2}px;width:${w}px;height:${h}px;`;
}

export function createCoderDesk(container, ctx) {
  const canvas = container.querySelector('canvas');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xece4ff, 0x1c1228, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const back = new THREE.PointLight(PALETTE.accentGlow, 30, 10);
  back.position.set(-2.5, 3.5, -2.5);
  scene.add(back);

  const THETA = 1.0;                   // o boneco olha pra direita da tela
  const rig = new THREE.Group();       // tudo no "referencial do boneco" (frente = +z)
  rig.rotation.y = THETA;
  scene.add(rig);

  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b2233, roughness: 0.55, metalness: 0.25 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.4, metalness: 0.4 });
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x3a2c48, roughness: 0.6, metalness: 0.1 });
  const accentMat = new THREE.MeshBasicMaterial({ color: PALETTE.accent, toneMapped: false });

  // --- cadeira de escritório ---
  const SEAT = 0.95;
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.74, 0.14, 40), darkMat);
  seat.position.y = SEAT - 0.07;
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.35, 0.14), darkMat);
  backrest.position.set(0, SEAT + 1.0, -0.86);
  backrest.rotation.x = -0.12;
  const backPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.08), blackMat);
  backPost.position.set(0, SEAT + 0.2, -0.8);
  const piping = new THREE.Mesh(new THREE.BoxGeometry(1.27, 0.03, 0.15), accentMat);
  piping.position.set(0, SEAT + 1.66, -0.9);
  piping.rotation.x = -0.12;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, SEAT - 0.25, 12), blackMat);
  pole.position.y = (SEAT - 0.25) / 2 + 0.18;
  chair.add(seat, backrest, backPost, piping, pole);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.62), blackMat);
    leg.position.set(Math.sin(a) * 0.3, 0.18, Math.cos(a) * 0.3);
    leg.rotation.y = a;
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), blackMat);
    wheel.position.set(Math.sin(a) * 0.6, 0.07, Math.cos(a) * 0.6);
    chair.add(leg, wheel);
  }
  rig.add(chair);

  // --- o boneco (mesmo mascote do resto do site) + óculos ---
  const man = buildSnowman();
  man.root.position.y = SEAT - 0.12;
  rig.add(man.root);
  const BASE_Y = man.root.position.y;

  const glasses = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x17131c, roughness: 0.3, metalness: 0.6 });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xd9c8ff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0,
    clearcoat: 1, envMapIntensity: 1.6, depthWrite: false,
  });
  [-1, 1].forEach((side) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 10, 32), frameMat);
    ring.position.set(0.125 * side, 0.07, 0.41);
    ring.rotation.y = 0.2 * side;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.095, 28), lensMat);
    lens.position.copy(ring.position);
    lens.rotation.y = ring.rotation.y;
    // haste: da armação até o lado da cabeça
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.34), frameMat);
    temple.position.set(0.225 * side, 0.08, 0.24);
    temple.rotation.y = -0.35 * side;
    glasses.add(ring, lens, temple);
  });
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8), frameMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.09, 0.42);
  glasses.add(bridge);
  man.head.add(glasses);

  // --- mesa ---
  const DESK = SEAT - 0.12 + 1.45;     // altura do tampo, na linha do peito
  const desk = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.09, 1.35), deskMat);
  top.position.set(0.55, DESK, 1.58);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.02, 0.02), accentMat);
  edge.position.set(0.55, DESK - 0.035, 0.9);
  desk.add(top, edge);
  // do lado do boneco a perna fica lá atrás — na frente ela cortaria a barriga dele
  [[-0.6, 2.16], [1.7, 1.0], [1.7, 2.16]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, DESK, 0.08), blackMat);
    leg.position.set(x, DESK / 2, z);
    desk.add(leg);
  });
  rig.add(desk);

  // --- monitor: virado a meio caminho entre o boneco e a câmera ---
  const screen = makeScreen();
  const monitor = new THREE.Group();
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.88, 0.06), blackMat);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.8), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  panel.position.z = 0.032;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.05), blackMat);
  neck.position.set(0, -0.56, -0.05);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.3), blackMat);
  foot.position.set(0, -0.76, 0.02);
  monitor.add(bezel, panel, neck, foot);
  monitor.position.set(0.2, DESK + 0.81, 1.95);
  // normal da tela no mundo: entre "olhando pro boneco" e "olhando pra câmera"
  const wantWorld = new THREE.Vector3(-Math.sin(THETA), 0, -Math.cos(THETA)).add(new THREE.Vector3(0, 0, 1.25)).normalize();
  const local = wantWorld.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -THETA);
  monitor.rotation.y = Math.atan2(local.x, local.z);
  rig.add(monitor);
  // a luz da tela batendo no rosto do boneco
  const screenLight = new THREE.PointLight(0x9d7bff, 5, 3.2);
  screenLight.position.set(0.1, DESK + 0.8, 1.55);
  rig.add(screenLight);

  // --- teclado com teclas que acendem ---
  const KEY_ROWS = 4, KEY_COLS = 12;
  const kb = new THREE.Group();
  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.32), blackMat);
  kb.add(kbBase);
  const keyGeo = new THREE.BoxGeometry(0.058, 0.025, 0.058);
  const keys = new THREE.InstancedMesh(keyGeo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), KEY_ROWS * KEY_COLS);
  const keyGlow = new Float32Array(KEY_ROWS * KEY_COLS);
  const mtx = new THREE.Matrix4();
  const keyBase = new THREE.Color(0x3a3046);
  const keyHot = new THREE.Color(PALETTE.accent);
  const tmpC = new THREE.Color();
  for (let r = 0; r < KEY_ROWS; r++) {
    for (let c = 0; c < KEY_COLS; c++) {
      const i = r * KEY_COLS + c;
      mtx.makeTranslation(-0.4 + c * 0.073, 0.03, -0.11 + r * 0.073);
      keys.setMatrixAt(i, mtx);
      keys.setColorAt(i, keyBase);
    }
  }
  kb.add(keys);
  kb.position.set(0.02, DESK + 0.065, 1.2);
  kb.rotation.y = 0.12;
  rig.add(kb);

  const mouseDev = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), blackMat);
  mouseDev.scale.set(0.8, 0.45, 1.2);
  mouseDev.position.set(0.72, DESK + 0.06, 1.2);
  rig.add(mouseDev);

  // caneca com vapor
  const mugMat = new THREE.MeshStandardMaterial({ color: PALETTE.accentDeep, roughness: 0.35, emissive: PALETTE.accentDeep, emissiveIntensity: 0.15 });
  const mug = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.19, 24), mugMat);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), mugMat);
  handle.position.x = 0.1;
  mug.add(cup, handle);
  mug.position.set(1.05, DESK + 0.14, 1.45);
  rig.add(mug);
  const steamMat = new THREE.SpriteMaterial({ map: softDotTexture(), color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false });
  const steam = [0, 1, 2].map((i) => {
    const s = new THREE.Sprite(steamMat.clone());
    s.userData.phase = i / 3;
    mug.add(s);
    return s;
  });

  // gabinete no chão com fita de LED
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.95, 0.9), blackMat);
  tower.position.set(1.25, 0.48, 1.65);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.03), accentMat);
  led.position.set(1.03, 0.5, 1.22);
  rig.add(tower, led);

  // brilho no chão, pra cena não flutuar no vazio
  const gc = document.createElement('canvas');
  gc.width = gc.height = 128;
  const gg = gc.getContext('2d');
  const grad = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(170,66,255,.45)');
  grad.addColorStop(1, 'rgba(170,66,255,0)');
  gg.fillStyle = grad;
  gg.fillRect(0, 0, 128, 128);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.3, 0.005, 0.9);

  // --- enquadramento: cabe a cena inteira no canvas ---
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rig);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = size.length() * 0.5;
  rig.add(floor); // depois de medir: o brilho do chão não entra no enquadramento
  let camDist = 10;
  observeSize(canvas, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    camDist = (radius * 0.78) / Math.sin(Math.min(vFov, hFov) / 2);
    camera.updateProjectionMatrix();
  });

  // --- braços: miram a posição das mãos no teclado ---
  const UP = new THREE.Vector3(0, 1, 0);
  const shoulder = new THREE.Vector3();
  const target = new THREE.Vector3();
  const dir = new THREE.Vector3();
  function aimArm(arm, side, tx, ty, tz) {
    shoulder.set(0.46 * side, 1.86, 0);                 // no espaço do boneco
    target.set(tx, ty - BASE_Y, tz);
    dir.subVectors(target, shoulder);
    const len = dir.length();
    arm.quaternion.setFromUnitVectors(UP, dir.normalize());
    arm.scale.set(1, len / 0.9, 1);
  }

  // estado da digitação
  let snippetIdx = 0, lineIdx = 0, charIdx = 0;
  let typed = [''];
  let nextKey = 0.3, pause = 0, cursorT = 0, cursorOn = true;
  let waveT = 0, t = 0;
  let handL = 0, handR = 0;
  const redraw = () => screen.draw(SNIPPETS[snippetIdx], typed, cursorOn, waveT > 0);

  function typeOne() {
    const sn = SNIPPETS[snippetIdx];
    const line = sn.lines[lineIdx];
    if (charIdx < line.length) {
      typed[typed.length - 1] += line[charIdx++];
      const k = Math.floor(Math.random() * keyGlow.length);
      keyGlow[k] = 1;
      if (Math.random() < 0.5) handL = 1; else handR = 1;
      nextKey = rand(0.045, 0.12) + (line[charIdx - 1] === ' ' ? 0.05 : 0);
    } else if (lineIdx < sn.lines.length - 1) {
      lineIdx++; charIdx = 0; typed.push('');
      keyGlow[KEY_COLS * 2 + KEY_COLS - 1] = 1;           // "enter"
      handR = 1;
      nextKey = rand(0.25, 0.6);
    } else {
      pause = 2.4;                                        // admira o próprio código
      snippetIdx = (snippetIdx + 1) % SNIPPETS.length;
      lineIdx = 0; charIdx = 0;
    }
    redraw();
  }

  if (ctx.reduced) {
    typed = SNIPPETS[0].lines.slice();
    lineIdx = typed.length - 1;
  }
  redraw();

  canvas.addEventListener('pointerdown', () => {
    if (ctx.reduced) return;
    waveT = 2.6;
    redraw();
  });

  let headYaw = 0, headPitch = -0.12, camX = 0;
  if (DEBUG) window.__dbgCoder = { wave: () => waveT, frames: 0 };
  const lookCam = -THETA;                                   // yaw local que aponta pra câmera
  return {
    update(dt) {
      if (DEBUG) window.__dbgCoder.frames++;
      t += dt;
      const waving = waveT > 0;
      if (waving) {
        waveT -= dt;
        if (waveT <= 0) { waveT = 0; redraw(); }
      } else if (!ctx.reduced) {
        if (pause > 0) {
          pause -= dt;
          if (pause <= 0) { typed = ['']; redraw(); }
        } else {
          nextKey -= dt;
          while (nextKey <= 0 && pause <= 0) typeOne();
        }
      }
      cursorT += dt;
      if (cursorT > 0.5) { cursorT = 0; cursorOn = !cursorOn; if (!waving && !ctx.reduced) redraw(); }

      // teclas voltando à cor normal
      for (let i = 0; i < keyGlow.length; i++) {
        if (keyGlow[i] > 0) {
          keyGlow[i] = Math.max(0, keyGlow[i] - dt * 5);
          keys.setColorAt(i, tmpC.copy(keyBase).lerp(keyHot, keyGlow[i]));
        }
      }
      keys.instanceColor.needsUpdate = true;

      handL = Math.max(0, handL - dt * 9);
      handR = Math.max(0, handR - dt * 9);
      if (waving) {
        // o braço do lado da câmera sobe e acena
        aimArm(man.armL, -1, -1.05, BASE_Y + 3.0 + Math.sin(t * 14) * 0.18, 0.35 + Math.cos(t * 14) * 0.12);
        aimArm(man.armR, 1, 0.14, DESK + 0.14, 1.18);
      } else {
        aimArm(man.armL, -1, -0.16, DESK + 0.12 + handL * 0.07, 1.18);
        aimArm(man.armR, 1, 0.2, DESK + 0.12 + handR * 0.07, 1.2);
      }

      // cabeça: acompanha a tela, balança no ritmo; no aceno, olha pra você
      const bob = ctx.reduced ? 0 : Math.sin(t * 7) * 0.012 * (pause > 0 ? 0 : 1);
      const r = canvas.getBoundingClientRect();
      const near = pointer.x > r.left - 60 && pointer.x < r.right + 60 && pointer.y > r.top - 60 && pointer.y < r.bottom + 60;
      headYaw = damp(headYaw, waving ? lookCam : near ? -0.35 : 0.05, waving ? 6 : 2.5, dt);
      headPitch = damp(headPitch, waving ? 0.08 : -0.1 + bob, 5, dt);
      man.head.rotation.set(headPitch, headYaw, 0);
      man.root.position.y = BASE_Y + (waving ? Math.abs(Math.sin(t * 7)) * 0.05 : 0);
      man.scarfTail.rotation.z = 0.16 + Math.sin(t * 1.8) * 0.06;

      steam.forEach((s) => {
        const p = (t * 0.35 + s.userData.phase) % 1;
        s.position.set(Math.sin(p * 6 + s.userData.phase * 9) * 0.03, 0.12 + p * 0.45, 0);
        s.scale.setScalar(0.08 + p * 0.14);
        s.material.opacity = 0.32 * Math.sin(p * Math.PI);
      });
      led.material.color.setHSL(0.74 + Math.sin(t * 0.8) * 0.04, 0.9, 0.72);

      // câmera: levemente puxada pelo mouse
      camX = damp(camX, pointer.nx * 0.5, 2, dt);
      camera.position.set(center.x + camX, center.y + radius * 0.32, center.z + camDist);
      camera.lookAt(center.x, center.y - radius * 0.04, center.z);
      renderer.render(scene, camera);
    },
  };
}
