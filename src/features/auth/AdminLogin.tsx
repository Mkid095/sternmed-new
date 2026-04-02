/**
 * Admin Login Page
 *
 * Authentication page for admin and staff users.
 * Uses Firebase Authentication with Supabase user profile lookup.
 *
 * @module AdminLogin
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Location } from 'react-router-dom';
import { Lock } from 'lucide-react';

/**
 * Location state type for redirect after login
 */
interface LocationState {
  from?: string;
}

/**
 * Admin Login Page Component
 *
 * Handles admin authentication:
 * - Email/password login via Firebase
 * - User profile lookup from Supabase
 * - Role verification (admin/staff only)
 * - Redirect to attempted URL after login
 *
 * @example
 * <Route path="/admin/login" element={<AdminLogin />} />
 */
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to /admin
  const from = (location.state as LocationState)?.from || '/admin';

  /**
   * Handle login form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      // Dynamic import authService to avoid loading issues
      const { authService } = await import('../../services/auth.service');
      const { usersService } = await import('../../services/supabase');

      // Sign in with Firebase
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../config/firebase');

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Get the user profile from Supabase
      let user = await usersService.getUserByFirebaseUid(firebaseUser.uid);

      if (!user) {
        setSubmitError('User not found in the system. Please contact your administrator.');
        setIsSubmitting(false);
        return;
      }

      // Check if user has admin or staff role
      if (user.role !== 'admin' && user.role !== 'staff') {
        setSubmitError('Access denied. Admin or staff access only.');
        setIsSubmitting(false);
        // Sign out the user
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        return;
      }

      // Navigate to the attempted URL or admin dashboard
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Login error:', err);

      // Handle different error types
      let errorMessage = 'Invalid email or password';

      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        if (message.includes('auth/invalid-email')) {
          errorMessage = 'Invalid email address format';
        } else if (message.includes('auth/user-not-found')) {
          errorMessage = 'No account found with this email';
        } else if (message.includes('auth/wrong-password')) {
          errorMessage = 'Incorrect password';
        } else if (message.includes('auth/too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later';
        } else if (message.includes('auth/network-request-failed')) {
          errorMessage = 'Network error. Please check your connection';
        }
      }

      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <LoginPageHeader />

        {/* Login Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          <LoginFormHeader />

          {/* Error Message */}
          {submitError && (
            <ErrorMessage message={submitError} />
          )}

          {/* Login Form */}
          <LoginForm
            email={email}
            password={password}
            isSubmitting={isSubmitting}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
          />

          {/* Back Link */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <a href="/" className="block text-center text-sm text-slate-500 hover:text-slate-700">
              Back to Website
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}

/**
 * Login page header with logo
 */
function LoginPageHeader() {
  return (
    <div className="text-center mb-8">
      <img
        src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
        alt="Sternmed Afrika"
        className="h-16 w-auto mx-auto mb-4"
        referrerPolicy="no-referrer"
      />
      <h1 className="text-xl font-semibold text-slate-900">Admin Portal</h1>
      <p className="text-slate-500 text-sm mt-1">
        Sternmed Afrika Ltd Management System
      </p>
    </div>
  );
}

/**
 * Login form card header
 */
function LoginFormHeader() {
  return (
    <div className="mb-6 pb-6 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Lock className="text-blue-600" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Admin Sign In</h2>
          <p className="text-xs text-slate-500">
            Enter your credentials to continue
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Error message display
 */
interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

/**
 * Login form
 */
interface LoginFormProps {
  email: string;
  password: string;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function LoginForm({
  email,
  password,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="admin@sternmedafrika.com"
        />
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}
