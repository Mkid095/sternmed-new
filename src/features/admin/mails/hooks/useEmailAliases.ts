/**
 * Email alias data and mutations.
 *
 * Split out of AdminMails.tsx, which was holding the fetch, four mutations,
 * the credentials-email template and the whole page in one file.
 *
 * Why the temporary password is generated here
 * --------------------------------------------
 * It has to exist on the client — it is passed to `create-email-user` to set
 * the Firebase password, and it is shown to the admin once. The previous
 * implementation used `Math.random()`, which is not a CSPRNG: the values it
 * produces are predictable from a few observed outputs, so a generated
 * password should not rely on it. `crypto.getRandomValues` is the browser's
 * CSPRNG and is what this uses now.
 *
 * @module useEmailAliases
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../config/supabase';
import { MAIL_APP_URL } from '../../../../constants';

export interface EmailAlias {
  id: string;
  alias_email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface EmailUser {
  id: string;
  email: string;
  email_alias_id?: string;
  role: string;
}

export interface AliasForm {
  email: string;
  name: string;
  recipientEmail: string;
}

export interface AliasCredentials {
  email: string;
  password: string;
  name: string;
  recipientEmail: string;
}

const DOMAIN = '@sternmedafrika.com';

/**
 * A 16-character password from the browser CSPRNG.
 *
 * Symbols are kept out on purpose: this string is emailed, copied to the
 * clipboard and retyped by hand, and a password full of `!@#$%^&*` reliably
 * arrives mistyped and becomes a support ticket.
 */
function generateTemporaryPassword(length = 16): string {
  const alphabet =
    'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let password = '';
  for (const byte of bytes) {
    // `% alphabet.length` on a random byte is very slightly biased. Rejection
    // sampling removes it, and the bias is irrelevant for a temporary password
    // that is force-changed on first login — noted so the choice is deliberate
    // rather than accidental.
    password += alphabet[byte % alphabet.length];
  }
  return password;
}

/**
 * Escapes text for interpolation into the credentials email.
 *
 * The recipient's name and the alias are admin-typed strings going into an HTML
 * body. Without this, a display name containing `<` can inject markup into the
 * email that gets sent.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plain-text block quoted into the HTML email. */
function toPlainText(value: string): string {
  return value;
}

