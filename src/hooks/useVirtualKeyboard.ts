import { useEffect, useState } from 'react';

export interface VirtualKeyboardState {
  /** Current height of the visible viewport in pixels */
  viewportHeight: number;
  /** Estimated or reported height of the virtual keyboard in pixels */
  keyboardHeight: number;
  /** Boolean indicating if the mobile keypad is active */
  isKeyboardOpen: boolean;
  /** Visual viewport offset top (iOS Safari scroll) */
  offsetTop: number;
}

export function useVirtualKeyboard(): VirtualKeyboardState {
  const [state, setState] = useState<VirtualKeyboardState>(() => {
    if (typeof window === 'undefined') {
      return { viewportHeight: 0, keyboardHeight: 0, isKeyboardOpen: false, offsetTop: 0 };
    }
    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const offsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
    return {
      viewportHeight: currentHeight,
      keyboardHeight: 0,
      isKeyboardOpen: false,
      offsetTop,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track the uncompressed screen height (when keypad is closed)
    let maxKnownHeight = Math.max(
      window.innerHeight,
      window.visualViewport ? window.visualViewport.height : 0,
      window.screen ? window.screen.height : 0
    );

    const syncKeyboardState = () => {
      const vv = window.visualViewport;
      const currentVisualHeight = vv ? vv.height : window.innerHeight;
      const layoutHeight = window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;

      const isInputActive = Boolean(
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')
      );

      // On Android without resize or on iOS: diff between layoutHeight and visualHeight
      const visualDiff = Math.max(0, layoutHeight - currentVisualHeight);
      // On Android with resize: layoutHeight itself shrinks compared to maxKnownHeight
      const layoutDiff = Math.max(0, maxKnownHeight - currentVisualHeight);

      const effectiveDiff = Math.max(visualDiff, layoutDiff);
      const isOpen = isInputActive || effectiveDiff > 120;
      const detectedKbHeight = isOpen ? (effectiveDiff > 120 ? effectiveDiff : 280) : 0;

      // When no input is active and not compressed, refresh maxKnownHeight
      if (!isInputActive && effectiveDiff < 60) {
        maxKnownHeight = Math.max(maxKnownHeight, currentVisualHeight, window.innerHeight);
      }

      // Sync CSS variables immediately for zero-latency styling
      document.documentElement.style.setProperty(
        '--visual-viewport-height',
        `${Math.round(currentVisualHeight)}px`
      );
      document.documentElement.style.setProperty(
        '--visual-viewport-offset-top',
        `${Math.round(offsetTop)}px`
      );
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${Math.round(detectedKbHeight)}px`
      );

      setState({
        viewportHeight: currentVisualHeight,
        keyboardHeight: detectedKbHeight,
        isKeyboardOpen: isOpen,
        offsetTop,
      });
    };

    // Run immediately
    syncKeyboardState();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', syncKeyboardState, { passive: true });
      vv.addEventListener('scroll', syncKeyboardState, { passive: true });
    }

    window.addEventListener('resize', syncKeyboardState, { passive: true });
    window.addEventListener('orientationchange', () => {
      maxKnownHeight = 0;
      setTimeout(syncKeyboardState, 100);
    }, { passive: true });

    // Handle navigator.virtualKeyboard if supported (Chromium 94+)
    const navAny = navigator as unknown as {
      virtualKeyboard?: {
        overlaysContent?: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
    };

    if (navAny.virtualKeyboard?.addEventListener) {
      try {
        navAny.virtualKeyboard.overlaysContent = true;
        navAny.virtualKeyboard.addEventListener('geometrychange', syncKeyboardState);
      } catch {
        // Silently ignore if restricted
      }
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        syncKeyboardState();
        setTimeout(() => {
          if (window.scrollY !== 0) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
          syncKeyboardState();
        }, 60);
      }
    };

    const handleFocusOut = () => {
      setTimeout(syncKeyboardState, 60);
    };

    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('focusout', handleFocusOut, { passive: true });

    return () => {
      if (vv) {
        vv.removeEventListener('resize', syncKeyboardState);
        vv.removeEventListener('scroll', syncKeyboardState);
      }
      window.removeEventListener('resize', syncKeyboardState);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);

      if (navAny.virtualKeyboard?.removeEventListener) {
        try {
          navAny.virtualKeyboard.removeEventListener('geometrychange', syncKeyboardState);
        } catch {
          // ignore
        }
      }

      document.documentElement.style.removeProperty('--visual-viewport-height');
      document.documentElement.style.removeProperty('--visual-viewport-offset-top');
      document.documentElement.style.removeProperty('--keyboard-height');
    };
  }, []);

  return state;
}
