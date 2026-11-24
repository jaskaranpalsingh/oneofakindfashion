import { ContactPageView } from "@/components/contact/contact-page";
import { fetchPublicStoreSettings } from "@/lib/store-settings";

export const metadata = {
  title: "Contact",
  description:
    "Contact ONE OF A KIND FASHION in Edmonton for boutique appointments, orders, and styling help.",
};

export default async function ContactPage() {
  const settings = await fetchPublicStoreSettings();
  return <ContactPageView settings={settings} />;
}
