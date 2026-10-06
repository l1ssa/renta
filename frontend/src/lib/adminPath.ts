// Публичный адрес админки. Задаётся переменной ADMIN_PATH в .env (в сборку попадает
// как NEXT_PUBLIC_ADMIN_PATH). По умолчанию "admin". Если задан другой адрес,
// /admin отвечает переадресацией на главную, а панель открывается по секретному
// адресу — next.config.mjs подменяет его на внутренний маршрут /admin.
const raw = (process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '');

export const ADMIN_PATH = '/' + raw;
export const ADMIN_LOGIN = ADMIN_PATH + '/login';

export function isAdminUrl(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === ADMIN_PATH || pathname.startsWith(ADMIN_PATH + '/') || pathname === '/admin' || pathname.startsWith('/admin/');
}
