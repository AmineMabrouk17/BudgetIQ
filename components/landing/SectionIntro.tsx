interface SectionIntroProps {
  title: string;
  description: string;
  eyebrow?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  titleMeasure?: string;
  descriptionMeasure?: string;
  size?: "default" | "medium" | "compact";
  tone?: "ink" | "sheet";
}

const titleSize: Record<NonNullable<SectionIntroProps["size"]>, string> = {
  default: "text-[length:clamp(2.2rem,4.6vw,3.6rem)]",
  medium: "text-[length:clamp(2.2rem,4.4vw,3.4rem)]",
  compact: "text-[length:clamp(2.2rem,4.2vw,3.2rem)]",
};

const toneClass = {
  ink: {
    rule: "bg-rule-strong",
    eyebrow: "text-ink-mute",
    title: "text-ink",
    description: "text-ink-soft",
  },
  sheet: {
    rule: "bg-sheet-rule",
    eyebrow: "text-sheet-soft",
    title: "text-sheet-ink",
    description: "text-sheet-soft",
  },
} as const;

/** Heading and supporting line shared by the landing sections. The eyebrow is
 *  the quiet section label the page has always carried; it steps aside on
 *  phones so the heading keeps the width. */
export default function SectionIntro({
  title,
  description,
  eyebrow,
  titleClassName = "",
  descriptionClassName = "",
  titleMeasure = "18ch",
  descriptionMeasure = "24rem",
  size = "default",
  tone = "ink",
}: SectionIntroProps) {
  const toneStyles = toneClass[tone];

  return (
    <>
      <div className={titleClassName}>
        {eyebrow ? (
          <div className="mb-4 flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`h-px w-6 ${toneStyles.rule}`}
            />
            <p
              className={`text-[11px] font-medium uppercase tracking-[0.18em] ${toneStyles.eyebrow}`}
            >
              {eyebrow}
            </p>
          </div>
        ) : null}
        <h2
          style={{ maxWidth: titleMeasure }}
          className={`text-balance font-display ${titleSize[size]} font-bold leading-[0.99] tracking-[-0.035em] ${toneStyles.title}`}
        >
          {title}
        </h2>
      </div>
      <p
        style={{ maxWidth: descriptionMeasure }}
        className={`self-end text-pretty text-[15px] leading-[1.65] ${toneStyles.description} ${descriptionClassName}`}
      >
        {description}
      </p>
    </>
  );
}
