/**
 * useEmailManager Hook
 *
 * Custom hook for managing email platform state and operations.
 * Uses email_inbound and email_outbound tables with alias-based security.
 *
 * @module useEmailManager
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { EmailInbound, EmailOutbound, EmailAttachment } from '../../../../types';
import { useToastSuccess, useToastError } from '../../../shared/ui';
import { useAuthStore } from '../../../../store/authStore';
import { emailInboundService } from '../../../../services/supabase/email-inbound.service';
import { emailOutboundService } from '../../../../services/supabase/email-outbound.service';
import { supabase } from '../../../../config/supabase';
import { storageService } from '../../../../services/storage.service';

/**
 * Attachment during compose (includes File object)
 */
export interface ComposeAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

/**
 * Attachment for sending (Cloudinary URL + metadata)
 */
interface OutboundAttachment {
  filename: string;
  url: string; // Cloudinary URL
  type: string;
  size: number;
}

/**
 * Unified email type for UI (combines inbound + outbound)
 * All properties are made optional to allow accessing them without type errors
 */
export type UnifiedEmail = (EmailInbound & { type: 'inbox'; }) | (EmailOutbound & {
  type: 'sent' | 'draft';
  threadId?: string;
  senderName?: string;
  senderEmail?: string;
  isRead?: boolean;
  receivedAt?: string;
  attachments?: EmailAttachment[];
});

/**
 * Email compose form data structure
 */
export interface ComposeForm {
  /** Recipient email address */
  to: string;

  /** CC recipients */
  cc: string[];

  /** BCC recipients */
  bcc: string[];

  /** Email subject line */
  subject: string;

  /** Email body content (plain text) */
  body: string;

  /** Attachments */
  attachments: ComposeAttachment[];
}

/**
 * Upload attachments to Cloudinary and return URLs
 */
async function uploadAttachments(
  attachments: ComposeAttachment[]
): Promise<OutboundAttachment[]> {
  const outboundAttachments: OutboundAttachment[] = [];

  for (const attachment of attachments) {
    try {
      // Upload to Cloudinary (supports any file type)
      const result = await storageService.uploadFile(attachment.file, 'email-attachments');

      outboundAttachments.push({
        filename: attachment.name,
        url: result.url,
        type: attachment.type,
        size: attachment.size,
      });
    } catch (error) {
      console.error(`Failed to upload attachment ${attachment.name}:`, error);
      throw new Error(`Failed to upload attachment: ${attachment.name}`);
    }
  }

  return outboundAttachments;
}

/**
 * Email filter type - inbox, sent, or drafts
 */
export type EmailFilter = 'inbox' | 'sent' | 'drafts';

/**
 * Mobile view type - list or detail
 */
export type MobileView = 'list' | 'detail';

/**
 * Return type for useEmailManager hook
 */
export interface UseEmailManagerReturn {
  /** All emails (filtered by current filter) */
  emails: UnifiedEmail[];

  /** Pagination info */
  hasMore: boolean;

  /** Number of unread inbox emails */
  unreadCount: number;

  /** Whether emails are currently loading */
  loading: boolean;

  /** Current email filter */
  filter: EmailFilter;

  /** Currently selected email for viewing */
  selectedEmail: UnifiedEmail | null;

  /** Whether compose form is open */
  isComposing: boolean;

  /** Compose form data */
  composeForm: ComposeForm;

  /** Whether email is sending */
  sending: boolean;

  /** Current mobile view state */
  mobileView: MobileView;

  /** Current page number for pagination */
  page: number;

  /** Update the email filter */
  setFilter: (filter: EmailFilter) => void;

  /** Fetch more emails (pagination) */
  loadMore: () => Promise<void>;

  /** Refresh emails */
  refresh: () => Promise<void>;

  /** Select an email to view */
  handleSelectEmail: (email: UnifiedEmail) => Promise<void>;

  /** Go back to list view (mobile) */
  handleBackToList: () => void;

  /** Start composing a new email */
  handleComposeClick: () => void;

  /** Handle reply to selected email */
  handleReply: () => void;

