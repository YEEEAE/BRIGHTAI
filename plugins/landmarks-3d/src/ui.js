import * as THREE from 'three';
import { createLandmarkScenes, LANDMARKS } from './scenes.js';
import { CSS } from './styles.js';

const EN = {
  navLabel: 'Landmark Atlas',
  eyebrow: 'Interactive atlas · 3D',
  title: 'World Landmarks',
  subtitle: 'Four monuments reconstructed in real time. Drag to orbit, scroll to zoom.',
  live: 'Live WebGL',
  loading: 'Building monuments',
  hint: 'Drag to orbit · Scroll to zoom · Double-click to reset',
  autoOrbit: 'Toggle auto-orbit',
  resetView: 'Reset view',
  fullscreen: 'Enter fullscreen',
  exitFullscreen: 'Exit fullscreen',
  galleryLabel: 'Choose a landmark',
  nowViewing: 'Now viewing',
  webglTitle: '3D view unavailable',
  webglBody: 'This browser could not start a WebGL2 context. Try a current version of Chrome, Edge, Firefox, or Safari with hardware acceleration enabled.',
  built: 'Built',
  scale: 'Scale',
  material: 'Material',
  name_eiffel: 'Eiffel Tower',
  name_wall: 'Great Wall',
  name_forbidden: 'Forbidden City',
  name_taj: 'Taj Mahal',
  place_eiffel: 'Paris, France',
  place_wall: 'Huairou, China',
  place_forbidden: 'Beijing, China',
  place_taj: 'Agra, India',
  desc_eiffel: 'A temporary iron centrepiece for the 1889 World’s Fair became the silhouette of Paris. Four curved lattice legs rise through three observation decks to a beacon above the Champ de Mars.',
  desc_wall: 'A fortified frontier road stitched across mountains and dry valleys. Crenellated parapets, watchtowers and rammed-earth courses follow the ridge for more than twenty thousand kilometres.',
  desc_forbidden: 'The imperial palace at the centre of Beijing, organised along one ceremonial axis. Vermilion walls, marble terraces and double-eaved golden roofs culminate in the Hall of Supreme Harmony.',
  desc_taj: 'A white-marble mausoleum held in a long reflecting channel. A great onion dome, four minarets and a quartered garden turn symmetry into an architectural atmosphere.',
  material_eiffel: 'Wrought iron',
  material_wall: 'Stone & brick',
  material_forbidden: 'Marble & timber',
  material_taj: 'Makrana marble',
};

const ZH = {
  navLabel: '地标图鉴',
  eyebrow: '互动图鉴 · 3D',
  title: '世界地标',
  subtitle: '四座地标实时重建。拖动环绕，滚轮缩放。',
  live: 'WebGL 实时',
  loading: '正在建造地标',
  hint: '拖动环绕 · 滚轮缩放 · 双击复位',
  autoOrbit: '切换自动环绕',
  resetView: '重置视角',
  fullscreen: '进入全屏',
  exitFullscreen: '退出全屏',
  galleryLabel: '选择地标',
  nowViewing: '正在观看',
  webglTitle: '无法显示 3D 场景',
  webglBody: '此浏览器无法启动 WebGL2。请尝试启用硬件加速的最新版 Chrome、Edge、Firefox 或 Safari。',
  built: '建成',
  scale: '尺度',
  material: '材质',
  name_eiffel: '埃菲尔铁塔',
  name_wall: '长城',
  name_forbidden: '紫禁城',
  name_taj: '泰姬陵',
  place_eiffel: '法国 · 巴黎',
  place_wall: '中国 · 怀柔',
  place_forbidden: '中国 · 北京',
  place_taj: '印度 · 阿格拉',
  desc_eiffel: '为 1889 年世界博览会而建的临时铁塔，最终成为巴黎的剪影。四条弧线格构塔腿穿过三层观景台，直抵战神广场上空的灯塔。',
  desc_wall: '一条横跨山脉与干谷的防御边墙。垛口、敌楼与夯土墙体沿山脊延伸两万余公里，构成古代中国的边疆轮廓。',
  desc_forbidden: '位于北京中轴线上的皇城宫殿。朱红宫墙、汉白玉台基与重檐金瓦沿礼仪轴线层层展开，最终抵达太和殿。',
  desc_taj: '一座倒映在长水池中的白色大理石陵墓。巨大的洋葱穹顶、四座宣礼塔与四分花园，让对称成为可感知的空间氛围。',
  material_eiffel: '锻铁',
  material_wall: '砖石',
  material_forbidden: '汉白玉与木构',
  material_taj: '马克拉纳大理石',
};

