"use client";

import { useState } from "react";

export function CouponForm({
  appliedCode,
  onApply,
  onRemove,
}: {
  appliedCode: string | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await onApply(code.trim());
      setSuccess("Coupon applied");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply coupon");
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove coupon");
    } finally {
      setPending(false);
    }
  }

  if (appliedCode) {
    return (
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between gap-3 border border-[#E7E2D9] bg-[#FAF8F3] px-3 py-2.5 text-sm">
          <span className="text-[#003F2D]">
            Coupon <strong>{appliedCode}</strong> applied
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleRemove()}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-[#687170] hover:text-[#003F2D]"
          >
            Remove
          </button>
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Coupon code"
          className="h-11 flex-1 border border-[#E7E2D9] bg-white px-3 text-sm text-[#003F2D] outline-none transition placeholder:text-[#687170] focus:border-[#B68A25]"
          disabled={pending}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="h-11 border border-[#003F2D] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003F2D] transition hover:bg-[#FAF8F3] disabled:opacity-45"
        >
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {success ? <p className="text-xs text-[#003F2D]">{success}</p> : null}
    </form>
  );
}
