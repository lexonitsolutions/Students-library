import { Search, X, School, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { cn } from '../../lib/cn';
import { searchColleges, type CollegeSuggestion } from '../../services/collegeService';

export interface CollegeAutocompleteProps {
  readonly label?: string;
  readonly name?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly initialValue?: string;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly onSelect?: (college: CollegeSuggestion | { name: string; id: string }) => void;
  readonly className?: string;
}

export function CollegeAutocomplete({
  label,
  name = 'college',
  placeholder = 'Enter your college name',
  required,
  initialValue = '',
  value: controlledValue,
  onChange: controlledOnChange,
  onSelect,
  className,
}: Readonly<CollegeAutocompleteProps>) {
  const id = useId();
  const listId = `${id}-listbox`;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(initialValue);
  const inputValue = isControlled ? controlledValue : internalValue;

  const [suggestions, setSuggestions] = useState<CollegeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef<boolean>(false);

  // Sync internal value if initialValue changes
  useEffect(() => {
    if (!isControlled && initialValue) {
      setInternalValue(initialValue);
    }
  }, [initialValue, isControlled]);

  const updateValue = useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    controlledOnChange?.(newValue);
  }, [isControlled, controlledOnChange]);

  // Execute search via backend proxy
  const performSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    // Cancel any previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const results = await searchColleges(trimmed, controller.signal);
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setIsLoading(false);
        setHasSearched(true);
        setIsOpen(true);
        setActiveIndex(-1);
      }
    } catch {
      if (!controller.signal.aborted) {
        setSuggestions([]);
        setIsLoading(false);
        setHasSearched(true);
        setIsOpen(true);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    justSelectedRef.current = false;
    updateValue(nextVal);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (nextVal.trim().length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    // 400ms debounce as required
    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearch(nextVal);
    }, 400);
  };

  const handleSelect = (college: CollegeSuggestion | { name: string; id: string }) => {
    justSelectedRef.current = true;
    updateValue(college.name);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setIsLoading(false);
    onSelect?.(college);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    justSelectedRef.current = false;
    updateValue('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setIsLoading(false);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && inputValue.trim().length >= 2) {
        e.preventDefault();
        performSearch(inputValue);
      }
      return;
    }

    const totalOptions = suggestions.length + (inputValue.trim() ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        } else if (activeIndex === suggestions.length && inputValue.trim()) {
          handleSelect({ name: inputValue.trim(), id: `custom-${Date.now()}` });
        } else if (suggestions.length > 0) {
          handleSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-on-surface">
          {label}
        </label>
      )}

      {/* Hidden input for standard HTML form submission */}
      {name && (
        <input type="hidden" name={name} value={inputValue} required={required} />
      )}

      <div className="relative">
        {/* Left search/loader icon */}
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-on-surface-variant/60">
          {isLoading ? (
            <Loader2 size={15} className="animate-spin text-primary" />
          ) : (
            <Search size={15} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!justSelectedRef.current && inputValue.trim().length >= 2) {
              performSearch(inputValue);
            }
          }}
          className={cn(
            'h-10 w-full rounded-lg bg-surface-container-lowest border border-card-border pl-9 pr-9 text-sm text-on-surface placeholder:text-on-surface-variant/40 shadow-2xs',
            'transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none',
            isOpen && 'rounded-b-none border-primary',
          )}
        />

        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            aria-label="Clear college name"
            onClick={handleClear}
            className="absolute inset-y-0 right-2.5 flex items-center text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}

        {/* Suggestion Dropdown */}
        {isOpen && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="College suggestions"
            className={cn(
              'absolute left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-b-lg',
              'border border-t-0 border-primary bg-white shadow-card-hover dark:bg-surface-container-low dark:border-primary',
            )}
          >
            {suggestions.map((college, index) => (
              <li
                key={college.id || `${college.name}-${index}`}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(college)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-body-sm text-on-surface transition-colors duration-100',
                  index === activeIndex
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-surface-container-low dark:hover:bg-surface-container',
                  index !== suggestions.length - 1 && 'border-b border-card-border/50',
                )}
              >
                <School
                  size={15}
                  className={cn(
                    'shrink-0',
                    index === activeIndex ? 'text-primary' : 'text-outline',
                  )}
                />
                <span className="truncate flex-1">{college.name}</span>
              </li>
            ))}

            {/* No colleges found state */}
            {hasSearched && !isLoading && suggestions.length === 0 && (
              <li
                className="px-4 py-3 text-body-sm text-on-surface-variant text-center select-none"
              >
                No colleges found
              </li>
            )}

            {/* Custom typed option if not exact match */}
            {inputValue.trim().length > 0 &&
              !suggestions.some((s) => s.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                <li
                  id={`${listId}-option-${suggestions.length}`}
                  role="option"
                  aria-selected={activeIndex === suggestions.length}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    handleSelect({
                      name: inputValue.trim(),
                      id: `custom-${Date.now()}`,
                    })
                  }
                  className={cn(
                    'flex cursor-pointer items-center gap-3 border-t border-card-border/50 px-4 py-2.5 text-body-sm transition-colors',
                    activeIndex === suggestions.length
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'bg-surface-container-low/50 text-on-surface-variant hover:bg-surface-container',
                  )}
                >
                  <Search size={14} className="shrink-0 text-primary" />
                  <span className="truncate">
                    Use &ldquo;<span className="font-semibold text-on-surface">{inputValue.trim()}</span>&rdquo; as college name
                  </span>
                </li>
              )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CollegeAutocomplete;
