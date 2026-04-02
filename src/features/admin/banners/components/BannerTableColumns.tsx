/**
 * Banner Table Columns Component
 *
 * Defines the column structure for the banners table.
 * Handles rendering banner images, display order, and action buttons.
 *
 * @module BannerTableColumns
 */

import { Banner } from '../../../../types';
import { Trash2 } from 'lucide-react';
import type { Column } from '../../../shared/ui';

/**
 * Props for the banner table columns
 */
export interface BannerTableColumnsProps {
  /** Callback when delete button is clicked */
  onDelete: (id: string) => void;
}

/**
 * Creates the column definitions for the banners table
 *
 * The table displays:
 * - Image preview with proper aspect ratio
 * - Display order number
 * - Delete action button
 *
 * @param props - Column props containing delete callback
 * @returns Array of column definitions for the Table component
 *
 * @example
 * const columns = useBannerTableColumns({ onDelete: handleDelete });
 * <Table data={banners} columns={columns} keyFn={(b) => b.id} />
 */
export function useBannerTableColumns(props: BannerTableColumnsProps): Column<Banner>[] {
  const { onDelete } = props;

  return [
    /**
     * Image Column
     * Displays the banner image with responsive sizing and proper aspect ratio
     */
    {
      key: 'image',
      header: 'Image',
      cell: (banner: Banner) => (
        <div className="w-full max-w-32 sm:max-w-40 md:max-w-48 aspect-[3.8/1] rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
          <img
            src={banner.imageUrl}
            alt="Banner"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ),
    },

    /**
     * Display Order Column
     * Shows the numerical order for banner display
     */
    {
      key: 'order',
      header: 'Order',
      cell: (banner: Banner) => (
        <span className="text-sm text-slate-600">{banner.order}</span>
      ),
    },

    /**
     * Actions Column
     * Contains the delete button for each banner
     */
    {
      key: 'actions',
      header: '',
      cell: (banner: Banner) => (
        <div className="text-right">
          <button
            onClick={() => onDelete(banner.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete this banner"
            aria-label={`Delete banner ${banner.id}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];
}
