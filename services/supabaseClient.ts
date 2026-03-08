
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xcxdkplxrxsuuwebpnyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeGRrcGx4cnhzdXV3ZWJwbnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIwNzksImV4cCI6MjA4NzA1ODA3OX0.me1hIWuzeisbb9uBgBUSvHtQkYFMetDcrZ71XJJ68nM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
