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

  const profile = await getProfile();
  if (needsOnboarding(profile)) redirect("/onboarding");

  const isAdmin = await verifyAdminSession();

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