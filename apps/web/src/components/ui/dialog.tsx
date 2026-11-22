"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Prevent dismiss while interacting with nested controls */
  dismissOnOutsideClick?: boolean;
  /** Minimal header — eyebrow + close only; title stays for a11y */
  compactHeader?: boolean;
  eyebrow?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  dismissOnOutsideClick = true,
  compactHeader = false,
  eyebrow = "Quick view",
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-5 lg:p-8">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#003F2D]/45 backdrop-blur-[3px] transition-opacity"
        onClick={() => {
          if (dismissOnOutsideClick) close();
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative z-[81] flex max-h-[94vh] w-full flex-col overflow-hidden bg-white",
          "border border-[#E8E2D2] shadow-[0_24px_64px_rgba(0,45,33,0.18)]",
          "rounded-t-2xl sm:rounded-xl sm:max-w-5xl",
          className
        )}
        style={{ animation: "ookf-dialog-in 200ms ease-out" }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-4",
            compactHeader
              ? "absolute right-0 top-0 z-20 px-4 py-4 sm:px-5"
              : "border-b border-[#E8E2D2] px-5 py-4 sm:px-6"
          )}
        >
          {!compactHeader ? (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C6A24A]">
                {eyebrow}
              </p>
              <h2
                id={titleId}
                className="mt-1 truncate font-serif text-2xl text-[#003F2D] sm:text-3xl"
              >
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="sr-only">
                  {description}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <h2 id={titleId} className="sr-only">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="sr-only">
                  {description}
                </p>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={close}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#003F2D] transition",
              "border border-[#E8E2D2] bg-white/95 hover:border-[#D4AF37] hover:text-[#0B513B]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
