'use client';

import { useEffect } from 'react';

function hasBlockingLayer() {
  return Boolean(document.querySelector(
    '.mobile-action-sheet-backdrop, .command-palette-backdrop, .bm-dialog-backdrop, .first-use-overlay, .efhub-visual-calibrator.is-fullscreen'
  ));
}

export function MobileScrollRecovery() {
  useEffect(() => {
    const restorePageScroll = () => {
      if (hasBlockingLayer()) return;
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.body.classList.remove('efhub-calibrator-body-lock');
    };
    restorePageScroll();
    window.addEventListener('pageshow', restorePageScroll);
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') restorePageScroll(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pageshow', restorePageScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
  return null;
}
