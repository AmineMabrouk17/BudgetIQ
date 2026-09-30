import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getProfile, isOnboardedFromSession, needsOnboarding } from "@/lib/profiles";
import { isAdminSession } from "@/lib/auth/admin-session";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  if (!user) redirect("/login");

  // The onboarding gate normally reads the flag out of the verified access
  // token the user is already carrying, which costs no round-trip. Only a
  // token issued before the flag existed (see migration 0009) has to fall back
  // to the profile row.
  const onboarded = isOnboardedFromSession(user);
  const [profile, isAdmin] = await Promise.all([
    onboarded ? Promise.resolve(null) : getProfile(),
    isAdminSession(),
  ]);

  if (!onboarded && needsOnboarding(profile)) redirect("/onboarding");

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-base-200">
        <DashboardSidebar isAdmin={isAdmin} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
