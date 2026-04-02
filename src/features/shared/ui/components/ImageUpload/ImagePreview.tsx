/**
 * Image Preview Component
 *
 * Displays an uploaded image with overlay controls for
 * changing or removing the image.
 *
 * @module ImagePreview
 */

import { Upload, X } from 'lucide-react';

/**
 * Props for the ImagePreview component
 */
export interface ImagePreviewProps {
  /** URL of the image to preview */
  src: string;

  /** Alt text for the image */
  alt?: string;

  /** Whether the component is disabled */
  disabled?: boolean;

  /** Whether an upload is in progress */
  isUploading?: boolean;

  /** Current upload progress (0-100) */
  uploadProgress?: number;

  /** Callback to trigger image replacement */
  onChange: () => void;

  /** Callback to remove the image */
  onRemove: () => void;

  /** Height of the preview container */
  height?: string;
}

/**
 * Image preview component with overlay controls
 *
 * Shows the uploaded image with a hover overlay that reveals
 * action buttons for changing or removing the image.
 * Displays upload progress bar when uploading.
 *
 * @example
 * <ImagePreview
 *   src="https://example.com/image.jpg"
 *   alt="Product preview"
 *   onChange={handleChange}
 *   onRemove={handleRemove}
 *   isUploading={isUploading}
 *   uploadProgress={60}
 * />
 */
export function ImagePreview({
  src,
  alt = 'Preview',
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  onChange,
  onRemove,
  height = '12rem',
}: ImagePreviewProps) {
  return (
    <div className="relative group">
      {/* Image Container */}
      <div
        className="w-full bg-slate-100 rounded-md overflow-hidden border border-slate-200"
        style={{ height }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Hover Overlay with Action Buttons */}
      <div
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        aria-hidden="true"
      >
        <button
          type="button"
          onClick={onChange}
          disabled={disabled || isUploading}
          className="p-2 bg-white rounded-full text-slate-700 hover:text-blue-600 disabled:opacity-50 transition-colors"
          title="Change image"
          aria-label="Change image"
        >
          <Upload size={20} />
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || isUploading}
          className="p-2 bg-white rounded-full text-slate-700 hover:text-red-600 disabled:opacity-50 transition-colors"
          title="Remove image"
          aria-label="Remove image"
        >
          <X size={20} />
        </button>
      </div>

      {/* Upload Progress Bar */}
      {isUploading && <ProgressBar progress={uploadProgress} />}
    </div>
  );
}

/**
 * Upload progress bar component
 */
interface ProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${progress}%`}
      />
    </div>
  );
}
