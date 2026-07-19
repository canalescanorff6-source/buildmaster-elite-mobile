const isAndroidStatic = process.env.BUILDMASTER_ANDROID_STATIC === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // O workflow executa `npm run typecheck` antes do build. No export Android,
  // evitamos repetir a mesma verificação dentro do Next.js, que pode manter
  // o worker aberto em alguns runners mesmo após o TypeScript já ter passado.
  typescript: { ignoreBuildErrors: isAndroidStatic },
  ...(isAndroidStatic
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true }
      }
    : {
        async headers() {
          const securityHeaders = [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
          ];
          return [
            { source: '/(.*)', headers: securityHeaders },
            {
              source: '/sw.js',
              headers: [
                ...securityHeaders,
                { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' }
              ]
            },
            {
              source: '/manifest.webmanifest',
              headers: [
                ...securityHeaders,
                { key: 'Cache-Control', value: 'no-cache, must-revalidate' }
              ]
            }
          ];
        }
      })
};

export default nextConfig;
