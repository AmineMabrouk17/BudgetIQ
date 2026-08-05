import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      {children}
    </div>
  );
}
