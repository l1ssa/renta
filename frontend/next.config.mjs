/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'renta';
const nextConfig = {
  images: {unoptimized: true},
  ...(isGhPages ? {
    output: 'export',
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  } : {}),
};
export default nextConfig;
