import { getProfile } from "@/lib/profiles";
import IncomeProfilePicker from "@/components/IncomeProfilePicker";

/**
 * The income-profile editor inside the navbar's user dropdown.
 *
 * Split out of `Navbar` so the profile read happens behind a Suspense boundary
 * instead of above it. The navbar is part of the dashboard shell, so awaiting
 * a database query there held back the whole document; this one section — a
 * collapsed dropdown the user has not even opened yet — streams in instead.
 */
export default async function NavbarIncomeSettings() {
  const profile = await getProfile();

  return (
    <IncomeProfilePicker
      variant="menu"
      initialIncomeType={profile?.income_type ?? null}
      initialPayday={profile?.payday ?? null}
      initialExpectedIncome={profile?.expected_income ?? null}
    />
  );
}
