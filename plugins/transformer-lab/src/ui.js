import * as THREE from 'three';
import { createTransformerScene } from './scene.js';
import { EN, AR, ZH } from './dict.js';
import { PROMPTS, buildModel } from './math.js';
import { CSS } from './styles.js';

const DICTS = { en: EN, ar: AR, zh: ZH };
const FORMULAS = [
  'text → [t₀, t₁, t₂, t₃, t₄] → token IDs',
  'xᵢ = E[tokenᵢ] + P[i]',
  'Attention(Q,K,V) = softmax(QKᵀ / √d) · V',
  'headₕ = Attention(QWqₕ, KWkₕ, VWvₕ)',
  'FFN(x) = W₂ · GELU(W₁x + b₁) + b₂',
  'p(next) = softmax(W · h_last)',
];

let h = null;

function translate(locale, key) {
  const active = locale.getLocale().active;
  const dict = DICTS[active] || EN;
  return dict[key] == null ? EN[key] : dict[key];
}

function format(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
    values[key] == null ? match : values[key],
  );
}

export function createUI(React) {
  h = React.createElement;
  const { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } = React;

  function useTranslation(locale) {
    const subscribe = useCallback((callback) => locale.subscribe(callback), [locale]);
    const getRevision = useCallback(() => locale.getSnapshot().revision, [locale]);
    useSyncExternalStore(subscribe, getRevision, getRevision);
    return useCallback((key) => translate(locale, key), [locale]);
  }

  // ------------------------------------------------------------------ icons
  const Icon = ({ children }) => h('span', { className: 'tl-icon', 'aria-hidden': 'true' }, children);
  const PrevIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M14.5 5.5 8 12l6.5 6.5', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' })));
  const NextIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M9.5 5.5 16 12l-6.5 6.5', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' })));
  const PlayIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M8 5.6 18 12 8 18.4Z', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' })));
  const PauseIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M9 5.5v13M15 5.5v13', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' })));
  const OrbitIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('ellipse', { cx: 12, cy: 12, rx: 8, ry: 3.4, stroke: 'currentColor', strokeWidth: 1.4, opacity: 0.75 }),
      h('circle', { cx: 12, cy: 12, r: 2.2, stroke: 'currentColor', strokeWidth: 1.4 }),
      h('path', { d: 'M19.3 9.4c.7 1.1.9 2.4.5 3.8M4.5 14.8c-.6-1.2-.7-2.5-.3-3.8', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' })));
  const ResetIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M5.4 8.2A7.4 7.4 0 1 1 4.6 12', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
      h('path', { d: 'M5.5 4.6v3.9h3.9', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })));
  const FullscreenIcon = ({ active }) => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      active
        ? h('path', { d: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' })
        : h('path', { d: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' })));
  const NewIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M12 5v14M5 12h14', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' })));
  const RestartIcon = () => h(Icon, null,
    h('svg', { viewBox: '0 0 24 24', fill: 'none' },
      h('path', { d: 'M4.8 9.2A7.6 7.6 0 1 1 4.4 13', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
      h('path', { d: 'M4.7 4.9v4.6h4.6', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' })));
  const SidebarIcon = ({ size = 20, active = false }) => h('svg', {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    className: 'tl-nav-icon',
    'aria-hidden': 'true',
    style: { color: 'currentColor', opacity: active ? 1 : 0.92 },
  },
    h('path', { d: 'M12 2.8 21 7.4 12 12 3 7.4Z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' }),
    h('path', { d: 'M12 8 21 12.6 12 17.2 3 12.6Z', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round', opacity: 0.85 }),
    h('path', { d: 'M12 13.2 21 17.8 12 22.4 3 17.8Z', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round', opacity: 0.7 }),
    h('path', { d: 'M5.4 12.9c1.6-2.2 3.4-2.2 5.1 0M13.5 12.9c1.7-2.2 3.5-2.2 5.1 0', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round', opacity: 0.65 }));

  // ------------------------------------------------------------------ boundary
  class Boundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { failed: false };
    }
    static getDerivedStateFromError() {
      return { failed: true };
    }
    componentDidCatch(error) {
      console.error('[transformer-lab] panel error', error);
    }
    render() {
      return this.state.failed ? this.props.fallback : this.props.children;
    }
  }

  function PanelBoundary({ children, fallback }) {
    return h(Boundary, { fallback }, children);
  }

  // ------------------------------------------------------------------ panel
  function TransformerPanel({ locale }) {
    const t = useTranslation(locale);
    const [promptIndex, setPromptIndex] = useState(0);
    const [stage, setStage] = useState(0);
    const [query, setQuery] = useState(PROMPTS[0].queryDefault);
    const [head, setHead] = useState(0);
    const [picked, setPicked] = useState(null);
    const [score, setScore] = useState({ right: 0, attempts: 0 });
    const [playing, setPlaying] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    const [inset, setInset] = useState({ top: 0, left: 0 });
    const reducedMotion = useMemo(
      () => typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
      [],
    );
    const [autoOrbit, setAutoOrbit] = useState(!reducedMotion);

    const prompt = PROMPTS[promptIndex];
    const model = useMemo(() => buildModel(prompt), [prompt]);
    const active = locale.getLocale().active;
    const rtl = active === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');

    const rootRef = useRef(null);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const callbacksRef = useRef({ token: () => {}, pick: () => {} });
    const dataRef = useRef({ model, prompt, stage, query, head, picked, autoOrbit });

    dataRef.current = { model, prompt, stage, query, head, picked, autoOrbit };

    const stageNames = t('stageNames');
    const stageTitles = t('stageTitles');
    const stageBodies = t('stageBodies');
    const notices = t('notices');
    const heads = t('heads');
    const weights = model.heads[head].weights;
    const row = weights[query] || [];
    const topCandidate = prompt.candidates[prompt.correct];

    // ---------------------------------------------------------------- scene lifecycle
    useEffect(() => {
      let cancelled = false;
      let scene = null;
      const timer = window.setTimeout(() => {
        const snapshot = dataRef.current;
        try {
          scene = createTransformerScene(THREE, canvasRef.current, {
            reducedMotion,
            autoOrbit: snapshot.autoOrbit,
            onSelectToken: (index) => callbacksRef.current.token(index),
            onPickBar: (index) => callbacksRef.current.pick(index),
          });
          if (cancelled) {
            scene.dispose();
            return;
          }
          sceneRef.current = scene;
          scene.setData(snapshot.model, snapshot.prompt);
          scene.setStage(snapshot.stage);
          scene.setAttention(snapshot.query, snapshot.head, snapshot.model.heads[snapshot.head].weights);
          scene.setPrediction(snapshot.picked, snapshot.prompt.correct);
          setReady(true);
        } catch (err) {
          console.error('[transformer-lab] WebGL init failed', err);
          if (!cancelled) setError(true);
        }
      }, 90);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        if (scene) scene.dispose();
        scene = null;
        sceneRef.current = null;
      };
      // The scene is created once; subsequent state flows through the effects below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!ready) return;
      sceneRef.current?.setData(model, prompt);
    }, [model, prompt, ready]);

    useEffect(() => {
      if (!ready) return;
      sceneRef.current?.setStage(stage);
    }, [stage, ready]);

    useEffect(() => {
      if (!ready) return;
      sceneRef.current?.setAttention(query, head, model.heads[head].weights);
    }, [query, head, model, ready]);

    useEffect(() => {
      if (!ready) return;
      sceneRef.current?.setPrediction(picked, prompt.correct);
    }, [picked, prompt, ready]);

    useEffect(() => {
      sceneRef.current?.setAutoOrbit(autoOrbit);
    }, [autoOrbit, ready]);

    // ---------------------------------------------------------------- titlebar safe area
    useEffect(() => {
      const ua = navigator.userAgent || '';
      const isMac = /Macintosh|Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua);
      if (!isMac) return;
      const update = () => {
        const element = rootRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const nearTop = rect.top < 34 && !document.fullscreenElement;
        const top = nearTop ? 42 : 0;
        const left = nearTop && !rtl && rect.left < 78
          ? Math.ceil(78 - rect.left)
          : 0;
        setInset((previous) => (previous.top === top && previous.left === left ? previous : { top, left }));
      };
      update();
      const observer = new ResizeObserver(update);
      if (rootRef.current) observer.observe(rootRef.current);
      window.addEventListener('resize', update);
      document.addEventListener('fullscreenchange', update);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', update);
        document.removeEventListener('fullscreenchange', update);
      };
    }, [rtl]);

    // ---------------------------------------------------------------- auto run
    useEffect(() => {
      if (!playing) return undefined;
      if (stage >= 5) {
        setPlaying(false);
        return undefined;
      }
      const timer = window.setTimeout(() => setStage((value) => Math.min(5, value + 1)), 5200);
      return () => window.clearTimeout(timer);
    }, [playing, stage]);

    // ---------------------------------------------------------------- fullscreen
    useEffect(() => {
      const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // ---------------------------------------------------------------- keyboard
    useEffect(() => {
      const onKey = (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const target = event.target;
        if (target === canvasRef.current) return;
        const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
        if (target?.closest?.('button, a, select, [role="button"]')) return;
        if (event.code === 'Space') {
          event.preventDefault();
          setStage((value) => Math.min(5, value + 1));
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          setStage((value) => Math.min(5, value + 1));
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setStage((value) => Math.max(0, value - 1));
        } else if (event.key === 'r' || event.key === 'R') {
          sceneRef.current?.resetView();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ---------------------------------------------------------------- callbacks
    const selectToken = useCallback((index) => {
      setQuery(index);
      setStage((value) => Math.max(value, 2));
    }, []);

    const pickCandidate = useCallback((index) => {
      if (picked != null) return;
      setPicked(index);
      setScore((value) => ({
        right: value.right + (index === prompt.correct ? 1 : 0),
        attempts: value.attempts + 1,
      }));
    }, [picked, prompt.correct]);

    callbacksRef.current.token = selectToken;
    callbacksRef.current.pick = pickCandidate;

    const nextPrompt = useCallback(() => {
      const nextIndex = (promptIndex + 1) % PROMPTS.length;
      setPromptIndex(nextIndex);
      setQuery(PROMPTS[nextIndex].queryDefault);
      setStage(0);
      setPicked(null);
      setPlaying(false);
      setHead(0);
    }, [promptIndex]);

    const restart = useCallback(() => {
      setPromptIndex(0);
      setQuery(PROMPTS[0].queryDefault);
      setStage(0);
      setPicked(null);
      setPlaying(false);
      setHead(0);
      setScore({ right: 0, attempts: 0 });
      sceneRef.current?.resetView();
    }, []);

    const toggleFullscreen = useCallback(() => {
      const element = rootRef.current;
      if (!element) return;
      if (!document.fullscreenElement) {
        element.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }, []);

    // ---------------------------------------------------------------- inspector
    const keyRows = row.map((weight, index) => h('div', {
      className: 'tl-key-row',
      key: `key-${index}`,
    },
      h('span', { className: 'tl-key-name' }, `${index === query ? '▸ ' : ''}${model.tokens[index]}`),
      h('span', { className: 'tl-key-track' },
        h('span', { className: 'tl-key-fill', style: { width: `${Math.max(2, weight * 100).toFixed(1)}%` } })),
      h('span', { className: 'tl-key-pct' }, `${Math.round(weight * 100)}%`),
    ));

    let inspector = null;
    if (stage === 5) {
      inspector = h('aside', { className: 'tl-card tl-inspector', 'aria-labelledby': 'tl-game-title' },
        h('div', { className: 'tl-inspector-head' },
          h('h2', { className: 'tl-inspector-title', id: 'tl-game-title' }, t('gameTitle')),
          h('span', { className: 'tl-score' }, `${score.right} / ${score.attempts}`),
        ),
        h('p', { className: 'tl-note' }, picked == null ? t('pickHint') : t('resultNote')),
        h('div', { className: 'tl-candidates' },
          prompt.candidates.map((candidate, index) => {
            const isPicked = picked === index;
            const isCorrect = index === prompt.correct;
            const className = picked == null
              ? 'tl-candidate'
              : `tl-candidate${isCorrect ? ' is-right' : isPicked ? ' is-wrong' : ''}`;
            return h('button', {
              type: 'button',
              className,
              key: candidate.token,
              disabled: picked != null,
              onClick: () => pickCandidate(index),
              'aria-label': picked == null ? candidate.token : `${candidate.token}, ${Math.round(candidate.p * 100)}%`,
            },
              h('strong', null, candidate.token),
              h('span', null, picked == null ? '?' : `${Math.round(candidate.p * 100)}%`),
            );
          }),
        ),
        picked != null ? h('p', {
          className: `tl-result ${picked === prompt.correct ? 'is-good' : 'is-bad'}`,
          role: 'status',
        },
          picked === prompt.correct ? t('resultGood') : t('resultBad'),
          ' ',
          format(t('reveal'), { token: topCandidate.token, pct: Math.round(topCandidate.p * 100) }),
        ) : null,
        h('button', { type: 'button', className: 'tl-btn tl-wide', onClick: nextPrompt },
          h(NewIcon), h('span', { className: 'tl-btn-label' }, t('nextSentence'))),
      );
    } else if (stage >= 2) {
      inspector = h('aside', { className: 'tl-card tl-inspector', 'aria-labelledby': 'tl-attn-title' },
        h('div', { className: 'tl-inspector-head' },
          h('h2', { className: 'tl-inspector-title', id: 'tl-attn-title' }, t('attention')),
          h('span', { className: 'tl-step' }, heads[head]),
        ),
        h('div', { className: 'tl-query' },
          h('small', null, t('query')),
          h('strong', null, model.tokens[query]),
        ),
        h('div', { className: 'tl-heads', role: 'group', 'aria-label': t('attention') },
          heads.map((label, index) => h('button', {
            type: 'button',
            key: label,
            className: `tl-head-btn${head === index ? ' is-active' : ''}`,
            'aria-pressed': head === index,
            onClick: () => setHead(index),
          }, label)),
        ),
        h('div', { className: 'tl-keys', 'aria-label': t('keyWeights') }, keyRows),
        h('p', { className: 'tl-note' }, t('attentionNote')),
        h('div', { className: 'tl-token-list', role: 'group', 'aria-label': t('tokenList') },
          model.tokens.map((token, index) => h('button', {
            type: 'button',
            key: `${token}-${index}`,
            className: `tl-token-btn${query === index ? ' is-active' : ''}`,
            onClick: () => selectToken(index),
          }, token)),
        ),
        h('p', { className: 'tl-note' }, t('headHint')),
      );
    } else {
      inspector = h('aside', { className: 'tl-card tl-inspector', 'aria-labelledby': 'tl-data-title' },
        h('div', { className: 'tl-inspector-head' },
          h('h2', { className: 'tl-inspector-title', id: 'tl-data-title' }, stageNames[stage]),
          h('span', { className: 'tl-step' }, `${stage + 1} / 6`),
        ),
        h('div', { className: 'tl-token-list' },
          model.tokens.map((token, index) => h('span', {
            key: `${token}-${index}`,
            className: 'tl-token-btn',
            style: { cursor: 'default' },
          }, `${index} · ${token}`)),
        ),
        h('p', { className: 'tl-note' }, format(t('positions'), { n: model.tokens.length - 1 })),
        h('p', { className: 'tl-note' }, stage === 1 ? t('embeddingNote') : t('hiddenNote')),
      );
    }

    // ---------------------------------------------------------------- render
    return h('div', {
      className: 'tl-root',
      ref: rootRef,
      dir: rtl ? 'rtl' : 'ltr',
      lang: active,
      style: {
        '--tl-safe-top': `${inset.top}px`,
        '--tl-safe-left': `${inset.left}px`,
      },
    },
      h('canvas', {
        ref: canvasRef,
        className: 'tl-canvas',
        tabIndex: 0,
        role: 'application',
        'aria-label': t('canvasLabel'),
        'aria-describedby': 'tl-scene-help',
        onDoubleClick: () => sceneRef.current?.resetView(),
      }),
      h('div', { className: 'tl-vignette', 'aria-hidden': 'true' }),

      h('div', { className: 'tl-hud' },
        h('header', { className: 'tl-top' },
          h('div', { className: 'tl-titleblock' },
            h('p', { className: 'tl-eyebrow' }, t('eyebrow')),
            h('h1', { className: 'tl-title' }, t('title')),
            h('p', { className: 'tl-subtitle' }, t('subtitle')),
          ),
          h('div', { className: 'tl-status' },
            h('span', { className: 'tl-step' }, `${t('step')} ${stage + 1} / 6`),
            h('span', { className: 'tl-score' }, `${t('score')} · ${format(t('scoreValue'), { right: score.right, attempts: score.attempts })}`),
          ),
        ),

        h('div', { className: 'tl-mid' },
          h('div', { className: 'tl-side tl-side-left' },
            h('article', { className: 'tl-card tl-stagecard' },
              h('div', { className: 'tl-stage-head' },
                h('span', { className: 'tl-chip' }, String(stage + 1).padStart(2, '0')),
                h('h2', { className: 'tl-stage-title' }, stageTitles[stage]),
              ),
              h('p', { className: 'tl-stage-body' }, stageBodies[stage]),
              h('p', { className: 'tl-formula' }, FORMULAS[stage]),
              h('p', { className: 'tl-notice' },
                h('span', { 'aria-hidden': 'true' }, '▸'),
                notices[stage],
              ),
              h('nav', { className: 'tl-rail', 'aria-label': t('railLabel') },
                stageNames.map((name, index) => h('button', {
                  type: 'button',
                  key: name,
                  className: `tl-rail-btn${index === stage ? ' is-current' : ''}${index < stage ? ' is-done' : ''}`,
                  'aria-current': index === stage ? 'step' : undefined,
                  onClick: () => setStage(index),
                },
                  h('span', { className: 'tl-rail-num' }, String(index + 1).padStart(2, '0')),
                  h('span', { className: 'tl-rail-name' }, name),
                )),
              ),
            ),
          ),
          h('div', { className: 'tl-side tl-side-right' }, inspector),
        ),

        h('div', { className: 'tl-bottom' },
          h('p', { className: 'tl-hint', id: 'tl-scene-help' }, t('hint')),
          h('div', { className: 'tl-dock', role: 'toolbar', 'aria-label': t('railLabel') },
            h('button', {
              type: 'button',
              className: 'tl-btn',
              onClick: () => setStage((value) => Math.max(0, value - 1)),
              disabled: stage === 0,
              title: t('back'),
            }, h(PrevIcon), h('span', { className: 'tl-btn-label' }, t('back'))),
            h('button', {
              type: 'button',
              className: 'tl-btn is-primary',
              onClick: () => setPlaying((value) => !value),
              'aria-pressed': playing,
              title: playing ? t('pause') : t('play'),
            }, playing ? h(PauseIcon) : h(PlayIcon), h('span', { className: 'tl-btn-label' }, playing ? t('pause') : t('play'))),
            h('button', {
              type: 'button',
              className: 'tl-btn',
              onClick: () => setStage((value) => Math.min(5, value + 1)),
              disabled: stage === 5,
              title: t('next'),
            }, h('span', { className: 'tl-btn-label' }, t('next')), h(NextIcon)),
            h('span', { className: 'tl-divider', 'aria-hidden': 'true' }),
            h('button', { type: 'button', className: 'tl-btn', onClick: nextPrompt, title: t('nextSentence') },
              h(NewIcon), h('span', { className: 'tl-btn-label' }, t('nextSentence'))),
            h('button', {
              type: 'button',
              className: `tl-btn${autoOrbit ? ' is-on' : ''}`,
              onClick: () => setAutoOrbit((value) => !value),
              'aria-pressed': autoOrbit,
              title: t('orbit'),
            }, h(OrbitIcon), h('span', { className: 'tl-btn-label' }, t('orbit'))),
            h('button', {
              type: 'button',
              className: 'tl-btn',
              onClick: () => sceneRef.current?.resetView(),
              title: t('resetView'),
            }, h(ResetIcon), h('span', { className: 'tl-btn-label' }, t('resetView'))),
            h('button', {
              type: 'button',
              className: 'tl-btn',
              onClick: toggleFullscreen,
              title: fullscreen ? t('exitFullscreen') : t('fullscreen'),
            }, h(FullscreenIcon, { active: fullscreen }), h('span', { className: 'tl-btn-label' }, fullscreen ? t('exitFullscreen') : t('fullscreen'))),
            h('button', { type: 'button', className: 'tl-btn', onClick: restart, title: t('restart') },
              h(RestartIcon), h('span', { className: 'tl-btn-label' }, t('restart'))),
          ),
        ),
      ),

      h('div', { className: `tl-loading${ready ? ' is-hidden' : ''}`, role: 'status', 'aria-live': 'polite' },
        h('div', { className: 'tl-loading-inner' },
          h('div', { className: 'tl-loader', 'aria-hidden': 'true' }),
          h('span', { className: 'tl-loading-text' }, t('loading')),
        ),
      ),

      error ? h('div', { className: 'tl-error', role: 'alert' },
        h('div', { className: 'tl-error-card' },
          h('h2', null, t('errorTitle')),
          h('p', null, t('errorBody')),
        ),
      ) : null,

      h('p', { className: 'tl-sr', 'aria-live': 'polite' },
        picked != null
          ? `${picked === prompt.correct ? t('resultGood') : t('resultBad')} ${format(t('reveal'), { token: topCandidate.token, pct: Math.round(topCandidate.p * 100) })}`
          : `${stage + 1} / 6 · ${stageTitles[stage]}`,
      ),
    );
  }

  function SafePanel(props) {
    return h(PanelBoundary, {
      fallback: h('div', { className: 'tl-root' },
        h('style', null, CSS),
        h('div', { className: 'tl-error', role: 'alert' },
          h('div', { className: 'tl-error-card' },
            h('h2', null, 'Transformer Lab'),
            h('p', null, 'The 3D panel could not be loaded. Try reopening the panel.'),
          ),
        ),
      ),
    }, h(TransformerPanel, props));
  }

  return {
    inject: ['slots', 'locale'],
    apply(ctx) {
      ctx.effect(() => {
        const disposers = [
          ctx.locale.register('transformerLab', 'en', EN),
          ctx.locale.register('transformerLab', 'ar', AR),
          ctx.locale.register('transformerLab', 'zh', ZH),
        ];
        return () => {
          for (const dispose of disposers) dispose();
        };
      });

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'transformer-lab',
        order: 30,
        label: () => translate(ctx.locale, 'navLabel'),
      }, SidebarIcon));

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: 'transformer-lab',
      }, (props) => h(SafePanel, { ...props, locale: ctx.locale })));
    },
  };
}
