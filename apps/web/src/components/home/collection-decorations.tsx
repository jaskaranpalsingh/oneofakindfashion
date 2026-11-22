"use client";

function CornerFloral({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M20 120C28 88 52 62 84 48C70 70 62 96 66 120"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <path
        d="M48 118C54 90 74 68 102 56C90 76 84 98 88 118"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path
        d="M84 48C104 36 128 34 152 42"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path
        d="M96 70C112 58 132 54 150 58"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      <circle cx="84" cy="48" r="3.5" stroke="currentColor" strokeWidth="0.8" />
      <path
        d="M78 42C80 34 88 30 94 34C90 40 84 42 78 42Z"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      <path
        d="M86 40C94 34 104 36 108 44C100 46 92 44 86 40Z"
        stroke="currentColor"
        strokeWidth="0.7"
      />
    </svg>
  );
}

export function CollectionDecorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_40%)]" />
      <CornerFloral className="absolute left-2 top-4 h-24 w-32 text-[#D4AF37]/25 sm:left-6 sm:top-6 sm:h-32 sm:w-40" />
      <CornerFloral className="absolute right-2 top-4 h-24 w-32 -scale-x-100 text-[#D4AF37]/25 sm:right-6 sm:top-6 sm:h-32 sm:w-40" />
    </div>
  );
}
