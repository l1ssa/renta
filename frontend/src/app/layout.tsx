import './globals.scss';
import SiteChrome from '@/components/SiteChrome';
import { SITE_URL } from '@/lib/siteUrl';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Рента — ритуальные услуги в Перми',
  description: 'Организация похорон и ритуальные услуги в Перми.',
  // Код подтверждения прав на сайт в Яндекс.Вебмастере (YANDEX_VERIFICATION в .env).
  // Без него поле просто не выводится, ошибки не будет.
  ...(process.env.YANDEX_VERIFICATION ? { verification: { yandex: process.env.YANDEX_VERIFICATION } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
