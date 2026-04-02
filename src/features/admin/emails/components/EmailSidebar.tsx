import { Inbox, Send, FileText } from 'lucide-react';

interface EmailSidebarProps {
  filter: 'inbox' | 'sent' | 'drafts';
  unreadCount: number;
  draftCount?: number;
  onFilterChange: (filter: 'inbox' | 'sent' | 'drafts') => void;
  onCompose: () => void;
}

/**
 * Email Sidebar Component
 *
 * Sidebar navigation for email platform:
 * - Compose button
 * - Inbox (with unread count)
 * - Sent emails
 * - Drafts (with count)
 */
export function EmailSidebar({ filter, unreadCount, draftCount = 0, onFilterChange, onCompose }: EmailSidebarProps) {
  return (
    <div className="w-full border-r border-slate-200 bg-slate-50 flex flex-col">
      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Send size={16} /> Compose
        </button>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        <button
          onClick={() => onFilterChange('inbox')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'inbox' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Inbox size={16} /> Inbox
          </span>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onFilterChange('drafts')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'drafts' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText size={16} /> Drafts
          </span>
          {draftCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
              {draftCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onFilterChange('sent')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'sent' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Send size={16} /> Sent
        </button>
      </nav>
    </div>
  );
}
