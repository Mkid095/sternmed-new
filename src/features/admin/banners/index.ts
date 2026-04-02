/**
 * Admin Banners Feature Exports
 *
 * Exports all components and utilities from the banners feature
 * for cleaner imports throughout the application.
 */

// Main component
export { default as AdminBanners } from './AdminBanners';

// Utilities
export {
  validateImageDimensions,
  isValidImageType,
  isValidFileSize,
  validateBannerImage,
  getDimensionRecommendationText,
  RECOMMENDED_BANNER_WIDTH,
  RECOMMENDED_BANNER_HEIGHT,
  MAX_FILE_SIZE,
} from './utils/bannerValidation';

// Components
export { useBannerTableColumns } from './components/BannerTableColumns';
export { BannerImageUploader } from './components/BannerImageUploader';
export { BannerUploadModal } from './components/BannerUploadModal';

// Types
export type { BannerTableColumnsProps } from './components/BannerTableColumns';
export type { BannerImageUploaderProps } from './components/BannerImageUploader';
export type { BannerUploadModalProps, BannerFormData } from './components/BannerUploadModal';
