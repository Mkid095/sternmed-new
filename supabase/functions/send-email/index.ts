import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fetch file from URL and convert to base64
 */
async function fetchFileAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment from ${url}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, from, cc, bcc, attachments } = await req.json();

    // Validate required fields
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get email service credentials from environment variables
    // Options: Resend, SendGrid, or any email service
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend';
    const apiKey = Deno.env.get('EMAIL_API_KEY');

    if (!apiKey) {
      console.error('EMAIL_API_KEY not configured');
      // Fallback: Just log the email (for development)
      console.log('📧 Email would be sent:', { to, subject, from });
      return new Response(
        JSON.stringify({
          success: true,
          messageId: `dev_${Date.now()}`,
          note: 'Email logged (EMAIL_API_KEY not configured)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response;

    if (emailService === 'resend') {
      // Fetch and convert attachments to base64 if provided
      let resendAttachments: Array<{ filename: string; content: string; type: string }> | undefined;

      if (attachments && Array.isArray(attachments)) {
        // Limit: Resend max 10MB per attachment, 100MB total
        // We'll fetch each attachment from Cloudinary and convert to base64
        const fetchPromises = attachments.map(async (att: any) => {
          try {
            const base64 = await fetchFileAsBase64(att.url);
            return {
              filename: att.filename,
              content: base64,
              type: att.type,
            };
          } catch (error) {
            console.error(`Failed to fetch attachment ${att.filename}:`, error);
            return null; // Skip this attachment
          }
        });

        const fetched = await Promise.all(fetchPromises);
        resendAttachments = fetched.filter(Boolean);
      }

      // Using Resend.com
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || 'Sternmed Afrika <noreply@sternmedafrika.com>',
          to: Array.isArray(to) ? to : [to],
          cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
          bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
          subject,
          html: html || undefined,
          text: text || undefined,
          attachments: resendAttachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Resend');
      }

      return new Response(
        JSON.stringify({ success: true, messageId: data.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (emailService === 'sendgrid') {
      // Using SendGrid
      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          }],
          from: { email: from?.split('<')[1]?.replace('>', '') || 'noreply@sternmedafrika.com' },
          subject,
          content: [
            ...(html ? [{ type: 'text/html', value: html }] : []),
            ...(text ? [{ type: 'text/plain', value: text }] : []),
          ],
          // SendGrid attachments would need similar fetch+base64 conversion
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email via SendGrid');
      }

      const messageId = response.headers.get('X-Message-ID');
      return new Response(
        JSON.stringify({ success: true, messageId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Unsupported email service: ${emailService}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
