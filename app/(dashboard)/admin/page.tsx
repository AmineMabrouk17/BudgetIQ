import { getAllProfiles } from "@/lib/profiles";
import { verifyAdminSession, logoutAdmin } from "@/app/actions/admin";
import AdminPasswordLock from "@/components/admin/AdminPasswordLock";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { Users, UserCheck, UserX, Briefcase, LogOut } from "lucide-react";

export const revalidate = 0;

export default async function AdminPage() {
  const isAuthorized = await verifyAdminSession();

  // If not unlocked, show the password lock screen
  if (!isAuthorized) {
    return <AdminPasswordLock />;
  }

  const profiles = await getAllProfiles();

  const totalUsers = profiles.length;
  const onboardedUsers = profiles.filter((p) => p.income_type !== null).length;
  const pendingUsers = totalUsers - onboardedUsers;
  const businessOrFreelancers = profiles.filter(
    (p) => p.income_type === "business" || p.income_type === "freelancer"
  ).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      {/* Header with Lock/Logout button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-base-content">
            Platform Administration
          </h1>
          <p className="text-sm text-base-content/60">
            Overview of registered users, onboarding completion, and profile personas
          </p>
        </div>

        <form action={logoutAdmin}>
          <button
            type="submit"
            className="btn btn-outline btn-sm gap-1.5 rounded-full text-xs hover:btn-error"
          >
            <LogOut className="h-3.5 w-3.5" />
            Lock Admin
          </button>
        </form>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat rounded-box border border-base-content/10 bg-base-100 shadow-sm">
          <div className="stat-figure text-primary">
            <Users className="h-8 w-8 opacity-80" />
          </div>
          <div className="stat-title text-xs font-semibold uppercase tracking-wider">
            Total Users
          </div>
          <div className="stat-value text-3xl font-bold">{totalUsers}</div>
          <div className="stat-desc">Registered accounts</div>
        </div>

        <div className="stat rounded-box border border-base-content/10 bg-base-100 shadow-sm">
          <div className="stat-figure text-success">
            <UserCheck className="h-8 w-8 opacity-80" />
          </div>
          <div className="stat-title text-xs font-semibold uppercase tracking-wider">
            Active / Setup
          </div>
          <div className="stat-value text-3xl font-bold text-success">
            {onboardedUsers}
          </div>
          <div className="stat-desc">
            {totalUsers > 0
              ? `${Math.round((onboardedUsers / totalUsers) * 100)}% completion`
              : "0%"}
          </div>
        </div>

        <div className="stat rounded-box border border-base-content/10 bg-base-100 shadow-sm">
          <div className="stat-figure text-warning">
            <UserX className="h-8 w-8 opacity-80" />
          </div>
          <div className="stat-title text-xs font-semibold uppercase tracking-wider">
            Pending Setup
          </div>
          <div className="stat-value text-3xl font-bold">{pendingUsers}</div>
          <div className="stat-desc">Incomplete onboarding</div>
        </div>

        <div className="stat rounded-box border border-base-content/10 bg-base-100 shadow-sm">
          <div className="stat-figure text-secondary">
            <Briefcase className="h-8 w-8 opacity-80" />
          </div>
          <div className="stat-title text-xs font-semibold uppercase tracking-wider">
            Independent
          </div>
          <div className="stat-value text-3xl font-bold">
            {businessOrFreelancers}
          </div>
          <div className="stat-desc">Freelancers & Businesses</div>
        </div>
      </div>

      {/* Users Table */}
      <AdminUsersTable profiles={profiles} />
    </main>
  );
}