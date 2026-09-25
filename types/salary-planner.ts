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

export type ExtractedActuals = {
  essentials?: number;
  lifestyle?: number;
  emergencyFund?: number;
  investments?: number;
};

export type BudgetAdvisorResponse = {
  message: string;
  extractedActuals?: ExtractedActuals;
  adviceSummary?: string;
};