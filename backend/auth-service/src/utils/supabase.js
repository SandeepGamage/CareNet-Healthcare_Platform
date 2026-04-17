const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key for backend operations if available (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Image uploads will fail.');
} else {
  const which = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY';
  console.log(`[Auth Service] Supabase client initialized using: ${which}`);
}

let supabase = null;
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Image uploads will fail.');
  // Export a lightweight stub to avoid crashing when modules `require` this file.
  supabase = {
    storage: {
      from: (/*bucket*/) => ({
        upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
        getPublicUrl: (/*path*/) => ({ data: { publicUrl: null } }),
      }),
    },
  };
} else {
  const which = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY';
  console.log(`[Auth Service] Supabase client initialized using: ${which}`);
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;

