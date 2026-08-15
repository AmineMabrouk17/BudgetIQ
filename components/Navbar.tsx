import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import CurrencySelect from "@/components/CurrencySelect";

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

  return (
    <header className="navbar sticky top-0 z-30 border-b border-base-300/50 bg-base-100/80 backdrop-blur">
      <div className="navbar-start">
        <Link href="/" className="flex items-center gap-2 px-4 text-xl font-bold">
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
      <div className="navbar-end gap-1 pr-3">
        <CurrencySelect />
        <ThemeToggle />
        {user ? (
          <>
            <div className="avatar placeholder">
              <div className="w-8 rounded-full bg-neutral text-sm text-neutral-content">
                {initials(user.user_metadata?.full_name ?? user.email ?? "U")}
              </div>
            </div>
            <span className="hidden text-sm text-base-content/70 md:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <button className="btn btn-ghost btn-sm" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
