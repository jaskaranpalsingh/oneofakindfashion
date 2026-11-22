import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "header";
  priority?: boolean;
};

const SIZE_CLASS = {
  sm: "h-10 w-auto max-w-[7.5rem]",
  md: "h-12 w-auto max-w-[9rem] sm:h-14 sm:max-w-[10.5rem]",
  lg: "h-14 w-auto max-w-[10rem] sm:h-16 sm:max-w-[12rem]",
  header: "h-12 w-auto max-w-[8rem] sm:h-14 sm:max-w-[9.5rem] lg:h-16 lg:max-w-[12.5rem]",
} as const;

export function BrandLogo({
  href = "/",
  className,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const image = (
    <Image
      src="/brand/one-of-a-kind-fashion-logo-transparent.png"
      alt="ONE OF A KIND FASHION"
      width={720}
      height={480}
      priority={priority}
      className={cn(
        "object-contain object-left",
        SIZE_CLASS[size],
        className
      )}
    />
  );

  if (!href) return image;

  return (
    <Link
      href={href}
      aria-label="ONE OF A KIND FASHION home"
      className="relative z-10 inline-flex shrink-0 items-center"
    >
      {image}
    </Link>
  );
}
