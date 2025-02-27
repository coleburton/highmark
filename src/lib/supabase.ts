import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Initialize Supabase client
// Get environment variables from Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = Constants.expoConfig?.extra?.supabaseServiceKey || process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || '';

// Log the URL and key for debugging (remove in production)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Key exists' : 'Key missing');
console.log('Supabase Service Key:', supabaseServiceKey ? 'Key exists' : 'Key missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Create a service role client for admin operations (bypasses RLS)
// Note: This should only be used for operations that require admin privileges
// and should never be exposed to the client directly
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null; 