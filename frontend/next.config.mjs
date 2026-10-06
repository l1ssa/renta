/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'renta';
// Секретный адрес админки (ADMIN_PATH в .env, в сборку попадает как NEXT_PUBLIC_ADMIN_PATH).
const adminPath = (process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '');
const hasSecretAdmin = adminPath !== 'admin';

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
  // На сервере: админка открывается по секретному адресу, а /admin не отдаётся.
  // На GitHub Pages (статическая сборка) rewrites не поддерживаются, поэтому здесь их нет.
  ...(!isGhPages && hasSecretAdmin ? {
    async rewrites() {
      return [
        { source: `/${adminPath}`, destination: '/admin' },
        { source: `/${adminPath}/:path*`, destination: '/admin/:path*' },
      ];
    },
    async redirects() {
      return [
        { source: '/admin', destination: '/', permanent: false },
        { source: '/admin/:path*', destination: '/', permanent: false },
      ];
    },
  } : {}),
};
export default nextConfig;
