import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const PI = Math.PI;
const TAU = PI * 2;

export const LANDMARKS = [
  {
    id: 'eiffel',
    index: '01',
    accent: '#e8b66b',
    coordinates: '48.8584° N · 2.2945° E',
    height: '330 m',
    year: '1889',
    stat: 'Iron lattice',
    camera: { radius: 92, polar: 1.35, azimuth: 0.58, target: [0, 30, 0] },
    fog: { color: 0x0b1020, near: 90, far: 240 },
    light: {
      hemiSky: 0x8aa1d6, hemiGround: 0x130f0c, hemi: 0.95,
      sunColor: 0xffc68a, sun: 2.2, sunPos: [-42, 60, 38],
      fillColor: 0x5c78b8, fill: 0.55, fillPos: [38, 28, -30],
      shadow: 62, shadowFar: 190,
    },
    sky: { top: 0x070b18, bottom: 0x28324a, horizon: 0x8d6e58, sun: 0xffd7a0, sunPos: [-80, 65, -120], sunSize: 8, stars: 1 },
  },
  {
    id: 'wall',
    index: '02',
    accent: '#e0a072',
    coordinates: '40.4319° N · 116.5704° E',
    height: '21,196 km',
    year: '7th c. BCE',
    stat: 'Total length',
    camera: { radius: 112, polar: 1.02, azimuth: -0.26, target: [0, 10, 0] },
    fog: { color: 0xb08f7c, near: 95, far: 235 },
    light: {
      hemiSky: 0xffd2aa, hemiGround: 0x3f3528, hemi: 1.1,
      sunColor: 0xffd2a1, sun: 2.8, sunPos: [-48, 44, 24],
      fillColor: 0x9db5c8, fill: 0.45, fillPos: [45, 30, -32],
      shadow: 95, shadowFar: 240,
    },
    sky: { top: 0x4e6589, bottom: 0xe6b391, horizon: 0xf8d7b2, sun: 0xffe7be, sunPos: [-100, 42, -140], sunSize: 12, stars: 0 },
  },
  {
    id: 'forbidden',
    index: '03',
    accent: '#e7bd6c',
    coordinates: '39.9163° N · 116.3972° E',
    height: '72 ha',
    year: '1420',
    stat: 'Palace complex',
    camera: { radius: 64, polar: 1.17, azimuth: 0.5, target: [0, 8, 0] },
    fog: { color: 0x5e4d47, near: 70, far: 190 },
    light: {
      hemiSky: 0xd8c5b2, hemiGround: 0x3c2d24, hemi: 1.2,
      sunColor: 0xffd6a0, sun: 3.0, sunPos: [-44, 48, 30],
      fillColor: 0x7f92b0, fill: 0.4, fillPos: [40, 25, -28],
      shadow: 58, shadowFar: 180,
    },
    sky: { top: 0x5a6b8c, bottom: 0xd3a77d, horizon: 0xecc7a0, sun: 0xffe2b0, sunPos: [75, 55, -130], sunSize: 10, stars: 0 },
  },
  {
    id: 'taj',
    index: '04',
    accent: '#e9c4a2',
    coordinates: '27.1751° N · 78.0421° E',
    height: '73 m',
    year: '1653',
    stat: 'Marble dome',
    camera: { radius: 76, polar: 1.22, azimuth: 0.06, target: [0, 11, 8] },
    fog: { color: 0x7e8198, near: 85, far: 210 },
    light: {
      hemiSky: 0xd9dcf0, hemiGround: 0x3d3440, hemi: 1.25,
      sunColor: 0xffd9bc, sun: 2.5, sunPos: [40, 46, 42],
      fillColor: 0x9f9ac8, fill: 0.55, fillPos: [-40, 30, -24],
      shadow: 62, shadowFar: 190,
    },
    sky: { top: 0x3f557d, bottom: 0xf0c3a7, horizon: 0xffd9b6, sun: 0xfff0c8, sunPos: [95, 32, -125], sunSize: 14, stars: 0 },
  },
];

const MATERIALS = {
  iron: { color: 0x513a2a, roughness: 0.38, metalness: 0.82, flatShading: false },
  ironLight: { color: 0x9c6f45, roughness: 0.3, metalness: 0.85, emissive: 0x2a1204, emissiveIntensity: 0.35 },
  ironDark: { color: 0x231c19, roughness: 0.62, metalness: 0.55 },
  stone: { color: 0xcfc4ad, roughness: 0.9, metalness: 0.02 },
  stoneDark: { color: 0x8b8375, roughness: 0.95 },
  stoneWarm: { color: 0xc3a986, roughness: 0.88 },
  marble: { color: 0xf1ece1, roughness: 0.42, metalness: 0.02 },
  marbleShade: { color: 0xd8d0c1, roughness: 0.62 },
  marbleGold: { color: 0xe7d8ba, roughness: 0.35, metalness: 0.15 },
  grass: { color: 0x4d5b3d, roughness: 1 },
  grassDark: { color: 0x35422f, roughness: 1 },
  hedge: { color: 0x3b4c34, roughness: 1 },
  city: { color: 0x1a2233, roughness: 0.8, metalness: 0.1 },
  cityWarm: { color: 0x2c2a2b, roughness: 0.8 },
  glowWarm: { color: 0xffc477, emissive: 0xffa13d, emissiveIntensity: 1.6, roughness: 0.3 },
  glowSoft: { color: 0xffdda8, emissive: 0xffb75f, emissiveIntensity: 1.2, roughness: 0.4 },
  water: { color: 0x4c8492, roughness: 0.08, metalness: 0.32, transparent: true, opacity: 0.72 },
  waterDark: { color: 0x284d5a, roughness: 0.12, metalness: 0.4 },
  wallStone: { color: 0xb9a584, roughness: 0.98, metalness: 0 },
  wallShade: { color: 0x8e7d63, roughness: 0.98 },
  wallCap: { color: 0x7b6a54, roughness: 0.9 },
  towerStone: { color: 0xcbb58f, roughness: 0.94 },
  rock: { color: 0x70664f, roughness: 1 },
  pine: { color: 0x263b2f, roughness: 1 },
  pineLight: { color: 0x39523c, roughness: 1 },
  redWall: { color: 0x922e25, roughness: 0.72, metalness: 0.02 },
  redDark: { color: 0x5e1d19, roughness: 0.8 },
  redGlow: { color: 0xd75138, emissive: 0xb12613, emissiveIntensity: 0.9, roughness: 0.55 },
  roofGold: { color: 0xd4a13b, roughness: 0.32, metalness: 0.62 },
  roofShade: { color: 0x8f6421, roughness: 0.45, metalness: 0.55 },
  roofEdge: { color: 0xf0c86a, roughness: 0.28, metalness: 0.72 },
  bronze: { color: 0x6f5530, roughness: 0.38, metalness: 0.75 },
  bronzeDark: { color: 0x3c3326, roughness: 0.6, metalness: 0.55 },
  gold: { color: 0xd9a84e, roughness: 0.28, metalness: 0.82 },
  jade: { color: 0x2a4c3d, roughness: 0.55, metalness: 0.1 },
  door: { color: 0x4a1c16, roughness: 0.7 },
  shadowInset: { color: 0x1c1715, roughness: 1 },
  whiteDome: { color: 0xf7f3e9, roughness: 0.34, metalness: 0.03 },
  whiteDomeShade: { color: 0xd9d3c8, roughness: 0.5 },
  cypress: { color: 0x26382b, roughness: 1 },
  cypressLight: { color: 0x344b38, roughness: 1 },
  flowerRed: { color: 0x8c3434, roughness: 0.8 },
  flowerPink: { color: 0xb56b72, roughness: 0.8 },
  bird: { color: 0x30333c, roughness: 0.9 },
};

