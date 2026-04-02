import { useState, useEffect } from 'react'
import { Plus, Mail, ExternalLink, Trash2, Copy, Check } from 'lucide-react'
import { supabase } from '../../../config/supabase'
import { ConfirmationModal, useConfirmationModal, useToastSuccess, useToastError } from '../../shared/ui'

interface EmailAlias {
  id: string
  alias_email: string
  display_name: string
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  email: string
  email_alias_id?: string
  role: string
}

export function AdminMails() {
  const [aliases, setAliases] = useState<EmailAlias[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; name: string; recipientEmail: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [newAlias, setNewAlias] = useState({ email: '', name: '', recipientEmail: '' })
  const [creating, setCreating] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  const { confirm, props } = useConfirmationModal()
  const showSuccess = useToastSuccess()
  const showError = useToastError()

  const fetchAliases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('email_aliases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching aliases:', error)
    } else {
      setAliases(data || [])
    }
    setLoading(false)
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, email_alias_id, role')
      .eq('role', 'email_user')

    if (!error && data) {
      setUsers(data as User[])
    }
  }

  useEffect(() => {
    fetchAliases()
    fetchUsers()
  }, [])

  const DOMAIN = '@sternmedafrika.com'

  // Generate a random temporary password
  const generateTemporaryPassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleCreateAlias = async () => {
    if (!newAlias.email || !newAlias.name || !newAlias.recipientEmail) {
      showError('Please fill in all fields')
      return
    }

    // Auto-append domain if not already present
    let aliasEmail = newAlias.email
    if (!aliasEmail.includes('@')) {
      aliasEmail = aliasEmail + DOMAIN
    }

    setCreating(true)

    try {
      // 1. Generate temporary password
      const temporaryPassword = generateTemporaryPassword()

      // 2. Insert alias first to get an ID
      const { data: createdAlias, error: aliasError } = await supabase
        .from('email_aliases')
        .insert({
          alias_email: aliasEmail,
          display_name: newAlias.name,
          is_active: true,
        })
        .select()
        .single()

      if (aliasError) throw aliasError

      // 3. Call Edge Function to create Firebase user and Supabase record
      // This runs server-side so the admin doesn't get signed out
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-email-user`

      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: aliasEmail,
          password: temporaryPassword,
          displayName: newAlias.name,
          aliasId: createdAlias.id,
        }),
      })

      const edgeResult = await edgeResponse.json()

      if (!edgeResponse.ok) {
        // ROLLBACK: Delete the alias we just created
        await supabase.from('email_aliases').delete().eq('id', createdAlias.id);
        throw new Error(edgeResult.error || 'Failed to create email user')
      }

      // 3. Send credentials email to recipient (best effort, don't fail if email fails)
      try {
        const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to Sternmed Afrika Email</h2>
            <p>Hello ${newAlias.name},</p>
            <p>Your email alias has been created. Here are your login credentials:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${aliasEmail}</p>
              <p><strong>Password:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #ddd; border-radius: 4px;">${temporaryPassword}</code></p>
            </div>
            <p>You can log in to your email at: <a href="https://mail.sternmedafrika.com" style="color: #2563eb;">https://mail.sternmedafrika.com</a></p>
            <p>For security reasons, we recommend changing your password after the first login.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #666; font-size: 12px;">If you did not request this alias, please contact the administrator immediately.</p>
          </div>
        `;

        await fetch(sendEmailUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: newAlias.recipientEmail,
            subject: 'Your Sternmed Afrika Email Account',
            html: emailHtml,
            from: 'Sternmed Afrika <noreply@sternmedafrika.com>',
          }),
        });
      } catch (emailError) {
        console.error('Failed to send credentials email:', emailError);
        // Continue anyway - we still show credentials modal
      }

      // 4. Store credentials to show in modal (preserve recipientEmail before resetting newAlias)
      setCreatedCredentials({
        email: aliasEmail,
        password: temporaryPassword,
        name: newAlias.name,
        recipientEmail: newAlias.recipientEmail,
      })

      // Reset form
      setNewAlias({ email: '', name: '', recipientEmail: '' })
      setShowCreateModal(false)
      setShowCredentialsModal(true)

      // Refresh
      fetchAliases()
      fetchUsers()

      showSuccess('Email alias created successfully!')
    } catch (error: any) {
      console.error('Error creating alias:', error)

      // Handle specific errors
      if (error.message?.includes('EMAIL_EXISTS')) {
        showError('A user with this email already exists')
      } else if (error.message?.includes('INVALID_EMAIL')) {
        showError('Invalid email address format')
      } else {
        showError(`Failed to create alias: ${error.message}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const copyCredentials = () => {
    if (!createdCredentials) return

    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nLogin at: https://mail.sternmedafrika.com\n\nThis account was created for: ${createdCredentials.name} (${createdCredentials.recipientEmail})`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showSuccess('Credentials copied to clipboard!')
  }

  const handleDeleteAlias = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Email Alias',
      message: 'Are you sure you want to delete this email alias? This will also delete the associated user account and credentials. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })

    if (!confirmed) return

    try {
      // Call edge function to delete alias and associated user
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/delete-email-user`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ aliasId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete alias');
      }

      showSuccess('Alias and user deleted successfully');
      fetchAliases();
    } catch (error: any) {
      console.error('Failed to delete alias:', error);
      showError(`Failed to delete alias: ${error.message}`);
    }
  }

  const openMailbox = (alias: EmailAlias) => {
    // Open mail.sternmedafrika.com in new tab
    window.open('https://mail.sternmedafrika.com', '_blank')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mails</h1>
        <p className="text-gray-600 mt-1">Manage email aliases and access mailboxes</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Email Alias
        </button>
        <a
          href="https://mail.sternmedafrika.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Email Platform
        </a>
      </div>

      {/* Email Aliases */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Email Aliases</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : aliases.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No email aliases yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first alias →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {aliases.map((alias) => {
              const associatedUser = users.find(u => u.email_alias_id === alias.id)

              return (
                <div key={alias.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{alias.alias_email}</h3>
                      <p className="text-sm text-gray-500">{alias.display_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          alias.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {alias.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {associatedUser && (
                          <span className="text-xs text-gray-500">
                            User: {associatedUser.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openMailbox(alias)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Open mailbox"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlias(alias.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete alias"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Users with Email Access */}
      {!loading && users.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Email Users</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">Email User</p>
                </div>
                <button
                  onClick={() => window.open('https://mail.sternmedafrika.com', '_blank')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Access Mailbox →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Alias Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create Email Alias</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alias Name
                </label>
                <input
                  type="text"
                  value={newAlias.email}
                  onChange={(e) => setNewAlias({ ...newAlias, email: e.target.value.replace(/@.*$/, '') })}
                  placeholder="kennedy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will become: <span className="font-mono text-blue-600">
                    {newAlias.email || 'alias'}@sternmedafrika.com
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newAlias.name}
                  onChange={(e) => setNewAlias({ ...newAlias, name: e.target.value })}
                  placeholder="Kennedy Omondi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email (for credentials)
                </label>
                <input
                  type="email"
                  value={newAlias.recipientEmail}
                  onChange={(e) => setNewAlias({ ...newAlias, recipientEmail: e.target.value })}
                  placeholder="personal@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Login credentials will be sent here (for your reference)</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewAlias({ email: '', name: '', recipientEmail: '' })
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlias}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create Alias'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && createdCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 bg-green-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Email Alias Created!</h2>
                  <p className="text-sm text-gray-600">Share these credentials with the user</p>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">User Information</h3>
                <p className="text-sm text-blue-800">
                  <strong>Name:</strong> {createdCredentials.name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Recipient Email:</strong> {createdCredentials?.recipientEmail}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Login Credentials</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
                        {createdCredentials.email}
                      </code>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Temporary Password</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
                        {createdCredentials.password}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> The user should change their password after first login at{' '}
                  <a href="https://mail.sternmedafrika.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">
                    mail.sternmedafrika.com
                  </a>
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCredentialsModal(false)
                  setCreatedCredentials(null)
                  setNewAlias({ email: '', name: '', recipientEmail: '' })
                }}
                className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={copyCredentials}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Credentials
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal {...props} />
    </div>
  )
}
