/**
 * Email Templates Service
 *
 * Manages email templates with versioning support.
 * Templates provide reusable content for outbound emails.
 *
 * @module services/email-templates
 */

import { supabase } from '../../config/supabase';
import { EmailTemplate } from '../../types';

/**
 * Database row type for email_templates table
 */
interface EmailTemplateRow {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  category: string | null;
  variables: unknown[];
  version: number;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database row to application type
 */
function transformTemplateRow(row: EmailTemplateRow): EmailTemplate {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text ?? undefined,
    category: row.category ?? undefined,
    variables: (row.variables as string[]) ?? [],
    version: row.version,
    isSystem: row.is_system,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Email templates service
 */
export const emailTemplatesService = {
  /**
   * Get all email templates
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
    return (data as EmailTemplateRow[]).map(transformTemplateRow);
  },

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
    return (data as EmailTemplateRow[]).map(transformTemplateRow);
  },

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return transformTemplateRow(data as EmailTemplateRow);
  },

  /**
   * Create a new email template
   */
  async createTemplate(input: {
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    category?: string;
    variables?: string[];
    createdBy?: string;
  }): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name: input.name,
        subject: input.subject,
        body_html: input.bodyHtml,
        body_text: input.bodyText ?? null,
        category: input.category ?? null,
        variables: (input.variables ?? []) as unknown[],
        created_by: input.createdBy ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create template: ${error.message}`);
    return transformTemplateRow(data as EmailTemplateRow);
  },

  /**
   * Update an existing template (creates new version)
   */
  async updateTemplate(
    id: string,
    updates: Partial<
      Pick<EmailTemplate, 'subject' | 'bodyHtml' | 'bodyText' | 'category' | 'variables'>
    >
  ): Promise<EmailTemplate> {
    // First, get the current template to increment version
    const currentTemplate = await this.getTemplateById(id);
    if (!currentTemplate) {
      throw new Error('Template not found');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      // Increment version
      version: currentTemplate.version + 1,
    };

    if (updates.subject !== undefined) {
      updateData.subject = updates.subject;
    }
    if (updates.bodyHtml !== undefined) {
      updateData.body_html = updates.bodyHtml;
    }
    if (updates.bodyText !== undefined) {
      updateData.body_text = updates.bodyText;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }
    if (updates.variables !== undefined) {
      updateData.variables = updates.variables as unknown[];
    }

    const { data, error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update template: ${error.message}`);
    return transformTemplateRow(data as EmailTemplateRow);
  },

  /**
   * Delete a template (only non-system templates)
   */
  async deleteTemplate(id: string): Promise<void> {
    // First check if it's a system template
    const template = await this.getTemplateById(id);
    if (template?.isSystem) {
      throw new Error('Cannot delete system templates');
    }

    const { error } = await supabase.from('email_templates').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete template: ${error.message}`);
  },

  /**
   * Apply template variables to content
   */
  applyTemplateVariables(
    template: EmailTemplate,
    variables: Record<string, string>
  ): { subject: string; bodyHtml: string; bodyText?: string } {
    let subject = template.subject;
    let bodyHtml = template.bodyHtml;
    let bodyText = template.bodyText;

    // Replace each variable in the format {{variableName}}
    template.variables.forEach((varName) => {
      const placeholder = `{{${varName}}}`;
      const value = variables[varName] || placeholder;

      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), value);
      if (bodyText) {
        bodyText = bodyText.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    return {
      subject,
      bodyHtml,
      bodyText,
    };
  },

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('category');

    if (error) throw new Error(`Failed to fetch categories: ${error.message}`);

    const categories = (data as EmailTemplateRow[])
      .map((row) => row.category)
      .filter((cat): cat is string => cat !== null);

    return [...new Set(categories)];
  },
};
