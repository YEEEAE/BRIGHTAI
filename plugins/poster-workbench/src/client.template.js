window.__ModuleLoader__.load({
  id: '@local/poster-workbench',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;
    const useSyncExternalStore = React.useSyncExternalStore || function (subscribe, get) {
      const [value, setValue] = useState(get);
      useEffect(function () {
        return subscribe(function () { setValue(get()); });
      }, [subscribe, get]);
      return value;
    };

    const HOST_GROTESK = '__HOST_GROTESK_WOFF2__';
    const FRAGMENT_MONO = '__FRAGMENT_MONO_WOFF2__';

    const FONT_CSS = [
      '@font-face{font-family:"Host Grotesk";src:url(data:font/woff2;base64,' + HOST_GROTESK + ') format("woff2");font-style:normal;font-weight:300 800;font-display:swap}',
      '@font-face{font-family:"Fragment Mono";src:url(data:font/woff2;base64,' + FRAGMENT_MONO + ') format("woff2");font-style:normal;font-weight:400;font-display:swap}'
    ].join('');

    const STORAGE_KEY = 'poster-workbench:v1';
    const DEFAULT_POSTER = {
      title: 'Everything is a plugin',
      text: 'Build what comes next.',
      colors: {
        base: '#071024',
        mid: '#1E4574',
        light: '#4E7FC4'
      }
    };

    const PALETTES = [
      { id: 'harness', nameKey: 'paletteHarness', base: '#071024', mid: '#1E4574', light: '#4E7FC4' },
      { id: 'glacier', nameKey: 'paletteGlacier', base: '#061A1F', mid: '#0F5964', light: '#69D8C7' },
      { id: 'ember', nameKey: 'paletteEmber', base: '#190806', mid: '#6A2514', light: '#F0A15D' },
      { id: 'iris', nameKey: 'paletteIris', base: '#10091D', mid: '#372067', light: '#B6A0FF' },
      { id: 'moss', nameKey: 'paletteMoss', base: '#08130A', mid: '#214A2A', light: '#9FD18C' }
    ];

    const DICT_EN = {
      viewLabel: 'Poster',
      customize: 'Customize',
      close: 'Close',
      download: 'PNG',
      downloadLabel: 'Download PNG',
      rendering: 'Rendering',
      titleLabel: 'Title',
      textLabel: 'Text',
      titlePlaceholder: 'Add a title',
      textPlaceholder: 'Add a line of text',
      colorsLabel: 'Shader colors',
      deepColor: 'Deep',
      flowColor: 'Flow',
      lightColor: 'Light',
      presetsLabel: 'Palettes',
      reset: 'Reset',
      posterLabel: 'Poster preview',
      editorLabel: 'Poster settings',
      downloaded: 'Poster downloaded.',
      exportFailed: 'Could not render the poster. Try again.',
      paletteHarness: 'Harness',
      paletteGlacier: 'Glacier',
      paletteEmber: 'Ember',
      paletteIris: 'Iris',
      paletteMoss: 'Moss'
    };

    const DICT_AR = {
      viewLabel: 'ملصق',
      customize: 'تخصيص',
      close: 'إغلاق',
      download: 'PNG',
      downloadLabel: 'تنزيل PNG',
      rendering: 'جارٍ التصدير',
      titleLabel: 'العنوان',
      textLabel: 'النص',
      titlePlaceholder: 'أضف عنوانًا',
      textPlaceholder: 'أضف سطرًا من النص',
      colorsLabel: 'ألوان الخلفية',
      deepColor: 'عميق',
      flowColor: 'تدفّق',
      lightColor: 'ضوء',
      presetsLabel: 'لوحات',
      reset: 'إعادة ضبط',
      posterLabel: 'معاينة الملصق',
      editorLabel: 'إعدادات الملصق',
      downloaded: 'تم تنزيل الملصق.',
      exportFailed: 'تعذّر إنشاء الصورة. حاول مرة أخرى.',
      paletteHarness: 'Harness',
      paletteGlacier: 'جليد',
      paletteEmber: 'جمر',
      paletteIris: 'قزحية',
      paletteMoss: 'طحلب'
    };

    const DICT_ZH = {
      viewLabel: '海报',
      customize: '自定义',
      close: '关闭',
      download: 'PNG',
      downloadLabel: '下载 PNG',
      rendering: '渲染中',
      titleLabel: '标题',
      textLabel: '文字',
      titlePlaceholder: '添加标题',
      textPlaceholder: '添加一行文字',
      colorsLabel: '着色器颜色',
      deepColor: '深色',
      flowColor: '流动',
      lightColor: '亮色',
      presetsLabel: '配色',
      reset: '重置',
      posterLabel: '海报预览',
      editorLabel: '海报设置',
      downloaded: '海报已下载。',
      exportFailed: '无法生成海报，请重试。',
      paletteHarness: 'Harness',
      paletteGlacier: '冰川',
      paletteEmber: '余烬',
      paletteIris: '鸢尾',
      paletteMoss: '苔藓'
    };

    const STYLES = `
      .pw-root {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 420px;
        overflow: hidden;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
      }
      .pw-stage {
        position: relative;
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        min-height: 0;
        padding: 76px 28px 32px;
      }
      .pw-actions {
        position: absolute;
        z-index: 4;
        top: 18px;
        inset-inline-end: 22px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pw-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 9px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease;
      }
      .pw-btn:hover {
        background: var(--dsw-alias-bg-layer-2);
        border-color: var(--dsw-alias-border-l2);
      }
      .pw-btn:active {
        transform: translateY(1px);
      }
      .pw-btn:focus-visible,
      .pw-icon-btn:focus-visible,
      .pw-input:focus-visible,
      .pw-textarea:focus-visible,
      .pw-preset:focus-visible,
      .pw-color-input:focus-visible,
      .pw-reset:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 2px;
      }
      .pw-btn-primary {
        border-color: transparent;
        background: var(--dsw-alias-brand-primary);
        color: var(--dsw-alias-bg-base);
      }
      .pw-btn-primary:hover {
        background: var(--dsw-alias-brand-primary);
        border-color: transparent;
        filter: brightness(1.08);
      }
      .pw-btn:disabled {
        opacity: 0.55;
        cursor: default;
      }
      .pw-btn svg,
      .pw-icon-btn svg {
        display: block;
        flex: none;
      }
      .pw-poster {
        position: relative;
        width: min(84vw, 54vh, 590px);
        max-width: 100%;
        aspect-ratio: 4 / 5;
        overflow: hidden;
        border-radius: 3px;
        background: radial-gradient(ellipse at 82% 35%, #4E7FC4 0%, #1E4574 38%, #071024 78%);
        box-shadow:
          0 34px 90px rgba(0, 0, 0, 0.42),
          0 2px 12px rgba(0, 0, 0, 0.24),
          0 0 0 1px rgba(255, 255, 255, 0.08);
        isolation: isolate;
      }
      .pw-shader,
      .pw-ink {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
      }
      .pw-shader {
        z-index: 0;
      }
      .pw-ink {
        z-index: 1;
        pointer-events: none;
      }
      .pw-sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      .pw-editor-backdrop {
        position: fixed;
        inset: 0;
        z-index: 7;
        background: rgba(0, 0, 0, 0.01);
      }
      .pw-editor {
        position: fixed;
        z-index: 8;
        top: 72px;
        inset-inline-end: 18px;
        width: min(336px, calc(100vw - 36px));
        max-height: calc(100vh - 96px);
        overflow: auto;
        padding: 18px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 14px;
        background: var(--dsw-alias-bg-overlay);
        box-shadow: 0 26px 70px rgba(0, 0, 0, 0.42);
        color: var(--dsw-alias-label-primary);
        font-family: inherit;
      }
      .pw-editor-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }
      .pw-editor-title {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;
        letter-spacing: 0.01em;
      }
      .pw-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        cursor: pointer;
      }
      .pw-icon-btn:hover {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .pw-field {
        display: flex;
        flex-direction: column;
        gap: 7px;
        margin: 0 0 16px;
      }
      .pw-label {
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        letter-spacing: 0.02em;
      }
      .pw-input,
      .pw-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 10px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font-size: 13px;
        font-weight: 400;
        line-height: 1.4;
        resize: none;
      }
      .pw-input::placeholder,
      .pw-textarea::placeholder {
        color: var(--dsw-alias-label-secondary);
        opacity: 0.7;
      }
      .pw-textarea {
        min-height: 74px;
      }
      .pw-colors {
        display: flex;
        flex-direction: column;
        gap: 9px;
        margin: 0 0 17px;
        padding: 0;
        border: 0;
      }
      .pw-legend {
        margin-bottom: 8px;
        padding: 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        letter-spacing: 0.02em;
      }
      .pw-color-row {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 31px;
        cursor: pointer;
      }
      .pw-color-name {
        flex: 1;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.2;
        color: var(--dsw-alias-label-primary);
      }
      .pw-color-hex {
        color: var(--dsw-alias-label-secondary);
        font: 400 10px/1 "Fragment Mono", ui-monospace, monospace;
        letter-spacing: 0.03em;
      }
      .pw-color-input {
        width: 29px;
        height: 29px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
      }
      .pw-color-input::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      .pw-color-input::-webkit-color-swatch {
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 7px;
      }
      .pw-color-input::-moz-color-swatch {
        border: 1px solid var(--dsw-alias-border-l2);
        border-radius: 7px;
      }
      .pw-presets {
        margin-bottom: 18px;
      }
      .pw-preset-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pw-preset {
        position: relative;
        width: 34px;
        height: 27px;
        padding: 0;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 7px;
        background: transparent;
        cursor: pointer;
      }
      .pw-preset span {
        position: absolute;
        inset: 3px;
        border-radius: 4px;
      }
      .pw-preset[aria-pressed="true"] {
        border-color: var(--dsw-alias-brand-primary);
        box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary);
      }
      .pw-reset {
        width: 100%;
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
      }
      .pw-reset:hover {
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
      }
      .pw-notice {
        position: absolute;
        z-index: 6;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        max-width: calc(100vw - 32px);
        padding: 8px 12px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-label-primary);
        box-shadow: 0 10px 34px rgba(0, 0, 0, 0.26);
        font-size: 11px;
        font-weight: 400;
        line-height: 1.2;
        white-space: nowrap;
      }
      @media (max-width: 640px) {
        .pw-stage {
          padding: 76px 14px 20px;
        }
        .pw-actions {
          top: 15px;
          inset-inline-end: 14px;
        }
        .pw-poster {
          width: min(92vw, 54vh, 590px);
        }
        .pw-editor {
          top: auto;
          inset-inline-start: 10px;
          inset-inline-end: 10px;
          bottom: 10px;
          width: auto;
          max-height: 58vh;
        }
      }
      @media (pointer: coarse) {
        .pw-btn,
        .pw-reset {
          min-height: 44px;
        }
        .pw-icon-btn {
          width: 44px;
          height: 44px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .pw-btn {
          transition: none;
        }
      }
    `;

    const FLUID_VERT = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

    const FLUID_FRAG = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
uniform float u_scale;
uniform float u_grain;
out vec4 fragColor;

vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float hash(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

float fbm(vec3 p){
  float v=0.,amp=.6;vec3 shift=vec3(100.);
  for(int i=0;i<1;i++){v+=amp*snoise(p);p=p*2.+shift;amp*=.4;}
  return v;
}

float fluidNoise(vec2 uv,float t){
  float n1=fbm(vec3(uv*.6,t*.06));
  float n2=fbm(vec3(uv*.6+5.2,t*.06+1.3));
  vec2 w1=vec2(n1,n2)*.6;
  float n3=fbm(vec3((uv+w1)*.7+1.7,t*.05+3.1));
  float n4=fbm(vec3((uv+w1)*.7+9.2,t*.05+5.7));
  vec2 w2=vec2(n3,n4)*.5;
  return fbm(vec3((uv+w1+w2)*.5,t*.04));
}

vec2 curlish(vec2 uv,float t){
  float eps=.02;
  float n=snoise(vec3(uv*.8,t));
  float nx=snoise(vec3((uv+vec2(eps,0.))*.8,t));
  float ny=snoise(vec3((uv+vec2(0.,eps))*.8,t));
  return vec2(-(ny-n)/eps,(nx-n)/eps)*.003;
}

void main(){
  float aspect=u_resolution.x/u_resolution.y;
  vec2 uv=gl_FragCoord.xy/u_resolution;
  vec2 suv=vec2(uv.x*aspect,uv.y)*u_scale;
  float t=u_time;
  vec2 curl=curlish(suv,t*.04);
  vec2 uvD=suv+curl*12.;
  float f=fluidNoise(uvD,t);
  float swirl=snoise(vec3(uvD*.8+f*1.5,t*.035))*.5+.5;
  float n=clamp((f*.5+.5-.5)*1.7+.5,0.,1.);
  vec3 col=mix(u_c1,u_c2,smoothstep(.2,.5,n));
  col=mix(col,u_c3,smoothstep(.35,.65,n+swirl*.25));
  col=mix(col,u_c4,smoothstep(.6,.85,swirl)*.55);
  col=mix(col,u_c5,smoothstep(.5,.8,n*swirl)*.35);
  if(u_grain>0.0){
    vec2 flowOffset=(uvD-suv)*u_resolution.y;
    vec2 gp=floor((gl_FragCoord.xy+flowOffset)/5.0);
    float gr=hash(gp)*2.-1.;
    col+=gr*u_grain;
  }
  col+=(hash(gl_FragCoord.xy)*2.-1.)/255.*1.5;
  fragColor=vec4(col,1.);
}
`;

    function hexToRgb(hex) {
      const match = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
      const value = match ? match[1] : '000000';
      return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16)
      };
    }

    function rgbToHex(r, g, b) {
      const part = function (v) {
        return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
      };
      return '#' + part(r) + part(g) + part(b);
    }

    function mixHex(a, b, amount) {
      const ca = hexToRgb(a);
      const cb = hexToRgb(b);
      const t = Math.max(0, Math.min(1, Number(amount) || 0));
      return rgbToHex(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
    }

    function rgba(hex, alpha) {
      const c = hexToRgb(hex);
      return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
    }

    function shaderPalette(colors) {
      return [
        colors.base,
        colors.mid,
        mixHex(colors.base, colors.mid, 0.28),
        colors.light,
        mixHex(colors.base, '#000000', 0.68)
      ];
    }

    function normaliseHex(value, fallback) {
      return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toLowerCase() : fallback;
    }

    function normalisePoster(value) {
      const source = value && typeof value === 'object' ? value : {};
      const colors = source.colors && typeof source.colors === 'object' ? source.colors : {};
      return {
        title: typeof source.title === 'string' ? source.title.slice(0, 120) : DEFAULT_POSTER.title,
        text: typeof source.text === 'string' ? source.text.slice(0, 220) : DEFAULT_POSTER.text,
        colors: {
          base: normaliseHex(colors.base, DEFAULT_POSTER.colors.base),
          mid: normaliseHex(colors.mid, DEFAULT_POSTER.colors.mid),
          light: normaliseHex(colors.light, DEFAULT_POSTER.colors.light)
        }
      };
    }

    function loadPoster() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? normalisePoster(JSON.parse(raw)) : normalisePoster(DEFAULT_POSTER);
      } catch (error) {
        return normalisePoster(DEFAULT_POSTER);
      }
    }

    function savePoster(poster) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(poster));
      } catch (error) {
        /* local persistence is best effort */
      }
    }

    function posterFilename(title) {
      const slug = String(title || '')
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .toLowerCase();
      return (slug || 'poster') + '.png';
    }

    function compileShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Poster shader compile failed: ' + log);
      }
      return shader;
    }

    function createFluidRenderer(canvas, options) {
      let gl;
      try {
        gl = canvas.getContext('webgl2', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          preserveDrawingBuffer: Boolean(options && options.preserveDrawingBuffer),
          powerPreference: 'low-power'
        });
      } catch (error) {
        return null;
      }
      if (!gl) return null;

      let program;
      let vao;
      let buffer;
      let uniforms;
      try {
        const vertex = compileShader(gl, gl.VERTEX_SHADER, FLUID_VERT);
        const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_FRAG);
        program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program) || 'Poster shader link failed');
        }
        gl.useProgram(program);
        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        const uniform = function (name) { return gl.getUniformLocation(program, name); };
        uniforms = {
          time: uniform('u_time'),
          resolution: uniform('u_resolution'),
          c1: uniform('u_c1'),
          c2: uniform('u_c2'),
          c3: uniform('u_c3'),
          c4: uniform('u_c4'),
          c5: uniform('u_c5'),
          scale: uniform('u_scale'),
          grain: uniform('u_grain')
        };
        gl.disable(gl.DEPTH_TEST);
        gl.bindVertexArray(null);
      } catch (error) {
        console.error('[poster-workbench] shader unavailable', error);
        return null;
      }

      return {
        resize: function (width, height) {
          gl.viewport(0, 0, Math.max(1, width), Math.max(1, height));
        },
        draw: function (time, palette, scale) {
          const rb = hexToRgb(palette[0]);
          const rm = hexToRgb(palette[1]);
          const rd = hexToRgb(palette[2]);
          const rl = hexToRgb(palette[3]);
          const rk = hexToRgb(palette[4]);
          gl.useProgram(program);
          gl.bindVertexArray(vao);
          gl.uniform1f(uniforms.time, time);
          gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
          gl.uniform1f(uniforms.scale, Number(scale) || 0.8);
          gl.uniform1f(uniforms.grain, 0.012);
          gl.uniform3f(uniforms.c1, rb.r / 255, rb.g / 255, rb.b / 255);
          gl.uniform3f(uniforms.c2, rm.r / 255, rm.g / 255, rm.b / 255);
          gl.uniform3f(uniforms.c3, rd.r / 255, rd.g / 255, rd.b / 255);
          gl.uniform3f(uniforms.c4, rl.r / 255, rl.g / 255, rl.b / 255);
          gl.uniform3f(uniforms.c5, rk.r / 255, rk.g / 255, rk.b / 255);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.bindVertexArray(null);
        },
        dispose: function () {
          try {
            gl.deleteBuffer(buffer);
            gl.deleteVertexArray(vao);
            gl.deleteProgram(program);
            const lose = gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();
          } catch (error) {
            /* context teardown is best effort */
          }
        }
      };
    }

    function wrapText(ctx, text, maxWidth, maxLines) {
      const paragraphs = String(text || '').replace(/\r/g, '').split('\n');
      const lines = [];
      for (let p = 0; p < paragraphs.length; p += 1) {
        const words = paragraphs[p].trim().split(/\s+/).filter(Boolean);
        if (!words.length) continue;
        let line = '';
        for (let i = 0; i < words.length; i += 1) {
          const next = line ? line + ' ' + words[i] : words[i];
          if (!line || ctx.measureText(next).width <= maxWidth) {
            line = next;
          } else {
            lines.push(line);
            line = words[i];
          }
        }
        if (line) lines.push(line);
      }
      if (lines.length <= maxLines) return lines;
      const clipped = lines.slice(0, maxLines);
      let last = clipped[clipped.length - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
        last = last.replace(/\s+\S+$/, '');
      }
      clipped[clipped.length - 1] = last.replace(/[.,;:!?]?$/, '') + '…';
      return clipped;
    }

    function balancedWrap(ctx, text, maxWidth, maxLines) {
      const normalised = String(text || '').trim();
      if (!normalised) return [];
      if (normalised.indexOf('\n') !== -1) return wrapText(ctx, normalised, maxWidth, maxLines);
      const words = normalised.split(/\s+/).filter(Boolean);
      if (words.length < 2) return [normalised];
      const n = words.length;
      const widths = words.map(function (word) { return ctx.measureText(word).width; });
      const space = ctx.measureText(' ').width;
      const lineWidth = function (start, end) {
        let total = 0;
        for (let i = start; i < end; i += 1) {
          total += widths[i];
          if (i > start) total += space;
        }
        return total;
      };
      const dp = [];
      const previous = [];
      for (let l = 0; l <= maxLines; l += 1) {
        dp.push(new Array(n + 1).fill(Infinity));
        previous.push(new Array(n + 1).fill(-1));
      }
      dp[0][0] = 0;
      for (let l = 1; l <= maxLines; l += 1) {
        for (let end = 1; end <= n; end += 1) {
          for (let start = 0; start < end; start += 1) {
            if (!Number.isFinite(dp[l - 1][start])) continue;
            const width = lineWidth(start, end);
            if (width > maxWidth && end - start > 1) continue;
            const slack = Math.max(0, maxWidth - width);
            const cost = dp[l - 1][start] + slack * slack;
            if (cost < dp[l][end]) {
              dp[l][end] = cost;
              previous[l][end] = start;
            }
          }
        }
      }
      let bestLines = -1;
      for (let l = 1; l <= maxLines; l += 1) {
        if (Number.isFinite(dp[l][n]) && (bestLines === -1 || dp[l][n] < dp[bestLines][n])) bestLines = l;
      }
      if (bestLines === -1) return wrapText(ctx, normalised, maxWidth, maxLines);
      const lines = [];
      let cursor = n;
      for (let l = bestLines; l >= 1; l -= 1) {
        const start = previous[l][cursor];
        if (start < 0) return wrapText(ctx, normalised, maxWidth, maxLines);
        lines.unshift(words.slice(start, cursor).join(' '));
        cursor = start;
      }
      return lines;
    }

    function drawSpacedText(ctx, text, x, y, tracking) {
      let cursor = x;
      const chars = Array.from(text);
      for (let i = 0; i < chars.length; i += 1) {
        ctx.fillText(chars[i], cursor, y);
        cursor += ctx.measureText(chars[i]).width + tracking;
      }
    }

    function drawPosterInk(ctx, width, height, poster, options) {
      const U = width / 1600;
      const palette = shaderPalette(poster.colors);
      if (!options || options.clear !== false) ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(width * 0.82, height * 0.35, 0, width * 0.82, height * 0.35, width * 0.86);
      glow.addColorStop(0, rgba(palette[3], 0.24));
      glow.addColorStop(0.42, rgba(palette[1], 0.08));
      glow.addColorStop(1, rgba(palette[0], 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      const scrim = ctx.createLinearGradient(0, height * 0.32, 0, height);
      scrim.addColorStop(0, 'rgba(0,0,0,0)');
      scrim.addColorStop(0.52, 'rgba(0,0,0,0.08)');
      scrim.addColorStop(0.78, 'rgba(0,0,0,0.34)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.68)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, width, height);

      const frame = 64 * U;
      ctx.lineWidth = Math.max(1, 1.5 * U);
      ctx.strokeStyle = 'rgba(255,255,255,0.17)';
      ctx.strokeRect(frame, frame, width - frame * 2, height - frame * 2);

      const left = 120 * U;
      const maxWidth = width - left * 2;
      const brandSize = 27 * U;
      ctx.font = '400 ' + brandSize + 'px "Fragment Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgba(244,248,255,0.62)';
      ctx.textBaseline = 'alphabetic';
      drawSpacedText(ctx, 'DEEPSEEK HARNESS', left, 149 * U, 5.2 * U);
      ctx.beginPath();
      ctx.arc(left - 18 * U, 141 * U, 3.1 * U, 0, Math.PI * 2);
      ctx.fillStyle = rgba(palette[3], 0.9);
      ctx.fill();

      const bodySize = 38 * U;
      const bodyLineHeight = bodySize * 1.45;
      const bodyMaxWidth = 920 * U;
      const bodyText = String(poster.text || '').trim();
      let bodyLines = [];
      if (bodyText) {
        ctx.font = '400 ' + bodySize + 'px "Host Grotesk", system-ui, sans-serif';
        bodyLines = wrapText(ctx, bodyText, bodyMaxWidth, 3);
      }
      const bottom = height - 148 * U;
      const bodyBlockHeight = bodyLines.length ? (bodyLines.length - 1) * bodyLineHeight + bodySize : 0;
      const bodyTop = bottom - bodyBlockHeight;
      const titleBottom = bodyLines.length ? bodyTop - 54 * U : bottom;

      let titleSize = 188 * U;
      let titleLineHeight = titleSize * 0.93;
      let titleLines = [];
      ctx.font = '500 ' + titleSize + 'px "Host Grotesk", system-ui, sans-serif';
      for (let attempt = 0; attempt < 5; attempt += 1) {
        titleLines = balancedWrap(ctx, poster.title || '', maxWidth, 3);
        if (titleLines.length <= 3) break;
        titleSize *= 0.9;
        titleLineHeight = titleSize * 0.93;
        ctx.font = '500 ' + titleSize + 'px "Host Grotesk", system-ui, sans-serif';
      }
      if (titleLines.length > 3) titleLines = titleLines.slice(0, 3);

      ctx.fillStyle = '#F5F8FF';
      ctx.font = '500 ' + titleSize + 'px "Host Grotesk", system-ui, sans-serif';
      for (let i = 0; i < titleLines.length; i += 1) {
        const baseline = titleBottom - (titleLines.length - 1 - i) * titleLineHeight;
        ctx.fillText(titleLines[i], left, baseline);
      }

      if (bodyLines.length) {
        ctx.font = '400 ' + bodySize + 'px "Host Grotesk", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(245,248,255,0.74)';
        for (let i = 0; i < bodyLines.length; i += 1) {
          const baseline = bodyTop + bodySize * 0.82 + i * bodyLineHeight;
          ctx.fillText(bodyLines[i], left, baseline);
        }
      }
    }

    function paintFallbackBackground(ctx, width, height, palette) {
      const gradient = ctx.createRadialGradient(width * 0.83, height * 0.36, 0, width * 0.83, height * 0.36, width * 0.95);
      gradient.addColorStop(0, palette[3]);
      gradient.addColorStop(0.35, palette[1]);
      gradient.addColorStop(1, palette[0]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 5; i += 1) {
        const y = height * (0.35 + i * 0.1);
        const wave = ctx.createLinearGradient(0, y, width, y - height * 0.24);
        wave.addColorStop(0, rgba(palette[4], 0));
        wave.addColorStop(0.45, rgba(palette[3], 0.08));
        wave.addColorStop(0.7, rgba(palette[4], 0));
        ctx.fillStyle = wave;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(width * 0.3, y - 130, width * 0.62, y + 110, width, y - 70);
        ctx.lineTo(width, y + 150);
        ctx.bezierCurveTo(width * 0.64, y + 270, width * 0.3, y + 40, 0, y + 180);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    async function ensurePosterFonts() {
      if (!document.fonts) return;
      await Promise.allSettled([
        document.fonts.load('500 188px "Host Grotesk"'),
        document.fonts.load('400 38px "Host Grotesk"'),
        document.fonts.load('400 27px "Fragment Mono"')
      ]);
      await document.fonts.ready;
    }

    function PosterCanvas(props) {
      const poster = props.poster;
      const tr = props.tr;
      const boxRef = useRef(null);
      const shaderRef = useRef(null);
      const inkRef = useRef(null);
      const rendererRef = useRef(null);
      const sizeRef = useRef({ width: 1, height: 1, dpr: 1 });
      const posterRef = useRef(poster);
      const paintRef = useRef(function () {});
      posterRef.current = poster;

      const palette = useMemo(function () { return shaderPalette(poster.colors); }, [poster.colors]);
      const paletteRef = useRef(palette);
      paletteRef.current = palette;

      useEffect(function () {
        const box = boxRef.current;
        const shaderCanvas = shaderRef.current;
        const inkCanvas = inkRef.current;
        if (!box || !shaderCanvas || !inkCanvas) return undefined;

        let dead = false;
        const renderer = createFluidRenderer(shaderCanvas);
        rendererRef.current = renderer;
        if (!renderer) shaderCanvas.style.display = 'none';
        const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        let reduced = Boolean(motionQuery && motionQuery.matches);
        let visible = true;
        let raf = 0;
        let lastFrame = 0;
        const startedAt = performance.now();

        function paintInk() {
          const size = sizeRef.current;
          if (dead || size.width < 2 || size.height < 2) return;
          const ctx = inkCanvas.getContext('2d');
          if (!ctx) return;
          ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
          drawPosterInk(ctx, size.width, size.height, posterRef.current);
        }
        paintRef.current = paintInk;

        function drawStatic() {
          if (renderer) renderer.draw(13.7, paletteRef.current, 0.8);
        }

        function resize() {
          const rect = box.getBoundingClientRect();
          const width = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
          sizeRef.current = { width: width, height: height, dpr: dpr };
          shaderCanvas.width = Math.max(1, Math.round(width * dpr));
          shaderCanvas.height = Math.max(1, Math.round(height * dpr));
          inkCanvas.width = Math.max(1, Math.round(width * dpr));
          inkCanvas.height = Math.max(1, Math.round(height * dpr));
          if (renderer) {
            renderer.resize(shaderCanvas.width, shaderCanvas.height);
            drawStatic();
          }
          paintInk();
        }

        function frame(now) {
          if (dead) return;
          raf = window.requestAnimationFrame(frame);
          if (!visible || reduced || document.hidden || !renderer) return;
          if (now - lastFrame < 33) return;
          lastFrame = now;
          renderer.draw((now - startedAt) * 0.00015, paletteRef.current, 0.8);
        }

        const resizeObserver = new ResizeObserver(function () { resize(); });
        resizeObserver.observe(box);

        let intersectionObserver = null;
        if (typeof IntersectionObserver !== 'undefined') {
          intersectionObserver = new IntersectionObserver(function (entries) {
            visible = Boolean(entries[0] && entries[0].isIntersecting);
            if (visible) {
              lastFrame = 0;
              drawStatic();
            }
          }, { threshold: 0.12 });
          intersectionObserver.observe(box);
        }

        function handleMotion() {
          reduced = Boolean(motionQuery && motionQuery.matches);
          if (reduced) drawStatic();
          lastFrame = 0;
        }
        function handleVisibility() {
          if (!document.hidden) {
            lastFrame = 0;
            drawStatic();
          }
        }
        if (motionQuery) {
          if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotion);
          else if (motionQuery.addListener) motionQuery.addListener(handleMotion);
        }
        document.addEventListener('visibilitychange', handleVisibility);

        resize();
        window.requestAnimationFrame(resize);
        raf = window.requestAnimationFrame(frame);
        ensurePosterFonts().then(function () {
          if (!dead) paintInk();
        }).catch(function () {});

        return function () {
          dead = true;
          window.cancelAnimationFrame(raf);
          resizeObserver.disconnect();
          if (intersectionObserver) intersectionObserver.disconnect();
          if (motionQuery) {
            if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', handleMotion);
            else if (motionQuery.removeListener) motionQuery.removeListener(handleMotion);
          }
          document.removeEventListener('visibilitychange', handleVisibility);
          if (renderer) renderer.dispose();
          rendererRef.current = null;
          paintRef.current = function () {};
        };
      }, []);

      useEffect(function () {
        paintRef.current();
        if (rendererRef.current) rendererRef.current.draw(13.7, palette, 0.8);
      }, [poster.title, poster.text, poster.colors.base, poster.colors.mid, poster.colors.light]);

      return h('section', {
        className: 'pw-poster',
        ref: boxRef,
        style: {
          background: 'radial-gradient(ellipse at 82% 35%, ' + poster.colors.light + ' 0%, ' + poster.colors.mid + ' 38%, ' + poster.colors.base + ' 78%)'
        },
        'aria-label': tr('posterLabel')
      },
        h('canvas', { ref: shaderRef, className: 'pw-shader', 'aria-hidden': 'true' }),
        h('canvas', { ref: inkRef, className: 'pw-ink', 'aria-hidden': 'true' }),
        h('div', { className: 'pw-sr-only' },
          h('h1', null, poster.title || ''),
          poster.text ? h('p', null, poster.text) : null
        )
      );
    }

    function IconSliders() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M3 4h10M3 8h10M3 12h10', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('circle', { cx: 6, cy: 4, r: 1.75, fill: 'var(--dsw-alias-bg-layer-1)', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('circle', { cx: 10.5, cy: 8, r: 1.75, fill: 'var(--dsw-alias-bg-layer-1)', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('circle', { cx: 5, cy: 12, r: 1.75, fill: 'var(--dsw-alias-bg-layer-1)', stroke: 'currentColor', strokeWidth: 1.2 })
      );
    }

    function IconDownload() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M8 2.5v7.2M5.3 7.2 8 9.9l2.7-2.7M3 12.1v1.2h10v-1.2', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function IconClose() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'm4 4 8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })
      );
    }

    function PosterEditor(props) {
      const tr = props.tr;
      const poster = props.poster;
      const onChange = props.onChange;
      const onClose = props.onClose;
      const onReset = props.onReset;
      const titleRef = useRef(null);

      useEffect(function () {
        if (titleRef.current) {
          titleRef.current.focus();
          titleRef.current.select();
        }
      }, []);

      const paletteKeys = [
        { key: 'base', label: 'deepColor' },
        { key: 'mid', label: 'flowColor' },
        { key: 'light', label: 'lightColor' }
      ];

      return h(React.Fragment, null,
        h('div', { className: 'pw-editor-backdrop', onClick: onClose, 'aria-hidden': 'true' }),
        h('aside', {
          className: 'pw-editor',
          id: 'pw-editor',
          role: 'region',
          'aria-label': tr('editorLabel')
        },
          h('div', { className: 'pw-editor-head' },
            h('h2', { className: 'pw-editor-title' }, tr('customize')),
            h('button', {
              type: 'button',
              className: 'pw-icon-btn',
              onClick: onClose,
              'aria-label': tr('close')
            }, h(IconClose))
          ),
          h('label', { className: 'pw-field' },
            h('span', { className: 'pw-label' }, tr('titleLabel')),
            h('input', {
              ref: titleRef,
              className: 'pw-input',
              type: 'text',
              value: poster.title,
              maxLength: 120,
              placeholder: tr('titlePlaceholder'),
              onChange: function (event) { onChange({ title: event.target.value }); }
            })
          ),
          h('label', { className: 'pw-field' },
            h('span', { className: 'pw-label' }, tr('textLabel')),
            h('textarea', {
              className: 'pw-textarea',
              value: poster.text,
              maxLength: 220,
              rows: 3,
              placeholder: tr('textPlaceholder'),
              onChange: function (event) { onChange({ text: event.target.value }); }
            })
          ),
          h('fieldset', { className: 'pw-colors' },
            h('legend', { className: 'pw-legend' }, tr('colorsLabel')),
            paletteKeys.map(function (entry) {
              return h('label', { className: 'pw-color-row', key: entry.key },
                h('input', {
                  type: 'color',
                  className: 'pw-color-input',
                  value: poster.colors[entry.key],
                  'aria-label': tr(entry.label),
                  onChange: function (event) {
                    const colors = Object.assign({}, poster.colors);
                    colors[entry.key] = event.target.value;
                    onChange({ colors: colors });
                  }
                }),
                h('span', { className: 'pw-color-name' }, tr(entry.label)),
                h('code', { className: 'pw-color-hex' }, poster.colors[entry.key].toUpperCase())
              );
            })
          ),
          h('div', { className: 'pw-presets' },
            h('div', { className: 'pw-legend' }, tr('presetsLabel')),
            h('div', { className: 'pw-preset-row', role: 'group', 'aria-label': tr('presetsLabel') },
              PALETTES.map(function (palette) {
                const active = palette.base === poster.colors.base && palette.mid === poster.colors.mid && palette.light === poster.colors.light;
                return h('button', {
                  type: 'button',
                  className: 'pw-preset',
                  key: palette.id,
                  title: tr(palette.nameKey),
                  'aria-label': tr(palette.nameKey),
                  'aria-pressed': active,
                  onClick: function () {
                    onChange({ colors: { base: palette.base, mid: palette.mid, light: palette.light } });
                  }
                }, h('span', {
                  style: {
                    background: 'linear-gradient(135deg,' + palette.base + ' 0%,' + palette.mid + ' 55%,' + palette.light + ' 100%)'
                  }
                }));
              })
            )
          ),
          h('button', {
            type: 'button',
            className: 'pw-reset',
            onClick: onReset
          }, tr('reset'))
        )
      );
    }

    function PosterWorkbench(props) {
      const ctx = props.ctx;
      const tr = props.tr;
      const locale = useSyncExternalStore(
        function (listener) { return ctx.locale.subscribe(listener); },
        function () { return ctx.locale.getSnapshot(); },
        function () { return ctx.locale.getSnapshot(); }
      );
      const [poster, setPoster] = useState(loadPoster);
      const [editing, setEditing] = useState(false);
      const [busy, setBusy] = useState(false);
      const [notice, setNotice] = useState('');
      const customizeRef = useRef(null);
      const dir = locale && locale.active === 'ar' ? 'rtl' : 'ltr';

      useEffect(function () {
        savePoster(poster);
      }, [poster]);

      useEffect(function () {
        if (!notice) return undefined;
        const timer = window.setTimeout(function () { setNotice(''); }, 2600);
        return function () { window.clearTimeout(timer); };
      }, [notice]);

      useEffect(function () {
        if (!editing) return undefined;
        function onKey(event) {
          if (event.key === 'Escape') {
            setEditing(false);
            window.requestAnimationFrame(function () {
              if (customizeRef.current) customizeRef.current.focus();
            });
          }
        }
        window.addEventListener('keydown', onKey);
        return function () { window.removeEventListener('keydown', onKey); };
      }, [editing]);

      function update(patch) {
        setPoster(function (current) { return normalisePoster(Object.assign({}, current, patch)); });
      }

      function reset() {
        setPoster(normalisePoster(DEFAULT_POSTER));
      }

      async function download() {
        if (busy) return;
        setBusy(true);
        setNotice('');
        try {
          await ensurePosterFonts();
          const width = 1600;
          const height = 2000;
          const background = document.createElement('canvas');
          background.width = width;
          background.height = height;
          const palette = shaderPalette(poster.colors);
          const renderer = createFluidRenderer(background, { preserveDrawingBuffer: true });
          let source = background;
          if (renderer) {
            renderer.resize(width, height);
            renderer.draw(17.4, palette, 0.8);
          } else {
            source = document.createElement('canvas');
            source.width = width;
            source.height = height;
            const fallback = source.getContext('2d');
            if (!fallback) throw new Error('Canvas export unavailable');
            paintFallbackBackground(fallback, width, height, palette);
          }
          const output = document.createElement('canvas');
          output.width = width;
          output.height = height;
          const out = output.getContext('2d');
          if (!out) throw new Error('Canvas export unavailable');
          out.drawImage(source, 0, 0);
          drawPosterInk(out, width, height, poster, { clear: false });
          if (renderer) renderer.dispose();
          const blob = await new Promise(function (resolve) {
            output.toBlob(function (value) { resolve(value); }, 'image/png');
          });
          if (!blob) throw new Error('PNG encoding failed');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = posterFilename(poster.title);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          setNotice(tr('downloaded'));
        } catch (error) {
          console.error('[poster-workbench] export failed', error);
          setNotice(tr('exportFailed'));
        } finally {
          setBusy(false);
        }
      }

      return h('div', { className: 'pw-root', dir: dir },
        h('style', null, FONT_CSS + STYLES),
        h('div', { className: 'pw-stage' },
          h('div', { className: 'pw-actions' },
            h('button', {
              ref: customizeRef,
              type: 'button',
              className: 'pw-btn',
              'aria-expanded': editing,
              'aria-controls': 'pw-editor',
              onClick: function () { setEditing(function (value) { return !value; }); }
            }, h(IconSliders), h('span', null, tr('customize'))),
            h('button', {
              type: 'button',
              className: 'pw-btn pw-btn-primary',
              disabled: busy,
              title: tr('downloadLabel'),
              'aria-label': tr('downloadLabel'),
              onClick: download
            }, h(IconDownload), h('span', null, busy ? tr('rendering') : tr('download')))
          ),
          h(PosterCanvas, { poster: poster, tr: tr })
        ),
        editing ? h(PosterEditor, {
          tr: tr,
          poster: poster,
          onChange: update,
          onClose: function () {
            setEditing(false);
            window.requestAnimationFrame(function () {
              if (customizeRef.current) customizeRef.current.focus();
            });
          },
          onReset: reset
        }) : null,
        notice ? h('div', { className: 'pw-notice', role: 'status' }, notice) : null
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(function () {
          const disposers = [
            ctx.locale.register('posterWorkbench', 'en', DICT_EN),
            ctx.locale.register('posterWorkbench', 'ar', DICT_AR),
            ctx.locale.register('posterWorkbench', 'zh', DICT_ZH)
          ];
          return function () {
            for (let i = 0; i < disposers.length; i += 1) disposers[i]();
          };
        });

        const bound = ctx.locale.bind('posterWorkbench');
        function tr(key) {
          const value = bound(key);
          return value === key ? (DICT_EN[key] || key) : value;
        }

        ctx.slots.inject('conversation.view', function () {
          return ctx.slots.register({
            name: 'conversation.view',
            id: 'poster-workbench',
            order: 20,
            label: function () { return tr('viewLabel'); }
          }, function (props) {
            return h(PosterWorkbench, Object.assign({}, props, { ctx: ctx, tr: tr }));
          });
        });
      }
    };
  }
});