const AR = {
  navLabel: 'أطلس المعالم',
  eyebrow: 'أطلس تفاعلي · ثلاثي الأبعاد',
  title: 'معالم العالم',
  subtitle: 'أربعة معالم أُعيد بناؤها في الوقت الحقيقي. اسحب للدوران ومرّر للتكبير.',
  live: 'WebGL مباشر',
  loading: 'جارٍ بناء المعالم',
  hint: 'اسحب للدوران · مرّر للتكبير · انقر مرتين لإعادة الضبط',
  autoOrbit: 'تبديل الدوران التلقائي',
  resetView: 'إعادة ضبط العرض',
  fullscreen: 'ملء الشاشة',
  exitFullscreen: 'إنهاء ملء الشاشة',
  galleryLabel: 'اختر معلمًا',
  nowViewing: 'تشاهد الآن',
  webglTitle: 'العرض ثلاثي الأبعاد غير متاح',
  webglBody: 'تعذّر على هذا المتصفح بدء سياق WebGL2. جرّب إصدارًا حديثًا من Chrome أو Edge أو Firefox أو Safari مع تفعيل تسريع العتاد.',
  built: 'الإنشاء',
  scale: 'المقياس',
  material: 'المادة',
  name_eiffel: 'برج إيفل',
  name_wall: 'سور الصين العظيم',
  name_forbidden: 'المدينة المحرمة',
  name_taj: 'تاج محل',
  place_eiffel: 'باريس، فرنسا',
  place_wall: 'هوايرو، الصين',
  place_forbidden: 'بكين، الصين',
  place_taj: 'أغرا، الهند',
  desc_eiffel: 'قطعة حديدية مؤقتة لمعرض 1889 العالمي صارت ظلّ باريس. ترتفع أربع أرجل شبكية منحنية عبر ثلاث منصات مشاهدة إلى منارة فوق شان دو مارس.',
  desc_wall: 'طريق حدودي محصّن يمتد عبر الجبال والأودية الجافة. تتبع الشرفات وأبراج المراقبة الجدران الترابية خط السلسلة الجبلية لأكثر من عشرين ألف كيلومتر.',
  desc_forbidden: 'القصر الإمبراطوري في قلب بكين، منظّم على محور احتفالي واحد. الجدران القرمزية والأسطح الذهبية المزدوجة تتوج بقاعة التناغم الأعلى.',
  desc_taj: 'ضريح من الرخام الأبيض ينعكس في قناة مائية طويلة. القبة البصلية الكبيرة والمآذن الأربع والحديقة المقسّمة تجعل التناظر جوًا معماريًا.',
  material_eiffel: 'حديد مطاوع',
  material_wall: 'حجر وطوب',
  material_forbidden: 'رخام وخشب',
  material_taj: 'رخام ماكرانا',
};

const DICTS = { en: EN, zh: ZH, ar: AR };

// Assigned by createUI from the React instance supplied by the module table.
let h = null;

function translate(locale, key) {
  const active = locale.getLocale().active;
  return (DICTS[active] && DICTS[active][key]) || EN[key] || key;
}

