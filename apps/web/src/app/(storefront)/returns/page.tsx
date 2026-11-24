import {
  PolicyPage,
  PolicySection,
} from "@/components/content/policy-page";

export const metadata = {
  title: "Returns",
  description:
    "Return and exchange information for ONE OF A KIND FASHION purchases.",
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Returns & exchanges"
      description="Please review these guidelines before requesting a return or exchange."
    >
      <PolicySection title="Eligibility">
        <p>
          Return and exchange eligibility depends on the item condition,
          category, and whether the piece was custom-ordered or final sale.
          Contact us as soon as possible after delivery if you need assistance.
        </p>
      </PolicySection>
      <PolicySection title="How to start a return">
        <p>
          Reach out with your order number and reason for the request. We will
          confirm whether a return or exchange can be arranged and provide next
          steps.
        </p>
      </PolicySection>
      <PolicySection title="Refunds">
        <p>
          Approved refunds are issued to the original payment method after we
          receive and inspect the returned item. Processing times depend on your
          bank or card issuer.
        </p>
      </PolicySection>
      <PolicySection title="Final sale items">
        <p>
          Sale items, custom orders, and pieces marked final sale may not be
          eligible for return. Product and checkout details indicate any special
          conditions when applicable.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
