import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { MaterialCard } from '../components/ui/MaterialCard';
import { Select } from '../components/ui/Select';
import { subjects, universities } from '../data/mockData';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import * as bookmarksService from '../services/bookmarksService';
import { listApprovedMaterialsForUI } from '../services/materialsService';

const sortOptions = ['Most Popular', 'Recently Added', 'Most Downloaded'] as const;

export function ExplorePage() {
  const { user } = useAuth();
  const [activeSubjects, setActiveSubjects] = useState<Set<string>>(new Set());
  const [activeUniversities, setActiveUniversities] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<(typeof sortOptions)[number]>('Most Popular');
  const [visibleCount, setVisibleCount] = useState(6);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const savedIds = user ? await bookmarksService.listBookmarkedMaterialIds(user.id) : undefined;
      const data = await listApprovedMaterialsForUI(
        {
          subjects: activeSubjects.size ? [...activeSubjects] : undefined,
          universities: activeUniversities.size ? [...activeUniversities] : undefined,
        },
        savedIds,
      );
      if (active) {
        setMaterials(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeSubjects, activeUniversities, user]);

  const toggleSubject = (subject: string) =>
    setActiveSubjects((prev) => {
      const next = new Set(prev);
      next.has(subject) ? next.delete(subject) : next.add(subject);
      return next;
    });

  const toggleUniversity = (university: string) =>
    setActiveUniversities((prev) => {
      const next = new Set(prev);
      next.has(university) ? next.delete(university) : next.add(university);
      return next;
    });

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

  const sorted = [...materials].sort((a, b) => {
    if (sort === 'Most Downloaded') return b.downloads - a.downloads;
    if (sort === 'Recently Added') return a.uploadedAt < b.uploadedAt ? 1 : -1;
    return b.views - a.views;
  });

  const visible = sorted.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="w-full shrink-0 lg:sticky lg:top-0 lg:w-64">
        <h2 className="mb-4 text-headline-md text-on-surface">Filters</h2>

        <div className="mb-6">
          <p className="mb-3 text-label-md font-semibold text-on-surface">University</p>
          <div className="flex flex-col gap-2.5">
            {universities.slice(0, 3).map((university) => (
              <label key={university} className="flex items-center gap-2.5 text-body-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={activeUniversities.has(university)}
                  onChange={() => toggleUniversity(university)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary-container"
                />
                {university}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-label-md font-semibold text-on-surface">Subject</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Chip key={subject} active={activeSubjects.has(subject)} onClick={() => toggleSubject(subject)}>
                {subject}
              </Chip>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Explore Materials</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {loading ? 'Loading...' : `Showing ${visible.length} of ${sorted.length} results`}
            </p>
          </div>
          <Select
            aria-label="Sort by"
            options={sortOptions as unknown as string[]}
            value={sort}
            onChange={(event) => setSort(event.target.value as (typeof sortOptions)[number])}
            className="w-48"
          />
        </div>

        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {visible.map((material) => (
              <MaterialCard key={material.id} material={material} onToggleSave={toggleSave} />
            ))}
          </AnimatePresence>
        </motion.div>

        {visibleCount < sorted.length && (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={() => setVisibleCount((count) => count + 6)}>
              Load More Materials
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExplorePage;
