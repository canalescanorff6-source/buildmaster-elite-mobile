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
          return [
            {
              source: '/sw.js',
              headers: [
                { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' }
              ]
            },
            {
              source: '/manifest.webmanifest',
              headers: [
                { key: 'Cache-Control', value: 'no-cache, must-revalidate' }
              ]
            }
          ];
        }
      })
};

export default nextConfig;
