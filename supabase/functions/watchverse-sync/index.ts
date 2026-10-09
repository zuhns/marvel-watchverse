import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { createHandler } from "./handler.ts";
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SECRET_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(
  createHandler(async (username, changes) => {
    const { data, error } = await admin.rpc("watchverse_sync", {
      p_username: username,
      p_changes: changes,
    });
    if (error) throw Error("Database unavailable");
    return data ?? [];
  }),
);
