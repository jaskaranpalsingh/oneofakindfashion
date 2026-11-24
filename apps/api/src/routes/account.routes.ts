import { Router } from "express";
import {
  accountOverviewHandler,
  addWishlistHandler,
  checkoutProfileHandler,
  createAddressHandler,
  deleteAddressHandler,
  listAddressesHandler,
  removeWishlistHandler,
  syncWishlistHandler,
  updateAddressHandler,
  wishlistHandler,
} from "../controllers/account.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";
import { setPrivateNoStore } from "../utils/api-response";

export const accountRouter = Router();

accountRouter.use(requireAuth);
accountRouter.use((_req, res, next) => {
  setPrivateNoStore(res);
  next();
});

accountRouter.get("/overview", asyncHandler(accountOverviewHandler));
accountRouter.get("/checkout-profile", asyncHandler(checkoutProfileHandler));

accountRouter.get("/addresses", asyncHandler(listAddressesHandler));
accountRouter.post("/addresses", asyncHandler(createAddressHandler));
accountRouter.patch("/addresses/:id", asyncHandler(updateAddressHandler));
accountRouter.delete("/addresses/:id", asyncHandler(deleteAddressHandler));

accountRouter.get("/wishlist", asyncHandler(wishlistHandler));
accountRouter.post("/wishlist", asyncHandler(addWishlistHandler));
accountRouter.delete(
  "/wishlist/:productId",
  asyncHandler(removeWishlistHandler)
);
accountRouter.post("/wishlist/sync", asyncHandler(syncWishlistHandler));
