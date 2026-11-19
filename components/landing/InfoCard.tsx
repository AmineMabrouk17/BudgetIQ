import type { LucideIcon } from "lucide-react";

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  iconClassName?: string;
  descriptionClassName?: string;
}

/** The landing page's one icon + heading + description card. Features and
 *  proof use it with their own rhythm, but never rewrite the type scale. */
export default function InfoCard({
  icon: Icon,
  title,
  description,
  className = "",
  iconClassName = "",
  descriptionClassName = "",
}: InfoCardProps) {
  return (
    <article className={`group flex gap-4 ${className}`}>
      <Icon
        aria-hidden="true"
        className={`mt-0.5 h-5 w-5 shrink-0 text-signal ${iconClassName}`}
      />
      <div>
        <h3 className="font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
          {title}
        </h3>
        <p
          className={`mt-2 max-w-[42ch] text-pretty text-[15px] leading-[1.6] text-ink-soft ${descriptionClassName}`}
        >
          {description}
        </p>
      </div>
    </article>
  );
}