const NO_SHADOW = new Set(['glowWarm', 'glowSoft', 'water', 'waterDark', 'cityWarm']);

function makeMaterials(THREE) {
  const out = {};
  for (const [key, def] of Object.entries(MATERIALS)) {
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: def.roughness ?? 0.8,
      metalness: def.metalness ?? 0,
      emissive: def.emissive ?? 0x000000,
      emissiveIntensity: def.emissiveIntensity ?? 0,
      transparent: def.transparent ?? false,
      opacity: def.opacity ?? 1,
      flatShading: def.flatShading ?? false,
      side: def.side ?? THREE.FrontSide,
    });
    if (key === 'water') mat.depthWrite = false;
    out[key] = mat;
  }
  return out;
}

class Builder {
  constructor(THREE) {
    this.THREE = THREE;
    this.buckets = new Map();
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._m = new THREE.Matrix4();
    this._e = new THREE.Euler();
  }

  add(key, geometry, matrix) {
    if (matrix) geometry.applyMatrix4(matrix);
    if (!geometry.getAttribute('uv')) {
      const count = geometry.getAttribute('position').count;
      geometry.setAttribute('uv', new this.THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    let list = this.buckets.get(key);
    if (!list) {
      list = [];
      this.buckets.set(key, list);
    }
    list.push(geometry);
  }

  matrix(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    this._e.set(rx, ry, rz, 'YXZ');
    this._q.setFromEuler(this._e);
    return new this.THREE.Matrix4().compose(
      new this.THREE.Vector3(x, y, z),
      this._q.clone(),
      new this.THREE.Vector3(sx, sy, sz),
    );
  }

  box(key, sx, sy, sz, x, y, z, opts = {}) {
    const g = new this.THREE.BoxGeometry(sx, sy, sz);
    this.add(key, g, this.matrix(x, y, z, opts.rx || 0, opts.ry || 0, opts.rz || 0));
  }

  cylinder(key, rt, rb, h, x, y, z, seg = 12, opts = {}) {
    const g = new this.THREE.CylinderGeometry(rt, rb, h, seg, 1, opts.open || false);
    this.add(key, g, this.matrix(x, y, z, opts.rx || 0, opts.ry || 0, opts.rz || 0, opts.sx || 1, 1, opts.sz || 1));
  }

  cone(key, r, h, x, y, z, seg = 8, opts = {}) {
    const g = new this.THREE.ConeGeometry(r, h, seg);
    this.add(key, g, this.matrix(x, y, z, opts.rx || 0, opts.ry || 0, opts.rz || 0));
  }

  sphere(key, r, x, y, z, seg = 12, opts = {}) {
    const g = new this.THREE.SphereGeometry(r, seg, Math.max(6, Math.floor(seg * 0.65)));
    this.add(key, g, this.matrix(x, y, z, opts.rx || 0, opts.ry || 0, opts.rz || 0, opts.sx || 1, opts.sy || 1, opts.sz || 1));
  }

  torus(key, r, tube, x, y, z, opts = {}) {
    const g = new this.THREE.TorusGeometry(r, tube, 8, opts.seg || 20, opts.arc || TAU);
    this.add(key, g, this.matrix(x, y, z, opts.rx || 0, opts.ry || 0, opts.rz || 0, opts.sx || 1, opts.sy || 1, opts.sz || 1));
  }

  lathe(key, points, x, y, z, seg = 24, opts = {}) {
    const g = new this.THREE.LatheGeometry(points, seg);
    this.add(key, g, this.matrix(x, y, z, opts.rx || 0, opts.ry || 0, opts.rz || 0, opts.sx || 1, opts.sy || 1, opts.sz || 1));
  }

  beam(key, a, b, w, d = w) {
    const T = this.THREE;
    const va = new T.Vector3(a[0], a[1], a[2]);
    const vb = new T.Vector3(b[0], b[1], b[2]);
    const dir = new T.Vector3().subVectors(vb, va);
    const len = dir.length();
    if (len < 0.0001) return;
    const g = new T.BoxGeometry(w, len, d);
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    const m = new T.Matrix4().compose(
      new T.Vector3().addVectors(va, vb).multiplyScalar(0.5),
      q,
      new T.Vector3(1, 1, 1),
    );
    this.add(key, g, m);
  }

  tube(key, points, radius, radial = 6, closed = false) {
    const T = this.THREE;
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p[0], p[1], p[2])), closed);
    const g = new T.TubeGeometry(curve, Math.max(8, points.length * 3), radius, radial, closed);
    this.add(key, g);
  }

  raw(key, positions, uvs, indices) {
    const T = this.THREE;
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    this.add(key, g);
  }

  finish(THREE, materials) {
    const group = new THREE.Group();
    for (const [key, list] of this.buckets) {
      if (!list.length) continue;
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, materials[key]);
      mesh.castShadow = !NO_SHADOW.has(key);
      mesh.receiveShadow = !NO_SHADOW.has(key);
      mesh.name = `bucket-${key}`;
      group.add(mesh);
    }
    this.buckets.clear();
    return group;
  }
}

function addSky(THREE, scene, cfg) {
  const uniforms = {
    topColor: { value: new THREE.Color(cfg.top) },
    bottomColor: { value: new THREE.Color(cfg.bottom) },
    horizonColor: { value: new THREE.Color(cfg.horizon) },
  };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 horizonColor;
      varying vec3 vWorld;
      void main() {
        float h = clamp(normalize(vWorld).y * 0.5 + 0.5, 0.0, 1.0);
        vec3 lower = mix(bottomColor, horizonColor, smoothstep(0.0, 0.5, h));
        vec3 col = mix(lower, topColor, smoothstep(0.46, 1.0, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 18), material);
  sky.frustumCulled = false;
  scene.add(sky);

  if (cfg.stars) {
    const count = 520;
    const positions = new Float32Array(count * 3);
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const a = rand() * TAU;
      const y = 0.12 + rand() * 0.86;
      const r = Math.sqrt(1 - y * y);
      positions[i * 3] = Math.cos(a) * r * 330;
      positions[i * 3 + 1] = y * 330;
      positions[i * 3 + 2] = Math.sin(a) * r * 330;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xc7d8ff, size: 1.25, sizeAttenuation: true, transparent: true,
      opacity: 0.75, depthWrite: false, fog: false,
    }));
    stars.frustumCulled = false;
    scene.add(stars);
  }

  if (cfg.sun) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 3, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,239,205,0.95)');
    grad.addColorStop(0.42, 'rgba(255,214,154,0.45)');
    grad.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, color: cfg.sun, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false,
    }));
    sprite.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);
    sprite.scale.setScalar(cfg.sunSize);
    scene.add(sprite);
  }
}

function addLights(THREE, scene, cfg) {
  scene.add(new THREE.HemisphereLight(cfg.hemiSky, cfg.hemiGround, cfg.hemi));

  const sun = new THREE.DirectionalLight(cfg.sunColor, cfg.sun);
  sun.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -cfg.shadow;
  sun.shadow.camera.right = cfg.shadow;
  sun.shadow.camera.top = cfg.shadow;
  sun.shadow.camera.bottom = -cfg.shadow;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = cfg.shadowFar;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  scene.add(sun.target);

  const fill = new THREE.DirectionalLight(cfg.fillColor, cfg.fill);
  fill.position.set(cfg.fillPos[0], cfg.fillPos[1], cfg.fillPos[2]);
  scene.add(fill);
  return { sun, fill };
}

