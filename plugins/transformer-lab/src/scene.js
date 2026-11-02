/**
 * Three.js scene for the Transformer Lab.
 *
 * Layout: one vertical column per token. The residual stream runs up each
 * column through four levels — tokens, attention, MLP, output probabilities.
 */

const LEVEL = { token: 0, attention: 3.4, mlp: 6.8, output: 9.35 };
const HEAD_COLORS = [0x6fe3ff, 0xffc46b, 0xb79cff];
const TOKEN_COLORS = [0x6fe3ff, 0xffc46b, 0xb79cff, 0x7ee0b0, 0xff9db0, 0x8ab4ff];

const VIEWS = [
  { az: 0.18, polar: 1.24, dist: 21, target: [0, 1.1, 0] },
  { az: 0.1, polar: 1.16, dist: 19.5, target: [0, 2.2, 0] },
  { az: 0.5, polar: 1.03, dist: 19.5, target: [0, 3.9, 0] },
  { az: -0.52, polar: 1.02, dist: 19.5, target: [0, 3.9, 0] },
  { az: 0.24, polar: 1.0, dist: 18.5, target: [0, 6.9, 0] },
  { az: 0.04, polar: 1.2, dist: 17, target: [0, 10.15, 0] },
];

function damp(current, target, rate, dt) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

