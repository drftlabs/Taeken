import ShopProvider from "@/components/ShopProvider";
import Header from "@/components/Header";
import PageGuard from "@/components/PageGuard";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TrustBar from "@/components/TrustBar";
import QuickCheckout from "@/components/QuickCheckout";
import { shippingCfg } from "@/lib/pricing";
import { getSettings, getCollections } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }) {
  const [settings, collections] = await Promise.all([getSettings(), getCollections()]);
  return (
    <ShopProvider shipping={shippingCfg(settings)}>
      <div className="grain" aria-hidden="true" />
      <div className="rail" aria-hidden="true"><span>TAEKEN ◆ 街の闘い ◆ MAKE YOUR MARK ◆ INDIA</span></div>
      <a className="skip" href="#main">Skip to content</a>
      <PageGuard />
      <Header ticker={<Ticker items={settings.ticker} />} />
      <main id="main">{children}</main>
      <TrustBar s={settings} />
      <Footer settings={settings} collections={collections} />
      <CartDrawer />
      <QuickCheckout />
      {settings.whatsapp && <a className="wa" href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hi Taeken, I need help with ")}`} target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" /><path d="M8.7 8.4c.3 2.6 2.6 5.3 6 6.3l1.3-1.4-1.9-1-.9.7c-.9-.4-1.8-1.3-2.2-2.2l.7-.9-1-1.9z" fill="currentColor" stroke="none" /></svg></a>}
    </ShopProvider>
  );
}
