import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { usersService, emailsService } from './supabase';
import { User } from '../types';

export const authService = {
  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<User> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    // Get the user profile from Supabase
    const user = await usersService.getUserByFirebaseUid(firebaseUser.uid);

    if (!user) {
      // If user doesn't exist in Supabase, create them
      return await authService.createUserProfile(firebaseUser);
    }

    // Check if force password reset is needed (for email users)
    // This would be stored in Firebase user metadata
    if (user.role === 'email_user' && firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime) {
      // First time login - should trigger password reset flow
      throw new Error('PASSWORD_RESET_REQUIRED');
    }

    return user;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  // Create a new user account
  signUp: async (email: string, password: string, name: string, role: 'admin' | 'staff' = 'staff'): Promise<User> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    try {
      const newUser = await usersService.createUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || email,
        name,
        role,
      });

      // Send credentials email (fire and forget - don't block user creation if email fails)
      try {
        await emailsService.sendUserCredentialsEmail(email, name, password, role);
        console.log('✅ Credentials email sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send credentials email:', emailError);
        // Don't throw - user was created successfully
      }

      return newUser;
    } catch (error) {
      // If Supabase insert fails, delete the Firebase user
      await firebaseUser.delete();
      throw error;
    }
  },

  // Create user profile in Supabase (for existing Firebase users)
  createUserProfile: async (
    firebaseUser: FirebaseUser,
    name?: string,
    role: 'admin' | 'staff' = 'staff'
  ): Promise<User> => {
    return await usersService.createUser({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role,
    });
  },

  // Send password reset email
  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  // Get current user profile from Supabase
  getCurrentUserProfile: async (firebaseUid: string): Promise<User | null> => {
    return await usersService.getUserByFirebaseUid(firebaseUid);
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await authService.getCurrentUserProfile(firebaseUser.uid);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  },

  // Get current Firebase user
  getCurrentFirebaseUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },
};

export default authService;
