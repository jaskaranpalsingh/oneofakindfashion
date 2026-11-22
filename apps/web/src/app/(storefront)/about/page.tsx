import { AboutPageView } from "@/components/about/about-page";
import { fetchPublicStoreSettings } from "@/lib/store-settings";

export const metadata = {
  title: "About Us",
  description:
    "Learn about ONE OF A KIND FASHION, an Edmonton boutique for Indian ethnic clothing and jewellery.",
};

export default async function AboutPage() {
  const settings = await fetchPublicStoreSettings();
  return <AboutPageView settings={settings} />;
}
