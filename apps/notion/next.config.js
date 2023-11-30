/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['elba-sdk'],
  env: {
    CLIENT_ID: '',
    REDIRECT_URI: '',
    SOURCE_BASE_URL: '',
    API_URL: ''
  }
};

module.exports = nextConfig;
