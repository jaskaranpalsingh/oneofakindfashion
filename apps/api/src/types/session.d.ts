import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: "customer" | "admin";
    adminRole?: "owner" | "manager" | "staff";
    guestId?: string;
    /** Isolated Buy Now selection — does not replace the shopping cart. */
    buyNow?: {
      productId: string;
      variantId: string;
      quantity: number;
    };
  }
}
