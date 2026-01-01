import { supabase } from "./supabase";

export async function uploadAvatar({ userId, file }) {
  if (!userId) throw new Error("no_user");
  if (!file) throw new Error("no_file");
  if (!file.type.startsWith("image/")) throw new Error("not_image");

  const bucket = import.meta.env.VITE_SUPABASE_AVATAR_BUCKET || "avatars";
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadErr) {
    throw new Error(uploadErr.message || "upload_failed");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl || "";
  if (!publicUrl) throw new Error("no_public_url");

  return publicUrl;
}
