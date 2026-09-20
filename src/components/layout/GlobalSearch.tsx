import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  FileText,
  Headphones,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedInput } from '../ui/AnimatedInput';
import { useAuth } from '../../hooks/useAuth';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';
import { listApprovedMaterials } from '../../services/materialsService';

// ─── Types ───────────────────────────────────────────────────────────────────
type SectionKey = 'Materials' | 'Past Papers' | 'Assignments' | 'Library' | 'Settings' | 'Profile';

interface Suggestion {
  id: string;
  label: string;
  subtitle?: string;
  section: SectionKey;
  href: string;
  icon: React.ReactNode;
}

// ─── Section Config ───────────────────────────────────────────────────────────
const SECTION_ORDER: SectionKey[] = ['Materials', 'Past Papers', 'Assignments', 'Library', 'Settings', 'Profile'];

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  'Materials': <FileText size={13} />,
  'Past Papers': <FileQuestion size={13} />,
  'Assignments': <ClipboardList size={13} />,
  'Library': <BookOpen size={13} />,
  'Settings': <Settings size={13} />,
  'Profile': <User size={13} />,
};

// Static suggestions for non-material sections
const STATIC_SUGGESTIONS: Suggestion[] = [
  { id: 'lib-saved', label: 'Saved Materials', subtitle: 'Your bookmarked content', section: 'Library', href: '/library', icon: <BookOpen size={15} /> },
  { id: 'lib-recent', label: 'Recently Viewed', subtitle: 'Materials you opened recently', section: 'Library', href: '/library', icon: <BookOpen size={15} /> },
  { id: 'set-account', label: 'Account Settings', subtitle: 'Change name, email, avatar', section: 'Settings', href: '/settings', icon: <Settings size={15} /> },
  { id: 'set-notif', label: 'Notification Settings', subtitle: 'Manage your alerts', section: 'Settings', href: '/settings', icon: <Settings size={15} /> },
  { id: 'set-theme', label: 'Theme & Appearance', subtitle: 'Light or Dark mode', section: 'Settings', href: '/settings', icon: <Settings size={15} /> },
  { id: 'supp-cust', label: 'Customer Support', subtitle: 'Student help desk, ticket submission & FAQ', section: 'Settings', href: '/support', icon: <Headphones size={15} /> },
  { id: 'pro-edit', label: 'Edit Profile', subtitle: 'Update your information', section: 'Profile', href: '/profile', icon: <User size={15} /> },
  { id: 'pro-uploads', label: 'My Uploads', subtitle: 'Files you have uploaded', section: 'Profile', href: '/profile/uploads', icon: <User size={15} /> },
];

// ─── Fuzzy Match ─────────────────────────────────────────────────────────────
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'k')
    .replace(/wh/g, 'w')
    .replace(/th/g, 't')
    .replace(/[àáâãä]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u');
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = normalize(text);
  const q = normalize(query.trim());
  if (!q) return false;
  if (t.includes(q)) return true;
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const found = t.indexOf(q[qi], ti);
    if (found === -1) return false;
    ti = found + 1;
  }
  return true;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GlobalSearch() {
  const { isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCacheRef = useRef<Map<string, Suggestion[]>>(new Map());

  // Debounced real DB search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (searchCacheRef.current.has(cacheKey)) {
      setSuggestions(searchCacheRef.current.get(cacheKey)!);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const rows = await listApprovedMaterials({ search: trimmed, limit: 20 });
        const dbSuggestions: Suggestion[] = rows.map((m) => {
          const section: SectionKey =
            m.type === 'past-paper' ? 'Past Papers' :
            m.type === 'doc' ? 'Assignments' :
            'Materials';
          return {
            id: m.id,
            label: m.title,
            subtitle: `${m.subject}${m.semester ? ' · ' + m.semester : ''}`,
            section,
            href: `/materials/${m.id}`,
            icon: SECTION_ICONS[section],
          };
        });
        const staticMatches = STATIC_SUGGESTIONS.filter((s) =>
          fuzzyMatch(`${s.label} ${s.subtitle ?? ''}`, trimmed)
        );
        const results = [...dbSuggestions, ...staticMatches];
        searchCacheRef.current.set(cacheKey, results);
        setSuggestions(results);
      } catch {
        const staticMatches = STATIC_SUGGESTIONS.filter((s) =>
          fuzzyMatch(`${s.label} ${s.subtitle ?? ''}`, trimmed)
        );
        setSuggestions(staticMatches);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Group by section in priority order
  const grouped = SECTION_ORDER.reduce<Record<SectionKey, Suggestion[]>>((acc, key) => {
    acc[key] = suggestions.filter((s) => s.section === key);
    return acc;
  }, {} as Record<SectionKey, Suggestion[]>);

  // Flat ordered list for keyboard nav
  const flatSuggestions = SECTION_ORDER.flatMap((k) => grouped[k]);

  const handleSelect = (s: Suggestion) => {
    if (isExploring && s.href.startsWith('/materials/')) {
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
      openSignupModal(s.href);
      return;
    }
    navigate(s.href);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || flatSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(flatSuggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset active index on new query
  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl 2xl:max-w-3xl">
      {/* Search Input Box */}
      <div
        className={`flex items-center rounded-xl border px-1 py-1 transition-all duration-200 bg-surface-container-low
          ${open && query ? 'border-primary ring-2 ring-primary/20' : 'border-card-border hover:border-primary/40'}
        `}
      >
        <AnimatedInput
          ref={inputRef}
          type="search"
          icon={<Search size={16} className="text-on-surface-variant" />}
          placeholder="Search materials, subjects, authors..."
          aria-label="Global search"
          className="w-full bg-transparent text-body-sm text-on-surface outline-none placeholder:text-outline [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden pl-10 pr-8 py-1.5"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
            className="shrink-0 rounded-full p-0.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-card-border bg-surface-container-low shadow-2xl"
          >
            {flatSuggestions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Search size={28} className="text-on-surface-variant/40" />
                <p className="text-body-md font-semibold text-on-surface">No results found</p>
                <p className="text-body-sm text-on-surface-variant">
                  Try different keywords or check the spelling.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {SECTION_ORDER.map((section) => {
                  const items = grouped[section];
                  if (items.length === 0) return null;
                  return (
                    <div key={section}>
                      {/* Section heading */}
                      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                        <span className="text-on-surface-variant">{SECTION_ICONS[section]}</span>
                        <p className="text-label-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
                          {section}
                        </p>
                      </div>

                      {/* Items */}
                      {items.map((s) => {
                        const flatIdx = flatSuggestions.indexOf(s);
                        const isActive = flatIdx === activeIdx;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onMouseEnter={() => setActiveIdx(flatIdx)}
                            onClick={() => handleSelect(s)}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer
                              ${isActive ? 'bg-primary/8 text-primary' : 'text-on-surface hover:bg-surface-container'}
                            `}
                          >
                            <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                              {s.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-body-sm font-semibold">{s.label}</p>
                              {s.subtitle && (
                                <p className="truncate text-label-sm text-on-surface-variant">{s.subtitle}</p>
                              )}
                            </div>
                            <span className="shrink-0 rounded-md bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                              {section}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                <div className="border-t border-card-border/60 mx-4 mt-2 pt-2 pb-1">
                  <p className="text-label-xs text-on-surface-variant/60">
                    ↑ ↓ to navigate · Enter to select · Esc to close
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
