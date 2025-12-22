/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
  images: {
    // Disable built-in optimization so external images from any domain work without explicit domains
    unoptimized: true,
    // Also allow any https hostname via a wildcard remotePattern
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;