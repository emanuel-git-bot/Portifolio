/* Tech stack como bolhas 3D: cada tecnologia é uma esfera envernizada com
   o logo, todas atraídas pro centro e colidindo entre si. O cursor empurra
   as bolhas, o clique "explode" o cacho, e passar o mouse mostra o nome.
   Os logos entram no bundle como data URI (SVG) — assim a textura nunca
   fica "suja" por origem cruzada, nem abrindo o site via file://. */
import * as THREE from 'three';
import { makeRenderer, makeEnvironment, observeSize, damp, rand, PALETTE } from './util.js';

import python from '../assets/images/python-original.svg';
import javascript from '../assets/images/javascript-original.svg';
import typescript from '../assets/images/typescript-original.svg';
import react from '../assets/images/react-original.svg';
import nextjs from '../assets/images/nextjs-original.svg';
import nodejs from '../assets/images/nodejs-original.svg';
import django from '../assets/images/django-plain.svg';
import postgresql from '../assets/images/postgresql-original.svg';
import docker from '../assets/images/docker-original.svg';
import git from '../assets/images/git-original.svg';
import github from '../assets/images/github-original.svg';
import html5 from '../assets/images/html5-original.svg';
import css3 from '../assets/images/css3-original.svg';
import csharp from '../assets/images/csharp-original.svg';
import prisma from '../assets/images/prisma-original.svg';
import firebase from '../assets/images/firebase-plain.svg';
import trpc from '../assets/images/trpc.svg';
import fastify from '../assets/images/fastify-original.svg';
import expo from '../assets/images/expo-original.svg';
import vscode from '../assets/images/vscode-original.svg';
import flask from '../assets/images/flask-original.svg';
import mysql from '../assets/images/mysql-original.svg';
import ghactions from '../assets/images/githubactions-plain.svg';
import selenium from '../assets/images/selenium-original.svg';
import sqlite from '../assets/images/sqlite-plain.svg';
import drizzle from '../assets/images/drizzle.svg';
import gemini from '../assets/images/gemini.svg';

const ICONS = [
  [python, 'Python', 1.12], [javascript, 'JavaScript', 1.02], [typescript, 'TypeScript', 1.02],
  [react, 'React · React Native', 1.1], [django, 'Django · DRF', 1.08], [nextjs, 'Next.js', 0.98],
  [nodejs, 'Node.js', 0.98], [postgresql, 'PostgreSQL', 1.0], [docker, 'Docker', 0.95],
  [git, 'Git', 0.85], [github, 'GitHub', 0.88], [html5, 'HTML', 0.82], [css3, 'CSS', 0.82],
  [csharp, 'C#', 0.8], [prisma, 'Prisma', 0.85], [firebase, 'Firebase', 0.8], [trpc, 'tRPC', 0.85],
  [fastify, 'Fastify', 0.82], [expo, 'Expo', 0.85], [vscode, 'VS Code', 0.8], [flask, 'Flask', 0.78],
  [mysql, 'MySQL', 0.8], [ghactions, 'GitHub Actions', 0.85], [selenium, 'Selenium', 0.78],
  [sqlite, 'SQLite', 0.75], [drizzle, 'Drizzle', 0.75], [gemini, 'Gemini API', 0.8],
];

function logoTexture(url, renderer) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const paint = (img) => {
    g.fillStyle = '#f6f3fb';
    g.fillRect(0, 0, 512, 256);
    // sombra lilás bem leve embaixo, pra esfera não parecer chapada
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(194,164,255,.35)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    if (img) {
      const s = 104;
      const ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1;
      const w = ratio >= 1 ? s : s * ratio;
      const h = ratio >= 1 ? s / ratio : s;
      // u = 0.25 é a face virada pra câmera; repete atrás (u = 0.75)
      [128, 384].forEach((cx) => g.drawImage(img, cx - w / 2, 128 - h / 2, w, h));
    }
  };
  paint(null);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const img = new Image();
  img.onload = () => { paint(img); tex.needsUpdate = true; };
  img.src = url;
  return tex;
}

