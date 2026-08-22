/**
 * Global Smooth Text-Entry Animation System
 *
 * Patches HTMLInputElement and HTMLTextAreaElement value descriptors to intercept text entry globally.
 * When text is typed or appended into ANY input, textarea, search box, or form field across the entire application,
 * the DOM visible text animates character-by-character with a smooth, visually noticeable typewriter effect,
 * while maintaining 100% accurate state, validation, and cursor positions.
 */

interface AnimatedElement extends HTMLElement {
  _targetValue?: string;
  _isAnimating?: boolean;
  _animationTimer?: number | NodeJS.Timeout;
}

function isTextInput(el: HTMLElement): boolean {
  const tagName = el.tagName;
  if (tagName === 'TEXTAREA') return true;
  if (tagName === 'INPUT') {
    const inputEl = el as HTMLInputElement;
    const type = (inputEl.type || 'text').toLowerCase();
    const excludedTypes = ['checkbox', 'radio', 'file', 'range', 'color', 'submit', 'button', 'reset', 'image', 'hidden'];
    return !excludedTypes.includes(type);
  }
  return false;
}

export function initGlobalTextAnimation(): void {
  if (typeof window === 'undefined') return;

  const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const textareaDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');

  if (!inputDescriptor || !textareaDescriptor) return;

  const originalInputGet = inputDescriptor.get;
  const originalInputSet = inputDescriptor.set;
  const originalTextareaGet = textareaDescriptor.get;
  const originalTextareaSet = textareaDescriptor.set;

  function animateDomText(
    el: AnimatedElement & (HTMLInputElement | HTMLTextAreaElement),
    originalSet: (v: string) => void,
    startStr: string,
    targetStr: string
  ) {
    if (el._animationTimer) clearInterval(el._animationTimer as number);
    el._isAnimating = true;
    el.setAttribute('data-typing-active', 'true');

    // Typewriter cadence: 28ms per character for a smooth, noticeable typewriter effect
    const STEP_INTERVAL_MS = 28;
    let currentLen = startStr.length;

    el._animationTimer = setInterval(() => {
      const actualTarget = el._targetValue ?? targetStr;
      const diff = actualTarget.length - currentLen;

      if (diff <= 0 || currentLen >= actualTarget.length) {
        if (el._animationTimer) clearInterval(el._animationTimer as number);
        el._isAnimating = false;
        el.removeAttribute('data-typing-active');
        if (originalSet) originalSet.call(el, actualTarget);
        return;
      }

      // Stream large text pastes smoothly
      let increment = 1;
      if (diff > 20) {
        increment = Math.max(1, Math.ceil(diff / 8));
      }

      currentLen = Math.min(actualTarget.length, currentLen + increment);
      const nextVal = actualTarget.slice(0, currentLen);

      if (originalSet) originalSet.call(el, nextVal);

      // Preserve cursor position if active
      if (document.activeElement === el && el.setSelectionRange) {
        try {
          el.setSelectionRange(currentLen, currentLen);
        } catch {
          // Ignore for non-selection input types (e.g. email on mobile)
        }
      }
    }, STEP_INTERVAL_MS);
  }

  function applyPatch(
    proto: any,
    originalGet: (() => string) | undefined,
    originalSet: ((v: string) => void) | undefined
  ) {
    if (!originalGet || !originalSet) return;

    Object.defineProperty(proto, 'value', {
      get() {
        // Always return full target value to React & form validation
        if (this._targetValue !== undefined) {
          return this._targetValue;
        }
        return originalGet.call(this);
      },
      set(val: any) {
        const el = this as AnimatedElement & (HTMLInputElement | HTMLTextAreaElement);
        const strVal = String(val ?? '');

        // If not a text field, set directly
        if (!isTextInput(el)) {
          el._targetValue = strVal;
          originalSet.call(el, strVal);
          return;
        }

        const currentDomVal = originalGet.call(el) || '';
        el._targetValue = strVal;

        // If length decreased or equal (Backspace / Delete / Clear), update DOM immediately
        if (strVal.length <= currentDomVal.length) {
          if (el._animationTimer) clearInterval(el._animationTimer as number);
          el._isAnimating = false;
          el.removeAttribute('data-typing-active');
          originalSet.call(el, strVal);
          return;
        }

        // If length increased (typing / pasting), trigger smooth character-by-character animation
        animateDomText(el, originalSet, currentDomVal, strVal);
      },
      configurable: true,
      enumerable: true,
    });
  }

  applyPatch(HTMLInputElement.prototype, originalInputGet, originalInputSet);
  applyPatch(HTMLTextAreaElement.prototype, originalTextareaGet, originalTextareaSet);

  // Instant finish on blur so form submissions or focus changes never lose text
  window.addEventListener(
    'blur',
    (e: Event) => {
      if (e.target && isTextInput(e.target as HTMLElement)) {
        const el = e.target as AnimatedElement & (HTMLInputElement | HTMLTextAreaElement);
        if (el._animationTimer) clearInterval(el._animationTimer as number);
        if (el._targetValue !== undefined) {
          if (el.tagName === 'TEXTAREA' && originalTextareaSet) {
            originalTextareaSet.call(el, el._targetValue);
          } else if (originalInputSet) {
            originalInputSet.call(el, el._targetValue);
          }
        }
        el._isAnimating = false;
        el.removeAttribute('data-typing-active');
      }
    },
    true
  );
}

export default initGlobalTextAnimation;
