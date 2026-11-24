"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxImage = {
  url: string;
  alt?: string;
};

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.5;
const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type ProductImageLightboxProps = {
  open: boolean;
  onClose: () => void;
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  productName: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ProductImageLightbox({
  open,
  onClose,
  images,
  index,
  onIndexChange,
  productName,
  returnFocusRef,
}: ProductImageLightboxProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ pointer: Point; offset: Point } | null>(null);
  const pinchOrigin = useRef<{ distance: number; scale: number } | null>(null);
  const swipeOrigin = useRef<Point | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  indexRef.current = index;

  const multi = images.length > 1;
  const current = images[index] ?? null;
  const isBroken = current ? Boolean(broken[current.url]) : true;

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    dragOrigin.current = null;
    pinchOrigin.current = null;
  }, []);

  useEffect(() => {
    resetZoom();
  }, [index, resetZoom]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const returnFocusNode = returnFocusRef?.current ?? previouslyFocused;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      const total = images.length;
      const currentIndex = indexRef.current;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" && total > 1) {
        event.preventDefault();
        onIndexChange((currentIndex + 1) % total);
      }
      if (event.key === "ArrowLeft" && total > 1) {
        event.preventDefault();
        onIndexChange((currentIndex - 1 + total) % total);
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setScale((value) => clamp(value + ZOOM_STEP, MIN_SCALE, MAX_SCALE));
      }
      if (event.key === "-") {
        event.preventDefault();
        setScale((value) => {
          const next = clamp(value - ZOOM_STEP, MIN_SCALE, MAX_SCALE);
          if (next === 1) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
      if (event.key === "0") {
        event.preventDefault();
        resetZoom();
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
      returnFocusNode?.focus?.();
    };
  }, [open, onClose, onIndexChange, images.length, resetZoom, returnFocusRef]);

  useEffect(() => {
    if (!open || images.length < 2) return;
    const urls = [
      images[(index + 1) % images.length]?.url,
      images[(index - 1 + images.length) % images.length]?.url,
    ].filter(Boolean) as string[];
    for (const url of urls) {
      const preload = new window.Image();
      preload.src = url;
    }
  }, [open, index, images]);

  // Non-passive wheel listener so zoom can prevent page scroll.
  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;
    function onWheelNative(event: WheelEvent) {
      event.preventDefault();
      const target = stageRef.current;
      if (!target) return;
      const delta = event.deltaY > 0 ? -0.15 : 0.15;
      setScale((value) => {
        const next = clamp(value + delta, MIN_SCALE, MAX_SCALE);
        setOffset((current) => {
          if (next <= 1) return { x: 0, y: 0 };
          const rect = target.getBoundingClientRect();
          const maxX = (rect.width * (next - 1)) / 2;
          const maxY = (rect.height * (next - 1)) / 2;
          return {
            x: clamp(current.x, -maxX, maxX),
            y: clamp(current.y, -maxY, maxY),
          };
        });
        return next;
      });
    }
    stage.addEventListener("wheel", onWheelNative, { passive: false });
    return () => stage.removeEventListener("wheel", onWheelNative);
  }, [open, index]);

  function clampOffset(next: Point, nextScale: number): Point {
    const stage = stageRef.current;
    if (!stage || nextScale <= 1) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    const maxX = (rect.width * (nextScale - 1)) / 2;
    const maxY = (rect.height * (nextScale - 1)) / 2;
    return {
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    };
  }

  function setScaleClamped(nextScale: number) {
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    setScale(clamped);
    setOffset((current) => clampOffset(current, clamped));
    if (clamped === 1) setOffset({ x: 0, y: 0 });
  }

  function go(delta: number) {
    if (!multi) return;
    onIndexChange((index + delta + images.length) % images.length);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (scale <= 1) {
      swipeOrigin.current = { x: event.clientX, y: event.clientY };
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragOrigin.current = {
      pointer: { x: event.clientX, y: event.clientY },
      offset: { ...offset },
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (scale > 1 && dragOrigin.current) {
      const dx = event.clientX - dragOrigin.current.pointer.x;
      const dy = event.clientY - dragOrigin.current.pointer.y;
      setOffset(
        clampOffset(
          {
            x: dragOrigin.current.offset.x + dx,
            y: dragOrigin.current.offset.y + dy,
          },
          scale
        )
      );
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (scale <= 1 && swipeOrigin.current && multi) {
      const dx = event.clientX - swipeOrigin.current.x;
      if (Math.abs(dx) > 56) go(dx < 0 ? 1 : -1);
    }
    swipeOrigin.current = null;
    dragOrigin.current = null;
    setDragging(false);
  }

  function onDoubleClick() {
    if (scale > 1) resetZoom();
    else setScaleClamped(2);
  }

  function onTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchOrigin.current = { distance, scale };
      swipeOrigin.current = null;
      return;
    }
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (scale <= 1) {
        swipeOrigin.current = { x: touch.clientX, y: touch.clientY };
      } else {
        dragOrigin.current = {
          pointer: { x: touch.clientX, y: touch.clientY },
          offset: { ...offset },
        };
        setDragging(true);
      }
    }
  }

  function onTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2 && pinchOrigin.current) {
      event.preventDefault();
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = distance / Math.max(1, pinchOrigin.current.distance);
      setScaleClamped(pinchOrigin.current.scale * ratio);
      return;
    }
    if (event.touches.length === 1 && scale > 1 && dragOrigin.current) {
      event.preventDefault();
      const touch = event.touches[0];
      const dx = touch.clientX - dragOrigin.current.pointer.x;
      const dy = touch.clientY - dragOrigin.current.pointer.y;
      setOffset(
        clampOffset(
          {
            x: dragOrigin.current.offset.x + dx,
            y: dragOrigin.current.offset.y + dy,
          },
          scale
        )
      );
    }
  }

  function onTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) pinchOrigin.current = null;
    if (event.touches.length === 0) {
      if (scale <= 1 && swipeOrigin.current && multi && event.changedTouches[0]) {
        const dx = event.changedTouches[0].clientX - swipeOrigin.current.x;
        if (Math.abs(dx) > 56) go(dx < 0 ? 1 : -1);
      }
      swipeOrigin.current = null;
      dragOrigin.current = null;
      setDragging(false);
    }
  }

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex flex-col bg-[#1A1F1C]/88"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          onClick={onClose}
        >
          <h2 id={titleId} className="sr-only">
            {productName} image viewer
          </h2>

          <div
            className="relative flex min-h-0 flex-1 flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <p className="text-[12px] tabular-nums tracking-[0.08em] text-white/80">
                {index + 1} / {images.length}
              </p>
              <div className="flex items-center gap-1.5">
                <ControlButton
                  label="Zoom out"
                  onClick={() => setScaleClamped(scale - ZOOM_STEP)}
                  disabled={scale <= MIN_SCALE}
                >
                  <Minus className="h-4 w-4" strokeWidth={1.6} />
                </ControlButton>
                <ControlButton
                  label="Zoom in"
                  onClick={() => setScaleClamped(scale + ZOOM_STEP)}
                  disabled={scale >= MAX_SCALE}
                >
                  <Plus className="h-4 w-4" strokeWidth={1.6} />
                </ControlButton>
                <ControlButton
                  label="Reset zoom"
                  onClick={resetZoom}
                  disabled={scale === 1 && offset.x === 0 && offset.y === 0}
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.6} />
                </ControlButton>
                <ControlButton label="Close image viewer" onClick={onClose}>
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </ControlButton>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              {multi ? (
                <>
                  <NavArrow
                    direction="prev"
                    onClick={() => go(-1)}
                    className="absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-4"
                  />
                  <NavArrow
                    direction="next"
                    onClick={() => go(1)}
                    className="absolute right-2 top-1/2 z-20 -translate-y-1/2 sm:right-4"
                  />
                </>
              ) : null}

              <div
                ref={stageRef}
                className={cn(
                  "absolute inset-0 touch-none overflow-hidden",
                  scale > 1
                    ? dragging
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-zoom-in"
                )}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={onDoubleClick}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <motion.div
                  key={current.url}
                  className="absolute inset-0 flex items-center justify-center p-4 sm:p-8"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                >
                  <div
                    className="relative h-full w-full max-w-5xl will-change-transform"
                    style={{
                      transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                      transition:
                        dragging || pinchOrigin.current
                          ? "none"
                          : reduceMotion
                            ? "none"
                            : "transform 180ms ease-out",
                    }}
                  >
                    {!isBroken ? (
                      <Image
                        src={current.url}
                        alt={current.alt || productName}
                        fill
                        sizes="100vw"
                        quality={90}
                        priority
                        className="object-contain"
                        draggable={false}
                        onError={() =>
                          setBroken((prev) => ({
                            ...prev,
                            [current.url]: true,
                          }))
                        }
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.16em] text-white/60">
                        Image unavailable
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {multi ? (
              <div className="relative z-20 flex justify-center gap-2 overflow-x-auto px-4 py-4 sm:px-6">
                {images.map((image, i) => {
                  const selected = i === index;
                  return (
                    <button
                      key={`${image.url}-${i}`}
                      type="button"
                      aria-label={`View image ${i + 1}`}
                      aria-current={selected ? "true" : undefined}
                      onClick={() => onIndexChange(i)}
                      className={cn(
                        "relative h-14 w-11 shrink-0 overflow-hidden border transition duration-200 sm:h-16 sm:w-12",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
                        selected
                          ? "border-[#C49A36]"
                          : "border-white/25 hover:border-white/60"
                      )}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="48px"
                        quality={65}
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center border border-white/20 bg-white/10 text-white transition",
        "hover:border-white/40 hover:bg-white/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
        "disabled:cursor-not-allowed disabled:opacity-35"
      )}
    >
      {children}
    </button>
  );
}

function NavArrow({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center border border-white/20 bg-white/10 text-white transition",
        "hover:border-white/40 hover:bg-white/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
        className
      )}
    >
      {direction === "prev" ? (
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      ) : (
        <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
      )}
    </button>
  );
}
