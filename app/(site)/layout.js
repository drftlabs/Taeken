import ShopProvider from "@/components/ShopProvider";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { getSettings, getCollections } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }) {
  const [settings, collections] = await Promise.all([getSettings(), getCollections()]);
  return (
    <ShopProvider shipping={{ min: Number(settings.free_shipping_min), fee: Number(settings.shipping_fee) }}>
      <div className="grain" aria-hidden="true" />
      <a className="skip" href="#main">Skip to content</a>
      <Header ticker={<Ticker items={settings.ticker} />} />
      <main id="main">{children}</main>
      <Footer settings={settings} collections={collections} />
      <CartDrawer />
    </ShopProvider>
  );
}
