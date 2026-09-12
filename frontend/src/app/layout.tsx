import './globals.scss';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