function addTree(builder, x, z, scale, pine = false) {
  if (pine) {
    builder.cylinder('pine', 0.08 * scale, 0.12 * scale, 0.7 * scale, x, 0.35 * scale, z, 6);
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const y = (0.8 + i * 0.62) * scale;
      const r = (0.52 - i * 0.11) * scale;
      builder.cone(i % 2 ? 'pineLight' : 'pine', r, 1.05 * scale, x, y + 0.35 * scale, z, 7);
    }
    return;
  }
  builder.cylinder('bronzeDark', 0.09 * scale, 0.14 * scale, 1.25 * scale, x, 0.62 * scale, z, 6);
  builder.sphere('hedge', 0.56 * scale, x, 1.55 * scale, z, 8, { sy: 0.85 });
  builder.sphere('grassDark', 0.42 * scale, x + 0.34 * scale, 1.72 * scale, z - 0.14 * scale, 7);
}

function buildEiffel(THREE, builder) {
  const H = 68;
  const levels = 18;
  const halfAt = (y) => 15.2 * Math.pow(Math.max(0, 1 - y / H), 0.72) + 1.25 * (y / H);
  const corner = (k, c) => {
    const y = H * Math.pow(k / levels, 1.04);
    const h = halfAt(y);
    const sx = c === 0 || c === 3 ? -1 : 1;
    const sz = c < 2 ? -1 : 1;
    return [sx * h, y, sz * h];
  };

  for (let k = 0; k < levels; k++) {
    const y0 = H * Math.pow(k / levels, 1.04);
    const thick = 0.22 + 0.5 * Math.pow(1 - k / levels, 1.4);
    for (let c = 0; c < 4; c++) {
      builder.beam('iron', corner(k, c), corner(k + 1, c), thick, thick * 0.9);
      if (k >= 3) {
        builder.beam('iron', corner(k, c), corner(k, (c + 1) % 4), thick * 0.5, thick * 0.5);
        builder.beam('iron', corner(k, c), corner(k + 1, (c + 1) % 4), thick * 0.34, thick * 0.34);
        builder.beam('iron', corner(k, (c + 1) % 4), corner(k + 1, c), thick * 0.34, thick * 0.34);
      }
    }
  }

  // The four great base arches.
  for (let f = 0; f < 4; f++) {
    const pts = [];
    const yBase = 3.2;
    const yTop = 15.5;
    const h = halfAt(0) * 0.94;
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const x = (t * 2 - 1) * h;
      const y = yBase + (yTop - yBase) * Math.pow(Math.sin(PI * t), 0.6);
      if (f === 0) pts.push([x, y, -h * 0.98]);
      if (f === 1) pts.push([x, y, h * 0.98]);
      if (f === 2) pts.push([-h * 0.98, y, x]);
      if (f === 3) pts.push([h * 0.98, y, x]);
    }
    builder.tube('ironLight', pts, 0.17, 5);
    const inner = pts.map((p) => [p[0] * 0.82, p[1] + 0.4, p[2] * 0.82]);
    builder.tube('iron', inner, 0.10, 4);
  }

  const decks = [
    { y: 17.5, w: 24, t: 1.15, rail: 1.05 },
    { y: 35.2, w: 14.2, t: 0.9, rail: 0.95 },
    { y: 51.8, w: 8.2, t: 0.7, rail: 0.85 },
    { y: 66.4, w: 4.6, t: 0.55, rail: 0.7 },
  ];
  for (const d of decks) {
    builder.box('ironDark', d.w, d.t, d.w, 0, d.y, 0);
    builder.box('ironLight', d.w + 0.7, 0.12, d.w + 0.7, 0, d.y + d.t * 0.5, 0);
    const half = d.w * 0.5;
    const posts = Math.max(5, Math.round(d.w / 2.4));
    for (let s = 0; s < 4; s++) {
      for (let p = 0; p <= posts; p++) {
        const u = (p / posts) * 2 - 1;
        let x = 0;
        let z = 0;
        if (s === 0) { x = u * half; z = -half; }
        if (s === 1) { x = u * half; z = half; }
        if (s === 2) { x = -half; z = u * half; }
        if (s === 3) { x = half; z = u * half; }
        builder.box('ironLight', 0.08, d.rail, 0.08, x, d.y + d.t * 0.5 + d.rail * 0.5, z);
      }
    }
  }

  // Lattice cap and antenna.
  builder.cylinder('iron', 0.55, 1.2, 4.6, 0, 70.7, 0, 8);
  builder.cylinder('ironLight', 0.08, 0.32, 10.5, 0, 77.8, 0, 6);
  builder.sphere('glowWarm', 0.22, 0, 83.2, 0, 8);

  // Uplights and plaza.
  for (const [x, z] of [[-10, -10], [10, -10], [10, 10], [-10, 10]]) {
    const p = new THREE.PointLight(0xffb05a, 26, 34, 2);
    p.position.set(x, 2.4, z);
    builder.scene.add(p);
  }
  const crownLight = new THREE.PointLight(0xffc47e, 18, 42, 2);
  crownLight.position.set(0, 52, 0);
  builder.scene.add(crownLight);

  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(48, 64),
    new THREE.MeshStandardMaterial({ color: 0x77736a, roughness: 0.97 }),
  );
  plaza.rotation.x = -PI / 2;
  plaza.receiveShadow = true;
  builder.scene.add(plaza);

  builder.cylinder('grassDark', 27, 27, 0.08, 0, 0.045, 0, 48);
  builder.cylinder('stone', 26.5, 26.5, 0.10, 0, 0.07, 0, 48);
  for (const r of [6, 11, 17, 23]) {
    builder.torus('stoneWarm', r, 0.08, 0, 0.13, 0, { rx: PI / 2, seg: 64 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + PI / 8;
    builder.box('stoneWarm', 14, 0.09, 1.7, Math.cos(a) * 19, 0.12, Math.sin(a) * 19, { ry: a });
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + 0.1;
    addTree(builder, Math.cos(a) * 33.5, Math.sin(a) * 33.5, 1.45 + (i % 3) * 0.15);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const x = Math.cos(a) * 29.3;
    const z = Math.sin(a) * 29.3;
    builder.cylinder('ironDark', 0.07, 0.11, 2.7, x, 1.4, z, 6);
    builder.sphere('glowWarm', 0.17, x, 2.9, z, 7);
  }

  // A low, hazy Paris skyline.
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 34; i++) {
    const a = rand() * TAU;
    const r = 58 + rand() * 42;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const w = 4 + rand() * 7;
    const h = 4 + rand() * 13;
    const d = 4 + rand() * 8;
    builder.box(i % 5 === 0 ? 'cityWarm' : 'city', w, h, d, x, h * 0.5, z, { ry: a + PI / 2 });
    for (let f = 0; f < 3; f++) {
      builder.box('glowWarm', 0.16, 0.19, 0.06, x + Math.cos(a + PI / 2) * w * 0.5, h * (0.32 + f * 0.18), z + Math.sin(a + PI / 2) * w * 0.5, { ry: a + PI / 2 });
    }
  }

  // Eiffel's rotating beacon.
  const beacon = new THREE.Group();
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffc06a, transparent: true, opacity: 0.11,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(7, 54, 24, 1, true), beamMat);
  beam.rotation.z = PI / 2;
  beam.position.x = 27;
  beacon.add(beam);
  const beaconLight = new THREE.PointLight(0xffc06a, 12, 80, 2);
  beacon.add(beaconLight);
  beacon.position.set(0, 67.5, 0);
  builder.scene.add(beacon);

  return (t) => {
    beacon.rotation.y = t * 0.16;
    const pulse = 0.08 + (Math.sin(t * 1.8) * 0.5 + 0.5) * 0.04;
    beamMat.opacity = pulse;
  };
}

