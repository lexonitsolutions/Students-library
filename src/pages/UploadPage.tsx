import { motion } from 'framer-motion';
import { FileText, UploadCloud, X } from 'lucide-react';
import { type DragEvent, type FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Select } from '../components/ui/Select';
import { subjects, universities, years } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { uploadMaterial } from '../services/materialsService';
import type { MaterialType } from '../types/database.types';

const colleges = ['College of Engineering', 'College of Science', 'School of Engineering'];
const branches = ['Computer Science', 'Mathematics', 'Electronics'];
const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];

function inferMaterialType(fileName: string): MaterialType {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (extension === 'doc' || extension === 'docx') return 'doc';
  if (extension === 'ppt' || extension === 'pptx') return 'slides';
  return 'notes';
}

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const simulateUpload = (selected: File) => {
    setFile(selected);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          clearInterval(interval);
          return 100;
        }
        return value + 15;
      });
    }, 150);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) simulateUpload(dropped);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !user) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const subject = String(formData.get('subject') ?? '').trim();
    if (!title || !subject) {
      setError('Title and subject are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await uploadMaterial({
        file,
        uploaderId: user.id,
        title,
        description: String(formData.get('description') ?? '') || undefined,
        subject,
        semester: String(formData.get('semester') ?? '') || undefined,
        university: String(formData.get('university') ?? '') || undefined,
        college: String(formData.get('college') ?? '') || undefined,
        branch: String(formData.get('branch') ?? '') || undefined,
        year: String(formData.get('year') ?? '') || undefined,
        type: inferMaterialType(file.name),
      });
      navigate('/profile/uploads');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Upload Material</h1>
      <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
        Share academic resources with your peers securely.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
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
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors duration-150 ${
            isDragging ? 'border-primary bg-primary-container/5' : 'border-card-border bg-surface-soft'
          }`}
        >
          <UploadCloud className="text-outline" size={32} />
          <p className="text-body-md font-semibold text-on-surface">Select or Drag PDF</p>
          <p className="text-label-sm text-on-surface-variant">PDF, DOCX, or PPTX up to 50MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) simulateUpload(selected);
            }}
          />
          <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
            Browse Files
          </Button>
        </motion.div>

        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-lg border border-card-border bg-white p-3"
          >
            <FileText className="shrink-0 text-error" size={22} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium text-on-surface">{file.name}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <ProgressBar value={progress} />
                <span className="w-10 shrink-0 text-label-sm text-on-surface-variant">{progress}%</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Remove file"
              onClick={() => setFile(null)}
              className="shrink-0 text-outline hover:text-on-surface cursor-pointer"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        <Input label="Material Title" name="title" placeholder="e.g. Advanced Calculus Chapter 4" required />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-label-md text-on-surface-variant">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="What does this material cover?"
            className="w-full resize-none rounded-lg border border-transparent bg-surface-soft px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:bg-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="University" placeholder="Select University" options={universities} name="university" />
          <Select label="College" placeholder="Select College" options={colleges} name="college" />
          <Select label="Branch" placeholder="Select Branch" options={branches} name="branch" />
          <Select label="Subject" placeholder="Select Subject" options={subjects} name="subject" />
          <Select label="Year" placeholder="Select Year" options={years} name="year" />
          <Select label="Semester" placeholder="Select Semester" options={semesters} name="semester" />
        </div>

        {error && <p className="text-body-sm font-medium text-error">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<UploadCloud size={18} />}
            disabled={!file || progress < 100 || isSubmitting}
          >
            {isSubmitting ? 'Uploading...' : 'Upload Material'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UploadPage;
