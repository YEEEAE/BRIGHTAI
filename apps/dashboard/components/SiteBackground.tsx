/**
 * SiteBackground — page-level background for every dashboard surface.
 *
 * Mirrors the contract shipping in the marketing site
 * (src/components/SiteBackground.astro) and the QC app
 * (apps/qc-task-manager/src/components/SystemBackground.astro): the approved
 * video at its native 1600x1200, centred, never scaled or cropped with `cover`,
 * `opacity: 1`, `filter: none`, no scrim, click-through, and hidden for print
 * and for readers who ask for reduced motion.
 *
 * The asset is copied into apps/dashboard/public/media by
 * scripts/sync-background-media.mjs at prebuild time.
 */
'use client';

import { useEffect, useRef } from 'react';
import styles from './SiteBackground.module.css';

export default function SiteBackground() {
  const ref = useRef<HTMLVideoElement>(null);

  // BAI-BG-VIDEO-002 (2026-08-29): the autoplay attribute alone leaves the video
  // loaded but paused once React inserts it after hydration, the same way Astro's
  // ClientRouter does on the marketing site. A rejected play() is a valid outcome
  // (blocked autoplay, reduced motion) and the poster covers it, so it is ignored.
  useEffect(() => {
    const video = ref.current;
    if (!video || !video.paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void video.play().catch(() => {});
  }, []);

  return (
    <div className={styles.background} aria-hidden="true">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- decorative, muted, no audio track */}
      <video
        ref={ref}
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/brightai-background-poster.jpg"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src="/media/brightai-background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
