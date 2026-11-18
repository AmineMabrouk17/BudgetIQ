import Reveal from "@/components/landing/Reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <Reveal variant="up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <h2 className="max-w-2xl text-balance font-display text-[length:clamp(1.9rem,3.4vw,2.5rem)] font-normal leading-[1.12] tracking-[-0.02em] text-ink">
          {title}
        </h2>
        <div className="hidden shrink-0 items-center gap-3 pb-1.5 sm:flex">
          <span aria-hidden="true" className="h-px w-6 bg-rule-strong" />
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
            {eyebrow}
          </p>
        </div>
      </div>
      {description ? (
        <p className="mt-4 max-w-xl text-pretty leading-[1.65] text-ink-soft">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
