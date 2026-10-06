'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { isAdminUrl } from '@/lib/adminPath';

// Админка — отдельная панель внутри сайта. Публичные шапка и подвал там не
// нужны и только мешают, поэтому на её адресах они не выводятся.
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isAdminUrl(pathname)) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
