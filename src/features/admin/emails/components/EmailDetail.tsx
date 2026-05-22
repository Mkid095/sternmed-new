import { useState, useEffect } from 'react';
import { UnifiedEmail } from '../hooks';
import { Mail, Reply, Forward, Trash2, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface EmailDetailProps {
  email: UnifiedEmail;
  filter: 'inbox' | 'sent';
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
}

/**
 * Email Detail Component
 *
 * Displays full email content with:
 * - Header (subject, sender/recipient, date)
 * - Body (HTML or plain text)
 * - Attachments list
 * - Thread/conversation view (if threaded)
 * - Action buttons (reply, forward, delete)
 */
export function EmailDetail({ email, filter, onReply, onForward, onDelete }: EmailDetailProps) {
  const [showThread, setShowThread] = useState(false);
  const [threadEmails, setThreadEmails] = useState<UnifiedEmail[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  // Fetch thread if this email is part of a thread
  useEffect(() => {
    const fetchThread = async () => {
      if (email.type === 'inbox' && email.threadId && !showThread) {
        // Only load thread when expanded
        return;
      }

      if (email.type === 'inbox' && email.threadId && showThread) {
        setLoadingThread(true);
        try {
          // Import here to avoid circular dependency
          const { emailInboundService } = await import('../../../../services/supabase/email-inbound.service');
          const thread = await emailInboundService.getThread(email.threadId);
          // Convert to UnifiedEmail[]
          const unifiedThread: UnifiedEmail[] = thread.map((e) => ({
            ...e,
            type: 'inbox',
          }));
          setThreadEmails(unifiedThread.filter((e) => e.id !== email.id));
        } catch (error) {
          console.error('Failed to fetch thread:', error);
        } finally {
          setLoadingThread(false);
        }
      }
    };

    fetchThread();
  }, [email.threadId, showThread, email.id]);

  const getDisplayContact = () => {
    if (filter === 'inbox') {
      return email.senderName ? `${email.senderName} <${email.senderEmail}>` : email.senderEmail;
    }
    // For sent/draft emails, recipientEmail is guaranteed via type narrowing
    return (email as { recipientEmail?: string }).recipientEmail ?? 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const renderBody = () => {
    if (email.type === 'inbox') {
      return email.bodyHtml || email.bodyText || '';
    }
    return email.bodyHtml || email.bodyText || '';
  };

  const renderAttachments = () => {
    if (!email.attachments || email.attachments.length === 0) {
      return null;
    }

    // Helper to create download URL from base64 or use provided URL
    const getAttachmentUrl = (att: any) => {
      if (att.url) return att.url;
      if (att.content) {
        // Convert base64 to blob URL
        const byteCharacters = atob(att.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: att.contentType || att.type || 'application/octet-stream' });
        return URL.createObjectURL(blob);
      }
      return null;
    };

    return (
      <div className="mt-6 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Attachments</h4>
        <div className="space-y-2">
          {email.attachments.map((att: any, idx: number) => {
            const downloadUrl = getAttachmentUrl(att);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <Mail size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{att.filename || 'attachment'}</p>
                    <p className="text-xs text-slate-500">{att.size ? `${Math.round(att.size / 1024)} KB` : ''}</p>
                  </div>
                </div>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={att.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasThread = email.type === 'inbox' && !!email.threadId;
  const threadCount = threadEmails.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-slate-900 break-words flex-1">{email.subject || '(No subject)'}</h3>
          <div className="flex gap-2 ml-4">
            <button
              onClick={onReply}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Reply"
              aria-label="Reply"
            >
              <Reply size={18} />
            </button>
            <button
              onClick={onForward}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Forward"
              aria-label="Forward"
            >
              <Forward size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Sender/Recipient info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase flex-shrink-0">
            {getDisplayContact().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">
              {getDisplayContact()}
            </div>
            <div className="text-xs text-slate-500">
              {filter === 'inbox' ? 'To: ' : 'From: '}
              {email.type === 'inbox' ? 'you' : (email as { recipientEmail?: string }).recipientEmail ?? 'Unknown'}
              {' · '}
              {formatDate(email.type === 'inbox' ? email.receivedAt : email.createdAt)}
            </div>
          </div>
        </div>

        {/* Thread toggle */}
        {hasThread && (
          <button
            onClick={() => setShowThread(!showThread)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            {showThread ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {showThread ? 'Hide' : 'Show'} conversation ({threadCount + 1} emails)
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Current email body */}
        <div className="mb-8">
          {email.bodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: renderBody() }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-slate-700">{renderBody()}</div>
          )}
        </div>

        {/* Attachments */}
        {renderAttachments()}

        {/* Thread conversation */}
        {showThread && threadEmails.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-4">Conversation</h4>
            <div className="space-y-4">
              {threadEmails.map((threadEmail) => (
                <div key={threadEmail.id} className="border-l-2 border-slate-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-slate-900">
                      {threadEmail.sender_name || threadEmail.sender_email}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(threadEmail.received_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    <strong>Subject:</strong> {threadEmail.subject}
                  </div>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap">
                    {threadEmail.body_text || threadEmail.body_html?.replace(/<[^>]*>/g, '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state when no email is selected
 */
export function EmptyEmailDetail({ message = 'Select an email to read' }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-4 bg-slate-50">
      <Mail size={64} className="opacity-20" />
      <p className="text-lg">{message}</p>
    </div>
  );
}
