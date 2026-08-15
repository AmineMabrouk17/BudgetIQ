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
