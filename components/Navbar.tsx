import Image from "next/image";
import Link from "next/link";
import { LogOut, SlidersHorizontal } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles";
import { signOut } from "@/app/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import CurrencySelect from "@/components/CurrencySelect";
import IncomeProfilePicker from "@/components/IncomeProfilePicker";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default async function Navbar() {
  const user = await getUser();
  const profile = await getProfile();

  return (
    <header className="navbar sticky top-0 z-30 border-b border-base-300/50 bg-base-100/80 backdrop-blur">
      <div className="navbar-start">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 text-xl font-bold"
        >
          <Image
            src="/logo-icon-light.png"
            alt="BudgetIQ logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          BudgetIQ
        </Link>
      </div>
      <div className="navbar-end gap-2 pr-3">
        <CurrencySelect />
        <ThemeToggle />
        {user ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm flex items-center gap-2 px-2"
              aria-label="User profile menu"
            >
              <div className="avatar">
                <div className="w-7 overflow-hidden rounded-full">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile photo"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral text-xs text-neutral-content">
                      {initials(
                        user.user_metadata?.full_name ??
                          user.user_metadata?.name ??
                          "U"
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span className="hidden text-sm font-medium text-base-content/80 md:inline">
                {user.user_metadata?.full_name ?? user.user_metadata?.name}
              </span>
            </div>
            <div
              tabIndex={0}
              className="dropdown-content z-30 mt-2 w-80 rounded-box border border-base-300 bg-base-100 p-2 shadow"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-base-content">
                  {user.user_metadata?.full_name ??
                    user.user_metadata?.name ??
                    "User"}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-base-content/60">
                    {user.email}
                  </p>
                )}
              </div>

              <div className="divider my-1" />

              <div className="px-2 pt-1 pb-1">
                <div className="flex items-center gap-2 px-2 pb-1 text-xs font-semibold text-base-content/60">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  <span>Income profile</span>
                </div>
                <IncomeProfilePicker
                  variant="menu"
                  initialIncomeType={profile?.income_type ?? null}
                  initialPayday={profile?.payday ?? null}
                  initialExpectedIncome={profile?.expected_income ?? null}
                />
              </div>

              <div className="divider my-1" />

              <form action={signOut} className="px-1">
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm w-full justify-start text-error hover:bg-error/10"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
