import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuth = (): AuthState => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, username: string, firstName?: string, lastName?: string) => {
    try {
      console.log('Starting sign up process...');
      console.log('Data:', { email, username, firstName, lastName });

      // First, check if the email already exists in auth.users
      if (supabaseAdmin) {
        console.log('Checking if email already exists...');
        const { data: existingUsers, error: checkError } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('email', email)
          .limit(1);

        if (checkError) {
          console.error('Error checking for existing email:', checkError);
        } else if (existingUsers && existingUsers.length > 0) {
          console.error('Email already exists:', email);
          return { error: new Error('Email already exists. Please use a different email address.') };
        }
      }

      // Try direct admin API approach first (most reliable)
      if (supabaseAdmin) {
        console.log('Using admin API for user creation...');
        try {
          // Step 1: Create the user with admin API
          const { data: adminUserData, error: adminUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              username,
              first_name: firstName || '',
              last_name: lastName || '',
            },
          });

          console.log('Admin user creation result:', { 
            user: adminUserData?.user ? 'User created' : 'No user created', 
            error: adminUserError ? adminUserError.message : 'No error' 
          });

          if (adminUserError) {
            console.error('Error creating user with admin API:', adminUserError);
            // Fall through to regular sign-up
          } else if (adminUserData?.user) {
            const user = adminUserData.user;
            console.log('User created successfully with admin API');

            // Step 2: Ensure user record exists in the users table
            console.log('Ensuring user record exists in users table...');
            const { error: userError } = await supabaseAdmin
              .from('users')
              .upsert({
                id: user.id,
                username,
                email,
                first_name: firstName || '',
                last_name: lastName || '',
                avatar_url: '',
                bio: ''
              }, { onConflict: 'id' });

            if (userError) {
              console.error('Error ensuring user record exists:', userError);
              // Continue with sign-in even if user record creation fails
            }

            // Step 3: Sign in the user
            console.log('Signing in the newly created user...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (signInError) {
              console.error('Error signing in after user creation:', signInError);
              return { error: new Error(`User created but sign-in failed: ${signInError.message}`) };
            }

            console.log('User creation and sign-in process completed successfully');
            return { error: null };
          }
        } catch (adminError) {
          console.error('Unexpected error during admin user creation:', adminError);
          // Fall through to regular sign-up
        }
      }

      // Fall back to regular sign-up if admin approach failed
      console.log('Attempting regular sign-up...');
      const { data: regularData, error: regularError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName || '',
            last_name: lastName || '',
          },
        },
      });

      console.log('Regular sign-up result:', { 
        user: regularData?.user ? 'User created' : 'No user created', 
        error: regularError ? regularError.message : 'No error' 
      });

      if (regularError) {
        console.error('Error during regular sign-up:', regularError);
        return { error: regularError };
      }

      if (!regularData?.user) {
        console.error('No user returned from regular sign-up');
        return { error: new Error('Failed to create user account') };
      }

      // Ensure user record exists in the users table
      console.log('Ensuring user record exists in users table after regular sign-up...');
      try {
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: regularData.user.id,
            username,
            email,
            first_name: firstName || '',
            last_name: lastName || '',
            avatar_url: '',
            bio: ''
          }, { onConflict: 'id' });

        if (userError) {
          console.error('Error ensuring user record exists after regular sign-up:', userError);
          // Continue anyway
        }
      } catch (dbError) {
        console.error('Error during database operations after regular sign-up:', dbError);
        // Continue anyway
      }

      console.log('Regular sign-up successful');
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}; 