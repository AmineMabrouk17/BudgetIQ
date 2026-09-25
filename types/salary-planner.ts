export type PlannerChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
};

export type SalaryPlan = {
  id?: string;
  user_id?: string;
  monthly_salary: number;
  has_dependents: boolean;
  actual_essentials: number;
  actual_lifestyle: number;
  actual_emergency_fund: number;
  actual_investments: number;
  chat_messages: PlannerChatMessage[];
  ai_advice?: string | null;
};

export type BudgetTargets = {
  salary: number;
  hasDependents: boolean;
  maxEssentials: number; // 60%
  maxLifestyle: number; // 20%
  targetEmergencyFundMin: number; // 3 months of essentials
  targetEmergencyFundMax: number; // 6 or 12 months of essentials
  targetInvestmentMin: number; // 10%
  targetInvestmentIdeal: number; // 20%+
};

export const ADVISOR_BUCKETS = [
  "essentials",
  "lifestyle",
  "emergencyFund",
  "investments",
] as const;

export type AdvisorBucket = (typeof ADVISOR_BUCKETS)[number];

export type AdvisorLineItem = {
  label: string;
  amount: number;
  bucket: AdvisorBucket;
};

export type BucketActuals = Record<AdvisorBucket, number>;

export type BudgetAdvisorResponse = {
  message: string;
  adviceSummary?: string;
  monthlySalary?: number;
  lineItems?: AdvisorLineItem[];
  replaceActuals?: boolean;
};