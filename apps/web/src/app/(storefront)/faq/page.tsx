import { DEFAULT_STORE } from "@ookf/shared";
import {
  PolicyPage,
  PolicySection,
} from "@/components/content/policy-page";

export const metadata = {
  title: "FAQs",
  description:
    "Frequently asked questions about shopping with ONE OF A KIND FASHION in Edmonton.",
};

export default function FaqPage() {
  return (
    <PolicyPage
      title="Frequently asked questions"
      description="Helpful answers about orders, pickup, sizing, and boutique shopping."
    >
      <PolicySection title="Do I need an account to checkout?">
        <p>
          No. Guest checkout is available. You may sign in if you already have
          an account so we can prefill your details.
        </p>
      </PolicySection>
      <PolicySection title="Where is the boutique?">
        <p>
          {DEFAULT_STORE.name} is at {DEFAULT_STORE.addressLine1},{" "}
          {DEFAULT_STORE.city}, {DEFAULT_STORE.province}, Canada.
        </p>
      </PolicySection>
      <PolicySection title="Is local pickup available?">
        <p>
          Yes, when enabled at checkout. After your order is paid we confirm
          pickup readiness by phone or email.
        </p>
      </PolicySection>
      <PolicySection title="What payment methods do you accept?">
        <p>
          Payments are processed securely through Stripe. Available card and
          wallet options depend on what Stripe enables for our store.
        </p>
      </PolicySection>
      <PolicySection title="How do I get sizing help?">
        <p>
          Contact us before ordering if you need guidance. Product pages list
          available sizes and colours for each piece.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
