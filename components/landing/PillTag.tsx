import type { LucideIcon } from "lucide-react";

interface PillTagProps {
  icon: LucideIcon;
  label: string;
}

export default function PillTag({ icon: Icon, label }: PillTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-soft">
      <Icon className="h-3.5 w-3.5 text-clay" aria-hidden="true" />
      {label}
    </span>
  );
}
