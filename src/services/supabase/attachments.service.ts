/**
 * Email Attachments Service
 *
 * Manages email attachment storage and signed URL generation.
 * Attachments are stored in a private bucket and accessed via signed URLs.
 *
 * @module services/email-attachments
 */

import { supabase } from '../../config/supabase';

/**
 * Generate a signed URL for an attachment
 *
 * @param storagePath - The storage path of the attachment
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL for the attachment
 */
export async function generateAttachmentUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('email-attachments')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Upload an attachment to storage
 *
 * @param file - The file to upload
 * @param emailId - The ID of the email (inbound or outbound)
 * @param emailType - The type of email ('inbound', 'outbound', or 'unassigned')
 * @returns Storage path of the uploaded file
 */
export async function uploadAttachment(
  file: File,
  emailId: string,
  emailType: 'inbound' | 'outbound' | 'unassigned'
): Promise<string> {
  // Validate file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Attachment size exceeds 10MB limit');
  }

  // Validate file type
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Generate storage path: email-attachments/{emailId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${emailType}/${emailId}/${timestamp}_${sanitizedFilename}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from('email-attachments')
    .upload(storagePath, file);

  if (error) {
    throw new Error(`Failed to upload attachment: ${error.message}`);
  }

  return storagePath;
}

/**
 * Delete an attachment from storage
 *
 * @param storagePath - The storage path of the attachment
 */
export async function deleteAttachment(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('email-attachments')
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete attachment: ${error.message}`);
  }
}

/**
 * Get attachment metadata from storage
 *
 * @param storagePath - The storage path of the attachment
 * @returns Metadata about the file
 */
export async function getAttachmentMetadata(storagePath: string): Promise<{
  name: string;
  size: number;
  contentType: string | null;
}> {
  // Note: This requires a public bucket or service role access
  // For private buckets, we rely on the email_attachments table for metadata
  const filename = storagePath.split('/').pop() || '';

  // Try to get from signed URL head request
  try {
    const { data } = await supabase.storage
      .from('email-attachments')
      .createSignedUrl(storagePath, 60);

    const response = await fetch(data.signedUrl, { method: 'HEAD' });

    return {
      name: filename,
      size: parseInt(response.headers.get('Content-Length') || '0', 10),
      contentType: response.headers.get('Content-Type'),
    };
  } catch {
    // Fallback to basic info
    return {
      name: filename,
      size: 0,
      contentType: null,
    };
  }
}

export const attachmentsService = {
  generateAttachmentUrl,
  uploadAttachment,
  deleteAttachment,
  getAttachmentMetadata,
};
