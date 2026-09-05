import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardList, FileQuestion, FileText, Image as ImageIcon, UploadCloud, X, CheckCircle } from 'lucide-react';
import { AnimatedTextarea } from '../components/ui/AnimatedInput';
import { type DragEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CollegeAutocomplete } from '../components/ui/CollegeAutocomplete';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { courses, engineeringBranches, degreeBranches, subjects } from '../data/mockData';
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
    description: 'Share lecture notes, study guides, formulas, or textbook summaries.',
    icon: FileText,
    accent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    badge: 'Study Material',
  },
  {
    id: 'past-paper',
    type: 'past-paper' as MaterialType,
    title: 'Past Exam Paper',
    description: 'Share mid-term, end-term, or quiz question papers as PDF or Gallery Images.',
    icon: FileQuestion,
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    badge: 'Past Paper',
  },
  {
    id: 'doc',
    type: 'doc' as MaterialType,
    title: 'Assignment & Solution',
    description: 'Share homework assignments, lab reports, or project problem sets.',
    icon: ClipboardList,
    accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    badge: 'Assignment',
  },
];

function inferMaterialType(selectedType: MaterialType): MaterialType {
  // Ensure the material is strictly categorized based on the user's selection, 
  // ignoring the actual file extension.
  return selectedType;
}

