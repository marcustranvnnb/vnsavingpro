import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { syncUserPrefCookie } from '../utils/cookieManager.js';
import {
  DISPLAY_MODES,
  DISPLAY_MODE_STORAGE_KEY,
  DUO_POSTURES,
  DUO_POSTURE_STORAGE_KEY,
  detectViewportMetrics,
  isValidDisplayMode,
  isValidDuoPosture,
} from './viewportMetrics.js';

export {
  DISPLAY_MODES,
  DISPLAY_MODE_STORAGE_KEY,
  DUO_POSTURES,
  DUO_POSTURE_STORAGE_KEY,
  detectViewportMetrics,
  isValidDisplayMode,
  isValidDuoPosture,
};

function readWindowSnapshot() {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 800,
      segments: null,
      horizontalSegments: false,
      verticalSegments: false,
      isCoarsePointer: false,
    };
  }
  const width = window.innerWidth || document.documentElement?.clientWidth || 1280;
  const height = window.innerHeight || document.documentElement?.clientHeight || 800;
  let segments = null;
  try {
    if (window.viewport && Array.isArray(window.viewport.segments)) {
      segments = window.viewport.segments;
    }
  } catch {
    segments = null;
  }
  let horizontalSegments = false;
  let verticalSegments = false;
  let isCoarsePointer = false;
  try {
    horizontalSegments = Boolean(window.matchMedia?.('(horizontal-viewport-segments: 2)')?.matches);
    verticalSegments = Boolean(window.matchMedia?.('(vertical-viewport-segments: 2)')?.matches);
    isCoarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
  } catch {
    // Ignore matchMedia errors
  }
  return { width, height, segments, horizontalSegments, verticalSegments, isCoarsePointer };
}

function readInitialPreference() {
  if (typeof window === 'undefined') return 'auto';
  try {
    const q = new URLSearchParams(window.location.search).get('layout');
    if (isValidDisplayMode(q)) return q;
  } catch {
    // Ignore URL parsing failures
  }
  return 'auto';
}

function readInitialPosture() {
  if (typeof window === 'undefined') return 'auto';
  try {
    const q = new URLSearchParams(window.location.search).get('posture');
    if (isValidDuoPosture(q)) return q;
  } catch {
    // Ignore URL parsing failures
  }
  return 'auto';
}

const DisplayModeCtx = createContext(null);

export function DisplayModeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readInitialPreference);
  const [duoPosturePref, setDuoPostureState] = useState(readInitialPosture);
  const [snapshot, setSnapshot] = useState(readWindowSnapshot);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let rafId = null;
    const update = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setSnapshot(readWindowSnapshot());
      });
    };

    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    window.visualViewport?.addEventListener?.('resize', update, { passive: true });

    const mqHoriz = window.matchMedia?.('(horizontal-viewport-segments: 2)');
    const mqVert = window.matchMedia?.('(vertical-viewport-segments: 2)');
    const mqPointer = window.matchMedia?.('(pointer: coarse)');
    mqHoriz?.addEventListener?.('change', update);
    mqVert?.addEventListener?.('change', update);
    mqPointer?.addEventListener?.('change', update);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener?.('resize', update);
      mqHoriz?.removeEventListener?.('change', update);
      mqVert?.removeEventListener?.('change', update);
      mqPointer?.removeEventListener?.('change', update);
    };
  }, []);

  const setPreference = useCallback((nextPref) => {
    const valid = isValidDisplayMode(nextPref) ? nextPref : 'auto';
    setPreferenceState(valid);
    try {
      window.localStorage?.setItem(DISPLAY_MODE_STORAGE_KEY, valid);
    } catch {
      // Ignore storage errors
    }
    syncUserPrefCookie({ displayMode: valid });
  }, []);

  const setDuoPosture = useCallback((nextPosture) => {
    const valid = isValidDuoPosture(nextPosture) ? nextPosture : 'auto';
    setDuoPostureState(valid);
    try {
      window.localStorage?.setItem(DUO_POSTURE_STORAGE_KEY, valid);
    } catch {
      // Ignore storage errors
    }
    syncUserPrefCookie({ duoPosture: valid });
  }, []);

  const resetAuto = useCallback(() => {
    setPreference('auto');
    setDuoPosture('auto');
  }, [setPreference, setDuoPosture]);

  const metrics = useMemo(
    () =>
      detectViewportMetrics({
        ...snapshot,
        preference,
        duoPosturePref,
      }),
    [snapshot, preference, duoPosturePref]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.layoutMode = metrics.mode;
    root.dataset.layoutPref = metrics.preference;
    root.dataset.duoPosture = metrics.duoPosture;
    root.dataset.coverScreen = String(metrics.isCoverScreen);
    root.dataset.forcedPreview = String(metrics.isPreviewConstrained);

    const maxWidthMap = {
      mobile: '460px',
      tablet: '940px',
      duo: '1360px',
      desktop: '1280px',
    };
    const gutterMap = {
      mobile: metrics.isCoverScreen ? '10px' : '14px',
      tablet: '20px',
      duo: '20px',
      desktop: '24px',
    };

    root.style.setProperty('--app-max-width', maxWidthMap[metrics.mode] || '1280px');
    root.style.setProperty('--app-gutter', gutterMap[metrics.mode] || '24px');
    root.style.setProperty('--duo-hinge-gap', `${metrics.hingeSize}px`);

    if (!metrics.isForced && metrics.hardwareFoldable && metrics.pane1Size && metrics.pane2Size && metrics.hardwarePosture === 'book') {
      root.style.setProperty('--duo-left-pane', `${metrics.pane1Size}px`);
      root.style.setProperty('--duo-right-pane', `${metrics.pane2Size}px`);
    } else {
      root.style.setProperty('--duo-left-pane', 'minmax(0, 1fr)');
      root.style.setProperty('--duo-right-pane', 'minmax(0, 1fr)');
    }

    if (!metrics.isForced && metrics.hardwareFoldable && metrics.pane1Size && metrics.hardwarePosture === 'tabletop') {
      root.style.setProperty('--duo-top-pane', `${metrics.pane1Size}px`);
    } else {
      root.style.setProperty('--duo-top-pane', '44dvh');
    }
  }, [metrics]);

  const value = useMemo(
    () => ({
      ...metrics,
      setPreference,
      setDuoPosture,
      resetAuto,
    }),
    [metrics, setPreference, setDuoPosture, resetAuto]
  );

  return <DisplayModeCtx.Provider value={value}>{children}</DisplayModeCtx.Provider>;
}

const DEFAULT_FALLBACK = {
  ...detectViewportMetrics({ width: 1280, height: 800 }),
  setPreference: () => {},
  setDuoPosture: () => {},
  resetAuto: () => {},
};

export function useDisplayMode() {
  return useContext(DisplayModeCtx) || DEFAULT_FALLBACK;
}
