import { redirect } from "next/navigation";

/** Account nav alias — wishlist UI lives at /wishlist with server sync. */
export default function AccountWishlistPage() {
  redirect("/wishlist");
}
