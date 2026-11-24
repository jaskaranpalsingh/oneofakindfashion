import { ProductCard } from "@/components/commerce/product-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { fetchCategories, fetchProducts } from "@/lib/catalogue";

type PageProps = {
  params: Promise<{ category: string }>;
};

const SPECIAL_PAGES: Record<
  string,
  { title: string; description: string; query: Record<string, string | boolean> }
> = {
  "new-arrivals": {
    title: "New Arrivals",
    description: "The latest additions to our jewellery and fashion collections.",
    query: { newArrivals: true, sort: "newest" },
  },
  sale: {
    title: "Sale",
    description: "Selected styles currently offered at a special price.",
    query: { onSale: true, sort: "featured" },
  },
};

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const special = SPECIAL_PAGES[category];
  const title =
    special?.title ??
    category
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  return {
    title,
    description: `Shop ${title} at ONE OF A KIND FASHION.`,
  };
}

export default async function CategoryShopPage({ params }: PageProps) {
  const { category } = await params;
  const special = SPECIAL_PAGES[category];

  let title = special?.title ?? category;
  const description =
    special?.description ??
    "Explore curated ethnic fashion from ONE OF A KIND FASHION.";
  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  let error: string | null = null;

  try {
    if (special) {
      products = await fetchProducts(special.query);
    } else {
      const categories = await fetchCategories();
      const match = categories.find((item) => item.slug === category);
      title = match?.name ?? category;
      products = await fetchProducts({ category, sort: "featured" });
    }
  } catch {
    error = "Unable to load this category right now.";
  }

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow={special ? "Shop" : "Category"}
          title={title}
          description={description}
        />

        {error ? (
          <p className="mt-10 border border-burgundy/20 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
            {error}
          </p>
        ) : null}

        {!error && products.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            No published products in this section yet.
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
