/**
 * Admin Login Page
 *
 * Authentication page for admin and staff users.
 * Uses Firebase Authentication with Supabase user profile lookup.
 *
 * @module AdminLogin
 */

import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link, Location } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * Location state type for redirect after login
 */
interface LocationState {
  from?: string;
}

/**
 * Turns a Firebase error into something worth reading.
 *
 * Every code here used to be matched as a substring of the message. Two of the
 * branches were unreachable: since Firebase v9 a wrong password no longer
 * returns `auth/wrong-password` or `auth/user-not-found`, it returns a single
 * `auth/invalid-credential` for both. Matching on the code is the only stable
 * way to read it, and `auth/invalid-credential` deliberately gets one shared
 * message — telling an attacker which half was right turns the login form into
 * an account-existence oracle.
 */
const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'That email and password do not match an account.',
  'auth/invalid-email': 'That does not look like a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact an administrator.',
  'auth/too-many-requests': 'Too many failed attempts. Wait a few minutes, then try again.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
  'auth/operation-not-allowed':
    'Email and password sign-in is disabled for this project. Contact an administrator.',
};

function describeLoginFailure(error: unknown): string {
  // FirebaseError exposes `code` directly; prefer it over message matching.
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code && FIREBASE_ERRORS[code]) return FIREBASE_ERRORS[code];

  // Network failures sometimes arrive without a usable code.
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('network') || message.includes('failed to fetch')) {
    return FIREBASE_ERRORS['auth/network-request-failed'];
  }

  return 'Could not sign you in. Try again, or contact an administrator if it keeps failing.';
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
  const [showPassword, setShowPassword] = useState(false);
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
      const user = await usersService.getUserByFirebaseUid(firebaseUser.uid);

      if (!user) {
        // Authenticated, but no profile. The session must be torn down or the
        // auth guard would keep treating this person as signed in.
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        setSubmitError('This account is not set up in the system. Contact an administrator.');
        return;
      }

      // Role check happens BEFORE the profile is published to the store, so a
      // non-admin session never reaches the app even for a frame.
      if (user.role !== 'admin' && user.role !== 'staff') {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        setSubmitError('Your account does not have access to the admin portal.');
        return;
      }

      const { useAuthStore } = await import('../../store/authStore');
      useAuthStore.getState().setUser(user);

      // Navigate to the attempted URL or admin dashboard
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Login error:', err);
      setSubmitError(describeLoginFailure(err));
    } finally {
      // Every path out of the try above — including the early returns that
      // reject the credentials — has to clear this, or the button stays stuck
      // on "Signing in…" with no way back.
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="https://res.cloudinary.com/dxb22swfg/image/upload/v1765747561/Asset_4_v5ksi6.png"
            alt="Sternmed Afrika"
            className="mb-5 h-14 w-auto"
            referrerPolicy="no-referrer"
          />
          {/*
            One header, not two. This used to be followed by an "Admin Sign In"
            block inside the card with its own icon tile and subtitle — the same
            title twice, eight pixels apart, split across two containers.
          */}
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the management system.</p>
        </div>

        {submitError && <ErrorMessage message={submitError} />}

        <LoginForm
          email={email}
          password={password}
          showPassword={showPassword}
          isSubmitting={isSubmitting}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword((visible) => !visible)}
          onSubmit={handleSubmit}
        />

        <p className="mt-8 text-center text-xs text-slate-400">
          Restricted access. Authorized personnel only.
        </p>

        <p className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            Back to website
          </Link>
        </p>
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
    // role="alert" so a screen reader announces the failure the moment it
    // appears; a failed sign-in with no announcement is a dead end.
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
    >
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

/**
 * Login form
 */
interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function LoginForm({
  email,
  password,
  showPassword,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          disabled={isSubmitting}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:bg-slate-50"
          placeholder="admin@sternmedafrika.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            // Switching type keeps whatever the user has already typed — the
            // common alternative unmounts and remounts the input, which drops
            // the field's contents.
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-3 pr-11 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:bg-slate-50"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            // aria-label rather than a title tooltip: this is an icon control
            // and its purpose is not otherwise exposed.
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition-colors hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}