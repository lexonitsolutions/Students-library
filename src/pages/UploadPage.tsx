import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ClipboardList, FileQuestion, FileText, UploadCloud, X, AlertCircle } from 'lucide-react';
import { type DragEvent, type FormEvent, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { CollegeAutocomplete } from '../components/ui/CollegeAutocomplete';
import {
  INDIAN_COURSES,
  getBranchesForCourse,
  getStudyYearsForCourse,
  getSubjectsForBranch,
} from '../data/indianAcademics';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { uploadMaterial } from '../services/materialsService';
import type { MaterialType } from '../types/database.types';
import { cn } from '../lib/cn';

const ACCEPT_PAST_PAPER =
  '.pdf,.PDF,application/pdf,.doc,.DOC,.docx,.DOCX,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.ppt,.PPT,.pptx,.PPTX,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.jpg,.jpeg,.png,.webp,.heic,.HEIC,image/*';

const ACCEPT_STANDARD =
  '.pdf,.PDF,application/pdf,.doc,.DOC,.docx,.DOCX,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.ppt,.PPT,.pptx,.PPTX,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.txt,text/plain';

const uploadCategories = [
  {
    id: 'materials',
    type: 'pdf' as MaterialType,
    title: 'Study Material & Notes',
    description: 'Lecture notes, formulas, or summaries.',
    icon: FileText,
    badge: 'Study Material',
  },
  {
    id: 'past-paper',
    type: 'past-paper' as MaterialType,
    title: 'Past Exam Paper',
    description: 'Question papers as PDF or images.',
    icon: FileQuestion,
    badge: 'Past Paper',
  },
  {
    id: 'doc',
    type: 'doc' as MaterialType,
    title: 'Assignment & Solution',
    description: 'Homework, lab reports, or solutions.',
    icon: ClipboardList,
    badge: 'Assignment',
  },
];

function inferMaterialType(selectedType: MaterialType): MaterialType {
  return selectedType;
}

export function UploadPage() {
  const { user, isExploring } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramType = searchParams.get('type');

  const activeCategory = (['materials', 'past-paper', 'doc'].includes(paramType || '')
    ? paramType
    : 'materials') as string;

  const currentCategory = uploadCategories.find((c) => c.id === activeCategory) || uploadCategories[0];

  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    return user?.course || INDIAN_COURSES[0].name;
  });

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    return user?.branch || '';
  });

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return user?.year || '';
  });

  const [college, setCollege] = useState<string>(() => {
    return user?.college || user?.university || '';
  });

  // Keep defaults updated when user profile loads
  useEffect(() => {
    if (user?.course && !selectedCourse) {
      setSelectedCourse(user.course);
    }
    if (user?.branch && !selectedBranch) {
      setSelectedBranch(user.branch);
    }
    if (user?.year && !selectedYear) {
      setSelectedYear(user.year);
    }
    if ((user?.college || user?.university) && !college) {
      setCollege(user.college || user.university || '');
    }
  }, [user]);

  // Dynamic branch list for course
  const branchOptions = useMemo(() => {
    const branches = getBranchesForCourse(selectedCourse);
    return branches.map((b) => ({ value: b.name, label: b.name }));
  }, [selectedCourse]);

  // Keep branch valid if course changes
  useEffect(() => {
    const branches = getBranchesForCourse(selectedCourse);
    if (branches.length > 0) {
      const match = branches.some((b) => b.name === selectedBranch);
      if (!match) {
        setSelectedBranch(branches[0].name);
      }
    }
  }, [selectedCourse, selectedBranch]);

  // Dynamic study years for course
  const yearOptions = useMemo(() => {
    const years = getStudyYearsForCourse(selectedCourse);
    return years.map((y) => ({ value: y, label: y }));
  }, [selectedCourse]);

  useEffect(() => {
    const years = getStudyYearsForCourse(selectedCourse);
    if (years.length > 0 && (!selectedYear || !years.includes(selectedYear))) {
      setSelectedYear(years[0]);
    }
  }, [selectedCourse, selectedYear]);

  // Dynamic subjects for branch with preferred subjects prioritized
  const subjectList = useMemo(() => {
    return getSubjectsForBranch(selectedCourse, selectedBranch);
  }, [selectedCourse, selectedBranch]);

  const subjectOptions = useMemo(() => {
    const userPreferred = user?.preferredSubjects || [];

    const preferredMatched = subjectList.filter((s) =>
      userPreferred.some((p) => p.toLowerCase() === s.toLowerCase())
    );
    const otherSubs = subjectList.filter(
      (s) => !userPreferred.some((p) => p.toLowerCase() === s.toLowerCase())
    );
    const customPreferred = userPreferred.filter(
      (p) => !subjectList.some((s) => s.toLowerCase() === p.toLowerCase())
    );

    const ordered = [...preferredMatched, ...customPreferred, ...otherSubs];
    const items = ordered.map((s) => ({
      value: s,
      label: userPreferred.some((p) => p.toLowerCase() === s.toLowerCase()) ? `★ ${s}` : s,
    }));

    return [...items, { value: '__OTHER__', label: '✏️ Other / Custom Subject...' }];
  }, [subjectList, user?.preferredSubjects]);

  // Initialize selected subject if empty
  useEffect(() => {
    if (subjectList.length > 0 && !selectedSubject) {
      const preferred = user?.preferredSubjects?.find((p) =>
        subjectList.some((s) => s.toLowerCase() === p.toLowerCase())
      );
      setSelectedSubject(preferred || subjectList[0]);
    }
  }, [subjectList, user?.preferredSubjects, selectedSubject]);

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedPages, setDetectedPages] = useState<number | string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { openSignupModal } = useSignupRedirect();

  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    };
  }, []);

  const handleCategoryChange = (catId: string) => {
    setSearchParams({ type: catId }, { replace: true });
    setError(null);
  };

  const simulateUpload = async (selectedList: FileList | File[]) => {
    const newFiles = Array.from(selectedList);
    if (newFiles.length === 0) return;

    // Validate maximum file size (50MB)
    const oversized = newFiles.find((f) => f.size > 50 * 1024 * 1024);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds the 50MB size limit.`);
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setProgress(0);

    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current);
    }

    uploadTimerRef.current = setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
          return 100;
        }
        return value + 25;
      });
    }, 50);

    // Try to auto-detect pages from the first file
    if (newFiles.length > 0) {
      try {
        const { getDocumentPageCount } = await import('../lib/documentParser');
        const count = await getDocumentPageCount(newFiles[0]);
        if (count) {
          setDetectedPages(count);
        } else if (newFiles.length > 1) {
          setDetectedPages(newFiles.length);
        }
      } catch (err) {
        console.warn('Page count extraction failed:', err);
      }
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      simulateUpload(event.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setProgress(0);
      }
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isExploring) {
      openSignupModal('/upload');
      return;
    }
    if (files.length === 0 || !user || !currentCategory) {
      setError('Please select at least one file to upload.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const course = String(formData.get('course') ?? selectedCourse).trim();
    const branch = String(formData.get('branch') ?? selectedBranch).trim();
    const year = String(formData.get('year') ?? selectedYear).trim();
    const collegeValue = (college || String(formData.get('college') ?? '')).trim();
    const description = String(formData.get('description') ?? '').trim();
    const pagesStr = String(formData.get('pages') ?? '').trim();
    const pages = pagesStr ? parseInt(pagesStr, 10) : files.length > 1 ? files.length : undefined;

    const finalSubject = (selectedSubject === '__OTHER__' ? customSubject : selectedSubject).trim();

    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!course) {
      setError('Course is required.');
      return;
    }
    if (!branch) {
      setError('Branch / Program is required.');
      return;
    }
    if (!finalSubject) {
      setError('Subject is required.');
      return;
    }
    if (!year) {
      setError('Student Year is required.');
      return;
    }
    if (!collegeValue) {
      setError('College / Institution is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        let actualPages: number | undefined = undefined;
        try {
          const { getDocumentPageCount } = await import('../lib/documentParser');
          actualPages = await getDocumentPageCount(file);
        } catch (err) {
          console.warn('Page detection warning for', file.name, err);
        }

        const resolvedPages =
          pages ||
          actualPages ||
          (typeof detectedPages === 'number' && detectedPages > 0 ? detectedPages : undefined);

        await uploadMaterial({
          file,
          uploaderId: user.id,
          title,
          description: description || undefined,
          subject: finalSubject,
          semester: String(formData.get('semester') ?? '').trim() || undefined,
          college: collegeValue,
          branch: branch ? `${course ? `${course} - ` : ''}${branch}` : undefined,
          year: year || undefined,
          type: inferMaterialType(currentCategory.type),
          pages: resolvedPages,
        });
      }

      setShowSuccessModal(true);

      setTimeout(() => {
        sessionStorage.setItem('dashboard_category', currentCategory.id);
        navigate('/library?tab=uploads', { replace: true });
      }, 2200);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssignment = currentCategory.id === 'doc';
  const isPastPaper = currentCategory.id === 'past-paper';

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Upload Document
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Share study notes, exam question papers, or assignment solutions with peers.
        </p>
      </div>

      {/* Segmented Category Selector */}
      <div className="flex p-1 rounded-xl bg-surface-container-high/60 border border-card-border/70 relative overflow-x-auto">
        {uploadCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                'relative flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors duration-150 cursor-pointer select-none',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeUploadTab"
                  className="absolute inset-0 rounded-lg bg-surface-bright shadow-xs border border-card-border/80"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 min-w-0">
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{cat.badge}</span>
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Compact File Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition-all cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-card-border/80 bg-surface-container-lowest/50 hover:border-primary/50 hover:bg-surface-container-lowest'
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <UploadCloud size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">
              <span className="text-primary hover:underline">Click to upload</span> or drag and drop
            </p>
            <motion.p
              key={isPastPaper ? 'past-paper-hint' : 'standard-hint'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-on-surface-variant/70 mt-0.5"
            >
              {isPastPaper
                ? 'PDF, Word, or images (JPG, PNG, WebP) up to 50MB'
                : 'PDF, Word (DOCX), or PowerPoint (PPTX) up to 50MB'}
            </motion.p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={isPastPaper ? ACCEPT_PAST_PAPER : ACCEPT_STANDARD}
            className="sr-only"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={(e) => {
              if (e.target.files?.length) simulateUpload(e.target.files);
            }}
          />
        </div>

        {/* Selected Files List Preview */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-card-border/70 bg-surface-container-lowest p-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-card-border/60">
              <span className="text-xs font-semibold text-on-surface">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                + Add more
              </button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {files.map((fileItem, idx) => (
                <div
                  key={`${fileItem.name}-${idx}`}
                  className="flex items-center gap-3 rounded-lg bg-surface-container-high/40 px-3 py-2 text-xs"
                >
                  {fileItem.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(fileItem)}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover border border-card-border"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      <FileText size={16} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-on-surface">{fileItem.name}</p>
                    <p className="text-[11px] text-on-surface-variant/70">
                      {Math.round((fileItem.size / 1024) * 10) / 10} KB
                      {detectedPages && idx === 0 ? ` · ${detectedPages} pages detected` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-on-surface-variant/60 hover:text-error p-1 cursor-pointer transition-colors"
                    title="Remove file"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            {progress > 0 && progress < 100 && (
              <div className="pt-2">
                <ProgressBar value={progress} />
              </div>
            )}
          </div>
        )}

        {/* Dynamic Category Form Section with Smooth Transitions */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col gap-5"
          >
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">
                {currentCategory.badge} Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder={
                  isAssignment
                    ? 'e.g. DBMS Lab Assignment 2 Solution'
                    : isPastPaper
                      ? 'e.g. Calculus & Linear Algebra Mid-Term Past Paper 2024'
                      : 'e.g. Advanced Data Structures Complete Notes'
                }
                className="h-11 w-full rounded-xl bg-surface-container-lowest border border-card-border/90 px-3.5 text-sm font-medium text-on-surface placeholder:text-outline/50 shadow-2xs transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            {/* Optional Description */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface">Description</label>
                <span className="text-[11px] text-on-surface-variant/70">Optional</span>
              </div>
              <textarea
                name="description"
                rows={2}
                placeholder="What does this resource cover? Add any helpful details for students."
                className="w-full resize-none rounded-xl bg-surface-container-lowest border border-card-border/90 p-3 text-sm text-on-surface placeholder:text-outline/50 shadow-2xs transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            {/* Complete Academic Metadata Fields */}
            {/* Row 1: Course & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label={
                  <span>
                    Course <span className="text-error">*</span>
                  </span>
                }
                placeholder="Select Course *"
                options={INDIAN_COURSES.map((c) => ({ value: c.name, label: c.name }))}
                name="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
              />
              <Select
                label={
                  <span>
                    Branch / Program <span className="text-error">*</span>
                  </span>
                }
                placeholder="Select Branch *"
                options={branchOptions}
                name="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                required
              />
            </div>

            {/* Row 2: Subject & Student Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Select
                  label={
                    <span>
                      Subject <span className="text-error">*</span>
                    </span>
                  }
                  placeholder="Select Subject *"
                  options={subjectOptions}
                  name="subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                />
                {selectedSubject === '__OTHER__' && (
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter custom subject name *"
                    required
                    className="h-10 w-full rounded-lg bg-surface-container-lowest border border-card-border px-3 text-sm text-on-surface shadow-2xs focus:border-primary focus:outline-none transition-colors mt-1"
                  />
                )}
              </div>

              <Select
                label={
                  <span>
                    Student Year <span className="text-error">*</span>
                  </span>
                }
                placeholder="Select Year *"
                options={yearOptions}
                name="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                required
              />
            </div>

            {/* Row 3: College / Institution (Defaulted to user's college) */}
            <div>
              <CollegeAutocomplete
                label={
                  <span>
                    College / Institution <span className="text-error">*</span>
                  </span>
                }
                placeholder="Search or enter your college / university name *"
                value={college}
                onChange={setCollege}
                onSelect={(col) => setCollege(col.name)}
                required
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-container/20 border border-error/30 p-3 text-body-sm text-error">
            <AlertCircle size={17} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-card-border/60">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFiles([]);
              setDetectedPages('');
              setError(null);
            }}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<UploadCloud size={16} />}
            disabled={files.length === 0 || progress < 100 || isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : `Upload ${currentCategory.badge}`}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-emerald-500/15 p-3.5 mb-3.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-headline-sm font-bold text-on-surface mb-1.5">Submitted Successfully!</h2>
          <p className="text-body-sm text-on-surface-variant max-w-sm">
            Your {currentCategory.badge.toLowerCase()} has been uploaded and sent for admin review. Redirecting to your library...
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default UploadPage;

