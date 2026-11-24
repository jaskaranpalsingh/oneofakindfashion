/** Invalidate Next.js public catalogue cache after admin mutations. */
export async function revalidateCatalogue(slug?: string) {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET;
    if (secret) {
      headers["x-revalidate-secret"] = secret;
    }
    await fetch("/api/revalidate", {
      method: "POST",
      headers,
      body: JSON.stringify(slug ? { slug } : {}),
    });
  } catch {
    // Non-blocking — time-based revalidate still refreshes within 30s.
  }
}
