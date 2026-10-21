// src/js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://fpomnbsbgsmbrnatfmrj.supabase.co";
const SUPABASE_KEY = "sb_publishable_kT15zEwJ4CAId1qExsF2HA_V31vPaMf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Exporta também como supabaseClient para o feed.js reconhecer
export const supabaseClient = supabase;
export default supabase;