import { motion } from 'framer-motion';
import { Search, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Good morning, {user?.username || user?.name || 'Student'}
        </h1>
        <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
          Let&apos;s continue your studies where you left off.
        </p>
      </div>

      {/* Materials Category Segmented Control Tabs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface">Categories & Materials</h2>
        </div>

        {/* Horizontal Segmented Pill Container with Sliding Background Animation */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-card-border bg-surface-container-low/60 p-1.5 backdrop-blur-xs">
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
                  'relative flex flex-1 min-w-[140px] items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-label-md font-semibold transition-colors duration-200 cursor-pointer select-none',
                  isSelected
                    ? 'text-white'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeSegmentedPill"
                    className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={18} />
                  <span>{category.label}</span>
                </span>
                <span
                  className={cn(
                    'relative z-10 rounded-full px-2 py-0.5 text-label-sm transition-colors duration-200',
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  {loading ? '...' : count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
              className="h-11 w-full rounded-xl border border-card-border bg-white pl-10 pr-9 text-body-md text-on-surface shadow-xs placeholder:text-outline focus:border-primary focus:bg-white focus:outline-none"
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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface">Recently Uploaded</h2>
          <Link to="/profile/uploads" className="text-label-md font-semibold text-primary">
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
