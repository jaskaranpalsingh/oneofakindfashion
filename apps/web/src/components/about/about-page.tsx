"use client";

import { AboutFashionImage } from "@/components/about/about-fashion-image";
import { AboutStory } from "@/components/about/about-story";
import { VisitUs } from "@/components/about/visit-us";
import type { PublicStoreSettings } from "@/lib/store-settings";

export function AboutPageView({
  settings,
}: {
  settings: PublicStoreSettings;
}) {
  return (
    <main className="bg-[#FAF8F3]">
      <section className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-12 lg:px-12 lg:pb-14 lg:pt-14 xl:px-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14 xl:gap-16">
          <AboutStory />
          <div className="lg:pt-2">
            <AboutFashionImage />
          </div>
        </div>

        <div className="mt-12 sm:mt-14 lg:mt-16">
          <VisitUs
            addressLine1={settings.addressLine1}
            city={settings.city}
            province={settings.province}
            country={settings.country}
            phone={settings.phone}
            email={settings.email}
          />
        </div>
      </section>
    </main>
  );
}
