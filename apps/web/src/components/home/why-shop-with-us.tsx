"use client";

import { Store, ShieldCheck } from "lucide-react";
import {
  FeatureCard,
  HangerIcon,
  type FeatureCardItem,
} from "@/components/home/feature-card";
import { WhyShopHeading } from "@/components/home/why-shop-heading";
import { Container } from "@/components/ui/container";

const FEATURES: FeatureCardItem[] = [
  {
    title: "Curated Ethnic Wear",
    description:
      "Thoughtfully selected lehengas, suits, and jewellery for Canadian celebrations.",
    icon: HangerIcon,
  },
  {
    title: "Edmonton Boutique Care",
    description:
      "Local pickup and personalised guidance from our Millbourne Road East location.",
    icon: Store,
  },
  {
    title: "Secure CAD Checkout",
    description:
      "Canadian addressing, configurable tax rules, and Stripe-powered payments.",
    icon: ShieldCheck,
  },
];

export function WhyShopWithUs() {
  return (
    <section
      aria-labelledby="why-shop-heading"
      className="bg-[#FCF9F3] py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <WhyShopHeading />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} item={feature} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
