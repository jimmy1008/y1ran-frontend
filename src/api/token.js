import { supabase } from "../lib/supabase";

export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session?.access_token ?? null;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
