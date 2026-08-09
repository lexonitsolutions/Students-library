import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { MaterialCard } from '../components/ui/MaterialCard';
import { Select } from '../components/ui/Select';
import { materials, subjects, universities } from '../data/mockData';

const sortOptions = ['Most Popular', 'Recently Added', 'Most Downloaded'] as const;

export function ExplorePage() {
  const [activeSubjects, setActiveSubjects] = useState<Set<string>>(new Set(['Mathematics']));
  const [activeUniversities, setActiveUniversities] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<(typeof sortOptions)[number]>('Most Popular');
  const [visibleCount, setVisibleCount] = useState(6);

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

  const toggleSave = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = materials.filter((material) => {
    const subjectMatch = activeSubjects.size === 0 || activeSubjects.has(material.subject);
    const universityMatch = activeUniversities.size === 0; // mock materials have no university field
    return subjectMatch || universityMatch;
  });

  const visible = filtered.slice(0, visibleCount);

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
              Showing {visible.length} of {filtered.length} results
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
              <MaterialCard
                key={material.id}
                material={{ ...material, isSaved: savedIds.has(material.id) }}
                onToggleSave={toggleSave}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {visibleCount < filtered.length && (
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
