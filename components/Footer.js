import Link from "next/link";
import { POLICY_LIST } from "@/lib/legalDefaults";

export default function Footer({ settings, collections }) {
  const ig = settings.instagram;
  return (
    <footer id="footer">
      <div className="checker" aria-hidden="true" />
      <div className="f-top">
        <div className="f-brand">
          <Link className="logo" href="/" aria-label="Taeken, back to top"><img src="/logo.png" alt="Taeken" width="76" height="46" /></Link>
          <a className="ig" href={ig ? `https://instagram.com/${ig}` : "#"} target={ig ? "_blank" : undefined} rel="noopener" aria-label="Taeken on Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg><span>{ig ? "@" + ig : "Instagram"}</span>
          </a>
        </div>
        <div className="f-cols">
          <div><h4>Shop</h4><Link href="/collections/all">All sneakers</Link>{collections.map((c) => <Link key={c.id} href={`/collections/${c.slug}`}>{c.name}</Link>)}</div>
          <div><h4>Taeken</h4><Link href="/our-story">Our story</Link><Link href="/contact">Contact us</Link><Link href="/complaint">Raise a complaint</Link><Link href="/track">Track order</Link><Link href="/account">Account / Log in</Link></div>
          <div><h4>Legal</h4>{POLICY_LIST.map((p) => <Link key={p.slug} href={`/policies/${p.slug}`}>{p.title}</Link>)}</div>
        </div>
      </div>
      <div className="f-bot"><span>© {new Date().getFullYear()} {settings.business_name}. Make your mark.</span><span>India · INR ₹ · Payments by Razorpay</span></div>
      <div className="f-kana" aria-hidden="true"><span>テイケン</span><i /><span>街</span><i /><span>闘</span><i /><span>走</span></div>
      <div className="f-big" aria-hidden="true">Make your mark</div>
    </footer>
  );
}
