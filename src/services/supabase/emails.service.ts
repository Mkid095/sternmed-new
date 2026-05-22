import { supabase } from '../../config/supabase';
import { EmailMessage, EmailRow } from '../../types';

const transformEmailRow = (row: EmailRow): EmailMessage => ({
  id: row.id,
  subject: row.subject,
  body: row.body,
  sender: row.sender,
  recipient: row.recipient,
  date: row.created_at,
  read: row.read,
  type: row.type,
  createdAt: row.created_at,
});

export const emailsService = {
  async getEmails(): Promise<EmailMessage[]> {
    const { data, error } = await supabase.from('emails').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as EmailRow[]).map(transformEmailRow);
  },

  /**
   * Send a real email via Supabase Edge Function
   * The Edge Function handles the actual email sending (e.g., via Resend, SendGrid, etc.)
   */
  async sendRealEmail(email: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Call the Edge Function for sending emails
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: email,
      });

      if (error) throw error;

      // Also save to internal emails for record keeping
      await this.sendEmail({
        subject: email.subject,
        body: email.html || email.text || '',
        sender: email.from || 'noreply@sternmedafrika.com',
        recipient: Array.isArray(email.to) ? email.to.join(', ') : email.to,
      });

      return { success: true, messageId: data?.messageId };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  },

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    customerEmail: string,
    customerName: string,
    orderId: string,
    orderTotal: number
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Order Confirmation - Sternmed Afrika</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your order! We're pleased to confirm that we've received your order.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
          <p><strong>Total Amount:</strong> $${orderTotal.toFixed(2)}</p>
        </div>
        <p>Our team will contact you shortly via WhatsApp to confirm delivery details and payment.</p>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>Sternmed Afrika Team</p>
      </div>
    `;

    const result = await this.sendRealEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderId.slice(0, 8)}...`,
      html,
    });

    return result.success;
  },

  /**
   * Send welcome email to new customers
   */
  async sendWelcomeEmail(customerEmail: string, customerName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to Sternmed Afrika!</h2>
        <p>Dear ${customerName},</p>
        <p>Welcome to Sternmed Afrika! We're thrilled to have you with us.</p>
        <p>As a registered customer, you can now:</p>
        <ul>
          <li>Track your orders</li>
          <li>View order history</li>
          <li>Get faster checkout</li>
          <li>Receive exclusive offers</li>
        </ul>
        <p>Feel free to explore our wide range of medical supplies and equipment.</p>
        <p>If you have any questions, our support team is here to help.</p>
        <p>Best regards,<br>Sternmed Afrika Team</p>
      </div>
    `;

    const result = await this.sendRealEmail({
      to: customerEmail,
      subject: 'Welcome to Sternmed Afrika!',
      html,
    });

    return result.success;
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Password Reset Request</h2>
        <p>You requested to reset your password for your Sternmed Afrika account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    const result = await this.sendRealEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
    });

    return result.success;
  },

  /**
   * Send user credentials email when admin creates a new staff/account
   * Contains login information for the new user
   */
  async sendUserCredentialsEmail(
    email: string,
    name: string,
    password: string,
    role: string = 'staff'
  ): Promise<boolean> {
    const roleLabel = role === 'admin' ? 'Administrator' : 'Staff Member';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to Sternmed Afrika!</h2>
        <p>Dear ${name},</p>
        <p>An account has been created for you as a <strong>${roleLabel}</strong>.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Your Login Credentials</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>You can log in to the admin dashboard at:</p>
        <p><a href="${import.meta.env.VITE_APP_URL || 'https://sternmed.afrika'}/admin/login" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to Admin Dashboard</a></p>
        <p><strong>Important:</strong> For security reasons, we recommend changing your password after your first login.</p>
        <p>If you have any questions or need assistance, please contact the system administrator.</p>
        <p>Best regards,<br>Sternmed Afrika Team</p>
      </div>
    `;

    const result = await this.sendRealEmail({
      to: email,
      subject: `Your ${roleLabel} Account - Sternmed Afrika`,
      html,
      from: 'Sternmed Afrika Admin <admin@sternmedafrika.com>',
    });

    return result.success;
  },

  async sendEmail(email: Omit<EmailMessage, 'id' | 'date' | 'read' | 'type' | 'createdAt'>): Promise<EmailMessage> {
    const { data, error } = await supabase
      .from('emails')
      .insert({
        subject: email.subject,
        body: email.body,
        sender: email.sender,
        recipient: email.recipient,
        type: 'sent',
        read: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return transformEmailRow(data as EmailRow);
  },

  async markEmailRead(id: string): Promise<void> {
    const { error } = await supabase.from('emails').update({ read: true }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteEmail(id: string): Promise<void> {
    const { error } = await supabase.from('emails').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
