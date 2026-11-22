import { DEFAULT_STORE } from "@ookf/shared";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contact",
  description:
    "Contact ONE OF A KIND FASHION in Edmonton for boutique appointments, orders, and styling help.",
};

export default function ContactPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Boutique"
            title="Contact Us"
            description="Reach the ONE OF A KIND FASHION team for orders, fittings, and styling questions."
          />
          <div className="mt-8 space-y-2 text-sm text-muted">
            <p>{DEFAULT_STORE.addressLine1}</p>
            <p>
              {DEFAULT_STORE.city}, {DEFAULT_STORE.province}, Canada
            </p>
            <p>
              <a href={`tel:${DEFAULT_STORE.phone}`} className="hover:text-green">
                {DEFAULT_STORE.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${DEFAULT_STORE.email}`}
                className="hover:text-green"
              >
                {DEFAULT_STORE.email}
              </a>
            </p>
          </div>
        </div>

        <form className="space-y-4 border border-border bg-white/70 p-6 sm:p-8">
          <Input name="name" placeholder="Your name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="phone" placeholder="Phone" />
          <textarea
            name="message"
            required
            placeholder="How can we help?"
            className="min-h-36 w-full border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
          />
          <Button type="submit" className="w-full sm:w-auto">
            Send message
          </Button>
          <p className="text-xs text-muted">
            Form submissions will connect to the contact API in a later phase.
            For now, email or call the boutique directly.
          </p>
        </form>
      </Container>
    </section>
  );
}
