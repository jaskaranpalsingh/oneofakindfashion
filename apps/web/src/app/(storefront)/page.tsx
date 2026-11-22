import Link from "next/link";
import { CollectionsSection } from "@/components/home/collections-section";
import { HomeHero } from "@/components/home/hero";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { WhyShopWithUs } from "@/components/home/why-shop-with-us";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { fetchProducts } from "@/lib/catalogue";
import { fetchFeaturedCollections } from "@/lib/collections";
import { cn } from "@/lib/utils";

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
