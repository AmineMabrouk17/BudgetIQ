export default function AnnouncementBar() {
  return (
    <div className="border-b border-rule bg-surface-2">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-clay"
        />
        Free forever · Open source · No credit card required
      </p>
    </div>
  );
}
