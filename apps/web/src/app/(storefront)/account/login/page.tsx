"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  clearAuthenticatedWishlistCaches,
  dispatchAuthChange,
  mergeGuestWishlistAfterAuth,
} from "@/lib/wishlist-store";

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const fieldClass =
  "border-[#E5DFD4] bg-white shadow-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-[#003F2D] focus-visible:ring-[#003F2D]/30";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const resetOk = searchParams.get("reset") === "1";

  // Always start empty — never seed owner/admin credentials on the storefront.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Blocks browser autofill paint until the customer focuses a field.
  const [unlockAutofill, setUnlockAutofill] = useState(false);

  function validate() {
    const next: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "Please enter your email address.";
    } else if (!isValidEmail(trimmedEmail)) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Please enter your password.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (!validate()) return;

    setPending(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error?.message ??
            (response.status >= 500
              ? "Something went wrong. Please try again."
              : "Incorrect email or password.")
        );
      }

      // Drop previous account cache only — keep guest wishlist for merge.
      clearAuthenticatedWishlistCaches();

      await fetch(`${getApiBaseUrl()}/api/v1/cart/merge`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const userId = json.data?.user?.id as string | undefined;
      if (userId && json.data?.user?.role !== "admin") {
        await mergeGuestWishlistAfterAuth(userId);
        dispatchAuthChange({ userId, reason: "login" });
      }

      const role = json.data?.user?.role;
      if (role === "admin") {
        router.push(nextPath?.startsWith("/admin") ? nextPath : "/admin");
      } else {
        router.push(
          nextPath && !nextPath.startsWith("/admin") ? nextPath : "/account"
        );
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Unable to reach the server. Check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Sign in failed.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-[#FAF7F0] py-14 sm:py-20">
      <Container className="max-w-md">
        <h1 className="font-serif text-4xl tracking-tight text-[#003F2D] sm:text-[2.75rem]">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B6458]">
          Access your orders, wishlist, and saved addresses.
        </p>

        {resetOk ? (
          <p className="mt-6 text-sm text-[#003F2D]">
            Password updated. Please sign in.
          </p>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="auth-form mt-10 space-y-4"
          autoComplete="on"
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="customer-email"
              className="block text-sm font-medium text-[#003F2D]"
            >
              Email address
            </label>
            <Input
              id="customer-email"
              type="email"
              name="username"
              autoComplete="username"
              inputMode="email"
              placeholder="Enter your email address"
              value={email}
              readOnly={!unlockAutofill}
              onFocus={() => setUnlockAutofill(true)}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "customer-email-error" : undefined
              }
              className={cn(fieldClass, fieldErrors.email && "border-[#8B3A3A]")}
            />
            {fieldErrors.email ? (
              <p
                id="customer-email-error"
                className="text-xs text-[#8B3A3A]"
                role="alert"
              >
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="customer-password"
              className="block text-sm font-medium text-[#003F2D]"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="customer-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                readOnly={!unlockAutofill}
                onFocus={() => setUnlockAutofill(true)}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "customer-password-error" : undefined
                }
                className={cn(
                  fieldClass,
                  "pr-12",
                  fieldErrors.password && "border-[#8B3A3A]"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#6B6458] transition duration-150 hover:text-[#003F2D]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <p
                id="customer-password-error"
                className="text-xs text-[#8B3A3A]"
                role="alert"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-[#4A453C]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 accent-[#003F2D]"
              />
              Remember me
            </label>
            <Link
              href="/account/forgot-password"
              className="text-[#003F2D] transition duration-150 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error ? (
            <p className="text-sm text-[#8B3A3A]" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-8 text-sm text-[#6B6458]">
          New here?{" "}
          <Link
            href="/account/register"
            className="text-[#003F2D] transition duration-150 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </Container>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-[#FAF7F0] py-14 sm:py-20">
          <Container className="max-w-md">
            <div className="h-8 w-32 animate-pulse bg-[#E5DFD4]/60" />
            <div className="mt-4 h-4 w-64 animate-pulse bg-[#E5DFD4]/40" />
          </Container>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
