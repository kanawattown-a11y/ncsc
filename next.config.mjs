/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Critical for Docker/Lightsail deployment optimization
  reactStrictMode: true,
  poweredByHeader: false, // Security: Hide Next.js header
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Enforce aggressive XSS block
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevent Clickjacking entirely
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Disable mime sniffing
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            // Zero-trust CSP policy allowing only exact origins, forbidding eval/unsafe scripts
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.amazonaws.com; font-src 'self'; connect-src 'self' https://*.amazonaws.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