  /** Handle forward selected email */
  handleForward: () => void;

  /** Handle send email */
  handleSend: (e: FormEvent) => Promise<void>;

  /** Set compose form data */
  setComposeForm: (form: ComposeForm | ((prev: ComposeForm) => ComposeForm)) => void;

  /** Close compose modal */
  closeCompose: () => void;

  /** Set selected email */
  setSelectedEmail: (email: UnifiedEmail | null) => void;

  /** Set mobile view */
  setMobileView: (view: MobileView) => void;

  /** Load next page */
  loadNextPage: () => void;

  /** Search query */
  searchQuery: string;

  /** Set search query */
  setSearchQuery: (query: string) => void;

  /** Save email as draft */
  saveAsDraft: () => Promise<void>;
}

/**
 * Custom hook for managing email platform state
 *
 * Provides comprehensive state management for the email platform including:
 * - Email fetching with pagination (from email_inbound and email_outbound)
 * - Filter management (inbox/sent/drafts)
 * - Email selection and viewing
 * - Compose, reply, and forward functionality
 * - Mobile view management
 * - Send email operations via Resend
 *
 * @returns Object with email state and handler functions
 */
export function useEmailManager(): UseEmailManagerReturn {
  const { user, emailAliasId } = useAuthStore();
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  // Admins don't have a single email_alias_id (they manage all aliases),
  // so they should see ALL emails across all aliases. Email users are
  // scoped to their own alias only.
  const isAdmin = user?.role === 'admin';
  const effectiveAliasId = isAdmin ? undefined : emailAliasId;

  // ============ State ============

  /** All emails (already filtered by current filter) */
  const [emails, setEmails] = useState<UnifiedEmail[]>([]);

  /** Loading state for email fetch */
  const [loading, setLoading] = useState(true);

  /** Current filter - inbox, sent, or drafts */
  const [filter, setFilterState] = useState<EmailFilter>('inbox');

  /** Currently selected email for detail view */
  const [selectedEmail, setSelectedEmail] = useState<UnifiedEmail | null>(null);

  /** Whether compose form is open */
  const [isComposing, setIsComposing] = useState(false);

  /** Compose form data */
  const [composeForm, setComposeForm] = useState<ComposeForm>({
    to: '',
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    attachments: [],
  });

  /** Sending state for email submission */
  const [sending, setSending] = useState(false);

  /** Mobile view state - list or detail */
  const [mobileView, setMobileView] = useState<MobileView>('list');

  /** Current page number */
  const [page, setPage] = useState(1);

  /** Whether there are more emails to load */
  const [hasMore, setHasMore] = useState(false);

  /** Search query */
  const [searchQuery, setSearchQuery] = useState('');

  /** Debounced search query for actual searching */
  const [searchDebounced, setSearchDebounced] = useState('');

  // ============ Computed Values ============

  /** Count of unread inbox emails (only for inbox filter) */
  const unreadCount = useMemo(() => {
    if (filter !== 'inbox') return 0;
    return emails.filter((e): e is UnifiedEmail & { type: 'inbox' } => e.type === 'inbox' && !e.isRead).length;
  }, [emails, filter]);

  // ============ Email Fetching ============

  /**
   * Fetch emails for the current filter and page.
   *
   * Admins see ALL emails across all aliases (no alias filter).
   * Email users are scoped to their own alias_id.
   */
  const fetchEmails = useCallback(async (pageNum: number = 1, append: boolean = false, search: string = '') => {
    if (!isAdmin && !effectiveAliasId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let result;

      if (filter === 'inbox') {
        // Fetch inbound emails (received)
        if (search.trim()) {
          result = await emailInboundService.searchEmails(
            effectiveAliasId ?? null,
            search.trim(),
            { page: pageNum, pageSize: 20 }
          );
        } else {
          result = await emailInboundService.getInboundEmails(
            effectiveAliasId ?? null,
            { page: pageNum, pageSize: 20 }
          );
        }
      } else if (filter === 'sent') {
        // Fetch outbound emails (sent)
        result = await emailOutboundService.getOutboundEmails(
          effectiveAliasId ?? null,
          { page: pageNum, pageSize: 20, status: 'sent' }
        );
      } else {
        // Drafts
        result = await emailOutboundService.getOutboundEmails(
          effectiveAliasId ?? null,
          { page: pageNum, pageSize: 20, status: 'pending' }
        );
      }

      const unifiedEmails: UnifiedEmail[] = result.data.map((email) => ({
        ...email,
        type: filter === 'inbox' ? 'inbox' : (email.status === 'pending' ? 'draft' : 'sent'),
      }));

      setEmails(append ? (prev) => [...prev, ...unifiedEmails] : unifiedEmails);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      showError('Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, effectiveAliasId, filter, showError]);

  /**
   * Load next page
   */
  const loadNextPage = useCallback(() => {
    if (hasMore && !loading) {
      fetchEmails(page + 1, true);
    }
  }, [hasMore, loading, page, fetchEmails]);

  /**
   * Refresh emails (reload from page 1)
   */
  const refresh = useCallback(async () => {
    setPage(1);
    await fetchEmails(1, false);
  }, [fetchEmails]);

  /**
   * Debounce search query
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Auto-fetch emails on mount and when filter or search changes
   */
  useEffect(() => {
    fetchEmails(1, false, searchDebounced);
  }, [fetchEmails, searchDebounced]);

  // ============ Email Selection ============

  /**
   * Handle selecting an email to view
   * Marks email as read if unread (for inbox)
   * Switches to detail view on mobile
   */
  const handleSelectEmail = useCallback(async (email: UnifiedEmail) => {
    setSelectedEmail(email);
    setIsComposing(false);
    setMobileView('detail');

    // Mark as read if unread inbox email
    if (email.type === 'inbox' && !email.isRead) {
      try {
        await emailInboundService.markAsRead(email.id);
        // Refresh to update read status
        await refresh();
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  }, [refresh]);

  /**
   * Go back to list view (mobile)
   * Clears selection and compose state
   */
  const handleBackToList = useCallback(() => {
    setMobileView('list');
    setSelectedEmail(null);
    setIsComposing(false);
  }, []);

  // ============ Email Composition ============

  /**
   * Open compose form for new email
   * Clears existing form data
   */
  const handleComposeClick = useCallback(() => {
    setIsComposing(true);
    setSelectedEmail(null);
    setComposeForm({ to: '', cc: [], bcc: [], subject: '', body: '', attachments: [] });
    setMobileView('detail');
  }, []);

  /**
   * Handle reply to selected email
   * Pre-fills compose form with recipient and subject
   * Includes original message in body
   */
  const handleReply = useCallback(() => {
    if (!selectedEmail) return;

    // Determine recipient based on email type
    let recipient: string;
    if (selectedEmail.type === 'inbox') {
      // Reply to sender
      recipient = selectedEmail.sender_email;
    } else {
      // This would be a reply to a sent email? Should not happen
      return;
    }

    setComposeForm({
      to: recipient,
      cc: [],
      bcc: [],
      subject: `Re: ${selectedEmail.subject || ''}`,
      body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.sender_email}\nDate: ${new Date(selectedEmail.received_at || selectedEmail.created_at).toLocaleString()}\n\n${selectedEmail.body_text || selectedEmail.body || ''}`,
      attachments: [],
    });
    setIsComposing(true);
    setSelectedEmail(null);
    setMobileView('detail');
  }, [selectedEmail]);

  /**
   * Handle forward selected email
   */
  const handleForward = useCallback(() => {
    if (!selectedEmail) return;

    setComposeForm({
      to: '',
      cc: [],
      bcc: [],
      subject: `Fwd: ${selectedEmail.subject || ''}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.sender_email}\nDate: ${new Date(selectedEmail.received_at || selectedEmail.created_at).toLocaleString()}\n\n${selectedEmail.body_text || selectedEmail.body || ''}`,
      attachments: [],
    });
    setIsComposing(true);
    setSelectedEmail(null);
    setMobileView('detail');
  }, [selectedEmail]);

  /**
   * Close compose form and return to list
   */
  const closeCompose = useCallback(() => {
    setIsComposing(false);
    setMobileView('list');
  }, []);

  /**
   * Handle sending email
   * Submits compose form data via emailOutboundService
   */
  const handleSend = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!emailAliasId) {
      showError('No email alias configured');
      return;
    }

    if (!composeForm.to || !composeForm.subject) {
      showError('Please fill in recipient and subject');
      return;
    }

    setSending(true);

    try {
      // Get alias details to validate and use as from address
      const { data: alias } = await supabase
        .from('email_aliases')
        .select('alias_email')
        .eq('id', emailAliasId)
        .single();

      if (!alias) {
        throw new Error('Email alias not found');
      }

      // Convert attachments to base64 if any
      const attachments = composeForm.attachments.length > 0
        ? await Promise.all(composeForm.attachments.map(async (att) => {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(att.file);
            });
            return {
              filename: att.name,
              content: base64.split(',')[1],
              type: att.type,
            };
          }))
        : undefined;

      // Upload attachments to Cloudinary if any
      let uploadedAttachments: OutboundAttachment[] = [];
      if (composeForm.attachments.length > 0) {
        uploadedAttachments = await uploadAttachments(composeForm.attachments);
      }

      // Send via emailOutboundService (this handles Resend integration)
      await emailOutboundService.sendEmail(emailAliasId, {
        aliasId: emailAliasId,
        recipientEmail: composeForm.to,
        cc: composeForm.cc,
        bcc: composeForm.bcc,
        subject: composeForm.subject,
        bodyText: composeForm.body,
        bodyHtml: composeForm.body.replace(/\n/g, '<br>'),
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      showSuccess('Email sent successfully!');

      // Reset compose form
      setComposeForm({ to: '', cc: [], bcc: [], subject: '', body: '', attachments: [] });
      setIsComposing(false);
      setFilterState('sent');
      setMobileView('list');

      // Refresh sent folder
      await fetchEmails(1, false);
    } catch (error) {
      console.error('Error sending email:', error);
      showError('Failed to send email: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSending(false);
    }
  }, [emailAliasId, composeForm, showError, showSuccess, fetchEmails]);

  /**
   * Mark email as draft (save for later)
   */
  const saveAsDraft = useCallback(async () => {
    if (!emailAliasId) {
      showError('No email alias configured');
      return;
    }

    if (!composeForm.subject) {
      showError('Subject is required for drafts');
      return;
    }

    try {
      await emailOutboundService.saveAsDraft?.(emailAliasId, {
        recipientEmail: composeForm.to,
        cc: composeForm.cc,
        bcc: composeForm.bcc,
        subject: composeForm.subject,
        bodyText: composeForm.body,
        bodyHtml: composeForm.body.replace(/\n/g, '<br>'),
      });

      showSuccess('Draft saved');
      setComposeForm({ to: '', cc: [], bcc: [], subject: '', body: '', attachments: [] });
      setIsComposing(false);
      setFilterState('drafts');
      await fetchEmails(1, false);
    } catch (error) {
      console.error('Error saving draft:', error);
      showError('Failed to save draft');
    }
  }, [emailAliasId, composeForm, showError, showSuccess, fetchEmails]);

  // ============ Filter Management ============

  /**
   * Handle filter change
   * Switches between inbox, sent, and drafts views
   * Resets page to 1
   */
  const setFilter = useCallback((newFilter: EmailFilter) => {
    setFilterState(newFilter);
    setPage(1);
    setSelectedEmail(null);
    setIsComposing(false);
  }, []);

  return {
    emails,
    hasMore,
    unreadCount,
    loading,
    filter,
    selectedEmail,
    isComposing,
    composeForm,
    sending,
    mobileView,
    page,
    setFilter,
    loadMore: loadNextPage,
    refresh,
    handleSelectEmail,
    handleBackToList,
    handleComposeClick,
    handleReply,
    handleForward,
    handleSend,
    setComposeForm,
    closeCompose,
    setSelectedEmail,
    setMobileView,
    loadNextPage,
    // Search
    searchQuery,
    setSearchQuery,
    saveAsDraft,
  };
}
