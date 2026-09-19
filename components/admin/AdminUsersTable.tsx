import Image from "next/image";
import type { Profile, IncomeType } from "@/lib/profiles";

const INCOME_TYPE_STYLES: Record<
  IncomeType,
  { label: string; badgeClass: string }
> = {
  salaried: {
    label: "Salaried",
    badgeClass:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  hourly: {
    label: "Hourly",
    badgeClass:
      "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  freelancer: {
    label: "Freelancer",
    badgeClass:
      "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  business: {
    label: "Business",
    badgeClass:
      "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
};

const FALLBACK = "—";

function formatExpectedIncome(value: number | null): string {
  if (value === null) return FALLBACK;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminUsersTable({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="overflow-hidden rounded-box border border-base-content/10 bg-base-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-base-content/60">
              <th>User</th>
              <th>Income Type</th>
              <th>Payday</th>
              <th className="text-right">Expected Income</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const incomeStyle = profile.income_type
                ? INCOME_TYPE_STYLES[profile.income_type]
                : null;
              return (
                <tr key={profile.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="relative w-9 overflow-hidden rounded-full bg-base-200">
                          {profile.avatar_url ? (
                            <Image
                              src={profile.avatar_url}
                              alt={profile.full_name ?? profile.email}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {profile.full_name ?? FALLBACK}
                        </div>
                        <div className="text-xs text-base-content/60">
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {incomeStyle ? (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${incomeStyle.badgeClass}`}
                      >
                        {incomeStyle.label}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/40">
                        Not set up
                      </span>
                    )}
                  </td>
                  <td className="text-sm">
                    {profile.payday ?? FALLBACK}
                  </td>
                  <td className="text-right text-sm font-medium">
                    {formatExpectedIncome(profile.expected_income)}
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-base-content/40">
                  No registered users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}