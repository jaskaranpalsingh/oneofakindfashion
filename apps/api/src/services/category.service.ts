import { Types } from "mongoose";
import { CategoryModel } from "../models/category.model";
import { ProductModel } from "../models/product.model";
import { AppError } from "../utils/app-error";
import { slugify, uniqueSlug } from "../utils/slugify";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validators";

function assertObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
}

export async function listCategories(options?: {
  includeHidden?: boolean;
  parentId?: string | null;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };

  if (!options?.includeHidden) {
    filter.isVisible = true;
  }

  if (options?.parentId === null) {
    filter.parentId = null;
  } else if (options?.parentId) {
    assertObjectId(options.parentId, "parentId");
    filter.parentId = options.parentId;
  }

  return CategoryModel.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
}

export async function getCategoryBySlug(slug: string) {
  const category = await CategoryModel.findOne({
    slug,
    deletedAt: null,
  }).lean();

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  if (input.parentId) {
    assertObjectId(input.parentId, "parentId");
    const parent = await CategoryModel.findOne({
      _id: input.parentId,
      deletedAt: null,
    });
    if (!parent) {
      throw new AppError(404, "PARENT_NOT_FOUND", "Parent category not found");
    }
  }

  const slug = await uniqueSlug(input.slug ?? input.name, async (value) => {
    const existing = await CategoryModel.exists({ slug: value });
    return Boolean(existing);
  });

  return CategoryModel.create({
    ...input,
    slug,
    parentId: input.parentId ?? null,
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  assertObjectId(id, "categoryId");

  const category = await CategoryModel.findOne({ _id: id, deletedAt: null });
  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  if (input.parentId) {
    assertObjectId(input.parentId, "parentId");
    if (input.parentId === id) {
      throw new AppError(
        400,
        "INVALID_PARENT",
        "Category cannot be its own parent"
      );
    }
  }

  if (input.slug || input.name) {
    const nextSlug = await uniqueSlug(
      input.slug ?? input.name ?? category.name,
      async (value) => {
        const existing = await CategoryModel.exists({
          slug: value,
          _id: { $ne: category._id },
        });
        return Boolean(existing);
      }
    );
    category.slug = nextSlug;
  }

  Object.assign(category, {
    ...input,
    slug: category.slug,
    parentId:
      input.parentId === undefined ? category.parentId : input.parentId,
  });

  await category.save();
  return category;
}

export async function archiveCategory(id: string) {
  assertObjectId(id, "categoryId");

  const category = await CategoryModel.findOne({ _id: id, deletedAt: null });
  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  const productCount = await ProductModel.countDocuments({
    $or: [{ categoryId: id }, { subcategoryId: id }],
    deletedAt: null,
  });

  if (productCount > 0) {
    throw new AppError(
      409,
      "CATEGORY_IN_USE",
      "Move or archive products before deleting this category"
    );
  }

  category.deletedAt = new Date();
  category.isVisible = false;
  category.slug = `${category.slug}-archived-${Date.now()}`;
  await category.save();

  return { id: category.id, archived: true };
}

export function toCategoryDto(category: {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: Types.ObjectId | string | null;
  imageUrl?: string | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}) {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parentId: category.parentId ? String(category.parentId) : null,
    imageUrl: category.imageUrl ?? null,
    displayOrder: category.displayOrder ?? 0,
    isVisible: category.isVisible ?? true,
    seoTitle: category.seoTitle ?? null,
    seoDescription: category.seoDescription ?? null,
  };
}

export { slugify };
