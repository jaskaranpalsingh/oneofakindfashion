import { ProductCard } from "@/components/commerce/product-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchProducts } from "@/lib/catalogue";

export const metadata = {
  title: "Shop All",
  description: "Browse lehengas, suits and jewellery from ONE OF A KIND FASHION.",
};

export default async function ShopAllPage() {
  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  let error: string | null = null;

  try {
    products = await fetchProducts({ sort: "newest" });
  } catch {
    error = "Unable to load products. Confirm the API is running.";
  }

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Catalogue"
          title="Shop All"
          description="Live inventory from MongoDB via the ONE OF A KIND FASHION API."
        />

        {error ? (
          <p className="mt-10 border border-green/20 bg-green/5 px-4 py-3 text-sm text-green">
            {error}
          </p>
        ) : null}

        {!error && products.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            No published products yet. Run `pnpm seed` or create products in admin.
          </p>
        ) : null}

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
