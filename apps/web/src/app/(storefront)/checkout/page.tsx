"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import {
  CANADIAN_PROVINCES,
  ShippingMethod,
  canadianPostalCodeSchema,
} from "@ookf/shared";
import { useCart } from "@/components/cart/cart-provider";
import { CanadianPostalInput } from "@/components/checkout/canadian-postal-input";
import {
  CheckoutField,
  checkoutInputClass,
  checkoutSelectClass,
} from "@/components/checkout/checkout-field";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import { Container } from "@/components/ui/container";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type PublicSettings = {
  shipping: {
    localPickupEnabled: boolean;
    freeShippingMinimumCents: number;
  };
  addressLine1?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

const canadianProvinceCodes = CANADIAN_PROVINCES.map((p) => p.code) as [
  (typeof CANADIAN_PROVINCES)[number]["code"],
  ...(typeof CANADIAN_PROVINCES)[number]["code"][],
];

const canadianProvinceSchema = z.enum(canadianProvinceCodes, {
  required_error: "Select a Canadian province or territory",
  invalid_type_error: "Select a Canadian province or territory",
});

const checkoutFormSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().max(30).optional(),
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    line1: z.string().trim().min(1, "Address is required").max(160),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().min(1, "City is required").max(100),
    province: canadianProvinceSchema,
    postalCode: canadianPostalCodeSchema,
    country: z.literal("Canada"),
    shippingMethod: z.nativeEnum(ShippingMethod),
    sameAsShipping: z.boolean(),
    billingFirstName: z.string().trim().max(80).optional(),
    billingLastName: z.string().trim().max(80).optional(),
    billingLine1: z.string().trim().max(160).optional(),
    billingLine2: z.string().trim().max(160).optional(),
    billingCity: z.string().trim().max(100).optional(),
    billingProvince: canadianProvinceSchema.optional(),
    billingPostalCode: z.string().trim().optional(),
    billingCountry: z.literal("Canada").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sameAsShipping) return;

    if (!data.billingFirstName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name is required",
        path: ["billingFirstName"],
      });
    }
    if (!data.billingLastName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last name is required",
        path: ["billingLastName"],
      });
    }
    if (!data.billingLine1?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required",
        path: ["billingLine1"],
      });
    }
    if (!data.billingCity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["billingCity"],
      });
    }
    if (!data.billingProvince) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a Canadian province or territory",
        path: ["billingProvince"],
      });
    }
    const postal = canadianPostalCodeSchema.safeParse(data.billingPostalCode ?? "");
    if (!postal.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use Canadian format A1A 1A1",
        path: ["billingPostalCode"],
      });
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

