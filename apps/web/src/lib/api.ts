const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ApiFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function apiFetch<T>(
  path: string,
  init?: ApiFetchInit
): Promise<T> {
  const { next, cache, headers, ...rest } = init ?? {};

  // Public catalogue calls may pass `next.revalidate` / tags.
  // Private calls (cart, auth, checkout) keep cache: "no-store".
  const cacheOptions =
    cache !== undefined
      ? { cache }
      : next
        ? { next }
        : { cache: "no-store" as RequestCache };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    ...cacheOptions,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } }
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiClientError(
      payload && "error" in payload
        ? payload.error.message
        : "API request failed",
      response.status,
      payload && "error" in payload ? payload.error.code : undefined
    );
  }

  return payload.data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
