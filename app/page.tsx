import Image from "next/image";
import { LogOut } from "lucide-react";
import { getProfile } from "@/lib/profiles";
import { signOut } from "@/app/actions/auth";

export default async function Home() {
  const profile = await getProfile();

  if (profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-md">
              {profile.avatar_url ? (
                <Image
                  className="mx-auto mb-6 h-20 w-20 rounded-full object-cover"
                  src={profile.avatar_url}
                  alt="Profile"
                  width={80}
                  height={80}
                />
              ) : (
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-content">
                  {(profile.full_name ?? profile.email).charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="text-3xl font-bold text-base-content">
                Welcome, {profile.full_name ?? "friend"}!
              </h1>
              <p className="py-2 text-base-content/70">{profile.email}</p>
              <p className="py-6 text-base-content/70">
                Your AI-powered personal finance and budget planner. Track
                income, expenses, and assets — coming soon.
              </p>
              <form action={signOut}>
                <button className="btn btn-outline">
                  <LogOut />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <Image
              src="/logo-vertical-light.png"
              alt="BudgetIQ logo"
              width={320}
              height={320}
              priority
              className="mx-auto mb-6 h-auto w-full max-w-xs"
            />
            <p className="py-6 text-base-content/70">
              Your AI-powered personal finance and budget planner. Track
              income, expenses, and assets — coming soon.
            </p>
            <a href="/login" className="btn btn-primary">
              Get Started
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
