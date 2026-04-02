/**
 * HTML Sanitizer Utility
 *
 * Provides safe HTML rendering for user-generated or admin-controlled content.
 * Prevents XSS attacks by stripping dangerous tags and attributes.
 *
 * @module sanitizeHtml
 */

/**
 * Allowed HTML tags for rendering
 * Includes basic formatting and structural tags
 */
const ALLOWED_TAGS = [
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Text formatting
  'p', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'br', 'hr',
  // Lists
  'ul', 'ol', 'li',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // Block elements
  'div', 'section', 'article', 'blockquote', 'pre', 'code',
  // Links and media (without src attributes for security)
  'a',
];

/**
 * Allowed HTML attributes
 * Only safe attributes that don't execute JavaScript
 */
const ALLOWED_ATTRIBUTES = [
  'href', // Links
  'title', // Tooltips
  'alt', // Image alternative text
  'class', // Styling
  'id', // Fragment identifiers
];

/**
 * Dangerous patterns to strip
 * Includes JavaScript execution vectors
 */
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onerror
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<style\b[^>]*>[\s\S]*?<\/style>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
];

/**
 * Sanitize HTML string by removing dangerous content
 *
 * This function:
 * 1. Removes dangerous tags (script, iframe, object, embed, etc.)
 * 2. Removes event handlers (onclick, onerror, etc.)
 * 3. Removes javascript: protocols
 * 4. Strips tags not in the allowed list
 * 5. Strips attributes not in the allowed list
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * const dirty = '<p>Hello</p><script>alert("xss")</script>';
 * const clean = sanitizeHtml(dirty);
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Step 1: Remove dangerous patterns first
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Step 2: Remove tags that aren't allowed
  // This regex matches any tag that is NOT in our allowed list
  const tagStripRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
  sanitized = sanitized.replace(tagStripRegex, (match, tagName) => {
    const lowerTag = tagName.toLowerCase();
    if (ALLOWED_TAGS.includes(lowerTag)) {
      return match; // Keep allowed tags
    }
    return ''; // Remove disallowed tags
  });

  // Step 3: Remove dangerous attributes from remaining tags
  // This handles attributes like onclick, onerror, javascript: hrefs
  sanitized = sanitized.replace(/<([a-z][a-z0-9]*)([^>]*)>/gi, (match, tagName, attributes) => {
    const lowerTag = tagName.toLowerCase();

    // Only process if it's an allowed tag
    if (!ALLOWED_TAGS.includes(lowerTag)) {
      return ''; // Remove tag entirely
    }

    // Clean attributes
    const cleanAttrs = attributes.replace(/\s+([a-z-]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, (attrMatch, attrName, attrValue) => {
      const lowerAttr = attrName.toLowerCase();

      // Skip event handlers
      if (lowerAttr.startsWith('on')) {
        return '';
      }

      // Only allow safe attributes
      if (ALLOWED_ATTRIBUTES.includes(lowerAttr)) {
        // For href, check it's not javascript:
        if (lowerAttr === 'href') {
          const value = attrValue.replace(/^["']|["']$/g, '');
          if (value.toLowerCase().startsWith('javascript:')) {
            return ''; // Remove dangerous href
          }
        }
        return attrMatch; // Keep safe attribute
      }

      return ''; // Remove unsafe attribute
    });

    return `<${lowerTag}${cleanAttrs}>`;
  });

  // Step 4: Clean up any leftover malformed HTML
  sanitized = sanitized.replace(/<[^>]+$/gi, ''); // Remove incomplete tags

  return sanitized;
}

/**
 * Check if HTML contains potentially dangerous content
 *
 * @param html - The HTML string to check
 * @returns true if dangerous content is found
 *
 * @example
 * if (containsDangerousHtml(userInput)) {
 *   throw new Error('Invalid content');
 * }
 */
export function containsDangerousHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // Check for dangerous patterns
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(html));
}

/**
 * Strip all HTML tags, returning plain text only
 *
 * @param html - The HTML string to strip
 * @returns Plain text without HTML tags
 *
 * @example
 * stripHtmlTags('<p>Hello <strong>world</strong></p>');
 * // Returns: 'Hello world'
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html.replace(/<[^>]+>/gi, '');
}
