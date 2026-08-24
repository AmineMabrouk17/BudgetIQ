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
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[13px] uppercase tracking-[0.01em] text-muted">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-display font-semibold tracking-[-0.02em] text-white/90 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 leading-[1.6] text-muted">{description}</p>
      ) : null}
    </div>
  );
}
