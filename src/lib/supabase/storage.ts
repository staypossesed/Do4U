import { createClient } from "@/lib/supabase/client";

const BUCKET = "listing-images";

export async function uploadListingPhoto(
  file: Blob,
  userId: string,
  listingId: string,
  index: number
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${listingId}/${index}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

export async function deleteListingPhoto(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
