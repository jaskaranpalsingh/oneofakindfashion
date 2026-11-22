"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  url: string;
  alt?: string;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  productName: string;
  activeVariantImageUrl?: string | null;
  className?: string;
};

function dedupeImages(images: GalleryImage[]): GalleryImage[] {
  const seen = new Set<string>();
  const result: GalleryImage[] = [];
  for (const image of images) {
    if (!image.url || seen.has(image.url)) continue;
    seen.add(image.url);
    result.push(image);
  }
  return result;
}

export function ProductGallery({
  images,
  productName,
  activeVariantImageUrl,
  className,
}: ProductGalleryProps) {
  const reduceMotion = useReducedMotion();
  const gallery = useMemo(() => dedupeImages(images), [images]);
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (!activeVariantImageUrl) return;
    const match = gallery.findIndex((image) => image.url === activeVariantImageUrl);
    if (match >= 0) setIndex(match);
  }, [activeVariantImageUrl, gallery]);

  useEffect(() => {
    setIndex((current) => {
      if (gallery.length === 0) return 0;
      return Math.min(current, gallery.length - 1);
    });
  }, [gallery.length]);

  const current = gallery[index] ?? null;

  const goTo = useCallback(
    (next: number) => {
      if (gallery.length === 0) return;
      const wrapped = (next + gallery.length) % gallery.length;
      setIndex(wrapped);
    },
    [gallery.length]
  );

  useEffect(() => {
    if (!zoomOpen) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setZoomOpen(false);
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, goTo, index]);

  function onGalleryKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  if (gallery.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[3/4] items-center justify-center rounded-sm bg-[#EFE8DC] text-center text-xs uppercase tracking-[0.18em] text-[#656B68]",
          className
        )}
      >
        Product photography coming soon
      </div>
    );
  }

  const isBroken = current ? broken[current.url] : true;

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:gap-4",
          className
        )}
        tabIndex={0}
        onKeyDown={onGalleryKeyDown}
      >
        {/* Vertical thumbnails — horizontal scroll on mobile */}
        <div
          className={cn(
            "flex max-h-[min(72vh,720px)] flex-col gap-2.5 overflow-y-auto pr-0.5",
            "max-md:order-2 max-md:col-span-2 max-md:max-h-none max-md:flex-row max-md:overflow-x-auto max-md:overflow-y-hidden max-md:pb-1"
          )}
          role="listbox"
          aria-label="Product images"
        >
          {gallery.map((image, i) => {
            const selected = i === index;
            const thumbBroken = broken[image.url];
            return (
              <button
                key={image.url}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`View image ${i + 1} of ${gallery.length}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-[88px] w-[72px] shrink-0 overflow-hidden rounded-sm border bg-[#FAF8F3] transition duration-300",
                  "sm:h-[96px] sm:w-[80px] lg:h-[100px] lg:w-[84px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D] focus-visible:ring-offset-2",
                  selected
                    ? "border-[#003F2D]"
                    : "border-transparent hover:border-[#003F2D]/40"
                )}
              >
                {thumbBroken ? (
                  <span className="flex h-full items-center justify-center text-[9px] text-[#656B68]">
                    —
                  </span>
                ) : (
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="100px"
                    className="object-cover"
                    unoptimized={image.url.startsWith("/")}
                    onError={() =>
                      setBroken((prev) => ({ ...prev, [image.url]: true }))
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Main image */}
        <div className="relative max-md:order-1 max-md:col-span-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#EFE8DC]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current?.url ?? "empty"}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {current && !isBroken ? (
                  <Image
                    src={current.url}
                    alt={current.alt || productName}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 47vw"
                    className="object-cover object-center"
                    unoptimized={current.url.startsWith("/")}
                    onError={() =>
                      setBroken((prev) => ({
                        ...prev,
                        [current.url]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.18em] text-[#656B68]">
                    Image unavailable
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {current && !isBroken ? (
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#E5E1D9] bg-white/95 text-[#003F2D] transition hover:border-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D]"
                aria-label="Zoom product image"
              >
                <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </motion.div>
        </div>
      </div>

      {zoomOpen && current && !isBroken ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Zoomed view of ${productName}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#252A27]/70 p-4 backdrop-blur-[2px]"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            aria-label="Close zoom"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-white text-[#003F2D]"
            onClick={() => setZoomOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[min(90vh,900px)] w-[min(90vw,640px)] overflow-hidden rounded-sm bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={current.url}
              alt={current.alt || productName}
              fill
              sizes="90vw"
              className="object-contain"
              unoptimized={current.url.startsWith("/")}
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
