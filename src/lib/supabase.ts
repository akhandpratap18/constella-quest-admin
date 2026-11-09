import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdrydgtnzlujciwgefmb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcnlkZ3Ruemx1amNpd2dlZm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzkwMTksImV4cCI6MjEwNzU1NTAxOX0.kCW0jgcqEh50Lz_ebsKO5ojT1Iu8g1fecZNn6aQx1aw';

export const supabase = createClient(supabaseUrl, supabaseKey);
