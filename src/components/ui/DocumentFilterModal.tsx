import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { CollegeAutocomplete } from './CollegeAutocomplete';
import {
  INDIAN_COURSES,
  getBranchesForCourse,
  getStudyYearsForCourse,
  getSubjectsForBranch,
} from '../../data/indianAcademics';
import { useAuth } from '../../hooks/useAuth';
import type { DocumentFilterState } from '../../hooks/useDocumentFilter';

export interface DocumentFilterModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly filters: DocumentFilterState;
  readonly onApply: (newFilters: DocumentFilterState) => void;
  readonly onClear: () => void;
  readonly totalMatchesCount?: number;
}

export function DocumentFilterModal({
  open,
  onClose,
  filters,
  onApply,
  onClear,
  totalMatchesCount,
}: Readonly<DocumentFilterModalProps>) {
  const { user } = useAuth();

  const [localCollege, setLocalCollege] = useState(filters.college);
  const [localCourse, setLocalCourse] = useState(filters.course);
  const [localBranch, setLocalBranch] = useState(filters.branch);
  const [localSubject, setLocalSubject] = useState(filters.subject);
  const [localYear, setLocalYear] = useState(filters.year);

  // Sync state whenever modal opens or external filters change
  useEffect(() => {
    if (open) {
      setLocalCollege(filters.college);
      setLocalCourse(filters.course);
      setLocalBranch(filters.branch);
      setLocalSubject(filters.subject);
      setLocalYear(filters.year);
    }
  }, [open, filters]);

  // Dynamic branch options based on selected course
  const branchOptions = useMemo(() => {
    if (!localCourse || localCourse === 'All Courses') {
      const allBranches = INDIAN_COURSES.flatMap((c) => c.branches.map((b) => b.name));
      const unique = Array.from(new Set(allBranches));
      return ['All Branches', ...unique];
    }
    const branches = getBranchesForCourse(localCourse);
    return ['All Branches', ...branches.map((b) => b.name)];
  }, [localCourse]);

  // Dynamic study years based on selected course
  const yearOptions = useMemo(() => {
    if (!localCourse || localCourse === 'All Courses') {
      return ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    }
    const years = getStudyYearsForCourse(localCourse);
    return ['All Years', ...years];
  }, [localCourse]);

  // Dynamic subject options based on course and branch
  const subjectOptions = useMemo(() => {
    const subjects = getSubjectsForBranch(localCourse, localBranch);
    return ['All Subjects', ...subjects];
  }, [localCourse, localBranch]);

  const courseOptions = useMemo(() => {
    return ['All Courses', ...INDIAN_COURSES.map((c) => c.name)];
  }, []);

  const handleApplyPreset = () => {
    if (user) {
      if (user.college || user.university) {
        setLocalCollege(user.college || user.university || '');
      }
      if (user.course) {
        setLocalCourse(user.course);
      }
      if (user.branch) {
        setLocalBranch(user.branch);
      }
      if (user.year) {
        setLocalYear(user.year);
      }
    }
  };

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onApply({
      college: localCollege.trim(),
      course: localCourse === 'All Courses' ? '' : localCourse,
      branch: localBranch === 'All Branches' ? '' : localBranch,
      subject: localSubject === 'All Subjects' ? '' : localSubject,
      year: localYear === 'All Years' ? '' : localYear,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalCollege('');
    setLocalCourse('');
    setLocalBranch('');
    setLocalSubject('');
    setLocalYear('');
    onClear();
    onClose();
  };

  const hasAnyActive =
    Boolean(localCollege.trim()) ||
    Boolean(localCourse && localCourse !== 'All Courses') ||
    Boolean(localBranch && localBranch !== 'All Branches') ||
    Boolean(localSubject && localSubject !== 'All Subjects') ||
    Boolean(localYear && localYear !== 'All Years');

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-xl max-h-[92vh] overflow-y-auto"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-card-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">Filter Documents</h2>
              <p className="text-xs text-on-surface-variant">
                Filter documents by college, course, branch, subject, or year
              </p>
            </div>
          </div>
          {hasAnyActive && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-error hover:underline cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>

        {/* Quick Profile Filter Preset */}
        {user && (user.college || user.university || user.course || user.branch) && (
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="text-xs text-on-surface">
              <span className="font-semibold text-primary inline-flex items-center gap-1">
                <Sparkles size={13} />
                Quick Filter:
              </span>{' '}
              Filter by your academic profile (
              <span className="font-medium text-on-surface-variant">
                {[user.college || user.university, user.course, user.branch].filter(Boolean).join(' • ')}
              </span>
              )
            </div>
            <button
              type="button"
              onClick={handleApplyPreset}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-on-primary shadow-xs hover:bg-primary/90 transition-colors shrink-0 cursor-pointer"
            >
              Use My Details
            </button>
          </div>
        )}

        {/* Filter Form */}
        <form onSubmit={handleApply} className="flex flex-col gap-3.5">
          {/* 1. College */}
          <div>
            <CollegeAutocomplete
              label="College / Institution"
              placeholder="Search or enter college name..."
              value={localCollege}
              onChange={setLocalCollege}
              onSelect={(col) => setLocalCollege(col.name)}
            />
          </div>

          {/* 2. Course & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Course / Program
              </label>
              <Select
                options={courseOptions}
                value={localCourse || 'All Courses'}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalCourse(val);
                  setLocalBranch('All Branches');
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Branch / Specialization
              </label>
              <Select
                options={branchOptions}
                value={localBranch || 'All Branches'}
                onChange={(e) => setLocalBranch(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Subject & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Subject
              </label>
              <Select
                options={subjectOptions}
                value={localSubject || 'All Subjects'}
                onChange={(e) => setLocalSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Year of Study
              </label>
              <Select
                options={yearOptions}
                value={localYear || 'All Years'}
                onChange={(e) => setLocalYear(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 mt-1 border-t border-card-border/60 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
              disabled={!hasAnyActive}
            >
              Clear All
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="min-w-[100px]">
                {typeof totalMatchesCount === 'number' ? `Apply Filters (${totalMatchesCount})` : 'Apply Filters'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
