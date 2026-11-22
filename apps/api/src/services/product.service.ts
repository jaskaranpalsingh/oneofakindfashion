import { ProductStatus, productFilterSchema, type ProductSummary } from "@ookf/shared";
import { Types, type FilterQuery } from "mongoose";
import { getStoreSettings } from "./admin-settings.service";
import { CategoryModel } from "../models/category.model";
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
  const images = (doc.images ?? []) as Array<{ url: string; sortOrder?: number }>;
  const sortedImages = [...images].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
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
  const [rows, total] = await Promise.all([
    ProductModel.find(mongoFilter)
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
    images: product.images ?? [],
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
    const stock = (row.variants ?? []).reduce(
      (sum, variant) => sum + availableStock(variant),
      0
    );
    return {
      ...summary,
      categoryId: String(row.categoryId),
      categoryName: category?.name ?? "Uncategorised",
      categorySlug: category?.slug ?? null,
      variantCount: row.variants?.length ?? 0,
      stockQuantity: stock,
      publishedAt: row.publishedAt ?? null,
      updatedAt: row.updatedAt,
    };
  });

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
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
    images: product.images ?? [],
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

  const { variants, ...rest } = input;
  Object.assign(product, rest, {
    slug: product.slug,
    publishedAt: product.publishedAt,
  });

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

  product.status = ProductStatus.ARCHIVED;
  product.deletedAt = new Date();
  await product.save();
  return { id: product.id, archived: true };
}