function addEiffelScene(THREE, materials, cfg) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(cfg.fog.color, 0.0032);
  addSky(THREE, scene, cfg.sky);
  addLights(THREE, scene, cfg.light);
  const builder = new Builder(THREE);
  builder.scene = scene;
  const update = buildEiffel(THREE, builder);
  const group = builder.finish(THREE, materials);
  scene.add(group);
  scene.userData.update = update;
  scene.userData.group = group;
  return scene;
}

function heightAt(x, z) {
  return (
    2.4 * Math.sin(x * 0.085 + 1.1) +
    1.9 * Math.cos(z * 0.11) +
    1.6 * Math.sin((x + z) * 0.052) +
    0.9 * Math.sin(x * 0.23) * Math.cos(z * 0.19) +
    12.5 * Math.exp(-(((x - 34) ** 2) / 2500 + ((z + 18) ** 2) / 1900)) +
    9.5 * Math.exp(-(((x + 38) ** 2) / 2300 + ((z + 24) ** 2) / 1500)) +
    6.5 * Math.exp(-(((x + 8) ** 2) / 1700 + ((z - 30) ** 2) / 1200))
  );
}

function buildWall(THREE, builder) {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-56, 0, 24),
    new THREE.Vector3(-40, 0, 2),
    new THREE.Vector3(-25, 0, 12),
    new THREE.Vector3(-8, 0, -4),
    new THREE.Vector3(10, 0, 7),
    new THREE.Vector3(28, 0, -8),
    new THREE.Vector3(43, 0, 12),
    new THREE.Vector3(58, 0, 1),
  ], false, 'catmullrom', 0.35);

  const samples = 150;
  const points = [];
  for (let i = 0; i <= samples; i++) {
    const p = path.getPoint(i / samples);
    p.y = heightAt(p.x, p.z) + 0.15;
    points.push(p);
  }

  const wallH = 4.4;
  const halfW = 1.55;
  const segs = points.length - 1;
  for (let i = 0; i < segs; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) + 0.22;
    const ry = Math.atan2(dx, dz);
    const mx = (a.x + b.x) * 0.5;
    const mz = (a.z + b.z) * 0.5;
    const my = (a.y + b.y) * 0.5;
    builder.box('wallStone', halfW * 2, wallH, len, mx, my + wallH * 0.5, mz, { ry });
    builder.box('wallCap', halfW * 2 + 0.24, 0.22, len, mx, my + wallH + 0.1, mz, { ry });
    builder.box('wallShade', 2.65, 0.22, len, mx, my + wallH + 0.3, mz, { ry });

    const ox = Math.cos(ry);
    const oz = -Math.sin(ry);
    for (const side of [-1, 1]) {
      builder.box(
        'towerStone', 0.34, 1.05, len,
        mx + ox * (halfW - 0.05) * side, my + wallH + 0.82, mz + oz * (halfW - 0.05) * side,
        { ry },
      );
      const count = Math.max(1, Math.floor(len / 2.1));
      for (let c = 0; c < count; c++) {
        const u = (c + 0.5) / count;
        const cx = a.x + dx * u + ox * (halfW - 0.02) * side;
        const cz = a.z + dz * u + oz * (halfW - 0.02) * side;
        builder.box('towerStone', 0.8, 0.56, 0.86, cx, my + wallH + 1.55, cz, { ry });
      }
    }
  }

  // Watchtowers along the ridge.
  const flags = [];
  const towerAt = [0.12, 0.34, 0.58, 0.81];
  for (let i = 0; i < towerAt.length; i++) {
    const t = towerAt[i];
    const p = path.getPoint(t);
    p.y = heightAt(p.x, p.z) + 0.15;
    const tan = path.getTangent(t);
    const ry = Math.atan2(tan.x, tan.z);
    const base = p.y;
    const w = 7.2;
    const h = 8.2;
    builder.box('towerStone', w, h, w, p.x, base + h * 0.5, p.z, { ry });
    builder.box('wallCap', w + 1.2, 0.4, w + 1.2, p.x, base + h + 0.2, p.z, { ry });
    builder.box('towerStone', w - 1.2, 1.1, w - 1.2, p.x, base + h + 0.85, p.z, { ry });
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    for (let c = 0; c < 4; c++) {
      const a = c * PI / 2;
      const px = Math.cos(a) * (w * 0.5 - 0.03);
      const pz = Math.sin(a) * (w * 0.5 - 0.03);
      const wx = p.x + px * cos + pz * sin;
      const wz = p.z - px * sin + pz * cos;
      builder.box('shadowInset', 1.35, 2.45, 0.12, wx, base + 1.5, wz, { ry: ry + a });
    }
    // Merlons on the tower roof.
    for (let side = 0; side < 4; side++) {
      for (let c = 0; c < 5; c++) {
        const u = (c / 4 - 0.5) * (w - 1.1);
        const px = side === 0 ? u : side === 1 ? w * 0.5 - 0.1 : side === 2 ? u : -w * 0.5 + 0.1;
        const pz = side === 0 ? -w * 0.5 + 0.1 : side === 1 ? u : side === 2 ? w * 0.5 - 0.1 : u;
        const wx = p.x + px * cos + pz * sin;
        const wz = p.z - px * sin + pz * cos;
        builder.box('towerStone', 0.8, 0.65, 0.8, wx, base + h + 1.75, wz, { ry });
      }
    }
    if (i < 3) {
      const fx = p.x + cos * (w * 0.5 + 0.3);
      const fz = p.z - sin * (w * 0.5 + 0.3);
      builder.cylinder('ironDark', 0.045, 0.06, 5.5, fx, base + h + 3.0, fz, 5);
      const flagGeo = new THREE.PlaneGeometry(2.0, 1.15, 6, 3);
      const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
        color: 0xa53224, roughness: 0.9, side: THREE.DoubleSide,
      }));
      flag.position.set(fx + cos * 0.95, base + h + 5.0, fz - sin * 0.95);
      flag.rotation.y = ry;
      flag.castShadow = true;
      flag.userData.phase = i * 0.8;
      builder.scene.add(flag);
      flags.push(flag);
    }
  }

  // Terrain with faceted vertex colouring.
  const terrainGeo = new THREE.PlaneGeometry(190, 145, 150, 116);
  terrainGeo.rotateX(-PI / 2);
  const pos = terrainGeo.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color(0x53603d);
  const cHigh = new THREE.Color(0x7c7057);
  const cRock = new THREE.Color(0x625b4b);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const n = THREE.MathUtils.clamp((y + 3) / 18, 0, 1);
    const c = cLow.clone().lerp(cHigh, n * 0.9);
    const rockBias = THREE.MathUtils.clamp((Math.sin(x * 0.2) * Math.cos(z * 0.17) + 0.7) / 1.4, 0, 1);
    c.lerp(cRock, rockBias * 0.26);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, metalness: 0, flatShading: true,
    color: 0xffffff,
  }));
  terrain.receiveShadow = true;
  terrain.castShadow = false;
  builder.scene.add(terrain);

  // Distant ridges.
  for (let r = 0; r < 3; r++) {
    const ridge = new THREE.Mesh(
      new THREE.PlaneGeometry(230, 38 + r * 14, 50, 1),
      new THREE.MeshBasicMaterial({ color: r === 0 ? 0x5c5b52 : r === 1 ? 0x6d6558 : 0x827565, transparent: true, opacity: 0.5 - r * 0.1, fog: true, side: THREE.DoubleSide }),
    );
    ridge.position.set(0, 9 + r * 6, -78 - r * 18);
    ridge.rotation.y = 0;
    builder.scene.add(ridge);
  }

  // A sparse pine forest.
  let seed = 29;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 68; i++) {
    const x = (rand() * 2 - 1) * 86;
    const z = (rand() * 2 - 1) * 62;
    const d = Math.min(
      Math.hypot(x + 20, z - 8),
      Math.hypot(x - 20, z + 2),
      Math.hypot(x + 2, z + 8),
    );
    if (d < 10) continue;
    const y = heightAt(x, z);
    if (y < -1) continue;
    addTree(builder, x, z, 1.1 + rand() * 1.5, true);
  }

  return (t) => {
    for (const flag of flags) {
      flag.rotation.z = Math.sin(t * 2.2 + flag.userData.phase) * 0.06;
      flag.rotation.x = Math.sin(t * 1.6 + flag.userData.phase) * 0.035;
    }
  };
}

