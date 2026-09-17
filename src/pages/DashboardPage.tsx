import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, X, Upload, ChevronDown, Check, Sparkles, SlidersHorizontal, Plus } from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { MaterialCard } from '../components/ui/MaterialCard';
import { MaterialRow } from '../components/ui/MaterialRow';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import { AcademicOnboardingModal } from '../components/onboarding/AcademicOnboardingModal';
import { DocumentFilterModal } from '../components/ui/DocumentFilterModal';
import { Footer } from '../components/ui/Footer';
import { categories } from '../data/mockData';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useDocumentFilter } from '../hooks/useDocumentFilter';
import * as bookmarksService from '../services/bookmarksService';
import { fetchUserLikedIds } from '../services/likesService';
import { listApprovedMaterialsForUI } from '../services/materialsService';
import { categoryIcon } from '../lib/materialIcons';
import { cn } from '../lib/cn';

export function DashboardPage() {
  const { user, isAuthenticated, isExploring } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);
  const [showAcademicModal, setShowAcademicModal] = useState<boolean>(false);
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const { filters, activeFilterCount, setFilters, clearFilters, removeFilterKey } = useDocumentFilter();

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
          const [sIds] = await Promise.all([
            bookmarksService.listBookmarkedMaterialIds(user.id),
            fetchUserLikedIds(user.id),
          ]);
          savedIds = sIds;
        } catch (e) {
          console.warn('Failed to load user interaction state:', e);
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
  }, [user?.id]);

  // Check if authenticated user needs academic onboarding
  useEffect(() => {
    if (!isAuthenticated || isExploring || !user) return;
    const forceOpen = searchParams.get('onboarding') === 'academic';
    const isDismissed = sessionStorage.getItem(`academic_modal_dismissed_${user.id}`);
    const isCompleted = localStorage.getItem(`quicklearnit.onboarded_academic_${user.id}`);

    // If user has not set up course/branch/preferred subjects and hasn't dismissed this session
    if (forceOpen || (!isCompleted && !isDismissed && (!user.course || !user.branch || !user.preferredSubjects?.length))) {
      setShowAcademicModal(true);
    }
  }, [isAuthenticated, isExploring, user, searchParams]);

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

  const preferredSubjectsList = useMemo(() => {
    const raw = user?.preferredSubjects;
    const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? (raw as string).split(',') : [];
    return arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  }, [user?.preferredSubjects]);

  const filteredMaterials = useMemo(() => {
    const list = materials.filter((material) => {
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

      // Advanced filters matching
      const matchesCollege =
        !filters.college.trim() ||
        Boolean(material.college && material.college.toLowerCase().includes(filters.college.trim().toLowerCase()));

      const matchesCourse =
        !filters.course.trim() ||
        filters.course === 'All Courses' ||
        Boolean(
          (material.course && material.course.toLowerCase().includes(filters.course.trim().toLowerCase())) ||
          (material.branch && material.branch.toLowerCase().includes(filters.course.trim().toLowerCase()))
        );

      const matchesBranch =
        !filters.branch.trim() ||
        filters.branch === 'All Branches' ||
        Boolean(material.branch && material.branch.toLowerCase().includes(filters.branch.trim().toLowerCase()));

      const matchesSubject =
        !filters.subject.trim() ||
        filters.subject === 'All Subjects' ||
        Boolean(material.subject && material.subject.toLowerCase().includes(filters.subject.trim().toLowerCase()));

      const matchesYear =
        !filters.year.trim() ||
        filters.year === 'All Years' ||
        Boolean(
          material.year &&
            (material.year.toLowerCase().includes(filters.year.trim().toLowerCase()) ||
              filters.year.trim().toLowerCase().includes(material.year.toLowerCase()))
        );

      return (
        matchesCategory &&
        matchesSearch &&
        matchesCollege &&
        matchesCourse &&
        matchesBranch &&
        matchesSubject &&
        matchesYear
      );
    });

    if (preferredSubjectsList.length === 0) {
      return list;
    }

    // Prioritize documents matching the user's preferred subjects first
    return [...list].sort((a, b) => {
      const aSub = (a.subject || '').toLowerCase().trim();
      const bSub = (b.subject || '').toLowerCase().trim();
      const aTitle = (a.title || '').toLowerCase().trim();
      const bTitle = (b.title || '').toLowerCase().trim();

      const aMatches = preferredSubjectsList.some(
        (p) => aSub.includes(p) || p.includes(aSub) || aTitle.includes(p)
      );
      const bMatches = preferredSubjectsList.some(
        (p) => bSub.includes(p) || p.includes(bSub) || bTitle.includes(p)
      );

      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [materials, selectedCategory, searchQuery, preferredSubjectsList, filters]);

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
          className="hidden sm:inline-flex self-start sm:self-auto shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
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

            {/* Mobile Bigger Upload Button Under Categories Dropdown (sm:hidden) */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/upload')}
              className="sm:hidden mt-3 h-12 w-full justify-center gap-2 rounded-2xl text-sm font-bold shadow-xs active:scale-[0.99] cursor-pointer"
            >
              <Plus size={19} strokeWidth={2.6} className="shrink-0" />
              <Upload size={16} strokeWidth={2} className="shrink-0" />
              <span>Upload Document</span>
            </Button>

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
          {/* Dedicated Section Search Box & Filter Button on the Left */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80 md:w-96">
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

            {/* Filter Button beside the Search Bar */}
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={cn(
                'relative flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none shrink-0',
                activeFilterCount > 0
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container border-card-border text-on-surface hover:border-primary/40 hover:bg-surface-container-high'
              )}
              title="Filter documents by college, subject, year, course, branch"
              aria-label="Filter documents"
            >
              <SlidersHorizontal size={17} />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-[11px] font-bold shadow-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Section Heading on the Right */}
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {selectedLabel}
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary ring-1 ring-primary/20">
                {loading ? '...' : filteredMaterials.length}
              </span>
            </div>
            {preferredSubjectsList.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
                <span className="inline-flex items-center gap-1 text-primary">
                  <Sparkles size={12} />
                  <span>Prioritizing your subjects</span>
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowAcademicModal(true)}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Edit preferences
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-surface-container/60 border border-card-border/60">
            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1 shrink-0">
              <SlidersHorizontal size={13} />
              Active filters ({activeFilterCount}):
            </span>

            {filters.college && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                <span>College: <strong>{filters.college}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterKey('college')}
                  className="hover:text-primary/70 cursor-pointer"
                  title="Remove college filter"
                  aria-label="Remove college filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {filters.course && filters.course !== 'All Courses' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                <span>Course: <strong>{filters.course}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterKey('course')}
                  className="hover:text-primary/70 cursor-pointer"
                  title="Remove course filter"
                  aria-label="Remove course filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {filters.branch && filters.branch !== 'All Branches' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                <span>Branch: <strong>{filters.branch}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterKey('branch')}
                  className="hover:text-primary/70 cursor-pointer"
                  title="Remove branch filter"
                  aria-label="Remove branch filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {filters.subject && filters.subject !== 'All Subjects' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                <span>Subject: <strong>{filters.subject}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterKey('subject')}
                  className="hover:text-primary/70 cursor-pointer"
                  title="Remove subject filter"
                  aria-label="Remove subject filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {filters.year && filters.year !== 'All Years' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                <span>Year: <strong>{filters.year}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterKey('year')}
                  className="hover:text-primary/70 cursor-pointer"
                  title="Remove year filter"
                  aria-label="Remove year filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-error hover:underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 min-[1900px]:grid-cols-5">
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

      {/* Academic Onboarding & Preferences Modal */}
      <AcademicOnboardingModal
        open={showAcademicModal}
        onClose={() => {
          if (user?.id) {
            sessionStorage.setItem(`academic_modal_dismissed_${user.id}`, 'true');
          }
          setShowAcademicModal(false);
        }}
        onCompleted={() => {
          setShowAcademicModal(false);
        }}
      />

      {/* Document Filter Modal */}
      <DocumentFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={setFilters}
        onClear={clearFilters}
        totalMatchesCount={filteredMaterials.length}
      />
      <Footer />
    </div>
  );
}

export default DashboardPage;
