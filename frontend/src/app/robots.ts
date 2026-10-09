import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteUrl';
import { ADMIN_PATH } from '@/lib/adminPath';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', ADMIN_PATH] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
