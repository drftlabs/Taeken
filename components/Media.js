import Link from "next/link";

// Image slot: shows the uploaded image, or a clean dark placeholder until one is added in admin.
export function Media({ src, mobile, alt = "", position = "50% 50%", ghost = "", tag = "" }) {
  return (
    <div className={"media" + (src ? " has-img" : "")} style={{ "--pos": position }}>
      {!src && <div className="ph">{ghost && <span className="ghost" aria-hidden="true">{ghost}</span>}{tag && <span className="idtag">{tag}</span>}</div>}
      {src && (mobile ? (
        <picture><source media="(max-width:600px)" srcSet={mobile} /><img src={src} alt={alt} loading="lazy" decoding="async" /></picture>
      ) : <img src={src} alt={alt} loading="lazy" decoding="async" />)}
    </div>
  );
}

export function SmartLink({ href = "#", children, ...rest }) {
  if (/^(https?:|mailto:|tel:)/.test(href)) return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" {...rest}>{children}</a>;
  return <Link href={href} {...rest}>{children}</Link>;
}

export const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const lines = (t = "") => String(t).split("|").map((l, i) => <span key={i}>{l}</span>);
