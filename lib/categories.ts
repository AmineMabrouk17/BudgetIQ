import {
  UtensilsCrossed,
  Home,
  Car,
  Zap,
  Gamepad2,
  ShoppingCart,
  Heart,
  Briefcase,
  Repeat,
  ShoppingBag,
  HelpCircle,
} from "lucide-react";
import type { ComponentType } from "react";

export type CategoryPreset = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { label: "Food & Dining", icon: UtensilsCrossed },
  { label: "Housing & Rent", icon: Home },
  { label: "Transportation", icon: Car },
  { label: "Utilities & Bills", icon: Zap },
  { label: "Entertainment & Leisure", icon: Gamepad2 },
  { label: "Groceries", icon: ShoppingCart },
  { label: "Health & Medical", icon: Heart },
  { label: "Work & Business", icon: Briefcase },
  { label: "Subscriptions", icon: Repeat },
  { label: "Shopping & Other", icon: ShoppingBag },
];

export const DEFAULT_PRESET: CategoryPreset = {
  label: "General",
  icon: HelpCircle,
};

export function canonicalizeCategory(
  category: string | null | undefined
): string {
  const trimmed = (category ?? "").trim();
  if (trimmed.length === 0) return "General";
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function titleCase(value: string): string {
  return canonicalizeCategory(value);
}

export function filterCategories(
  query: string,
  history: string[]
): string[] {
  const q = query.toLowerCase();
  const presetLabels = CATEGORY_PRESETS.map((p) => p.label);
  const allOptions = [...new Set([...presetLabels, ...history])];
  if (q.length === 0) return allOptions;
  return allOptions.filter((cat) => cat.toLowerCase().includes(q));
}
