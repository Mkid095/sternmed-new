/**
 * Add Category Modal Component
 *
 * Modal for adding a new category.
 * Replaces native window.prompt() with a proper UI component.
 *
 * @module AddCategoryModal
 */

import { useState, FormEvent } from 'react';
import { Modal, Button, Input, useToastError } from '../../../shared/ui';

/**
 * Props for AddCategoryModal component
 */
export interface AddCategoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Callback to add the category */
  onAdd: (name: string, showOnHome: boolean) => Promise<void>;
}

/**
 * Add category modal component
 *
 * Provides a form-based modal for adding categories:
 * - Category name input (required)
 * - Show on home toggle
 * - Submit and cancel buttons
 *
 * @example
 * <AddCategoryModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onAdd={async (name, showOnHome) => {
 *     await api.createCategory({ name, showOnHome });
 *   }}
 * />
 */
export function AddCategoryModal({
  isOpen,
  onClose,
  onAdd,
}: AddCategoryModalProps) {
  // ============ State ============

  const [name, setName] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Toast notifications
  const showError = useToastError();

  /**
   * Reset form state
   */
  const resetForm = () => {
    setName('');
    setShowOnHome(false);
    setSubmitting(false);
    setError('');
  };

  /**
   * Handle modal close with form reset
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Category name must be at least 2 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onAdd(name.trim(), showOnHome);
      resetForm();
    } catch (error) {
      console.error('Failed to add category:', error);
      showError('Failed to add category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============ Render ============

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Category"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Name Input */}
        <Input
          label="Category Name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="e.g., Medical Equipment"
          autoFocus
          error={error}
        />

        {/* Show on Home Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showOnHome"
            checked={showOnHome}
            onChange={(e) => setShowOnHome(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="showOnHome"
            className="text-sm font-medium text-slate-700"
          >
            Show on home page
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Adding...' : 'Add Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