function SidebarIcon({ size = 20, active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className="lm-nav-icon"
      aria-hidden="true"
      style={{ color: 'currentColor', opacity: active ? 1 : 0.92 }}
    >
      <path
        d="M3.5 20.5h17M6.2 20.5l1.7-8.4h8.2l1.7 8.4M8.7 12.1 10 5.3h4l1.3 6.8M12 2.4v3.1M10.5 4.9h3"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.8 20.3c2.1-2.8 4.2-2.7 6.1 0M14.1 20.3c1.9-2.8 4-2.8 6.1 0"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.62"
      />
      <circle cx="18.8" cy="4.6" r="0.9" fill="currentColor" opacity="0.72" />
    </svg>
  );
}

function OrbitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="8.2" ry="3.5" stroke="currentColor" strokeWidth="1.35" opacity="0.72" />
      <circle cx="12" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.35" />
      <path d="M19.4 9.6c.7 1.1.9 2.3.5 3.7M4.3 14.8c-.6-1.2-.7-2.4-.3-3.7" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="m19.9 7.8.2 2.3-2.2-.6M4 16.3l-.2-2.3 2.2.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M5.4 8.2A7.4 7.4 0 1 1 4.6 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.5 4.6v3.9h3.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function FullscreenIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      {active ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function createEngine(THREE, canvas, { autoRotate, initialIndex = 0 }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 620);
  const { scenes, materials } = createLandmarkScenes(THREE);
  let active = initialIndex;
  let running = true;
  let disposed = false;
  let raf = 0;
  let lastTime = performance.now();
  let time = 0;
  let auto = autoRotate;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;

  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let sceneMotion = !(motionQuery && motionQuery.matches);
  const onMotionChange = (event) => { sceneMotion = !event.matches; };
  if (motionQuery) {
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
  }

  const preset = () => LANDMARKS[active].camera;
  const view = {
    az: preset().azimuth,
    polar: preset().polar,
    radius: preset().radius,
    look: new THREE.Vector3(...preset().target),
  };
  const goal = {
    az: view.az,
    polar: view.polar,
    radius: view.radius,
    look: new THREE.Vector3(...view.look.toArray()),
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  function setLandmark(index) {
    if (!LANDMARKS[index]) return;
    active = index;
    const p = LANDMARKS[index].camera;
    goal.az = p.azimuth;
    goal.polar = p.polar;
    goal.radius = p.radius;
    goal.look.set(p.target[0], p.target[1], p.target[2]);
  }

  function resetView() {
    setLandmark(active);
    view.look.copy(goal.look);
    view.az = goal.az;
    view.polar = goal.polar;
    view.radius = goal.radius;
  }

  function setAutoRotate(value) {
    auto = Boolean(value);
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.classList.add('is-dragging');
    if (canvas.setPointerCapture) canvas.setPointerCapture(pointerId);
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    goal.az -= dx * 0.0062;
    goal.polar = THREE.MathUtils.clamp(goal.polar - dy * 0.0052, 0.34, 1.525);
  }

  function endDrag(event) {
    if (event && pointerId !== null && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    canvas.classList.remove('is-dragging');
  }

  function onPointerLeave(event) {
    if (dragging && event.pointerType !== 'mouse') endDrag(event);
  }

  function onWheel(event) {
    event.preventDefault();
    const p = preset();
    const factor = Math.exp(event.deltaY * 0.0011);
    goal.radius = THREE.MathUtils.clamp(goal.radius * factor, p.radius * 0.52, p.radius * 1.65);
  }

  function onDoubleClick() {
    resetView();
  }

  function onKeyDown(event) {
    const step = 0.09;
    if (event.key === 'ArrowLeft') goal.az -= step;
    else if (event.key === 'ArrowRight') goal.az += step;
    else if (event.key === 'ArrowUp') goal.polar = Math.max(0.34, goal.polar - 0.06);
    else if (event.key === 'ArrowDown') goal.polar = Math.min(1.525, goal.polar + 0.06);
    else if (event.key === '+' || event.key === '=') goal.radius = Math.max(10, goal.radius * 0.92);
    else if (event.key === '-' || event.key === '_') goal.radius = Math.min(300, goal.radius * 1.08);
    else if (event.key === 'r' || event.key === 'R') resetView();
    else return;
    event.preventDefault();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('dblclick', onDoubleClick);
  canvas.addEventListener('keydown', onKeyDown);

  function frame(now) {
    if (!running || disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    time += dt;

    const p = preset();
    if (auto && !dragging) goal.az += dt * 0.062;

    view.az += (goal.az - view.az) * Math.min(1, dt * 7.5);
    view.polar += (goal.polar - view.polar) * Math.min(1, dt * 7.5);
    view.radius += (goal.radius - view.radius) * Math.min(1, dt * 6.2);
    view.look.lerp(goal.look, Math.min(1, dt * 5.8));

    const sinPolar = Math.sin(view.polar);
    camera.position.set(
      view.look.x + view.radius * sinPolar * Math.sin(view.az),
      view.look.y + view.radius * Math.cos(view.polar),
      view.look.z + view.radius * sinPolar * Math.cos(view.az),
    );
    camera.lookAt(view.look);

    const scene = scenes[active];
    if (sceneMotion && scene.userData.update) scene.userData.update(time, dt);
    renderer.render(scene, camera);
  }

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running && !disposed) {
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(frame);

  function dispose() {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVisibility);
    if (motionQuery) {
      if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', onMotionChange);
      else if (motionQuery.removeListener) motionQuery.removeListener(onMotionChange);
    }
    resizeObserver.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', endDrag);
    canvas.removeEventListener('pointercancel', endDrag);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('dblclick', onDoubleClick);
    canvas.removeEventListener('keydown', onKeyDown);

    const geometries = new Set();
    const materialSet = new Set();
    for (const scene of scenes) {
      if (scene.userData.mirror && scene.userData.mirror.getRenderTarget) {
        const target = scene.userData.mirror.getRenderTarget();
        if (target && target.dispose) target.dispose();
      }
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((m) => materialSet.add(m));
          else materialSet.add(object.material);
        }
      });
      scene.clear();
    }
    for (const geometry of geometries) geometry.dispose();
    for (const material of materialSet) {
      for (const key of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap']) {
        if (material[key] && material[key].dispose) material[key].dispose();
      }
      if (material.dispose) material.dispose();
    }
    for (const material of Object.values(materials)) {
      if (!materialSet.has(material) && material.dispose) material.dispose();
    }
    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
  }

  return { setLandmark, setAutoRotate, resetView, dispose, resize };
}

