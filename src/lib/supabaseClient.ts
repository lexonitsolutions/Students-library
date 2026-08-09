import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Add them to .env.local (see .env.example).',
  );
}

// No generic `Database` type is passed here: this project's hand-written
// database.types.ts models Row/Insert/Update shapes for documentation and
// service-layer return types, but doesn't attempt to match postgrest-js's
// full query-builder generics (which expect CLI-generated types with exact
// embedded-relationship metadata). Each function in src/services/ annotates
// its own return type against those row interfaces instead.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
