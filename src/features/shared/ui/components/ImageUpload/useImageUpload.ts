/**
 * useImageUpload Hook
 *
 * Custom hook for handling image upload logic including:
 * - File selection and validation
 * - Upload progress tracking
 * - Error handling
 * - Preview generation
 *
 * @module useImageUpload
 */

import React, { useState, ChangeEvent, DragEvent, useRef, useEffect } from 'react';
import { storageService } from '../../../../../services/storage.service';

/**
 * Configuration options for the image upload hook
 */
export interface UseImageUploadOptions {
  /** Cloudinary upload folder path */
  uploadFolder?: string;

  /** Callback when upload completes successfully */
  onUploadComplete?: (url: string) => void;

  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
}

/**
 * State and functions returned by useImageUpload hook
 */
export interface UseImageUploadReturn {
  /** Current image URL value */
  value: string;

  /** Preview URL of the current/uploaded image */
  previewUrl: string;

  /** Whether an upload is currently in progress */
  isUploading: boolean;

  /** Upload progress percentage (0-100) */
  uploadProgress: number;

  /** Error message from validation or upload failure */
  error: string | null;

  /** Reference to the hidden file input element */
  fileInputRef: React.RefObject<HTMLInputElement>;

  /** Updates the image URL value directly */
  setValue: (url: string) => void;

  /** Initiates file upload from selected file */
  handleFileUpload: (file: File) => Promise<void>;

  /** Handles file input change event */
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;

  /** Handles drag over event for drop zone */
  handleDragOver: (e: DragEvent) => void;

  /** Handles drop event for drop zone */
  handleDrop: (e: DragEvent) => void;

  /** Removes the current image */
  handleRemove: () => void;

  /** Triggers the file input click */
  triggerFileSelect: () => void;
}

/**
 * Custom hook for managing image upload functionality
 *
 * Handles the complete image upload workflow:
 * 1. File validation (type, size)
 * 2. Preview generation
 * 3. Upload to Cloudinary
 * 4. Progress tracking
 * 5. Error handling
 *
 * @param initialValue - Initial image URL
 * @param options - Configuration options
 * @returns Object containing state and handler functions
 *
 * @example
 * const {
 *   previewUrl,
 *   isUploading,
 *   error,
 *   handleInputChange,
 *   handleDragOver,
 *   handleDrop,
 *   triggerFileSelect
 * } = useImageUpload(currentUrl, {
 *   uploadFolder: 'sternmed/products',
 *   onUploadComplete: (url) => onChange(url)
 * });
 */
export function useImageUpload(
  initialValue: string = '',
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const { uploadFolder = 'sternmed/products', onUploadComplete, onUploadError } = options;

  // State management
  const [value, setValue] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Local preview uses an object URL so a large image never spends its main
  // thread being base64-encoded (FileReader.readAsDataURL on a 4MB file
  // blocks for hundreds of milliseconds — the wizard's INP offender).
  const [localPreview, setLocalPreviewState] = useState<string | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    },
    []
  );

  const setLocalPreview = (url: string | null) => {
    if (localPreviewRef.current && localPreviewRef.current !== url) {
      URL.revokeObjectURL(localPreviewRef.current);
    }
    localPreviewRef.current = url;
    setLocalPreviewState(url);
  };

  const previewUrl = localPreview ?? value;

  /**
   * Handles the actual file upload process
   * Includes validation, preview generation, and progress tracking
   */
  async function handleFileUpload(file: File): Promise<void> {
    // Reset error state
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Validate the file
      const validation = storageService.validateImage(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsUploading(false);
        onUploadError?.(validation.error || 'Invalid file');
        return;
      }

      // Step 2: Create local preview. Object URL, not FileReader:
      // readAsDataURL base64-encodes the whole file on the main thread,
      // which is what blocked the upload button's handler for ~500ms.
      setLocalPreview(URL.createObjectURL(file));

      // Step 3: Simulate progress for better UX
      // (fetch doesn't support progress, so we fake it)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Step 4: Upload to Cloudinary
      const result = await storageService.uploadImage(file, uploadFolder);

      // Step 5: Complete upload
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update state with uploaded URL; drop the local object URL so the
      // preview shows the canonical remote image.
      const uploadedUrl = result.url;
      setValue(uploadedUrl);
      setLocalPreview(null);

      // Notify parent component
      onUploadComplete?.(uploadedUrl);

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 500);
    } catch (err: any) {
      // Handle upload failure
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      setLocalPreview(null); // Revert to the previous image
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Handles file input change event
   * Extracts the file and initiates upload
   */
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  /**
   * Handles drag over event
   * Prevents default browser behavior to allow dropping
   */
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handles drop event
   * Extracts the dropped file and initiates upload
   */
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Don't allow drop if disabled or already uploading
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  /**
   * Removes the current image
   * Resets all state to initial values
   */
  function handleRemove() {
    setValue('');
    setLocalPreview(null);
    setError(null);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  /**
   * Triggers the hidden file input click
   * Opens the file selection dialog
   */
  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  return {
    value,
    previewUrl,
    isUploading,
    uploadProgress,
    error,
    fileInputRef,
    setValue,
    handleFileUpload,
    handleInputChange,
    handleDragOver,
    handleDrop,
    handleRemove,
    triggerFileSelect,
  };
}