function addWallScene(THREE, materials, cfg) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cfg.fog.color, cfg.fog.near, cfg.fog.far);
  addSky(THREE, scene, cfg.sky);
  addLights(THREE, scene, cfg.light);
  const builder = new Builder(THREE);
  builder.scene = scene;
  const update = buildWall(THREE, builder);
  const group = builder.finish(THREE, materials);
  scene.add(group);
  scene.userData.update = update;
  scene.userData.group = group;
  return scene;
}

function hipRoof(builder, key, cx, cz, w, d, y0, h, ridgeRatio = 0.56, lift = 1.1) {
  const halfW = w * 0.5;
  const halfD = d * 0.5;
  const ridgeHalf = halfW * ridgeRatio;
  const positions = [];
  const uvs = [];
  const indices = [];
  let vi = 0;

  const addFace = (rows, cols, fn, flip = false) => {
    const start = vi;
    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      for (let c = 0; c <= cols; c++) {
        const u = c / cols * 2 - 1;
        const p = fn(u, v);
        positions.push(cx + p[0], y0 + p[1], cz + p[2]);
        uvs.push((u + 1) * 0.5, v);
        vi++;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = start + r * (cols + 1) + c;
        const b = a + 1;
        const cc = a + cols + 1;
        const dd = cc + 1;
        if (flip) indices.push(a, cc, b, b, cc, dd);
        else indices.push(a, b, cc, b, dd, cc);
      }
    }
  };

  const yOf = (v, u) => h * Math.pow(Math.max(0, v), 0.8) + lift * Math.pow(Math.abs(u), 3.2) * Math.pow(1 - v, 2.3);

  addFace(8, 14, (u, v) => [
    u * (halfW * (1 - v) + ridgeHalf * v),
    yOf(v, u),
    halfD * (1 - v),
  ]);
  addFace(8, 14, (u, v) => [
    u * (halfW * (1 - v) + ridgeHalf * v),
    yOf(v, u),
    -halfD * (1 - v),
  ]);
  addFace(8, 8, (u, v) => [
    -(halfW * (1 - v) + ridgeHalf * v),
    h * Math.pow(v, 0.8) + lift * Math.pow(Math.abs(u), 3.2) * Math.pow(1 - v, 2.3),
    u * halfD * (1 - v),
  ]);
  addFace(8, 8, (u, v) => [
    halfW * (1 - v) + ridgeHalf * v,
    h * Math.pow(v, 0.8) + lift * Math.pow(Math.abs(u), 3.2) * Math.pow(1 - v, 2.3),
    u * halfD * (1 - v),
  ], true);
  builder.raw(key, positions, uvs, indices);

  // Heavy eaves and the main ridge.
  builder.box('roofShade', w + 1.0, 0.42, d + 1.0, cx, y0 - 0.08, cz);
  builder.box('roofEdge', ridgeHalf * 2 + 1.5, 0.34, 0.44, cx, y0 + h + 0.1, cz);
  builder.beam('roofEdge', [cx - ridgeHalf - 0.5, y0 + h + 0.35, cz], [cx + ridgeHalf + 0.5, y0 + h + 0.35, cz], 0.28, 0.28);
  for (const sx of [-1, 1]) {
    builder.beam('roofEdge', [cx + sx * halfW, y0 + lift, cz + halfD], [cx + sx * ridgeHalf, y0 + h, cz], 0.2, 0.2);
    builder.beam('roofEdge', [cx + sx * halfW, y0 + lift, cz - halfD], [cx + sx * ridgeHalf, y0 + h, cz], 0.2, 0.2);
    builder.cone('roofEdge', 0.18, 0.9, cx + sx * ridgeHalf, y0 + h + 0.65, cz, 6);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      builder.beam('roofEdge', [cx + sx * halfW, y0 + lift, cz + sz * halfD], [cx + sx * (halfW + 0.9), y0 + lift + 0.75, cz + sz * (halfD + 0.9)], 0.18, 0.18);
      builder.cone('roofEdge', 0.14, 0.6, cx + sx * (halfW + 0.9), y0 + lift + 1.05, cz + sz * (halfD + 0.9), 6);
    }
  }

  // Tile ribs catch the light and make the roof read at a distance.
  for (let i = -6; i <= 6; i++) {
    const u = i / 6;
    for (const sz of [-1, 1]) {
      const pts = [];
      for (let r = 0; r <= 7; r++) {
        const v = r / 7;
        const x = cx + u * (halfW * (1 - v) + ridgeHalf * v);
        const y = y0 + yOf(v, u) + 0.04;
        const z = cz + sz * halfD * (1 - v);
        pts.push([x, y, z]);
      }
      builder.beam('roofShade', pts[0], pts[pts.length - 1], 0.07, 0.07);
    }
  }
  return { ridgeHalf, halfW, halfD };
}

function addIwan(builder, THREE, x, z, rotY, baseY, width, height) {
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  const world = (lx, ly, lz) => [x + lx * cos + lz * sin, baseY + ly, z - lx * sin + lz * cos];

  // Recessed pointed arch, a dark plane behind a pale frame.
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(-width * 0.5, height * 0.42);
  shape.bezierCurveTo(-width * 0.5, height * 0.68, -width * 0.2, height * 0.82, 0, height);
  shape.bezierCurveTo(width * 0.2, height * 0.82, width * 0.5, height * 0.68, width * 0.5, height * 0.42);
  shape.lineTo(width * 0.5, 0);
  shape.closePath();
  const shapeGeo = new THREE.ShapeGeometry(shape, 10);
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, baseY, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  m.multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.03));
  shapeGeo.applyMatrix4(m);
  builder.add('shadowInset', shapeGeo);

  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    const a = u * PI;
    const px = -Math.cos(a) * width * 0.5;
    const py = height * 0.42 + Math.sin(a) * height * 0.58;
    pts.push(world(px, py, 0.02));
  }
  builder.tube('whiteDome', pts, 0.17, 5);
  for (const sx of [-1, 1]) {
    builder.box('whiteDome', 0.28, height * 0.42, 0.28, ...world(sx * width * 0.5, height * 0.21, 0));
  }
  for (const sx of [-1, 1]) {
    builder.box('whiteDome', 0.55, height * 0.42, 0.55, ...world(sx * (width * 0.5 + 0.4), height * 0.21, 0));
  }
  builder.box('whiteDome', width + 1.65, 0.42, 0.7, ...world(0, height * 0.94, 0));
  builder.box('marbleGold', width + 1.9, 0.18, 0.8, ...world(0, height * 0.98, 0));
}

