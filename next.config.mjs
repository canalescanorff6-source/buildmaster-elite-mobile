const isAndroidStatic = process.env.BUILDMASTER_ANDROID_STATIC === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
