import { createClient } from "@supabase/supabase-js";

// Supabase Storage — free tier, no credit card required to sign up.
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Returns a short-lived signed upload URL + token the browser can use to
// upload the file directly (keeps large photo/video uploads off your server).
export async function getUploadUrl(key) {
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .createSignedUploadUrl(key);
  if (error) throw error;
  return data; // { signedUrl, token, path }
}

// Public URL for a stored file, once uploaded (bucket must be set to public).
export function getPublicUrl(key) {
  const { data } = supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}