function buildForbidden(THREE, builder) {
  // Courtyard.
  builder.box('stoneWarm', 105, 0.3, 92, 0, -0.12, 0);
  builder.box('marble', 15, 0.18, 58, 0, 0.05, 2);
  builder.box('marbleShade', 2.6, 0.2, 58, 0, 0.07, 2);
  for (let i = 0; i < 9; i++) {
    builder.box('marbleShade', 15, 0.14, 0.16, 0, 0.12, -26 + i * 7);
  }

  // Three marble terraces.
  const tiers = [
    { w: 34, d: 23, y: 0.55, h: 0.8 },
    { w: 30, d: 20, y: 1.35, h: 0.8 },
    { w: 26, d: 17, y: 2.15, h: 0.8 },
  ];
  for (const t of tiers) {
    builder.box('marble', t.w, t.h, t.d, 0, t.y + t.h * 0.5, -1);
    builder.box('marbleShade', t.w + 0.5, 0.15, t.d + 0.5, 0, t.y + 0.03, -1);
    const posts = 12;
    for (let s = 0; s < 4; s++) {
      for (let p = 0; p <= posts; p++) {
        const u = p / posts * 2 - 1;
        let x = 0;
        let z = 0;
        if (s === 0) { x = u * t.w * 0.5; z = -1 - t.d * 0.5; }
        if (s === 1) { x = u * t.w * 0.5; z = -1 + t.d * 0.5; }
        if (s === 2) { x = -t.w * 0.5; z = -1 + u * t.d * 0.5; }
        if (s === 3) { x = t.w * 0.5; z = -1 + u * t.d * 0.5; }
        if (s === 1 && Math.abs(u) < 0.18) continue;
        builder.box('marble', 0.22, 0.72, 0.22, x, t.y + 0.8, z);
        builder.sphere('marble', 0.14, x, t.y + 1.2, z, 6);
      }
    }
    builder.box('marble', 1.7, 0.18, 0.9, 0, t.y + 0.8, -1 + t.d * 0.5);
  }

  // Central stair.
  for (let s = 0; s < 9; s++) {
    builder.box('marble', 5.4, 0.18, 2.7 - s * 0.16, 0, 0.35 + s * 0.24, 10.5 + s * 0.35);
  }
  for (const sx of [-1, 1]) {
    builder.box('marble', 0.55, 1.1, 4.7, sx * 3.1, 1.5, 12.3, { rx: -0.25 });
  }

  // Hall body on the top terrace.
  const floorY = 2.95;
  builder.box('redDark', 20.5, 0.45, 12.5, 0, floorY + 0.2, -1);
  builder.box('redWall', 19.4, 7.7, 11.4, 0, floorY + 4.1, -1);
  for (let i = 0; i < 9; i++) {
    const x = (i / 8 - 0.5) * 18.2;
    builder.cylinder('redWall', 0.22, 0.26, 7.5, x, floorY + 4.1, 4.8, 8);
    if (i < 8) {
      builder.box('jade', 1.35, 2.1, 0.08, x + 1.0, floorY + 2.9, 4.73);
      builder.box('gold', 0.08, 2.1, 0.12, x + 1.0, floorY + 2.9, 4.67);
      builder.box('gold', 1.35, 0.08, 0.12, x + 1.0, floorY + 3.45, 4.67);
    }
  }
  // Central doors.
  builder.box('door', 4.2, 5.1, 0.18, 0, floorY + 2.75, 4.83);
  for (const sx of [-1, 1]) {
    builder.box('gold', 0.15, 4.6, 0.1, sx * 0.35, floorY + 2.75, 4.95);
    builder.box('gold', 0.15, 4.6, 0.1, sx * 1.95, floorY + 2.75, 4.95);
  }
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      builder.sphere('gold', 0.09, -1.4 + c * 0.9, floorY + 1.0 + r * 0.95, 4.99, 5);
    }
  }
  builder.box('gold', 5.0, 0.22, 0.6, 0, floorY + 6.1, 4.7);
  builder.box('bronzeDark', 4.1, 1.0, 0.22, 0, floorY + 7.1, 4.82);
  builder.box('gold', 3.7, 0.66, 0.08, 0, floorY + 7.1, 4.95);
  builder.box('jade', 3.35, 0.34, 0.05, 0, floorY + 7.1, 5.02);

  // Side walls and columns.
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const z = -1 + (i / 6 - 0.5) * 10.2;
      builder.cylinder('redWall', 0.22, 0.26, 7.4, sx * 9.9, floorY + 4.1, z, 8);
    }
    builder.box('jade', 0.08, 2.1, 2.0, sx * 9.75, floorY + 3.0, -1);
    builder.box('gold', 0.12, 0.08, 2.0, sx * 9.69, floorY + 4.0, -1);
  }

  // Double-eaved golden roof.
  hipRoof(builder, 'roofGold', 0, -1, 23.8, 15.2, floorY + 7.9, 2.7, 0.64, 1.0);
  builder.box('redDark', 16.6, 3.6, 9.2, 0, floorY + 10.0, -1);
  builder.box('redWall', 16.0, 3.3, 8.6, 0, floorY + 10.1, -1);
  for (let i = 0; i < 7; i++) {
    const x = (i / 6 - 0.5) * 15.0;
    builder.cylinder('redWall', 0.19, 0.22, 3.4, x, floorY + 10.1, 3.35, 8);
  }
  builder.box('bronzeDark', 4.7, 1.2, 0.2, 0, floorY + 11.2, 3.5);
  builder.box('gold', 4.3, 0.85, 0.08, 0, floorY + 11.2, 3.62);
  builder.box('jade', 3.9, 0.42, 0.05, 0, floorY + 11.2, 3.68);
  hipRoof(builder, 'roofGold', 0, -1, 20.2, 12.8, floorY + 11.7, 3.6, 0.6, 1.2);
  builder.box('roofEdge', 19.4, 0.35, 0.42, 0, floorY + 11.95, 5.2);

  // Side halls.
  for (const sx of [-1, 1]) {
    const x = sx * 27.5;
    builder.box('marble', 15, 0.5, 12, x, 0.25, -2);
    builder.box('marbleShade', 15.8, 0.18, 12.8, x, 0.02, -2);
    builder.box('redWall', 12, 4.2, 8.4, x, 2.4, -2);
    for (let i = 0; i < 6; i++) {
      builder.cylinder('redWall', 0.16, 0.2, 4.1, x + (i / 5 - 0.5) * 10.6, 2.4, 2.25, 7);
    }
    builder.box('door', 2.7, 3.2, 0.12, x, 2.0, 2.3);
    hipRoof(builder, 'roofGold', x, -2, 14.4, 10.3, 4.7, 2.1, 0.62, 0.8);
    builder.box('redDark', 8.8, 1.6, 6.2, x, 6.1, -2);
    hipRoof(builder, 'roofGold', x, -2, 11.8, 8.0, 6.9, 2.2, 0.6, 0.7);
  }

  // Long red perimeter walls with a golden cap.
  builder.box('redWall', 92, 5.2, 1.6, 0, 2.6, -35);
  builder.box('roofGold', 93, 0.55, 2.4, 0, 5.45, -35);
  builder.box('roofShade', 93.4, 0.2, 2.7, 0, 5.2, -35);
  for (const sx of [-1, 1]) {
    builder.box('redWall', 1.6, 5.2, 50, sx * 45, 2.6, -10);
    builder.box('roofGold', 2.4, 0.55, 50, sx * 45, 5.45, -10);
    builder.box('roofShade', 2.7, 0.2, 50, sx * 45, 5.2, -10);
  }

  // Back gate and corner pavilions.
  builder.box('marble', 24, 1.2, 12, 0, 0.6, -31);
  builder.box('redWall', 19, 6.4, 8.2, 0, 4.2, -31);
  builder.box('door', 5.4, 4.2, 0.2, 0, 3.1, -26.85);
  hipRoof(builder, 'roofGold', 0, -31, 21.5, 11.4, 7.5, 2.8, 0.64, 0.9);
  for (const sx of [-1, 1]) {
    const x = sx * 43.5;
    builder.box('redWall', 5.5, 5.8, 5.5, x, 2.9, -33.8);
    hipRoof(builder, 'roofGold', x, -33.8, 8.4, 8.4, 5.9, 2.2, 0.4, 1.0);
  }

  // Bronze cauldrons, lions, lanterns.
  for (const sx of [-1, 1]) {
    const x = sx * 9.6;
    builder.cylinder('bronzeDark', 0.72, 0.95, 1.25, x, 0.75, 17.5, 12);
    builder.cylinder('bronze', 1.0, 0.9, 0.22, x, 1.47, 17.5, 12);
    builder.torus('bronze', 0.92, 0.08, x, 1.12, 17.5, { rx: PI / 2, seg: 20 });
    for (const lx of [-13, 13]) {
      builder.box('marble', 1.1, 0.7, 1.8, lx, 0.35, 16.2);
      builder.sphere('bronzeDark', 0.42, lx, 1.05, 16.2, 9, { sy: 0.8 });
      builder.sphere('bronzeDark', 0.27, lx, 1.39, 15.95, 8);
      builder.box('bronzeDark', 1.0, 0.26, 1.4, lx, 0.92, 16.4);
    }
    for (let i = 0; i < 3; i++) {
      const z = 5.5 + i * 5.5;
      builder.cylinder('ironDark', 0.03, 0.03, 1.3, sx * 8.0, 3.3, z, 5);
      builder.sphere('redGlow', 0.25, sx * 8.0, 2.75, z, 8, { sy: 1.35 });
      builder.cylinder('gold', 0.11, 0.16, 0.14, sx * 8.0, 3.0, z, 6);
      builder.cylinder('gold', 0.07, 0.12, 0.18, sx * 8.0, 2.47, z, 6);
    }
  }

  // Sparse courtyard trees.
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      addTree(builder, sx * (34 + i * 3.4), 12 - i * 8, 1.0 + i * 0.08);
    }
  }

  return (t) => {
    for (const mat of ['redGlow']) {
      // The material is shared, so a gentle global pulse preserves one draw call.
      materials[mat].emissiveIntensity = 0.75 + Math.sin(t * 1.2) * 0.18;
    }
  };
}

