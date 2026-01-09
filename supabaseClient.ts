
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ylcyvqqsttginqabqwto.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY3l2cXFzdHRnaW5xYWJxd3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODU1MjYsImV4cCI6MjA4MzM2MTUyNn0.nhWAVsEFocW8ErxiX_9H2erQ9EkR8KmDbbYVf8D8u2A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
