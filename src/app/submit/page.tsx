'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { upload } from '@vercel/blob/client';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { CategorySlug, FileType } from '@/lib/types';
import { useCompetitionSettings } from '@/hooks/useCompetitionSettings';
import {
  UploadCloud,
  CheckCircle,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Lock,
  Clock,
  ArrowRight,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectFileType(file: File): FileType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'pdf';
  return 'other';
}

const FILE_TYPE_ICON = {
  image: ImageIcon,
  video: Video,
  pdf: FileText,
  other: FileText,
};

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
];
const MAX_FILE_SIZE_MB = 50;

function SubmitForm() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    isSubmissionsOpen,
    submissionDeadlineDate,
    hasSubmissionDeadlinePassed,
    loading: settingsLoading,
  } = useCompetitionSettings();

  const [formData, setFormData] = useState({
    categoryId: '' as CategorySlug | '',
    title: '',
    description: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateForm(): string | null {
    if (!isSubmissionsOpen) return 'Submissions are currently closed for this competition.';
    if (!formData.categoryId) return 'Please select a competition category.';
    if (!formData.title.trim()) return 'Please enter a submission title.';
    if (formData.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (!formData.description.trim()) return 'Please enter a description.';
    if (formData.description.trim().length < 10) return 'Description must be at least 10 characters.';
    if (!file) return 'Please upload a file.';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Invalid file type. Allowed: images, videos, PDF.';
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File size must be under ${MAX_FILE_SIZE_MB} MB.`;
    return null;
  }

  // ── File Handling ───────────────────────────────────────────────────────────

  function handleFileSelect(selectedFile: File) {
    setError('');
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Allowed: images, videos, PDF.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setFile(selectedFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }

  // ── Submission ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError('You must be logged in.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload file directly to Vercel Blob
      const fileType = detectFileType(file!);
      const newBlob = await upload(file!.name, file!, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        },
      });

      const fileUrl = newBlob.url;

      // 2. Create submission record in MongoDB via API
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          fileUrl,
          fileType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit entry.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] py-8 px-4 sm:px-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-black/5 dark:border-white/5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-burgundy dark:text-foreground mb-3 sm:mb-4">
            Submission Received!
          </h2>
          <p className="text-foreground/70 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">
            Your entry has been submitted successfully and is now <strong>pending review</strong>. Our admin team will approve it shortly. You&apos;ll be able to see it on the public page once approved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setFile(null);
                setFormData({ categoryId: '', title: '', description: '' });
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full border-2 border-saffron text-saffron hover:bg-saffron hover:text-white transition-all font-medium text-sm"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push('/categories')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-saffron hover:bg-saffron-light text-white transition-all font-medium text-sm shadow-md"
            >
              View Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Settings Loading Screen ──────────────────────────────────────────────────

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  // ── Closed Submissions Screen ────────────────────────────────────────────────

  if (!isSubmissionsOpen) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] py-8 px-4 sm:px-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-black/5 dark:border-white/5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 text-amber-600 dark:text-amber-400">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-burgundy dark:text-foreground mb-3">
            Submissions Are Closed
          </h2>
          <p className="text-foreground/70 mb-6 sm:mb-8 leading-relaxed text-xs sm:text-sm">
            {hasSubmissionDeadlinePassed && submissionDeadlineDate
              ? `The submission deadline was ${submissionDeadlineDate.toLocaleDateString(undefined, {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}. Submissions are no longer being accepted for this competition.`
              : 'The competition organizers have closed submissions at this time. You can still explore and vote for approved entries in the gallery.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/categories')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-saffron hover:bg-saffron-light text-white transition-all font-medium text-sm shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  const FileIcon = file ? FILE_TYPE_ICON[detectFileType(file)] : UploadCloud;

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-burgundy dark:text-foreground mb-2 sm:mb-3">
          Submit Your Entry
        </h1>
        <p className="text-foreground/70 max-w-md mx-auto text-xs sm:text-sm md:text-base">
          Fill in the details below and upload your file. Your submission will be reviewed by our admin team before it goes public.
        </p>
      </div>

      {/* Deadline Notice */}
      {submissionDeadlineDate && (
        <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-saffron/10 border border-saffron/20 text-foreground flex items-center gap-3 text-xs sm:text-sm">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-saffron" />
          <div>
            <span className="font-semibold">Submission Deadline:</span>{' '}
            <span className="text-foreground/80">
              {submissionDeadlineDate.toLocaleDateString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-black/5 dark:border-white/5 p-5 sm:p-8 space-y-5 sm:space-y-7"
      >
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm">
            <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Category */}
        <div>
          <label
            className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-1.5 sm:mb-2"
            htmlFor="categoryId"
          >
            Competition Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            required
            value={formData.categoryId}
            onChange={(e) =>
              setFormData((p) => ({ ...p, categoryId: e.target.value as CategorySlug }))
            }
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-foreground/20 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent outline-none transition-all bg-transparent dark:bg-black/20 text-foreground"
          >
            <option value="" disabled>
              Select a category...
            </option>
            {CATEGORY_SEEDS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label
            className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-1.5 sm:mb-2"
            htmlFor="title"
          >
            Submission Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder="Give your submission a memorable title"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-foreground/20 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent outline-none transition-all dark:bg-black/20 text-foreground"
          />
          <p className="text-[11px] sm:text-xs text-foreground/50 mt-1">
            {formData.title.length}/80 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-1.5 sm:mb-2"
            htmlFor="description"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            required
            rows={4}
            placeholder="Tell us about your submission..."
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-foreground/20 rounded-xl focus:ring-2 focus:ring-saffron focus:border-transparent outline-none transition-all dark:bg-black/20 resize-none text-foreground"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-1.5 sm:mb-2">
            Upload File <span className="text-red-500">*</span>
          </label>

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 sm:p-10 cursor-pointer transition-all
                ${
                  dragOver
                    ? 'border-saffron bg-saffron/5 scale-[1.01]'
                    : 'border-foreground/20 hover:border-saffron hover:bg-saffron/5'
                }`}
            >
              <UploadCloud
                className={`w-8 h-8 sm:w-10 sm:h-10 mb-2.5 sm:mb-3 transition-colors ${
                  dragOver ? 'text-saffron' : 'text-foreground/40'
                }`}
              />
              <p className="text-xs sm:text-sm font-medium text-foreground/80 text-center">
                Drag & drop or <span className="text-saffron underline underline-offset-2">browse files</span>
              </p>
              <p className="text-[11px] sm:text-xs text-foreground/50 mt-1 text-center">
                Images, Videos (MP4/MOV), PDF — max {MAX_FILE_SIZE_MB} MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_TYPES.join(',')}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3.5 bg-saffron/5 border border-saffron/30 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
              <div className="w-10 h-10 bg-saffron/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-5 h-5 text-saffron" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
                <p className="text-[11px] sm:text-xs text-foreground/50">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-foreground/40 hover:text-red-500 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {loading && uploadProgress > 0 && uploadProgress < 100 && (
          <div>
            <div className="flex justify-between text-xs text-foreground/60 mb-1">
              <span>Uploading to storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-foreground/10 rounded-full h-2">
              <div
                className="bg-saffron h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-light text-white px-6 py-3.5 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span>
                {uploadProgress > 0 && uploadProgress < 100
                  ? `Uploading ${uploadProgress}%...`
                  : 'Submitting...'}
              </span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Submit Entry</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] sm:text-xs text-foreground/50">
          By submitting, you confirm that this is your original work and agree to the competition terms.
        </p>
      </form>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <ProtectedRoute>
      <SubmitForm />
    </ProtectedRoute>
  );
}
