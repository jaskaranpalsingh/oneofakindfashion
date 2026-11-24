export const BRAND = {
  name: "ONE OF A KIND FASHION",
  shortName: "OOKF",
  tagline: "Tradition, Styled to Perfection",
  defaultCurrency: "CAD",
  defaultLocale: "en-CA",
  country: "CA",
} as const;

export const DEFAULT_STORE = {
  name: BRAND.name,
  addressLine1: "1283 Millbourne Road East NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T6K 1X8",
  country: "Canada",
  phone: "587-937-4570",
  email: "Oneofakindfashion11@gmail.com",
} as const;

export const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "CUSTOM"] as const;

export const SHIPPING_CLASS_LABELS: Record<string, string> = {
  standard_clothing: "Standard Clothing",
  heavy_bridal: "Heavy Bridal Wear",
  jewellery: "Jewellery",
  oversized: "Oversized Packages",
};

/** Default Canada shipping zone templates (admin can edit). */
export const DEFAULT_CANADA_SHIPPING_ZONES = [
  {
    key: "alberta",
    name: "Zone 1 — Alberta",
    provinces: ["AB"],
    sortOrder: 1,
  },
  {
    key: "west_prairies",
    name: "Zone 2 — BC, Saskatchewan & Manitoba",
    provinces: ["BC", "SK", "MB"],
    sortOrder: 2,
  },
  {
    key: "central",
    name: "Zone 3 — Ontario & Quebec",
    provinces: ["ON", "QC"],
    sortOrder: 3,
  },
  {
    key: "atlantic",
    name: "Zone 4 — Atlantic Canada",
    provinces: ["NB", "NL", "NS", "PE"],
    sortOrder: 4,
  },
  {
    key: "territories",
    name: "Zone 5 — Territories",
    provinces: ["YT", "NT", "NU"],
    sortOrder: 5,
  },
] as const;

export const API_VERSION = "v1";
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
