/**
 * Form Validation Utilities
 *
 * Provides validation functions for common form fields.
 * Returns user-friendly error messages.
 *
 * @module validation
 */

/**
 * Email validation result
 */
export interface ValidationResult {
  /** Whether the value is valid */
  isValid: boolean;

  /** Error message if invalid */
  error?: string;
}

/**
 * Email validation regex
 * Matches standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Kenyan phone number regex
 * Matches formats:
 * - +2547XXXXXXXX
 * - 2547XXXXXXXX
 * - 07XXXXXXXX
 * - +254 7XX XXX XXX
 * - 07XX XXX XXXX
 */
const PHONE_REGEX = /^(\+?254|0)?[7]\d{8}$/;

/**
 * Validate email address
 *
 * @param email - Email address to validate
 * @returns Validation result
 *
 * @example
 * validateEmail('user@example.com');
 * // Returns: { isValid: true }
 *
 * validateEmail('invalid');
 * // Returns: { isValid: false, error: 'Please enter a valid email address' }
 */
export function validateEmail(email: string): ValidationResult {
  // Email is optional - if empty or whitespace, it's valid
  if (!email || email.trim() === '') {
    return { isValid: true };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate phone number (Kenya format)
 *
 * @param phone - Phone number to validate
 * @returns Validation result
 *
 * @example
 * validatePhone('0712345678');
 * // Returns: { isValid: true }
 *
 * validatePhone('123');
 * // Returns: { isValid: false, error: 'Please enter a valid phone number' }
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (!PHONE_REGEX.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (e.g., 0712345678 or +254712345678)',
    };
  }

  return { isValid: true };
}

/**
 * Validate required text field
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @param minLength - Minimum length (optional)
 * @returns Validation result
 *
 * @example
 * validateRequired('John', 'Name');
 * // Returns: { isValid: true }
 *
 * validateRequired('', 'Name');
 * // Returns: { isValid: false, error: 'Name is required' }
 */
export function validateRequired(
  value: string,
  fieldName: string,
  minLength = 1
): ValidationResult {
  if (!value || value.trim().length < minLength) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate name field
 *
 * @param name - Name to validate
 * @returns Validation result
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Full name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validate address field (optional but must be valid if provided)
 *
 * @param address - Address to validate
 * @returns Validation result
 */
export function validateAddress(address: string): ValidationResult {
  // Address is optional
  if (!address || address.trim() === '') {
    return { isValid: true };
  }

  if (address.trim().length < 5) {
    return { isValid: false, error: 'Please enter a complete address' };
  }

  if (address.trim().length > 500) {
    return { isValid: false, error: 'Address must be less than 500 characters' };
  }

  return { isValid: true };
}

/**
 * Validate notes field (optional but must be valid if provided)
 *
 * @param notes - Notes to validate
 * @returns Validation result
 */
export function validateNotes(notes: string): ValidationResult {
  // Notes are optional
  if (!notes || notes.trim() === '') {
    return { isValid: true };
  }

  if (notes.trim().length > 1000) {
    return { isValid: false, error: 'Notes must be less than 1000 characters' };
  }

  return { isValid: true };
}

/**
 * Validate checkout form data
 *
 * @param data - Checkout form data
 * @returns Validation result with all errors
 *
 * @example
 * const result = validateCheckoutForm({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '0712345678',
 *   address: '',
 *   notes: ''
 * });
 * if (!result.isValid) {
 *   console.log(result.errors); // ['error1', 'error2']
 * }
 */
export function validateCheckoutForm(data: {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}): ValidationResult & { errors?: string[] } {
  const errors: string[] = [];

  // Validate name
  const nameResult = validateName(data.name);
  if (!nameResult.isValid && nameResult.error) {
    errors.push(nameResult.error);
  }

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.push(emailResult.error);
  }

  // Validate phone
  const phoneResult = validatePhone(data.phone);
  if (!phoneResult.isValid && phoneResult.error) {
    errors.push(phoneResult.error);
  }

  // Validate address (optional)
  const addressResult = validateAddress(data.address);
  if (!addressResult.isValid && addressResult.error) {
    errors.push(addressResult.error);
  }

  // Validate notes (optional)
  const notesResult = validateNotes(data.notes);
  if (!notesResult.isValid && notesResult.error) {
    errors.push(notesResult.error);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true };
}

/**
 * Sanitize user input to prevent XSS
 *
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
