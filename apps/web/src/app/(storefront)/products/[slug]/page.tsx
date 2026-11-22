import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/commerce/product-detail-view";
import { ApiClientError } from "@/lib/api";
import { fetchCategories, fetchProductBySlug } from "@/lib/catalogue";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    return {
      title: product.seoTitle ?? product.name,
      description:
        product.seoDescription ??
        product.shortDescription ??
        `Shop ${product.name} at ONE OF A KIND FASHION.`,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const [product, categories] = await Promise.all([
      fetchProductBySlug(slug),
      fetchCategories().catch(() => []),
    ]);

    return <ProductDetailView product={product} categories={categories} />;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
