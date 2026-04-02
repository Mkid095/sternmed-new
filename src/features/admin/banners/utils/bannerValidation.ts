/**
 * Banner Image Validation Utilities
 *
 * This module provides functions for validating banner images
 * before they are uploaded to the server.
 *
 * @module bannerValidation
 */

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Recommended banner dimensions (not enforced)
export const RECOMMENDED_BANNER_WIDTH = 1900;
export const RECOMMENDED_BANNER_HEIGHT = 500;

/**
 * Validates that an image file has acceptable dimensions
 * Note: Dimensions are no longer enforced - this only reports back dimensions
 *
 * @param file - The image file to validate
 * @returns Promise<{ valid: boolean; width?: number; height?: number }> - Validation result with dimensions
 *
 * @example
 * const result = await validateImageDimensions(file);
 * console.log(`Image dimensions: ${result.width}x${result.height}`);
 */
export function validateImageDimensions(file: File): Promise<{ valid: boolean; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    /**
     * Handle successful image load
     * Returns the image dimensions (no validation enforced)
     */
    img.onload = () => {
      // Clean up the object URL to free memory
      URL.revokeObjectURL(url);

      // All dimensions are now accepted
      resolve({ valid: true, width: img.width, height: img.height });
    };

    /**
     * Handle image load error
     * Returns false if the image cannot be loaded
     */
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false });
    };

    // Start loading the image
    img.src = url;
  });
}

/**
 * Validates that a file is an image type
 *
 * @param file - The file to validate
 * @returns boolean - True if file is an image, false otherwise
 *
 * @example
 * if (!isValidImageType(file)) {
 *   alert('Please select an image file');
 * }
 */
export function isValidImageType(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Validates that a file is within the size limit (5MB)
 *
 * @param file - The file to validate
 * @returns boolean - True if file size is acceptable, false otherwise
 *
 * @example
 * if (!isValidFileSize(file)) {
 *   alert('File size must be less than 5MB');
 * }
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Validates a file for banner upload (type and size only)
 *
 * @param file - The file to validate
 * @returns Promise<{ valid: boolean; error?: string }> - Validation result with optional error message
 *
 * @example
 * const result = await validateBannerImage(file);
 * if (!result.valid) {
 *   setError(result.error);
 * }
 */
export async function validateBannerImage(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check if file is an image
  if (!isValidImageType(file)) {
    return { valid: false, error: 'Please select an image file' };
  }

  // Check file size
  if (!isValidFileSize(file)) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }

  return { valid: true };
}

/**
 * Formats the dimension recommendation as a human-readable string
 *
 * @returns string - Formatted dimension recommendation
 *
 * @example
 * const recommendation = getDimensionRecommendationText();
 * // Returns: "Recommended: 1900x500 pixels"
 */
export function getDimensionRecommendationText(): string {
  return `Recommended: ${RECOMMENDED_BANNER_WIDTH}x${RECOMMENDED_BANNER_HEIGHT} pixels`;
}
