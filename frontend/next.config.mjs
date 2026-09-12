/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'renta';
const nextConfig = {
  images: {unoptimized: true},
  env: {
    // next/image с unoptimized:true не подставляет basePath в src сам —
    // прокидываем префикс явно, чтобы локальные картинки (public/) грузились
    // из подпапки /renta/ на GitHub Pages.
    NEXT_PUBLIC_BASE_PATH: isGhPages ? `/${repoName}` : '',
  },
  ...(isGhPages ? {
    output: 'export',
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  } : {}),
};
export default nextConfig;
