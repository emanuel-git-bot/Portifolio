import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

// THREE.CapsuleGeometry duplicates every UV-seam vertex (measured: 194 boundary
// edges on the default radius/segments below) -- same benign pattern as box/
// cylinder/sphere/torus, all of which weld cleanly to 0 given a CORRECT weld.
// (A naive vertex-only mergeVertices() reports 64 'non-manifold' edges here, but
// that is a counting artifact, not a real defect: it double-counts a handful of
// near-pole triangles that become degenerate once two of their three corners
// coincide -- confirmed by replicating subdivideCatmullClark's own degenerate-
// triangle-aware vertex identity, which finds a perfectly ordinary 2-manifold.)
// A capsule is the primary shape for skinned limbs/torso (PLAN_1.5), and skinning
// weight computation is O(vertices x bones), so fewer, guaranteed-simple vertices
// is worth having regardless -- authored as a deterministic, closed-by-
// construction mesh instead: shared pole vertices, and
// the radial index taken `% radialSegments` so the seam is never a duplicate
// vertex in the first place, rather than something to weld away afterward.
// Adapted from forge/stage5_rig/emit_rig.py's buildWatertightCapsule (verified
// there: 0 boundary edges, 0 non-manifold edges, deterministic across repeated
// runs) -- ported here rather than imported because this factory and the rig
// emitter are separate generated-output surfaces with no shared runtime module;
// see forge/tests/test_primitive_watertightness.py for the measured proof, and
// coordinate with the rig owner before changing either copy independently.
function buildWatertightCapsule(
  radius: number,
  cylLength: number,
  capSegments: number,
  radialSegments: number,
  heightSegments: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const halfCyl = cylLength / 2;
  const totalSpan = 2 * (Math.PI / 2 * radius) + Math.max(0, cylLength);
  const vOf = (fromBottom: number) => (totalSpan > 0 ? fromBottom / totalSpan : 0);

  const bottomPoleIndex = positions.length / 3;
  positions.push(0, -halfCyl - radius, 0);
  uvs.push(0.5, vOf(0));

  const ringStarts: number[] = [];
  const ringV: number[] = [];
  for (let ring = 1; ring <= capSegments; ring += 1) {
    const phi = (Math.PI / 2) * (ring / capSegments);
    const y = -halfCyl - radius * Math.cos(phi);
    const r = radius * Math.sin(phi);
    const start = positions.length / 3;
    ringStarts.push(start);
    ringV.push(vOf(radius * phi));
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const theta = (radial / radialSegments) * Math.PI * 2;
      positions.push(r * Math.cos(theta), y, r * Math.sin(theta));
      uvs.push(radial / radialSegments, vOf(radius * phi));
    }
  }

  const cylinderRingStarts: number[] = [];
  if (cylLength > 0) {
    for (let step = 1; step <= heightSegments; step += 1) {
      const y = -halfCyl + (cylLength * step) / heightSegments;
      const start = positions.length / 3;
      cylinderRingStarts.push(start);
      const v = vOf(radius * (Math.PI / 2) + halfCyl + y);
      for (let radial = 0; radial < radialSegments; radial += 1) {
        const theta = (radial / radialSegments) * Math.PI * 2;
        positions.push(radius * Math.cos(theta), y, radius * Math.sin(theta));
        uvs.push(radial / radialSegments, v);
      }
    }
  }

  const topRingStarts: number[] = [];
  for (let ring = capSegments - 1; ring >= 1; ring -= 1) {
    const phi = (Math.PI / 2) * (ring / capSegments);
    const y = halfCyl + radius * Math.cos(phi);
    const r = radius * Math.sin(phi);
    const start = positions.length / 3;
    topRingStarts.push(start);
    const v = vOf(radius * (Math.PI / 2) + Math.max(0, cylLength) + radius * (Math.PI / 2 - phi));
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const theta = (radial / radialSegments) * Math.PI * 2;
      positions.push(r * Math.cos(theta), y, r * Math.sin(theta));
      uvs.push(radial / radialSegments, v);
    }
  }

  const topPoleIndex = positions.length / 3;
  positions.push(0, halfCyl + radius, 0);
  uvs.push(0.5, vOf(totalSpan));

  const firstBottomRing = ringStarts[0];
  for (let radial = 0; radial < radialSegments; radial += 1) {
    const next = (radial + 1) % radialSegments;
    indices.push(bottomPoleIndex, firstBottomRing + radial, firstBottomRing + next);
  }

  const allRings = [...ringStarts, ...cylinderRingStarts, ...topRingStarts];
  for (let i = 0; i < allRings.length - 1; i += 1) {
    const a = allRings[i];
    const b = allRings[i + 1];
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const next = (radial + 1) % radialSegments;
      indices.push(a + radial, a + next, b + next);
      indices.push(a + radial, b + next, b + radial);
    }
  }

  const lastRing = allRings[allRings.length - 1];
  for (let radial = 0; radial < radialSegments; radial += 1) {
    const next = (radial + 1) % radialSegments;
    indices.push(topPoleIndex, lastRing + next, lastRing + radial);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [clampAlbedoChannel((value >> 16) & 255), clampAlbedoChannel((value >> 8) & 255), clampAlbedoChannel(value & 255)];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampAlbedoChannel(value: number): number {
  return Math.max(30, Math.min(240, Math.round(value)));
}

function clampPbrF0(value: number): number {
  return Math.max(0.02, Math.min(1, value));
}

function clampPbrIor(value: number): number {
  return Math.max(1, Math.min(2.5, value));
}

function clampPbrMetalness(value: number): number {
  return value >= 0.5 ? 1 : 0;
}

function clampedAlbedoColor(spec: SculptMaterialSpec): THREE.Color {
  const source = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  // setStyle with an explicit SRGBColorSpace, NOT the numeric constructor.
  //
  // `new THREE.Color(r, g, b)` treats its arguments as LINEAR working-space components,
  // while an authored `baseColor` hex is sRGB. Feeding one to the other skipped the
  // transfer function and lifted every dark albedo: #2e2a28, authored as a near-black
  // vinyl, rendered at roughly sRGB 0.46 — a mid grey. The error is largest exactly where
  // it matters most, because the transfer curve is steepest near black.
  return new THREE.Color().setStyle(source, THREE.SRGBColorSpace);
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [clampAlbedoChannel(Number(match[1])), clampAlbedoChannel(Number(match[2])), clampAlbedoChannel(Number(match[3]))];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions, denseComponent = false): THREE.MeshPhysicalMaterial {
  // A material that declares -- with evidence -- that its subject carries no texture
  // detail gets NO texture set. Synthesising one anyway is not a harmless default: the
  // branch below then forces color to white and roughness to 1 and reads both from the
  // generated maps, so the authored albedo and the reference-derived roughness are both
  // discarded, and the model gains mottling the reference does not have. Measured on the
  // tuxedo cat, whose black fur rendered as speckled grey-and-white from a palette that
  // only ever described two flat regions.
  const textureless = (spec.textureless as { declared?: boolean } | undefined)?.declared === true;
  const textures = textureless
    ? null
    : makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : clampedAlbedoColor(spec),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clampPbrMetalness(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: clampPbrIor(readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: clampPbrIor(readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clampPbrF0(readLayerNumber(spec.specularF0 ?? spec.f0 ?? spec.specularIntensity, ['base', 'value'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
    flatShading: spec.flatShading === true,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const denseMesh = denseComponent || spec.denseMesh === true || spec.geometryDensity === 'dense' || spec.topologyClass === 'dense';
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    const effectiveBumpScale = denseMesh ? Math.max(0.05, bumpScale) : bumpScale;
    if (effectiveBumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = effectiveBumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    const effectiveDisplacementScale = denseMesh ? Math.max(0.005, displacementScale) : displacementScale;
    if (effectiveDisplacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = effectiveDisplacementScale;
      material.displacementBias = -effectiveDisplacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrConstraints = { albedoRange: [30, 240], binaryMetalness: true, f0Range: [0.02, 1], iorRange: [1, 2.5] };
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.userData.referenceMaterialId = spec.referenceMaterialId ?? spec.materialReference?.profileId ?? null;
  material.userData.materialEvidence = spec.materialEvidence ?? null;
  material.userData.validationViews = spec.materialReference?.validationViews ?? [];
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: Stylized Snowman Figure
// Sculpt build pass: blockout
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createStylizedSnowmanFigureModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "Stylized Snowman Figure";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": false, "fovDegrees": 40.0, "aspect": 1.0, "orientation": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}, "positionHint": [0.0, 0.0, 3.0], "note": "For likeness work, solve the reference camera (forge/stage1_intake/solve_camera_pose.py) so the review render aligns with the photo and the reference can be projected. Confirm by overlay review."}, "approximationNotes": []};
  root.userData.materialPipeline = {};
  root.userData.materialReferenceRegistry = null;

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["bodySnow"] = createSculptMaterial(
    "bodySnow",
    {"id": "bodySnow", "name": "Snow body (satin cool-white gradient)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#FFFFFF", "color": "#FFFFFF", "albedo": {"dominant": "#FFFFFF", "secondary": ["#E6EBF1", "#C3CCD6"], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\bodysnow_albedo.png", "url": "bodysnow_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#FFFFFF", "#E6EBF1", "#C3CCD6"], "pattern": "reference-derived pixel palette", "amplitude": 0.098, "heightCorrelation": 0.42}, "roughness": {"base": 0.686, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\bodysnow_ao.png", "url": "bodysnow_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.15, "localOverrides": [{"id": "rimLight", "region": "lateral edge of each body sphere", "description": "Soft lavender rim-light glow, additive, not part of base albedo", "color": "#C2A4FF", "opacity": 0.6}, {"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Radial gradient highlight at ~66%/30% of each sphere face, confirmed from CSS radial-gradient stops.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'bodySnow', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["hatDark"] = createSculptMaterial(
    "hatDark",
    {"id": "hatDark", "name": "Hat (matte near-black)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#2A2D33", "color": "#2A2D33", "albedo": {"dominant": "#2A2D33", "secondary": ["#17191C"], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\hatdark_albedo.png", "url": "hatdark_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#2A2D33", "#17191C"], "pattern": "reference-derived pixel palette", "amplitude": 0.08, "heightCorrelation": 0.42}, "roughness": {"base": 0.684, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\hatdark_ao.png", "url": "hatdark_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.0, "localOverrides": [{"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Brim linear-gradient(#2a2d33,#17191c); crown linear-gradient(#33363d,#1b1d21) is marginally lighter -- modeled as a second material stop.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'hatDark', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["hatCrown"] = createSculptMaterial(
    "hatCrown",
    {"id": "hatCrown", "name": "Hat crown (marginally lighter than brim)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#33363D", "color": "#33363D", "albedo": {"dominant": "#33363D", "secondary": ["#1B1D21"], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\hatcrown_albedo.png", "url": "hatcrown_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#33363D", "#1B1D21"], "pattern": "reference-derived pixel palette", "amplitude": 0.08, "heightCorrelation": 0.42}, "roughness": {"base": 0.684, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\hatcrown_ao.png", "url": "hatcrown_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.0, "localOverrides": [{"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Top cylinder reads slightly bluer/lighter than the brim.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'hatCrown', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["scarfAccent"] = createSculptMaterial(
    "scarfAccent",
    {"id": "scarfAccent", "name": "Scarf (satin purple accent gradient)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#C2A4FF", "color": "#C2A4FF", "albedo": {"dominant": "#C2A4FF", "secondary": ["#7F40FF"], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\scarfaccent_albedo.png", "url": "scarfaccent_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#C2A4FF", "#7F40FF"], "pattern": "reference-derived pixel palette", "amplitude": 0.12, "heightCorrelation": 0.42}, "roughness": {"base": 0.68, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\scarfaccent_ao.png", "url": "scarfaccent_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.1, "localOverrides": [{"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "linear-gradient(180deg,#C2A4FF,#7F40FF), lighter lavender at top edge to deeper violet at hem.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'scarfAccent', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["armWood"] = createSculptMaterial(
    "armWood",
    {"id": "armWood", "name": "Arm (satin wood gradient)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#8A6238", "color": "#8A6238", "albedo": {"dominant": "#8A6238", "secondary": ["#6B4A29"], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\armwood_albedo.png", "url": "armwood_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#8A6238", "#6B4A29"], "pattern": "reference-derived pixel palette", "amplitude": 0.266, "heightCorrelation": 0.42}, "roughness": {"base": 0.683, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\armwood_ao.png", "url": "armwood_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.0, "localOverrides": [{"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "linear-gradient(#8a6238,#6b4a29), lighter at the shoulder socket end.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'armWood', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["darkAccent"] = createSculptMaterial(
    "darkAccent",
    {"id": "darkAccent", "name": "Buttons / eye sockets (near-black, small gloss)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#1A1A1A", "color": "#1A1A1A", "albedo": {"dominant": "#1A1A1A", "secondary": ["#232323"], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\darkaccent_albedo.png", "url": "darkaccent_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#1A1A1A", "#232323"], "pattern": "reference-derived pixel palette", "amplitude": 0.24, "heightCorrelation": 0.42}, "roughness": {"base": 0.68, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\darkaccent_ao.png", "url": "darkaccent_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.25, "localOverrides": [{"id": "eyeHighlight", "region": "upper-inner rim of each eye socket", "description": "small inset gloss catchlight", "color": "#FFFFFF", "opacity": 0.2}, {"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Confirmed inset box-shadow highlight on eyes; buttons share the same dark tone without the highlight.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'darkAccent', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["pupilLight"] = createSculptMaterial(
    "pupilLight",
    {"id": "pupilLight", "name": "Pupil highlight", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#EAE5EC", "color": "#EAE5EC", "albedo": {"dominant": "#EAE5EC", "secondary": [], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\pupillight_albedo.png", "url": "pupillight_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#EAE5EC"], "pattern": "reference-derived pixel palette", "amplitude": 0.08, "heightCorrelation": 0.42}, "roughness": {"base": 0.68, "variation": 0.05, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\pupillight_ao.png", "url": "pupillight_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.0, "localOverrides": [{"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Near-white warm-neutral gloss dot inside each eye.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'pupilLight', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );
  materialMap["noseOrange"] = createSculptMaterial(
    "noseOrange",
    {"id": "noseOrange", "name": "Nose (satin orange)", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#E8792E", "color": "#E8792E", "albedo": {"dominant": "#E8792E", "secondary": [], "samplingNotes": "Confirmed exact stop from the object's own CSS gradient source -- overrides the pixel-extraction guess, which mis-sampled background.", "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\noseorange_albedo.png", "url": "noseorange_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#E8792E"], "pattern": "reference-derived pixel palette", "amplitude": 0.113, "heightCorrelation": 0.42}, "roughness": {"base": 0.68, "variation": 0.051, "map": "independent-procedural-radial-falloff", "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.0}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\Camara\\Desktop\\Portifolio\\DESING_05\\threejs-snowman\\pbr-evidence\\noseorange_ao.png", "url": "noseorange_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "clearcoat": 0.0, "localOverrides": [{"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["MeshPhysicalMaterial chosen for the soft satin sheen and the clearcoat-like rim response seen on the body spheres.", "Albedo is the confirmed CSS gradient; roughness/AO authored independently, not aliased from color.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Solid saturated orange cone, no gradient observed.", "textureless": {"declared": true, "evidence": ["Full-object reference view (full-object); the subject is the site's own CSS radial/linear-gradient fill for material 'noseOrange', confirmed flat/gradient color with no photographed surface micro-texture."]}},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const endpoint_root_0 = makeAttachmentEndpoint(null);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "Stylized Snowman Figure (root)__pivot";
  node_root_0.scale.set(1, 1, 1);
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0.0, 0.0, -0.1222);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, -0.1222);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "Stylized Snowman Figure (root)", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Rigid multi-primitive assembly; root is a pure transform group, not a mesh.", "geometryDescriptor": {"topologyIntent": "non-rendered bounding container / transform group only", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 0.001, "height": 0.001, "depth": 0.001, "units": "world", "confidence": 0.95}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, -0.1222]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Whole-figure -7deg screen-plane tilt is a confirmed CSS transform, mapped to root rotation.z."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "structure", "colorMaterialRecipe": {"materialClass": "unknown", "materialClassConfidence": 1.0, "dominantAlbedo": "rgba(128, 128, 128, 1.0)", "secondaryAlbedo": "rgba(128, 128, 128, 1.0)"}};
  node_root_0.userData.actionProfile = {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_root_0) {
    mesh_root_0Geometry.scale(0.001, 0.001, 0.001);
  }
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["bodySnow"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "Stylized Snowman Figure (root)";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "Stylized Snowman Figure (root)", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Rigid multi-primitive assembly; root is a pure transform group, not a mesh.", "geometryDescriptor": {"topologyIntent": "non-rendered bounding container / transform group only", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 0.001, "height": 0.001, "depth": 0.001, "units": "world", "confidence": 0.95}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, -0.1222]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Whole-figure -7deg screen-plane tilt is a confirmed CSS transform, mapped to root rotation.z."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "structure", "colorMaterialRecipe": {"materialClass": "unknown", "materialClassConfidence": 1.0, "dominantAlbedo": "rgba(128, 128, 128, 1.0)", "secondaryAlbedo": "rgba(128, 128, 128, 1.0)"}};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_root_0);

  const endpoint_bodyBottom_1 = makeAttachmentEndpoint(null);
  const node_bodyBottom_1 = new THREE.Group();
  node_bodyBottom_1.name = "Body \u2014 bottom sphere__pivot";
  node_bodyBottom_1.scale.set(1, 1, 1);
  if (endpoint_bodyBottom_1) {
    node_bodyBottom_1.position.copy(endpoint_bodyBottom_1.start);
    node_bodyBottom_1.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_bodyBottom_1.position.set(0.0, 0.5267, 0.0);
    node_bodyBottom_1.rotation.set(0.0, 0.0, 0.0);
  }
  node_bodyBottom_1.userData.sculptComponent = {"id": "bodyBottom", "name": "Body — bottom sphere", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Largest of the three stacked spheres; continuous rounded volume, not a faceted primitive read.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"radius": 0.5267, "units": "world", "confidence": 0.95, "height": 1.0534, "width": 1.0534, "depth": 1.0534}, "transform": {"position": [0, 0.5267, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Confirmed diameter ratio bottom:head = 1.95:1 (14.8rem:7.6rem)."}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.95, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(255, 255, 255, 1.0)"}, {"position": 0.55, "color": "rgba(230, 235, 241, 1.0)"}, {"position": 1.0, "color": "rgba(195, 204, 214, 1.0)"}]}, "dominantAlbedo": "rgba(255, 255, 255, 1.0)", "secondaryAlbedo": "rgba(195, 204, 214, 1.0)"}};
  node_bodyBottom_1.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}};
  (nodes["root"] ?? root).add(node_bodyBottom_1);
  nodes["bodyBottom"] = node_bodyBottom_1;
  const mesh_bodyBottom_1Geometry = endpoint_bodyBottom_1
    ? new THREE.CylinderGeometry(endpoint_bodyBottom_1.endRadius, endpoint_bodyBottom_1.baseRadius, endpoint_bodyBottom_1.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_bodyBottom_1) {
    mesh_bodyBottom_1Geometry.scale(1.0534, 1.0534, 1.0534);
  }
  const mesh_bodyBottom_1 = new THREE.Mesh(
    mesh_bodyBottom_1Geometry,
    materialMap["bodySnow"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_bodyBottom_1.name = "Body \u2014 bottom sphere";
  if (endpoint_bodyBottom_1) {
    mesh_bodyBottom_1.position.copy(endpoint_bodyBottom_1.midpoint);
    mesh_bodyBottom_1.quaternion.copy(endpoint_bodyBottom_1.quaternion);
  }
  mesh_bodyBottom_1.castShadow = options.castShadow ?? true;
  mesh_bodyBottom_1.receiveShadow = options.receiveShadow ?? true;
  mesh_bodyBottom_1.userData.sculptComponent = {"id": "bodyBottom", "name": "Body — bottom sphere", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Largest of the three stacked spheres; continuous rounded volume, not a faceted primitive read.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"radius": 0.5267, "units": "world", "confidence": 0.95, "height": 1.0534, "width": 1.0534, "depth": 1.0534}, "transform": {"position": [0, 0.5267, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Confirmed diameter ratio bottom:head = 1.95:1 (14.8rem:7.6rem)."}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.95, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(255, 255, 255, 1.0)"}, {"position": 0.55, "color": "rgba(230, 235, 241, 1.0)"}, {"position": 1.0, "color": "rgba(195, 204, 214, 1.0)"}]}, "dominantAlbedo": "rgba(255, 255, 255, 1.0)", "secondaryAlbedo": "rgba(195, 204, 214, 1.0)"}};
  node_bodyBottom_1.add(mesh_bodyBottom_1);
  meshes["bodyBottom"] = mesh_bodyBottom_1;
  colliders["bodyBottom"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_bodyBottom_1);

  const endpoint_bodyMiddle_2 = makeAttachmentEndpoint(null);
  const node_bodyMiddle_2 = new THREE.Group();
  node_bodyMiddle_2.name = "Body \u2014 middle sphere__pivot";
  node_bodyMiddle_2.scale.set(1, 1, 1);
  if (endpoint_bodyMiddle_2) {
    node_bodyMiddle_2.position.copy(endpoint_bodyMiddle_2.start);
    node_bodyMiddle_2.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_bodyMiddle_2.position.set(0.0, 1.2313, 0.0);
    node_bodyMiddle_2.rotation.set(0.0, 0.0, 0.0);
  }
  node_bodyMiddle_2.userData.sculptComponent = {"id": "bodyMiddle", "name": "Body — middle sphere", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Mid-tier stacked sphere, overlaps bodyBottom at the seam.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "bodyBottom.top", "contactType": "overlap", "localStart": [0, 0.5267, 0], "localEnd": [0, 0.8541, 0], "embedDepth": 0.1495, "gapTolerance": 0.0}, "dimensions": {"radius": 0.3772, "units": "world", "confidence": 0.95, "height": 0.7544, "width": 0.7544, "depth": 0.7544}, "transform": {"position": [0, 1.2313, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Confirmed diameter ratio middle:head = 1.4:1 (10.6rem:7.6rem); bottom-offset 12rem from ground."}, "evidenceRefs": ["zone-r2c1", "zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.95, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(255, 255, 255, 1.0)"}, {"position": 0.55, "color": "rgba(230, 235, 241, 1.0)"}, {"position": 1.0, "color": "rgba(195, 204, 214, 1.0)"}]}, "dominantAlbedo": "rgba(255, 255, 255, 1.0)", "secondaryAlbedo": "rgba(195, 204, 214, 1.0)"}};
  node_bodyMiddle_2.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}};
  (nodes["root"] ?? root).add(node_bodyMiddle_2);
  nodes["bodyMiddle"] = node_bodyMiddle_2;
  const mesh_bodyMiddle_2Geometry = endpoint_bodyMiddle_2
    ? new THREE.CylinderGeometry(endpoint_bodyMiddle_2.endRadius, endpoint_bodyMiddle_2.baseRadius, endpoint_bodyMiddle_2.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_bodyMiddle_2) {
    mesh_bodyMiddle_2Geometry.scale(0.7544, 0.7544, 0.7544);
  }
  const mesh_bodyMiddle_2 = new THREE.Mesh(
    mesh_bodyMiddle_2Geometry,
    materialMap["bodySnow"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_bodyMiddle_2.name = "Body \u2014 middle sphere";
  if (endpoint_bodyMiddle_2) {
    mesh_bodyMiddle_2.position.copy(endpoint_bodyMiddle_2.midpoint);
    mesh_bodyMiddle_2.quaternion.copy(endpoint_bodyMiddle_2.quaternion);
  }
  mesh_bodyMiddle_2.castShadow = options.castShadow ?? true;
  mesh_bodyMiddle_2.receiveShadow = options.receiveShadow ?? true;
  mesh_bodyMiddle_2.userData.sculptComponent = {"id": "bodyMiddle", "name": "Body — middle sphere", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Mid-tier stacked sphere, overlaps bodyBottom at the seam.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "bodyBottom.top", "contactType": "overlap", "localStart": [0, 0.5267, 0], "localEnd": [0, 0.8541, 0], "embedDepth": 0.1495, "gapTolerance": 0.0}, "dimensions": {"radius": 0.3772, "units": "world", "confidence": 0.95, "height": 0.7544, "width": 0.7544, "depth": 0.7544}, "transform": {"position": [0, 1.2313, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Confirmed diameter ratio middle:head = 1.4:1 (10.6rem:7.6rem); bottom-offset 12rem from ground."}, "evidenceRefs": ["zone-r2c1", "zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.95, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(255, 255, 255, 1.0)"}, {"position": 0.55, "color": "rgba(230, 235, 241, 1.0)"}, {"position": 1.0, "color": "rgba(195, 204, 214, 1.0)"}]}, "dominantAlbedo": "rgba(255, 255, 255, 1.0)", "secondaryAlbedo": "rgba(195, 204, 214, 1.0)"}};
  node_bodyMiddle_2.add(mesh_bodyMiddle_2);
  meshes["bodyMiddle"] = mesh_bodyMiddle_2;
  colliders["bodyMiddle"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_bodyMiddle_2);

  const endpoint_head_3 = makeAttachmentEndpoint(null);
  const node_head_3 = new THREE.Group();
  node_head_3.name = "Head sphere__pivot";
  node_head_3.scale.set(1, 1, 1);
  if (endpoint_head_3) {
    node_head_3.position.copy(endpoint_head_3.start);
    node_head_3.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_head_3.position.set(0.0, 1.7295, 0.0);
    node_head_3.rotation.set(0.0, 0.0, 0.0);
  }
  node_head_3.userData.sculptComponent = {"id": "head", "name": "Head sphere", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Smallest stacked sphere, carries hat/scarf/face sub-assemblies as children.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "bodyMiddle.top", "contactType": "overlap", "localStart": [0, 1.2313, 0], "localEnd": [0, 1.4591, 0], "embedDepth": 0.1068, "gapTolerance": 0.0}, "dimensions": {"radius": 0.2705, "units": "world", "confidence": 0.95, "height": 0.541, "width": 0.541, "depth": 0.541}, "transform": {"position": [0, 1.7295, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Reference diameter 7.6rem, the unit against which all other proportions are ratioed."}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.95, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(255, 255, 255, 1.0)"}, {"position": 0.55, "color": "rgba(230, 235, 241, 1.0)"}, {"position": 1.0, "color": "rgba(195, 204, 214, 1.0)"}]}, "dominantAlbedo": "rgba(255, 255, 255, 1.0)", "secondaryAlbedo": "rgba(195, 204, 214, 1.0)"}};
  node_head_3.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}};
  (nodes["root"] ?? root).add(node_head_3);
  nodes["head"] = node_head_3;
  const mesh_head_3Geometry = endpoint_head_3
    ? new THREE.CylinderGeometry(endpoint_head_3.endRadius, endpoint_head_3.baseRadius, endpoint_head_3.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_head_3) {
    mesh_head_3Geometry.scale(0.541, 0.541, 0.541);
  }
  const mesh_head_3 = new THREE.Mesh(
    mesh_head_3Geometry,
    materialMap["bodySnow"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_head_3.name = "Head sphere";
  if (endpoint_head_3) {
    mesh_head_3.position.copy(endpoint_head_3.midpoint);
    mesh_head_3.quaternion.copy(endpoint_head_3.quaternion);
  }
  mesh_head_3.castShadow = options.castShadow ?? true;
  mesh_head_3.receiveShadow = options.receiveShadow ?? true;
  mesh_head_3.userData.sculptComponent = {"id": "head", "name": "Head sphere", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.95, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Smallest stacked sphere, carries hat/scarf/face sub-assemblies as children.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "bodyMiddle.top", "contactType": "overlap", "localStart": [0, 1.2313, 0], "localEnd": [0, 1.4591, 0], "embedDepth": 0.1068, "gapTolerance": 0.0}, "dimensions": {"radius": 0.2705, "units": "world", "confidence": 0.95, "height": 0.541, "width": 0.541, "depth": 0.541}, "transform": {"position": [0, 1.7295, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodySnow"}}, "material": "bodySnow", "materialLayers": ["bodySnow"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Reference diameter 7.6rem, the unit against which all other proportions are ratioed."}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.95, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(255, 255, 255, 1.0)"}, {"position": 0.55, "color": "rgba(230, 235, 241, 1.0)"}, {"position": 1.0, "color": "rgba(195, 204, 214, 1.0)"}]}, "dominantAlbedo": "rgba(255, 255, 255, 1.0)", "secondaryAlbedo": "rgba(195, 204, 214, 1.0)"}};
  node_head_3.add(mesh_head_3);
  meshes["head"] = mesh_head_3;
  colliders["head"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_head_3);

  const attachment_hatBrim_4 = {"parentSocket": "head.top", "contactType": "flush-with", "localStart": [0, 0.2136, 0], "localEnd": [0, 0.2136, 0], "embedDepth": 0.0285, "gapTolerance": 0.0};
  const endpoint_hatBrim_4 = makeAttachmentEndpoint(attachment_hatBrim_4);
  const node_hatBrim_4 = new THREE.Group();
  node_hatBrim_4.name = "Hat brim__pivot";
  node_hatBrim_4.scale.set(1, 1, 1);
  if (endpoint_hatBrim_4) {
    node_hatBrim_4.position.copy(endpoint_hatBrim_4.start);
    node_hatBrim_4.rotation.set(0.0, 0.0, -0.0698);
  } else {
    node_hatBrim_4.position.set(0.0, 0.242, 0.0);
    node_hatBrim_4.rotation.set(0.0, 0.0, -0.0698);
  }
  node_hatBrim_4.userData.sculptComponent = {"id": "hatBrim", "name": "Hat brim", "level": "meso", "role": "sub-assembly", "importance": 0.8, "confidence": 0.9, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Flat wide disc, overhangs the head silhouette on both sides -- a hard-surface flat primitive, not organic.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.top", "contactType": "flush-with", "localStart": [0, 0.2136, 0], "localEnd": [0, 0.2136, 0], "embedDepth": 0.0285, "gapTolerance": 0.0}, "dimensions": {"radius": 0.2704, "height": 0.0641, "units": "world", "confidence": 0.9}, "transform": {"position": [0, 0.242, 0], "rotation": [0, 0, -0.0698]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hatDark"}}, "material": "hatDark", "materialLayers": ["hatDark"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Brim width 7.6rem = matches head diameter exactly (overhang reads at the very silhouette edge)."}, "evidenceRefs": ["zone-r0c1", "zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(42, 45, 51, 1.0)"}, {"position": 1.0, "color": "rgba(23, 25, 28, 1.0)"}]}, "dominantAlbedo": "rgba(42, 45, 51, 1.0)", "secondaryAlbedo": "rgba(23, 25, 28, 1.0)"}};
  node_hatBrim_4.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hatDark"}};
  (nodes["head"] ?? root).add(node_hatBrim_4);
  nodes["hatBrim"] = node_hatBrim_4;
  const mesh_hatBrim_4Geometry = endpoint_hatBrim_4
    ? new THREE.CylinderGeometry(endpoint_hatBrim_4.endRadius, endpoint_hatBrim_4.baseRadius, endpoint_hatBrim_4.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  if (!endpoint_hatBrim_4) {
    mesh_hatBrim_4Geometry.scale(0.5408, 0.0641, 0.5408);
  }
  const mesh_hatBrim_4 = new THREE.Mesh(
    mesh_hatBrim_4Geometry,
    materialMap["hatDark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_hatBrim_4.name = "Hat brim";
  if (endpoint_hatBrim_4) {
    mesh_hatBrim_4.position.copy(endpoint_hatBrim_4.midpoint);
    mesh_hatBrim_4.quaternion.copy(endpoint_hatBrim_4.quaternion);
  }
  mesh_hatBrim_4.castShadow = options.castShadow ?? true;
  mesh_hatBrim_4.receiveShadow = options.receiveShadow ?? true;
  mesh_hatBrim_4.userData.sculptComponent = {"id": "hatBrim", "name": "Hat brim", "level": "meso", "role": "sub-assembly", "importance": 0.8, "confidence": 0.9, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Flat wide disc, overhangs the head silhouette on both sides -- a hard-surface flat primitive, not organic.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.top", "contactType": "flush-with", "localStart": [0, 0.2136, 0], "localEnd": [0, 0.2136, 0], "embedDepth": 0.0285, "gapTolerance": 0.0}, "dimensions": {"radius": 0.2704, "height": 0.0641, "units": "world", "confidence": 0.9}, "transform": {"position": [0, 0.242, 0], "rotation": [0, 0, -0.0698]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hatDark"}}, "material": "hatDark", "materialLayers": ["hatDark"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Brim width 7.6rem = matches head diameter exactly (overhang reads at the very silhouette edge)."}, "evidenceRefs": ["zone-r0c1", "zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(42, 45, 51, 1.0)"}, {"position": 1.0, "color": "rgba(23, 25, 28, 1.0)"}]}, "dominantAlbedo": "rgba(42, 45, 51, 1.0)", "secondaryAlbedo": "rgba(23, 25, 28, 1.0)"}};
  node_hatBrim_4.add(mesh_hatBrim_4);
  meshes["hatBrim"] = mesh_hatBrim_4;
  colliders["hatBrim"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_hatBrim_4);

  const attachment_hatTop_5 = {"parentSocket": "hatBrim.top", "contactType": "flush-with", "localStart": [0, 0.242, 0], "localEnd": [0, 0.242, 0], "embedDepth": 0.0214, "gapTolerance": 0.0};
  const endpoint_hatTop_5 = makeAttachmentEndpoint(attachment_hatTop_5);
  const node_hatTop_5 = new THREE.Group();
  node_hatTop_5.name = "Hat crown (top cylinder)__pivot";
  node_hatTop_5.scale.set(1, 1, 1);
  if (endpoint_hatTop_5) {
    node_hatTop_5.position.copy(endpoint_hatTop_5.start);
    node_hatTop_5.rotation.set(0.0, 0.0, -0.0698);
  } else {
    node_hatTop_5.position.set(0.0, 0.3986, 0.0);
    node_hatTop_5.rotation.set(0.0, 0.0, -0.0698);
  }
  node_hatTop_5.userData.sculptComponent = {"id": "hatTop", "name": "Hat crown (top cylinder)", "level": "meso", "role": "sub-assembly", "importance": 0.7, "confidence": 0.9, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Tall narrow cylinder sitting on the brim.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "hatBrim.top", "contactType": "flush-with", "localStart": [0, 0.242, 0], "localEnd": [0, 0.242, 0], "embedDepth": 0.0214, "gapTolerance": 0.0}, "dimensions": {"radius": 0.1744, "height": 0.2277, "units": "world", "confidence": 0.9}, "transform": {"position": [0, 0.3986, 0], "rotation": [0, 0, -0.0698]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hatCrown"}}, "material": "hatCrown", "materialLayers": ["hatCrown"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Crown reads marginally lighter/bluer than brim per confirmed CSS gradient stops."}, "evidenceRefs": ["zone-r0c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(51, 54, 61, 1.0)"}, {"position": 1.0, "color": "rgba(27, 29, 33, 1.0)"}]}, "dominantAlbedo": "rgba(51, 54, 61, 1.0)", "secondaryAlbedo": "rgba(27, 29, 33, 1.0)"}};
  node_hatTop_5.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hatCrown"}};
  (nodes["head"] ?? root).add(node_hatTop_5);
  nodes["hatTop"] = node_hatTop_5;
  const mesh_hatTop_5Geometry = endpoint_hatTop_5
    ? new THREE.CylinderGeometry(endpoint_hatTop_5.endRadius, endpoint_hatTop_5.baseRadius, endpoint_hatTop_5.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  if (!endpoint_hatTop_5) {
    mesh_hatTop_5Geometry.scale(0.3488, 0.2277, 0.3488);
  }
  const mesh_hatTop_5 = new THREE.Mesh(
    mesh_hatTop_5Geometry,
    materialMap["hatCrown"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_hatTop_5.name = "Hat crown (top cylinder)";
  if (endpoint_hatTop_5) {
    mesh_hatTop_5.position.copy(endpoint_hatTop_5.midpoint);
    mesh_hatTop_5.quaternion.copy(endpoint_hatTop_5.quaternion);
  }
  mesh_hatTop_5.castShadow = options.castShadow ?? true;
  mesh_hatTop_5.receiveShadow = options.receiveShadow ?? true;
  mesh_hatTop_5.userData.sculptComponent = {"id": "hatTop", "name": "Hat crown (top cylinder)", "level": "meso", "role": "sub-assembly", "importance": 0.7, "confidence": 0.9, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Tall narrow cylinder sitting on the brim.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "hatBrim.top", "contactType": "flush-with", "localStart": [0, 0.242, 0], "localEnd": [0, 0.242, 0], "embedDepth": 0.0214, "gapTolerance": 0.0}, "dimensions": {"radius": 0.1744, "height": 0.2277, "units": "world", "confidence": 0.9}, "transform": {"position": [0, 0.3986, 0], "rotation": [0, 0, -0.0698]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hatCrown"}}, "material": "hatCrown", "materialLayers": ["hatCrown"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Crown reads marginally lighter/bluer than brim per confirmed CSS gradient stops."}, "evidenceRefs": ["zone-r0c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(51, 54, 61, 1.0)"}, {"position": 1.0, "color": "rgba(27, 29, 33, 1.0)"}]}, "dominantAlbedo": "rgba(51, 54, 61, 1.0)", "secondaryAlbedo": "rgba(27, 29, 33, 1.0)"}};
  node_hatTop_5.add(mesh_hatTop_5);
  meshes["hatTop"] = mesh_hatTop_5;
  colliders["hatTop"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_hatTop_5);

  const attachment_scarfBand_6 = {"parentSocket": "head-bodyMiddle.seam", "contactType": "embed", "localStart": [0, -0.064, 0], "localEnd": [0, -0.064, 0], "embedDepth": 0.0641, "gapTolerance": 0.0};
  const endpoint_scarfBand_6 = makeAttachmentEndpoint(attachment_scarfBand_6);
  const node_scarfBand_6 = new THREE.Group();
  node_scarfBand_6.name = "Scarf band__pivot";
  node_scarfBand_6.scale.set(1, 1, 1);
  if (endpoint_scarfBand_6) {
    node_scarfBand_6.position.copy(endpoint_scarfBand_6.start);
    node_scarfBand_6.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_scarfBand_6.position.set(0.0, -0.064, 0.1779);
    node_scarfBand_6.rotation.set(0.0, 0.0, 0.0);
  }
  node_scarfBand_6.userData.sculptComponent = {"id": "scarfBand", "name": "Scarf band", "level": "meso", "role": "sub-assembly", "importance": 0.85, "confidence": 0.85, "primitive": "capsule", "topologyClass": "conforming-shell", "topologyRationale": "Curved band wrapping the head/bodyMiddle seam; domed top edge, near-flat hem -- a capsule/rounded-box hybrid, not a torus (it does not fully encircle at uniform radius).", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head-bodyMiddle.seam", "contactType": "embed", "localStart": [0, -0.064, 0], "localEnd": [0, -0.064, 0], "embedDepth": 0.0641, "gapTolerance": 0.0}, "dimensions": {"width": 0.6121, "height": 0.121, "depth": 0.2491, "units": "world", "confidence": 0.85}, "transform": {"position": [0, -0.064, 0.1779], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "scarfAccent"}}, "material": "scarfAccent", "materialLayers": ["scarfAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["domed-top-edge (border-radius 2.3rem confirmed)", "near-flat hem (border-radius 4px confirmed)"], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Vertical gradient lighter-top-to-darker-hem confirmed from CSS linear-gradient(180deg,...)."}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "fabric", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(194, 164, 255, 1.0)"}, {"position": 1.0, "color": "rgba(127, 64, 255, 1.0)"}]}, "dominantAlbedo": "rgba(194, 164, 255, 1.0)", "secondaryAlbedo": "rgba(127, 64, 255, 1.0)"}};
  node_scarfBand_6.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "scarfAccent"}};
  (nodes["head"] ?? root).add(node_scarfBand_6);
  nodes["scarfBand"] = node_scarfBand_6;
  const mesh_scarfBand_6Geometry = endpoint_scarfBand_6
    ? new THREE.CylinderGeometry(endpoint_scarfBand_6.endRadius, endpoint_scarfBand_6.baseRadius, endpoint_scarfBand_6.length, 32, 12)
    : buildWatertightCapsule(0.35, 0.7, 16, 32, 1);
  if (!endpoint_scarfBand_6) {
    mesh_scarfBand_6Geometry.scale(0.6121, 0.121, 0.2491);
  }
  const mesh_scarfBand_6 = new THREE.Mesh(
    mesh_scarfBand_6Geometry,
    materialMap["scarfAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_scarfBand_6.name = "Scarf band";
  if (endpoint_scarfBand_6) {
    mesh_scarfBand_6.position.copy(endpoint_scarfBand_6.midpoint);
    mesh_scarfBand_6.quaternion.copy(endpoint_scarfBand_6.quaternion);
  }
  mesh_scarfBand_6.castShadow = options.castShadow ?? true;
  mesh_scarfBand_6.receiveShadow = options.receiveShadow ?? true;
  mesh_scarfBand_6.userData.sculptComponent = {"id": "scarfBand", "name": "Scarf band", "level": "meso", "role": "sub-assembly", "importance": 0.85, "confidence": 0.85, "primitive": "capsule", "topologyClass": "conforming-shell", "topologyRationale": "Curved band wrapping the head/bodyMiddle seam; domed top edge, near-flat hem -- a capsule/rounded-box hybrid, not a torus (it does not fully encircle at uniform radius).", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head-bodyMiddle.seam", "contactType": "embed", "localStart": [0, -0.064, 0], "localEnd": [0, -0.064, 0], "embedDepth": 0.0641, "gapTolerance": 0.0}, "dimensions": {"width": 0.6121, "height": 0.121, "depth": 0.2491, "units": "world", "confidence": 0.85}, "transform": {"position": [0, -0.064, 0.1779], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "scarfAccent"}}, "material": "scarfAccent", "materialLayers": ["scarfAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["domed-top-edge (border-radius 2.3rem confirmed)", "near-flat hem (border-radius 4px confirmed)"], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Vertical gradient lighter-top-to-darker-hem confirmed from CSS linear-gradient(180deg,...)."}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "fabric", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(194, 164, 255, 1.0)"}, {"position": 1.0, "color": "rgba(127, 64, 255, 1.0)"}]}, "dominantAlbedo": "rgba(194, 164, 255, 1.0)", "secondaryAlbedo": "rgba(127, 64, 255, 1.0)"}};
  node_scarfBand_6.add(mesh_scarfBand_6);
  meshes["scarfBand"] = mesh_scarfBand_6;
  colliders["scarfBand"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_scarfBand_6);

  const endpoint_scarfTail_7 = makeAttachmentEndpoint(null);
  const node_scarfTail_7 = new THREE.Group();
  node_scarfTail_7.name = "Scarf hanging tail flap__pivot";
  node_scarfTail_7.scale.set(1, 1, 1);
  if (endpoint_scarfTail_7) {
    node_scarfTail_7.position.copy(endpoint_scarfTail_7.start);
    node_scarfTail_7.rotation.set(0.0, 0.0, 0.157);
  } else {
    node_scarfTail_7.position.set(0.1423, -0.0997, 0.0214);
    node_scarfTail_7.rotation.set(0.0, 0.0, 0.157);
  }
  node_scarfTail_7.userData.sculptComponent = {"id": "scarfTail", "name": "Scarf hanging tail flap", "level": "micro", "role": "detail", "importance": 0.5, "confidence": 0.85, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Small flat rectangular flap hanging from the scarf's distal-lateral edge, free-hanging (not touching the body).", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "scarfBand", "attachment": {"parentSocket": "scarfBand.lateralEdge", "contactType": "attached-to", "localStart": [0.1423, -0.0143, -0.1779], "localEnd": [0.1423, -0.1993, -0.1779], "embedDepth": 0.0142, "gapTolerance": 0.0071}, "dimensions": {"width": 0.0712, "height": 0.1851, "depth": 0.0285, "units": "world", "confidence": 0.85}, "transform": {"position": [0.1423, -0.0997, 0.0214], "rotation": [0, 0, 0.157]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "scarfAccent"}}, "material": "scarfAccent", "materialLayers": ["scarfAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "fabric", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(194, 164, 255, 1.0)"}, {"position": 1.0, "color": "rgba(127, 64, 255, 1.0)"}]}, "dominantAlbedo": "rgba(194, 164, 255, 1.0)", "secondaryAlbedo": "rgba(127, 64, 255, 1.0)"}};
  node_scarfTail_7.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "scarfAccent"}};
  (nodes["scarfBand"] ?? root).add(node_scarfTail_7);
  nodes["scarfTail"] = node_scarfTail_7;
  const mesh_scarfTail_7Geometry = endpoint_scarfTail_7
    ? new THREE.CylinderGeometry(endpoint_scarfTail_7.endRadius, endpoint_scarfTail_7.baseRadius, endpoint_scarfTail_7.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_scarfTail_7) {
    mesh_scarfTail_7Geometry.scale(0.0712, 0.1851, 0.0285);
  }
  const mesh_scarfTail_7 = new THREE.Mesh(
    mesh_scarfTail_7Geometry,
    materialMap["scarfAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_scarfTail_7.name = "Scarf hanging tail flap";
  if (endpoint_scarfTail_7) {
    mesh_scarfTail_7.position.copy(endpoint_scarfTail_7.midpoint);
    mesh_scarfTail_7.quaternion.copy(endpoint_scarfTail_7.quaternion);
  }
  mesh_scarfTail_7.castShadow = options.castShadow ?? true;
  mesh_scarfTail_7.receiveShadow = options.receiveShadow ?? true;
  mesh_scarfTail_7.userData.sculptComponent = {"id": "scarfTail", "name": "Scarf hanging tail flap", "level": "micro", "role": "detail", "importance": 0.5, "confidence": 0.85, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Small flat rectangular flap hanging from the scarf's distal-lateral edge, free-hanging (not touching the body).", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "scarfBand", "attachment": {"parentSocket": "scarfBand.lateralEdge", "contactType": "attached-to", "localStart": [0.1423, -0.0143, -0.1779], "localEnd": [0.1423, -0.1993, -0.1779], "embedDepth": 0.0142, "gapTolerance": 0.0071}, "dimensions": {"width": 0.0712, "height": 0.1851, "depth": 0.0285, "units": "world", "confidence": 0.85}, "transform": {"position": [0.1423, -0.0997, 0.0214], "rotation": [0, 0, 0.157]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "scarfAccent"}}, "material": "scarfAccent", "materialLayers": ["scarfAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "fabric", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(194, 164, 255, 1.0)"}, {"position": 1.0, "color": "rgba(127, 64, 255, 1.0)"}]}, "dominantAlbedo": "rgba(194, 164, 255, 1.0)", "secondaryAlbedo": "rgba(127, 64, 255, 1.0)"}};
  node_scarfTail_7.add(mesh_scarfTail_7);
  meshes["scarfTail"] = mesh_scarfTail_7;
  colliders["scarfTail"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_scarfTail_7);

  const endpoint_eyeLeft_8 = makeAttachmentEndpoint(null);
  const node_eyeLeft_8 = new THREE.Group();
  node_eyeLeft_8.name = "Eye mark (proximal, closer to center)__pivot";
  node_eyeLeft_8.scale.set(1, 1, 1);
  if (endpoint_eyeLeft_8) {
    node_eyeLeft_8.position.copy(endpoint_eyeLeft_8.start);
    node_eyeLeft_8.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_eyeLeft_8.position.set(-0.0356, 0.0427, 0.2278);
    node_eyeLeft_8.rotation.set(0.0, 0.0, 0.0);
  }
  node_eyeLeft_8.userData.sculptComponent = {"id": "eyeLeft", "name": "Eye mark (proximal, closer to center)", "level": "micro", "role": "detail", "importance": 0.9, "confidence": 0.9, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Flat applied circular mark conforming to the head's surface -- confirmed from the CSS source as a 2D border-radius circle with an inset box-shadow highlight, not a carved depth cavity. A plane-card decal is the faithful representation; a real SDF-subtract socket would add a physical dent the reference does not show.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.front", "contactType": "flush-with", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0214, "gapTolerance": 0.0}, "dimensions": {"width": 0.0996, "height": 0.0996, "depth": 0.02, "units": "world", "confidence": 0.9}, "transform": {"position": [-0.0356, 0.0427, 0.2278], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Both eyes offset toward the same lateral side of the head -- reads as a turned/three-quarter face, not centered."}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_eyeLeft_8.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}};
  (nodes["head"] ?? root).add(node_eyeLeft_8);
  nodes["eyeLeft"] = node_eyeLeft_8;
  const mesh_eyeLeft_8Geometry = endpoint_eyeLeft_8
    ? new THREE.CylinderGeometry(endpoint_eyeLeft_8.endRadius, endpoint_eyeLeft_8.baseRadius, endpoint_eyeLeft_8.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  if (!endpoint_eyeLeft_8) {
    mesh_eyeLeft_8Geometry.scale(0.0996, 0.0996, 0.02);
  }
  const mesh_eyeLeft_8 = new THREE.Mesh(
    mesh_eyeLeft_8Geometry,
    materialMap["darkAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_eyeLeft_8.name = "Eye mark (proximal, closer to center)";
  if (endpoint_eyeLeft_8) {
    mesh_eyeLeft_8.position.copy(endpoint_eyeLeft_8.midpoint);
    mesh_eyeLeft_8.quaternion.copy(endpoint_eyeLeft_8.quaternion);
  }
  mesh_eyeLeft_8.castShadow = options.castShadow ?? true;
  mesh_eyeLeft_8.receiveShadow = options.receiveShadow ?? true;
  mesh_eyeLeft_8.userData.sculptComponent = {"id": "eyeLeft", "name": "Eye mark (proximal, closer to center)", "level": "micro", "role": "detail", "importance": 0.9, "confidence": 0.9, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Flat applied circular mark conforming to the head's surface -- confirmed from the CSS source as a 2D border-radius circle with an inset box-shadow highlight, not a carved depth cavity. A plane-card decal is the faithful representation; a real SDF-subtract socket would add a physical dent the reference does not show.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.front", "contactType": "flush-with", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0214, "gapTolerance": 0.0}, "dimensions": {"width": 0.0996, "height": 0.0996, "depth": 0.02, "units": "world", "confidence": 0.9}, "transform": {"position": [-0.0356, 0.0427, 0.2278], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Both eyes offset toward the same lateral side of the head -- reads as a turned/three-quarter face, not centered."}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_eyeLeft_8.add(mesh_eyeLeft_8);
  meshes["eyeLeft"] = mesh_eyeLeft_8;
  colliders["eyeLeft"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_eyeLeft_8);

  const endpoint_eyeRight_9 = makeAttachmentEndpoint(null);
  const node_eyeRight_9 = new THREE.Group();
  node_eyeRight_9.name = "Eye mark (distal, further from center)__pivot";
  node_eyeRight_9.scale.set(1, 1, 1);
  if (endpoint_eyeRight_9) {
    node_eyeRight_9.position.copy(endpoint_eyeRight_9.start);
    node_eyeRight_9.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_eyeRight_9.position.set(0.0783, 0.0427, 0.2278);
    node_eyeRight_9.rotation.set(0.0, 0.0, 0.0);
  }
  node_eyeRight_9.userData.sculptComponent = {"id": "eyeRight", "name": "Eye mark (distal, further from center)", "level": "micro", "role": "detail", "importance": 0.9, "confidence": 0.9, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Flat applied circular mark conforming to the head's surface -- confirmed from the CSS source as a 2D border-radius circle with an inset box-shadow highlight, not a carved depth cavity. A plane-card decal is the faithful representation; a real SDF-subtract socket would add a physical dent the reference does not show.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.front", "contactType": "flush-with", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0214, "gapTolerance": 0.0}, "dimensions": {"width": 0.0996, "height": 0.0996, "depth": 0.02, "units": "world", "confidence": 0.9}, "transform": {"position": [0.0783, 0.0427, 0.2278], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_eyeRight_9.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}};
  (nodes["head"] ?? root).add(node_eyeRight_9);
  nodes["eyeRight"] = node_eyeRight_9;
  const mesh_eyeRight_9Geometry = endpoint_eyeRight_9
    ? new THREE.CylinderGeometry(endpoint_eyeRight_9.endRadius, endpoint_eyeRight_9.baseRadius, endpoint_eyeRight_9.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  if (!endpoint_eyeRight_9) {
    mesh_eyeRight_9Geometry.scale(0.0996, 0.0996, 0.02);
  }
  const mesh_eyeRight_9 = new THREE.Mesh(
    mesh_eyeRight_9Geometry,
    materialMap["darkAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_eyeRight_9.name = "Eye mark (distal, further from center)";
  if (endpoint_eyeRight_9) {
    mesh_eyeRight_9.position.copy(endpoint_eyeRight_9.midpoint);
    mesh_eyeRight_9.quaternion.copy(endpoint_eyeRight_9.quaternion);
  }
  mesh_eyeRight_9.castShadow = options.castShadow ?? true;
  mesh_eyeRight_9.receiveShadow = options.receiveShadow ?? true;
  mesh_eyeRight_9.userData.sculptComponent = {"id": "eyeRight", "name": "Eye mark (distal, further from center)", "level": "micro", "role": "detail", "importance": 0.9, "confidence": 0.9, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Flat applied circular mark conforming to the head's surface -- confirmed from the CSS source as a 2D border-radius circle with an inset box-shadow highlight, not a carved depth cavity. A plane-card decal is the faithful representation; a real SDF-subtract socket would add a physical dent the reference does not show.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.front", "contactType": "flush-with", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0214, "gapTolerance": 0.0}, "dimensions": {"width": 0.0996, "height": 0.0996, "depth": 0.02, "units": "world", "confidence": 0.9}, "transform": {"position": [0.0783, 0.0427, 0.2278], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_eyeRight_9.add(mesh_eyeRight_9);
  meshes["eyeRight"] = mesh_eyeRight_9;
  colliders["eyeRight"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_eyeRight_9);

  const endpoint_pupilLeft_10 = makeAttachmentEndpoint(null);
  const node_pupilLeft_10 = new THREE.Group();
  node_pupilLeft_10.name = "Pupil highlight (left eye)__pivot";
  node_pupilLeft_10.scale.set(1, 1, 1);
  if (endpoint_pupilLeft_10) {
    node_pupilLeft_10.position.copy(endpoint_pupilLeft_10.start);
    node_pupilLeft_10.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_pupilLeft_10.position.set(0.0071, 0.0072, 0.0284);
    node_pupilLeft_10.rotation.set(0.0, 0.0, 0.0);
  }
  node_pupilLeft_10.userData.sculptComponent = {"id": "pupilLeft", "name": "Pupil highlight (left eye)", "level": "micro", "role": "detail", "importance": 0.3, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Small flat gloss-highlight decal on top of the eye mark, conforming to the same surface.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "eyeLeft", "attachment": null, "dimensions": {"width": 0.027, "height": 0.027, "depth": 0.01, "units": "world", "confidence": 0.8}, "transform": {"position": [0.0071, 0.0072, 0.0284], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.8}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "pupilLight"}}, "material": "pupilLight", "materialLayers": ["pupilLight"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(234, 229, 236, 1.0)"}, {"position": 1.0, "color": "rgba(234, 229, 236, 1.0)"}]}, "dominantAlbedo": "rgba(234, 229, 236, 1.0)", "secondaryAlbedo": "rgba(234, 229, 236, 1.0)"}};
  node_pupilLeft_10.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.8}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "pupilLight"}};
  (nodes["eyeLeft"] ?? root).add(node_pupilLeft_10);
  nodes["pupilLeft"] = node_pupilLeft_10;
  const mesh_pupilLeft_10Geometry = endpoint_pupilLeft_10
    ? new THREE.CylinderGeometry(endpoint_pupilLeft_10.endRadius, endpoint_pupilLeft_10.baseRadius, endpoint_pupilLeft_10.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  if (!endpoint_pupilLeft_10) {
    mesh_pupilLeft_10Geometry.scale(0.027, 0.027, 0.01);
  }
  const mesh_pupilLeft_10 = new THREE.Mesh(
    mesh_pupilLeft_10Geometry,
    materialMap["pupilLight"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_pupilLeft_10.name = "Pupil highlight (left eye)";
  if (endpoint_pupilLeft_10) {
    mesh_pupilLeft_10.position.copy(endpoint_pupilLeft_10.midpoint);
    mesh_pupilLeft_10.quaternion.copy(endpoint_pupilLeft_10.quaternion);
  }
  mesh_pupilLeft_10.castShadow = options.castShadow ?? true;
  mesh_pupilLeft_10.receiveShadow = options.receiveShadow ?? true;
  mesh_pupilLeft_10.userData.sculptComponent = {"id": "pupilLeft", "name": "Pupil highlight (left eye)", "level": "micro", "role": "detail", "importance": 0.3, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Small flat gloss-highlight decal on top of the eye mark, conforming to the same surface.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "eyeLeft", "attachment": null, "dimensions": {"width": 0.027, "height": 0.027, "depth": 0.01, "units": "world", "confidence": 0.8}, "transform": {"position": [0.0071, 0.0072, 0.0284], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.8}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "pupilLight"}}, "material": "pupilLight", "materialLayers": ["pupilLight"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(234, 229, 236, 1.0)"}, {"position": 1.0, "color": "rgba(234, 229, 236, 1.0)"}]}, "dominantAlbedo": "rgba(234, 229, 236, 1.0)", "secondaryAlbedo": "rgba(234, 229, 236, 1.0)"}};
  node_pupilLeft_10.add(mesh_pupilLeft_10);
  meshes["pupilLeft"] = mesh_pupilLeft_10;
  colliders["pupilLeft"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_pupilLeft_10);

  const endpoint_pupilRight_11 = makeAttachmentEndpoint(null);
  const node_pupilRight_11 = new THREE.Group();
  node_pupilRight_11.name = "Pupil highlight (right eye)__pivot";
  node_pupilRight_11.scale.set(1, 1, 1);
  if (endpoint_pupilRight_11) {
    node_pupilRight_11.position.copy(endpoint_pupilRight_11.start);
    node_pupilRight_11.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_pupilRight_11.position.set(0.0071, 0.0072, 0.0284);
    node_pupilRight_11.rotation.set(0.0, 0.0, 0.0);
  }
  node_pupilRight_11.userData.sculptComponent = {"id": "pupilRight", "name": "Pupil highlight (right eye)", "level": "micro", "role": "detail", "importance": 0.3, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Small flat gloss-highlight decal on top of the eye mark, conforming to the same surface.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "eyeRight", "attachment": null, "dimensions": {"width": 0.027, "height": 0.027, "depth": 0.01, "units": "world", "confidence": 0.8}, "transform": {"position": [0.0071, 0.0072, 0.0284], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.8}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "pupilLight"}}, "material": "pupilLight", "materialLayers": ["pupilLight"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(234, 229, 236, 1.0)"}, {"position": 1.0, "color": "rgba(234, 229, 236, 1.0)"}]}, "dominantAlbedo": "rgba(234, 229, 236, 1.0)", "secondaryAlbedo": "rgba(234, 229, 236, 1.0)"}};
  node_pupilRight_11.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.8}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "pupilLight"}};
  (nodes["eyeRight"] ?? root).add(node_pupilRight_11);
  nodes["pupilRight"] = node_pupilRight_11;
  const mesh_pupilRight_11Geometry = endpoint_pupilRight_11
    ? new THREE.CylinderGeometry(endpoint_pupilRight_11.endRadius, endpoint_pupilRight_11.baseRadius, endpoint_pupilRight_11.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  if (!endpoint_pupilRight_11) {
    mesh_pupilRight_11Geometry.scale(0.027, 0.027, 0.01);
  }
  const mesh_pupilRight_11 = new THREE.Mesh(
    mesh_pupilRight_11Geometry,
    materialMap["pupilLight"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_pupilRight_11.name = "Pupil highlight (right eye)";
  if (endpoint_pupilRight_11) {
    mesh_pupilRight_11.position.copy(endpoint_pupilRight_11.midpoint);
    mesh_pupilRight_11.quaternion.copy(endpoint_pupilRight_11.quaternion);
  }
  mesh_pupilRight_11.castShadow = options.castShadow ?? true;
  mesh_pupilRight_11.receiveShadow = options.receiveShadow ?? true;
  mesh_pupilRight_11.userData.sculptComponent = {"id": "pupilRight", "name": "Pupil highlight (right eye)", "level": "micro", "role": "detail", "importance": 0.3, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "conforming-shell", "topologyRationale": "Small flat gloss-highlight decal on top of the eye mark, conforming to the same surface.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "eyeRight", "attachment": null, "dimensions": {"width": 0.027, "height": 0.027, "depth": 0.01, "units": "world", "confidence": 0.8}, "transform": {"position": [0.0071, 0.0072, 0.0284], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.8}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "pupilLight"}}, "material": "pupilLight", "materialLayers": ["pupilLight"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(234, 229, 236, 1.0)"}, {"position": 1.0, "color": "rgba(234, 229, 236, 1.0)"}]}, "dominantAlbedo": "rgba(234, 229, 236, 1.0)", "secondaryAlbedo": "rgba(234, 229, 236, 1.0)"}};
  node_pupilRight_11.add(mesh_pupilRight_11);
  meshes["pupilRight"] = mesh_pupilRight_11;
  colliders["pupilRight"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_pupilRight_11);

  const attachment_nose_12 = {"parentSocket": "head.front", "contactType": "embedded-in", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0071, "gapTolerance": 0.0};
  const endpoint_nose_12 = makeAttachmentEndpoint(attachment_nose_12);
  const node_nose_12 = new THREE.Group();
  node_nose_12.name = "Nose (carrot-style cone)__pivot";
  node_nose_12.scale.set(1, 1, 1);
  if (endpoint_nose_12) {
    node_nose_12.position.copy(endpoint_nose_12.start);
    node_nose_12.rotation.set(0.0, 0.0, -1.5708);
  } else {
    node_nose_12.position.set(0.0214, 0.0214, 0.242);
    node_nose_12.rotation.set(0.0, 0.0, -1.5708);
  }
  node_nose_12.userData.sculptComponent = {"id": "nose", "name": "Nose (carrot-style cone)", "level": "micro", "role": "detail", "importance": 0.6, "confidence": 0.85, "primitive": "cone", "topologyClass": "assembled-solid", "topologyRationale": "Small saturated-orange cone/triangular wedge, positioned between and slightly below the eyes, pointing away from the face -- reinforces the turned-head read.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.front", "contactType": "embedded-in", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0071, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0356, "height": 0.0818, "units": "world", "confidence": 0.85}, "transform": {"position": [0.0214, 0.0214, 0.242], "rotation": [0, 0, -1.5708]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "noseOrange"}}, "material": "noseOrange", "materialLayers": ["noseOrange"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(232, 121, 46, 1.0)"}, {"position": 1.0, "color": "rgba(232, 121, 46, 1.0)"}]}, "dominantAlbedo": "rgba(232, 121, 46, 1.0)", "secondaryAlbedo": "rgba(232, 121, 46, 1.0)"}};
  node_nose_12.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "noseOrange"}};
  (nodes["head"] ?? root).add(node_nose_12);
  nodes["nose"] = node_nose_12;
  const mesh_nose_12Geometry = endpoint_nose_12
    ? new THREE.CylinderGeometry(endpoint_nose_12.endRadius, endpoint_nose_12.baseRadius, endpoint_nose_12.length, 32, 12)
    : new THREE.ConeGeometry(0.5, 1, 48, 1);
  if (!endpoint_nose_12) {
    mesh_nose_12Geometry.scale(0.0712, 0.0818, 0.0712);
  }
  const mesh_nose_12 = new THREE.Mesh(
    mesh_nose_12Geometry,
    materialMap["noseOrange"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_nose_12.name = "Nose (carrot-style cone)";
  if (endpoint_nose_12) {
    mesh_nose_12.position.copy(endpoint_nose_12.midpoint);
    mesh_nose_12.quaternion.copy(endpoint_nose_12.quaternion);
  }
  mesh_nose_12.castShadow = options.castShadow ?? true;
  mesh_nose_12.receiveShadow = options.receiveShadow ?? true;
  mesh_nose_12.userData.sculptComponent = {"id": "nose", "name": "Nose (carrot-style cone)", "level": "micro", "role": "detail", "importance": 0.6, "confidence": 0.85, "primitive": "cone", "topologyClass": "assembled-solid", "topologyRationale": "Small saturated-orange cone/triangular wedge, positioned between and slightly below the eyes, pointing away from the face -- reinforces the turned-head read.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "head", "attachment": {"parentSocket": "head.front", "contactType": "embedded-in", "localStart": [0, -1.7295, 0], "localEnd": [0, -1.7295, 0], "embedDepth": 0.0071, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0356, "height": 0.0818, "units": "world", "confidence": 0.85}, "transform": {"position": [0.0214, 0.0214, 0.242], "rotation": [0, 0, -1.5708]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "noseOrange"}}, "material": "noseOrange", "materialLayers": ["noseOrange"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.85, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(232, 121, 46, 1.0)"}, {"position": 1.0, "color": "rgba(232, 121, 46, 1.0)"}]}, "dominantAlbedo": "rgba(232, 121, 46, 1.0)", "secondaryAlbedo": "rgba(232, 121, 46, 1.0)"}};
  node_nose_12.add(mesh_nose_12);
  meshes["nose"] = mesh_nose_12;
  colliders["nose"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_nose_12);

  const endpoint_button1_13 = makeAttachmentEndpoint(null);
  const node_button1_13 = new THREE.Group();
  node_button1_13.name = "Coal button (top)__pivot";
  node_button1_13.scale.set(1, 1, 1);
  if (endpoint_button1_13) {
    node_button1_13.position.copy(endpoint_button1_13.start);
    node_button1_13.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_button1_13.position.set(0.0854, 0.1566, 0.3345);
    node_button1_13.rotation.set(0.0, 0.0, 0.0);
  }
  node_button1_13.userData.sculptComponent = {"id": "button1", "name": "Coal button (top)", "level": "micro", "role": "detail", "importance": 0.4, "confidence": 0.85, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "First of 3 small dark spheres in a vertical row on the middle sphere's front.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.front", "contactType": "embedded-in", "localStart": [0, -1.2313, 0], "localEnd": [0, -1.2313, 0], "embedDepth": 0.0107, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0302, "units": "world", "confidence": 0.85, "height": 0.0604, "width": 0.0604, "depth": 0.0604}, "transform": {"position": [0.0854, 0.1566, 0.3345], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_button1_13.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}};
  (nodes["bodyMiddle"] ?? root).add(node_button1_13);
  nodes["button1"] = node_button1_13;
  const mesh_button1_13Geometry = endpoint_button1_13
    ? new THREE.CylinderGeometry(endpoint_button1_13.endRadius, endpoint_button1_13.baseRadius, endpoint_button1_13.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_button1_13) {
    mesh_button1_13Geometry.scale(0.0604, 0.0604, 0.0604);
  }
  const mesh_button1_13 = new THREE.Mesh(
    mesh_button1_13Geometry,
    materialMap["darkAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_button1_13.name = "Coal button (top)";
  if (endpoint_button1_13) {
    mesh_button1_13.position.copy(endpoint_button1_13.midpoint);
    mesh_button1_13.quaternion.copy(endpoint_button1_13.quaternion);
  }
  mesh_button1_13.castShadow = options.castShadow ?? true;
  mesh_button1_13.receiveShadow = options.receiveShadow ?? true;
  mesh_button1_13.userData.sculptComponent = {"id": "button1", "name": "Coal button (top)", "level": "micro", "role": "detail", "importance": 0.4, "confidence": 0.85, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "First of 3 small dark spheres in a vertical row on the middle sphere's front.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.front", "contactType": "embedded-in", "localStart": [0, -1.2313, 0], "localEnd": [0, -1.2313, 0], "embedDepth": 0.0107, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0302, "units": "world", "confidence": 0.85, "height": 0.0604, "width": 0.0604, "depth": 0.0604}, "transform": {"position": [0.0854, 0.1566, 0.3345], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_button1_13.add(mesh_button1_13);
  meshes["button1"] = mesh_button1_13;
  colliders["button1"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_button1_13);

  const attachment_armLeft_14 = {"parentSocket": "bodyMiddle.upperLateral", "contactType": "socket", "localStart": [-0.4199, 0.3132, 0], "localEnd": [-0.4911, -0.1139, 0], "embedDepth": 0.0214, "gapTolerance": 0.0, "baseRadius": 0.032, "endRadius": 0.02};
  const endpoint_armLeft_14 = makeAttachmentEndpoint(attachment_armLeft_14);
  const node_armLeft_14 = new THREE.Group();
  node_armLeft_14.name = "Arm (proximal side, socketed at shoulder)__pivot";
  node_armLeft_14.scale.set(1, 1, 1);
  if (endpoint_armLeft_14) {
    node_armLeft_14.position.copy(endpoint_armLeft_14.start);
    node_armLeft_14.rotation.set(0.0, 0.0, -0.4189);
  } else {
    node_armLeft_14.position.set(-0.4911, 0.1993, 0.0);
    node_armLeft_14.rotation.set(0.0, 0.0, -0.4189);
  }
  node_armLeft_14.userData.sculptComponent = {"id": "armLeft", "name": "Arm (proximal side, socketed at shoulder)", "level": "macro", "role": "body", "importance": 0.7, "confidence": 0.85, "primitive": "capsule", "topologyClass": "assembled-solid", "topologyRationale": "Straight rigid stick, no elbow joint, socketed high on bodyMiddle's upper-lateral surface, angled outward-down.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.upperLateral", "contactType": "socket", "localStart": [-0.4199, 0.3132, 0], "localEnd": [-0.4911, -0.1139, 0], "embedDepth": 0.0214, "gapTolerance": 0.0, "baseRadius": 0.032, "endRadius": 0.02}, "dimensions": {"radius": 0.032, "length": 0.427, "units": "world", "confidence": 0.85}, "transform": {"position": [-0.4911, 0.1993, 0], "rotation": [0, 0, -0.4189]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "custom", "localPosition": [-0.4199, 1.5445, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [{"id": "shoulderSocket", "localPosition": [-0.4199, 1.5445, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "armWood"}}, "material": "armWood", "materialLayers": ["armWood"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Chirality: armRight is the mirror (x -> -x) of this component, not an independent rotation -- both share angle magnitude 24deg."}, "evidenceRefs": ["zone-r1c0"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "wood", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(138, 98, 56, 1.0)"}, {"position": 1.0, "color": "rgba(107, 74, 41, 1.0)"}]}, "dominantAlbedo": "rgba(138, 98, 56, 1.0)", "secondaryAlbedo": "rgba(107, 74, 41, 1.0)"}};
  node_armLeft_14.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "custom", "localPosition": [-0.4199, 1.5445, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [{"id": "shoulderSocket", "localPosition": [-0.4199, 1.5445, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "armWood"}};
  (nodes["bodyMiddle"] ?? root).add(node_armLeft_14);
  nodes["armLeft"] = node_armLeft_14;
  const mesh_armLeft_14Geometry = endpoint_armLeft_14
    ? new THREE.CylinderGeometry(endpoint_armLeft_14.endRadius, endpoint_armLeft_14.baseRadius, endpoint_armLeft_14.length, 32, 12)
    : buildWatertightCapsule(0.35, 0.7, 16, 32, 1);
  if (!endpoint_armLeft_14) {
    mesh_armLeft_14Geometry.scale(0.064, 0.427, 0.064);
  }
  const mesh_armLeft_14 = new THREE.Mesh(
    mesh_armLeft_14Geometry,
    materialMap["armWood"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_armLeft_14.name = "Arm (proximal side, socketed at shoulder)";
  if (endpoint_armLeft_14) {
    mesh_armLeft_14.position.copy(endpoint_armLeft_14.midpoint);
    mesh_armLeft_14.quaternion.copy(endpoint_armLeft_14.quaternion);
  }
  mesh_armLeft_14.castShadow = options.castShadow ?? true;
  mesh_armLeft_14.receiveShadow = options.receiveShadow ?? true;
  mesh_armLeft_14.userData.sculptComponent = {"id": "armLeft", "name": "Arm (proximal side, socketed at shoulder)", "level": "macro", "role": "body", "importance": 0.7, "confidence": 0.85, "primitive": "capsule", "topologyClass": "assembled-solid", "topologyRationale": "Straight rigid stick, no elbow joint, socketed high on bodyMiddle's upper-lateral surface, angled outward-down.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.upperLateral", "contactType": "socket", "localStart": [-0.4199, 0.3132, 0], "localEnd": [-0.4911, -0.1139, 0], "embedDepth": 0.0214, "gapTolerance": 0.0, "baseRadius": 0.032, "endRadius": 0.02}, "dimensions": {"radius": 0.032, "length": 0.427, "units": "world", "confidence": 0.85}, "transform": {"position": [-0.4911, 0.1993, 0], "rotation": [0, 0, -0.4189]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "custom", "localPosition": [-0.4199, 1.5445, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [{"id": "shoulderSocket", "localPosition": [-0.4199, 1.5445, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "armWood"}}, "material": "armWood", "materialLayers": ["armWood"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Chirality: armRight is the mirror (x -> -x) of this component, not an independent rotation -- both share angle magnitude 24deg."}, "evidenceRefs": ["zone-r1c0"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "wood", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(138, 98, 56, 1.0)"}, {"position": 1.0, "color": "rgba(107, 74, 41, 1.0)"}]}, "dominantAlbedo": "rgba(138, 98, 56, 1.0)", "secondaryAlbedo": "rgba(107, 74, 41, 1.0)"}};
  node_armLeft_14.add(mesh_armLeft_14);
  meshes["armLeft"] = mesh_armLeft_14;
  colliders["armLeft"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_armLeft_14);
  const socket_armLeft_shoulderSocket_0 = new THREE.Object3D();
  socket_armLeft_shoulderSocket_0.name = "shoulderSocket";
  socket_armLeft_shoulderSocket_0.position.set(-0.4199, 1.5445, 0.0);
  socket_armLeft_shoulderSocket_0.rotation.set(0, 0, 0);
  socket_armLeft_shoulderSocket_0.userData.socket = {"id": "shoulderSocket", "localPosition": [-0.4199, 1.5445, 0]};
  node_armLeft_14.add(socket_armLeft_shoulderSocket_0);
  sockets["armLeft:shoulderSocket"] = socket_armLeft_shoulderSocket_0;

  const attachment_armRight_15 = {"parentSocket": "bodyMiddle.upperLateral", "contactType": "socket", "localStart": [0.4199, 0.3132, 0], "localEnd": [0.4911, -0.1139, 0], "embedDepth": 0.0214, "gapTolerance": 0.0, "baseRadius": 0.032, "endRadius": 0.02};
  const endpoint_armRight_15 = makeAttachmentEndpoint(attachment_armRight_15);
  const node_armRight_15 = new THREE.Group();
  node_armRight_15.name = "Arm (distal side, mirror of armLeft)__pivot";
  node_armRight_15.scale.set(1, 1, 1);
  if (endpoint_armRight_15) {
    node_armRight_15.position.copy(endpoint_armRight_15.start);
    node_armRight_15.rotation.set(0.0, 0.0, 0.4189);
  } else {
    node_armRight_15.position.set(0.4911, 0.1993, 0.0);
    node_armRight_15.rotation.set(0.0, 0.0, 0.4189);
  }
  node_armRight_15.userData.sculptComponent = {"id": "armRight", "name": "Arm (distal side, mirror of armLeft)", "level": "macro", "role": "body", "importance": 0.7, "confidence": 0.85, "primitive": "capsule", "topologyClass": "assembled-solid", "topologyRationale": "Mirror of armLeft: (x,y,z) -> (-x,y,z), triangle winding flipped to keep correct lighting.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.upperLateral", "contactType": "socket", "localStart": [0.4199, 0.3132, 0], "localEnd": [0.4911, -0.1139, 0], "embedDepth": 0.0214, "gapTolerance": 0.0, "baseRadius": 0.032, "endRadius": 0.02}, "dimensions": {"radius": 0.032, "length": 0.427, "units": "world", "confidence": 0.85}, "transform": {"position": [0.4911, 0.1993, 0], "rotation": [0, 0, 0.4189]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "custom", "localPosition": [0.4199, 1.5445, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [{"id": "shoulderSocket", "localPosition": [0.4199, 1.5445, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "armWood"}}, "material": "armWood", "materialLayers": ["armWood"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c2"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "wood", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(138, 98, 56, 1.0)"}, {"position": 1.0, "color": "rgba(107, 74, 41, 1.0)"}]}, "dominantAlbedo": "rgba(138, 98, 56, 1.0)", "secondaryAlbedo": "rgba(107, 74, 41, 1.0)"}};
  node_armRight_15.userData.actionProfile = {"animationRole": "detachable", "pivot": {"mode": "custom", "localPosition": [0.4199, 1.5445, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [{"id": "shoulderSocket", "localPosition": [0.4199, 1.5445, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "armWood"}};
  (nodes["bodyMiddle"] ?? root).add(node_armRight_15);
  nodes["armRight"] = node_armRight_15;
  const mesh_armRight_15Geometry = endpoint_armRight_15
    ? new THREE.CylinderGeometry(endpoint_armRight_15.endRadius, endpoint_armRight_15.baseRadius, endpoint_armRight_15.length, 32, 12)
    : buildWatertightCapsule(0.35, 0.7, 16, 32, 1);
  if (!endpoint_armRight_15) {
    mesh_armRight_15Geometry.scale(0.064, 0.427, 0.064);
  }
  const mesh_armRight_15 = new THREE.Mesh(
    mesh_armRight_15Geometry,
    materialMap["armWood"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_armRight_15.name = "Arm (distal side, mirror of armLeft)";
  if (endpoint_armRight_15) {
    mesh_armRight_15.position.copy(endpoint_armRight_15.midpoint);
    mesh_armRight_15.quaternion.copy(endpoint_armRight_15.quaternion);
  }
  mesh_armRight_15.castShadow = options.castShadow ?? true;
  mesh_armRight_15.receiveShadow = options.receiveShadow ?? true;
  mesh_armRight_15.userData.sculptComponent = {"id": "armRight", "name": "Arm (distal side, mirror of armLeft)", "level": "macro", "role": "body", "importance": 0.7, "confidence": 0.85, "primitive": "capsule", "topologyClass": "assembled-solid", "topologyRationale": "Mirror of armLeft: (x,y,z) -> (-x,y,z), triangle winding flipped to keep correct lighting.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.upperLateral", "contactType": "socket", "localStart": [0.4199, 0.3132, 0], "localEnd": [0.4911, -0.1139, 0], "embedDepth": 0.0214, "gapTolerance": 0.0, "baseRadius": 0.032, "endRadius": 0.02}, "dimensions": {"radius": 0.032, "length": 0.427, "units": "world", "confidence": 0.85}, "transform": {"position": [0.4911, 0.1993, 0], "rotation": [0, 0, 0.4189]}, "actionProfile": {"animationRole": "detachable", "pivot": {"mode": "custom", "localPosition": [0.4199, 1.5445, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": true}, "sockets": [{"id": "shoulderSocket", "localPosition": [0.4199, 1.5445, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": true, "fractureGroup": "melt-scatter", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "armWood"}}, "material": "armWood", "materialLayers": ["armWood"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r1c2"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "wood", "materialClassConfidence": 0.9, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(138, 98, 56, 1.0)"}, {"position": 1.0, "color": "rgba(107, 74, 41, 1.0)"}]}, "dominantAlbedo": "rgba(138, 98, 56, 1.0)", "secondaryAlbedo": "rgba(107, 74, 41, 1.0)"}};
  node_armRight_15.add(mesh_armRight_15);
  meshes["armRight"] = mesh_armRight_15;
  colliders["armRight"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["melt-scatter"] ??= [];
  destructionGroups["melt-scatter"].push(node_armRight_15);
  const socket_armRight_shoulderSocket_0 = new THREE.Object3D();
  socket_armRight_shoulderSocket_0.name = "shoulderSocket";
  socket_armRight_shoulderSocket_0.position.set(0.4199, 1.5445, 0.0);
  socket_armRight_shoulderSocket_0.rotation.set(0, 0, 0);
  socket_armRight_shoulderSocket_0.userData.socket = {"id": "shoulderSocket", "localPosition": [0.4199, 1.5445, 0]};
  node_armRight_15.add(socket_armRight_shoulderSocket_0);
  sockets["armRight:shoulderSocket"] = socket_armRight_shoulderSocket_0;

  const attachment_groundShadow_16 = {"parentSocket": "bodyBottom.groundContact", "contactType": "below", "localStart": [0, 0, 0], "localEnd": [0, 0.05, 0], "embedDepth": 0.01, "gapTolerance": 0.0};
  const endpoint_groundShadow_16 = makeAttachmentEndpoint(attachment_groundShadow_16);
  const node_groundShadow_16 = new THREE.Group();
  node_groundShadow_16.name = "Ground contact shadow__pivot";
  node_groundShadow_16.scale.set(1, 1, 1);
  if (endpoint_groundShadow_16) {
    node_groundShadow_16.position.copy(endpoint_groundShadow_16.start);
    node_groundShadow_16.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_groundShadow_16.position.set(0.0, 0.0036, 0.0);
    node_groundShadow_16.rotation.set(0.0, 0.0, 0.0);
  }
  node_groundShadow_16.userData.sculptComponent = {"id": "groundShadow", "name": "Ground contact shadow", "level": "macro", "role": "body", "importance": 0.3, "confidence": 0.7, "primitive": "cylinder", "topologyClass": "material-only", "topologyRationale": "Flat, blurred, near-transparent dark ellipse on the ground plane beneath bodyBottom -- not a raised part.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "bodyBottom.groundContact", "contactType": "below", "localStart": [0, 0, 0], "localEnd": [0, 0.05, 0], "embedDepth": 0.01, "gapTolerance": 0.0}, "dimensions": {"radiusTop": 0.516, "radiusBottom": 0.516, "height": 0.0036, "units": "world", "confidence": 0.7}, "transform": {"position": [0, 0.0036, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.7}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Rendered as a flat radial-gradient-alpha disc (or a soft shadow-catcher plane), not solid geometry with the darkAccent material's normal roughness/gloss -- opacity fades to 0 at the rim."}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "unknown", "materialClassConfidence": 0.7, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(0, 0, 0, 1.0)"}, {"position": 1.0, "color": "rgba(0, 0, 0, 1.0)"}]}, "dominantAlbedo": "rgba(0, 0, 0, 1.0)", "secondaryAlbedo": "rgba(0, 0, 0, 1.0)"}};
  node_groundShadow_16.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.7}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}};
  (nodes["root"] ?? root).add(node_groundShadow_16);
  nodes["groundShadow"] = node_groundShadow_16;
  const mesh_groundShadow_16Geometry = endpoint_groundShadow_16
    ? new THREE.CylinderGeometry(endpoint_groundShadow_16.endRadius, endpoint_groundShadow_16.baseRadius, endpoint_groundShadow_16.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  if (!endpoint_groundShadow_16) {
    mesh_groundShadow_16Geometry.scale(1.0, 0.0036, 1.0);
  }
  const mesh_groundShadow_16 = new THREE.Mesh(
    mesh_groundShadow_16Geometry,
    materialMap["darkAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_groundShadow_16.name = "Ground contact shadow";
  if (endpoint_groundShadow_16) {
    mesh_groundShadow_16.position.copy(endpoint_groundShadow_16.midpoint);
    mesh_groundShadow_16.quaternion.copy(endpoint_groundShadow_16.quaternion);
  }
  mesh_groundShadow_16.castShadow = options.castShadow ?? true;
  mesh_groundShadow_16.receiveShadow = options.receiveShadow ?? true;
  mesh_groundShadow_16.userData.sculptComponent = {"id": "groundShadow", "name": "Ground contact shadow", "level": "macro", "role": "body", "importance": 0.3, "confidence": 0.7, "primitive": "cylinder", "topologyClass": "material-only", "topologyRationale": "Flat, blurred, near-transparent dark ellipse on the ground plane beneath bodyBottom -- not a raised part.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": {"parentSocket": "bodyBottom.groundContact", "contactType": "below", "localStart": [0, 0, 0], "localEnd": [0, 0.05, 0], "embedDepth": 0.01, "gapTolerance": 0.0}, "dimensions": {"radiusTop": 0.516, "radiusBottom": 0.516, "height": 0.0036, "units": "world", "confidence": 0.7}, "transform": {"position": [0, 0.0036, 0], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.7}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": "Rendered as a flat radial-gradient-alpha disc (or a soft shadow-catcher plane), not solid geometry with the darkAccent material's normal roughness/gloss -- opacity fades to 0 at the rim."}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "form", "colorMaterialRecipe": {"materialClass": "unknown", "materialClassConfidence": 0.7, "colorGradient": {"type": "radial", "stops": [{"position": 0.0, "color": "rgba(0, 0, 0, 1.0)"}, {"position": 1.0, "color": "rgba(0, 0, 0, 1.0)"}]}, "dominantAlbedo": "rgba(0, 0, 0, 1.0)", "secondaryAlbedo": "rgba(0, 0, 0, 1.0)"}};
  node_groundShadow_16.add(mesh_groundShadow_16);
  meshes["groundShadow"] = mesh_groundShadow_16;
  colliders["groundShadow"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_groundShadow_16);

  const endpoint_button2_17 = makeAttachmentEndpoint(null);
  const node_button2_17 = new THREE.Group();
  node_button2_17.name = "Coal button (middle)__pivot";
  node_button2_17.scale.set(1, 1, 1);
  if (endpoint_button2_17) {
    node_button2_17.position.copy(endpoint_button2_17.start);
    node_button2_17.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_button2_17.position.set(0.0854, -0.0308, 0.3345);
    node_button2_17.rotation.set(0.0, 0.0, 0.0);
  }
  node_button2_17.userData.sculptComponent = {"id": "button2", "name": "Coal button (middle)", "level": "micro", "role": "detail", "importance": 0.4, "confidence": 0.85, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "First of 3 small dark spheres in a vertical row on the middle sphere's front.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.front", "contactType": "embedded-in", "localStart": [0, -1.2313, 0], "localEnd": [0, -1.2313, 0], "embedDepth": 0.0107, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0302, "units": "world", "confidence": 0.85, "height": 0.0604, "width": 0.0604, "depth": 0.0604}, "transform": {"position": [0.0854, -0.0308, 0.3345], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_button2_17.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}};
  (nodes["bodyMiddle"] ?? root).add(node_button2_17);
  nodes["button2"] = node_button2_17;
  const mesh_button2_17Geometry = endpoint_button2_17
    ? new THREE.CylinderGeometry(endpoint_button2_17.endRadius, endpoint_button2_17.baseRadius, endpoint_button2_17.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_button2_17) {
    mesh_button2_17Geometry.scale(0.0604, 0.0604, 0.0604);
  }
  const mesh_button2_17 = new THREE.Mesh(
    mesh_button2_17Geometry,
    materialMap["darkAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_button2_17.name = "Coal button (middle)";
  if (endpoint_button2_17) {
    mesh_button2_17.position.copy(endpoint_button2_17.midpoint);
    mesh_button2_17.quaternion.copy(endpoint_button2_17.quaternion);
  }
  mesh_button2_17.castShadow = options.castShadow ?? true;
  mesh_button2_17.receiveShadow = options.receiveShadow ?? true;
  mesh_button2_17.userData.sculptComponent = {"id": "button2", "name": "Coal button (middle)", "level": "micro", "role": "detail", "importance": 0.4, "confidence": 0.85, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "First of 3 small dark spheres in a vertical row on the middle sphere's front.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.front", "contactType": "embedded-in", "localStart": [0, -1.2313, 0], "localEnd": [0, -1.2313, 0], "embedDepth": 0.0107, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0302, "units": "world", "confidence": 0.85, "height": 0.0604, "width": 0.0604, "depth": 0.0604}, "transform": {"position": [0.0854, -0.0308, 0.3345], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_button2_17.add(mesh_button2_17);
  meshes["button2"] = mesh_button2_17;
  colliders["button2"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_button2_17);

  const endpoint_button3_18 = makeAttachmentEndpoint(null);
  const node_button3_18 = new THREE.Group();
  node_button3_18.name = "Coal button (bottom)__pivot";
  node_button3_18.scale.set(1, 1, 1);
  if (endpoint_button3_18) {
    node_button3_18.position.copy(endpoint_button3_18.start);
    node_button3_18.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_button3_18.position.set(0.0854, -0.2181, 0.3345);
    node_button3_18.rotation.set(0.0, 0.0, 0.0);
  }
  node_button3_18.userData.sculptComponent = {"id": "button3", "name": "Coal button (bottom)", "level": "micro", "role": "detail", "importance": 0.4, "confidence": 0.85, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "First of 3 small dark spheres in a vertical row on the middle sphere's front.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.front", "contactType": "embedded-in", "localStart": [0, -1.2313, 0], "localEnd": [0, -1.2313, 0], "embedDepth": 0.0107, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0302, "units": "world", "confidence": 0.85, "height": 0.0604, "width": 0.0604, "depth": 0.0604}, "transform": {"position": [0.0854, -0.2181, 0.3345], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_button3_18.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}};
  (nodes["bodyMiddle"] ?? root).add(node_button3_18);
  nodes["button3"] = node_button3_18;
  const mesh_button3_18Geometry = endpoint_button3_18
    ? new THREE.CylinderGeometry(endpoint_button3_18.endRadius, endpoint_button3_18.baseRadius, endpoint_button3_18.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_button3_18) {
    mesh_button3_18Geometry.scale(0.0604, 0.0604, 0.0604);
  }
  const mesh_button3_18 = new THREE.Mesh(
    mesh_button3_18Geometry,
    materialMap["darkAccent"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_button3_18.name = "Coal button (bottom)";
  if (endpoint_button3_18) {
    mesh_button3_18.position.copy(endpoint_button3_18.midpoint);
    mesh_button3_18.quaternion.copy(endpoint_button3_18.quaternion);
  }
  mesh_button3_18.castShadow = options.castShadow ?? true;
  mesh_button3_18.receiveShadow = options.receiveShadow ?? true;
  mesh_button3_18.userData.sculptComponent = {"id": "button3", "name": "Coal button (bottom)", "level": "micro", "role": "detail", "importance": 0.4, "confidence": 0.85, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "First of 3 small dark spheres in a vertical row on the middle sphere's front.", "geometryDescriptor": {"topologyIntent": "smooth continuous surface, standard tessellation", "edgeTreatment": {"type": "rounded", "bevelRadius": 0.01, "segments": 2}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "bodyMiddle", "attachment": {"parentSocket": "bodyMiddle.front", "contactType": "embedded-in", "localStart": [0, -1.2313, 0], "localEnd": [0, -1.2313, 0], "embedDepth": 0.0107, "gapTolerance": 0.0}, "dimensions": {"radius": 0.0302, "units": "world", "confidence": 0.85, "height": 0.0604, "width": 0.0604, "depth": 0.0604}, "transform": {"position": [0.0854, -0.2181, 0.3345], "rotation": [0, 0, 0]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.85}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "darkAccent"}}, "material": "darkAccent", "materialLayers": ["darkAccent"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.15, "microRoughness": 0.05, "bumpAmplitude": 0.0, "normalPattern": "none", "displacementPattern": "none", "occlusionPattern": "contact-seam-darkening", "edgeWearPattern": "none", "notes": ""}, "evidenceRefs": ["zone-r2c1"], "details": [], "fidelityTier": "micro", "colorMaterialRecipe": {"materialClass": "plastic", "materialClassConfidence": 0.8, "colorGradient": {"type": "linear", "stops": [{"position": 0.0, "color": "rgba(26, 26, 26, 1.0)"}, {"position": 1.0, "color": "rgba(26, 26, 26, 1.0)"}]}, "dominantAlbedo": "rgba(26, 26, 26, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)"}};
  node_button3_18.add(mesh_button3_18);
  meshes["button3"] = mesh_button3_18;
  colliders["button3"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Decorative prop -- proxy collider only, no physics interaction required."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_button3_18);

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createStylizedSnowmanFigureLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "Stylized Snowman Figure look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{"role": "key", "description": "Soft warm-white key light from upper-front-lateral (matches each sphere's ~66%/30% highlight position); ACES filmic tone mapping, exposure ~1.0", "colorTemp": "neutral-cool", "intensity": "medium-high", "confidence": 0.8}, {"role": "rim", "description": "Purple/lavender rim light along one lateral edge of the body spheres, color #C2A4FF", "color": "#C2A4FF", "intensity": "medium", "confidence": 0.85}, {"role": "ambient", "description": "Soft purple ambient fill/halo glow surrounding the whole figure (large soft area light or emissive backdrop), color #7F40FF", "color": "#7F40FF", "intensity": "low-medium", "confidence": 0.8}, {"role": "environment", "description": "Dark near-black background with minimal environment reflection on these low-specular satin materials; renderer uses ACES filmic tone mapping at exposure 1.0", "confidence": 0.9}, {"role": "shadow", "description": "Soft contact shadow / ground shadow beneath bodyBottom (groundShadow component), ambient occlusion darkening at every sphere-stack seam", "confidence": 0.85}];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createStylizedSnowmanFigureEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameStylizedSnowmanFigureCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createStylizedSnowmanFigurePresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configureStylizedSnowmanFigureRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createStylizedSnowmanFigureInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
