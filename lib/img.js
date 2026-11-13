// Serves Supabase Storage photos through the Next/Vercel image optimizer (resized + WebP + cached on Vercel's CDN),
// so Supabase is hit once per photo instead of on every page view. Other URLs are returned untouched.
const WIDTHS = [256, 384, 640, 750, 828, 1080, 1200, 1920];
export function optimg(url, w = 828) {
  if (!url || typeof url !== "string") return url;
  if (!/\/storage\/v1\/object\/public\//.test(url) || /\.(svg|gif)(\?|$)/i.test(url)) return url;
  const x = WIDTHS.find((v) => v >= w) || 1920;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${x}&q=75`;
}
