import Link from 'next/link';
import {notFound} from 'next/navigation';
import {api} from '@/lib/api';

async function getService(slug:string){
  try{
    const services = await api<any[]>('/services');
    return services.find((s:any)=>s.slug===slug) || null;
  }catch{
    return null;
  }
}

export async function generateMetadata({params}:{params:{slug:string}}){
  const s = await getService(params.slug);
  if(!s) return {title:'Услуга не найдена — РЕНТА'};
  return {
    title: s.seoTitle || `${s.title} — РЕНТА`,
    description: s.seoDescription || s.description,
  };
}

export default async function ServicePage({params}:{params:{slug:string}}){
  const s = await getService(params.slug);
  if(!s) return notFound();
  return (
    <main className="inner container">
      <div className="eyebrow">УСЛУГА {s.number ? `· №${s.number}` : ''}</div>
      <h1>{s.title}</h1>
      <p className="lead">{s.description}</p>
      <div className="ctaBox">
        <div className="eyebrow">НУЖНА ПОМОЩЬ</div>
        <h2>Обсудим ситуацию без обязательств</h2>
        <Link href="/#consult" className="button dark">Получить консультацию</Link>
      </div>
    </main>
  );
}
