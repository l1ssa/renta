const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8080/api';
export const API_ROOT=API.replace(/\/api\/?$/,'');

// В статической сборке для GitHub Pages бэкенда во время build нет —
// данные запекаются один раз, поэтому кэш fetch нельзя принудительно
// отключать (иначе Next.js посчитает страницу динамической и не сможет
// экспортировать её в статику).
const IS_STATIC_EXPORT = process.env.GITHUB_PAGES==='true';

export async function api<T>(path:string, options?:RequestInit):Promise<T>{
  const r=await fetch(`${API}${path}`,{
    ...options,
    credentials:'include',
    headers:{'Content-Type':'application/json',...(options?.headers||{})},
    ...(IS_STATIC_EXPORT ? {} : {cache:'no-store' as RequestCache}),
  });
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}

// Загрузка файла отдельным запросом (без JSON-заголовка — браузер сам
// проставит multipart/form-data с нужным boundary).
export async function uploadFile(file:File):Promise<{url:string}>{
  const fd=new FormData();
  fd.append('file',file);
  const r=await fetch(`${API}/upload`,{method:'POST',body:fd,credentials:'include'});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}

export function imageUrl(path?:string):string{
  if(!path)return '';
  return path.startsWith('http')?path:`${API_ROOT}${path}`;
}

export {API};
