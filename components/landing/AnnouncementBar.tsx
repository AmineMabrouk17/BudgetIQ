export default function AnnouncementBar() {
  return (
    <div className="bg-signal text-on-signal">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2.5 px-6 py-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] lg:px-10">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 shrink-0 bg-on-signal"
        />
        Free forever · Open source · No credit card required
      </p>
    </div>
  );
}
