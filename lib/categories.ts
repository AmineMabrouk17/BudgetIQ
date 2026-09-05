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

const KEYWORD_MAP: { keywords: string[]; label: string }[] = [
  {
    keywords: ["uber", "lyft", "gas", "fuel", "transit", "metro", "bus", "taxi", "parking", "toll"],
    label: "Transportation",
  },
  {
    keywords: ["netflix", "spotify", "hulu", "disney", "subscription", "membership", "patreon"],
    label: "Subscriptions",
  },
  {
    keywords: ["rent", "mortgage", "apartment", "landlord", "hoa", "lease"],
    label: "Housing & Rent",
  },
  {
    keywords: ["electric", "electricity", "water", "internet", "wifi", "phone", "bill", "gas bill"],
    label: "Utilities & Bills",
  },
  {
    keywords: ["grocery", "groceries", "walmart", "costco", "trader joe", "whole foods", "aldi", "safeway"],
    label: "Groceries",
  },
  {
    keywords: ["restaurant", "food", "dining", "pizza", "burger", "coffee", "starbucks", "mcdonald", "chipotle", "doordash", "grubhub", "uber eats", "takeout", "lunch", "dinner", "breakfast"],
    label: "Food & Dining",
  },
  {
    keywords: ["movie", "cinema", "concert", "game", "steam", "psn", "xbox", "nintendo", "ticket", "show", "theater"],
    label: "Entertainment & Leisure",
  },
  {
    keywords: ["doctor", "hospital", "pharmacy", "medical", "health", "insurance", "dental", "vision", "therapy", "gym", "fitness"],
    label: "Health & Medical",
  },
  {
    keywords: ["salary", "invoice", "client", "office", "freelance", "business", "supplies", "software", "saas"],
    label: "Work & Business",
  },
  {
    keywords: ["amazon", "ebay", "shopping", "clothes", "clothing", "shoes", "target", "store", "purchase"],
    label: "Shopping & Other",
  },
];

export function suggestCategory(title: string): string | null {
  const lower = title.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return entry.label;
      }
    }
  }
  return null;
}
