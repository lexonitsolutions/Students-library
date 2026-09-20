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
      return {
        viewportHeight: 0,
        keyboardHeight: 0,
        isKeyboardOpen: false,
        offsetTop: 0,
      };
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

    let baseLayoutHeight = window.innerHeight;

    const syncKeyboardState = () => {
      const vv = window.visualViewport;
      const currentVisualHeight = vv ? vv.height : window.innerHeight;
      const layoutHeight = window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;

      const isInputActive = Boolean(
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')
      );

      // Height difference between full layout and visible viewport
      const visualDiff = Math.max(0, layoutHeight - currentVisualHeight);
      const baseDiff = Math.max(0, baseLayoutHeight - currentVisualHeight);
      const effectiveDiff = Math.max(visualDiff, baseDiff);

      // The keyboard height that overlays the layout viewport:
      let kbHeight = visualDiff;

      // If layout viewport didn't shrink but input is focused and effectiveDiff > 100:
      if (kbHeight < 100 && isInputActive && effectiveDiff > 100) {
        kbHeight = effectiveDiff;
      }

      const isOpen = isInputActive || effectiveDiff > 100;

      // If keyboard is closed and no input is focused, refresh baseline
      if (!isInputActive && effectiveDiff < 60) {
        baseLayoutHeight = Math.max(baseLayoutHeight, window.innerHeight, currentVisualHeight);
        kbHeight = 0;
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
        `${Math.round(kbHeight)}px`
      );

      setState({
        viewportHeight: currentVisualHeight,
        keyboardHeight: Math.round(kbHeight),
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
      baseLayoutHeight = 0;
      setTimeout(syncKeyboardState, 150);
    }, { passive: true });

    // When an input/textarea is focused, animate-track for 650ms to catch every stage of keyboard opening
    let animId: number | null = null;
    const startContinuousSync = () => {
      if (animId) cancelAnimationFrame(animId);
      const startTime = performance.now();
      const loop = () => {
        syncKeyboardState();
        if (performance.now() - startTime < 650) {
          animId = requestAnimationFrame(loop);
        } else {
          animId = null;
        }
      };
      animId = requestAnimationFrame(loop);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        startContinuousSync();
        setTimeout(() => {
          if (window.scrollY !== 0) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
          syncKeyboardState();
        }, 80);
      }
    };

    const handleFocusOut = () => {
      startContinuousSync();
    };

    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('focusout', handleFocusOut, { passive: true });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (vv) {
        vv.removeEventListener('resize', syncKeyboardState);
        vv.removeEventListener('scroll', syncKeyboardState);
      }
      window.removeEventListener('resize', syncKeyboardState);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);

      document.documentElement.style.removeProperty('--visual-viewport-height');
      document.documentElement.style.removeProperty('--visual-viewport-offset-top');
      document.documentElement.style.removeProperty('--keyboard-height');
    };
  }, []);

  return state;
}
