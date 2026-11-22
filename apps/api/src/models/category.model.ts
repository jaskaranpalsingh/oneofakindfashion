import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    imageUrl: String,
    displayOrder: { type: Number, default: 0, index: true },
    isVisible: { type: Boolean, default: true, index: true },
    seoTitle: String,
    seoDescription: String,
    deletedAt: Date,
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1, displayOrder: 1 });
categorySchema.index({ name: "text", description: "text" });

export type CategoryDocument = HydratedDocument<
  InferSchemaType<typeof categorySchema>
>;
export const CategoryModel = model("Category", categorySchema);
