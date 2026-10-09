import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/siteUrl';

// Список страниц собирается при каждом запросе, чтобы новые услуги, добавленные
// в админке, сразу попадали в карту сайта. На статической сборке для GitHub
// Pages так нельзя — там список собирается один раз при сборке.
export const dynamic = process.env.GITHUB_PAGES === 'true' ? 'force-static' : 'force-dynamic';

async function serviceSlugs(): Promise<string[]> {
  try {
    const items = await api<{ slug?: string }[]>('/services');
    return items.map(i => i.slug).filter((s): s is string => !!s);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ['/', '/services', '/products', '/packages', '/about', '/contacts', '/privacy-policy', '/oferta'];
  const services = await serviceSlugs();
  const paths = [...fixed, ...services.map(s => `/services/${s}`)];
  return paths.map(p => ({ url: `${SITE_URL}${p === '/' ? '' : p}`, lastModified: new Date() }));
}
