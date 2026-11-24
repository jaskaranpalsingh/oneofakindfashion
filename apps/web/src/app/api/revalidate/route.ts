import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand cache invalidation for public catalogue pages.
 * Called after admin product / category mutations so New Arrivals and
 * category listings refresh without a server restart.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided =
    request.headers.get("x-revalidate-secret") ??
    request.nextUrl.searchParams.get("secret");

  if (secret && provided !== secret) {
    return NextResponse.json(
      { success: false, error: "Invalid revalidate secret" },
      { status: 401 }
    );
  }

  let slug: string | undefined;
  try {
    const body = (await request.json()) as { slug?: string };
    slug = body.slug;
  } catch {
    // empty body is fine
  }

  revalidateTag("catalogue");
  revalidateTag("products");
  revalidateTag("categories");
  revalidateTag("store-settings");
  revalidatePath("/");
  revalidatePath("/shop");
  if (slug) {
    revalidateTag(`product:${slug}`);
    revalidatePath(`/products/${slug}`);
  }

  return NextResponse.json({
    success: true,
    revalidated: true,
    at: new Date().toISOString(),
  });
}
