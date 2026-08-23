import { AnimatePresence, motion } from 'framer-motion';
import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  useState,
  useEffect,
  forwardRef,
} from 'react';

export interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  speedMs?: number;
  icon?: ReactNode;
}

export interface AnimatedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  speedMs?: number;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onInput,
      type = 'text',
      className = '',
      placeholder,
      disabled,
      readOnly,
      icon,
      inputMode: inputModeProp,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      String(value ?? defaultValue ?? '')
    );
    const [caretIndex, setCaretIndex] = useState<number>(
      String(value ?? defaultValue ?? '').length
    );

    const actualType = type === 'email' ? 'text' : type;
    const actualInputMode = type === 'email' ? 'email' : inputModeProp;

    useEffect(() => {
      if (value !== undefined) {
        const valStr = String(value ?? '');
        setInternalValue(valStr);
        setCaretIndex((prev) => Math.min(prev, valStr.length));
      }
    }, [value]);

    const updateCaret = (target: HTMLInputElement) => {
      requestAnimationFrame(() => {
        try {
          const sel = target.selectionStart;
          if (sel !== null && sel !== undefined) {
            setCaretIndex(sel);
          }
        } catch {
          // ignore
        }
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (value === undefined) {
        setInternalValue(val);
      }
      updateCaret(e.target);
      onChange?.(e);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      if (value === undefined) {
        setInternalValue(target.value);
      }
      updateCaret(target);
      if (onInput) {
        (onInput as (ev: React.FormEvent<HTMLInputElement>) => void)(e);
      }
    };

    const safeCaret = Math.max(0, Math.min(caretIndex, internalValue.length));
    const leftPart = internalValue.slice(0, safeCaret);
    const rightPart = internalValue.slice(safeCaret);

    const leftChars = leftPart.split('');
    const rightChars = rightPart.split('');

    let paddingLeft = 'pl-3';
    if (className.includes('pl-12')) paddingLeft = 'pl-12';
    else if (className.includes('pl-11')) paddingLeft = 'pl-11';
    else if (className.includes('pl-10')) paddingLeft = 'pl-10';
    else if (className.includes('pl-9')) paddingLeft = 'pl-9';
    else if (className.includes('pl-8')) paddingLeft = 'pl-8';
    else if (className.includes('pl-7')) paddingLeft = 'pl-7';
    else if (className.includes('pl-6')) paddingLeft = 'pl-6';
    else if (className.includes('px-4') || className.includes('p-4')) paddingLeft = 'pl-4';
    else if (className.includes('px-3') || className.includes('p-3')) paddingLeft = 'pl-3';
    else if (icon) paddingLeft = 'pl-10';

    const paddingRight = className.includes('pr-10')
      ? 'pr-10'
      : className.includes('pr-12')
      ? 'pr-12'
      : className.includes('pr-8')
      ? 'pr-8'
      : className.includes('px-4') || className.includes('p-4')
      ? 'pr-4'
      : className.includes('px-3') || className.includes('p-3')
      ? 'pr-3'
      : 'pr-3';

    return (
      <div className="relative w-full flex items-center">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 z-20">
            {icon}
          </div>
        )}

        <input
          {...props}
          ref={ref}
          type={actualType}
          inputMode={actualInputMode}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={(e) => {
            setIsFocused(true);
            updateCaret(e.currentTarget);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onClick={(e) => {
            updateCaret(e.currentTarget);
            props.onClick?.(e);
          }}
          onKeyUp={(e) => {
            updateCaret(e.currentTarget);
            props.onKeyUp?.(e);
          }}
          onKeyDown={(e) => {
            updateCaret(e.currentTarget);
            props.onKeyDown?.(e);
          }}
          onSelect={(e) => {
            updateCaret(e.currentTarget);
            props.onSelect?.(e);
          }}
          className={`${className} !text-transparent caret-transparent selection:bg-indigo-500/30`}
        />

        {(internalValue.length > 0 || isFocused) && (
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center ${paddingLeft} ${paddingRight} text-sm font-medium text-inherit overflow-hidden whitespace-pre z-10 select-none`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {leftChars.map((char, index) => {
                const displayChar = type === 'password' ? '•' : char === ' ' ? '\u00A0' : char;
                return (
                  <motion.span
                    key={`left-${index}-${char}`}
                    initial={{ opacity: 0, y: 7, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    className="inline-block"
                  >
                    {displayChar}
                  </motion.span>
                );
              })}
            </AnimatePresence>

            {isFocused && (
              <motion.span
                key="active-caret"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block w-0.5 h-4 bg-indigo-400 rounded-sm shrink-0"
              />
            )}

            <AnimatePresence mode="popLayout" initial={false}>
              {rightChars.map((char, index) => {
                const displayChar = type === 'password' ? '•' : char === ' ' ? '\u00A0' : char;
                return (
                  <motion.span
                    key={`right-${index + safeCaret}-${char}`}
                    initial={{ opacity: 0, y: 7, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    className="inline-block"
                  >
                    {displayChar}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export const AnimatedTextarea = forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onInput,
      className = '',
      placeholder,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      String(value ?? defaultValue ?? '')
    );
    const [caretIndex, setCaretIndex] = useState<number>(
      String(value ?? defaultValue ?? '').length
    );

    useEffect(() => {
      if (value !== undefined) {
        const valStr = String(value ?? '');
        setInternalValue(valStr);
        setCaretIndex((prev) => Math.min(prev, valStr.length));
      }
    }, [value]);

    const updateCaret = (target: HTMLTextAreaElement) => {
      requestAnimationFrame(() => {
        try {
          const sel = target.selectionStart;
          if (sel !== null && sel !== undefined) {
            setCaretIndex(sel);
          }
        } catch {
          // ignore
        }
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (value === undefined) {
        setInternalValue(val);
      }
      updateCaret(e.target);
      onChange?.(e);
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      if (value === undefined) {
        setInternalValue(target.value);
      }
      updateCaret(target);
      if (onInput) {
        (onInput as (ev: React.FormEvent<HTMLTextAreaElement>) => void)(e);
      }
    };

    const safeCaret = Math.max(0, Math.min(caretIndex, internalValue.length));
    const leftPart = internalValue.slice(0, safeCaret);
    const rightPart = internalValue.slice(safeCaret);

    const leftChars = leftPart.split('');
    const rightChars = rightPart.split('');

    return (
      <div className="relative w-full">
        <textarea
          {...props}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={(e) => {
            setIsFocused(true);
            updateCaret(e.currentTarget);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onClick={(e) => {
            updateCaret(e.currentTarget);
            props.onClick?.(e);
          }}
          onKeyUp={(e) => {
            updateCaret(e.currentTarget);
            props.onKeyUp?.(e);
          }}
          onKeyDown={(e) => {
            updateCaret(e.currentTarget);
            props.onKeyDown?.(e);
          }}
          onSelect={(e) => {
            updateCaret(e.currentTarget);
            props.onSelect?.(e);
          }}
          className={`${className} !text-transparent caret-transparent selection:bg-indigo-500/30`}
        />

        {(internalValue.length > 0 || isFocused) && (
          <div className="pointer-events-none absolute inset-0 p-3 text-sm font-medium text-inherit overflow-hidden whitespace-pre-wrap z-10 select-none flex flex-wrap items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              {leftChars.map((char, index) => {
                const displayChar = char === ' ' ? '\u00A0' : char;
                return (
                  <motion.span
                    key={`left-${index}-${char}`}
                    initial={{ opacity: 0, y: 7, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    className="inline-block"
                  >
                    {displayChar}
                  </motion.span>
                );
              })}
            </AnimatePresence>

            {isFocused && (
              <motion.span
                key="active-caret"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block w-0.5 h-4 bg-indigo-400 rounded-sm shrink-0"
              />
            )}

            <AnimatePresence mode="popLayout" initial={false}>
              {rightChars.map((char, index) => {
                const displayChar = char === ' ' ? '\u00A0' : char;
                return (
                  <motion.span
                    key={`right-${index + safeCaret}-${char}`}
                    initial={{ opacity: 0, y: 7, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    className="inline-block"
                  >
                    {displayChar}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }
);

AnimatedTextarea.displayName = 'AnimatedTextarea';

export default AnimatedInput;
