/* O mascote do site em 3D. Proporções tiradas direto do boneco de neve
   grande do "Sobre mim" (.coder-snowman no styles.css): corpo 14.8rem,
   tronco 10.6rem e cabeça 7.6rem de diâmetro, com as mesmas cores de
   chapéu, nariz, botões, gravetos e o cachecol no roxo do site.
   Unidade: 1 = 10rem. */
import * as THREE from 'three';
import { PALETTE } from './util.js';

export function buildSnowman() {
  const root = new THREE.Group();
  const snow = new THREE.MeshStandardMaterial({ color: PALETTE.snow, roughness: 0.82, emissive: 0x2a1a44, emissiveIntensity: 0.18 });
  const dark = new THREE.MeshStandardMaterial({ color: PALETTE.button, roughness: 0.5 });
  const hatMat = new THREE.MeshStandardMaterial({ color: PALETTE.hat, roughness: 0.55, metalness: 0.1 });
  const brimMat = new THREE.MeshStandardMaterial({ color: PALETTE.hatBrim, roughness: 0.55, metalness: 0.1 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xa77bff, roughness: 0.7, emissive: PALETTE.accentDeep, emissiveIntensity: 0.25 });
  const noseMat = new THREE.MeshStandardMaterial({ color: PALETTE.nose, roughness: 0.5 });
  const woodMat = new THREE.MeshStandardMaterial({ color: PALETTE.wood, roughness: 0.9 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: PALETTE.text });

  const sphere = (r, mat, y) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat);
    m.position.y = y;
    root.add(m);
    return m;
  };
  sphere(0.74, snow, 0.74);            // base  (14.8rem)
  const middle = sphere(0.53, snow, 1.73); // tronco (10.6rem, apoiado em 12rem)

  // botões na frente do tronco
  [0.28, 0.02, -0.24].forEach((dy) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), dark);
    const dir = new THREE.Vector3(0, dy / 0.53, 1).normalize();
    b.position.copy(dir.multiplyScalar(0.53)).add(middle.position);
    root.add(b);
  });

  // gravetos: saem da lateral do tronco, pra fora e um pouco pra cima
  const arm = (side) => {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.034, 0.9, 8), woodMat);
    stick.position.y = 0.45;
    g.add(stick);
    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.24, 6), woodMat);
    twig.position.set(0.06 * side, 0.7, 0);
    twig.rotation.z = -0.7 * side;
    g.add(twig);
    g.position.set(0.46 * side, 1.86, 0);
    g.rotation.z = -1.0 * side;
    root.add(g);
    return g;
  };
  const armL = arm(-1);
  const armR = arm(1);

  // cabeça + chapéu + rosto num grupo próprio (pra poder olhar pro mouse)
  const head = new THREE.Group();
  head.position.y = 2.43;
  root.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 40, 28), snow));

  const hat = new THREE.Group();
  hat.position.set(-0.03, 0.3, 0);
  hat.rotation.z = 0.07;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.07, 40), brimMat);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.34, 40), hatMat);
  crown.position.y = 0.2;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.292, 0.292, 0.06, 40), scarfMat);
  band.position.y = 0.07;
  hat.add(brim, crown, band);
  head.add(hat);

  const eye = (side) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), dark);
    const dir = new THREE.Vector3(0.36 * side, 0.2, 1).normalize();
    e.position.copy(dir).multiplyScalar(0.36);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), pupilMat);
    p.position.set(0.012, 0.018, 0.05);
    e.add(p);
    head.add(e);
  };
  eye(-1); eye(1);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.3, 16), noseMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 0.5);
  head.add(nose);

  // sorriso de carvão: cinco pedrinhas num arco embaixo do nariz
  for (let i = 0; i < 5; i++) {
    const u = (i - 2) / 2;                           // -1 .. 1
    const yaw = u * 0.5;
    const pitch = -0.3 - 0.09 * (1 - u * u);
    const coal = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), dark);
    coal.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(0.375);
    head.add(coal);
  }

  // cachecol: anel no pescoço + pontinha pendurada
  const scarf = new THREE.Group();
  scarf.position.y = 2.12;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.075, 14, 40), scarfMat);
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1, 1, 1.25);
  scarf.add(ring);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.05), scarfMat);
  tail.position.set(0.2, -0.2, 0.3);
  tail.rotation.set(0.35, 0, 0.16);
  scarf.add(tail);
  root.add(scarf);

  return { root, head, armL, armR, scarfTail: tail, height: 3.0 };
}
