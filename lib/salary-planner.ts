import { BudgetTargets } from "@/types/salary-planner";

export function computeBudgetTargets(salary: number, hasDependents: boolean): BudgetTargets {
  const safeSalary = Math.max(0, salary);
  const maxEssentials = safeSalary * 0.6;
  const maxLifestyle = safeSalary * 0.2;

  // Emergency fund target based on essentials (3-6 months, or 12 months for breadwinners)
  const targetEmergencyFundMin = maxEssentials * 3;
  const targetEmergencyFundMax = hasDependents ? maxEssentials * 12 : maxEssentials * 6;

  const targetInvestmentMin = safeSalary * 0.1;
  const targetInvestmentIdeal = safeSalary * 0.2;

  return {
    salary: safeSalary,
    hasDependents,
    maxEssentials,
    maxLifestyle,
    targetEmergencyFundMin,
    targetEmergencyFundMax,
    targetInvestmentMin,
    targetInvestmentIdeal,
  };
}