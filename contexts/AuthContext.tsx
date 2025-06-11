import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { useAuth as useClerkAuth, useUser as useClerkUser, useSession, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { createContext, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { session, isLoaded: isSessionLoaded } = useSession();
  const { signUp: clerkSignUp } = useSignUp();
  const { signIn: clerkSignIn } = useSignIn();
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate a valid UUID from Clerk ID
  const generateUUID = (clerkId: string) => {
    // Convert the clerkId to a hex string
    const hexString = Array.from(clerkId)
      .map(char => {
        const code = char.charCodeAt(0);
        return code.toString(16).padStart(2, '0');
      })
      .join('')
      .slice(0, 32)
      .padEnd(32, '0');
    
    // Format as UUID
    return `${hexString.slice(0, 8)}-${hexString.slice(8, 12)}-${hexString.slice(12, 16)}-${hexString.slice(16, 20)}-${hexString.slice(20, 32)}`;
  };

  useEffect(() => {
    // This effect ensures Supabase's session is always in sync with Clerk's session.
    // Supabase RLS policies rely on the internal session state being set.
    const setSupabaseSession = async () => {
      if (isClerkLoaded && isSessionLoaded && session) {
        try {
          console.log('🔍 DEBUG: Setting Supabase session from Clerk...');
          // Get the Clerk JWT for Supabase
          const authToken = await session.getToken({ template: 'supabase' });

          if (authToken) {
            await supabase.auth.setSession({
              access_token: authToken,
              // Supabase's setSession requires a refresh_token, but Clerk manages its own refresh cycle.
              // If your Supabase JWT secret matches Clerk's, Supabase will validate the access_token
              // and handle its own session refreshing. We provide an empty string to satisfy the type.
              refresh_token: '',
            });
            console.log('✅ DEBUG: Supabase session set successfully.');
      } else {
            console.warn('⚠️ DEBUG: Clerk authToken not available for Supabase session.');
          }
        } catch (error) {
          console.error('❌ DEBUG: Error setting Supabase session:', error);
        }
      } else if (isClerkLoaded && isSessionLoaded && !session) {
        // If Clerk is loaded but there's no session, clear Supabase session
        console.log('🔍 DEBUG: Clearing Supabase session (no Clerk session).');
        await supabase.auth.signOut(); // This also clears the local session
      }
    };
    setSupabaseSession();
  }, [isClerkLoaded, session, isSessionLoaded]); // Depend on Clerk's loaded state, session, and session loaded state

  useEffect(() => {
    const initializeUser = async () => {
      if (isClerkLoaded && isUserLoaded && isSessionLoaded) {
        if (clerkUser) {
          try {
            const userId = generateUUID(clerkUser.id);
            console.log('🔍 DEBUG: Generated UUID:', userId);
            
            // First try to get the user from Supabase
            const { data: supabaseUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means 0 rows, which is handled
              console.error('❌ DEBUG: Error fetching user from Supabase:', error);
              // Handle other errors, maybe return or show toast
          return;
        }

            if (!supabaseUser) {
              console.log('🔍 DEBUG: User not found in Supabase, creating new user');
              // If user doesn't exist in Supabase, create them
              const userData = {
                id: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : '',
                avatar_url: clerkUser.imageUrl || '',
                university: null,
                phone: null,
                bio: null,
                is_verified: false,
                verification_status: 'pending',
                rating: 0,
                total_reviews: 0,
                total_sales: 0,
                total_earnings: 0,
                last_active: new Date().toISOString(),
                is_online: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert(userData)
                .select()
                .single();

              if (createError) {
                console.error('❌ DEBUG: Error creating user in Supabase:', createError);
                return;
              }

              if (newUser) {
                console.log('✅ DEBUG: Successfully created user in Supabase');
                const userData: User = {
                  id: newUser.id,
                  email: newUser.email,
                  name: newUser.name,
                  university: newUser.university || undefined,
                  avatar_url: newUser.avatar_url || undefined,
                  phone: newUser.phone || undefined,
                  bio: newUser.bio || undefined,
                  is_verified: newUser.is_verified,
                  verification_status: newUser.verification_status,
                  rating: newUser.rating || 0,
                  total_reviews: newUser.total_reviews || 0,
                  total_sales: newUser.total_sales || 0,
                  total_earnings: newUser.total_earnings || 0,
                  last_active: newUser.last_active,
                  is_online: newUser.is_online,
                  created_at: newUser.created_at,
                  updated_at: newUser.updated_at
                };
                setUser(userData);
              }
            } else { // supabaseUser exists
              console.log('✅ DEBUG: Found existing user in Supabase');
              const userData: User = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.name,
                university: supabaseUser.university || undefined,
                avatar_url: supabaseUser.avatar_url || undefined,
                phone: supabaseUser.phone || undefined,
                bio: supabaseUser.bio || undefined,
                is_verified: supabaseUser.is_verified,
                verification_status: supabaseUser.verification_status,
                rating: supabaseUser.rating || 0,
                total_reviews: supabaseUser.total_reviews || 0,
                total_sales: supabaseUser.total_sales || 0,
                total_earnings: supabaseUser.total_earnings || 0,
                last_active: supabaseUser.last_active,
                is_online: supabaseUser.is_online,
                created_at: supabaseUser.created_at,
                updated_at: supabaseUser.updated_at
              };
              setUser(userData);
            }
    } catch (error) {
            console.error('❌ DEBUG: Error in user initialization:', error);
          }
        } else {
          // No Clerk user, so clear local user state
          setUser(null);
        }
      setLoading(false);
    }
  };

    initializeUser();
  }, [isClerkLoaded, isUserLoaded, clerkUser, isSessionLoaded]);

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

      if (result.status === 'complete' && result.createdSessionId) {
        const userId = generateUUID(result.createdSessionId);
        console.log('Generated UUID for sign in:', userId); // Debug log
        // After successful login, ensure user exists in Supabase
        const { data: supabaseUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !supabaseUser) {
          // Create user in Supabase if they don't exist
          const userData = {
            id: userId,
            email: email,
            name: email.split('@')[0], // Use email username as default name
            university: null,
            avatar_url: null,
            phone: null,
            bio: null,
            is_verified: false,
            verification_status: 'pending',
            rating: 0,
            total_reviews: 0,
            total_sales: 0,
            total_earnings: 0,
            last_active: new Date().toISOString(),
            is_online: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: createError } = await supabase
            .from('users')
            .insert(userData);

          if (createError) {
            console.error('Error creating user in Supabase:', createError);
            return { error: 'Failed to create user profile' };
          }
        }

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

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!clerkUser) throw new Error('No user logged in');

      // Generate UUID from Clerk ID
      const userId = generateUUID(clerkUser.id);
      console.log('🔍 DEBUG: Updating profile with:', {
        userId,
        updates,
        clerkId: clerkUser.id
      });

      // Update Supabase profile
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ DEBUG: Error updating profile in Supabase:', error);
        throw error;
      }

      console.log('✅ DEBUG: Profile updated successfully:', data);

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);

      return {};
    } catch (error: any) {
      console.error('❌ DEBUG: Error updating profile:', error);
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
      updateProfile,
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
