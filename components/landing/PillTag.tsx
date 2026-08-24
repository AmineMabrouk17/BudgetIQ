interface PillTagProps {
  emoji: string;
  label: string;
  colorClass: string;
  rotationDeg: number;
  popDelay?: number;
  className?: string;
}

export default function PillTag({
  emoji,
  label,
  colorClass,
  rotationDeg,
  popDelay = 700,
  className,
}: PillTagProps) {
  return (
    <span
      className={`bi-float ${className ?? ""}`}
      style={{ animationDelay: `${popDelay + 600}ms` }}
    >
      <span
        className="bi-pop block"
        style={{ animationDelay: `${popDelay}ms` }}
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#010D1F] shadow-lg ${colorClass}`}
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.15), 0 16px 32px -12px rgba(0,0,0,0.55)",
          }}
        >
          <span aria-hidden="true">{emoji}</span>
          {label}
        </span>
      </span>
    </span>
  );
}
