"use client";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MainHeader } from "@/components/layout/main-header";

export function SiteHeader({
  announcement,
}: {
  announcement?: string;
}) {
  return (
    <header className="header-shell sticky top-0 z-50">
      <AnnouncementBar text={announcement} />
      <MainHeader />
      <DesktopNavigation />
      <div className="header-gold-bottom relative z-10" />
    </header>
  );
}
