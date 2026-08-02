import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return profile ?? null;
}