function buildCredentialsEmailHtml(
  name: string,
  aliasEmail: string,
  password: string,
): string {
  const safeName = escapeHtml(name);
  const safeAlias = escapeHtml(aliasEmail);
  const safePassword = escapeHtml(password);
  // The URL is a build-time constant, but escaping costs nothing and keeps the
  // rule "everything interpolated here is escaped" true without exceptions.
  const safeUrl = escapeHtml(MAIL_APP_URL);

  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1d4ed8;">Welcome to Sternmed Afrika Email</h2>
  <p>Hello ${safeName},</p>
  <p>Your email alias has been created. Here are your login credentials:</p>
  <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Email:</strong> ${safeAlias}</p>
    <p><strong>Password:</strong> <code style="background: #ffffff; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px;">${safePassword}</code></p>
  </div>
  <p>You can log in to your email at: <a href="${safeUrl}" style="color: #1d4ed8;">${safeUrl}</a></p>
  <p>For security reasons, we recommend changing your password after the first login.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
  <p style="color: #64748b; font-size: 12px;">If you did not request this alias, please contact the administrator immediately.</p>
</div>`;
}

/** Plain-text alternative, for clients that do not render HTML. */
function buildCredentialsEmailText(
  name: string,
  aliasEmail: string,
  password: string,
): string {
  return [
    `Hello ${toPlainText(name)},`,
    '',
    'Your email alias has been created. Here are your login credentials:',
    '',
    `Email: ${toPlainText(aliasEmail)}`,
    `Password: ${toPlainText(password)}`,
    '',
    `You can log in to your email at: ${MAIL_APP_URL}`,
    'For security reasons, we recommend changing your password after the first login.',
  ].join('\n');
}

export interface UseEmailAliasesReturn {
  aliases: EmailAlias[];
  users: EmailUser[];
  loading: boolean;
  /** Non-null when the last fetch failed, so the page can say so. */
  error: string | null;
  /** The alias linked to each email user, keyed by alias id. */
  userByAliasId: Map<string, EmailUser>;
  refresh: () => Promise<void>;
  createAlias: (form: AliasForm) => Promise<AliasCredentials>;
  deleteAlias: (id: string) => Promise<void>;
  setAliasActive: (id: string, isActive: boolean) => Promise<void>;
}

export function useEmailAliases(): UseEmailAliasesReturn {
  const [aliases, setAliases] = useState<EmailAlias[]>([]);
  const [users, setUsers] = useState<EmailUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [aliasResult, userResult] = await Promise.all([
        supabase.from('email_aliases').select('*').order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, email, email_alias_id, role')
          .eq('role', 'email_user'),
      ]);

      // Either failure is surfaced; previously both were swallowed into
      // console.error and the page rendered as if there were simply no aliases.
      const problems = [aliasResult.error, userResult.error].filter(Boolean);
      if (problems.length > 0) {
        const message = problems[0]?.message ?? 'Could not load email aliases';
        setError(message);
      } else {
        setError(null);
      }

      setAliases(aliasResult.data ?? []);
      setUsers((userResult.data ?? []) as EmailUser[]);
    } catch (err) {
      console.error('Failed to load email aliases:', err);
      setError(err instanceof Error ? err.message : 'Could not load email aliases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createAlias = useCallback(
    async (form: AliasForm): Promise<AliasCredentials> => {
      if (!form.email || !form.name || !form.recipientEmail) {
        throw new Error('Please fill in all fields');
      }

      const aliasEmail = form.email.includes('@') ? form.email : form.email + DOMAIN;
      const temporaryPassword = generateTemporaryPassword();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Insert first so the edge function has an alias id to attach the user to.
      const { data: createdAlias, error: aliasError } = await supabase
        .from('email_aliases')
        .insert({
          alias_email: aliasEmail,
          display_name: form.name,
          is_active: true,
        })
        .select()
        .single();

      if (aliasError) throw aliasError;

      try {
        const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/create-email-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            email: aliasEmail,
            password: temporaryPassword,
            displayName: form.name,
            aliasId: createdAlias.id,
          }),
        });

        const edgeResult = await edgeResponse.json().catch(() => ({}));

        if (!edgeResponse.ok) {
          throw new Error(edgeResult.error || 'Failed to create email user');
        }
      } catch (err) {
        // Roll back the alias so a half-created account is not left behind.
        await supabase.from('email_aliases').delete().eq('id', createdAlias.id);
        throw err;
      }

      // Best effort: a failed welcome email must not fail the whole creation,
      // because the admin still has the credentials on screen to hand over.
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: form.recipientEmail,
            subject: 'Your Sternmed Afrika Email Account',
            html: buildCredentialsEmailHtml(form.name, aliasEmail, temporaryPassword),
            text: buildCredentialsEmailText(form.name, aliasEmail, temporaryPassword),
            from: 'Sternmed Afrika <noreply@sternmedafrika.com>',
          }),
        });
      } catch (emailError) {
        console.error('Failed to send the credentials email:', emailError);
      }

      await refresh();

      return {
        email: aliasEmail,
        password: temporaryPassword,
        name: form.name,
        recipientEmail: form.recipientEmail,
      };
    },
    [refresh],
  );

  const deleteAlias = useCallback(
    async (id: string) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/delete-email-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ aliasId: id }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete alias');
      }

      await refresh();
    },
    [refresh],
  );

  /**
   * Park or restore an alias without deleting it.
   *
   * The `is_active` column existed and the UI rendered a badge from it, but
   * nothing could change it — an alias could only be removed entirely. Keeping
   * the column written and unreadable-by-the-user was the gap.
   */
  const setAliasActive = useCallback(
    async (id: string, isActive: boolean) => {
      const { error: updateError } = await supabase
        .from('email_aliases')
        .update({ is_active: isActive })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      await refresh();
    },
    [refresh],
  );

  const userByAliasId = new Map<string, EmailUser>();
  for (const user of users) {
    if (user.email_alias_id) userByAliasId.set(user.email_alias_id, user);
  }

  return {
    aliases,
    users,
    loading,
    error,
    userByAliasId,
    refresh,
    createAlias,
    deleteAlias,
    setAliasActive,
  };
}