"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { FOOTER_TAGLINE } from "@/lib/store-settings";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 9h2.5V6.2C16.1 5.9 15 5.5 13.7 5.5 11.1 5.5 9.5 7.1 9.5 10v2H7v3h2.5V21h3.2v-6H15l.5-3h-2.8v-1.6c0-.8.3-1.4 1.3-1.4Z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M11.2 17.8c.3-1.2.6-2.4.9-3.6.1-.5 0-.9-.3-1.2-.4-.4-1-.3-1.3.2-.5.8-.4 2 .2 2.8.8 1.1 2.2 1.4 3.4.8 1.5-.7 2.4-2.4 2.2-4.1-.2-2.1-1.9-3.6-4-3.5-2.2.1-3.8 1.9-3.7 4.1 0 .7.2 1.4.5 2" />
    </svg>
  );
}

type SocialLinks = {
  instagram: string | null;
  facebook: string | null;
  pinterest: string | null;
};

function isValidHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function FooterBrand({
  storeName,
  socialLinks,
}: {
  storeName: string;
  socialLinks: SocialLinks;
}) {
  const socials = (
    [
      {
        key: "instagram",
        href: socialLinks.instagram,
        label: "Instagram",
        icon: InstagramIcon,
      },
      {
        key: "facebook",
        href: socialLinks.facebook,
        label: "Facebook",
        icon: FacebookIcon,
      },
      {
        key: "pinterest",
        href: socialLinks.pinterest,
        label: "Pinterest",
        icon: PinterestIcon,
      },
    ] as const
  ).flatMap((item) =>
    isValidHttpUrl(item.href) ? [{ ...item, href: item.href }] : []
  );

  return (
    <div className="max-w-[16.5rem]">
      <Link
        href="/"
        aria-label={`${storeName} home`}
        className="group inline-flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A25]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F4EE]"
      >
        <span className="font-serif text-[1.75rem] leading-[1.02] tracking-[0.01em] text-[#B68A25] sm:text-[1.95rem]">
          ONE OF A KIND
        </span>
        <span className="mt-2.5 flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-px w-6 bg-[#B68A25]/70 transition-colors group-hover:bg-[#B68A25]"
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B68A25]">
            Fashion
          </span>
          <span
            aria-hidden
            className="h-px w-6 bg-[#B68A25]/70 transition-colors group-hover:bg-[#B68A25]"
          />
        </span>
      </Link>

      <p className="mt-4 max-w-[15rem] text-[13px] leading-relaxed text-[#5C6864]">
        {FOOTER_TAGLINE}
      </p>

      {socials.length > 0 ? (
        <ul className="mt-6 flex items-center gap-2.5">
          {socials.map((social) => {
            const Icon = social.icon;
            return (
              <li key={social.key}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full",
                    "border border-[#003F2D]/15 bg-[#003F2D]/[0.06] text-[#003F2D]",
                    "transition duration-200",
                    "hover:-translate-y-0.5 hover:border-[#003F2D]/30 hover:bg-[#003F2D] hover:text-[#F7F4EE]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A25]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F4EE]",
                    "motion-reduce:hover:translate-y-0"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
