window.__ModuleLoader__.load({
  id: '@local/style-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const useSyncExternalStore = React.useSyncExternalStore || function (subscribe, get) {
      const [value, setValue] = React.useState(get);
      React.useEffect(function () {
        return subscribe(function () { setValue(get()); });
      }, [subscribe, get]);
      return value;
    };

    const ATTR = 'data-style-studio';
    const STORAGE_KEY = 'style-studio:selected';

    const DICT_EN = {
      navLabel: 'Style Studio',
      eyebrow: 'Appearance · Interface styles',
      title: 'Choose the look of your workspace',
      subtitle: 'Five complete interface styles recolor the entire app, adjust its typography, and change how surfaces feel. Every change applies instantly and is remembered on this device.',
      currentLabel: 'Current look',
      systemName: 'System default',
      reset: 'Use system default',
      footer: 'Styles are applied across the whole app, including sidebars, dialogs, and the composer. Press Tab to move between styles and Enter to apply.',
      auroraName: 'Midnight Aurora',
      auroraDesc: 'Deep navy surfaces with a cool periwinkle accent and softly lit edges. Calm, focused, and built for long sessions.',
      pixelName: 'Pixel Arcade',
      pixelDesc: 'A hard-edged pixelated theme: square corners, blocky monospace type, crisp pixel images, and a subtle CRT grid.',
      paperName: 'Paper Atelier',
      paperDesc: 'Warm cream paper, ink-brown text, terracotta accents, and a literary serif voice for a calmer, editorial feel.',
      terminalName: 'Amber Terminal',
      terminalDesc: 'Phosphor amber on near black, monospace everywhere, and tight mechanical corners. A classic operator console.',
      candyName: 'Candy Pop',
      candyDesc: 'Bright magenta accents, lilac surfaces, pill-shaped controls, and a rounded friendly voice.',
      tagDark: 'Dark',
      tagLight: 'Light',
      tagCalm: 'Calm',
      tagPixel: 'Pixelated',
      tagSerif: 'Serif',
      tagMono: 'Monospace',
      tagPlayful: 'Playful'
    };

    const DICT_AR = {
      navLabel: 'استوديو الأنماط',
      eyebrow: 'المظهر · أنماط الواجهة',
      title: 'اختر مظهر مساحة عملك',
      subtitle: 'خمسة أنماط كاملة تعيد تلوين التطبيق بالكامل وتغيّر الخطوط وإحساس الأسطح. يُطبَّق كل تغيير فورًا ويُحفظ على هذا الجهاز.',
      currentLabel: 'المظهر الحالي',
      systemName: 'الافتراضي للنظام',
      reset: 'استخدم افتراضي النظام',
      footer: 'تُطبَّق الأنماط على التطبيق كله، بما في ذلك الأشرطة الجانبية والنوافذ ومربع الكتابة. استخدم Tab للتنقل بين الأنماط وEnter للتطبيق.',
      auroraName: 'شفق منتصف الليل',
      auroraDesc: 'أسطح كحلية عميقة مع لمسة بنفسجية باردة وحواف مضيئة بهدوء. مظهر رصين ومريح للجلسات الطويلة.',
      pixelName: 'أركيد البكسل',
      pixelDesc: 'نمط بكسل حاد الحواف: زوايا مربعة وخط أحادي عريض وصور بكسل واضحة وشبكة شاشة خفيفة.',
      paperName: 'مرسم الورق',
      paperDesc: 'ورق كريمي دافئ، حبر بني، لمسات طينية، وخط سيريف أدبي يمنح الواجهة إحساسًا تحريريًا هادئًا.',
      terminalName: 'طرفية العنبر',
      terminalDesc: 'عنبر مضيء على أسود عميق، خط أحادي في كل مكان، وزوايا ميكانيكية ضيقة. لوحة تحكم كلاسيكية.',
      candyName: 'حلوى ملونة',
      candyDesc: 'لمسات أرجوانية زاهية وأسطح ليلكية وأزرار كبسولية وصوت بصري مرح ومستدير.',
      tagDark: 'داكن',
      tagLight: 'فاتح',
      tagCalm: 'هادئ',
      tagPixel: 'بكسل',
      tagSerif: 'سيريف',
      tagMono: 'أحادي',
      tagPlayful: 'مرح'
    };

    const DICT_ZH = {
      navLabel: '风格工作室',
      eyebrow: '外观 · 界面风格',
      title: '选择工作区的外观',
      subtitle: '五种完整界面风格会重新着色整个应用、调整字体并改变表面的质感。所有更改即时生效，并保存在此设备。',
      currentLabel: '当前外观',
      systemName: '系统默认',
      reset: '恢复系统默认',
      footer: '风格会应用于整个应用，包括侧边栏、对话框和输入框。使用 Tab 切换风格，按 Enter 应用。',
      auroraName: '午夜极光',
      auroraDesc: '深海军蓝表面、冷调长春花紫点缀与柔和发光边缘。沉静、专注，适合长时间使用。',
      pixelName: '像素街机',
      pixelDesc: '硬朗的像素主题：直角、粗犷的等宽字体、清晰的像素图像与细微的 CRT 网格。',
      paperName: '纸上工作室',
      paperDesc: '暖奶油纸张、墨棕文字、陶土色点缀与文学感衬线字体，带来平静的编辑气质。',
      terminalName: '琥珀终端',
      terminalDesc: '近黑底色上的荧光琥珀、全局等宽字体与紧凑的机械直角。经典操作台风格。',
      candyName: '糖果汽水',
      candyDesc: '明亮的洋红点缀、浅紫表面、胶囊形控件与圆润友好的视觉语气。',
      tagDark: '深色',
      tagLight: '浅色',
      tagCalm: '沉静',
      tagPixel: '像素',
      tagSerif: '衬线',
      tagMono: '等宽',
      tagPlayful: '活泼'
    };

    const THEMES = [
      {
        key: 'aurora',
        id: 'style-studio-aurora',
        colorScheme: 'dark',
        nameKey: 'auroraName',
        descKey: 'auroraDesc',
        tags: ['tagDark', 'tagCalm'],
        preview: { bg: '#0a0f1c', panel: '#111a2e', accent: '#7c9cff', text: '#eef3ff', sub: '#9fb0d0' },
        tokens: {
          '--dsw-alias-bg-base': '#0a0f1c',
          '--dsw-alias-bg-layer-1': '#111a2e',
          '--dsw-alias-bg-layer-2': '#16213a',
          '--dsw-alias-bg-overlay': '#0d1526',
          '--dsw-alias-border-l1': '#24314d',
          '--dsw-alias-border-l2': '#3a4d72',
          '--dsw-alias-brand-primary': '#7c9cff',
          '--dsw-alias-label-primary': '#eef3ff',
          '--dsw-alias-label-secondary': '#9fb0d0',
          '--dsw-alias-state-error-primary': '#ff7a8a',
          '--dsw-alias-state-idle-primary': '#7d8aa5',
          '--dsw-alias-state-success-primary': '#5fe0b0',
          '--dsw-alias-state-warn-primary': '#ffc46b',
          '--dsw-specific-sidebar-fill': '#0b1220'
        }
      },
      {
        key: 'pixel',
        id: 'style-studio-pixel',
        colorScheme: 'dark',
        nameKey: 'pixelName',
        descKey: 'pixelDesc',
        tags: ['tagDark', 'tagPixel'],
        preview: { bg: '#0b0b14', panel: '#141426', accent: '#39f5c8', text: '#f4f0ff', sub: '#a99fd1' },
        tokens: {
          '--dsw-alias-bg-base': '#0b0b14',
          '--dsw-alias-bg-layer-1': '#141426',
          '--dsw-alias-bg-layer-2': '#1c1c33',
          '--dsw-alias-bg-overlay': '#10101f',
          '--dsw-alias-border-l1': '#34345c',
          '--dsw-alias-border-l2': '#56568f',
          '--dsw-alias-brand-primary': '#39f5c8',
          '--dsw-alias-label-primary': '#f4f0ff',
          '--dsw-alias-label-secondary': '#a99fd1',
          '--dsw-alias-state-error-primary': '#ff5c8a',
          '--dsw-alias-state-idle-primary': '#6d6a8f',
          '--dsw-alias-state-success-primary': '#5cff9d',
          '--dsw-alias-state-warn-primary': '#ffd166',
          '--dsw-specific-sidebar-fill': '#0d0d1c'
        }
      },
      {
        key: 'paper',
        id: 'style-studio-paper',
        colorScheme: 'light',
        nameKey: 'paperName',
        descKey: 'paperDesc',
        tags: ['tagLight', 'tagSerif'],
        preview: { bg: '#f4ede1', panel: '#fbf7ef', accent: '#a34a2a', text: '#2a2118', sub: '#6b5b4a' },
        tokens: {
          '--dsw-alias-bg-base': '#f4ede1',
          '--dsw-alias-bg-layer-1': '#fbf7ef',
          '--dsw-alias-bg-layer-2': '#efe5d5',
          '--dsw-alias-bg-overlay': '#fffdf8',
          '--dsw-alias-border-l1': '#d9cbb7',
          '--dsw-alias-border-l2': '#b9a78e',
          '--dsw-alias-brand-primary': '#a34a2a',
          '--dsw-alias-label-primary': '#2a2118',
          '--dsw-alias-label-secondary': '#6b5b4a',
          '--dsw-alias-state-error-primary': '#b3261e',
          '--dsw-alias-state-idle-primary': '#8c7b67',
          '--dsw-alias-state-success-primary': '#3d6b43',
          '--dsw-alias-state-warn-primary': '#8a5a00',
          '--dsw-specific-sidebar-fill': '#efe6d8'
        }
      },
      {
        key: 'terminal',
        id: 'style-studio-terminal',
        colorScheme: 'dark',
        nameKey: 'terminalName',
        descKey: 'terminalDesc',
        tags: ['tagDark', 'tagMono'],
        preview: { bg: '#070604', panel: '#110e08', accent: '#ffc247', text: '#ffe7b3', sub: '#b99b62' },
        tokens: {
          '--dsw-alias-bg-base': '#070604',
          '--dsw-alias-bg-layer-1': '#110e08',
          '--dsw-alias-bg-layer-2': '#1a150c',
          '--dsw-alias-bg-overlay': '#0c0a06',
          '--dsw-alias-border-l1': '#3a2f18',
          '--dsw-alias-border-l2': '#5c4b27',
          '--dsw-alias-brand-primary': '#ffc247',
          '--dsw-alias-label-primary': '#ffe7b3',
          '--dsw-alias-label-secondary': '#b99b62',
          '--dsw-alias-state-error-primary': '#ff6b6b',
          '--dsw-alias-state-idle-primary': '#7a6336',
          '--dsw-alias-state-success-primary': '#74e08a',
          '--dsw-alias-state-warn-primary': '#ffd166',
          '--dsw-specific-sidebar-fill': '#090704'
        }
      },
      {
        key: 'candy',
        id: 'style-studio-candy',
        colorScheme: 'light',
        nameKey: 'candyName',
        descKey: 'candyDesc',
        tags: ['tagLight', 'tagPlayful'],
        preview: { bg: '#fdf3fb', panel: '#ffffff', accent: '#b21a91', text: '#2b1630', sub: '#75517f' },
        tokens: {
          '--dsw-alias-bg-base': '#fdf3fb',
          '--dsw-alias-bg-layer-1': '#ffffff',
          '--dsw-alias-bg-layer-2': '#f7ebff',
          '--dsw-alias-bg-overlay': '#ffffff',
          '--dsw-alias-border-l1': '#ecd3f2',
          '--dsw-alias-border-l2': '#d8b0e8',
          '--dsw-alias-brand-primary': '#b21a91',
          '--dsw-alias-label-primary': '#2b1630',
          '--dsw-alias-label-secondary': '#75517f',
          '--dsw-alias-state-error-primary': '#d7263d',
          '--dsw-alias-state-idle-primary': '#9a7ba4',
          '--dsw-alias-state-success-primary': '#178f6b',
          '--dsw-alias-state-warn-primary': '#a65b00',
          '--dsw-specific-sidebar-fill': '#fbeefb'
        }
      }
    ];

    const GLOBAL_CSS = [
      'html[data-style-studio] body { transition: background-color .22s ease, color .22s ease; }',
      'html[data-style-studio="aurora"] body { --dsw-font-family: "Avenir Next", "Segoe UI", system-ui, -apple-system, sans-serif; font-family: var(--dsw-font-family); }',
      'html[data-style-studio="aurora"] ::selection { background: rgba(124, 156, 255, .34); }',
      'html[data-style-studio="paper"] body { --dsw-font-family: ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif; font-family: var(--dsw-font-family); }',
      'html[data-style-studio="paper"] button, html[data-style-studio="paper"] input, html[data-style-studio="paper"] textarea, html[data-style-studio="paper"] select { font-family: var(--dsw-font-family); }',
      'html[data-style-studio="paper"] ::selection { background: rgba(163, 74, 42, .24); }',
      'html[data-style-studio="candy"] body { --dsw-font-family: "Trebuchet MS", "Avenir Next", "Segoe UI", system-ui, sans-serif; font-family: var(--dsw-font-family); }',
      'html[data-style-studio="candy"] button:not(.ss-card) { border-radius: 999px !important; }',
      'html[data-style-studio="candy"] ::selection { background: rgba(178, 26, 145, .22); }',
      'html[data-style-studio="terminal"] body { --dsw-font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace; --ds-font-family-code: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace; font-family: var(--dsw-font-family); }',
      'html[data-style-studio="terminal"] button, html[data-style-studio="terminal"] input, html[data-style-studio="terminal"] textarea, html[data-style-studio="terminal"] select { font-family: var(--dsw-font-family); }',
      'html[data-style-studio="terminal"] * { border-radius: 2px !important; }',
      'html[data-style-studio="terminal"] ::selection { background: rgba(255, 194, 71, .34); color: #070604; }',
      'html[data-style-studio="pixel"] * { border-radius: 0 !important; }',
      'html[data-style-studio="pixel"] body { --dsw-font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace; --ds-font-family-code: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace; font-family: var(--dsw-font-family); letter-spacing: .015em; -webkit-font-smoothing: none; }',
      'html[data-style-studio="pixel"] button, html[data-style-studio="pixel"] input, html[data-style-studio="pixel"] textarea, html[data-style-studio="pixel"] select { font-family: var(--dsw-font-family); }',
      'html[data-style-studio="pixel"] img, html[data-style-studio="pixel"] video, html[data-style-studio="pixel"] canvas { image-rendering: pixelated; }',
      'html[data-style-studio="pixel"] ::selection { background: rgba(57, 245, 200, .3); color: #0b0b14; }',
      'html[data-style-studio="pixel"] body::after { content: ""; position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; background-image: repeating-linear-gradient(0deg, rgba(0, 0, 0, .16) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255, 255, 255, .03) 0 1px, transparent 1px 3px); }',
      '@media (prefers-reduced-motion: reduce) { html[data-style-studio] body { transition: none; } }'
    ].join('\n');

    const PANEL_CSS = [
      '.ss-root { box-sizing: border-box; width: 100%; height: 100%; overflow-y: auto; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }',
      '.ss-inner { box-sizing: border-box; width: 100%; max-width: 1080px; margin: 0 auto; padding: clamp(24px, 4vw, 52px) clamp(18px, 3vw, 40px) 64px; }',
      '.ss-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 24px; }',
      '.ss-head-copy { flex: 1 1 440px; min-width: 0; }',
      '.ss-eyebrow { margin: 0 0 10px; color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; }',
      '.ss-title { margin: 0 0 12px; font-size: clamp(26px, 3.4vw, 40px); line-height: 1.08; letter-spacing: -.025em; text-wrap: balance; }',
      '.ss-sub { max-width: 68ch; margin: 0; color: var(--dsw-alias-label-secondary); font-size: 15px; line-height: 1.65; }',
      '.ss-current { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 216px; padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); }',
      '.ss-current-label { color: var(--dsw-alias-label-secondary); font-size: 10.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }',
      '.ss-current-name { font-size: 17px; font-weight: 600; letter-spacing: -.01em; }',
      '.ss-reset { margin-top: 8px; padding: 6px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer; }',
      '.ss-reset:hover:not(:disabled) { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }',
      '.ss-reset:disabled { opacity: .45; cursor: default; }',
      '.ss-reset:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }',
      '.ss-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 30px; }',
      '.ss-card { display: flex; flex-direction: column; overflow: hidden; padding: 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; text-align: start; cursor: pointer; transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease; }',
      '.ss-card:hover { border-color: var(--dsw-alias-border-l2); transform: translateY(-2px); }',
      '.ss-card[aria-pressed="true"] { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary); }',
      '.ss-card:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 3px; }',
      '.ss-preview { position: relative; display: block; height: 136px; padding: 14px; overflow: hidden; background: var(--ss-p-bg); }',
      '.ss-mini { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 8px; height: 100%; }',
      '.ss-mini-rail { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 0; border-radius: 7px; background: var(--ss-p-panel); box-shadow: inset 0 0 0 1px rgba(127, 127, 127, .16); }',
      '.ss-mini-dot { width: 7px; height: 7px; border-radius: 2px; background: var(--ss-p-sub); opacity: .55; }',
      '.ss-mini-dot:first-child { background: var(--ss-p-accent); opacity: .95; }',
      '.ss-mini-body { display: flex; flex-direction: column; gap: 7px; min-width: 0; padding-top: 2px; }',
      '.ss-mini-bar { width: 58%; height: 9px; border-radius: 3px; background: var(--ss-p-accent); }',
      '.ss-mini-line { width: 88%; height: 5px; border-radius: 2px; background: var(--ss-p-sub); opacity: .5; }',
      '.ss-mini-line.short { width: 64%; }',
      '.ss-mini-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; }',
      '.ss-mini-chip { width: 44px; height: 16px; border-radius: 4px; background: var(--ss-p-accent); opacity: .9; }',
      '.ss-mini-type { color: var(--ss-p-text); font-size: 23px; font-weight: 600; line-height: 1; letter-spacing: -.02em; }',
      '.ss-preview-aurora .ss-mini-bar { box-shadow: 0 0 18px var(--ss-p-accent); }',
      '.ss-preview-pixel { background-image: linear-gradient(45deg, rgba(255, 255, 255, .045) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, .045) 75%), linear-gradient(45deg, rgba(255, 255, 255, .045) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, .045) 75%); background-position: 0 0, 4px 4px; background-size: 8px 8px; }',
      '.ss-preview-pixel .ss-mini-rail, .ss-preview-pixel .ss-mini-bar, .ss-preview-pixel .ss-mini-line, .ss-preview-pixel .ss-mini-chip, .ss-preview-pixel .ss-mini-dot { border-radius: 0; }',
      '.ss-preview-pixel .ss-mini-bar { box-shadow: 3px 3px 0 rgba(0, 0, 0, .45); }',
      '.ss-preview-pixel .ss-mini-type { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 19px; text-transform: uppercase; }',
      '.ss-preview-paper .ss-mini-type { font-family: ui-serif, Georgia, "Times New Roman", serif; }',
      '.ss-preview-terminal .ss-mini-type { color: var(--ss-p-accent); font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 19px; }',
      '.ss-preview-candy .ss-mini-bar, .ss-preview-candy .ss-mini-chip { border-radius: 999px; }',
      '.ss-card-body { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px 16px; }',
      '.ss-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }',
      '.ss-card-name { font-size: 15.5px; font-weight: 600; letter-spacing: -.01em; }',
      '.ss-check { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex: 0 0 auto; border-radius: 999px; background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }',
      '.ss-card-desc { color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 1.55; }',
      '.ss-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }',
      '.ss-tag { padding: 3px 7px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; letter-spacing: .02em; }',
      '.ss-foot { margin: 26px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }',
      '@media (max-width: 640px) { .ss-current { width: 100%; } .ss-grid { grid-template-columns: 1fr; } }',
      '@media (prefers-reduced-motion: reduce) { .ss-card, .ss-reset { transition: none; } .ss-card:hover { transform: none; } }'
    ].join('\n');

    function readSaved() {
      try { return window.localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
    }

    function writeSaved(value) {
      try { window.localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* storage unavailable */ }
    }

    function clearSaved() {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) { /* storage unavailable */ }
    }

    function findStyle(value) {
      if (!value) return null;
      return THEMES.find(function (theme) {
        return theme.key === value || theme.id === value;
      }) || null;
    }

    function modesFor(style) {
      const modes = {};
      Object.keys(style.tokens).forEach(function (name) {
        modes[name] = { light: style.tokens[name], dark: style.tokens[name] };
      });
      return modes;
    }

    function StudioIcon(props) {
      const size = props && props.size ? props.size : 20;
      const active = Boolean(props && props.active);
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': 'true',
        style: { color: 'currentColor', opacity: active ? 1 : 0.9, display: 'block' }
      },
        h('path', {
          d: 'M12 3.2c4.9 0 8.8 3.5 8.8 7.8 0 2.6-2 4.3-4.6 4.3h-2c-1.1 0-1.9.7-1.9 1.6 0 .5.2.9.5 1.3.3.4.6.9.6 1.4 0 1.2-1 2-2.4 2-4.9 0-8.9-3.5-8.9-7.8S7.1 3.2 12 3.2Z',
          stroke: 'currentColor', strokeWidth: '1.4', strokeLinejoin: 'round'
        }),
        h('circle', { cx: 8.6, cy: 9.5, r: 1.3, fill: 'currentColor' }),
        h('circle', { cx: 12.4, cy: 7.4, r: 1.3, fill: 'currentColor' }),
        h('circle', { cx: 16.2, cy: 9.9, r: 1.3, fill: 'currentColor' }),
        h('circle', { cx: 7.8, cy: 14.1, r: 1.1, fill: 'currentColor', opacity: '0.72' }),
        h('rect', { x: 15.1, y: 16.2, width: 4.4, height: 4.4, rx: 0.5, stroke: 'currentColor', strokeWidth: '1.1' }),
        h('rect', { x: 16.4, y: 17.5, width: 1.8, height: 1.8, fill: 'currentColor' })
      );
    }

    function StyleInjector() {
      return h(React.Fragment, null, h('style', { 'data-style-studio-style': 'global' }, GLOBAL_CSS));
    }

    return {
      inject: ['slots', 'locale', 'theme'],
      apply(ctx) {
        ctx.effect(function () {
          const dictionaries = [
            ctx.locale.register('styleStudio', 'en', DICT_EN),
            ctx.locale.register('styleStudio', 'ar', DICT_AR),
            ctx.locale.register('styleStudio', 'zh', DICT_ZH)
          ];
          return function () {
            for (let i = 0; i < dictionaries.length; i += 1) dictionaries[i]();
          };
        });

        const bound = ctx.locale.bind('styleStudio');
        function tr(key) {
          const value = bound(key);
          return value === key ? (DICT_EN[key] || key) : value;
        }

        const SOURCE = 'style-studio';
        const root = document.documentElement;
        let selected = null;
        let layerDispose = null;
        let applying = false;
        let active = true;
        const selectionListeners = new Set();

        function setSelected(style) {
          selected = style;
          selectionListeners.forEach(function (listener) { listener(); });
        }

        function subscribeSelection(listener) {
          selectionListeners.add(listener);
          return function () { selectionListeners.delete(listener); };
        }

        function getSelection() {
          return selected;
        }

        function getLocaleSnapshot() {
          return ctx.locale.getSnapshot();
        }

        function subscribeLocale(listener) {
          return ctx.locale.subscribe(listener);
        }

        function useSelection() {
          return useSyncExternalStore(subscribeSelection, getSelection, getSelection);
        }

        function useLocale() {
          return useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleSnapshot);
        }

        function dropLayer() {
          if (layerDispose) {
            try { layerDispose(); } catch (error) { /* layer already disposed */ }
            layerDispose = null;
          }
        }

        function paint(style) {
          applying = true;
          try {
            ctx.theme.setTheme(style.colorScheme);
            dropLayer();
            layerDispose = ctx.theme.overrideTokens(SOURCE, modesFor(style));
            root.setAttribute(ATTR, style.key);
            writeSaved(style.key);
            setSelected(style);
          } finally {
            applying = false;
          }
        }

        function clearStyle(persist) {
          applying = true;
          try {
            dropLayer();
            root.removeAttribute(ATTR);
            setSelected(null);
            if (persist) clearSaved();
          } finally {
            applying = false;
          }
        }

        function resetStyle() {
          applying = true;
          try {
            dropLayer();
            root.removeAttribute(ATTR);
            setSelected(null);
            clearSaved();
            ctx.theme.setTheme('system');
          } finally {
            applying = false;
          }
        }

        function sync(snapshot) {
          if (!active || applying) return;
          if (!selected) {
            root.removeAttribute(ATTR);
            return;
          }
          if (snapshot.active.colorScheme !== selected.colorScheme) {
            clearStyle(true);
            return;
          }
          root.setAttribute(ATTR, selected.key);
        }

        ctx.effect(function () {
          const off = ctx.on('theme/change', sync);
          const saved = findStyle(readSaved());
          if (saved) paint(saved);
          sync(ctx.theme.getTheme());
          return function () {
            active = false;
            off();
            dropLayer();
            root.removeAttribute(ATTR);
            selectionListeners.clear();
          };
        });

        function StylePanel() {
          const activeStyle = useSelection();
          useLocale();
          const activeKey = activeStyle ? activeStyle.key : null;
          const currentName = activeStyle ? tr(activeStyle.nameKey) : tr('systemName');

          const cards = THEMES.map(function (theme) {
            const isSelected = theme.key === activeKey;
            return h('button', {
              key: theme.key,
              type: 'button',
              className: 'ss-card',
              'aria-pressed': isSelected,
              onClick: function () {
                paint(theme);
              },
              style: {
                '--ss-p-bg': theme.preview.bg,
                '--ss-p-panel': theme.preview.panel,
                '--ss-p-accent': theme.preview.accent,
                '--ss-p-text': theme.preview.text,
                '--ss-p-sub': theme.preview.sub
              }
            },
              h('span', { className: 'ss-preview ss-preview-' + theme.key, 'aria-hidden': 'true' },
                h('span', { className: 'ss-mini' },
                  h('span', { className: 'ss-mini-rail' },
                    h('span', { className: 'ss-mini-dot' }),
                    h('span', { className: 'ss-mini-dot' }),
                    h('span', { className: 'ss-mini-dot' }),
                    h('span', { className: 'ss-mini-dot' })
                  ),
                  h('span', { className: 'ss-mini-body' },
                    h('span', { className: 'ss-mini-bar' }),
                    h('span', { className: 'ss-mini-line' }),
                    h('span', { className: 'ss-mini-line short' }),
                    h('span', { className: 'ss-mini-row' },
                      h('span', { className: 'ss-mini-chip' }),
                      h('span', { className: 'ss-mini-type' }, 'Aa')
                    )
                  )
                )
              ),
              h('span', { className: 'ss-card-body' },
                h('span', { className: 'ss-card-top' },
                  h('span', { className: 'ss-card-name' }, tr(theme.nameKey)),
                  isSelected ? h('span', { className: 'ss-check', 'aria-hidden': 'true' },
                    h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none' },
                      h('path', { d: 'm3.4 8.4 3 3 6.2-6.6', stroke: 'currentColor', strokeWidth: '1.9', strokeLinecap: 'round', strokeLinejoin: 'round' })
                    )
                  ) : null
                ),
                h('span', { className: 'ss-card-desc' }, tr(theme.descKey)),
                h('span', { className: 'ss-tags' },
                  theme.tags.map(function (tag) {
                    return h('span', { key: tag, className: 'ss-tag' }, tr(tag));
                  })
                )
              )
            );
          });

          return h('div', { className: 'ss-root' },
            h('style', null, PANEL_CSS),
            h('div', { className: 'ss-inner' },
              h('header', { className: 'ss-head' },
                h('div', { className: 'ss-head-copy' },
                  h('p', { className: 'ss-eyebrow' }, tr('eyebrow')),
                  h('h1', { className: 'ss-title' }, tr('title')),
                  h('p', { className: 'ss-sub' }, tr('subtitle'))
                ),
                h('div', { className: 'ss-current' },
                  h('span', { className: 'ss-current-label' }, tr('currentLabel')),
                  h('span', { className: 'ss-current-name', 'aria-live': 'polite' }, currentName),
                  h('button', {
                    type: 'button',
                    className: 'ss-reset',
                    disabled: !activeStyle,
                    onClick: function () {
                      resetStyle();
                    }
                  }, tr('reset'))
                )
              ),
              h('div', { className: 'ss-grid', role: 'group', 'aria-label': tr('title') }, cards),
              h('p', { className: 'ss-foot' }, tr('footer'))
            )
          );
        }

        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({
            name: 'sidebar.panellist',
            id: 'style-studio',
            order: 35,
            label: function () { return tr('navLabel'); }
          }, StudioIcon);
        });

        ctx.slots.inject('main', function () {
          return ctx.slots.register({
            name: 'main',
            key: 'style-studio'
          }, StylePanel);
        });

        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register({
            name: 'shell.overlay',
            id: 'style-studio-runtime',
            order: 80
          }, StyleInjector);
        });
      }
    };
  }
});
