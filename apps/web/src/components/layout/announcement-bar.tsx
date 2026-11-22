export function AnnouncementBar({
  text = "Discover Timeless Elegance in Every Collection",
}: {
  text?: string;
}) {
  return (
    <div className="relative z-10 border-b border-white/10 px-4 py-2">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2.5 sm:gap-3.5">
        <Sparkle className="hidden sm:block" />
        <p className="text-center text-[12px] font-medium tracking-[0.04em] text-[#FFF9EF] sm:text-[13px]">
          {text}
        </p>
        <Sparkle className="hidden sm:block" />
      </div>
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`h-3 w-3 shrink-0 text-[#D4AF37] ${className ?? ""}`}
      fill="currentColor"
    >
      <path d="M8 0.5 9.2 6.8 15.5 8 9.2 9.2 8 15.5 6.8 9.2 0.5 8 6.8 6.8 8 0.5Z" />
    </svg>
  );
}