function CheckoutForm() {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const mode = searchParams.get("mode") === "buy_now" ? "buy_now" : "cart";
  const { cart, loading: cartLoading } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      line1: "",
      line2: "",
      city: "",
      province: "AB",
      postalCode: "",
      country: "Canada",
      shippingMethod: ShippingMethod.STANDARD,
      sameAsShipping: true,
      billingFirstName: "",
      billingLastName: "",
      billingLine1: "",
      billingLine2: "",
      billingCity: "",
      billingProvince: "AB",
      billingPostalCode: "",
      billingCountry: "Canada",
    },
    mode: "onBlur",
  });

  const sameAsShipping = form.watch("sameAsShipping");
  const shippingMethod = form.watch("shippingMethod");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/v1/settings`, {
          credentials: "include",
        });
        const json = await response.json();
        if (response.ok && json.success) {
          setSettings(json.data as PublicSettings);
        }
      } catch {
        setSettings(null);
      }
    })();
  }, []);

  const pickupEnabled = settings?.shipping.localPickupEnabled ?? true;
  const items = cart?.items ?? [];
  const emptyCart = mode === "cart" && !cartLoading && items.length === 0;

  const shippingOptions = useMemo(() => {
    const options: Array<{ value: ShippingMethod; label: string }> = [
      { value: ShippingMethod.STANDARD, label: "Standard shipping" },
      { value: ShippingMethod.EXPRESS, label: "Express shipping" },
    ];
    if (pickupEnabled) {
      options.push({
        value: ShippingMethod.LOCAL_PICKUP,
        label: "Local pickup (Edmonton)",
      });
    }
    return options;
  }, [pickupEnabled]);

  async function onSubmit(values: CheckoutFormValues) {
    setPending(true);
    setError(null);
    try {
      const shippingAddress = {
        firstName: values.firstName,
        lastName: values.lastName,
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
        country: "Canada" as const,
        phone: values.phone || undefined,
      };

      const billingAddress = values.sameAsShipping
        ? shippingAddress
        : {
            firstName: values.billingFirstName!.trim(),
            lastName: values.billingLastName!.trim(),
            line1: values.billingLine1!.trim(),
            line2: values.billingLine2 || undefined,
            city: values.billingCity!.trim(),
            province: values.billingProvince!,
            postalCode: values.billingPostalCode!,
            country: "Canada" as const,
            phone: values.phone || undefined,
          };

      const response = await fetch(`${getApiBaseUrl()}/api/v1/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          phone: values.phone || undefined,
          shippingMethod: values.shippingMethod,
          shippingAddress,
          billingAddress,
          mode,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Checkout failed");
      }
      if (json.data.checkoutUrl) {
        window.location.href = json.data.checkoutUrl as string;
        return;
      }
      throw new Error("No Stripe checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPending(false);
    }
  }

  function onInvalid() {
    const firstError = document.querySelector("[aria-invalid='true']");
    firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section className="bg-[#FAF8F3] py-7 sm:py-10">
      <Container className="max-w-[980px]">
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#B68A25]">
            Checkout
          </p>
          <h1 className="mt-2 font-serif text-[1.65rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-[2rem]">
            Secure checkout
          </h1>
          <p className="mt-2 text-[13px] text-[#687170]">
            {mode === "buy_now"
              ? "Buy Now checkout for your selected item — Canadian addresses, CAD totals, and Stripe-hosted payment."
              : "Canadian addresses, CAD totals, and Stripe-hosted payment."}
          </p>
        </motion.header>

        {emptyCart ? (
          <div className="mt-7 border border-[#E5E1D9] bg-white p-6">
            <p className="font-serif text-xl text-[#003F2D]">
              Your shopping bag is empty.
            </p>
            <p className="mt-2 text-[13px] text-[#687170]">
              Add items before continuing to secure checkout.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex text-[13px] text-[#003F2D] underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="mt-7 grid items-start gap-5 lg:grid-cols-[1.55fr_1fr] lg:gap-5"
            noValidate
          >
            <div className="space-y-3.5">
              <CheckoutSection title="Customer information" delay={0.05}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckoutField
                    label="Email address"
                    htmlFor="email"
                    error={form.formState.errors.email?.message}
                  >
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(form.formState.errors.email)}
                      className={checkoutInputClass}
                      {...form.register("email")}
                    />
                  </CheckoutField>
                  <CheckoutField
                    label="Phone number"
                    htmlFor="phone"
                    error={form.formState.errors.phone?.message}
                  >
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      className={checkoutInputClass}
                      {...form.register("phone")}
                    />
                  </CheckoutField>
                  <CheckoutField
                    label="First name"
                    htmlFor="firstName"
                    error={form.formState.errors.firstName?.message}
                  >
                    <input
                      id="firstName"
                      autoComplete="given-name"
                      aria-invalid={Boolean(form.formState.errors.firstName)}
                      className={checkoutInputClass}
                      {...form.register("firstName")}
                    />
                  </CheckoutField>
                  <CheckoutField
                    label="Last name"
                    htmlFor="lastName"
                    error={form.formState.errors.lastName?.message}
                  >
                    <input
                      id="lastName"
                      autoComplete="family-name"
                      aria-invalid={Boolean(form.formState.errors.lastName)}
                      className={checkoutInputClass}
                      {...form.register("lastName")}
                    />
                  </CheckoutField>
                </div>
              </CheckoutSection>

              <CheckoutSection title="Shipping address" delay={0.1}>
                <div className="space-y-3">
                  <CheckoutField
                    label="Address line 1"
                    htmlFor="line1"
                    error={form.formState.errors.line1?.message}
                  >
                    <input
                      id="line1"
                      autoComplete="address-line1"
                      aria-invalid={Boolean(form.formState.errors.line1)}
                      className={checkoutInputClass}
                      {...form.register("line1")}
                    />
                  </CheckoutField>
                  <CheckoutField
                    label="Address line 2 (optional)"
                    htmlFor="line2"
                    error={form.formState.errors.line2?.message}
                  >
                    <input
                      id="line2"
                      autoComplete="address-line2"
                      className={checkoutInputClass}
                      {...form.register("line2")}
                    />
                  </CheckoutField>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <CheckoutField
                      label="City"
                      htmlFor="city"
                      error={form.formState.errors.city?.message}
                    >
                      <input
                        id="city"
                        autoComplete="address-level2"
                        aria-invalid={Boolean(form.formState.errors.city)}
                        className={checkoutInputClass}
                        {...form.register("city")}
                      />
                    </CheckoutField>
                    <CheckoutField
                      label="Province / Territory"
                      htmlFor="province"
                      error={form.formState.errors.province?.message}
                    >
                      <select
                        id="province"
                        autoComplete="address-level1"
                        className={checkoutSelectClass}
                        {...form.register("province")}
                      >
                        <option value="" disabled>
                          Select province or territory
                        </option>
                        {CANADIAN_PROVINCES.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </CheckoutField>
                    <CheckoutField
                      label="Postal code"
                      htmlFor="postalCode"
                      error={form.formState.errors.postalCode?.message}
                    >
                      <CanadianPostalInput
                        id="postalCode"
                        autoComplete="postal-code"
                        invalid={Boolean(form.formState.errors.postalCode)}
                        {...form.register("postalCode")}
                      />
                    </CheckoutField>
                  </div>
                  <CheckoutField label="Country" htmlFor="country">
                    <select
                      id="country"
                      className={cn(checkoutSelectClass, "bg-[#FAF8F3]")}
                      {...form.register("country")}
                    >
                      <option value="Canada">Canada</option>
                    </select>
                  </CheckoutField>
                </div>
              </CheckoutSection>

              <CheckoutSection title="Delivery method" delay={0.15}>
                <CheckoutField
                  label="Shipping method"
                  htmlFor="shippingMethod"
                  error={form.formState.errors.shippingMethod?.message}
                >
                  <select
                    id="shippingMethod"
                    className={checkoutSelectClass}
                    {...form.register("shippingMethod")}
                  >
                    {shippingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </CheckoutField>
                {shippingMethod === ShippingMethod.LOCAL_PICKUP ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#687170]">
                    Pickup at{" "}
                    {settings?.addressLine1 ??
                      "1283 Millbourne Road East NW"}
                    , {settings?.city ?? "Edmonton"},{" "}
                    {settings?.province ?? "AB"} {settings?.postalCode ?? ""}.
                  </p>
                ) : null}
              </CheckoutSection>

              <CheckoutSection title="Billing address" delay={0.2}>
                <label className="flex items-center gap-2.5 text-sm text-[#003F2D]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#003F2D]"
                    {...form.register("sameAsShipping")}
                  />
                  Billing address same as shipping
                </label>

                <AnimatePresence initial={false}>
                  {!sameAsShipping ? (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <CheckoutField
                            label="First name"
                            htmlFor="billingFirstName"
                            error={
                              form.formState.errors.billingFirstName?.message
                            }
                          >
                            <input
                              id="billingFirstName"
                              aria-invalid={Boolean(
                                form.formState.errors.billingFirstName
                              )}
                              className={checkoutInputClass}
                              {...form.register("billingFirstName")}
                            />
                          </CheckoutField>
                          <CheckoutField
                            label="Last name"
                            htmlFor="billingLastName"
                            error={
                              form.formState.errors.billingLastName?.message
                            }
                          >
                            <input
                              id="billingLastName"
                              aria-invalid={Boolean(
                                form.formState.errors.billingLastName
                              )}
                              className={checkoutInputClass}
                              {...form.register("billingLastName")}
                            />
                          </CheckoutField>
                        </div>
                        <CheckoutField
                          label="Address line 1"
                          htmlFor="billingLine1"
                          error={form.formState.errors.billingLine1?.message}
                        >
                          <input
                            id="billingLine1"
                            aria-invalid={Boolean(
                              form.formState.errors.billingLine1
                            )}
                            className={checkoutInputClass}
                            {...form.register("billingLine1")}
                          />
                        </CheckoutField>
                        <CheckoutField
                          label="Address line 2 (optional)"
                          htmlFor="billingLine2"
                        >
                          <input
                            id="billingLine2"
                            className={checkoutInputClass}
                            {...form.register("billingLine2")}
                          />
                        </CheckoutField>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <CheckoutField
                            label="City"
                            htmlFor="billingCity"
                            error={form.formState.errors.billingCity?.message}
                          >
                            <input
                              id="billingCity"
                              aria-invalid={Boolean(
                                form.formState.errors.billingCity
                              )}
                              className={checkoutInputClass}
                              {...form.register("billingCity")}
                            />
                          </CheckoutField>
                          <CheckoutField
                            label="Province / Territory"
                            htmlFor="billingProvince"
                            error={
                              form.formState.errors.billingProvince?.message
                            }
                          >
                            <select
                              id="billingProvince"
                              className={checkoutSelectClass}
                              {...form.register("billingProvince")}
                            >
                              <option value="" disabled>
                                Select province or territory
                              </option>
                              {CANADIAN_PROVINCES.map((province) => (
                                <option
                                  key={province.code}
                                  value={province.code}
                                >
                                  {province.name}
                                </option>
                              ))}
                            </select>
                          </CheckoutField>
                          <CheckoutField
                            label="Postal code"
                            htmlFor="billingPostalCode"
                            error={
                              form.formState.errors.billingPostalCode?.message
                            }
                          >
                            <CanadianPostalInput
                              id="billingPostalCode"
                              autoComplete="postal-code"
                              invalid={Boolean(
                                form.formState.errors.billingPostalCode
                              )}
                              {...form.register("billingPostalCode")}
                            />
                          </CheckoutField>
                        </div>
                        <CheckoutField
                          label="Country"
                          htmlFor="billingCountry"
                        >
                          <select
                            id="billingCountry"
                            className={cn(checkoutSelectClass, "bg-[#FAF8F3]")}
                            {...form.register("billingCountry")}
                          >
                            <option value="Canada">Canada</option>
                          </select>
                        </CheckoutField>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </CheckoutSection>

              {error ? (
                <p
                  className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending || cartLoading}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors duration-200",
                  "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-55"
                )}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing secure checkout…
                  </>
                ) : (
                  "Pay securely with Stripe"
                )}
              </button>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
            >
              <CheckoutOrderSummary
                mode={mode}
                items={items}
                subtotalCents={cart?.subtotalCents ?? 0}
                discountCents={cart?.discountCents ?? 0}
              />
            </motion.div>
          </form>
        )}
      </Container>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-[#FAF8F3] text-sm text-[#687170]">
          Loading checkout…
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
