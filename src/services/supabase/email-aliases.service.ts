/**
 * Email Aliases Service
 *
 * Manages email alias CRUD operations for the Sternmed Afrika email system.
 * Email aliases allow departments to have dedicated email addresses (e.g., kennedy@sternmed.com).
 *
 * @module services/email-aliases
 */

import { supabase } from '../../config/supabase';
import { EmailAlias } from '../../types';

/**
 * Database row type for email_aliases table
 */
interface EmailAliasRow {
  id: string;
  alias_email: string;
  display_name: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to application type
 */
function transformAliasRow(row: EmailAliasRow): EmailAlias {
  return {
    id: row.id,
    aliasEmail: row.alias_email,
    displayName: row.display_name,
    isActive: row.is_active,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Email aliases service
 */
export const emailAliasesService = {
  /**
   * Get all email aliases
   */
  async getAliases(): Promise<EmailAlias[]> {
    const { data, error } = await supabase
      .from('email_aliases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch aliases: ${error.message}`);
    return (data as EmailAliasRow[]).map(transformAliasRow);
  },

  /**
   * Get a single alias by ID
   */
  async getAliasById(id: string): Promise<EmailAlias | null> {
    const { data, error } = await supabase
      .from('email_aliases')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return transformAliasRow(data as EmailAliasRow);
  },

  /**
   * Get alias by email address
   */
  async getAliasByEmail(email: string): Promise<EmailAlias | null> {
    const { data, error } = await supabase
      .from('email_aliases')
      .select('*')
      .eq('alias_email', email)
      .single();

    if (error || !data) return null;
    return transformAliasRow(data as EmailAliasRow);
  },

  /**
   * Create a new email alias
   */
  async createAlias(input: {
    aliasEmail: string;
    displayName: string;
    isActive?: boolean;
    createdBy: string;
  }): Promise<EmailAlias> {
    const { data, error } = await supabase
      .from('email_aliases')
      .insert({
        alias_email: input.aliasEmail,
        display_name: input.displayName,
        is_active: input.isActive ?? true,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create alias: ${error.message}`);

    // Create default rate limits for the alias
    await supabase.from('email_alias_limits').insert({
      alias_id: data.id,
      daily_limit: 100,
      monthly_limit: 3000,
    });

    return transformAliasRow(data as EmailAliasRow);
  },

  /**
   * Update an existing alias
   */
  async updateAlias(
    id: string,
    updates: Partial<Pick<EmailAlias, 'displayName' | 'isActive'>>
  ): Promise<EmailAlias> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.displayName !== undefined) {
      updateData.display_name = updates.displayName;
    }
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    const { data, error } = await supabase
      .from('email_aliases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update alias: ${error.message}`);
    return transformAliasRow(data as EmailAliasRow);
  },

  /**
   * Delete an alias (soft delete by deactivating)
   */
  async deleteAlias(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_aliases')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete alias: ${error.message}`);
  },

  /**
   * Get alias statistics
   */
  async getAliasStats(aliasId: string): Promise<{
    inboundCount: number;
    outboundCount: number;
    unreadCount: number;
  }> {
    const [inboundResult, outboundResult, unreadResult] = await Promise.all([
      supabase
        .from('email_inbound')
        .select('id', { count: 'exact', head: true })
        .eq('alias_id', aliasId)
        .is('deleted_at', null),
      supabase
        .from('email_outbound')
        .select('id', { count: 'exact', head: true })
        .eq('alias_id', aliasId)
        .is('deleted_at', null),
      supabase
        .from('email_inbound')
        .select('id', { count: 'exact', head: true })
        .eq('alias_id', aliasId)
        .eq('is_read', false)
        .is('deleted_at', null),
    ]);

    return {
      inboundCount: inboundResult.count || 0,
      outboundCount: outboundResult.count || 0,
      unreadCount: unreadResult.count || 0,
    };
  },
};
