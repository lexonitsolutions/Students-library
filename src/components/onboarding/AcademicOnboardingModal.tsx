import { useState, useMemo, useEffect } from 'react';
import { BookOpen, GraduationCap, Sparkles, Plus, X, Check, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CollegeAutocomplete } from '../ui/CollegeAutocomplete';
import {
  INDIAN_COURSES,
  findIndianCourse,
  getBranchesForCourse,
  getStudyYearsForCourse,
  getSubjectsForBranch,
} from '../../data/indianAcademics';
import { useAuth } from '../../hooks/useAuth';

export interface AcademicOnboardingModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCompleted?: () => void;
  readonly allowSkip?: boolean;
}

export function AcademicOnboardingModal({
  open,
  onClose,
  onCompleted,
  allowSkip = true,
}: Readonly<AcademicOnboardingModalProps>) {
  const { user, updateUser } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    return user?.course || INDIAN_COURSES[0].id;
  });

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    return user?.branch || '';
  });

  const [college, setCollege] = useState<string>(() => {
    return user?.college || '';
  });

  const [year, setYear] = useState<string>(() => {
    return user?.year || '';
  });

  const [preferredSubjects, setPreferredSubjects] = useState<string[]>(() => {
    return Array.isArray(user?.preferredSubjects) ? user.preferredSubjects : [];
  });

  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if user loads
  useEffect(() => {
    if (user?.course) {
      setSelectedCourse(user.course);
    }
    if (user?.branch) {
      setSelectedBranch(user.branch);
    }
    if (user?.college) {
      setCollege(user.college);
    }
    if (user?.year) {
      setYear(user.year);
    }
    if (Array.isArray(user?.preferredSubjects) && user.preferredSubjects.length > 0) {
      setPreferredSubjects(user.preferredSubjects);
    }
  }, [user]);

  // Dynamic branch list based on chosen course
  const branchOptions = useMemo(() => {
    const branches = getBranchesForCourse(selectedCourse);
    return branches.map((b) => ({
      value: b.name,
      label: b.name,
    }));
  }, [selectedCourse]);

  // Set default branch if current branch is empty or not in new course branches
  useEffect(() => {
    const branches = getBranchesForCourse(selectedCourse);
    if (branches.length > 0) {
      const match = branches.some((b) => b.name === selectedBranch);
      if (!match) {
        setSelectedBranch(branches[0].name);
      }
    }
  }, [selectedCourse, selectedBranch]);

  // Dynamic study years based on course duration
  const yearOptions = useMemo(() => {
    const years = getStudyYearsForCourse(selectedCourse);
    return years.map((y) => ({
      value: y,
      label: y,
    }));
  }, [selectedCourse]);

  // Set default year if current year not in new course years
  useEffect(() => {
    const years = getStudyYearsForCourse(selectedCourse);
    if (years.length > 0 && (!year || !years.includes(year))) {
      setYear(years[0]);
    }
  }, [selectedCourse, year]);

  // Suggested subjects based on course and branch
  const recommendedSubjects = useMemo(() => {
    return getSubjectsForBranch(selectedCourse, selectedBranch);
  }, [selectedCourse, selectedBranch]);

  const toggleSubject = (subject: string) => {
    setPreferredSubjects((prev) => {
      if (prev.includes(subject)) {
        return prev.filter((s) => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;

    if (!preferredSubjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setPreferredSubjects((prev) => [...prev, trimmed]);
    }
    setCustomSubjectInput('');
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setPreferredSubjects((prev) => prev.filter((s) => s !== subjectToRemove));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const courseObj = findIndianCourse(selectedCourse);
      const courseName = courseObj?.name || selectedCourse;

      await updateUser({
        course: courseName,
        branch: selectedBranch,
        college: college.trim(),
        year: year,
        preferredSubjects: preferredSubjects,
      });

      if (user?.id) {
        localStorage.setItem(`quicklearnit.onboarded_academic_${user.id}`, 'true');
      }

      onCompleted?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to save academic preferences:', err);
      setErrorMessage(err?.message || 'Could not save your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const courseOptions = useMemo(() => {
    return INDIAN_COURSES.map((c) => ({
      value: c.id,
      label: c.name,
    }));
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-2xl sm:max-w-2xl max-h-[92vh] overflow-y-auto"
    >
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="border-b border-card-border/60 pb-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <GraduationCap size={14} />
            <span>Academic Setup</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Set Up Your Academic Profile 🎓
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Choose your degree, college, and preferred subjects. We’ll curate your dashboard to show the study materials you need first.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Step 1: Course */}
          <div>
            <label className="text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary" />
              Course / Degree Program (India)
            </label>
            <Select
              options={courseOptions}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          {/* Step 2: Branch & Study Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Branch / Specialization
              </label>
              <Select
                options={branchOptions}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Year of Study
              </label>
              <Select
                options={yearOptions}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Step 3: College Autocomplete */}
          <div>
            <CollegeAutocomplete
              label="College / Institution"
              placeholder="Search your college name (e.g., IIT, NIT, JNTU, Anna Univ...)"
              value={college}
              onChange={setCollege}
              onSelect={(col) => setCollege(col.name)}
            />
          </div>

          {/* Step 4: Preferred Subjects */}
          <div className="pt-2 border-t border-card-border/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                Select Preferred Subjects
              </label>
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {preferredSubjects.length} selected
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mb-2.5">
              Click recommended subjects or type your own below. We will prioritize these subjects in your dashboard documents!
            </p>

            {/* Custom Subject Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSubject();
                  }
                }}
                placeholder="Type a subject name (e.g. Artificial Intelligence, Cloud Computing)..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container border border-card-border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomSubject}
                disabled={!customSubjectInput.trim()}
                className="shrink-0 flex items-center gap-1 text-xs px-3"
              >
                <Plus size={14} />
                <span>Add</span>
              </Button>
            </div>

            {/* Selected Subjects Badges */}
            {preferredSubjects.length > 0 && (
              <div className="mb-3">
                <div className="text-[11px] font-medium text-on-surface-variant mb-1.5">
                  Your Chosen Subjects:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-surface-container/50 border border-card-border/40">
                  {preferredSubjects.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary text-on-primary shadow-xs transition-transform active:scale-95"
                    >
                      <Check size={12} />
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="hover:opacity-75 cursor-pointer ml-0.5 p-0.5 rounded"
                        title="Remove subject"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Subjects Selection Grid */}
            <div>
              <div className="text-[11px] font-medium text-on-surface-variant mb-1.5">
                Recommended for your branch:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-surface-container/30 border border-card-border/40">
                {recommendedSubjects.map((sub) => {
                  const isSelected = preferredSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-primary/15 text-primary border-primary/40'
                          : 'bg-surface hover:bg-surface-container border-card-border text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="text-primary" /> : <Plus size={12} className="opacity-50" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 mt-2 border-t border-card-border/60 flex items-center justify-between gap-3">
            {allowSkip ? (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-on-surface-variant hover:text-on-surface font-medium underline-offset-4 hover:underline cursor-pointer"
              >
                Skip for now
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSaving}
                className="min-w-[140px] flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Save & Continue</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
