interface SectionIntroProps {
  title: string;
  description: string;
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

/** Heading and supporting line shared by the landing sections. No eyebrow:
 *  the heading carries the section's weight on its own. */
export default function SectionIntro({
  title,
  description,
  titleClassName = "",
  descriptionClassName = "",
  titleMeasure = "18ch",
  descriptionMeasure = "24rem",
  size = "default",
  tone = "ink",
}: SectionIntroProps) {
  return (
    <>
      <h2
        style={{ maxWidth: titleMeasure }}
        className={`text-balance font-display ${titleSize[size]} font-bold leading-[0.99] tracking-[-0.035em] ${
          tone === "sheet" ? "text-sheet-ink" : "text-ink"
        } ${titleClassName}`}
      >
        {title}
      </h2>
      <p
        style={{ maxWidth: descriptionMeasure }}
        className={`self-end text-pretty text-[15px] leading-[1.65] ${
          tone === "sheet" ? "text-sheet-soft" : "text-ink-soft"
        } ${descriptionClassName}`}
      >
        {description}
      </p>
    </>
  );
}