export function createStackBalls(container, ctx) {
  const canvas = container.querySelector('canvas');
  const label = container.querySelector('.stack-3d__label');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = makeEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a2360, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(PALETTE.accentGlow, 90, 30);
  rim.position.set(-7, -3, 4);
  scene.add(rim);

  const geo = new THREE.SphereGeometry(1, 40, 28);
  const balls = [];
  const addBall = (mat, r, name) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(r);
    scene.add(mesh);
    balls.push({ mesh, r, name, pos: new THREE.Vector3(rand(-9, 9), rand(9, 18), rand(-1, 1)), vel: new THREE.Vector3(), hover: 0 });
  };
  ICONS.forEach(([url, name, r]) => {
    addBall(new THREE.MeshPhysicalMaterial({
      map: logoTexture(url, renderer), roughness: 0.3, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9,
    }), r * 0.95, name);
  });
  // algumas bolhas sem logo, só na cor do site, pra dar volume ao cacho
  const plainA = new THREE.MeshPhysicalMaterial({ color: PALETTE.accentDeep, roughness: 0.15, metalness: 0.2, clearcoat: 1, iridescence: 0.6, envMapIntensity: 1.3 });
  const plainB = new THREE.MeshPhysicalMaterial({ color: PALETTE.accent, roughness: 0.2, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.2 });
  for (let i = 0; i < 7; i++) addBall(i % 2 ? plainA : plainB, rand(0.45, 0.7), null);

  let W = 1, H = 1, viewW = 10;
  observeSize(canvas, (w, h) => {
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // telas estreitas: afasta a câmera pra caber o cacho inteiro
    camera.position.z = w < 700 ? 14 * Math.min(2.1, 700 / w) : 14;
    camera.updateProjectionMatrix();
    viewW = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect;
  });

  // mouse → ponto no plano z = 0
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouse = new THREE.Vector3(999, 999, 0);
  let mouseActive = false;
  let hovered = null;
  const toNdc = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, mouse);
    return r;
  };
  const pick = (e) => {
    const r = toNdc(e);
    mouseActive = true;
    const hit = ray.intersectObjects(balls.map((b) => b.mesh), false)[0];
    hovered = hit ? balls.find((b) => b.mesh === hit.object) : null;
    if (label) {
      if (hovered && hovered.name) {
        label.textContent = hovered.name;
        label.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top - 18}px) translate(-50%, -100%)`;
        label.classList.add('is-on');
      } else label.classList.remove('is-on');
    }
  };
  canvas.addEventListener('pointermove', pick);
  canvas.addEventListener('pointerleave', () => { mouseActive = false; hovered = null; if (label) label.classList.remove('is-on'); });
  canvas.addEventListener('pointerdown', (e) => {
    pick(e); // no toque não existe "hover": o nome aparece no próprio toque
    balls.forEach((b) => {
      const d = b.pos.clone().sub(mouse);
      const len = Math.max(0.6, d.length());
      b.vel.addScaledVector(d.normalize(), 28 / len);
      b.vel.z += rand(-4, 4);
    });
  });

  const tmp = new THREE.Vector3();
  const qFront = new THREE.Quaternion();
  const qSpin = new THREE.Quaternion();
  const axis = new THREE.Vector3();

  function step(dt) {
    const k = 3.2;
    const squash = Math.min(1, (viewW * 0.5) / 12); // cacho mais largo que alto em telas largas
    for (const b of balls) {
      b.vel.x += -b.pos.x * k * 0.55 * squash * dt;
      b.vel.y += -b.pos.y * k * dt;
      b.vel.z += -b.pos.z * k * 2.2 * dt;
      b.vel.multiplyScalar(Math.exp(-2.4 * dt));
      if (mouseActive) {
        tmp.subVectors(b.pos, mouse);
        tmp.z = 0;
        const d = tmp.length();
        const reach = b.r + 1.5;
        if (d < reach && d > 0.0001) {
          b.vel.addScaledVector(tmp.normalize(), (reach - d) * 40 * dt);
        }
      }
    }
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        tmp.subVectors(b.pos, a.pos);
        const d = tmp.length();
        const min = a.r + b.r;
        if (d < min && d > 0.0001) {
          tmp.divideScalar(d);
          const push = (min - d) * 0.5;
          a.pos.addScaledVector(tmp, -push);
          b.pos.addScaledVector(tmp, push);
          const rel = tmp.dot(axis.subVectors(b.vel, a.vel));
          if (rel < 0) {
            const imp = -rel * 0.7;
            a.vel.addScaledVector(tmp, -imp);
            b.vel.addScaledVector(tmp, imp);
          }
        }
      }
    }
    for (const b of balls) b.pos.addScaledVector(b.vel, dt);
  }

  if (ctx.reduced) {
    balls.forEach((b) => b.pos.set(rand(-4, 4), rand(-3, 3), 0));
    for (let i = 0; i < 600; i++) step(1 / 60);
  }

  // só no build de depuração (npm run build:debug): avança a física na mão
  if (DEBUG) window.__dbgBalls = { balls, step, hover: (i) => { hovered = balls[i]; } };
  return {
    update(dt) {
      if (!ctx.reduced) {
        const sub = 3;
        for (let i = 0; i < sub; i++) step(dt / sub);
      }
      for (const b of balls) {
        b.mesh.position.copy(b.pos);
        b.hover = damp(b.hover, b === hovered ? 1 : 0, 10, dt);
        b.mesh.scale.setScalar(b.r * (1 + b.hover * 0.12));
        // rola conforme a velocidade e depois volta devagar a mostrar o logo
        const speed = Math.hypot(b.vel.x, b.vel.y);
        if (speed > 0.001 && !ctx.reduced) {
          axis.set(-b.vel.y, b.vel.x, 0).normalize();
          qSpin.setFromAxisAngle(axis, (speed * dt) / b.r * 0.5);
          b.mesh.quaternion.premultiply(qSpin);
        }
        b.mesh.quaternion.slerp(qFront, Math.min(1, dt * 1.6));
      }
      renderer.render(scene, camera);
    },
  };
}
