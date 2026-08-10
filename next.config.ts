import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  devIndicators: false,
  // Geliştirme sırasında telefondan yerel ağ üzerinden test edebilmek için.
  // Next.js 16, güvenlik amacıyla dev sunucusuna farklı origin'lerden gelen
  // istekleri (JS/CSS dosyaları dahil) varsayılan olarak engelliyor — bu
  // olmadan telefonda sayfa görünür ama hiçbir buton çalışmaz.
  allowedDevOrigins: ['172.20.10.*', '192.168.*.*', '10.*.*.*'],
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseHost,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
};

export default nextConfig;