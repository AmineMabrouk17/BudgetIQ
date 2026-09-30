import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getProfile, needsOnboarding } from "@/lib/profiles";
import { verifyAdminSession } from "@/app/actions/admin";
import Navbar from "@/components/Navbar";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  if (!user) redirect("/login");

  // Both checks are independent — the profile query needs the (now memoised)
  // session, and the admin check reads a cookie directly. Awaiting them one
  // after another put a second round-trip between the shell and the page.
  const [profile, isAdmin] = await Promise.all([
    getProfile(),
    verifyAdminSession(),
  ]);

  if (needsOnboarding(profile)) redirect("/onboarding");

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