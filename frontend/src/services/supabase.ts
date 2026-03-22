import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create a real client if credentials are provided
// Otherwise create a placeholder that won't crash the app
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Create a dummy client with a placeholder URL so the app still runs
  // Auth calls will fail gracefully
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
