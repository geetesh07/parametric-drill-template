import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Check if service role key is properly configured
if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_COMPLETE_SERVICE_ROLE_KEY_HERE') {
  console.warn('Supabase service role key is missing or not properly configured. Admin features will not work.');
}

// Regular client for normal user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.token',
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'parametric-drill-template'
    }
  }
});

// Admin client with service role key - only used in admin routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'parametric-drill-template-admin'
    }
  }
}); 