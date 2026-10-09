// Публичный адрес сайта для sitemap/robots. Кириллический домен приводится к
// punycode (new URL), так его одинаково принимают Яндекс и Google.
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://рента-пермь.рф').origin;
