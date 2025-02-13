// next.config.js
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://21.101.42.160/acceptance/:path*', // HTTP endpoint'iniz
      },
    ];
  },
};
