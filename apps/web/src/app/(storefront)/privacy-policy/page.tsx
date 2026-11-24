import {
  PolicyPage,
  PolicySection,
} from "@/components/content/policy-page";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How ONE OF A KIND FASHION collects and uses customer information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      description="We respect your privacy and only use personal information to operate the boutique and fulfil orders."
    >
      <PolicySection title="Information we collect">
        <p>
          When you shop with us we may collect contact details, shipping and
          billing addresses, order history, and messages you send to the
          boutique. Payment card details are handled by Stripe and are not
          stored on our servers.
        </p>
      </PolicySection>
      <PolicySection title="How we use information">
        <p>
          We use your information to process orders, arrange shipping or
          pickup, provide customer support, improve the website, and send order
          updates. Marketing messages are only sent when you opt in.
        </p>
      </PolicySection>
      <PolicySection title="Sharing">
        <p>
          We share information with service providers needed to run the store,
          such as payment processing, email delivery, and shipping carriers.
          We do not sell your personal information.
        </p>
      </PolicySection>
      <PolicySection title="Your choices">
        <p>
          You may request access to or correction of your account information,
          and you may unsubscribe from marketing emails at any time. Contact us
          if you have a privacy question.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}