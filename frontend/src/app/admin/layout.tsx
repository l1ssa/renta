import type { ReactNode } from 'react';
import './admin.scss';

// Админку не должны индексировать поисковики.
export const metadata = {
  title: 'Управление сайтом',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
