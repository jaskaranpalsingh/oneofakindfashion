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

export const API_VERSION = "v1";
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
