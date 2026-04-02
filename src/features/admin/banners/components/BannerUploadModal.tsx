/**
 * Banner Upload Modal Component
 *
 * Modal form for uploading new banners with image validation
 * and display order configuration.
 *
 * @module BannerUploadModal
 */

import React, { FormEvent } from 'react';
import { Modal, Button } from '../../../shared/ui';
import { BannerImageUploader } from './BannerImageUploader';

/**
 * Form data structure for banner creation
 */
export interface BannerFormData {
  /** URL of the uploaded image */
  imageUrl: string;
  /** Display order for the banner */
  order: number;
  /** Original file object (optional) */
  file?: File;
}

/**
 * Props for the BannerUploadModal component
 */
export interface BannerUploadModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Current form data */
  formData: BannerFormData;

  /** Whether an upload is in progress */
  isUploading: boolean;

  /** Error message from validation/upload */
  error: string;

  /** Current image preview URL */
  previewUrl: string;

  /** Callback when file is selected for upload */
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Callback to remove the current image */
  onRemoveImage: () => void;

  /** Callback when form is submitted */
  onSubmit: (e: FormEvent) => void;

  /** Callback to update form data */
  onFormDataChange: (data: BannerFormData) => void;
}

/**
 * Modal component for uploading new banners
 *
 * Features:
 * - Image upload with validation
 * - Display order configuration
 * - Form submission handling
 * - Loading and error states
 *
 * @example
 * <BannerUploadModal
 *   isOpen={isAdding}
 *   onClose={() => setIsAdding(false)}
 *   formData={newBanner}
 *   isUploading={isUploading}
 *   error={uploadError}
 *   previewUrl={previewUrl}
 *   onFileSelect={handleFileSelect}
 *   onRemoveImage={handleRemoveImage}
 *   onSubmit={handleAddBanner}
 *   onFormDataChange={setNewBanner}
 * />
 */
export function BannerUploadModal({
  isOpen,
  onClose,
  formData,
  isUploading,
  error,
  previewUrl,
  onFileSelect,
  onRemoveImage,
  onSubmit,
  onFormDataChange,
}: BannerUploadModalProps) {
  /**
   * Handle display order input change
   */
  const handleOrderChange = (value: string) => {
    const order = parseInt(value) || 1;
    onFormDataChange({ ...formData, order });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Banner" size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Image Upload Section */}
        <BannerImageUploader
          previewUrl={previewUrl}
          isUploading={isUploading}
          error={error}
          onFileSelect={onFileSelect}
          onRemove={onRemoveImage}
        />

        {/* Display Order Input */}
        <DisplayOrderInput
          value={formData.order}
          onChange={handleOrderChange}
          disabled={isUploading}
        />

        {/* Form Actions */}
        <FormActions
          onCancel={onClose}
          isSubmitting={isUploading}
          hasImage={!!formData.imageUrl}
        />
      </form>
    </Modal>
  );
}

/**
 * Display order number input component
 */
interface DisplayOrderInputProps {
  value: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function DisplayOrderInput({ value, onChange, disabled }: DisplayOrderInputProps) {
  return (
    <div>
      <label htmlFor="banner-order" className="block text-sm font-medium text-slate-700 mb-1">
        Display Order
      </label>
      <input
        id="banner-order"
        type="number"
        required
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
        aria-describedby="banner-order-description"
      />
      <p id="banner-order-description" className="mt-1 text-xs text-slate-500">
        Determines the order in which banners are displayed (lower numbers appear first)
      </p>
    </div>
  );
}

/**
 * Form action buttons component
 */
interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  hasImage: boolean;
}

function FormActions({ onCancel, isSubmitting, hasImage }: FormActionsProps) {
  return (
    <div className="pt-4 flex justify-end gap-2">
      {/* Cancel Button */}
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || !hasImage}
        aria-label={isSubmitting ? 'Uploading banner...' : 'Save banner'}
      >
        {isSubmitting ? 'Uploading...' : 'Save Banner'}
      </Button>
    </div>
  );
}
