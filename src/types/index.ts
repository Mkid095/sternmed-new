export type Role = 'admin' | 'staff' | 'email_user';

export interface User {
  id: string;
  firebaseUid?: string;
  name: string;
  email: string;
  role: Role;
  /**
   * Admin page keys this user may open, e.g. ['orders', 'products'].
   *
   * Null/undefined means unrestricted, which is what admins get. Only meaningful
   * for `staff`. See src/features/admin/permissions.ts.
   */
  permissions?: string[] | null;
  emailAliasId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Email alias for managing departmental email addresses
 */
export interface EmailAlias {
  id: string;
  aliasEmail: string;
  displayName: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email attachment metadata
 */
export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  storagePath: string;
  url?: string; // Signed URL generated on demand
}

/**
 * Received email from external sender
 */
export interface EmailInbound {
  id: string;
  threadId: string;
  aliasId: string;
  senderEmail: string;
  senderName?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: EmailAttachment[];
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  spfPass: boolean;
  dkimPass: boolean;
  isRead: boolean;
  isStarred: boolean;
  deletedAt?: string;
  receivedAt: string;
  createdAt: string;
}

/**
 * Unassigned email (unknown alias)
 */
export interface EmailInboundUnassigned {
  id: string;
  originalRecipient: string;
  senderEmail: string;
  senderName?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: EmailAttachment[];
  messageId?: string;
  spfPass: boolean;
  dkimPass: boolean;
  receivedAt: string;
  assignedAliasId?: string;
  createdAt: string;
}

/**
 * Sent email status
 */
export type EmailOutboundStatus = 'pending' | 'sent' | 'failed';

/**
 * Sent email via the system
 */
export interface EmailOutbound {
  id: string;
  aliasId: string;
  recipientEmail: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  templateId?: string;
  status: EmailOutboundStatus;
  externalMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  retryCount: number;
  maxRetries: number;
  deletedAt?: string;
  createdAt: string;
}

/**
 * Email template for reusable content
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category?: string;
  variables: string[];
  version: number;
  isSystem: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email rate limits per alias (database row - snake_case)
 */
export interface EmailAliasLimitsRow {
  id: string;
  alias_id: string;
  daily_limit: number;
  monthly_limit: number;
  sent_today: number;
  sent_this_month: number;
  last_reset_date: string;
  reset_month_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Email rate limits per alias (application type - camelCase)
 */
export interface EmailAliasLimits {
  id: string;
  aliasId: string;
  dailyLimit: number;
  monthlyLimit: number;
  sentToday: number;
  sentThisMonth: number;
  lastResetDate: string;
  resetMonthDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email log entry for observability
 */
export interface EmailLog {
  id: string;
  type: 'inbound' | 'outbound' | 'worker_error' | 'template_error';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Email audit trail entry
 */
export interface EmailAudit {
  id: string;
  userId: string;
  action: 'read' | 'delete' | 'send' | 'assign' | 'create_alias' | 'update_alias';
  emailType?: 'inbound' | 'outbound';
  emailId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  showOnHome: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductStatus = 'active' | 'draft' | 'coming_soon' | 'archived' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  images?: string[]; // Additional images for gallery
  stock: number;
  isFeatured: boolean;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  date: string;
  read: boolean;
  type: 'inbox' | 'sent';
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Banner {
  id: string;
  imageUrl: string;
  order: number;
  /**
   * Whether the banner is currently in the carousel. A parked banner keeps its
   * row and its position but is not rendered on the homepage - which is what
   * lets a draft or seasonal banner exist without being deleted.
   */
  isActive?: boolean;
  /**
   * In-app path this banner links to when clicked, e.g. '/shop',
   * '/category/<id>', '/product/<id>'. Null means the banner is decoration
   * only and is not clickable.
   */
  linkTarget?: string | null;
  createdAt?: string;
}

export interface SiteSettings {
  id?: string;
  phoneNumber: string;
  /**
   * Dedicated WhatsApp contact number (digits, e.g. "254799526972").
   * Used for all wa.me links: product enquiries and checkout hand-off.
   * Falls back to phoneNumber when not set.
   */
  whatsappNumber?: string;
  email: string;
  address: string;
  aboutText: string;
  privacyPolicy?: string;
  termsOfService?: string;
  // Home page prominence settings
  /**
   * @deprecated Not read by the app. This was a second on/off switch for the
   * Featured products section, and it silently overrode the Landing page toggle
   * in `homepageSections` — the switch an admin could see said ON while the
   * section rendered nothing. `homepageSections` is the only control now.
   */
  featuredSectionEnabled?: boolean;
  /** Fallback row limit, used only when a section has no `config.productCount`. */
  featuredProductCount?: number;
  prominentCategories?: string[]; // Category IDs that should be more prominent
  /**
   * The blocks the home page is made of, their order, and which are on.
   * Edited on the Landing page (`useHomeSections`), rendered by `Home`.
   */
  homepageSections?: HomepageSection[];
  updatedAt?: string;
}

/**
 * Homepage section configuration
 */
export interface HomepageSection {
  id: string;         // Unique per section instance, not per type
  type: string;       // See HomepageSectionType
  enabled: boolean;   // Whether section is shown
  position: number;   // Order position (0 = first)
  config?: Record<string, unknown>; // Section-specific configuration
}

/** Shape of `config` on a `cta-banner` section. */
export interface CtaBannerConfig {
  imageUrl: string;
  /** In-app path, same convention as `Banner.linkTarget`. Empty = not a link. */
  linkTarget?: string;
  /** Only used when the image has no text of its own. */
  alt?: string;
  /**
   * Render this banner immediately AFTER this category's product strip,
   * inside the "Shop by category" block — so a banner can sit between two
   * specific categories rather than only between top-level sections.
   *
   * Empty/absent means "render at the section's own position", which is the
   * behaviour for a banner that is not tied to a category.
   *
   * The value is a category id. A category that is later hidden, renamed or
   * deleted simply takes its banner with it — see the fallback in Home.tsx.
   */
  afterCategoryId?: string;
}

/**
 * Available homepage section types
 */
export type HomepageSectionType =
  | 'hero'           // Hero banner carousel
  | 'featured-products'  // Featured products section
  | 'categories'     // Category sections
  | 'cta-banner'     // One admin-added call-to-action banner, in page order
  | 'promotional-banner'; // Reserved; renders nothing

/**
 * Default homepage section configuration
 */
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'hero', type: 'hero', enabled: true, position: 0 },
  { id: 'featured-products', type: 'featured-products', enabled: true, position: 1, config: { productCount: 8 } },
  { id: 'categories', type: 'categories', enabled: true, position: 2 },
];

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'whatsapp' | 'card' | 'mpesa' | 'bank_transfer';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Database row types (snake_case from Supabase)
export interface UserRow {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
  role: Role;
  /** JSON array of admin page keys, or null for unrestricted (admins). */
  permissions?: string[] | null;
  email_alias_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  image?: string;
  show_on_home: boolean;
  order?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  images?: string[];
  stock: number;
  is_featured: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface EmailRow {
  id: string;
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  type: 'inbox' | 'sent';
  read: boolean;
  created_at: string;
}

export interface BannerRow {
  id: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  link_target: string | null;
  created_at: string;
}

export interface SettingsRow {
  id: number;
  phone_number: string;
  email: string;
  address: string;
  about_text: string;
  updated_at: string;
}
