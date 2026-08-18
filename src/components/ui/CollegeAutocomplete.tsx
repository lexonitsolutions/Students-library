import { Search, X, School, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { INDIAN_COLLEGES } from '../../data/indianColleges';
import { cn } from '../../lib/cn';

interface CollegeAutocompleteProps {
  readonly label?: string;
  readonly name?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly initialValue?: string;
}

/** Search local Indian colleges dataset + fallback to public API */
function searchLocalColleges(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return INDIAN_COLLEGES.filter((college) => {
    const lower = college.toLowerCase();
    return lower.includes(q);
  }).slice(0, 12);
}

/** Hipolabs Universities API with silent error handling */
async function fetchIndianCollegesApi(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout
    const url = `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&country=India`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ name: string }>;
    return data.map((item) => item.name);
  } catch {
    return [];
  }
}

export function CollegeAutocomplete({
  label,
  name = 'college',
  placeholder = 'Enter your college name',
  required,
  initialValue = '',
}: Readonly<CollegeAutocompleteProps>) {
  const id = useId();
  const listId = `${id}-listbox`;

  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // 1. Instantly get local matches for 0ms speed
    const localMatches = searchLocalColleges(trimmed);
    setSuggestions(localMatches);
    setIsOpen(localMatches.length > 0 || trimmed.length >= 2);
    setActiveIndex(-1);

    // 2. Fetch API in background if query is 2+ chars
    if (trimmed.length >= 2) {
      setIsLoading(true);
      const apiMatches = await fetchIndianCollegesApi(trimmed);
      setIsLoading(false);

      if (apiMatches.length > 0) {
        const combined = [...new Set([...localMatches, ...apiMatches])].slice(0, 15);
        setSuggestions(combined);
        setIsOpen(combined.length > 0);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Instantly show local results
    const localMatches = searchLocalColleges(value);
    setSuggestions(localMatches);
    setIsOpen(value.trim().length > 0);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getSuggestions(value).catch(() => {});
    }, 250);
  };

  const handleSelect = (value: string) => {
    setInputValue(value);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

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

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-label-md text-on-surface-variant">
          {label}
        </label>
      )}

      {/* Hidden input carries the actual form value */}
      <input type="hidden" name={name} value={inputValue} required={required} />

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-outline">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : (
            <Search size={16} />
          )}
        </div>

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
            if (inputValue.trim()) {
              const matches = searchLocalColleges(inputValue);
              setSuggestions(matches);
              setIsOpen(true);
            }
          }}
          className={cn(
            'h-12 w-full rounded-lg bg-surface-soft pl-10 pr-10 text-body-md text-on-surface placeholder:text-outline',
            'border border-transparent transition-colors duration-150',
            'focus:bg-white focus:border-primary-container focus:outline-none',
            isOpen && 'rounded-b-none border-primary-container bg-white',
          )}
        />

        {inputValue && (
          <button
            type="button"
            aria-label="Clear college name"
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {isOpen && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="College suggestions"
            className={cn(
              'absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-b-lg',
              'border border-t-0 border-primary-container bg-white shadow-card-hover',
            )}
          >
            {suggestions.map((college, index) => (
              <li
                key={college}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(college)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-body-sm text-on-surface transition-colors duration-100',
                  index === activeIndex
                    ? 'bg-primary-container/10 text-primary font-medium'
                    : 'hover:bg-surface-container-low',
                  index !== suggestions.length - 1 && 'border-b border-card-border/50',
                )}
              >
                <School
                  size={14}
                  className={cn(
                    'shrink-0',
                    index === activeIndex ? 'text-primary' : 'text-outline',
                  )}
                />
                <span className="truncate">{college}</span>
              </li>
            ))}

            {/* "Use as typed" custom entry option */}
            {inputValue.trim().length > 0 && !suggestions.includes(inputValue.trim()) && (
              <li
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(inputValue.trim())}
                className="flex cursor-pointer items-center gap-3 border-t border-card-border/50 bg-surface-container-low px-4 py-2.5 text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <Search size={14} className="shrink-0 text-primary" />
                <span>
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