export function UploadPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type');

  const selectedCategory = initialType
    ? uploadCategories.find((c) => c.id === initialType || c.type === initialType) ?? null
    : null;

  const [selectedCourse, setSelectedCourse] = useState<string>('Engineering');
  const activeBranches = selectedCourse === 'Degree' ? degreeBranches : engineeringBranches;

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
  const { user, isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();

  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    };
  }, []);

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
          setDetectedPages(newFiles.length); // For multiple images
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
    if (files.length === 0 || !user || !selectedCategory) {
      setError('Please select at least one file or image to upload.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const course = String(formData.get('course') ?? selectedCourse).trim();
    const branch = String(formData.get('branch') ?? '').trim();
    const year = String(formData.get('year') ?? '').trim();
    const college = String(formData.get('college') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const pagesStr = String(formData.get('pages') ?? '').trim();
    const pages = pagesStr ? parseInt(pagesStr, 10) : files.length > 1 ? files.length : undefined;

    if (files.length === 0) {
      setError('File to be uploaded is required. Please select at least one file.');
      return;
    }

    if (!title) {
      setError('Title is required.');
      return;
    }

    if (selectedCategory.id === 'past-paper') {
      if (!college) {
        setError('College / University name is required.');
        return;
      }
    } else if (selectedCategory.id === 'doc') {
      if (!year) {
        setError('Student Year is required.');
        return;
      }
    } else if (selectedCategory.id === 'materials') {
      const subject = String(formData.get('subject') ?? '').trim();
      if (!subject) {
        setError('Subject is required.');
        return;
      }
      if (!year) {
        setError('Student Year is required.');
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const primaryFile = files[0];
      await uploadMaterial({
        file: primaryFile,
        uploaderId: user.id,
        title,
        description: description || (files.length > 1 ? `Contains ${files.length} exam paper image pages.` : undefined),
        subject: selectedCategory.id === 'past-paper' ? title : String(formData.get('subject') ?? '') || branch || title,
        semester: String(formData.get('semester') ?? '') || undefined,
        college: String(formData.get('college') ?? '') || undefined,
        branch: branch ? `${course ? `${course} - ` : ''}${branch}` : undefined,
        year: year || undefined,
        type: inferMaterialType(selectedCategory.type),
        pages,
      });

      // Show beautiful success modal instead of ugly native alert
      setShowSuccessModal(true);

      // Delay redirect directly to Manage Uploads in Library page so user can read the success message
      setTimeout(() => {
        sessionStorage.setItem('dashboard_category', selectedCategory.id);
        navigate('/library?tab=uploads', { replace: true });
      }, 2500);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Selection Screen (Select what to upload)
  if (!selectedCategory) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-label-sm font-semibold text-primary hover:underline cursor-pointer mb-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg font-bold">
            What would you like to upload?
          </h1>
          <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
            First select the type of academic resource you are sharing with fellow students.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {uploadCategories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card
                  hoverable={true}
                  onClick={() => setSearchParams({ type: cat.id })}
                  className="flex flex-col gap-4 p-6 cursor-pointer text-left border-2 hover:border-primary transition-all h-full"
                >
                  <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', cat.accent)}>
                    <Icon size={24} />
                  </span>
                  <div>
                    <h3 className="text-headline-md font-bold text-on-surface">{cat.title}</h3>
                    <p className="mt-1.5 text-body-sm text-on-surface-variant leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-label-md font-semibold text-primary">
                    <span>Select {cat.badge}</span>
                    <ArrowLeft size={16} className="rotate-180" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: Upload File & Metadata Form
  const CategoryIcon = selectedCategory.icon;
  const isAssignment = selectedCategory.id === 'doc';
  const isPastPaper = selectedCategory.id === 'past-paper';

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      {/* Category Selection Header Badge */}
      <div className="flex items-center justify-between gap-4 border-b border-card-border pb-4">
        <div>
          <button
            type="button"
            onClick={() => {
              setSearchParams({});
              setFiles([]);
            }}
            className="flex items-center gap-1.5 text-label-sm font-semibold text-primary hover:underline cursor-pointer mb-1"
          >
            <ArrowLeft size={16} />
            <span>Return to &quot;What would you like to upload?&quot;</span>
          </button>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg font-bold">
            Upload {selectedCategory.title}
          </h1>
        </div>

        <span className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-label-md font-semibold', selectedCategory.accent)}>
          <CategoryIcon size={18} />
          <span>{selectedCategory.badge}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* File Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-150 cursor-pointer ${
            isDragging ? 'border-primary bg-primary-container/10' : 'border-card-border bg-surface-soft hover:border-primary/60 hover:bg-surface-soft/80'
          }`}
        >
          <div className="flex items-center gap-2 text-outline group-hover:text-primary transition-colors">
            <UploadCloud size={36} />
            {isPastPaper && <ImageIcon size={30} className="text-amber-500" />}
          </div>
          <p className="text-body-md font-semibold text-on-surface">
            Select or Drag {selectedCategory.badge} {isPastPaper ? 'PDFs or Gallery Images' : 'File(s)'} <span className="text-red-500 font-bold">*</span>
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {isPastPaper
              ? 'PDF, Word, or Multiple Gallery Images (JPG, PNG, WebP) up to 50MB each'
              : 'PDF, DOCX, or PPTX up to 50MB'}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={isPastPaper ? ACCEPT_PAST_PAPER : ACCEPT_STANDARD}
            className="sr-only"
            onClick={(event) => {
              (event.target as HTMLInputElement).value = '';
            }}
            onChange={(event) => {
              if (event.target.files?.length) simulateUpload(event.target.files);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2 cursor-pointer pointer-events-none"
            tabIndex={-1}
          >
            {isPastPaper ? 'Select Files / Multiple Gallery Images' : 'Browse Files *'}
          </Button>
        </motion.div>

        {/* Selected Files / Images Gallery Preview */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 rounded-xl border border-card-border bg-white p-4 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-card-border pb-2">
              <span className="text-label-md font-bold text-on-surface">
                {files.length} {files.length === 1 ? 'File / Image' : 'Files / Images'} Selected
              </span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-label-sm font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                + Add More
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {files.map((fileItem, idx) => (
                <div
                  key={`${fileItem.name}-${idx}`}
                  className="flex items-center gap-3 rounded-lg border border-card-border bg-surface-soft p-2.5"
                >
                  {fileItem.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(fileItem)}
                      alt={`Page ${idx + 1}`}
                      className="h-12 w-12 shrink-0 rounded-md object-cover border border-card-border"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-primary border border-card-border">
                      <FileText size={22} />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-label-xs font-bold text-primary">
                        Page {idx + 1}
                      </span>
                      <p className="truncate text-body-sm font-semibold text-on-surface">{fileItem.name}</p>
                    </div>
                    <p className="mt-0.5 text-label-xs text-on-surface-variant">
                      {Math.round((fileItem.size / 1024) * 10) / 10} KB
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove page ${idx + 1}`}
                    onClick={() => removeFile(idx)}
                    className="shrink-0 text-outline hover:text-error cursor-pointer p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {progress > 0 && progress < 100 && (
              <div className="mt-2 flex items-center gap-2 pt-2 border-t border-card-border">
                <ProgressBar value={progress} />
                <span className="w-10 shrink-0 text-label-sm text-on-surface-variant">{progress}%</span>
              </div>
            )}
          </motion.div>
        )}

        <Input
          label={`${selectedCategory.badge} Title *`}
          name="title"
          placeholder={
            isAssignment
              ? 'e.g. DBMS Lab Assignment 2 Solution'
              : selectedCategory.id === 'past-paper'
                ? 'e.g. Calculus & Linear Algebra Mid-Term Past Paper 2024'
                : 'e.g. Advanced Data Structures Complete Notes'
          }
          required
        />

        {/* Description - Hide for Past Papers */}
        {!isPastPaper && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-label-md text-on-surface-variant">
              Description
            </label>
            <AnimatedTextarea
              id="description"
              name="description"
              rows={3}
              placeholder="What does this resource cover? Add any helpful details for students."
              className="w-full resize-none rounded-lg border border-transparent bg-surface-soft px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:bg-white focus:outline-none"
            />
          </div>
        )}

        {/* Dynamic Metadata Form Fields */}
        {isAssignment ? (
          /* For Assignments, collect Course, Branch, and Year * (Mandatory: File, Title, Year) */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Select
              label="Course"
              placeholder="Select Course"
              options={courses}
              name="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            />
            <Select label="Branch / Program" placeholder="Select Branch" options={activeBranches} name="branch" />
            <Input label="Student Year *" placeholder="1st year, 2nd year ..." name="year" required />
            <Input label="Pages (Optional)" placeholder="e.g. 5" name="pages" type="number" min={1} value={detectedPages} onChange={(e) => setDetectedPages(e.target.value)} />
          </div>
        ) : isPastPaper ? (
          /* For Past Exam Papers, collect College / University * and Pages */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CollegeAutocomplete
              label="College / University *"
              name="college"
              placeholder="Enter your college or university name *"
            />
            <Input label="Pages (Optional)" placeholder="e.g. 5" name="pages" type="number" min={1} value={detectedPages} onChange={(e) => setDetectedPages(e.target.value)} />
          </div>
        ) : (
          /* For Study Materials, collect Course, Branch, Subject *, and Year * (No College or Semester) */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Course"
              placeholder="Select Course"
              options={courses}
              name="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            />
            <Select label="Branch / Program" placeholder="Select Branch" options={activeBranches} name="branch" />
            <Select label="Subject *" placeholder="Select Subject *" options={subjects} name="subject" required />
            <Input label="Student Year *" placeholder="1st year, 2nd year ..." name="year" required />
            <Input label="Pages (Optional)" placeholder="e.g. 15" name="pages" type="number" min={1} value={detectedPages} onChange={(e) => setDetectedPages(e.target.value)} />
          </div>
        )}

        {error && <p className="text-body-sm font-medium text-error">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearchParams({});
              setFiles([]);
            }}
          >
            Cancel & Return to Selection
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<UploadCloud size={18} />}
            disabled={files.length === 0 || progress < 100 || isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : `Upload ${selectedCategory.badge}`}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-emerald-100 p-3 mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-headline-sm font-bold text-on-surface mb-2">Approval Sent!</h2>
          <p className="text-body-md text-on-surface-variant">
            Your material has been submitted successfully and is now pending admin approval.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default UploadPage;
