"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  emailVerified?: boolean;
  marketingConsent?: boolean;
};

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok || !json.success) return null;
      return (json.data?.user ?? null) as AuthUser | null;
    },
    staleTime: 60_000,
  });
}