export function createUI(React) {
  h = React.createElement;
  const { useCallback, useEffect, useRef, useState, useSyncExternalStore } = React;

  function useTranslation(locale) {
    const subscribe = useCallback((callback) => locale.subscribe(callback), [locale]);
    const getRevision = useCallback(() => locale.getSnapshot().revision, [locale]);
    useSyncExternalStore(subscribe, getRevision, getRevision);
    return (key) => translate(locale, key);
  }

  function PanelBoundary({ children, fallback }) {
    return h(Boundary, { fallback }, children);
  }

  class Boundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { failed: false };
    }
    static getDerivedStateFromError() {
      return { failed: true };
    }
    componentDidCatch(error) {
      console.error('[landmarks-3d] panel error', error);
    }
    render() {
      return this.state.failed ? this.props.fallback : this.props.children;
    }
  }

  function LandmarkPanel({ locale }) {
    const t = useTranslation(locale);
    const [active, setActive] = useState(0);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    const [autoOrbit, setAutoOrbit] = useState(() => {
      if (typeof window === 'undefined' || !window.matchMedia) return true;
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    const [resetTick, setResetTick] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const rootRef = useRef(null);
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const tabRefs = useRef([]);
    const current = LANDMARKS[active];

    useEffect(() => {
      let cancelled = false;
      let engine = null;
      const timer = window.setTimeout(() => {
        try {
          engine = createEngine(THREE, canvasRef.current, {
            autoRotate,
            initialIndex: 0,
          });
          if (cancelled) {
            engine.dispose();
            return;
          }
          engineRef.current = engine;
          setReady(true);
        } catch (err) {
          console.error('[landmarks-3d] WebGL init failed', err);
          if (!cancelled) setError(true);
        }
      }, 90);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        if (engine) engine.dispose();
        engine = null;
        engineRef.current = null;
      };
      // The engine is intentionally created once; live settings apply through effects.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (ready && engineRef.current) engineRef.current.setLandmark(active);
    }, [active, ready]);

    useEffect(() => {
      if (ready && engineRef.current) engineRef.current.setAutoRotate(autoOrbit);
    }, [autoOrbit, ready]);

    useEffect(() => {
      if (ready && resetTick > 0 && engineRef.current) engineRef.current.resetView();
    }, [resetTick, ready]);

    useEffect(() => {
      const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const onTabKeyDown = (event, index) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % LANDMARKS.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + LANDMARKS.length) % LANDMARKS.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = LANDMARKS.length - 1;
      else return;
      event.preventDefault();
      setActive(next);
      const ref = tabRefs.current[next];
      if (ref) ref.focus();
    };

    const toggleFullscreen = () => {
      if (!rootRef.current) return;
      if (document.fullscreenElement === rootRef.current) {
        const request = document.exitFullscreen?.();
        if (request && request.catch) request.catch(() => {});
      } else {
        const request = rootRef.current.requestFullscreen?.();
        if (request && request.catch) request.catch(() => {});
      }
    };

    const rtl = locale.getLocale().active === 'ar';
    const themeStyle = { '--lm-accent': current.accent };

    if (error) {
      return h('div', { className: 'lm-root', ref: rootRef, dir: rtl ? 'rtl' : undefined },
        h('style', null, CSS),
        h('div', { className: 'lm-error', role: 'alert' },
          h('div', { className: 'lm-error-card' },
            h('h2', null, t('webglTitle')),
            h('p', null, t('webglBody')),
          ),
        ),
      );
    }

    return h('div', {
      className: 'lm-root',
      ref: rootRef,
      dir: rtl ? 'rtl' : undefined,
      style: themeStyle,
      'data-landmark': current.id,
    },
      h('style', null, CSS),
      h('div', { className: 'lm-stage', style: { position: 'absolute', inset: 0 } },
        h('canvas', {
          ref: canvasRef,
          className: 'lm-canvas',
          tabIndex: 0,
          role: 'img',
          'aria-label': `${t(`name_${current.id}`)} — interactive 3D model. ${t('hint')}`,
          'aria-describedby': 'lm-orbit-hint',
        }, 'Interactive 3D landmark view.'),
        h('div', { className: 'lm-vignette', 'aria-hidden': 'true' }),
        h('header', { className: 'lm-header' },
          h('div', { className: 'lm-brand' },
            h('p', { className: 'lm-eyebrow' }, t('eyebrow')),
            h('h1', { className: 'lm-title' }, t('title')),
            h('p', { className: 'lm-subtitle' }, t('subtitle')),
          ),
          h('div', { className: 'lm-live' },
            h('span', { className: 'lm-live-dot', 'aria-hidden': 'true' }),
            t('live'),
          ),
        ),
        h('section', {
          className: 'lm-info',
          key: current.id,
          id: 'lm-landmark-panel',
          role: 'tabpanel',
          'aria-labelledby': `lm-tab-${current.id}`,
        },
          h('div', { className: 'lm-info-top' },
            h('span', { className: 'lm-info-index' }, current.index),
            h('span', { className: 'lm-info-coord' }, current.coordinates),
          ),
          h('h2', { id: 'lm-landmark-name' }, t(`name_${current.id}`)),
          h('p', { className: 'lm-place' }, t(`place_${current.id}`)),
          h('p', { className: 'lm-desc' }, t(`desc_${current.id}`)),
          h('dl', { className: 'lm-facts' },
            h('div', { className: 'lm-fact' },
              h('dt', null, t('built')),
              h('dd', null, current.year),
            ),
            h('div', { className: 'lm-fact' },
              h('dt', null, t('scale')),
              h('dd', null, current.height),
            ),
            h('div', { className: 'lm-fact' },
              h('dt', null, t('material')),
              h('dd', null, t(`material_${current.id}`)),
            ),
          ),
        ),
        h('div', { className: 'lm-controls', role: 'group', 'aria-label': t('galleryLabel') },
          h('button', {
            type: 'button',
            className: 'lm-icon-btn',
            'aria-label': t('autoOrbit'),
            'aria-pressed': autoOrbit,
            title: t('autoOrbit'),
            onClick: () => setAutoOrbit((v) => !v),
          }, h(OrbitIcon)),
          h('button', {
            type: 'button',
            className: 'lm-icon-btn',
            'aria-label': t('resetView'),
            title: t('resetView'),
            onClick: () => setResetTick((v) => v + 1),
          }, h(ResetIcon)),
          h('button', {
            type: 'button',
            className: 'lm-icon-btn',
            'aria-label': fullscreen ? t('exitFullscreen') : t('fullscreen'),
            'aria-pressed': fullscreen,
            title: fullscreen ? t('exitFullscreen') : t('fullscreen'),
            onClick: toggleFullscreen,
          }, h(FullscreenIcon, { active: fullscreen })),
        ),
        h('p', { className: 'lm-hint', id: 'lm-orbit-hint' }, t('hint')),
        h('nav', {
          className: 'lm-tabs',
          role: 'tablist',
          'aria-label': t('galleryLabel'),
          'aria-orientation': 'horizontal',
        }, LANDMARKS.map((landmark, index) => h('button', {
          key: landmark.id,
          ref: (node) => { tabRefs.current[index] = node; },
          type: 'button',
          role: 'tab',
          id: `lm-tab-${landmark.id}`,
          'aria-selected': active === index,
          'aria-controls': 'lm-landmark-panel',
          tabIndex: active === index ? 0 : -1,
          className: 'lm-tab',
          onClick: () => setActive(index),
          onKeyDown: (event) => onTabKeyDown(event, index),
        },
          h('span', { className: 'lm-tab-num' }, landmark.index),
          h('span', { className: 'lm-tab-name' }, t(`name_${landmark.id}`)),
          h('span', { className: 'lm-tab-place' }, t(`place_${landmark.id}`)),
        ))),
        h('div', { className: `lm-loading${ready ? ' is-hidden' : ''}`, role: 'status', 'aria-live': 'polite' },
          h('div', { className: 'lm-loading-inner' },
            h('div', { className: 'lm-loader', 'aria-hidden': 'true' }),
            h('span', { className: 'lm-loading-text' }, t('loading')),
          ),
        ),
        h('p', { className: 'lm-sr', 'aria-live': 'polite' }, `${t('nowViewing')}: ${t(`name_${current.id}`)}`),
      ),
    );
  }

  function SafePanel(props) {
    return h(PanelBoundary, {
      fallback: h('div', { className: 'lm-root' },
        h('style', null, CSS),
        h('div', { className: 'lm-error', role: 'alert' },
          h('div', { className: 'lm-error-card' },
            h('h2', null, 'Landmark Atlas'),
            h('p', null, 'The 3D view could not be loaded. Try reopening the panel.'),
          ),
        ),
      ),
    }, h(LandmarkPanel, props));
  }

  return {
    inject: ['slots', 'locale'],
    apply(ctx) {
      ctx.effect(() => {
        const disposers = [
          ctx.locale.register('landmarksAtlas', 'en', EN),
          ctx.locale.register('landmarksAtlas', 'zh', ZH),
          ctx.locale.register('landmarksAtlas', 'ar', AR),
        ];
        return () => {
          for (const dispose of disposers) dispose();
        };
      });

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'landmarks-3d',
        order: 20,
        label: () => translate(ctx.locale, 'navLabel'),
      }, SidebarIcon));

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: 'landmarks-3d',
      }, (props) => h(SafePanel, { ...props, locale: ctx.locale })));
    },
  };
}
