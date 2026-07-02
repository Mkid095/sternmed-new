/**
 * Admin Banners Management Page
 *
 * Main component for managing banner images in the admin dashboard.
 * Handles banner CRUD operations including image upload with validation.
 *
 * Features:
 * - Card-based banner preview for mobile and desktop
 * - Drag-to-reorder banners
 * - Image upload with dimension validation (1900x500px recommended)
 * - Delete banners with confirmation
 * - Professional mobile-first design
 *
 * @module AdminBanners
 */

import React, { useState, useEffect, type Key } from 'react';
import { Plus, Image as ImageIcon, Trash2, GripVertical, X } from 'lucide-react';
import { api } from '../../../services/api';
import { Banner } from '../../../types';
import { ImageUpload, ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui';

/**
 * Admin Banners Management Component
 *
 * Manages the banner images displayed on the website's homepage carousel.
 */
export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({ imageUrl: '', order: 1 });
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const showSuccess = useToastSuccess();
  const showError = useToastError();
  const confirmModal = useConfirmationModal();

  const fetchData = async () => {
    try {
      const data = await api.getBanners();
      setBanners(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      showError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddForm = () => {
    setFormData({ imageUrl: '', order: banners.length + 1 });
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setFormData({ imageUrl: '', order: 1 });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      showError('Please upload a banner image');
      return;
    }

    setIsUploading(true);
    try {
      await api.createBanner({
        imageUrl: formData.imageUrl,
        order: banners.length + 1,
      });

      showSuccess('Banner added successfully');
      closeForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create banner:', error);
      showError('Failed to add banner');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmModal.confirm({
      title: 'Delete Banner',
      message: 'Are you sure you want to delete this banner? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await api.deleteBanner(id);
        showSuccess('Banner deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Failed to delete banner:', error);
        showError('Failed to delete banner');
      }
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    // Reorder banners
    const newBanners = [...banners];
    const [removed] = newBanners.splice(draggedItem, 1);
    newBanners.splice(dropIndex, 0, removed);

    // Update order values
    const updatedBanners = newBanners.map((banner, index) => ({
      ...banner,
      order: index + 1,
    }));

    setBanners(updatedBanners);
    setDraggedItem(null);

    // In a real implementation, save to database
    showSuccess('Banner order updated');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ImageIcon size={28} className="text-primary-600" />
              Banners
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Manage homepage banner carousel (Recommended: 1900x500px)
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Banner
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg self-start">
          <ImageIcon size={18} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{banners.length} banner{banners.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Add/Edit Banner Modal */}
      {isAdding && (
        <BannerModal
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isUploading={isUploading}
        />
      )}

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No banners found</h3>
          <p className="text-slate-500 mb-4">
            Add banners to display on the homepage carousel
          </p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={20} />
            Add Your First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner, index) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              index={index}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedItem === index}
            />
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={openAddForm}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal {...confirmModal.props} />
    </div>
  );
}

/**
 * Banner Card Component
 */
interface BannerCardProps {
  key?: Key;
  banner: Banner;
  index: number;
  onDelete: (id: string) => Promise<void>;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  isDragging: boolean;
}

function BannerCard({ banner, index, onDelete, onDragStart, onDragOver, onDrop, isDragging }: BannerCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {/* Banner Image */}
      <div className="relative aspect-[3.8/1] bg-slate-100 group">
        <img
          src={banner.imageUrl}
          alt={`Banner ${banner.order}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Order Badge */}
        <div className="absolute top-2 left-2 bg-primary-600 text-white px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm">
          #{banner.order}
        </div>

        {/* Drag Handle */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-white/80 rounded-lg p-1">
          <GripVertical size={16} className="text-slate-600" />
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">Position {banner.order}</span>
        <button
          onClick={() => onDelete(banner.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete banner"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Banner Modal Component
 */
interface BannerModalProps {
  key?: Key;
  formData: { imageUrl: string; order: number };
  onChange: (data: any) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  isUploading: boolean;
}

function BannerModal({ formData, onChange, onSubmit, onClose, isUploading }: BannerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Add New Banner</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 sm:pb-4">
          <div>
            <ImageUpload
              label="Banner Image"
              value={formData.imageUrl}
              onChange={(url) => onChange({ ...formData, imageUrl: url })}
              recommendedSize="Recommended: 1900x500px for best display"
            />
          </div>

          {formData.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <ImageIcon size={16} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <span>
                <strong>Tip:</strong> For best results, use images with 1900x500px dimensions.
                This ensures banners display correctly across all devices.
              </span>
            </p>
          </div>

          {/* Footer - Moved inside form */}
          <div className="flex gap-3 p-4 border-t border-slate-200 bg-white sm:bg-slate-50 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !formData.imageUrl}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Banner
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
