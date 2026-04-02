/**
 * Admin Email Platform Page
 *
 * Main email management interface for administrators.
 * Features include:
 * - Inbox, Sent, and Drafts folders
 * - Email list with read/unread indicators
 * - Email viewing with thread support
 * - Compose, reply, and forward emails
 * - Email search
 * - Mobile-responsive design
 *
 * @module AdminEmails
 */

import { useState, useCallback } from 'react';
import { Mail, RefreshCw, ArrowLeft, Search, Send, FileText } from 'lucide-react';
import { ConfirmationModal, useConfirmationModal } from '../../shared/ui';
import { EmailSidebar } from './components/EmailSidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail, EmptyEmailDetail } from './components/EmailDetail';
import { EmailCompose } from './components/EmailCompose';
import { useEmailManager } from './hooks';
import { UnifiedEmail } from './hooks';
import { emailInboundService } from '../../services/supabase/email-inbound.service';
import { emailOutboundService } from '../../services/supabase/email-outbound.service';

/**
 * Admin Email Platform Component
 *
 * Provides a complete email management interface with:
 * - Sidebar navigation (Inbox, Sent, Drafts, Compose)
 * - Email list with read/unread indicators and search
 * - Email detail view with reply/forward/delete actions
 * - Compose form for new emails with attachments
 * - Drafts support
 * - Mobile-responsive layout
 *
 * @example
 * <AdminEmails />
 */
export default function AdminEmails() {
  // ============ State Management ============

  const {
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
    loadMore,
    refresh,
    handleSelectEmail,
    handleBackToList,
    handleComposeClick,
    handleReply,
    handleForward,
    handleSend,
    saveAsDraft,
    setComposeForm,
    closeCompose,
    setSelectedEmail,
    setMobileView,
    searchQuery,
    setSearchQuery,
  } = useEmailManager();

  // Searching state (UI only, debounced search is in hook)
  const [searching, setSearching] = useState(false);

  // ============ Computed Values ============

  /** Count of draft emails */
  const draftCount = emails.filter((e): e is UnifiedEmail & { type: 'draft' } => e.type === 'draft').length;

  // ============ Delete Confirmation ============

  /**
   * Confirmation modal for email deletion
   * Different behavior for inbox vs sent emails
   */
  const deleteConfirmation = useConfirmationModal(async () => {
    if (selectedEmail) {
      try {
        if (selectedEmail.type === 'inbox') {
          // Delete inbound email (soft delete)
          await emailInboundService.softDelete(selectedEmail.id);
        } else {
          // Delete outbound email (soft delete)
          await emailOutboundService.softDelete(selectedEmail.id);
        }
        setSelectedEmail(null);
        setMobileView('list');
        await refresh();
        showSuccess('Email deleted');
      } catch (error) {
        console.error('Failed to delete email:', error);
        showError('Failed to delete email');
      }
    }
  });

  /**
   * Handle delete email button click
   * Opens confirmation dialog
   */
  const handleDeleteClick = useCallback(() => {
    if (selectedEmail) {
      deleteConfirmation.open({
        title: 'Delete Email',
        message: `Are you sure you want to delete this email? This action cannot be undone.`,
        confirmText: 'Delete',
      });
    }
  }, [selectedEmail, deleteConfirmation]);

  // ============ Search ============

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // TODO: Implement search in services and call here
    // For now, we'll just filter client-side
    if (query.trim() === '') {
      refresh();
    }
  }, [refresh]);

  // ============ Render Helpers ============

  /**
   * Mobile back button for returning to list view
   */
  const MobileBackButton = () => (
    <div className="md:hidden flex items-center gap-2 p-3 border-b border-slate-200">
      <button
        onClick={handleBackToList}
        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
        aria-label="Back to list"
      >
        <ArrowLeft size={20} />
      </button>
      <span className="text-sm font-medium text-slate-700 truncate">
        {isComposing ? 'New Message' : selectedEmail?.subject || 'Email'}
      </span>
    </div>
  );

  // ============ Main Layout ============

  return (
    <>
      <div className="h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={20} className="sm:w-6 sm:h-6" />
            Email {filter === 'inbox' ? 'Inbox' : filter === 'sent' ? 'Sent' : 'Drafts'}
            {unreadCount > 0 && filter === 'inbox' && (
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
              title="Refresh emails"
              aria-label="Refresh emails"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar - always visible on desktop, hidden on mobile when composing/viewing */}
          <div
            className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-col md:w-48 lg:w-56 border-r border-slate-200`}
          >
            <EmailSidebar
              filter={filter}
              unreadCount={unreadCount}
              draftCount={draftCount}
              onFilterChange={setFilter}
              onCompose={handleComposeClick}
            />
          </div>

          {/* Email List - visible on mobile in list view, always on desktop */}
          <div
            className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-col md:w-80 lg:w-96 border-r border-slate-200 min-w-0`}
          >
            {/* Mobile search */}
            <div className="md:hidden p-3 border-b border-slate-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email list */}
            <EmailList
              emails={emails}
              filter={filter}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              onLoadMore={hasMore ? loadMore : undefined}
              loading={loading}
            />
          </div>

          {/* Email Detail / Compose - visible on mobile in detail view, always on desktop */}
          <div
            className={`${mobileView === 'detail' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white min-w-0`}
          >
            {/* Mobile back button */}
            <MobileBackButton />

            {/* Detail view content */}
            <EmailDetailView
              isComposing={isComposing}
              selectedEmail={selectedEmail}
              composeForm={composeForm}
              sending={sending}
              filter={filter as 'inbox' | 'sent'}
              onReply={handleReply}
              onForward={handleForward}
              onDelete={handleDeleteClick}
              onSend={handleSend}
              onSaveDraft={saveAsDraft}
              onFormChange={setComposeForm}
              onCancel={closeCompose}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        {...deleteConfirmation.props}
      />
    </>
  );
}

/**
 * Email detail view component
 * Renders compose form, email detail, or empty state
 */
interface EmailDetailViewProps {
  /** Whether compose mode is active */
  isComposing: boolean;

  /** Currently selected email */
  selectedEmail: UnifiedEmail | null;

  /** Compose form data */
  composeForm: ComposeForm;

  /** Whether email is sending */
  sending: boolean;

  /** Current filter (inbox/sent) */
  filter: 'inbox' | 'sent';

  /** Reply callback */
  onReply: () => void;

  /** Forward callback */
  onForward: () => void;

  /** Delete callback */
  onDelete: () => void;

  /** Send callback */
  onSend: (e: FormEvent) => Promise<void>;

  /** Save draft callback */
  onSaveDraft: () => Promise<void>;

  /** Form data change callback */
  onFormChange: (form: ComposeForm | ((prev: ComposeForm) => ComposeForm)) => void;

  /** Cancel callback */
  onCancel: () => void;
}

function EmailDetailView({
  isComposing,
  selectedEmail,
  composeForm,
  sending,
  filter,
  onReply,
  onForward,
  onDelete,
  onSend,
  onSaveDraft,
  onFormChange,
  onCancel,
}: EmailDetailViewProps) {
  return (
    <>
      {isComposing ? (
        <EmailCompose
          composeForm={composeForm}
          sending={sending}
          onCancel={onCancel}
          onSubmit={onSend}
          onSaveDraft={onSaveDraft}
          onFormChange={onFormChange}
        />
      ) : selectedEmail ? (
        <EmailDetail
          email={selectedEmail}
          filter={filter}
          onReply={onReply}
          onForward={onForward}
          onDelete={onDelete}
        />
      ) : (
        <EmptyEmailDetail />
      )}
    </>
  );
}
