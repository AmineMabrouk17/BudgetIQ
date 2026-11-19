import { createAdminClient } from "@/lib/supabase/admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .order("created_at", { ascending: false });

  return data ?? [];
}
