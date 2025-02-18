// next.config.js
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://37.75.12.56/acceptance/:path*', // HTTP endpoint'iniz
      },
    ];
  },
};
