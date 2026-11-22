import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { DEFAULT_STORE, BRAND } from "@ookf/shared";

const bannerSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: String,
    imageUrl: String,
    ctaLabel: String,
    ctaHref: String,
    secondaryCtaLabel: String,
    secondaryCtaHref: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const contentPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    seoTitle: String,
    seoDescription: String,
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const storeSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    storeName: { type: String, default: BRAND.name },
    logoUrl: String,
    faviconUrl: String,
    addressLine1: { type: String, default: DEFAULT_STORE.addressLine1 },
    city: { type: String, default: DEFAULT_STORE.city },
    province: { type: String, default: DEFAULT_STORE.province },
    postalCode: { type: String, default: DEFAULT_STORE.postalCode },
    country: { type: String, default: DEFAULT_STORE.country },
    phone: { type: String, default: DEFAULT_STORE.phone },
    email: { type: String, default: DEFAULT_STORE.email },
    currency: { type: String, default: "CAD" },
    announcementBarText: {
      type: String,
      default:
        "Complimentary local pickup available in Edmonton · Free shipping on qualifying Canadian orders",
    },
    newArrivalsDays: { type: Number, default: 30, min: 1, max: 365 },
    socialLinks: {
      instagram: String,
      facebook: String,
      pinterest: String,
      tiktok: String,
    },
    shipping: {
      standardCents: { type: Number, default: 1500 },
      expressCents: { type: Number, default: 2500 },
      freeShippingMinimumCents: { type: Number, default: 20000 },
      localPickupEnabled: { type: Boolean, default: true },
    },
    taxRules: [
      {
        province: { type: String, required: true },
        name: { type: String, required: true },
        rateBps: { type: Number, required: true },
      },
    ],
    navigation: [
      {
        label: String,
        href: String,
        sortOrder: Number,
        isVisible: { type: Boolean, default: true },
      },
    ],
    seoDefaults: {
      titleTemplate: String,
      defaultDescription: String,
    },
  },
  { timestamps: true }
);

const newsletterSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    source: { type: String, default: "website" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BannerModel = model("Banner", bannerSchema);
export const ContentPageModel = model("ContentPage", contentPageSchema);
export const StoreSettingsModel = model("StoreSettings", storeSettingsSchema);
export const NewsletterSubscriberModel = model(
  "NewsletterSubscriber",
  newsletterSchema
);

export type BannerDocument = HydratedDocument<InferSchemaType<typeof bannerSchema>>;
export type ContentPageDocument = HydratedDocument<
  InferSchemaType<typeof contentPageSchema>
>;
export type StoreSettingsDocument = HydratedDocument<
  InferSchemaType<typeof storeSettingsSchema>
>;
export type NewsletterSubscriberDocument = HydratedDocument<
  InferSchemaType<typeof newsletterSchema>
>;
