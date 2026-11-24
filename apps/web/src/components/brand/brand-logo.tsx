import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "header" | "login";
  priority?: boolean;
  /** Use solid logo (green oval) for light backgrounds where gold-on-black is hard to see. */
  variant?: "transparent" | "solid";
};

const SIZE_CLASS = {
  sm: "h-10 w-10",
  md: "h-12 w-12 sm:h-14 sm:w-14",
  lg: "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]",
  header: "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16",
  login: "h-28 w-28 sm:h-32 sm:w-32",
} as const;

/** Match displayed CSS size so next/image does not ship the full 819px master. */
const SIZE_PX = {
  sm: 40,
  md: 56,
  lg: 72,
  header: 64,
  login: 128,
} as const;

const SRC = {
  transparent: "/brand/one-of-a-kind-fashion-logo-transparent.png",
  solid: "/brand/one-of-a-kind-fashion-logo.png",
} as const;

export function BrandLogo({
  href = "/",
  className,
  size = "md",
  priority = false,
  variant = "transparent",
}: BrandLogoProps) {
  const px = SIZE_PX[size];
  const image = (
    <Image
      src={SRC[variant]}
      alt="ONE OF A KIND FASHION"
      width={px}
      height={px}
      sizes={`${px}px`}
      quality={90}
      priority={priority}
      className="h-full w-full object-contain object-center"
    />
  );

  const frame = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        SIZE_CLASS[size],
        className
      )}
    >
      {image}
    </span>
  );

  if (!href) return frame;

  return (
    <Link
      href={href}
      aria-label="ONE OF A KIND FASHION home"
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center justify-center",
        SIZE_CLASS[size],
        className
      )}
    >
      {image}
    </Link>
  );
}
