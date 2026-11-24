import { ProductStatus, productFilterSchema, type ProductSummary } from "@ookf/shared";
import { Types, type FilterQuery } from "mongoose";
import { getStoreSettings } from "./admin-settings.service";
import { CategoryModel } from "../models/category.model";
import { OrderModel } from "../models/order.model";
import { ProductModel, type ProductDocument } from "../models/product.model";
import { AppError } from "../utils/app-error";
import { uniqueSlug } from "../utils/slugify";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../validators/product.validators";

function isWithinNewArrivalWindow(
  publishedAt: Date | null | undefined,
  days: number,
  now = new Date()
) {
  if (!publishedAt) return false;
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - days);
  return publishedAt.getTime() >= since.getTime();
}

function assertObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
}

function availableStock(variant: {
  stockQuantity: number;
  reservedQuantity?: number;
}) {
  return Math.max(0, variant.stockQuantity - (variant.reservedQuantity ?? 0));
}

type ProductImageInput = {
  id?: string;
  url: string;
  publicId?: string;
  alt?: string;
  sortOrder?: number;
  isPrimary?: boolean;
};

function sortProductImages<T extends { sortOrder?: number; isPrimary?: boolean }>(
  images: T[]
) {
  return [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function normalizeProductImages(images: ProductImageInput[]) {
  if (images.length > 6) {
    throw new AppError(
      400,
      "TOO_MANY_IMAGES",
      "A product can have at most 6 images"
    );
  }

  const sorted = sortProductImages(images);
  return sorted.map((image, index) => ({
    ...(image.id && Types.ObjectId.isValid(image.id)
      ? { _id: new Types.ObjectId(image.id) }
      : {}),
    url: image.url,
    publicId: image.publicId,
    alt: image.alt ?? "",
    sortOrder: index,
    isPrimary: index === 0,
  }));
}

function mapProductImages(
  images: Array<{
    _id?: unknown;
    url: string;
    publicId?: string;
    alt?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }>
) {
  return sortProductImages(images).map((image, index) => ({
    id: image._id ? String(image._id) : undefined,
    url: image.url,
    publicId: image.publicId,
    alt: image.alt ?? "",
    sortOrder: image.sortOrder ?? index,
    isPrimary: Boolean(image.isPrimary) || index === 0,
  }));
}

export function mapProductSummary(product: ProductDocument | Record<string, unknown>): ProductSummary {
  const doc = product as ProductDocument;
  const variants = (doc.variants ?? []) as Array<{
    stockQuantity: number;
    reservedQuantity?: number;
    isAvailable?: boolean;
  }>;
  const inStock = variants.some(
    (variant) => (variant.isAvailable ?? true) && availableStock(variant) > 0
  );
  const images = (doc.images ?? []) as Array<{
    url: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }>;
  const sortedImages = sortProductImages(images);
  const primary = sortedImages[0];
  const secondary = sortedImages[1];

  const publishedAt = (doc as { publishedAt?: Date }).publishedAt;
  // Badge uses explicit flag OR recent publication window (default 30d).
  const newArrivalDays = 30;
  const withinWindow = isWithinNewArrivalWindow(publishedAt, newArrivalDays);

  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    sku: doc.sku,
    productType: doc.productType,
    status: doc.status,
    priceCents: doc.priceCents,
    compareAtPriceCents: doc.compareAtPriceCents ?? null,
    primaryImageUrl: primary?.url ?? null,
    secondaryImageUrl: secondary?.url ?? null,
    isFeatured: Boolean(doc.isFeatured),
    isNewArrival: Boolean(doc.isNewArrival) || withinWindow,
    isBestSeller: Boolean(doc.isBestSeller),
    inStock,
  };
}

export async function listProducts(query: Record<string, unknown>) {
  const filters = productFilterSchema.parse(query);
  const mongoFilter: FilterQuery<ProductDocument> = {
    deletedAt: null,
    status: ProductStatus.PUBLISHED,
  };

  if (filters.q) {
    mongoFilter.$text = { $search: filters.q };
  }

  if (filters.ids) {
    const idList = filters.ids
      .split(",")
      .map((value) => value.trim())
      .filter((value) => Types.ObjectId.isValid(value))
      .map((value) => new Types.ObjectId(value));
    if (idList.length === 0) {
      return {
        items: [] as ProductSummary[],
        meta: {
          page: filters.page,
          pageSize: filters.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }
    mongoFilter._id = { $in: idList };
  }

  if (filters.category) {
    const category = await CategoryModel.findOne({
      slug: filters.category,
      deletedAt: null,
    }).lean();
    if (category) {
      mongoFilter.$or = [
        { categoryId: category._id },
        { subcategoryId: category._id },
      ];
    } else {
      return {
        items: [] as ProductSummary[],
        meta: {
          page: filters.page,
          pageSize: filters.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  if (filters.collection) {
    mongoFilter.collectionIds = filters.collection;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    mongoFilter.priceCents = {};
    if (filters.minPrice !== undefined) {
      mongoFilter.priceCents.$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      mongoFilter.priceCents.$lte = filters.maxPrice;
    }
  }

  if (filters.size) {
    mongoFilter["variants.options.size"] = filters.size;
  }
  if (filters.colour) {
    mongoFilter["variants.options.colour"] = new RegExp(`^${filters.colour}$`, "i");
  }
  if (filters.fabric) {
    mongoFilter["clothing.fabric"] = new RegExp(filters.fabric, "i");
  }
  if (filters.jewelleryType) {
    mongoFilter["jewellery.jewelleryType"] = new RegExp(filters.jewelleryType, "i");
  }
  if (filters.occasion) {
    mongoFilter["clothing.occasion"] = new RegExp(filters.occasion, "i");
  }
  if (filters.onSale) {
    mongoFilter.compareAtPriceCents = { $gt: 0 };
    mongoFilter.$expr = { $gt: ["$compareAtPriceCents", "$priceCents"] };
  }

  if (filters.newArrivals) {
    const settings = await getStoreSettings();
    const days = settings.newArrivalsDays ?? 30;
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    // Auto-expiry: only products published within the configured window.
    mongoFilter.publishedAt = { $gte: since };
  }

  let sort: Record<string, 1 | -1> = { isFeatured: -1, createdAt: -1 };
  switch (filters.sort) {
    case "newest":
      // Publication recency — never rely on ObjectId ordering alone.
      sort = { publishedAt: -1, createdAt: -1 };
      break;
    case "price_asc":
      sort = { priceCents: 1 };
      break;
    case "price_desc":
      sort = { priceCents: -1 };
      break;
    case "name":
      sort = { name: 1 };
      break;
    case "best_selling":
      sort = { salesCount: -1, createdAt: -1 };
      break;
    default:
      sort = { isFeatured: -1, createdAt: -1 };
  }

  const skip = (filters.page - 1) * filters.pageSize;
  // List cards only need summary fields — skip descriptions and full gallery payloads.
  const listProjection = {
    name: 1,
    slug: 1,
    sku: 1,
    productType: 1,
    status: 1,
    priceCents: 1,
    compareAtPriceCents: 1,
    isFeatured: 1,
    isNewArrival: 1,
    isBestSeller: 1,
    publishedAt: 1,
    images: { $slice: 2 },
    "variants.stockQuantity": 1,
    "variants.reservedQuantity": 1,
    "variants.isAvailable": 1,
  } as const;

  const [rows, total] = await Promise.all([
    ProductModel.find(mongoFilter)
      .select(listProjection)
      .sort(sort)
      .skip(skip)
      .limit(filters.pageSize)
      .lean(),
    ProductModel.countDocuments(mongoFilter),
  ]);

  let items = rows.map((row) => mapProductSummary(row));

  if (filters.availability === "in_stock") {
    items = items.filter((item) => item.inStock);
  } else if (filters.availability === "out_of_stock") {
    items = items.filter((item) => !item.inStock);
  }

  return {
    items,
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}

export async function getProductBySlug(slug: string, opts?: { admin?: boolean }) {
  const filter: FilterQuery<ProductDocument> = { slug, deletedAt: null };
  if (!opts?.admin) {
    filter.status = ProductStatus.PUBLISHED;
  }

  const product = await ProductModel.findOne(filter).lean();
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return {
    ...mapProductSummary(product),
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: String(product.categoryId),
    subcategoryId: product.subcategoryId ? String(product.subcategoryId) : null,
    brand: product.brand ?? null,
    tags: product.tags ?? [],
    clothing: product.clothing ?? null,
    jewellery: product.jewellery ?? null,
    images: mapProductImages(
      (product.images ?? []) as Array<{
        _id?: unknown;
        url: string;
        publicId?: string;
        alt?: string;
        sortOrder?: number;
        isPrimary?: boolean;
      }>
    ),
    variants: (product.variants ?? []).map((variant) => ({
      id: String(variant._id),
      sku: variant.sku,
      options: variant.options,
      priceCents: variant.priceCents ?? product.priceCents,
      stockQuantity: availableStock(variant),
      isAvailable: (variant.isAvailable ?? true) && availableStock(variant) > 0,
      imageUrl: variant.imageUrl ?? null,
    })),
    seoTitle: product.seoTitle ?? null,
    seoDescription: product.seoDescription ?? null,
  };
}

export async function createProduct(input: CreateProductInput) {
  assertObjectId(input.categoryId, "categoryId");
  const category = await CategoryModel.findOne({
    _id: input.categoryId,
    deletedAt: null,
  });
  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  if (input.subcategoryId) {
    assertObjectId(input.subcategoryId, "subcategoryId");
  }

  const skuExists = await ProductModel.exists({ sku: input.sku });
  if (skuExists) {
    throw new AppError(409, "SKU_EXISTS", "Product SKU already exists");
  }

  const variantSkus = input.variants.map((variant) => variant.sku);
  if (new Set(variantSkus).size !== variantSkus.length) {
    throw new AppError(400, "DUPLICATE_VARIANT_SKU", "Variant SKUs must be unique");
  }

  const slug = await uniqueSlug(input.slug ?? input.name, async (value) =>
    Boolean(await ProductModel.exists({ slug: value }))
  );

  const status = input.status ?? ProductStatus.DRAFT;
  const publishing = status === ProductStatus.PUBLISHED;
  if (publishing) {
    if (!input.images?.length) {
      throw new AppError(
        400,
        "PRIMARY_IMAGE_REQUIRED",
        "A primary product image is required before publishing"
      );
    }
    if (!input.shortDescription?.trim()) {
      throw new AppError(
        400,
        "SHORT_DESCRIPTION_REQUIRED",
        "Short description is required before publishing"
      );
    }
  }

  const product = await ProductModel.create({
    ...input,
    slug,
    images: normalizeProductImages(input.images ?? []),
    variants: input.variants.map(({ id: _ignored, ...variant }) => variant),
    status,
    isNewArrival: publishing ? true : Boolean(input.isNewArrival),
    publishedAt: publishing ? new Date() : undefined,
  });

  return mapProductSummary(product);
}

export async function listAdminProducts(query: {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 50)));
  const filter: FilterQuery<ProductDocument> = { deletedAt: null };

  if (query.status && Object.values(ProductStatus).includes(query.status as ProductStatus)) {
    filter.status = query.status;
  }
  if (query.categoryId) {
    assertObjectId(query.categoryId, "categoryId");
    filter.$or = [
      { categoryId: query.categoryId },
      { subcategoryId: query.categoryId },
    ];
  }
  if (query.q?.trim()) {
    const q = query.q.trim();
    filter.$or = [
      ...(filter.$or ? [] : []),
      { name: new RegExp(q, "i") },
      { sku: new RegExp(q, "i") },
      { slug: new RegExp(q, "i") },
    ];
    // If both category and q, use $and
    if (query.categoryId) {
      filter.$and = [
        {
          $or: [
            { categoryId: query.categoryId },
            { subcategoryId: query.categoryId },
          ],
        },
        {
          $or: [
            { name: new RegExp(q, "i") },
            { sku: new RegExp(q, "i") },
            { slug: new RegExp(q, "i") },
          ],
        },
      ];
      delete filter.$or;
    }
  }

  const [rows, total] = await Promise.all([
    ProductModel.find(filter)
      .select({
        name: 1,
        slug: 1,
        sku: 1,
        status: 1,
        priceCents: 1,
        compareAtPriceCents: 1,
        productType: 1,
        categoryId: 1,
        subcategoryId: 1,
        isFeatured: 1,
        isNewArrival: 1,
        isBestSeller: 1,
        publishedAt: 1,
        updatedAt: 1,
        lowStockThreshold: 1,
        images: { $slice: 1 },
        "variants.stockQuantity": 1,
        "variants.reservedQuantity": 1,
        "variants.isAvailable": 1,
        "variants.sku": 1,
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  const categoryIds = [
    ...new Set(
      rows
        .flatMap((row) => [String(row.categoryId), row.subcategoryId ? String(row.subcategoryId) : null])
        .filter(Boolean) as string[]
    ),
  ];
  const categories = await CategoryModel.find({
    _id: { $in: categoryIds },
  })
    .select("name slug")
    .lean();
  const categoryById = new Map(
    categories.map((category) => [String(category._id), category])
  );

  const items = rows.map((row) => {
    const summary = mapProductSummary(row);
    const category = categoryById.get(String(row.categoryId));
    const variants = row.variants ?? [];
    const threshold =
      (row as { lowStockThreshold?: number }).lowStockThreshold ?? 3;
    const available = variants.reduce(
      (sum, variant) => sum + availableStock(variant),
      0
    );
    const reserved = variants.reduce(
      (sum, variant) => sum + (variant.reservedQuantity ?? 0),
      0
    );
    const physical = variants.reduce(
      (sum, variant) => sum + (variant.stockQuantity ?? 0),
      0
    );
    const inventoryStatus =
      available <= 0
        ? "out_of_stock"
        : available <= threshold
          ? "low_stock"
          : "in_stock";
    return {
      ...summary,
      categoryId: String(row.categoryId),
      categoryName: category?.name ?? "Uncategorised",
      categorySlug: category?.slug ?? null,
      variantCount: variants.length,
      stockQuantity: available,
      physicalStock: physical,
      reservedStock: reserved,
      lowStockThreshold: threshold,
      inventoryStatus,
      publishedAt: row.publishedAt ?? null,
      updatedAt: row.updatedAt,
    };
  });

  const [publishedCount, draftCount, unpublishedCount, archivedCount, lowStockCount, outOfStockCount] =
    await Promise.all([
      ProductModel.countDocuments({
        deletedAt: null,
        status: ProductStatus.PUBLISHED,
      }),
      ProductModel.countDocuments({
        deletedAt: null,
        status: ProductStatus.DRAFT,
      }),
      ProductModel.countDocuments({
        deletedAt: null,
        status: ProductStatus.UNPUBLISHED,
      }),
      ProductModel.countDocuments({
        deletedAt: null,
        status: ProductStatus.ARCHIVED,
      }),
      ProductModel.countDocuments({
        deletedAt: null,
        $expr: {
          $and: [
            {
              $gt: [
                {
                  $sum: {
                    $map: {
                      input: "$variants",
                      as: "v",
                      in: {
                        $max: [
                          0,
                          {
                            $subtract: [
                              "$$v.stockQuantity",
                              { $ifNull: ["$$v.reservedQuantity", 0] },
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
                0,
              ],
            },
            {
              $lte: [
                {
                  $sum: {
                    $map: {
                      input: "$variants",
                      as: "v",
                      in: {
                        $max: [
                          0,
                          {
                            $subtract: [
                              "$$v.stockQuantity",
                              { $ifNull: ["$$v.reservedQuantity", 0] },
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
                { $ifNull: ["$lowStockThreshold", 3] },
              ],
            },
          ],
        },
      }),
      ProductModel.countDocuments({
        deletedAt: null,
        $expr: {
          $lte: [
            {
              $sum: {
                $map: {
                  input: "$variants",
                  as: "v",
                  in: {
                    $max: [
                      0,
                      {
                        $subtract: [
                          "$$v.stockQuantity",
                          { $ifNull: ["$$v.reservedQuantity", 0] },
                        ],
                      },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
      }),
    ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        total,
        published: publishedCount,
        draft: draftCount,
        unpublished: unpublishedCount,
        archived: archivedCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
    },
  };
}

export async function getAdminProductById(id: string) {
  assertObjectId(id, "productId");
  const product = await ProductModel.findOne({ _id: id, deletedAt: null }).lean();
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return {
    ...mapProductSummary(product),
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: String(product.categoryId),
    subcategoryId: product.subcategoryId ? String(product.subcategoryId) : null,
    brand: product.brand ?? null,
    tags: product.tags ?? [],
    clothing: product.clothing ?? null,
    jewellery: product.jewellery ?? null,
    images: mapProductImages(
      (product.images ?? []) as Array<{
        _id?: unknown;
        url: string;
        publicId?: string;
        alt?: string;
        sortOrder?: number;
        isPrimary?: boolean;
      }>
    ),
    variants: (product.variants ?? []).map((variant) => ({
      id: String(variant._id),
      sku: variant.sku,
      options: {
        size: variant.options?.size ?? "",
        colour: variant.options?.colour ?? "",
        material: variant.options?.material ?? "",
        other: variant.options?.other ?? "",
      },
      priceCents: variant.priceCents ?? product.priceCents,
      stockQuantity: variant.stockQuantity,
      reservedQuantity: variant.reservedQuantity ?? 0,
      availableQuantity: availableStock(variant),
      imageUrl: variant.imageUrl ?? "",
      isAvailable: variant.isAvailable ?? true,
    })),
    seoTitle: product.seoTitle ?? null,
    seoDescription: product.seoDescription ?? null,
    lowStockThreshold: product.lowStockThreshold ?? 3,
    allowBackorder: Boolean(product.allowBackorder),
    isPhysical: (product as { isPhysical?: boolean }).isPhysical !== false,
    weightGrams: (product as { weightGrams?: number }).weightGrams ?? null,
    weightUnit: (product as { weightUnit?: string }).weightUnit ?? "g",
    dimensionsCm:
      (product as { dimensionsCm?: Record<string, number> }).dimensionsCm ??
      null,
    shippingClass:
      (product as { shippingClass?: string }).shippingClass ??
      "standard_clothing",
    freeShippingEligible:
      (product as { freeShippingEligible?: boolean }).freeShippingEligible !==
      false,
    additionalHandlingCents:
      (product as { additionalHandlingCents?: number })
        .additionalHandlingCents ?? 0,
  };
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  assertObjectId(id, "productId");
  const product = await ProductModel.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  if (input.slug || input.name) {
    product.slug = await uniqueSlug(input.slug ?? input.name ?? product.name, async (value) =>
      Boolean(
        await ProductModel.exists({ slug: value, _id: { $ne: product._id } })
      )
    );
  }

  const previousStatus = product.status;
  if (input.status === ProductStatus.PUBLISHED && !product.publishedAt) {
    product.publishedAt = new Date();
    product.isNewArrival = true;
  }
  // Editing older products must not reset publishedAt / re-new them.
  if (
    input.status === ProductStatus.PUBLISHED &&
    previousStatus !== ProductStatus.PUBLISHED &&
    product.publishedAt
  ) {
    // Re-publish keeps original publishedAt.
  }

  if (
    input.status === ProductStatus.PUBLISHED &&
    !(input.images?.length || product.images?.length)
  ) {
    throw new AppError(
      400,
      "PRIMARY_IMAGE_REQUIRED",
      "A primary product image is required before publishing"
    );
  }

  const { variants, images, ...rest } = input;
  Object.assign(product, rest, {
    slug: product.slug,
    publishedAt: product.publishedAt,
  });

  if (images) {
    product.images = normalizeProductImages(images) as typeof product.images;
    product.markModified("images");
  }

  if (variants) {
    const variantSkus = variants.map((variant) => variant.sku);
    if (new Set(variantSkus).size !== variantSkus.length) {
      throw new AppError(400, "DUPLICATE_VARIANT_SKU", "Variant SKUs must be unique");
    }

    product.variants = variants.map((variant) => {
      const existing =
        variant.id && Types.ObjectId.isValid(variant.id)
          ? product.variants.id(variant.id)
          : null;

      return {
        _id: existing?._id ?? new Types.ObjectId(),
        sku: variant.sku,
        options: {
          size: variant.options?.size || undefined,
          colour: variant.options?.colour || undefined,
          material: variant.options?.material || undefined,
          other: variant.options?.other || undefined,
        },
        priceCents: variant.priceCents,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: existing?.reservedQuantity ?? 0,
        imageUrl: variant.imageUrl || undefined,
        isAvailable: variant.isAvailable ?? true,
      };
    }) as typeof product.variants;
    product.markModified("variants");
  }

  await product.save();
  return getAdminProductById(String(product._id));
}

export async function archiveProduct(id: string) {
  assertObjectId(id, "productId");
  const product = await ProductModel.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  // Keep visible in admin Archived filter; hide from storefront via status.
  product.status = ProductStatus.ARCHIVED;
  product.deletedAt = undefined;
  await product.save();
  return { id: product.id, archived: true, status: product.status };
}

export async function restoreProduct(id: string) {
  assertObjectId(id, "productId");
  const product = await ProductModel.findById(id);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  product.deletedAt = undefined;
  product.status = ProductStatus.DRAFT;
  await product.save();
  return getAdminProductById(String(product._id));
}

export async function softDeleteProduct(id: string) {
  assertObjectId(id, "productId");
  const product = await ProductModel.findOne({ _id: id, deletedAt: null });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const orderCount = await OrderModel.countDocuments({
    "items.productId": product._id,
  });

  product.status = ProductStatus.ARCHIVED;
  product.deletedAt = new Date();
  await product.save();

  return {
    id: String(product._id),
    deleted: true,
    soft: true,
    hadOrders: orderCount > 0,
  };
}

export async function duplicateProduct(id: string) {
  assertObjectId(id, "productId");
  const source = await ProductModel.findOne({ _id: id, deletedAt: null }).lean();
  if (!source) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const baseSku = `${source.sku}-COPY`;
  let sku = baseSku;
  let n = 1;
  while (await ProductModel.exists({ sku })) {
    n += 1;
    sku = `${baseSku}-${n}`;
  }

  const slug = await uniqueSlug(`${source.slug}-copy`, async (value) =>
    Boolean(await ProductModel.exists({ slug: value }))
  );

  const created = await ProductModel.create({
    name: `${source.name} (Copy)`,
    slug,
    sku,
    productType: source.productType,
    status: ProductStatus.DRAFT,
    categoryId: source.categoryId,
    subcategoryId: source.subcategoryId,
    brand: source.brand,
    shortDescription: source.shortDescription,
    description: source.description,
    priceCents: source.priceCents,
    compareAtPriceCents: source.compareAtPriceCents,
    tags: source.tags ?? [],
    clothing: source.clothing,
    jewellery: source.jewellery,
    images: normalizeProductImages(
      (source.images ?? []).map((image, index) => ({
        url: image.url,
        publicId: image.publicId ?? undefined,
        alt: image.alt ?? "",
        sortOrder: image.sortOrder ?? index,
        isPrimary: Boolean((image as { isPrimary?: boolean }).isPrimary) || index === 0,
      }))
    ),
    variants: (source.variants ?? []).map((variant, index) => ({
      sku: `${sku}-V${index + 1}`,
      options: variant.options,
      priceCents: variant.priceCents,
      stockQuantity: variant.stockQuantity ?? 0,
      reservedQuantity: 0,
      imageUrl: variant.imageUrl,
      isAvailable: variant.isAvailable ?? true,
    })),
    seoTitle: source.seoTitle,
    seoDescription: source.seoDescription,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    lowStockThreshold: source.lowStockThreshold ?? 3,
    allowBackorder: source.allowBackorder ?? false,
  });

  return getAdminProductById(String(created._id));
}

export async function bulkUpdateProducts(input: {
  ids: string[];
  action:
    | "publish"
    | "unpublish"
    | "archive"
    | "delete"
    | "restore"
    | "set_category";
  categoryId?: string;
}) {
  const ids = [...new Set(input.ids)].filter((id) => Types.ObjectId.isValid(id));
  if (!ids.length) {
    throw new AppError(400, "NO_IDS", "Select at least one product");
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const id of ids) {
    try {
      switch (input.action) {
        case "publish":
          await updateProduct(id, { status: ProductStatus.PUBLISHED });
          break;
        case "unpublish":
          await updateProduct(id, { status: ProductStatus.UNPUBLISHED });
          break;
        case "archive":
          await archiveProduct(id);
          break;
        case "delete":
          await softDeleteProduct(id);
          break;
        case "restore":
          await restoreProduct(id);
          break;
        case "set_category":
          if (!input.categoryId) {
            throw new AppError(400, "CATEGORY_REQUIRED", "categoryId is required");
          }
          await updateProduct(id, { categoryId: input.categoryId });
          break;
        default:
          throw new AppError(400, "INVALID_ACTION", "Unknown bulk action");
      }
      results.push({ id, ok: true });
    } catch (error) {
      results.push({
        id,
        ok: false,
        error: error instanceof Error ? error.message : "Failed",
      });
    }
  }

  return {
    total: results.length,
    succeeded: results.filter((row) => row.ok).length,
    failed: results.filter((row) => !row.ok).length,
    results,
  };
}
