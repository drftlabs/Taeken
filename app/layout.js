import "./globals.css";
import "./pages.css";
import { SITE_URL } from "@/lib/format";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TAEKEN — Make Your Mark", template: "%s | TAEKEN" },
  description: "Taeken is an Indian-born streetwear sneaker brand. Distinctive design, everyday wearability, accessible price. Make your mark.",
  openGraph: { siteName: "Taeken", type: "website", locale: "en_IN", url: SITE_URL },
  twitter: { card: "summary_large_image" },
};
export const viewport = { themeColor: "#1a1a1b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700;800&family=Permanent+Marker&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@900&text=%E3%82%8A%E3%82%A4%E3%82%B1%E3%83%86%E3%83%B3%E4%BD%8E%E5%8E%9A%E5%8F%A4%E5%AD%90%E5%B1%8B%E5%BD%A2%E6%B1%BA%E7%89%A9%E8%A1%97%E8%AA%9E%E8%AA%AD%E8%B5%B0%E8%BE%BC%E8%BF%B7%E9%80%9F%E9%97%98%E9%AB%98%E9%AD%82&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
