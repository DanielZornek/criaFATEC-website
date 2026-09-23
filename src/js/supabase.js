const SUPABASE_URL = 'https://fpomnbsbgsmbrnatfmrj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kT15zEwJ4CAId1qExsF2HA_V31vPaMf';

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);