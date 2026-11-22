import { ProductCard } from "@/components/commerce/product-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchProducts } from "@/lib/catalogue";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    description: "Search ONE OF A KIND FASHION products.",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  let error: string | null = null;

  if (query) {
    try {
      products = await fetchProducts({ q: query, sort: "featured" });
    } catch {
      error = "Unable to search products right now. Please try again.";
    }
  }

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Search"
          title={query ? `Results for “${query}”` : "Search the boutique"}
          description={
            query
              ? "Live catalogue results from MongoDB."
              : "Enter a product name, category, or tag to begin."
          }
        />

        {error ? (
          <p className="mt-8 border border-green/20 bg-green/5 px-4 py-3 text-sm text-green">
            {error}
          </p>
        ) : null}

        {!error && query && products.length === 0 ? (
          <p className="mt-8 text-sm text-muted">
            No products matched “{query}”. Try another style or category.
          </p>
        ) : null}

        {!query ? (
          <p className="mt-8 text-sm text-muted">
            Use the header search to find lehengas, suits, and jewellery.
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
