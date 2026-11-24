import Image from "next/image";

/** Server Component — priority LCP image without waiting on animation JS. */
export function HeroImage() {
  return (
    <div className="relative z-10 w-full">
      <div className="relative aspect-[3/4] overflow-hidden border border-[#D4AF37] bg-[#F8F5EB] sm:aspect-[4/5] lg:min-h-[560px] lg:aspect-auto xl:min-h-[620px]">
        <Image
          src="/images/hero-traditional-wear.jpg"
          alt="Model wearing an emerald green traditional Indian outfit with gold embroidery and jewellery"
          fill
          priority
          fetchPriority="high"
          quality={82}
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover object-[center_15%] transition duration-700 ease-out md:group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:md:group-hover:scale-100"
        />
      </div>
    </div>
  );
}
