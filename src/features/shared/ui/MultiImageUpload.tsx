/**
 * Multi Image Upload Component
 *
 * A reusable component for uploading and managing multiple images.
 * Features include:
 * - Add/remove multiple images
 * - Image thumbnail preview
 * - Reorder images (move left/right)
 * - Drag and drop support
 * - Upload progress indication
 * - File validation (type, size)
 *
 * @module MultiImageUpload
 */

import React, { useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { storageService } from '../../../services/storage.service';

/**
 * Props for the MultiImageUpload component
 */
export interface MultiImageUploadProps {
  /** Array of image URLs */
  value: string[];

  /** Callback when image URLs change */
  onChange: (urls: string[]) => void;

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

  /** Maximum number of images allowed */
  maxImages?: number;

  /** Whether the field is required (shows asterisk) */
  required?: boolean;
}

/**
 * Multi image upload component with thumbnail management
 *
 * Provides a complete multi-image upload interface:
 * - Displays thumbnails of uploaded images
 * - Shows add button for uploading new images
 * - Allows removing individual images
 * - Supports reordering images
 * - Shows upload progress when uploading
 * - Displays error messages
 *
 * @example
 * <MultiImageUpload
 *   value={images}
 *   onChange={setImages}
 *   label="Product Gallery"
 *   maxImages={5}
 *   recommendedSize="Recommended: 400x300 pixels"
 *   required
 * />
 */
export function MultiImageUpload({
  value = [],
  onChange,
  label = 'Product Images',
  helperText,
  recommendedSize = 'Recommended: 400x300px. Max 5 images.',
  disabled = false,
  uploadFolder = 'sternmed/products',
  maxImages = 5,
  required = false,
}: MultiImageUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles file upload for a specific index
   */
  const handleFileUpload = async (file: File, index?: number) => {
    // Reset error state
    setError(null);
    setUploadingIndex(index ?? value.length);
    setUploadProgress(0);

    try {
      // Validate the file
      const validation = storageService.validateImage(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setUploadingIndex(null);
        return;
      }

      // Check max images limit
      if (index === undefined && value.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        setUploadingIndex(null);
        return;
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to Cloudinary
      const result = await storageService.uploadImage(file, uploadFolder);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update state with uploaded URL
      const uploadedUrl = result.url;

      if (index !== undefined) {
        // Replace existing image
        const newImages = [...value];
        newImages[index] = uploadedUrl;
        onChange(newImages);
      } else {
        // Add new image
        onChange([...value, uploadedUrl]);
      }

      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadingIndex(null);
      }, 500);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      setUploadingIndex(null);
      setUploadProgress(0);
    }
  };

  /**
   * Handles file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      // Reset input
      e.target.value = '';
    }
  };

  /**
   * Removes an image at the specified index
   */
  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  /**
   * Moves an image left or right in the array
   */
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newImages = [...value];
    const newIndex = direction === 'left' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newImages.length) {
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      onChange(newImages);
    }
  };

  /**
   * Triggers file input click
   */
  const triggerFileSelect = () => {
    document.getElementById('multi-image-upload-input')?.click();
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {/* Existing Images */}
        {value.map((imageUrl, index) => (
          <div
            key={index}
            className="relative aspect-square bg-slate-100 rounded-md overflow-hidden border border-slate-200 group"
          >
            <img
              src={imageUrl}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Overlay with controls */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled || uploadingIndex !== null}
                className="p-1.5 bg-white rounded-full text-slate-700 hover:text-red-600 disabled:opacity-50 transition-colors"
                title="Remove image"
              >
                <X size={16} />
              </button>

              {/* Move left button */}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleMove(index, 'left')}
                  disabled={disabled || uploadingIndex !== null}
                  className="p-1.5 bg-white rounded-full text-slate-700 hover:text-blue-600 disabled:opacity-50 transition-colors"
                  title="Move left"
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              {/* Move right button */}
              {index < value.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleMove(index, 'right')}
                  disabled={disabled || uploadingIndex !== null}
                  className="p-1.5 bg-white rounded-full text-slate-700 hover:text-blue-600 disabled:opacity-50 transition-colors"
                  title="Move right"
                >
                  <ChevronRight size={16} />
                </button>
              )}

              {/* Replace button */}
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file, index);
                  };
                  input.click();
                }}
                disabled={disabled || uploadingIndex !== null}
                className="p-1.5 bg-white rounded-full text-slate-700 hover:text-blue-600 disabled:opacity-50 transition-colors"
                title="Replace image"
              >
                <Upload size={16} />
              </button>
            </div>

            {/* Upload Progress for this image */}
            {uploadingIndex === index && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Index badge */}
            <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        ))}

        {/* Add Image Button */}
        {value.length < maxImages && (
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={disabled || uploadingIndex !== null}
            className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center gap-1 hover:bg-slate-100 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} className="text-slate-400" />
            <span className="text-xs text-slate-500">Add</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        id="multi-image-upload-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        disabled={disabled || uploadingIndex !== null}
        className="hidden"
        aria-label="Upload images"
      />

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}

      {/* Recommended Size */}
      {recommendedSize && !error && (
        <p className="text-xs text-slate-400">{recommendedSize}</p>
      )}

      {/* Image count */}
      <p className="text-xs text-slate-400">
        {value.length} of {maxImages} images
      </p>

      {/* Hidden input for form submission - stores comma-separated URLs */}
      <input type="hidden" name="images" value={value.join(',')} />
    </div>
  );
}

/**
 * Default export for backward compatibility
 */
export default MultiImageUpload;
