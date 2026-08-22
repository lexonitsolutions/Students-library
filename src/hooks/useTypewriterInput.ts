import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export function useTypewriterInput(initialValue: string = '', speedMs: number = 30) {
  const [actualValue, setActualValue] = useState(initialValue);
  const [displayedValue, setDisplayedValue] = useState(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If actualValue has new text appended (user typed or pasted)
    if (actualValue.length > displayedValue.length) {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setDisplayedValue((prev) => {
          if (prev.length < actualValue.length) {
            return actualValue.slice(0, prev.length + 1);
          }
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        });
      }, speedMs);
    } else {
      // Deleting / Backspace / Reset — update displayedValue immediately
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedValue(actualValue);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [actualValue, displayedValue.length, speedMs]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setActualValue(newVal);
  };

  return {
    value: displayedValue,
    actualValue,
    onChange: handleChange,
    setValue: setActualValue,
  };
}

export default useTypewriterInput;
