import { HeroContent } from "@/components/home/hero-content";
import { HeroDecorations } from "@/components/home/hero-decorations";
import { HeroImage } from "@/components/home/hero-image";

/** Server Component shell — LCP image is server-rendered; motion stays in client children. */
export function HeroSection() {
  return (
    <section
      aria-label="ONE OF A KIND FASHION hero"
      className="relative overflow-hidden border-b border-[#D4AF37]/20 bg-[#F8F5EB]"
    >
      <HeroDecorations />

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:px-10 lg:py-16 xl:gap-16 xl:py-20">
        <HeroContent />
        <div className="group mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <HeroImage />
        </div>
      </div>
    </section>
  );
}
