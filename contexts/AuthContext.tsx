import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { useAuth as useClerkAuth, useUser as useClerkUser, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { createContext, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { name?: string; avatar_url?: string }) => Promise<{ error?: string }>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { signUp: clerkSignUp } = useSignUp();
  const { signIn: clerkSignIn } = useSignIn();
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (isClerkLoaded && isUserLoaded) {
        if (clerkUser) {
          try {
            // First try to get the user from Supabase
            const { data: supabaseUser, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', clerkUser.id)
              .single();

            if (error) {
              console.error('Error fetching user from Supabase:', error);
            }

            // Convert Clerk user to our User type
            const userData: User = {
              id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              name: supabaseUser?.name || clerkUser.fullName || '',
              university: supabaseUser?.university,
              avatar_url: supabaseUser?.avatar_url || clerkUser.imageUrl || undefined,
              phone: supabaseUser?.phone || clerkUser.phoneNumbers[0]?.phoneNumber || undefined,
              bio: supabaseUser?.bio,
              is_verified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
              verification_status: clerkUser.emailAddresses[0]?.verification?.status === 'verified' ? 'approved' : 'pending',
              rating: supabaseUser?.rating || 0,
              total_reviews: supabaseUser?.total_reviews || 0,
              total_sales: supabaseUser?.total_sales || 0,
              total_earnings: supabaseUser?.total_earnings || 0,
              last_active: new Date().toISOString(),
              is_online: true,
              created_at: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            setUser(userData);
          } catch (error) {
            console.error('Error initializing user:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    };

    initializeUser();
  }, [isClerkLoaded, isUserLoaded, clerkUser]);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('🔍 DEBUG: ====== STARTING CLERK SIGNUP ======');
      console.log('📝 Signup data:', { email, passwordLength: password.length });

      if (!clerkSignUp) throw new Error('SignUp not initialized');

      const result = await clerkSignUp.create({
        emailAddress: email,
        password
      });

      if (result.status === 'complete' && result.createdUserId) {
        console.log('✅ DEBUG: Signup successful');
        
        // Create user profile in Supabase
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: result.createdUserId,
            email: email,
            name: email.split('@')[0], // Use email username as default name
            is_verified: false,
            verification_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('❌ DEBUG: Failed to create user profile:', profileError);
          return { error: 'Failed to create user profile' };
        }

        return {};
      } else {
        console.error('❌ DEBUG: Signup incomplete:', result.status);
        return { error: 'Signup incomplete' };
      }
    } catch (error: any) {
      console.error('❌ DEBUG: Signup error:', error);
      return { error: error.message || 'Registration failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!clerkSignIn) throw new Error('SignIn not initialized');

      const result = await clerkSignIn.create({
        identifier: email,
        password
      });

      if (result.status === 'complete') {
        return {};
      } else {
        return { error: 'Sign in incomplete' };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
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

  const updateUserProfile = async (updates: { name?: string; avatar_url?: string }) => {
    try {
      if (!clerkUser) throw new Error('No user logged in');

      if (updates.name) {
        await clerkUser.update({
          firstName: updates.name.split(' ')[0],
          lastName: updates.name.split(' ').slice(1).join(' ')
        });
      }

      if (updates.avatar_url) {
        await clerkUser.setProfileImage({
          file: updates.avatar_url
        });
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const fetchUserProfile = async (userId: string) => {
    // Clerk handles this automatically through the useUser hook
    return;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateUserProfile,
      fetchUserProfile,
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
