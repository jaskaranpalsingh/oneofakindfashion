"use client";

export function EmptyCart({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex h-full min-h-[260px] flex-col justify-center px-1 py-10">
      <p className="font-serif text-[1.65rem] leading-snug text-[#003F2D]">
        Your bag is empty
      </p>
      <p className="mt-3 max-w-[18rem] text-[14px] leading-relaxed text-[#6B726E]">
        Save pieces you love, then return here when you&apos;re ready to check
        out.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-8 w-fit text-[12px] font-medium uppercase tracking-[0.14em] text-[#003F2D] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
      >
        Continue shopping
      </button>
    </div>
  );
}
