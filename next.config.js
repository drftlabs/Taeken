/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" }],
    minimumCacheTTL: 31536000,
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
