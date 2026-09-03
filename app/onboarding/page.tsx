import { redirect } from "next/navigation";
import Image from "next/image";
import { getProfile, needsOnboarding } from "@/lib/profiles";
import IncomeProfilePicker from "@/components/IncomeProfilePicker";

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!needsOnboarding(profile)) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-200 p-6">
      <div className="flex items-center gap-2">
        <Image
          src="/logo-icon-light.png"
          alt="BudgetIQ logo"
          width={40}
          height={40}
          className="h-10 w-10 rounded-lg"
        />
        <span className="text-2xl font-bold text-base-content">BudgetIQ</span>
      </div>
      <section className="w-full max-w-2xl rounded-box bg-base-100 p-6 shadow">
        <h1 className="mb-1 text-2xl font-bold text-base-content">
          Tell us about your income
        </h1>
        <p className="mb-6 text-sm text-base-content/60">
          Pick the type that best matches how you earn. You can change it later
          from the dashboard.
        </p>
        <IncomeProfilePicker variant="step" />
      </section>
    </main>
  );
}