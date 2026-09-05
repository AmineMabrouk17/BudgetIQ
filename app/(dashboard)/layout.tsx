import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getProfile, needsOnboarding } from "@/lib/profiles";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (needsOnboarding(profile)) redirect("/onboarding");

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-base-200">{children}</div>
    </>
  );
}