function addForbiddenScene(THREE, materials, cfg) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cfg.fog.color, cfg.fog.near, cfg.fog.far);
  addSky(THREE, scene, cfg.sky);
  addLights(THREE, scene, cfg.light);
  const builder = new Builder(THREE);
  const update = buildForbidden(THREE, builder);
  const group = builder.finish(THREE, materials);
  scene.add(group);
  scene.userData.update = update;
  scene.userData.group = group;
  return scene;
}

function buildTaj(THREE, builder) {
  // Charbagh garden and plinth.
  builder.box('grassDark', 94, 0.24, 108, 0, -0.15, 12);
  builder.box('marbleShade', 34, 0.5, 34, 0, 0.18, 0);
  builder.box('marble', 30, 0.5, 30, 0, 0.55, 0);
  for (let i = 0; i < 3; i++) {
    builder.box('marble', 34 - i * 1.4, 0.18, 34 - i * 1.4, 0, 0.05 + i * 0.22, 0);
  }
  builder.box('marble', 26, 0.55, 26, 0, 1.0, 0);

  // Main octagonal core.
  builder.cylinder('whiteDome', 10.6, 10.8, 10.4, 0, 6.6, 0, 8, { ry: PI / 8 });
  builder.cylinder('marbleShade', 10.9, 11.0, 0.35, 0, 1.55, 0, 8, { ry: PI / 8 });
  builder.cylinder('whiteDome', 9.7, 10.0, 1.0, 0, 12.0, 0, 8, { ry: PI / 8 });
  builder.cylinder('marbleGold', 9.9, 9.9, 0.25, 0, 11.55, 0, 8, { ry: PI / 8 });

  // Four iwan portals.
  addIwan(builder, THREE, 0, 7.65, 0, 2.0, 5.0, 7.2);
  addIwan(builder, THREE, 0, -7.65, PI, 2.0, 5.0, 7.2);
  addIwan(builder, THREE, 7.65, 0, PI / 2, 2.0, 5.0, 7.2);
  addIwan(builder, THREE, -7.65, 0, -PI / 2, 2.0, 5.0, 7.2);

  // Corner pilasters and small side arches.
  for (let i = 0; i < 4; i++) {
    const a = i * PI / 2 + PI / 4;
    const r = 7.4;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    builder.cylinder('whiteDome', 0.7, 0.82, 10.2, x, 6.7, z, 8);
    builder.cylinder('marbleGold', 0.82, 0.82, 0.22, x, 1.65, z, 8);
    builder.cylinder('marbleGold', 0.8, 0.8, 0.2, x, 11.7, z, 8);
  }

  // Drum and onion dome.
  builder.cylinder('marbleShade', 8.3, 8.5, 2.4, 0, 13.6, 0, 32);
  builder.cylinder('marbleGold', 8.55, 8.55, 0.22, 0, 12.5, 0, 32);
  const profile = [
    [0.0, 0.0], [7.9, 0.0], [8.3, 0.55], [8.2, 1.35], [7.6, 2.5],
    [6.6, 3.9], [5.4, 5.4], [4.0, 6.9], [2.7, 8.3], [1.6, 9.5],
    [0.8, 10.5], [0.28, 11.3], [0.0, 11.6],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  builder.lathe('whiteDome', profile, 0, 14.8, 0, 48);
  builder.torus('marbleGold', 8.25, 0.14, 0, 14.95, 0, { rx: PI / 2, seg: 40 });

  // Dome ribs.
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU;
    const pts = profile.filter((p) => p.x > 0.1).map((p) => [
      Math.cos(a) * p.x,
      14.8 + p.y,
      Math.sin(a) * p.x,
    ]);
    builder.tube('whiteDomeShade', pts, 0.055, 4);
  }

  // Finial.
  builder.cylinder('marbleGold', 0.42, 0.6, 0.5, 0, 26.3, 0, 10);
  builder.cylinder('whiteDome', 0.22, 0.32, 1.1, 0, 27.0, 0, 8);
  for (let i = 0; i < 3; i++) {
    builder.sphere('marbleGold', 0.3 - i * 0.05, 0, 27.9 + i * 0.45, 0, 8);
  }
  builder.cylinder('marbleGold', 0.06, 0.1, 1.3, 0, 29.3, 0, 6);

  // Four chhatris.
  for (const [x, z] of [[-6.4, -6.4], [6.4, -6.4], [6.4, 6.4], [-6.4, 6.4]]) {
    builder.cylinder('whiteDome', 2.1, 2.25, 0.7, x, 13.3, z, 8);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      builder.cylinder('whiteDome', 0.12, 0.16, 2.7, x + Math.cos(a) * 1.55, 15.0, z + Math.sin(a) * 1.55, 6);
    }
    builder.cylinder('whiteDome', 2.05, 2.1, 0.55, x, 16.4, z, 8);
    builder.lathe('whiteDome', [
      [0, 0], [1.85, 0], [1.95, 0.4], [1.7, 1.2], [1.1, 2.15], [0.45, 2.9], [0.0, 3.2],
    ].map(([px, py]) => new THREE.Vector2(px, py)), x, 16.7, z, 24);
    builder.cone('marbleGold', 0.12, 1.0, x, 20.2, z, 6);
  }

  // Four minarets.
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * 16.5;
    const z = sz * 16.5;
    builder.cylinder('whiteDome', 0.0, 1.15, 0.9, x, 1.75, z, 8);
    builder.cylinder('whiteDome', 0.62, 0.92, 23.5, x, 13.5, z, 12);
    for (const y of [8.8, 15.3, 21.6]) {
      builder.cylinder('marbleGold', 1.18, 1.18, 0.2, x, y, z, 12);
      builder.cylinder('marbleShade', 1.48, 1.25, 0.25, x, y - 0.2, z, 12);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU;
        builder.cylinder('whiteDome', 0.06, 0.08, 0.85, x + Math.cos(a) * 1.05, y + 0.45, z + Math.sin(a) * 1.05, 5);
      }
    }
    builder.cylinder('whiteDome', 1.15, 1.15, 0.35, x, 25.35, z, 10);
    builder.lathe('whiteDome', [
      [0, 0], [1.3, 0], [1.38, 0.35], [1.15, 0.95], [0.7, 1.6], [0.25, 2.1], [0, 2.25],
    ].map(([px, py]) => new THREE.Vector2(px, py)), x, 25.45, z, 20);
    builder.cone('marbleGold', 0.1, 0.9, x, 27.9, z, 6);
  }

  // Pool, walkway and garden borders.
  builder.box('marble', 10.5, 0.35, 42, 0, 0.18, 38);
  builder.box('waterDark', 7.2, 0.12, 38.4, 0, 0.27, 38);
  for (const sx of [-1, 1]) {
    builder.box('marble', 0.65, 0.55, 42, sx * 4.1, 0.35, 38);
    builder.box('marble', 0.3, 0.16, 42, sx * 4.45, 0.58, 38);
  }
  builder.box('marble', 0.7, 0.5, 42, 0, 0.35, 38);
  for (let i = 0; i < 7; i++) {
    builder.box('marbleShade', 10.8, 0.1, 0.16, 0, 0.3, 19 + i * 5.6);
  }
  // Fountain pads.
  for (const z of [19, 57]) {
    builder.cylinder('marble', 2.7, 2.9, 0.45, 0, 0.3, z, 16);
    builder.cylinder('water', 2.2, 2.2, 0.16, 0, 0.56, z, 16);
    builder.cylinder('marbleGold', 0.12, 0.16, 1.2, 0, 1.0, z, 8);
    builder.sphere('glowSoft', 0.18, 0, 1.65, z, 7);
  }

  // Cypress avenues and rose beds.
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const z = 18 + i * 5.1;
      addTree(builder, sx * 8.7, z, 1.7, true);
      addTree(builder, sx * 16.5, z - 2.2, 1.45, true);
    }
    for (let i = 0; i < 6; i++) {
      builder.box('flowerRed', 6.2, 0.3, 1.4, sx * 26, 0.08, 22 + i * 8);
      builder.box('flowerPink', 5.0, 0.28, 1.1, sx * 26, 0.34, 22 + i * 8);
      builder.box('hedge', 7.0, 0.6, 2.1, sx * 26, 0.2, 22 + i * 8);
    }
  }
  for (let i = 0; i < 10; i++) {
    addTree(builder, -38 + i * 8.4, 62, 1.4);
  }
  builder.box('marble', 13, 0.3, 4, 0, 0.1, 64);
  for (const sx of [-1, 1]) {
    builder.box('marble', 0.8, 1.1, 5, sx * 13, 0.55, 64);
  }

  return {
    update(t) {
      // A few birds circle above the dome.
      for (const bird of builder.birds) {
        const a = t * 0.12 + bird.phase;
        bird.mesh.position.set(Math.cos(a) * bird.radius, bird.height + Math.sin(t * 0.8 + bird.phase) * 0.4, Math.sin(a) * bird.radius);
        bird.mesh.rotation.y = -a - PI / 2;
      }
    },
    beforeFinish() {
      // Bird silhouettes are separate so they can move.
      const birds = [];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([-1.1, 0, 0, 0, 0.25, 0, 0, 0, 0, 1.1, 0, 0, 0, 0.25, 0], 3));
      geo.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
      geo.computeVertexNormals();
      for (let i = 0; i < 5; i++) {
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x3a3b45, side: THREE.DoubleSide }));
        mesh.scale.setScalar(0.45 + i * 0.08);
        builder.scene.add(mesh);
        birds.push({ mesh, phase: i * 1.7, radius: 23 + i * 3.2, height: 32 + i * 2.5 });
      }
      builder.birds = birds;
    },
  };
}

