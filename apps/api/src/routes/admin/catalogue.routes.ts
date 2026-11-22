import { Router } from "express";
import {
  archiveCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
} from "../../controllers/category.controller";
import {
  archiveProductHandler,
  createProductHandler,
  getAdminProductHandler,
  listAdminProductsHandler,
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
  createCouponHandler,
  getCustomerHandler,
  getSettingsHandler,
  listCouponsHandler,
  listCustomersHandler,
  listInventoryAdjustmentsHandler,
  listInventoryHandler,
  patchCustomerHandler,
  updateCouponHandler,
  updateSettingsHandler,
} from "../../controllers/admin-ops.controller";
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
adminCatalogueRouter.get(
  "/products/:id",
  asyncHandler(getAdminProductHandler)
);
adminCatalogueRouter.post("/products", asyncHandler(createProductHandler));
adminCatalogueRouter.patch(
  "/products/:id",
  asyncHandler(updateProductHandler)
);
adminCatalogueRouter.delete(
  "/products/:id",
  asyncHandler(archiveProductHandler)
);
adminCatalogueRouter.post(
  "/uploads/images",
  upload.array("images", 12),
  asyncHandler(uploadProductImagesHandler)
);

adminCatalogueRouter.get("/customers", asyncHandler(listCustomersHandler));
adminCatalogueRouter.get("/customers/:id", asyncHandler(getCustomerHandler));
adminCatalogueRouter.patch(
  "/customers/:id",
  asyncHandler(patchCustomerHandler)
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
adminCatalogueRouter.post("/discounts", asyncHandler(createCouponHandler));
adminCatalogueRouter.patch(
  "/discounts/:id",
  asyncHandler(updateCouponHandler)
);

adminCatalogueRouter.get("/settings", asyncHandler(getSettingsHandler));
adminCatalogueRouter.patch("/settings", asyncHandler(updateSettingsHandler));
