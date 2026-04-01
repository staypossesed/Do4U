"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensurePublicUserRow } from "@/lib/ensure-user-profile";

export async function updateSellerLocation(input: {
  countryCode: string;
  city: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, message: "Not authenticated" };
  }

  const ensured = await ensurePublicUserRow(supabase, user);
  if (!ensured.ok) {
    return { ok: false, message: ensured.message };
  }

  const code = input.countryCode.trim().toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(code)) {
    return { ok: false, message: "Invalid country code" };
  }

  const city = input.city.trim().slice(0, 200) || null;

  const { data, error } = await supabase
    .from("users")
    .update({
      country_code: code,
      city,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return {
      ok: false,
      message:
        "Update affected no rows. Ensure migration 004 (country_code, city on public.users) is applied in Supabase.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/sell/new");
  return { ok: true };
}
