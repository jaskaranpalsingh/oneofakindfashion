import { fetchCategories, type CategoryDto } from "@/lib/catalogue";

const FALLBACK_COPY: Record<string, { name: string; description: string }> = {
  lehengas: {
    name: "Lehengas",
    description: "Bridal, festive, and designer silhouettes",
  },
  suits: {
    name: "Suits",
    description: "Anarkali, Punjabi, and unstitched options",
  },
  jewellery: {
    name: "Jewellery",
    description: "Necklaces, earrings, and bridal sets",
  },
  shararas: {
    name: "Shararas",
    description: "Modern styles with traditional charm",
  },
};

const FALLBACK_IMAGES: Record<string, string> = {
  lehengas: "/images/collections/lehengas.jpg",
  suits: "/images/collections/suits.jpg",
  jewellery: "/images/collections/jewellery.jpg",
  shararas: "/images/collections/shararas.jpg",
};

export type FeaturedCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  href: string;
};

function mapCollection(category: CategoryDto): FeaturedCollection {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description:
      category.description?.trim() ||
      FALLBACK_COPY[category.slug]?.description ||
      "Explore this curated collection",
    imageUrl:
      category.imageUrl || FALLBACK_IMAGES[category.slug] || null,
    href: `/shop/${category.slug}`,
  };
}

/** Top-level visible categories for the homepage showcase. */
export async function fetchFeaturedCollections(limit = 4) {
  try {
    const categories = await fetchCategories();
    return categories
      .filter((category) => !category.parentId && category.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map(mapCollection);
  } catch {
    return Object.entries(FALLBACK_COPY)
      .slice(0, limit)
      .map(([slug, copy]) => ({
        id: `fallback-${slug}`,
        name: copy.name,
        slug,
        description: copy.description,
        imageUrl: FALLBACK_IMAGES[slug] ?? null,
        href: `/shop/${slug}`,
      }));
  }
}
