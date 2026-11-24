"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { z } from "zod";
import {
  CANADIAN_PROVINCES,
  ShippingMethod,
  canadianPostalCodeSchema,
  formatCad,
} from "@ookf/shared";
import { useCart } from "@/components/cart/cart-provider";
import { CanadianPostalInput } from "@/components/checkout/canadian-postal-input";
import {
  CheckoutField,
  checkoutInputClass,
  checkoutSelectClass,
} from "@/components/checkout/checkout-field";
import {
  CheckoutOrderSummary,
  type CheckoutQuote,
} from "@/components/checkout/checkout-order-summary";
import { CheckoutProgress } from "@/components/checkout/checkout-progress";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import { Container } from "@/components/ui/container";
import { getApiBaseUrl } from "@/lib/api";
import {
  CheckoutQuoteError,
  quoteCheckoutTotals,
  setBuyNowIntent,
  type CartLine,
  type CheckoutQuoteLine,
} from "@/lib/cart";
import { cn } from "@/lib/utils";

type PublicSettings = {
  shipping: {
    localPickupEnabled: boolean;
    freeShippingMinimumCents: number;
    standardCents?: number;
    expressCents?: number;
    standardEta?: string | null;
    expressEta?: string | null;
    pickupInstructions?: string | null;
  };
  addressLine1?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  storeName?: string;
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
    company: z.string().trim().max(120).optional(),
    line1: z.string().trim().max(160).optional(),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().max(100).optional(),
    province: canadianProvinceSchema.optional(),
    postalCode: z.string().trim().optional(),
    country: z.literal("Canada"),
    shippingMethod: z.nativeEnum(ShippingMethod),
    sameAsShipping: z.boolean(),
    customerNotes: z.string().trim().max(500).optional(),
    acceptPolicies: z.boolean(),
    marketingOptIn: z.boolean(),
    saveAddress: z.boolean().optional(),
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
    if (!data.acceptPolicies) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please acknowledge the store policies to continue",
        path: ["acceptPolicies"],
      });
    }

    const isPickup = data.shippingMethod === ShippingMethod.LOCAL_PICKUP;
    if (!isPickup) {
      if (!data.line1?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address is required",
          path: ["line1"],
        });
      }
      if (!data.city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required",
          path: ["city"],
        });
      }
      if (!data.province) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a Canadian province or territory",
          path: ["province"],
        });
      }
      const postal = canadianPostalCodeSchema.safeParse(data.postalCode ?? "");
      if (!postal.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use Canadian format A1A 1A1",
          path: ["postalCode"],
        });
      }
    }

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
    const billingPostal = canadianPostalCodeSchema.safeParse(
      data.billingPostalCode ?? ""
    );
    if (!billingPostal.success) {
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
  const {
    cart,
    loading: cartLoading,
    updateItem,
    applyCoupon,
    clearCoupon,
  } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteItems, setQuoteItems] = useState<CheckoutQuoteLine[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [buyNowExpired, setBuyNowExpired] = useState(false);
  const [buyNowRevision, setBuyNowRevision] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      company: "",
      line1: "",
      line2: "",
      city: "",
      province: "AB",
      postalCode: "",
      country: "Canada",
      shippingMethod: ShippingMethod.STANDARD,
      sameAsShipping: true,
      customerNotes: "",
      acceptPolicies: false,
      marketingOptIn: false,
      saveAddress: false,
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
  const province = form.watch("province");
  const postalCode = form.watch("postalCode");
  const isPickup = shippingMethod === ShippingMethod.LOCAL_PICKUP;

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

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/account/checkout-profile`,
          { credentials: "include" }
        );
        if (response.status === 401) return;
        const json = await response.json();
        if (!response.ok || !json.success) return;
        const profile = json.data as {
          firstName: string;
          lastName: string;
          email: string;
          phone: string | null;
          shippingAddress: {
            firstName: string;
            lastName: string;
            company?: string | null;
            line1: string;
            line2?: string | null;
            city: string;
            province: string;
            postalCode: string;
            phone?: string | null;
          } | null;
        };
        setSignedIn(true);
        const shipping = profile.shippingAddress;
        const current = form.getValues();
        form.reset({
          ...current,
          email: profile.email || current.email,
          phone: profile.phone || shipping?.phone || current.phone,
          firstName:
            shipping?.firstName || profile.firstName || current.firstName,
          lastName:
            shipping?.lastName || profile.lastName || current.lastName,
          company: shipping?.company || current.company,
          line1: shipping?.line1 || current.line1,
          line2: shipping?.line2 || current.line2,
          city: shipping?.city || current.city,
          province: (shipping?.province as CheckoutFormValues["province"]) ||
            current.province,
          postalCode: shipping?.postalCode || current.postalCode,
        });
      } catch {
        // Guest checkout continues without prefill.
      }
    })();
    // Prefill once on mount for authenticated customers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickupEnabled = settings?.shipping.localPickupEnabled ?? true;
  const cartItems = cart?.items ?? [];
  const summaryItems: Array<CartLine | CheckoutQuoteLine> =
    mode === "buy_now" ? quoteItems : cartItems;
  const emptyCart = mode === "cart" && !cartLoading && cartItems.length === 0;
  const buyNowBlocked = mode === "buy_now" && buyNowExpired;

  const quoteProvince = useMemo(() => {
    if (isPickup) return settings?.province ?? "AB";
    return province || "AB";
  }, [isPickup, province, settings?.province]);

  useEffect(() => {
    if (emptyCart || cartLoading) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setQuoteLoading(true);
        try {
          const result = await quoteCheckoutTotals({
            shippingMethod,
            province: quoteProvince,
            postalCode: isPickup ? undefined : postalCode || undefined,
            mode,
          });
          if (cancelled) return;
          setBuyNowExpired(false);
          setQuoteItems(result.items ?? []);
          setQuote({
            subtotalCents: result.subtotalCents,
            discountCents: result.discountCents,
            shippingCents: result.shippingCents,
            taxCents: result.taxCents,
            totalCents: result.totalCents,
            taxBreakdown: result.taxBreakdown,
            couponCode: result.couponCode,
            amountUntilFreeCents: result.amountUntilFreeCents,
            qualifiesForFreeShipping: result.qualifiesForFreeShipping,
            freeShippingMinimumCents:
              result.shipping.freeShippingMinimumCents,
            availableMethods: result.availableMethods,
            zoneName: result.zoneName,
          });
        } catch (err) {
          if (cancelled) return;
          setQuote(null);
          setQuoteItems([]);
          if (
            err instanceof CheckoutQuoteError &&
            err.code === "BUY_NOW_EXPIRED"
          ) {
            setBuyNowExpired(true);
          }
        } finally {
          if (!cancelled) setQuoteLoading(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    shippingMethod,
    quoteProvince,
    postalCode,
    isPickup,
    mode,
    emptyCart,
    cartLoading,
    cart?.subtotalCents,
    cart?.discountCents,
    cart?.couponCode,
    cart?.itemCount,
    buyNowRevision,
  ]);

  async function handleApplyCoupon(code: string) {
    setError(null);
    await applyCoupon(code);
  }

  async function handleRemoveCoupon() {
    setError(null);
    await clearCoupon();
  }

  async function handleSummaryQuantityChange(
    item: CartLine | CheckoutQuoteLine,
    quantity: number
  ) {
    setError(null);
    try {
      if (mode === "cart") {
        await updateItem(item.id, quantity);
        return;
      }
      await setBuyNowIntent({
        productId: item.productId,
        variantId: item.variantId,
        quantity,
      });
      setBuyNowRevision((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update quantity"
      );
    }
  }

  const shippingCards = useMemo(() => {
    const standard = settings?.shipping.standardCents ?? 1500;
    const express = settings?.shipping.expressCents ?? 2500;
    const freeMin = settings?.shipping.freeShippingMinimumCents ?? 20000;
    const subtotal =
      mode === "buy_now"
        ? (quote?.subtotalCents ?? 0)
        : (cart?.subtotalCents ?? 0);
    const standardPrice =
      subtotal >= freeMin ? 0 : standard;

    const cards: Array<{
      value: ShippingMethod;
      title: string;
      detail: string;
      priceLabel: string;
    }> = [
      {
        value: ShippingMethod.STANDARD,
        title: "Standard shipping",
        detail: settings?.shipping.standardEta ?? "5–8 business days",
        priceLabel: standardPrice === 0 ? "Free" : formatCad(standardPrice),
      },
      {
        value: ShippingMethod.EXPRESS,
        title: "Express shipping",
        detail: settings?.shipping.expressEta ?? "2–4 business days",
        priceLabel: formatCad(express),
      },
    ];
    if (pickupEnabled) {
      cards.push({
        value: ShippingMethod.LOCAL_PICKUP,
        title: "Local pickup",
        detail: "Edmonton boutique",
        priceLabel: "Free",
      });
    }
    return cards;
  }, [settings, cart?.subtotalCents, pickupEnabled, mode, quote?.subtotalCents]);

  async function onSubmit(values: CheckoutFormValues) {
    setPending(true);
    setError(null);
    try {
      const storeAddress = {
        firstName: values.firstName,
        lastName: values.lastName,
        company: values.company || undefined,
        line1: settings?.addressLine1 ?? "1283 Millbourne Road East NW",
        city: settings?.city ?? "Edmonton",
        province: (settings?.province as CheckoutFormValues["province"]) ?? "AB",
        postalCode: settings?.postalCode ?? "T6W 1L9",
        country: "Canada" as const,
        phone: values.phone || settings?.phone || undefined,
      };

      const shippingAddress =
        values.shippingMethod === ShippingMethod.LOCAL_PICKUP
          ? storeAddress
          : {
              firstName: values.firstName,
              lastName: values.lastName,
              company: values.company || undefined,
              line1: values.line1!.trim(),
              line2: values.line2 || undefined,
              city: values.city!.trim(),
              province: values.province!,
              postalCode: values.postalCode!,
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
          customerNotes: values.customerNotes || undefined,
          mode,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Checkout failed");
      }

      if (
        values.saveAddress &&
        values.shippingMethod !== ShippingMethod.LOCAL_PICKUP &&
        shippingAddress.line1
      ) {
        await fetch(`${getApiBaseUrl()}/api/v1/account/addresses`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...shippingAddress,
            isDefaultShipping: true,
          }),
        }).catch(() => undefined);
      }

      if (values.marketingOptIn) {
        await fetch(`${getApiBaseUrl()}/api/v1/auth/profile`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketingConsent: true }),
        }).catch(() => undefined);
      }

      if (json.data.checkoutUrl) {
        window.location.href = json.data.checkoutUrl as string;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPending(false);
    }
  }

  function onInvalid() {
    const firstError = document.querySelector("[aria-invalid='true']");
    firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const payLabel =
    quote?.totalCents !== undefined
      ? `Continue to secure payment · ${formatCad(quote.totalCents)}`
      : "Continue to secure payment";

  return (
    <section className="bg-[#FAF7F0] py-8 sm:py-12">
      <Container className="max-w-[1280px]">
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-2xl"
        >
          <CheckoutProgress current="information" />
          <h1 className="mt-5 font-serif text-[2rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-[2.35rem]">
            Checkout
          </h1>
          <p className="mt-3 text-[14px] text-[#6B726E]">
            Guest checkout available.{" "}
            <Link
              href="/account/login?next=/checkout"
              className="text-[#003F2D] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{" "}
            if you already have an account.
          </p>
        </motion.header>

        {emptyCart || buyNowBlocked ? (
          <div className="mt-8 border border-[#E5DFD4] bg-white p-8">
            <p className="font-serif text-2xl text-[#003F2D]">
              {buyNowBlocked
                ? "Buy Now selection expired"
                : "Your shopping bag is empty"}
            </p>
            <p className="mt-2 text-sm text-[#6B726E]">
              {buyNowBlocked
                ? "Please return to the product and choose Buy Now again."
                : "Add items before continuing to checkout."}
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex h-11 items-center bg-[#003F2D] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0B513B]"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)] lg:gap-8"
            noValidate
          >
            <div className="space-y-4 lg:order-1">
              {/* Mobile collapsible summary */}
              <div className="border border-[#E5DFD4] bg-white lg:hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  onClick={() => setSummaryOpen((open) => !open)}
                  aria-expanded={summaryOpen}
                >
                  <span className="text-[13px] font-medium text-[#003F2D]">
                    Order summary
                    {quote?.totalCents !== undefined
                      ? ` · ${formatCad(quote.totalCents)}`
                      : ""}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#003F2D] transition",
                      summaryOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {summaryOpen ? (
                    <motion.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#E5DFD4]"
                    >
                      <CheckoutOrderSummary
                        mode={mode}
                        items={summaryItems}
                        quote={quote}
                        quoteLoading={quoteLoading}
                        onQuantityChange={handleSummaryQuantityChange}
                        onApplyCoupon={
                          mode === "cart" ? handleApplyCoupon : undefined
                        }
                        onRemoveCoupon={
                          mode === "cart" ? handleRemoveCoupon : undefined
                        }
                        className="border-0 lg:static"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <CheckoutSection title="Customer information" delay={0.04}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckoutField
                    label="Email address"
                    htmlFor="email"
                    error={form.formState.errors.email?.message}
                    className="sm:col-span-2"
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
                    className="sm:col-span-2"
                  >
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      aria-invalid={Boolean(form.formState.errors.phone)}
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

              <CheckoutSection title="Delivery method" delay={0.08}>
                <div className="grid gap-2.5">
                  {shippingCards.map((card) => {
                    const selected = shippingMethod === card.value;
                    return (
                      <label
                        key={card.value}
                        className={cn(
                          "flex cursor-pointer items-start justify-between gap-4 border px-4 py-3.5 transition",
                          selected
                            ? "border-[#003F2D] bg-[#003F2D]/[0.03]"
                            : "border-[#E5DFD4] bg-white hover:border-[#003F2D]/40"
                        )}
                      >
                        <span className="flex items-start gap-3">
                          <input
                            type="radio"
                            value={card.value}
                            className="mt-1 accent-[#003F2D]"
                            {...form.register("shippingMethod")}
                          />
                          <span>
                            <span className="block text-[13px] font-medium text-[#003F2D]">
                              {card.title}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-[#6B726E]">
                              {card.detail}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] font-medium text-[#003F2D]">
                          {card.priceLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {isPickup ? (
                  <div className="mt-4 border border-[#E5DFD4] bg-[#FAF7F0] px-4 py-4 text-[13px] leading-relaxed text-[#374151]">
                    <p className="font-medium text-[#003F2D]">
                      {settings?.storeName ?? "ONE OF A KIND FASHION"}
                    </p>
                    <p className="mt-1">
                      {settings?.addressLine1 ??
                        "1283 Millbourne Road East NW"}
                      <br />
                      {settings?.city ?? "Edmonton"},{" "}
                      {settings?.province ?? "AB"}{" "}
                      {settings?.postalCode ?? ""}
                      <br />
                      Canada
                    </p>
                    <p className="mt-2">
                      Phone: {settings?.phone ?? "587-937-4570"}
                    </p>
                    <p className="mt-2 text-[#6B726E]">
                      {settings?.shipping.pickupInstructions ??
                        "We will confirm pickup readiness after your order is paid."}
                    </p>
                  </div>
                ) : null}
              </CheckoutSection>

              {!isPickup ? (
                <CheckoutSection title="Shipping address" delay={0.1}>
                  <div className="space-y-3">
                    <CheckoutField
                      label="Company (optional)"
                      htmlFor="company"
                    >
                      <input
                        id="company"
                        autoComplete="organization"
                        className={checkoutInputClass}
                        {...form.register("company")}
                      />
                    </CheckoutField>
                    <CheckoutField
                      label="Street address"
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
                      label="Apartment, suite, or unit (optional)"
                      htmlFor="line2"
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
                          {CANADIAN_PROVINCES.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.name}
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
                        className={cn(checkoutSelectClass, "bg-[#FAF7F0]")}
                        {...form.register("country")}
                      >
                        <option value="Canada">Canada</option>
                      </select>
                    </CheckoutField>
                  </div>
                </CheckoutSection>
              ) : null}

              <CheckoutSection title="Billing address" delay={0.12}>
                <label className="flex items-center gap-2.5 text-sm text-[#003F2D]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#003F2D]"
                    {...form.register("sameAsShipping")}
                  />
                  {isPickup
                    ? "Billing address same as customer details / store pickup"
                    : "Billing address is the same as shipping address"}
                </label>

                <AnimatePresence initial={false}>
                  {!sameAsShipping ? (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
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
                          label="Street address"
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
                        <div className="grid gap-3 sm:grid-cols-3">
                          <CheckoutField
                            label="City"
                            htmlFor="billingCity"
                            error={form.formState.errors.billingCity?.message}
                          >
                            <input
                              id="billingCity"
                              className={checkoutInputClass}
                              {...form.register("billingCity")}
                            />
                          </CheckoutField>
                          <CheckoutField
                            label="Province"
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
                              {CANADIAN_PROVINCES.map((item) => (
                                <option key={item.code} value={item.code}>
                                  {item.name}
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
                              invalid={Boolean(
                                form.formState.errors.billingPostalCode
                              )}
                              {...form.register("billingPostalCode")}
                            />
                          </CheckoutField>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </CheckoutSection>

              <CheckoutSection title="Order notes" delay={0.14}>
                <CheckoutField
                  label="Special instructions (optional)"
                  htmlFor="customerNotes"
                >
                  <textarea
                    id="customerNotes"
                    rows={3}
                    placeholder="Special delivery instructions or requests for your order."
                    className={cn(checkoutInputClass, "h-auto min-h-[88px] py-2.5")}
                    {...form.register("customerNotes")}
                  />
                </CheckoutField>
              </CheckoutSection>

              <CheckoutSection title="Policies" delay={0.16}>
                <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#374151]">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#003F2D]"
                    aria-invalid={Boolean(form.formState.errors.acceptPolicies)}
                    {...form.register("acceptPolicies")}
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/shipping-policy" className="underline-offset-2 hover:underline">
                      shipping
                    </Link>
                    ,{" "}
                    <Link href="/returns" className="underline-offset-2 hover:underline">
                      returns
                    </Link>
                    , and{" "}
                    <Link href="/privacy-policy" className="underline-offset-2 hover:underline">
                      privacy
                    </Link>{" "}
                    policies.
                  </span>
                </label>
                {form.formState.errors.acceptPolicies?.message ? (
                  <p className="mt-2 text-[11px] text-[#B91C1C]" role="alert">
                    {form.formState.errors.acceptPolicies.message}
                  </p>
                ) : null}
                <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed text-[#6B726E]">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#003F2D]"
                    {...form.register("marketingOptIn")}
                  />
                  <span>
                    Send me occasional updates about new arrivals (optional).
                  </span>
                </label>
                {!isPickup && signedIn ? (
                  <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed text-[#6B726E]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[#003F2D]"
                      {...form.register("saveAddress")}
                    />
                    <span>Save this address for future orders.</span>
                  </label>
                ) : null}
              </CheckoutSection>

              {error ? (
                <p
                  className="border border-[#B91C1C]/25 bg-[#FFF5F5] px-4 py-3 text-sm text-[#B91C1C]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending || cartLoading}
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 bg-[#003F2D] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors duration-200",
                  "hover:bg-[#0B513B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A36] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-55"
                )}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing secure payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {payLabel}
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-[#6B726E]">
                You will complete card payment securely with Stripe.
              </p>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.08 }}
              className="hidden lg:order-2 lg:block"
            >
              <CheckoutOrderSummary
                mode={mode}
                items={summaryItems}
                quote={quote}
                quoteLoading={quoteLoading}
                onQuantityChange={handleSummaryQuantityChange}
                onApplyCoupon={
                  mode === "cart" ? handleApplyCoupon : undefined
                }
                onRemoveCoupon={
                  mode === "cart" ? handleRemoveCoupon : undefined
                }
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
        <div className="flex min-h-[40vh] items-center justify-center bg-[#FAF7F0] text-sm text-[#6B726E]">
          Loading checkout…
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
