import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabaseClient = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    detectSessionInUrl: true,
  },
});
