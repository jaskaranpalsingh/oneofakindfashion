import { ProductStatus, ProductType } from "@ookf/shared";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { CategoryModel } from "../models/category.model";
import { ProductModel } from "../models/product.model";
import { StoreSettingsModel } from "../models/content.model";
import { logger } from "../utils/logger";

const CATEGORY_TREE = [
  {
    name: "Lehengas",
    slug: "lehengas",
    description: "Bridal, festive, and designer silhouettes",
    imageUrl: "/images/collections/lehengas.jpg",
    children: [
      "Bridal Lehengas",
      "Party Wear Lehengas",
      "Designer Lehengas",
      "Festive Lehengas",
    ],
  },
  {
    name: "Suits",
    slug: "suits",
    description: "Anarkali, Punjabi, and unstitched options",
    imageUrl: "/images/collections/suits.jpg",
    children: [
      "Anarkali Suits",
      "Punjabi Suits",
      "Salwar Suits",
      "Palazzo Suits",
      "Unstitched Suits",
    ],
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    description: "Necklaces, earrings, and bridal sets",
    imageUrl: "/images/collections/jewellery.jpg",
    children: [
      "Necklace Sets",
      "Earrings",
      "Bangles",
      "Bracelets",
      "Rings",
      "Tikka and Hair Accessories",
      "Bridal Jewellery Sets",
    ],
  },
  {
    name: "Shararas",
    slug: "shararas",
    description: "Modern styles with traditional charm",
    imageUrl: "/images/collections/shararas.jpg",
    children: [
      "Party Wear Shararas",
      "Wedding Shararas",
      "Designer Sharara Sets",
    ],
  },
] as const;

type DemoProduct = {
  sku: string;
  name: string;
  slug: string;
  categorySlug: string;
  subcategorySlug?: string;
  productType: (typeof ProductType)[keyof typeof ProductType];
  priceCents: number;
  compareAtPriceCents?: number;
  shortDescription: string;
  imageFile: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  tags: string[];
  clothing?: Record<string, unknown>;
  jewellery?: Record<string, unknown>;
  colours: string[];
  sizes: string[];
};

