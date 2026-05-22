import type { FormEvent, ChangeEvent } from 'react';
import { Send, X, Paperclip, Save } from 'lucide-react';
import { ComposeForm, ComposeAttachment } from '../hooks';

interface EmailComposeProps {
  composeForm: ComposeForm;
  sending: boolean;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onFormChange: (form: ComposeForm | ((prev: ComposeForm) => ComposeForm)) => void;
}

/**
 * Email Compose Component
 *
 * Form for composing new emails with:
 * - To, CC, BCC fields
 * - Subject field
 * - Body textarea
 * - Attachment support (UI only for now)
 * - Send and Save Draft buttons
 */
export function EmailCompose({ composeForm, sending, onCancel, onSubmit, onSaveDraft, onFormChange }: EmailComposeProps) {
  const handleInputChange = (field: keyof ComposeForm, value: ComposeForm[keyof ComposeForm]) => {
    onFormChange((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotalSize = 100 * 1024 * 1024; // 100MB total

    const newAttachments: ComposeAttachment[] = [];
    const filesArray: File[] = Array.from(e.target.files);
    let totalSize = composeForm.attachments.reduce((sum, att) => sum + att.size, 0);

    for (const file of filesArray) {
      // Validate file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size per file is 10MB.`);
        continue;
      }

      // Check total size
      if (totalSize + file.size > maxTotalSize) {
        alert(`Total attachment size exceeds 100MB limit.`);
        break;
      }

      const attachment: ComposeAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      };
      newAttachments.push(attachment);
      totalSize += file.size;
    }

    if (newAttachments.length > 0) {
      handleInputChange('attachments', [...composeForm.attachments, ...newAttachments]);
    }
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (id: string) => {
    handleInputChange(
      'attachments',
      composeForm.attachments.filter((a) => a.id !== id)
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-bold text-slate-900">
          {composeForm.subject ? composeForm.subject : 'New Message'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
        {/* To field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            To <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={composeForm.to}
            onChange={(e) => handleInputChange('to', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="recipient@example.com"
          />
        </div>

        {/* CC & BCC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CC</label>
            <input
              type="text"
              value={composeForm.cc.join(', ')}
              onChange={(e) =>
                handleInputChange('cc', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="cc@example.com (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">BCC</label>
            <input
              type="text"
              value={composeForm.bcc.join(', ')}
              onChange={(e) =>
                handleInputChange('bcc', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="bcc@example.com (optional)"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={composeForm.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Message subject"
          />
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={composeForm.body}
            onChange={(e) => handleInputChange('body', e.target.value)}
            className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
            placeholder="Type your message here..."
            rows={10}
          />
        </div>

        {/* Attachments */}
        {composeForm.attachments.length > 0 && (
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <div className="text-sm font-medium text-slate-700 mb-2">Attachments</div>
            <div className="space-y-2">
              {composeForm.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-700 truncate max-w-xs">
                      {attachment.name}
                    </span>
                    <span className="text-xs text-slate-500">({formatFileSize(attachment.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachment button */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Paperclip size={16} />
            Add Attachments
          </label>
          <span className="text-xs text-slate-500">
            {composeForm.attachments.length > 0
              ? `${composeForm.attachments.length} file(s) attached`
              : ''}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={sending || !composeForm.subject}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            type="submit"
            disabled={sending || !composeForm.to || !composeForm.subject}
            className={`px-6 py-2 text-sm text-white rounded-md font-medium transition-colors flex items-center gap-2 ${
              sending || !composeForm.to || !composeForm.subject
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
