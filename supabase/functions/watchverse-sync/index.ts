import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { createHandler, PublicError } from "./handler.ts";
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SECRET_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
function databaseError(message: string) {
  const errors: Record<string, string> = {
    "Profile not found":
      "Profilo non trovato: la persona deve prima salvare il proprio nome sul sito.",
    "Choose another profile": "Scegli il nome di un’altra persona.",
    "Friend not found": "Aggiungi prima questa persona alla lista amici.",
    "Invitation not found": "Questo invito non è più disponibile.",
    "Marathon access denied":
      "Non partecipi ancora a questa maratona. Accetta prima l’invito.",
  };
  if (errors[message]) throw new PublicError(errors[message]);
  throw Error("Database unavailable");
}
Deno.serve(
  createHandler(
    async (username, changes, marathonId) => {
      const { data, error } = await admin.rpc(
        marathonId ? "watchverse_marathon_sync" : "watchverse_sync",
        {
          p_username: username,
          p_changes: changes,
          ...(marathonId ? { p_marathon: marathonId } : {}),
        },
      );
      if (error) databaseError(error.message);
      return data ?? [];
    },
    undefined,
    async (username, command) => {
      const { data, error } = await admin.rpc("watchverse_social", {
        p_username: username,
        p_action: command.action,
        p_target: command.friend ?? null,
        p_name: command.name ?? null,
        p_marathon: command.marathonId ?? null,
      });
      if (error) databaseError(error.message);
      return data;
    },
  ),
);