function shortestAngle(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function createTransformerScene(THREE, canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080f);
  scene.fog = new THREE.Fog(0x05080f, 26, 58);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
  camera.position.set(0, 8, 22);

  // ------------------------------------------------------------------ lights
  scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x090c14, 0.75));
  scene.add(new THREE.AmbientLight(0x33445f, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffe6c4, 2.2);
  keyLight.position.set(8, 16, 11);
  scene.add(keyLight);

  const coolLight = new THREE.PointLight(0x63d8f2, 120, 34, 2);
  coolLight.position.set(-9, 7, 6);
  scene.add(coolLight);

  const warmLight = new THREE.PointLight(0xf3b969, 90, 30, 2);
  warmLight.position.set(9, 10, -3);
  scene.add(warmLight);

  // ------------------------------------------------------------------ static world
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshStandardMaterial({ color: 0x060a12, roughness: 0.94, metalness: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.62;
  scene.add(floor);

  const grid = new THREE.GridHelper(46, 46, 0x1b2f49, 0x101a27);
  grid.position.y = -1.6;
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  scene.add(grid);

  const starRandom = (() => {
    let seed = 0x9e3779b9;
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  })();
  const starPositions = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i += 1) {
    starPositions[i * 3] = (starRandom() - 0.5) * 46;
    starPositions[i * 3 + 1] = starRandom() * 20 + 0.5;
    starPositions[i * 3 + 2] = (starRandom() - 0.5) * 42 - 4;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x6f9ac6,
      size: 0.075,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(stars);

  // ------------------------------------------------------------------ groups
  const world = new THREE.Group();
  scene.add(world);

  const sequenceGroup = new THREE.Group();
  const markerGroup = new THREE.Group();
  const arcGroup = new THREE.Group();
  const barGroup = new THREE.Group();
  world.add(sequenceGroup, markerGroup, arcGroup, barGroup);

  let columns = [];
  let bars = [];
  let arcs = [];
  let particles = [];
  let disposed = false;

  const state = {
    model: null,
    prompt: null,
    stage: 0,
    query: 0,
    head: 0,
    weights: null,
    picked: null,
    correct: 0,
  };

  // ------------------------------------------------------------------ camera state
  const view = {
    az: VIEWS[0].az,
    polar: VIEWS[0].polar,
    dist: VIEWS[0].dist,
    target: new THREE.Vector3(...VIEWS[0].target),
    desiredAz: VIEWS[0].az,
    desiredPolar: VIEWS[0].polar,
    desiredDist: VIEWS[0].dist,
    desiredTarget: new THREE.Vector3(...VIEWS[0].target),
    autoOrbit: options.autoOrbit !== false,
  };

  // ------------------------------------------------------------------ text sprites
  function makeTextSprite(text, config = {}) {
    const width = config.canvasWidth || 512;
    const height = config.canvasHeight || 152;
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = width;
    mapCanvas.height = height;
    const ctx = mapCanvas.getContext('2d');
    const texture = new THREE.CanvasTexture(mapCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: config.opacity == null ? 1 : config.opacity,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(config.worldWidth || 2.4, config.worldHeight || 0.72, 1);

    function draw(value) {
      const lines = String(value).split('\n');
      ctx.clearRect(0, 0, width, height);
      const baseSize = config.fontSize || 52;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = baseSize;
      for (const line of lines) {
        ctx.font = `${config.weight || 600} ${size}px ${config.font || '"IBM Plex Sans", system-ui, -apple-system, sans-serif'}`;
        const measured = ctx.measureText(line).width;
        if (measured > width - 36) size = Math.floor((size * (width - 36)) / measured);
      }
      lines.forEach((line, index) => {
        ctx.font = `${config.weight || 600} ${size}px ${config.font || '"IBM Plex Sans", system-ui, -apple-system, sans-serif'}`;
        ctx.fillStyle = config.color || '#dcecff';
        const offset = (index - (lines.length - 1) / 2) * size * 1.22;
        ctx.fillText(line, width / 2, height / 2 + offset);
      });
      texture.needsUpdate = true;
    }

    draw(text);
    sprite.userData.draw = draw;
    return sprite;
  }

  function disposeGroup(group) {
    group.traverse((node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
      }
    });
    group.clear();
  }

  // ------------------------------------------------------------------ sequence
  function buildSequence() {
    disposeGroup(sequenceGroup);
    disposeGroup(markerGroup);
    disposeGroup(arcGroup);
    columns = [];
    arcs = [];
    particles = [];

    const model = state.model;
    if (!model) return;

    const count = model.tokens.length;
    const gap = count > 5 ? 1.95 : 2.15;
    const leftMost = -((count - 1) / 2) * gap;

    model.tokens.forEach((token, index) => {
      const x = (index - (count - 1) / 2) * gap;
      const color = TOKEN_COLORS[index % TOKEN_COLORS.length];
      const column = new THREE.Group();
      column.position.x = x;
      sequenceGroup.add(column);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, LEVEL.output, 8, 1, true),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      beam.position.y = LEVEL.output / 2;
      column.add(beam);

      const tokenMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.75,
        roughness: 0.32,
        metalness: 0.35,
      });
      const tokenMesh = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.5, 0.86), tokenMaterial);
      tokenMesh.position.y = LEVEL.token;
      tokenMesh.userData.tokenIndex = index;
      column.add(tokenMesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(tokenMesh.geometry),
        new THREE.LineBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.26 }),
      );
      tokenMesh.add(edges);

      const attentionMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.28,
        metalness: 0.4,
      });
      const attentionMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 16), attentionMaterial);
      attentionMesh.position.y = LEVEL.attention;
      attentionMesh.userData.tokenIndex = index;
      column.add(attentionMesh);

      const mlpGroup = new THREE.Group();
      mlpGroup.position.y = LEVEL.mlp;
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({
          color: 0xb79cff,
          emissive: 0x8f6dff,
          emissiveIntensity: 0.55,
          roughness: 0.3,
          metalness: 0.35,
        }),
      );
      mlpGroup.add(core);
      for (let h = 0; h < 6; h += 1) {
        const angle = (h / 6) * Math.PI * 2;
        const hidden = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xb79cff, transparent: true, opacity: 0.8 }),
        );
        hidden.position.set(Math.cos(angle) * 0.62, Math.sin(angle) * 0.16, Math.sin(angle) * 0.62);
        mlpGroup.add(hidden);
      }
      column.add(mlpGroup);

      const embeddingGroup = new THREE.Group();
      embeddingGroup.position.y = LEVEL.token + 0.45;
      const vector = model.embeddings[index] || [];
      for (let d = 0; d < Math.min(6, vector.length); d += 1) {
        const angle = (d / 6) * Math.PI * 2;
        const height = 0.14 + Math.abs(vector[d]) * 0.62;
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, height, 0.065),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.62,
          }),
        );
        bar.position.set(Math.cos(angle) * 0.8, height / 2, Math.sin(angle) * 0.8);
        embeddingGroup.add(bar);
      }
      embeddingGroup.visible = false;
      column.add(embeddingGroup);

      const label = makeTextSprite(token, {
        worldWidth: Math.min(2.15, gap * 0.98),
        worldHeight: 0.5,
        canvasWidth: 512,
        canvasHeight: 128,
        fontSize: 48,
        color: '#e7f3ff',
      });
      label.position.set(0, LEVEL.token - 0.72, 0.06);
      label.userData.tokenIndex = index;
      column.add(label);

      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(1.6, gap * 0.92), 1.5, 1.4),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.y = LEVEL.token;
      hit.userData.tokenIndex = index;
      column.add(hit);

      // A gentle particle trail between attention and MLP for each token.
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(9 * 3);
      for (let p = 0; p < 9; p += 1) {
        positions[p * 3] = (Math.sin(p * 7.1 + index) * 0.22);
        positions[p * 3 + 1] = LEVEL.attention + ((p / 9) * (LEVEL.mlp - LEVEL.attention));
        positions[p * 3 + 2] = Math.cos(p * 5.3 + index) * 0.22;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const trail = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color,
          size: 0.07,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      trail.userData.index = index;
      column.add(trail);
      particles.push(trail);

      columns.push({
        index,
        x,
        color,
        tokenMesh,
        attentionMesh,
        mlpGroup,
        embeddingGroup,
        beam,
        label,
        hover: 0,
      });
    });

    // Level markers on the left edge.
    const markerX = leftMost - 2.5;
    const markers = [
      { y: LEVEL.token, text: '01 · TOKENS' },
      { y: LEVEL.attention, text: '02 · ATTENTION' },
      { y: LEVEL.mlp, text: '03 · MLP' },
      { y: LEVEL.output, text: '04 · OUTPUT' },
    ];
    for (const marker of markers) {
      const label = makeTextSprite(marker.text, {
        worldWidth: 2.2,
        worldHeight: 0.36,
        canvasWidth: 512,
        canvasHeight: 112,
        fontSize: 38,
        color: '#7f95b3',
        font: '"SFMono-Regular", ui-monospace, monospace',
      });
      label.position.set(markerX, marker.y, 0);
      markerGroup.add(label);

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(markerX - 1.2, marker.y, 0),
          new THREE.Vector3(markerX - 0.5, marker.y, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x4c6a8c, transparent: true, opacity: 0.5 }),
      );
      markerGroup.add(line);
    }

    rebuildArcs();
    applyStageVisibility();
  }

  // ------------------------------------------------------------------ bars
  function buildBars() {
    disposeGroup(barGroup);
    bars = [];
    const prompt = state.prompt;
    if (!prompt) return;
    const candidates = prompt.candidates || [];
    const spacing = 1.7;
    const baseY = LEVEL.output;

    candidates.forEach((candidate, index) => {
      const x = (index - (candidates.length - 1) / 2) * spacing;
      const geometry = new THREE.BoxGeometry(1.06, 1, 0.82);
      geometry.translate(0, 0.5, 0);
      const material = new THREE.MeshStandardMaterial({
        color: 0x17263a,
        emissive: 0x2a4c6b,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.4,
        transparent: true,
        opacity: 0.94,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, baseY, 0);
      mesh.scale.y = 0.16;
      mesh.userData.barIndex = index;
      barGroup.add(mesh);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(1.02, 0.035, 0.78),
        new THREE.MeshBasicMaterial({ color: 0x8fd8ef, transparent: true, opacity: 0.7 }),
      );
      cap.position.y = 1;
      mesh.add(cap);

      const label = makeTextSprite(`${candidate.token}\n—`, {
        worldWidth: 2.0,
        worldHeight: 0.72,
        canvasWidth: 512,
        canvasHeight: 184,
        fontSize: 46,
        color: '#dcecff',
      });
      label.position.set(x, baseY + 3.15, 0);
      barGroup.add(label);

      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 3.6, 1.2),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.set(x, baseY + 1.8, 0);
      hit.userData.barIndex = index;
      barGroup.add(hit);

      bars.push({
        index,
        mesh,
        cap,
        label,
        hit,
        baseY,
        height: 0.16,
        target: 0.16,
        candidate,
      });
    });
    barGroup.visible = state.stage >= 5;
    refreshBarLabels();
    refreshBarTargets();
  }

  function refreshBarLabels() {
    const revealed = state.picked != null;
    for (const bar of bars) {
      const pct = Math.round((bar.candidate.p || 0) * 100);
      bar.label.userData.draw(`${bar.candidate.token}\n${revealed ? `${pct}%` : '—'}`);
    }
  }

  function refreshBarTargets() {
    const revealed = state.picked != null;
    for (const bar of bars) {
      const p = bar.candidate.p || 0;
      bar.target = revealed ? 0.35 + p * 3.0 : 0.16;
      const material = bar.mesh.material;
      if (!revealed) {
        material.color.setHex(0x17263a);
        material.emissive.setHex(0x2a4c6b);
        material.emissiveIntensity = 0.35;
        bar.cap.material.color.setHex(0x8fd8ef);
      } else if (bar.index === state.correct) {
        material.color.setHex(0x3a2a12);
        material.emissive.setHex(0xffc46b);
        material.emissiveIntensity = 0.8;
        bar.cap.material.color.setHex(0xffd899);
      } else if (bar.index === state.picked) {
        material.color.setHex(0x3a1620);
        material.emissive.setHex(0xff6b84);
        material.emissiveIntensity = 0.55;
        bar.cap.material.color.setHex(0xff9db0);
      } else {
        material.color.setHex(0x14202f);
        material.emissive.setHex(0x20384d);
        material.emissiveIntensity = 0.18;
        bar.cap.material.color.setHex(0x5b7b96);
      }
    }
  }

  // ------------------------------------------------------------------ attention arcs
  function rebuildArcs() {
    disposeGroup(arcGroup);
    arcs = [];
    const model = state.model;
    if (!model || !state.weights) return;
    const row = state.weights[state.query];
    if (!row) return;

    const color = HEAD_COLORS[state.head % HEAD_COLORS.length];
    const queryColumn = columns[state.query];
    if (queryColumn) {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.025, 8, 40),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.set(queryColumn.x, LEVEL.attention, 0);
      arcGroup.add(halo);
    }

    const ranked = row
      .map((weight, index) => ({ weight, index }))
      .filter((entry) => entry.index !== state.query && entry.weight > 0.02)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4);

    ranked.forEach((entry, order) => {
      const targetColumn = columns[entry.index];
      if (!targetColumn) return;
      const start = new THREE.Vector3(queryColumn.x, LEVEL.attention + 0.08, 0);
      const end = new THREE.Vector3(targetColumn.x, LEVEL.attention + 0.08, 0);
      const midpoint = start.clone().add(end).multiplyScalar(0.5);
      midpoint.y += 0.75 + entry.weight * 2.5;
      midpoint.z += 1.25 + entry.weight * 1.6;
      const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);

      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 42, 0.016 + entry.weight * 0.085, 8, false),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.16 + entry.weight * 0.68,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      arcGroup.add(tube);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.055 + entry.weight * 0.05, 10, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      arcGroup.add(pulse);
      arcs.push({ curve, pulse, offset: order * 0.23 });
    });
  }

  // ------------------------------------------------------------------ stage
  function applyStageVisibility() {
    for (const column of columns) {
      column.embeddingGroup.visible = state.stage >= 1;
      column.mlpGroup.visible = state.stage >= 2;
    }
    arcGroup.visible = state.stage >= 2 && state.stage <= 4;
    barGroup.visible = state.stage >= 5;
    refreshBarTargets();
  }

  // ------------------------------------------------------------------ public API
  function setData(model, prompt) {
    state.model = model;
    state.prompt = prompt;
    state.query = Math.min(prompt.queryDefault == null ? 0 : prompt.queryDefault, model.tokens.length - 1);
    state.correct = prompt.correct || 0;
    state.picked = null;
    buildSequence();
    buildBars();
    rebuildArcs();
  }

  function setStage(stage) {
    if (state.stage === stage) {
      applyStageVisibility();
      return;
    }
    state.stage = stage;
    const next = VIEWS[stage] || VIEWS[0];
    view.desiredAz = next.az;
    view.desiredPolar = next.polar;
    view.desiredDist = next.dist;
    view.desiredTarget.set(...next.target);
    applyStageVisibility();
  }

  function setAttention(query, head, weights) {
    const changed = state.query !== query || state.head !== head || state.weights !== weights;
    state.query = query;
    state.head = head;
    state.weights = weights;
    if (changed) rebuildArcs();
  }

  function setPrediction(picked, correct) {
    state.picked = picked;
    state.correct = correct;
    refreshBarLabels();
    refreshBarTargets();
  }

  function resetView() {
    const next = VIEWS[state.stage] || VIEWS[0];
    view.desiredAz = next.az;
    view.desiredPolar = next.polar;
    view.desiredDist = next.dist;
    view.desiredTarget.set(...next.target);
  }

  function setAutoOrbit(enabled) {
    view.autoOrbit = Boolean(enabled);
  }

  // ------------------------------------------------------------------ pointer
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  let hovered = -1;

  function pointerToNdc(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  }

  function pick(event) {
    pointerToNdc(event);
    raycaster.setFromCamera(pointer, camera);
    if (state.stage >= 5) {
      const barHits = raycaster.intersectObjects(bars.map((bar) => bar.hit), false);
      if (barHits.length) return { barIndex: barHits[0].object.userData.barIndex };
    }
    const tokenTargets = [];
    for (const column of columns) {
      tokenTargets.push(column.tokenMesh);
      tokenTargets.push(column.attentionMesh);
    }
    const tokenHits = raycaster.intersectObjects(tokenTargets, false);
    if (tokenHits.length) return { tokenIndex: tokenHits[0].object.userData.tokenIndex };
    return null;
  }

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (dragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
      view.desiredAz -= dx * 0.006;
      view.desiredPolar = Math.max(0.42, Math.min(1.46, view.desiredPolar - dy * 0.004));
      return;
    }
    pointerToNdc(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(
      columns.flatMap((column) => [column.tokenMesh, column.attentionMesh]),
      false,
    );
    let nextHover = hits.length ? hits[0].object.userData.tokenIndex : -1;
    let overBar = false;
    if (state.stage >= 5) {
      const barHits = raycaster.intersectObjects(bars.map((bar) => bar.hit), false);
      overBar = barHits.length > 0;
    }
    if (nextHover !== hovered) hovered = nextHover;
    canvas.style.cursor = nextHover >= 0 || overBar ? 'pointer' : 'grab';
  }

  function onPointerUp(event) {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch (_error) {
      // pointer capture may already be released
    }
    if (moved) return;
    const result = pick(event);
    if (!result) return;
    if (result.tokenIndex != null) options.onSelectToken?.(result.tokenIndex);
    if (result.barIndex != null) options.onPickBar?.(result.barIndex);
  }

  function onWheel(event) {
    event.preventDefault();
    view.desiredDist = Math.max(10, Math.min(38, view.desiredDist + event.deltaY * 0.02));
  }

  function onKeyDown(event) {
    const key = event.key;
    if (key === 'ArrowLeft') {
      view.desiredAz += 0.08;
      event.preventDefault();
    } else if (key === 'ArrowRight') {
      view.desiredAz -= 0.08;
      event.preventDefault();
    } else if (key === 'ArrowUp') {
      view.desiredPolar = Math.min(1.46, view.desiredPolar + 0.05);
      event.preventDefault();
    } else if (key === 'ArrowDown') {
      view.desiredPolar = Math.max(0.42, view.desiredPolar - 0.05);
      event.preventDefault();
    } else if (key === '+' || key === '=') {
      view.desiredDist = Math.max(10, view.desiredDist - 1.2);
      event.preventDefault();
    } else if (key === '-' || key === '_') {
      view.desiredDist = Math.min(38, view.desiredDist + 1.2);
      event.preventDefault();
    } else if (key === 'r' || key === 'R') {
      resetView();
      event.preventDefault();
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('keydown', onKeyDown);

  // ------------------------------------------------------------------ resize
  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  // ------------------------------------------------------------------ animate
  let raf = 0;
  let previous = 0;
  let elapsed = 0;

  function updateCamera(dt) {
    if (view.autoOrbit && !dragging && !options.reducedMotion) {
      view.desiredAz += dt * 0.075;
    }
    view.az += shortestAngle(view.az, view.desiredAz) * (1 - Math.exp(-4.2 * dt));
    view.polar = damp(view.polar, view.desiredPolar, 4.2, dt);
    view.dist = damp(view.dist, view.desiredDist, 3.4, dt);
    view.target.x = damp(view.target.x, view.desiredTarget.x, 3.4, dt);
    view.target.y = damp(view.target.y, view.desiredTarget.y, 3.4, dt);
    view.target.z = damp(view.target.z, view.desiredTarget.z, 3.4, dt);

    const sinPolar = Math.sin(view.polar);
    camera.position.set(
      view.target.x + view.dist * sinPolar * Math.sin(view.az),
      view.target.y + view.dist * Math.cos(view.polar),
      view.target.z + view.dist * sinPolar * Math.cos(view.az),
    );
    camera.lookAt(view.target);
  }

  function animateColumns(time, dt) {
    for (const column of columns) {
      const isQuery = column.index === state.query;
      const isHover = column.index === hovered;
      column.hover = damp(column.hover, isHover ? 1 : 0, 8, dt);
      column.tokenMesh.scale.setScalar(1 + column.hover * 0.06);
      column.tokenMesh.material.emissiveIntensity =
        (state.stage === 0 ? 1.1 : 0.55) + column.hover * 0.4 + Math.sin(time * 2 + column.index) * 0.08;

      const attentionActive = state.stage === 2 || state.stage === 3;
      column.attentionMesh.material.emissiveIntensity = attentionActive
        ? (isQuery ? 1.9 : 0.9) + Math.sin(time * 3 + column.index) * 0.18
        : 0.34;
      column.attentionMesh.scale.setScalar(isQuery && attentionActive ? 1.35 : 1);

      column.mlpGroup.rotation.y = time * 0.55 + column.index;
      column.mlpGroup.scale.setScalar(state.stage === 4 ? 1.12 : 0.9);

      if (column.embeddingGroup.visible) {
        column.embeddingGroup.rotation.y = time * 0.5 + column.index * 0.4;
        const glow = state.stage === 1 ? 0.9 : 0.5;
        column.embeddingGroup.children.forEach((bar) => {
          if (bar.material) bar.material.opacity = glow;
        });
      }

      if (column.beam.material) {
        column.beam.material.opacity =
          state.stage >= 2 ? 0.2 + Math.sin(time * 1.4 + column.index) * 0.035 : 0.1;
      }
    }
  }

  function animateArcs(time) {
    for (const arc of arcs) {
      const t = (time * 0.22 + arc.offset) % 1;
      const point = arc.curve.getPointAt(t);
      arc.pulse.position.copy(point);
      const pulseScale = 0.8 + Math.sin(t * Math.PI) * 0.7;
      arc.pulse.scale.setScalar(pulseScale);
    }
  }

  function animateBars(dt) {
    for (const bar of bars) {
      const next = damp(bar.height, bar.target, 5, dt);
      bar.height = next;
      bar.mesh.scale.y = Math.max(0.02, next);
      bar.cap.position.y = 1;
    }
  }

  function animateParticles(time) {
    for (const trail of particles) {
      const positions = trail.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i += 1) {
        const base = LEVEL.attention + ((i / 9) * (LEVEL.mlp - LEVEL.attention));
        const travel = ((time * 0.16 + i * 0.09 + trail.userData.index * 0.13) % 1);
        positions[i * 3 + 1] = base + travel * 0.9;
        positions[i * 3] = Math.sin(i * 7.1 + time * 0.4 + trail.userData.index) * 0.28;
        positions[i * 3 + 2] = Math.cos(i * 5.3 + time * 0.35) * 0.28;
      }
      trail.geometry.attributes.position.needsUpdate = true;
    }
  }

  function frame(timestamp) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = previous ? Math.min(0.05, (timestamp - previous) / 1000) : 0.016;
    previous = timestamp;
    if (document.hidden) return;
    elapsed += dt;
    updateCamera(dt);
    animateColumns(elapsed, dt);
    if (state.stage >= 2 && state.stage <= 4) animateArcs(elapsed);
    if (state.stage >= 5) animateBars(dt);
    if (!options.reducedMotion) animateParticles(elapsed);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('keydown', onKeyDown);
    disposeGroup(sequenceGroup);
    disposeGroup(markerGroup);
    disposeGroup(arcGroup);
    disposeGroup(barGroup);
    starGeometry.dispose();
    stars.material.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    grid.geometry.dispose();
    grid.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return {
    setData,
    setStage,
    setAttention,
    setPrediction,
    setAutoOrbit,
    resetView,
    resize,
    dispose,
  };
}
