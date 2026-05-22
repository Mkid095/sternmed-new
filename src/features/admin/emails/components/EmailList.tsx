import { UnifiedEmail } from '../hooks';

interface EmailListProps {
  emails: UnifiedEmail[];
  filter: 'inbox' | 'sent' | 'drafts';
  selectedEmail: UnifiedEmail | null;
  onSelectEmail: (email: UnifiedEmail) => void;
  onLoadMore?: () => void;
  loading: boolean;
  hasMore?: boolean;
}

/**
 * Email List Component
 *
 * Displays a scrollable list of emails with:
 * - Unread indicators
 * - Selection highlighting
 * - Pagination/load more
 * - Empty state
 */
export function EmailList({ emails, filter, selectedEmail, onSelectEmail, onLoadMore, loading, hasMore }: EmailListProps) {
  const getDisplaySender = (email: UnifiedEmail) => {
    if (email.type === 'inbox') {
      return email.senderEmail;
    }
    return email.recipientEmail;
  };

  const getDisplayDate = (email: UnifiedEmail) => {
    const date = email.type === 'inbox' ? email.receivedAt : email.createdAt;
    return date ? new Date(date).toLocaleDateString() : '';
  };

  const isUnread = (email: UnifiedEmail) => {
    return email.type === 'inbox' && !email.isRead;
  };

  return (
    <div className="w-full flex flex-col bg-white">
      <div className="p-3 border-b border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 capitalize">
        {filter === 'drafts' ? 'Drafts' : `${filter} (${emails.length})`}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 && !loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="mb-3">
              {filter === 'inbox' ? '📭' : filter === 'sent' ? '📤' : '📝'}
            </div>
            <p className="text-sm">
              {filter === 'inbox'
                ? 'No emails in inbox'
                : filter === 'sent'
                ? 'No sent emails'
                : 'No drafts'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {emails.map((email) => (
              <li key={email.id}>
                <button
                  onClick={() => onSelectEmail(email)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                    selectedEmail?.id === email.id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'border-l-4 border-transparent'
                  } ${isUnread(email) ? 'bg-slate-50' : ''}`}
                >
                  {/* Sender/Recipient & Date */}
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-sm truncate pr-2 ${
                      isUnread(email)
                        ? 'font-bold text-slate-900'
                        : 'font-medium text-slate-700'
                    }`}>
                      {getDisplaySender(email)}
                    </span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {getDisplayDate(email)}
                    </span>
                  </div>

                  {/* Subject */}
                  <div className={`text-sm truncate mb-1 ${
                    isUnread(email) ? 'font-bold text-slate-800' : 'text-slate-600'
                  }`}>
                    {email.subject || '(No subject)'}
                  </div>

                  {/* Preview snippet */}
                  <div className="text-xs text-slate-500 truncate line-clamp-2">
                    {email.type === 'inbox' ? email.bodyText || email.bodyHtml?.replace(/<[^>]*>/g, '') : email.bodyText || email.bodyHtml?.replace(/<[^>]*>/g, '')}
                  </div>

                  {/* Status indicator for sent/draft */}
                  {email.type !== 'inbox' && email.status && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        email.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : email.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {email.status === 'sent' ? 'Sent' : email.status === 'pending' ? 'Draft' : 'Failed'}
                      </span>
                    </div>
                  )}

                  {/* Unread indicator */}
                  {isUnread(email) && (
                    <div className="absolute right-3 top-3 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Load more */}
        {loading && emails.length > 0 && (
          <div className="p-4 text-center text-sm text-slate-500">
            Loading more...
          </div>
        )}

        {!loading && hasMore && emails.length > 0 && (
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={onLoadMore}
              className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
