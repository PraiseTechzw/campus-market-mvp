import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { storage, CACHE_KEYS } from '@/lib/storage';
import Toast from 'react-native-toast-message';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUserProfile(session.user.id);
        }
      } else {
        setUser(null);
        await storage.removeItem(CACHE_KEYS.USER_PROFILE);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Add a small delay to ensure the database trigger has completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If user doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
          return;
        }
        throw error;
      }

      setUser(data);
      await storage.setItem(CACHE_KEYS.USER_PROFILE, data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('No authenticated user');

      // Use RPC function to bypass RLS policies for user creation
      const { data, error } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        user_email: authUser.user.email!,
        user_name: authUser.user.user_metadata?.name || 'User',
        is_user_verified: false
      });

      if (error) {
        console.error('RPC error creating user profile:', error);
        throw error;
      }

      // Fetch the newly created user profile
      await fetchUserProfile(userId);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Sign up with email confirmation enabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // This ensures OTP is sent instead of magic link
          data: {
            name: name, // Store name in user metadata
          }
        }
      });

      if (error) throw error;

      // Create user profile immediately after signup
      if (data.user) {
        try {
          await createUserProfile(data.user.id);
        } catch (profileError: any) {
          console.error('Error creating user profile during signup:', profileError);
          return { error: `Failed to create user profile: ${profileError.message}` };
        }
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await storage.clear();
      
      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been successfully signed out',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Sign Out Failed',
        text2: error.message || 'Failed to sign out',
      });
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await storage.setItem(CACHE_KEYS.USER_PROFILE, updatedUser);

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}