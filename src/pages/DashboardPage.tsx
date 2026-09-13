import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, X, Upload, ChevronDown, Check } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { MaterialCard } from '../components/ui/MaterialCard';
import { MaterialRow } from '../components/ui/MaterialRow';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import { categories } from '../data/mockData';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import * as bookmarksService from '../services/bookmarksService';
import { listApprovedMaterialsForUI } from '../services/materialsService';
import { categoryIcon } from '../lib/materialIcons';
import { cn } from '../lib/cn';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);

  // Start with empty array; data is loaded from DB
  const [materials, setMaterials] = useState<Material[]>([]);



  // Restore category from URL search params (?category=...) or sessionStorage
  const [selectedCategory, setSelectedCategoryState] = useState<string>(() => {
    const fromUrl = searchParams.get('category');
    if (fromUrl && (fromUrl === 'materials' || fromUrl === 'past-paper' || fromUrl === 'doc')) {
      return fromUrl;
    }
    const fromStorage = sessionStorage.getItem('dashboard_category');
    if (fromStorage && (fromStorage === 'materials' || fromStorage === 'past-paper' || fromStorage === 'doc')) {
      return fromStorage;
    }
    return 'materials';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryDropdownOpen]);

  const setSelectedCategory = (categoryType: string) => {
    setSelectedCategoryState(categoryType);
    sessionStorage.setItem('dashboard_category', categoryType);
    setSearchParams({ category: categoryType }, { replace: true });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      let savedIds: Set<string> | undefined;
      if (user) {
        try {
          savedIds = await bookmarksService.listBookmarkedMaterialIds(user.id);
        } catch (e) {
          console.warn('Failed to load bookmarked IDs:', e);
        }
      }
      try {
        const data = await listApprovedMaterialsForUI({}, savedIds);
        if (active && data && data.length > 0) {
          setMaterials(data);
        }
      } catch (e) {
        console.warn('Failed to load materials from service:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const toggleSave = async (id: string) => {
    if (!user) return;
    const material = materials.find((item) => item.id === id);
    if (!material) return;
    const wasSaved = !!material.isSaved;
    const nextSaved = !wasSaved;
    setMaterials((prev) => prev.map((item) => (item.id === id ? { ...item, isSaved: nextSaved } : item)));
    if (wasSaved) {
      await bookmarksService.removeBookmark(id, user.id);
    } else {
      await bookmarksService.addBookmark(id, user.id);
    }
  };

  const getCategoryCount = (type: string): number => {
    if (type === 'materials' || type === 'pdf') {
      return materials.filter((m) => m.type === 'pdf' || m.type === 'notes').length;
    }
    if (type === 'doc') {
      return materials.filter((m) => m.type === 'doc' || m.type === 'slides').length;
    }
    return materials.filter((m) => m.type === type).length;
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesCategory =
      selectedCategory === 'materials' || selectedCategory === 'pdf'
        ? material.type === 'pdf' || material.type === 'notes'
        : selectedCategory === 'doc'
          ? material.type === 'doc' || material.type === 'slides'
          : material.type === selectedCategory;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      material.title.toLowerCase().includes(query) ||
      material.subject.toLowerCase().includes(query) ||
      material.uploaderName.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const recent = [...materials].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)).slice(0, 5);

  const selectedCategoryObj = categories.find((c) => c.type === selectedCategory);
  const selectedLabel = selectedCategoryObj ? selectedCategoryObj.label : 'Materials';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface">
            {getGreeting()}, {user?.name || user?.username || 'Student'}
          </h1>
          <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
            Let&apos;s continue your studies where you left off.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/upload')}
          icon={<Upload size={16} />}
          className="self-start sm:self-auto shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
        >
          <span>Upload</span> 
        </Button>
      </div>

      {/* Materials Category Segmented Control Tabs */}
      {(() => {
        const currentCat = categories.find((c) => c.type === selectedCategory) || categories[0];
        const CurrentCatIcon = categoryIcon[currentCat.icon] || FileText;
        const currentCatCount = getCategoryCount(currentCat.type);

        return (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-on-surface">Categories & Materials</h2>
            </div>

            {/* Mobile Dropdown Selector (sm:hidden) */}
            <div className="relative sm:hidden" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-card-border/80 bg-surface-container-high/60 px-3.5 py-2.5 shadow-2xs backdrop-blur-xs transition-all active:scale-[0.99] cursor-pointer"
                aria-expanded={categoryDropdownOpen}
                aria-label="Select category"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CurrentCatIcon size={16} strokeWidth={2.2} />
                  </div>
                  <span className="truncate text-xs font-semibold text-on-surface">
                    {currentCat.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                    {loading ? '...' : currentCatCount}
                  </span>
                </div>

                <ChevronDown
                  size={17}
                  className={cn(
                    'text-on-surface-variant transition-transform duration-200 shrink-0',
                    categoryDropdownOpen && 'rotate-180 text-primary'
                  )}
                />
              </button>

              <AnimatePresence>
                {categoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-2xl border border-card-border bg-surface-container-low p-1.5 shadow-xl backdrop-blur-md"
                  >
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const Icon = categoryIcon[category.icon] || FileText;
                        const count = getCategoryCount(category.type);
                        const isSelected = selectedCategory === category.type;

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category.type);
                              setSearchQuery('');
                              setCategoryDropdownOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-on-surface hover:bg-surface-container hover:text-on-surface'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                size={16}
                                strokeWidth={isSelected ? 2.2 : 1.8}
                                className={cn('shrink-0', isSelected ? 'text-primary' : 'text-on-surface-variant')}
                              />
                              <span className="truncate">{category.label}</span>
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0',
                                  isSelected
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-surface-container-high text-on-surface-variant'
                                )}
                              >
                                {loading ? '...' : count}
                              </span>
                            </div>

                            {isSelected && (
                              <Check size={16} className="text-primary shrink-0 ml-2" strokeWidth={2.5} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tablet & Desktop Segmented Control Tabs (hidden sm:block) */}
            <div className="hidden sm:block">
              <div className="inline-flex min-w-max items-center p-1 rounded-xl bg-surface-container-high/60 border border-card-border/70 backdrop-blur-xs shadow-2xs gap-1">
                {categories.map((category) => {
                  const Icon = categoryIcon[category.icon] || FileText;
                  const count = getCategoryCount(category.type);
                  const isSelected = selectedCategory === category.type;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.type);
                        setSearchQuery(''); // Reset section search on category change
                      }}
                      className={cn(
                        'group relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[13.5px] font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap shrink-0',
                        isSelected
                          ? 'text-on-surface font-semibold'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeSegmentedPill"
                          className="absolute inset-0 rounded-lg bg-surface-bright shadow-xs border border-card-border/80"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                        <Icon
                          size={15}
                          strokeWidth={isSelected ? 2.2 : 1.8}
                          className={cn(
                            'transition-colors shrink-0',
                            isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                          )}
                        />
                        <span className="whitespace-nowrap">{category.label}</span>
                      </span>
                      <span
                        className={cn(
                          'relative z-10 rounded-full px-1.5 sm:px-2 py-0.5 text-[11px] font-semibold transition-colors duration-200 shrink-0',
                          isSelected
                            ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/20'
                            : 'bg-surface-container-highest/80 text-on-surface-variant'
                        )}
                      >
                        {loading ? '...' : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filtered Materials Display Section with Section-Specific Search Box */}
      <section>
        <div className="mb-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Dedicated Section Search Box on the Left */}
          <div className="relative w-full sm:w-80 md:w-96">
            <AnimatedInput
              type="search"
              icon={<Search size={18} className="text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${selectedLabel.toLowerCase()}...`}
              aria-label={`Search in ${selectedLabel}`}
              className="h-11 w-full rounded-xl border border-card-border bg-surface-container pl-10 pr-9 text-body-md text-on-surface shadow-xs placeholder:text-outline focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Section Heading on the Right with Increased Font Size */}
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {selectedLabel}
          </h2>
        </div>

        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title={
              searchQuery
                ? `No matches in ${selectedLabel.toLowerCase()}`
                : loading
                  ? `Loading ${selectedLabel.toLowerCase()}…`
                  : `No ${selectedLabel.toLowerCase()} available yet`
            }
            description={
              searchQuery
                ? `No items matching "${searchQuery}" found in ${selectedLabel.toLowerCase()}.`
                : loading
                  ? undefined
                  : `No materials have been shared yet. Be the first to upload!`
            }
            actionLabel={!loading && !searchQuery ? "Upload Material" : undefined}
            onAction={!loading && !searchQuery ? () => navigate(`/upload?type=${selectedCategory}`) : undefined}
          />

        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} onToggleSave={toggleSave} onUploaderClick={setSelectedProfile} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Uploaded Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-on-surface">Recently Uploaded</h2>
          <Link to="/profile/uploads" className="text-label-md font-semibold text-primary hover:underline">
            View all uploads
          </Link>
        </div>
        <Card padded={false} hoverable={false} className="overflow-hidden">
          <div className="flex flex-col">
            {recent.map((material) => (
              <MaterialRow key={material.id} material={material} onToggleSave={toggleSave} />
            ))}
          </div>
          <Link
            to="/profile/uploads"
            className="block border-t border-card-border py-3 text-center text-label-md font-semibold text-primary"
          >
            View all uploads
          </Link>
        </Card>
      </section>

      {/* User Profile Panel */}
      <UserProfilePanel profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
}

export default DashboardPage;
