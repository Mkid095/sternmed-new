/**
 * Confirmation Modal Component
 *
 * A customizable modal for confirming destructive actions
 * like deleting items. Replaces native confirm() dialogs.
 *
 * @module ConfirmationModal
 */

import { useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * Props for the ConfirmationModal component
 */
export interface ConfirmationModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;

  /** Callback when modal is closed */
  onClose: () => void;

  /** Callback when user confirms the action */
  onConfirm: () => void;

  /** Title of the confirmation dialog */
  title?: string;

  /** Message to display to the user */
  message: string;

  /** Type/danger level of the action */
  variant?: 'danger' | 'warning' | 'info';

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Whether the confirm button shows loading state */
  isConfirming?: boolean;
}

/**
 * Confirmation modal component
 *
 * Provides a consistent, styled alternative to native confirm() dialogs.
 * Useful for confirming destructive actions like delete.
 *
 * @example
 * <ConfirmationModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Banner"
 *   message="Are you sure you want to delete this banner? This action cannot be undone."
 *   variant="danger"
 *   confirmText="Delete"
 * />
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  variant = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}: ConfirmationModalProps) {
  // Handle confirm with modal close
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  // Variant styling
  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-50',
      button: 'bg-red-600 text-white hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-500',
      iconBg: 'bg-yellow-50',
      button: 'bg-yellow-600 text-white hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-500',
      iconBg: 'bg-blue-50',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className={`flex justify-center ${styles.iconBg} rounded-full p-3 w-fit mx-auto`}>
          <AlertTriangle size={24} className={styles.icon} aria-hidden="true" />
        </div>

        {/* Message */}
        <p className="text-center text-sm text-slate-700 whitespace-pre-wrap">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isConfirming}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className={styles.button}
          >
            {isConfirming ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Custom hook for managing confirmation modal state
 *
 * Simplifies usage of ConfirmationModal by managing common state patterns.
 *
 * @param defaultOnConfirm - Default callback when user confirms (can be overridden when opening)
 * @returns Object with modal state and handlers
 *
 * @example
 * function MyComponent() {
 *   const confirmDelete = useConfirmationModal();
 *
 *   const handleDelete = (id: string) => {
 *     confirmDelete.open({
 *       title: 'Delete Item',
 *       message: 'Are you sure?',
 *       onConfirm: async () => {
 *         await api.deleteItem(id);
 *       },
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={() => handleDelete(id)}>Delete</button>
 *       <ConfirmationModal
 *         isOpen={confirmDelete.isOpen}
 *         {...confirmDelete.props}
 *       />
 *     </>
 *   );
 * }
 */
export function useConfirmationModal(defaultOnConfirm?: () => void | Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
  }>({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    variant: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: defaultOnConfirm,
  });

  /**
   * Open the confirmation modal with specific config
   */
  const open = useCallback((overrideConfig?: Partial<typeof config>) => {
    setConfig((prev) => ({ ...prev, ...overrideConfig }));
    setIsOpen(true);
  }, []);

  /**
   * Close the confirmation modal
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Handle confirmation action
   */
  const handleConfirm = useCallback(async () => {
    if (config.onConfirm) {
      await config.onConfirm();
    }
    close();
  }, [config.onConfirm, close]);

  /**
   * Confirm method that returns a promise - simpler API for one-time confirmations
   * Returns true if user confirmed, false if cancelled
   */
  const confirm = useCallback((overrideConfig: Omit<Partial<typeof config>, 'onConfirm'> & { onConfirm?: () => void | Promise<void> }): Promise<boolean> => {
    return new Promise((resolve) => {
      const onConfirmWithResolve = async () => {
        if (overrideConfig.onConfirm) {
          await overrideConfig.onConfirm();
        }
        resolve(true);
        close();
      };

      setConfig((prev) => ({
        ...prev,
        ...overrideConfig,
        onConfirm: onConfirmWithResolve,
      }));
      setIsOpen(true);
    });
  }, [close]);

  return {
    isOpen,
    open,
    close,
    confirm,
    props: {
      isOpen,
      onClose: close,
      onConfirm: handleConfirm,
      title: config.title,
      message: config.message,
      variant: config.variant,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
    },
  };
}
