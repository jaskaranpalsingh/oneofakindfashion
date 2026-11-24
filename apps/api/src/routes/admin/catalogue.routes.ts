import { Router } from "express";
import {
  archiveCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
} from "../../controllers/category.controller";
import {
  archiveProductHandler,
  bulkUpdateProductsHandler,
  createProductHandler,
  duplicateProductHandler,
  getAdminProductHandler,
  listAdminProductsHandler,
  restoreProductHandler,
  softDeleteProductHandler,
  updateProductHandler,
} from "../../controllers/product.controller";
import { uploadProductImagesHandler } from "../../controllers/media-upload.controller";
import { upload } from "../../middleware/upload";
import {
  getOrderHandler,
  listOrdersHandler,
  updateOrderFulfillmentHandler,
} from "../../controllers/order.controller";
import {
  dashboardBestSellersHandler,
  dashboardCategorySalesHandler,
  dashboardOrdersChartHandler,
  dashboardRevenueHandler,
  dashboardSummaryHandler,
} from "../../controllers/dashboard.controller";
import {
  adjustInventoryHandler,
  archiveCouponHandler,
  couponStatsHandler,
  createCouponHandler,
  duplicateCouponHandler,
  getCustomerHandler,
  getSettingsHandler,
  listCouponsHandler,
  listCustomersHandler,
  listInventoryAdjustmentsHandler,
  listInventoryHandler,
  patchCustomerHandler,
  processCustomerDeletionHandler,
  sendCustomerResetHandler,
  updateCouponHandler,
  updateSettingsHandler,
} from "../../controllers/admin-ops.controller";
import {
  deleteShippingMethodHandler,
  deleteShippingZoneHandler,
  listAdminShippingMethodsHandler,
  listAdminShippingZonesHandler,
  upsertShippingMethodHandler,
  upsertShippingZoneHandler,
} from "../../controllers/shipping.controller";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";

export const adminCatalogueRouter = Router();

adminCatalogueRouter.use(requireAdmin);

adminCatalogueRouter.get(
  "/dashboard/summary",
  asyncHandler(dashboardSummaryHandler)
);
adminCatalogueRouter.get(
  "/dashboard/revenue",
  asyncHandler(dashboardRevenueHandler)
);
adminCatalogueRouter.get(
  "/dashboard/orders-chart",
  asyncHandler(dashboardOrdersChartHandler)
);
adminCatalogueRouter.get(
  "/dashboard/best-sellers",
  asyncHandler(dashboardBestSellersHandler)
);
adminCatalogueRouter.get(
  "/dashboard/category-sales",
  asyncHandler(dashboardCategorySalesHandler)
);

adminCatalogueRouter.get("/orders", asyncHandler(listOrdersHandler));
adminCatalogueRouter.get("/orders/:id", asyncHandler(getOrderHandler));
adminCatalogueRouter.patch(
  "/orders/:id/fulfillment",
  asyncHandler(updateOrderFulfillmentHandler)
);

adminCatalogueRouter.post("/categories", asyncHandler(createCategoryHandler));
adminCatalogueRouter.patch(
  "/categories/:id",
  asyncHandler(updateCategoryHandler)
);
adminCatalogueRouter.delete(
  "/categories/:id",
  asyncHandler(archiveCategoryHandler)
);

adminCatalogueRouter.get(
  "/products",
  asyncHandler(listAdminProductsHandler)
);
adminCatalogueRouter.post(
  "/products/bulk",
  asyncHandler(bulkUpdateProductsHandler)
);
adminCatalogueRouter.get(
  "/products/:id",
  asyncHandler(getAdminProductHandler)
);
adminCatalogueRouter.post("/products", asyncHandler(createProductHandler));
adminCatalogueRouter.patch(
  "/products/:id",
  asyncHandler(updateProductHandler)
);
adminCatalogueRouter.post(
  "/products/:id/duplicate",
  asyncHandler(duplicateProductHandler)
);
adminCatalogueRouter.post(
  "/products/:id/restore",
  asyncHandler(restoreProductHandler)
);
adminCatalogueRouter.post(
  "/products/:id/archive",
  asyncHandler(archiveProductHandler)
);
adminCatalogueRouter.delete(
  "/products/:id",
  asyncHandler(softDeleteProductHandler)
);
adminCatalogueRouter.post(
  "/uploads/images",
  upload.array("images", 6),
  asyncHandler(uploadProductImagesHandler)
);

adminCatalogueRouter.get("/customers", asyncHandler(listCustomersHandler));
adminCatalogueRouter.get("/customers/:id", asyncHandler(getCustomerHandler));
adminCatalogueRouter.patch(
  "/customers/:id",
  asyncHandler(patchCustomerHandler)
);
adminCatalogueRouter.post(
  "/customers/:id/send-password-reset",
  asyncHandler(sendCustomerResetHandler)
);
adminCatalogueRouter.post(
  "/customers/:id/process-deletion",
  asyncHandler(processCustomerDeletionHandler)
);

adminCatalogueRouter.get("/inventory", asyncHandler(listInventoryHandler));
adminCatalogueRouter.post(
  "/inventory/adjustments",
  asyncHandler(adjustInventoryHandler)
);
adminCatalogueRouter.get(
  "/inventory/adjustments",
  asyncHandler(listInventoryAdjustmentsHandler)
);

adminCatalogueRouter.get("/discounts", asyncHandler(listCouponsHandler));
adminCatalogueRouter.get("/discounts/stats", asyncHandler(couponStatsHandler));
adminCatalogueRouter.post("/discounts", asyncHandler(createCouponHandler));
adminCatalogueRouter.patch(
  "/discounts/:id",
  asyncHandler(updateCouponHandler)
);
adminCatalogueRouter.post(
  "/discounts/:id/duplicate",
  asyncHandler(duplicateCouponHandler)
);
adminCatalogueRouter.post(
  "/discounts/:id/archive",
  asyncHandler(archiveCouponHandler)
);

adminCatalogueRouter.get("/settings", asyncHandler(getSettingsHandler));
adminCatalogueRouter.patch("/settings", asyncHandler(updateSettingsHandler));

adminCatalogueRouter.get(
  "/shipping/methods",
  asyncHandler(listAdminShippingMethodsHandler)
);
adminCatalogueRouter.post(
  "/shipping/methods",
  asyncHandler(upsertShippingMethodHandler)
);
adminCatalogueRouter.delete(
  "/shipping/methods/:id",
  asyncHandler(deleteShippingMethodHandler)
);
adminCatalogueRouter.get(
  "/shipping/zones",
  asyncHandler(listAdminShippingZonesHandler)
);
adminCatalogueRouter.post(
  "/shipping/zones",
  asyncHandler(upsertShippingZoneHandler)
);
adminCatalogueRouter.delete(
  "/shipping/zones/:id",
  asyncHandler(deleteShippingZoneHandler)
);
