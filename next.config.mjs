/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  async rewrites() {
    return [
      {
        source: '/app',
        destination: '/workspace/index.html',
      },
      {
        source: '/app/:path*',
        destination: '/workspace/:path*',
      },
    ];
  },
};
export default nextConfig;
