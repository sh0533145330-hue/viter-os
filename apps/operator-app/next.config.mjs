/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: [
    '@vita/ui', '@vita/observability', '@vita/config',
    '@vita/integrations', '@vita/agents-builtin', '@vita/blocks-builtin',
    '@vita/agents', '@vita/core', '@vita/connector-sdk',
    '@vita/pack-sdk', '@vita/packs-seed', '@vita/ontology',
  ],
  webpack(config) {
    // Allow TypeScript packages that use .js extension in imports to resolve correctly
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
