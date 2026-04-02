/**
 * Banner Image Uploader Component
 *
 * Handles the image upload interface for banners including:
 * - Drag and drop or click to upload
 * - Image preview after upload
 * - Dimension recommendation display
 * - Error message display
 *
 * @module BannerImageUploader
 */

import { useState, ChangeEvent } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { getDimensionRecommendationText } from '../utils/bannerValidation';

/**
 * Props for the BannerImageUploader component
 */
export interface BannerImageUploaderProps {
  /** Current preview URL of the uploaded image */
  previewUrl: string;

  /** Whether an upload is currently in progress */
  isUploading: boolean;

  /** Error message to display */
  error: string;

  /** Callback when a file is selected */
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;

  /** Callback to remove the current image */
  onRemove: () => void;
}

/**
 * Banner image uploader component with drag-and-drop support
 *
 * Features:
 * - Click or drag-and-drop file upload
 * - Image preview with remove button
 * - Upload progress indication
 * - Dimension recommendation display (1900x500px recommended)
 * - Error message display
 *
 * @example
 * <BannerImageUploader
 *   previewUrl={previewUrl}
 *   isUploading={isUploading}
 *   error={error}
 *   onFileSelect={handleFileSelect}
 *   onRemove={handleRemoveImage}
 * />
 */
export function BannerImageUploader({
  previewUrl,
  isUploading,
  error,
  onFileSelect,
  onRemove,
}: BannerImageUploaderProps) {
  const recommendationText = getDimensionRecommendationText();

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">
        Banner Image <span className="text-red-500">*</span>
      </label>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        {previewUrl ? (
          // Image Preview Mode - Shows uploaded image with remove button
          <ImagePreviewContent imageUrl={previewUrl} onRemove={onRemove} />
        ) : (
          // Upload Mode - Shows upload prompt
          <UploadPromptContent isUploading={isUploading} onFileSelect={onFileSelect} recommendationText={recommendationText} />
        )}
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

/**
 * Component for displaying the uploaded image preview
 */
interface ImagePreviewContentProps {
  imageUrl: string;
  onRemove: () => void;
}

function ImagePreviewContent({ imageUrl, onRemove }: ImagePreviewContentProps) {
  return (
    <div className="space-y-4">
      {/* Image with remove button overlay */}
      <div className="relative">
        <img
          src={imageUrl}
          alt="Banner preview"
          className="w-full h-auto rounded-lg"
          style={{ aspectRatio: '3.8/1' }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
          aria-label="Remove image"
          title="Remove this image"
        >
          <X size={16} />
        </button>
      </div>

      {/* Success message */}
      <p className="text-sm text-green-600 flex items-center justify-center gap-1">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Image uploaded successfully
      </p>
    </div>
  );
}

/**
 * Component for displaying the upload prompt
 */
interface UploadPromptContentProps {
  isUploading: boolean;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  recommendationText: string;
}

function UploadPromptContent({ isUploading, onFileSelect, recommendationText }: UploadPromptContentProps) {
  return (
    <div className="space-y-3">
      {/* Upload icon */}
      <Upload className="mx-auto h-12 w-12 text-slate-400" />

      {/* Upload prompt text */}
      <div className="space-y-1">
        <label htmlFor="banner-file-upload" className="cursor-pointer">
          <span className="mt-2 block text-sm font-medium text-blue-600 hover:text-blue-700">
            Click to upload an image
          </span>
          <span className="text-xs text-slate-500">or drag and drop</span>
        </label>
        <input
          id="banner-file-upload"
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
          disabled={isUploading}
          aria-label="Upload banner image"
        />
      </div>

      {/* Accepted file types */}
      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>

      {/* Dimension recommendation notice */}
      <div className="flex items-start justify-center gap-2 p-3 bg-slate-50 rounded-lg">
        <AlertCircle size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 text-left">
          <strong>Recommended dimensions:</strong> {recommendationText}
        </p>
      </div>
    </div>
  );
}

/**
 * Component for displaying error messages
 */
interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </p>
  );
}
