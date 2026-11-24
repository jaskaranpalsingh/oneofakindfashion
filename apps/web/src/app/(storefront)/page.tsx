import dynamic from "next/dynamic";
import Link from "next/link";
import { HomeHero } from "@/components/home/hero";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { fetchProducts } from "@/lib/catalogue";
import { fetchFeaturedCollections } from "@/lib/collections";
import { cn } from "@/lib/utils";

const CollectionsSection = dynamic(
  () =>
    import("@/components/home/collections-section").then(
      (mod) => mod.CollectionsSection
    ),
  {
    loading: () => (
      <section className="border-b border-[#D4AF37]/20 bg-[#FFF9F0] py-16 sm:py-20">
        <div className="mx-auto h-40 max-w-[1440px] animate-pulse bg-[#F3EEE3]/80" />
      </section>
    ),
  }
);

const NewArrivalsSection = dynamic(
  () =>
    import("@/components/home/new-arrivals-section").then(
      (mod) => mod.NewArrivalsSection
    ),
  {
    loading: () => (
      <section className="border-y border-[#D4AF37]/20 bg-[#FFF9F0] py-14 sm:py-16">
        <div className="mx-auto h-56 max-w-[1440px] animate-pulse bg-[#F3EEE3]/80" />
      </section>
    ),
  }
);

const WhyShopWithUs = dynamic(
  () =>
    import("@/components/home/why-shop-with-us").then(
      (mod) => mod.WhyShopWithUs
    ),
  {
    loading: () => (
      <section className="bg-[#FCF9F3] py-16 sm:py-20">
        <div className="mx-auto h-40 max-w-[1440px] animate-pulse bg-[#F3EEE3]/80" />
      </section>
    ),
  }
);

export default async function HomePage() {
  let newArrivals: Awaited<ReturnType<typeof fetchProducts>> = [];
  let collections: Awaited<ReturnType<typeof fetchFeaturedCollections>> = [];
  let newArrivalsError = false;

  try {
    [newArrivals, collections] = await Promise.all([
      fetchProducts({
        newArrivals: true,
        sort: "newest",
        pageSize: 4,
      }),
      fetchFeaturedCollections(4),
    ]);
  } catch {
    newArrivalsError = true;
    newArrivals = [];
    try {
      collections = await fetchFeaturedCollections(4);
    } catch {
      collections = [];
    }
  }

  return (
    <>
      <HomeHero />

      <CollectionsSection collections={collections} />

      <NewArrivalsSection products={newArrivals} error={newArrivalsError} />

      <WhyShopWithUs />

      <section className="bg-ivory py-16 sm:py-20">
        <Container className="flex flex-col items-start justify-between gap-6 border border-border bg-white p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl text-green sm:text-4xl">
              Visit the boutique
            </h2>
            <div className="gold-rule mt-4" />
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              1283 Millbourne Road East NW, Edmonton, Alberta · 587-937-4570
            </p>
          </div>
          <Link
            href="/contact"
            className={cn(buttonVariants({ variant: "primary", size: "md" }))}
          >
            Contact Us
          </Link>
        </Container>
      </section>
    </>
  );
}
