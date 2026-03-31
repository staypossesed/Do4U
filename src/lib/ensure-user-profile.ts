import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Ensures a row exists in public.users for the auth user (FK targets for listings, chats, etc.).
 * Handles accounts created before the auth trigger or when the trigger failed.
 */
export async function ensurePublicUserRow(
  supabase: SupabaseClient,
  user: User,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: row } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
  if (row) return { ok: true };

  const { error } = await supabase.from("users").insert({
    id: user.id,
    email: user.email ?? "",
    name:
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      null,
    avatar_url:
      typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
  });

  if (error) {
    if (error.code === "23505") return { ok: true };
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
