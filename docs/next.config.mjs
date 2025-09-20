/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/getting-started",
        destination: "/getting-started/django",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
