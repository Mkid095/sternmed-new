/**
 * Image Upload Component
 *
 * A reusable image upload component with drag-and-drop support,
 * preview display, and Cloudinary integration.
 *
 * Features:
 * - Drag and drop file upload
 * - Click to upload
 * - Image preview
 * - Upload progress indication
 * - File validation (type, size)
 * - Error handling
 *
 * @module ImageUpload
 */

import { forwardRef, ForwardedRef } from 'react';
import { useImageUpload } from './components/ImageUpload/useImageUpload';
import { ImagePreview } from './components/ImageUpload/ImagePreview';
import { UploadArea } from './components/ImageUpload/UploadArea';

/**
 * Props for the ImageUpload component
 */
export interface ImageUploadProps {
  /** Current image URL value */
  value: string;

  /** Callback when image URL changes */
  onChange: (url: string) => void;

  /** Label for the upload field */
  label?: string;

  /** Helper text displayed below the upload area */
  helperText?: string;

  /** Recommended image size text */
  recommendedSize?: string;

  /** Whether the upload is disabled */
  disabled?: boolean;

  /** Cloudinary folder path for uploads */
  uploadFolder?: string;

  /** Whether the field is required (shows asterisk) */
  required?: boolean;
}

/**
 * Image upload component with drag-and-drop support
 *
 * Provides a complete image upload interface:
 * - Displays current image or upload prompt
 * - Shows upload progress when uploading
 * - Displays error messages
 * - Shows helper text and recommendations
 *
 * @example
 * <ImageUpload
 *   value={imageUrl}
 *   onChange={setImageUrl}
 *   label="Product Image"
 *   recommendedSize="Recommended: 400x300 pixels"
 *   required
 * />
 */
export const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  function ImageUpload(
    {
      value,
      onChange,
      label = 'Product Image',
      helperText,
      recommendedSize = 'Recommended size: 400x300 pixels',
      disabled = false,
      uploadFolder = 'sternmed/products',
      required = false,
    }: ImageUploadProps,
    ref // Forwarded ref for the file input
  ) {
    // Use the custom hook for upload logic
    const {
      previewUrl,
      isUploading,
      uploadProgress,
      error,
      fileInputRef,
      handleInputChange,
      handleDragOver,
      handleDrop,
      handleRemove,
      triggerFileSelect,
    } = useImageUpload(value, {
      uploadFolder,
      onUploadComplete: onChange,
    });

    return (
      <div className="space-y-2">
        {/* Label */}
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Image Preview or Upload Area */}
        {previewUrl ? (
          <ImagePreview
            src={previewUrl}
            alt="Preview"
            disabled={disabled}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            onChange={triggerFileSelect}
            onRemove={handleRemove}
          />
        ) : (
          <UploadArea
            disabled={disabled}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            error={error}
            hasError={!!error}
            onClick={triggerFileSelect}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-label="Upload image"
        />

        {/* Error Message */}
        {error && (
          <ErrorMessage message={error} />
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}

        {/* Recommended Size */}
        {recommendedSize && !error && (
          <p className="text-xs text-slate-400">{recommendedSize}</p>
        )}

        {/* Hidden input for form submission */}
        {value && (
          <input type="hidden" name="imageUrl" value={value} />
        )}
      </div>
    );
  }
);

ImageUpload.displayName = 'ImageUpload';

/**
 * Error message component
 */
interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

/**
 * Default export for backward compatibility
 */
export default ImageUpload;