const DEMO_PRODUCTS: DemoProduct[] = [
  // Lehengas
  {
    sku: "OOKF-DEMO-LEH-001",
    name: "Emerald Bridal Lehenga",
    slug: "demo-emerald-bridal-lehenga",
    categorySlug: "lehengas",
    subcategorySlug: "lehengas-bridal-lehengas",
    productType: ProductType.CLOTHING,
    priceCents: 189900,
    compareAtPriceCents: 219900,
    shortDescription: "Elegant bridal lehenga with rich embroidery.",
    imageFile: "lehenga-emerald.jpg",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    tags: ["demo", "bridal", "lehenga"],
    clothing: {
      fabric: "Georgette",
      occasion: "Wedding",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Emerald", "Maroon"],
    sizes: ["S", "M", "L"],
  },
  {
    sku: "OOKF-DEMO-LEH-002",
    name: "Gold Party Wear Lehenga",
    slug: "demo-gold-party-wear-lehenga",
    categorySlug: "lehengas",
    subcategorySlug: "lehengas-party-wear-lehengas",
    productType: ProductType.CLOTHING,
    priceCents: 129900,
    compareAtPriceCents: 149900,
    shortDescription: "Festive party lehenga with antique gold detailing.",
    imageFile: "lehenga-gold.jpg",
    isFeatured: true,
    isNewArrival: true,
    tags: ["demo", "party", "lehenga"],
    clothing: {
      fabric: "Silk Blend",
      occasion: "Party",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Gold", "Ivory"],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    sku: "OOKF-DEMO-LEH-003",
    name: "Ruby Festive Lehenga",
    slug: "demo-ruby-festive-lehenga",
    categorySlug: "lehengas",
    subcategorySlug: "lehengas-festive-lehengas",
    productType: ProductType.CLOTHING,
    priceCents: 99900,
    shortDescription: "Bright festive lehenga for celebrations.",
    imageFile: "lehenga-ruby.jpg",
    isBestSeller: true,
    tags: ["demo", "festive", "lehenga"],
    clothing: {
      fabric: "Net",
      occasion: "Festive",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Ruby", "Pink"],
    sizes: ["S", "M", "L", "XL"],
  },
  // Shararas
  {
    sku: "OOKF-DEMO-SHA-001",
    name: "Ivory Wedding Sharara Set",
    slug: "demo-ivory-wedding-sharara",
    categorySlug: "shararas",
    subcategorySlug: "shararas-wedding-shararas",
    productType: ProductType.CLOTHING,
    priceCents: 159900,
    compareAtPriceCents: 179900,
    shortDescription: "Graceful wedding sharara with soft embroidery.",
    imageFile: "sharara-ivory.jpg",
    isFeatured: true,
    isNewArrival: true,
    tags: ["demo", "wedding", "sharara"],
    clothing: {
      fabric: "Chiffon",
      occasion: "Wedding",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Ivory", "Blush"],
    sizes: ["S", "M", "L"],
  },
  {
    sku: "OOKF-DEMO-SHA-002",
    name: "Teal Party Sharara",
    slug: "demo-teal-party-sharara",
    categorySlug: "shararas",
    subcategorySlug: "shararas-party-wear-shararas",
    productType: ProductType.CLOTHING,
    priceCents: 89900,
    shortDescription: "Lightweight party sharara for evening events.",
    imageFile: "sharara-teal.jpg",
    isBestSeller: true,
    tags: ["demo", "party", "sharara"],
    clothing: {
      fabric: "Georgette",
      occasion: "Party",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Teal", "Navy"],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    sku: "OOKF-DEMO-SHA-003",
    name: "Designer Black Sharara Set",
    slug: "demo-designer-black-sharara",
    categorySlug: "shararas",
    subcategorySlug: "shararas-designer-sharara-sets",
    productType: ProductType.CLOTHING,
    priceCents: 119900,
    shortDescription: "Modern designer sharara with sequin accents.",
    imageFile: "sharara-black.jpg",
    isFeatured: true,
    tags: ["demo", "designer", "sharara"],
    clothing: {
      fabric: "Silk",
      occasion: "Party",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Black", "Silver"],
    sizes: ["S", "M", "L"],
  },
  // Suits
  {
    sku: "OOKF-DEMO-SUI-001",
    name: "Anarkali Emerald Suit",
    slug: "demo-anarkali-emerald-suit",
    categorySlug: "suits",
    subcategorySlug: "suits-anarkali-suits",
    productType: ProductType.CLOTHING,
    priceCents: 74900,
    compareAtPriceCents: 89900,
    shortDescription: "Flowing anarkali suit with elegant embroidery.",
    imageFile: "suit-anarkali.jpg",
    isFeatured: true,
    isNewArrival: true,
    tags: ["demo", "anarkali", "suit"],
    clothing: {
      fabric: "Georgette",
      occasion: "Festive",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Emerald", "Wine"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    sku: "OOKF-DEMO-SUI-002",
    name: "Punjabi Mustard Suit",
    slug: "demo-punjabi-mustard-suit",
    categorySlug: "suits",
    subcategorySlug: "suits-punjabi-suits",
    productType: ProductType.CLOTHING,
    priceCents: 59900,
    shortDescription: "Classic Punjabi suit with phulkari-inspired work.",
    imageFile: "suit-punjabi.jpg",
    isBestSeller: true,
    tags: ["demo", "punjabi", "suit"],
    clothing: {
      fabric: "Cotton Silk",
      occasion: "Everyday",
      dupattaIncluded: true,
      careInstructions: "Hand wash cold",
    },
    colours: ["Mustard", "Green"],
    sizes: ["S", "M", "L"],
  },
  {
    sku: "OOKF-DEMO-SUI-003",
    name: "Palazzo Peach Suit",
    slug: "demo-palazzo-peach-suit",
    categorySlug: "suits",
    subcategorySlug: "suits-palazzo-suits",
    productType: ProductType.CLOTHING,
    priceCents: 64900,
    shortDescription: "Soft peach palazzo suit for daytime occasions.",
    imageFile: "suit-palazzo.jpg",
    isNewArrival: true,
    tags: ["demo", "palazzo", "suit"],
    clothing: {
      fabric: "Crepe",
      occasion: "Party",
      dupattaIncluded: true,
      careInstructions: "Dry clean only",
    },
    colours: ["Peach", "Ivory"],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    sku: "OOKF-DEMO-SUI-004",
    name: "Unstitched Festive Suit Fabric",
    slug: "demo-unstitched-festive-suit",
    categorySlug: "suits",
    subcategorySlug: "suits-unstitched-suits",
    productType: ProductType.CLOTHING,
    priceCents: 44900,
    shortDescription: "Premium unstitched suit fabric set.",
    imageFile: "suit-unstitched.jpg",
    tags: ["demo", "unstitched", "suit"],
    clothing: {
      fabric: "Lawn",
      occasion: "Festive",
      stitchingType: "Unstitched",
      careInstructions: "Gentle wash",
    },
    colours: ["Multicolour"],
    sizes: ["CUSTOM"],
  },
  // Jewellery
  {
    sku: "OOKF-DEMO-JEW-001",
    name: "Kundan Necklace Set",
    slug: "demo-kundan-necklace-set",
    categorySlug: "jewellery",
    subcategorySlug: "jewellery-necklace-sets",
    productType: ProductType.JEWELLERY,
    priceCents: 24900,
    compareAtPriceCents: 29900,
    shortDescription: "Classic kundan necklace with matching earrings.",
    imageFile: "jew-necklace.jpg",
    isFeatured: true,
    isBestSeller: true,
    tags: ["demo", "kundan", "necklace"],
    jewellery: {
      jewelleryType: "Necklace Set",
      material: "Alloy",
      finishColour: "Gold",
      stoneType: "Kundan",
      careInstructions: "Keep dry; wipe with soft cloth",
    },
    colours: ["Gold"],
    sizes: ["One Size"],
  },
  {
    sku: "OOKF-DEMO-JEW-002",
    name: "Pearl Drop Earrings",
    slug: "demo-pearl-drop-earrings",
    categorySlug: "jewellery",
    subcategorySlug: "jewellery-earrings",
    productType: ProductType.JEWELLERY,
    priceCents: 8900,
    shortDescription: "Elegant pearl drop earrings for festive wear.",
    imageFile: "jew-earrings.jpg",
    isNewArrival: true,
    tags: ["demo", "pearl", "earrings"],
    jewellery: {
      jewelleryType: "Earrings",
      material: "Brass",
      finishColour: "Gold",
      stoneType: "Pearl",
      careInstructions: "Avoid perfume and water",
    },
    colours: ["Gold", "Silver"],
    sizes: ["One Size"],
  },
  {
    sku: "OOKF-DEMO-JEW-003",
    name: "Bridal Bangle Set",
    slug: "demo-bridal-bangle-set",
    categorySlug: "jewellery",
    subcategorySlug: "jewellery-bangles",
    productType: ProductType.JEWELLERY,
    priceCents: 15900,
    shortDescription: "Stacked bridal bangles with soft shimmer.",
    imageFile: "jew-bangles.jpg",
    isFeatured: true,
    tags: ["demo", "bridal", "bangles"],
    jewellery: {
      jewelleryType: "Bangles",
      material: "Metal",
      finishColour: "Gold",
      careInstructions: "Store separately to avoid scratches",
    },
    colours: ["Gold"],
    sizes: ["2.4", "2.6", "2.8"],
  },
  {
    sku: "OOKF-DEMO-JEW-004",
    name: "Maang Tikka Hair Set",
    slug: "demo-maang-tikka-set",
    categorySlug: "jewellery",
    subcategorySlug: "jewellery-tikka-and-hair-accessories",
    productType: ProductType.JEWELLERY,
    priceCents: 6900,
    shortDescription: "Delicate maang tikka for bridal and festive looks.",
    imageFile: "jew-tikka.jpg",
    isNewArrival: true,
    tags: ["demo", "tikka", "bridal"],
    jewellery: {
      jewelleryType: "Tikka",
      material: "Alloy",
      finishColour: "Gold",
      stoneType: "Crystal",
      careInstructions: "Keep away from moisture",
    },
    colours: ["Gold"],
    sizes: ["One Size"],
  },
  {
    sku: "OOKF-DEMO-JEW-005",
    name: "Complete Bridal Jewellery Set",
    slug: "demo-bridal-jewellery-set",
    categorySlug: "jewellery",
    subcategorySlug: "jewellery-bridal-jewellery-sets",
    productType: ProductType.JEWELLERY,
    priceCents: 49900,
    compareAtPriceCents: 59900,
    shortDescription: "Full bridal set with necklace, earrings, and tikka.",
    imageFile: "jew-bridal.jpg",
    isFeatured: true,
    isBestSeller: true,
    tags: ["demo", "bridal", "jewellery-set"],
    jewellery: {
      jewelleryType: "Bridal Set",
      material: "Alloy",
      finishColour: "Gold",
      stoneType: "Polki",
      careInstructions: "Store in a dry jewellery box",
    },
    colours: ["Gold"],
    sizes: ["One Size"],
  },
];

function slugifyName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildVariants(product: DemoProduct) {
  const variants = [];
  for (const colour of product.colours) {
    for (const size of product.sizes) {
      const colourCode = colour.slice(0, 3).toUpperCase();
      const sizeCode = size.replace(/\s+/g, "").toUpperCase();
      variants.push({
        sku: `${product.sku}-${sizeCode}-${colourCode}`,
        options: { size, colour },
        stockQuantity: 4 + ((size.length + colour.length) % 5),
        reservedQuantity: 0,
        isAvailable: true,
      });
    }
  }
  return variants;
}

async function seed() {
  await connectDatabase();
  logger.info("Seeding starter catalogue structure and demo products");

  await StoreSettingsModel.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true }
  );

  for (const [index, top] of CATEGORY_TREE.entries()) {
    const parent = await CategoryModel.findOneAndUpdate(
      { slug: top.slug },
      {
        $set: {
          name: top.name,
          slug: top.slug,
          description: top.description,
          imageUrl: top.imageUrl,
          parentId: null,
          displayOrder: index + 1,
          isVisible: true,
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    for (const [childIndex, childName] of top.children.entries()) {
      const childSlug = `${top.slug}-${slugifyName(childName)}`;
      await CategoryModel.findOneAndUpdate(
        { slug: childSlug },
        {
          $set: {
            name: childName,
            slug: childSlug,
            parentId: parent._id,
            displayOrder: childIndex + 1,
            isVisible: true,
            deletedAt: null,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  let created = 0;
  let updated = 0;

  for (const product of DEMO_PRODUCTS) {
    const category = await CategoryModel.findOne({ slug: product.categorySlug });
    if (!category) {
      logger.warn("Skipping product — category missing", {
        sku: product.sku,
        categorySlug: product.categorySlug,
      });
      continue;
    }

    let subcategoryId;
    if (product.subcategorySlug) {
      const subcategory = await CategoryModel.findOne({
        slug: product.subcategorySlug,
      });
      subcategoryId = subcategory?._id;
    }

    const payload = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      productType: product.productType,
      categoryId: category._id,
      subcategoryId,
      shortDescription: product.shortDescription,
      description: `${product.shortDescription} Demo catalogue item for ONE OF A KIND FASHION local development — replace with real boutique inventory before launch.`,
      priceCents: product.priceCents,
      compareAtPriceCents: product.compareAtPriceCents,
      status: ProductStatus.PUBLISHED,
      isFeatured: Boolean(product.isFeatured),
      isNewArrival: Boolean(product.isNewArrival),
      isBestSeller: Boolean(product.isBestSeller),
      tags: product.tags,
      clothing: product.clothing,
      jewellery: product.jewellery,
      images: [
        {
          url: `/demo-products/${product.imageFile}`,
          alt: product.name,
          sortOrder: 0,
        },
      ],
      variants: buildVariants(product),
      publishedAt: new Date(),
      deletedAt: null,
    };

    const existing = await ProductModel.findOne({ sku: product.sku });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
    } else {
      await ProductModel.create(payload);
      created += 1;
    }
  }

  logger.info("Seed completed", { created, updated, total: DEMO_PRODUCTS.length });
  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("Seed failed", { error });
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
