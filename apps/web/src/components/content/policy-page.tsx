import Link from "next/link";
import { DEFAULT_STORE } from "@ookf/shared";
import { Container } from "@/components/ui/container";

export function PolicyPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16">
      <Container className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C49A36]">
          Customer care
        </p>
        <h1 className="mt-3 font-serif text-[2.1rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-[2.5rem]">
          {title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6B726E]">
          {description}
        </p>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[#374151]">
          {children}
        </div>
        <div className="mt-10 border-t border-[#E5DFD4] pt-6 text-sm text-[#6B726E]">
          <p>
            Questions? Call{" "}
            <a
              href={`tel:${DEFAULT_STORE.phone}`}
              className="font-medium text-[#003F2D] underline-offset-4 hover:underline"
            >
              {DEFAULT_STORE.phone}
            </a>{" "}
            or email{" "}
            <a
              href={`mailto:${DEFAULT_STORE.email}`}
              className="font-medium text-[#003F2D] underline-offset-4 hover:underline"
            >
              {DEFAULT_STORE.email}
            </a>
            .
          </p>
          <p className="mt-3">
            <Link
              href="/contact"
              className="font-medium text-[#003F2D] underline-offset-4 hover:underline"
            >
              Contact the boutique
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-[#003F2D]">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
