"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const fieldClass =
  "border-[#E5DFD4] bg-white shadow-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-[#003F2D] focus-visible:ring-[#003F2D]/30";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unlockAutofill, setUnlockAutofill] = useState(false);

  function validate() {
    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Please enter your email address.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Please enter your password.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
      if (json.data?.user?.role !== "admin") {
        throw new Error(
          "This account is not an admin. Use an authorised admin login."
        );
      }
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Unable to reach the server. Check your connection and try again."
        );
      } else {
        setError(err instanceof Error ? err.message : "Sign in failed.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md border border-border bg-white p-8 shadow-sm">
        <div className="mx-auto flex justify-center">
          <BrandLogo href="/admin" size="login" variant="solid" priority />
        </div>
        <h1 className="mt-6 font-serif text-3xl text-green">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with your admin account to load live dashboard data.
        </p>

        <form
          onSubmit={onSubmit}
          className="auth-form mt-8 space-y-4"
          autoComplete="on"
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-[#003F2D]"
            >
              Email address
            </label>
            <Input
              id="admin-email"
              type="email"
              name="admin-username"
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
                fieldErrors.email ? "admin-email-error" : undefined
              }
              className={cn(fieldClass, fieldErrors.email && "border-[#8B3A3A]")}
            />
            {fieldErrors.email ? (
              <p
                id="admin-email-error"
                className="text-xs text-[#8B3A3A]"
                role="alert"
              >
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-[#003F2D]"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="admin-password"
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
                  fieldErrors.password ? "admin-password-error" : undefined
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
                id="admin-password-error"
                className="text-xs text-[#8B3A3A]"
                role="alert"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {error ? (
            <p
              className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
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
              "Sign in to admin"
            )}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          <Link href="/" className="text-green hover:underline">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ivory text-sm text-muted">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
