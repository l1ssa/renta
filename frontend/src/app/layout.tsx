import './globals.scss';
import SiteChrome from '@/components/SiteChrome';

export const metadata = {
  title: 'Рента — ритуальные услуги в Перми',
  description: 'Организация похорон и ритуальные услуги в Перми.',
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
