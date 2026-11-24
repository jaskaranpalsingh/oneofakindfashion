"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import {
  ProductImageLightbox,
  type LightboxImage,
} from "@/components/commerce/product-image-lightbox";
import { cn } from "@/lib/utils";

export type GalleryImage = LightboxImage;

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
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!activeVariantImageUrl) return;
    const match = gallery.findIndex(
      (image) => image.url === activeVariantImageUrl
    );
    if (match >= 0) setIndex(match);
  }, [activeVariantImageUrl, gallery]);

  useEffect(() => {
    setIndex((current) => {
      if (gallery.length === 0) return 0;
      return Math.min(current, gallery.length - 1);
    });
  }, [gallery]);

  const current = gallery[index] ?? null;

  const goTo = useCallback(
    (next: number) => {
      if (gallery.length === 0) return;
      setIndex((next + gallery.length) % gallery.length);
    },
    [gallery.length]
  );

  function openZoom() {
    if (!current || broken[current.url]) return;
    setZoomOpen(true);
  }

  function onGalleryKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openZoom();
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
          gallery.length > 1
            ? "grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:gap-4"
            : "grid grid-cols-1",
          className
        )}
        tabIndex={0}
        onKeyDown={onGalleryKeyDown}
      >
        {gallery.length > 1 ? (
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
                key={`${image.url}-${i}`}
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
                    quality={70}
                    loading="lazy"
                    className="object-cover"
                    onError={() =>
                      setBroken((prev) => ({ ...prev, [image.url]: true }))
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
        ) : null}

        <div className="relative max-md:order-1 max-md:col-span-2">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#EFE8DC]"
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (gallery.length < 2 || touchStartX.current === null) return;
              const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
              const delta = endX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) < 48) return;
              goTo(delta < 0 ? index + 1 : index - 1);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current?.url ?? "empty"}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {current && !isBroken ? (
                  <button
                    type="button"
                    onClick={openZoom}
                    className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#003F2D]"
                    aria-label={`Enlarge image of ${productName}`}
                  >
                    <Image
                      src={current.url}
                      alt={current.alt || productName}
                      fill
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      quality={85}
                      sizes="(max-width: 768px) 100vw, 47vw"
                      className="object-cover object-center"
                      onError={() =>
                        setBroken((prev) => ({
                          ...prev,
                          [current.url]: true,
                        }))
                      }
                    />
                  </button>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.18em] text-[#656B68]">
                    Image unavailable
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => goTo(index - 1)}
                  className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-[#E5E1D9] bg-white/95 text-[#003F2D] transition hover:border-[#003F2D] md:inline-flex"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => goTo(index + 1)}
                  className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-[#E5E1D9] bg-white/95 text-[#003F2D] transition hover:border-[#003F2D] md:inline-flex"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <p className="absolute left-3 top-3 z-10 rounded-sm bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#003F2D] md:hidden">
                  {index + 1} / {gallery.length}
                </p>
              </>
            ) : null}

            {current && !isBroken ? (
              <button
                ref={zoomButtonRef}
                type="button"
                onClick={openZoom}
                title="Click to enlarge"
                className={cn(
                  "group absolute bottom-3 right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-sm",
                  "border border-[#E5E1D9] bg-white/95 text-[#003F2D] transition duration-200",
                  "hover:border-[#003F2D] hover:bg-white",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003F2D]"
                )}
                aria-label="Open fullscreen product image viewer"
              >
                <ZoomIn
                  className="h-4 w-4 transition group-hover:scale-110"
                  strokeWidth={1.75}
                />
                <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-sm bg-[#003F2D] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white opacity-0 transition duration-200 group-hover:opacity-100 md:block">
                  Click to enlarge
                </span>
              </button>
            ) : null}
          </motion.div>
        </div>
      </div>

      <ProductImageLightbox
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        images={gallery}
        index={index}
        onIndexChange={setIndex}
        productName={productName}
        returnFocusRef={zoomButtonRef}
      />
    </>
  );
}
