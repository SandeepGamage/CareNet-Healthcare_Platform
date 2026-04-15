const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[patient-service] Supabase URL or key is missing. Report uploads will fail.");
  module.exports = null;
  return;
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
