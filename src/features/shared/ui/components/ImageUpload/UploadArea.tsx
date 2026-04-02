/**
 * Upload Area Component
 *
 * Drag-and-drop zone for image upload with loading state
 * and error indication.
 *
 * @module UploadArea
 */

import React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';

/**
 * Props for the UploadArea component
 */
export interface UploadAreaProps {
  /** Whether the upload is disabled */
  disabled?: boolean;

  /** Whether an upload is in progress */
  isUploading?: boolean;

  /** Current upload progress (0-100) */
  uploadProgress?: number;

  /** Error message to display */
  error?: string | null;

  /** Whether to show error styling */
  hasError?: boolean;

  /** Callback when area is clicked */
  onClick: () => void;

  /** Callback for drag over event */
  onDragOver: (e: React.DragEvent) => void;

  /** Callback for drop event */
  onDrop: (e: React.DragEvent) => void;

  /** Height of the upload area */
  height?: string;

  /** Accepted file formats description */
  acceptedFormats?: string;

  /** Maximum file size description */
  maxSize?: string;
}

/**
 * Drag-and-drop upload area component
 *
 * Displays a clickable/draggable area for file uploads.
 * Shows loading state during upload and error state when validation fails.
 *
 * @example
 * <UploadArea
 *   isUploading={isUploading}
 *   uploadProgress={60}
 *   error={error}
 *   onClick={triggerFileSelect}
 *   onDragOver={handleDragOver}
 *   onDrop={handleDrop}
 * />
 */
export function UploadArea({
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  error = null,
  hasError = false,
  onClick,
  onDragOver,
  onDrop,
  height = '12rem',
  acceptedFormats = 'JPEG, PNG, WebP, GIF (max 5MB)',
}: UploadAreaProps) {
  return (
    <div
      onClick={disabled || isUploading ? undefined : onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors
        ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'}
        ${(disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{ height }}
      aria-label={isUploading ? `Uploading ${uploadProgress}%` : 'Upload area'}
    >
      {/* Upload State Content */}
      {isUploading ? (
        <LoadingContent progress={uploadProgress} />
      ) : (
        <IdleContent acceptedFormats={acceptedFormats} />
      )}

      {/* Upload Progress Bar */}
      {isUploading && <ProgressBar progress={uploadProgress} />}
    </div>
  );
}

/**
 * Content displayed during upload progress
 */
interface LoadingContentProps {
  progress: number;
}

function LoadingContent({ progress }: LoadingContentProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Loader2 size={32} className="text-blue-600 animate-spin" aria-hidden="true" />
      <span className="text-sm text-slate-600" aria-live="polite">
        Uploading... {progress}%
      </span>
    </div>
  );
}

/**
 * Content displayed when idle (not uploading)
 */
interface IdleContentProps {
  acceptedFormats: string;
}

function IdleContent({ acceptedFormats }: IdleContentProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-slate-500">
      <ImageIcon size={32} aria-hidden="true" />
      <span className="text-sm font-medium">Click to upload or drag & drop</span>
      <span className="text-xs text-slate-400">{acceptedFormats}</span>
    </div>
  );
}

/**
 * Progress bar component for upload area
 */
interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 rounded-b-md">
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