function addTajScene(THREE, materials, cfg) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cfg.fog.color, cfg.fog.near, cfg.fog.far);
  addSky(THREE, scene, cfg.sky);
  addLights(THREE, scene, cfg.light);
  const builder = new Builder(THREE);
  builder.scene = scene;
  builder.birds = [];
  const result = buildTaj(THREE, builder);
  result.beforeFinish();
  const group = builder.finish(THREE, materials);
  scene.add(group);

  // A real planar reflection in the long pool.
  const mirror = new Reflector(new THREE.PlaneGeometry(7.2, 38.4), {
    clipBias: 0.003,
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0x8797a8,
  });
  mirror.rotation.x = -PI / 2;
  mirror.position.set(0, 0.31, 38);
  scene.add(mirror);

  const waterOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 38.4),
    new THREE.MeshPhysicalMaterial({
      color: 0x88a6b0, transparent: true, opacity: 0.22,
      roughness: 0.08, metalness: 0.15, depthWrite: false,
    }),
  );
  waterOverlay.rotation.x = -PI / 2;
  waterOverlay.position.set(0, 0.335, 38);
  scene.add(waterOverlay);

  scene.userData.update = result.update;
  scene.userData.group = group;
  scene.userData.mirror = mirror;
  scene.userData.waterOverlay = waterOverlay;
  return scene;
}

export function createLandmarkScenes(THREE) {
  const materials = makeMaterials(THREE);
  const scenes = [];
  for (const cfg of LANDMARKS) {
    let scene;
    if (cfg.id === 'eiffel') scene = addEiffelScene(THREE, materials, cfg);
    else if (cfg.id === 'wall') scene = addWallScene(THREE, materials, cfg);
    else if (cfg.id === 'forbidden') scene = addForbiddenScene(THREE, materials, cfg);
    else scene = addTajScene(THREE, materials, cfg);
    scene.userData.landmark = cfg;
    scenes.push(scene);
  }
  return { scenes, materials };
}
