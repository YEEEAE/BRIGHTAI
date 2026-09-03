/**
 * SiteBackground — page-level background for every dashboard surface.
 *
 * Uses the self-hosted BRIGHTAI DotLottie artwork. Its WASM runtime stays
 * same-origin so the dashboard keeps its strict CSP without a CDN exception.
 * Geometry matches src/components/SiteBackground.astro exactly.
 */
'use client';

import { useEffect, useRef } from 'react';
import styles from './SiteBackground.module.css';

export default function SiteBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let player: { destroy?: () => void } | undefined;
    void import('@lottiefiles/dotlottie-web').then(({ DotLottie }) => {
      if (disposed) return;
      DotLottie.setWasmUrl('/media/dotlottie-player.wasm');
      player = new DotLottie({
        canvas,
        src: '/media/brightai-background.lottie',
        autoplay: true,
        loop: true,
        layout: { fit: 'contain', align: [0.5, 0.5] },
        renderConfig: {
          autoResize: true,
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          freezeOnOffscreen: false,
        },
      });
    });

    return () => {
      disposed = true;
      player?.destroy?.();
    };
  }, []);

  return (
    <div className={styles.background} aria-hidden="true">
      <canvas ref={ref} className={styles.canvas} tabIndex={-1} />
    </div>
  );
}
