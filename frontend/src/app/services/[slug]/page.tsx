import Link from 'next/link';
import {notFound} from 'next/navigation';
import {api} from '@/lib/api';
import {fallbackServices} from '@/lib/fallbackData';

async function getServices(){
  try{
    return await api<any[]>('/services');
  }catch{
    return fallbackServices;
  }
}

async function getService(slug:string){
  const services = await getServices();
  return services.find((s:any)=>s.slug===slug) || null;
}

export async function generateStaticParams(){
  const services = await getServices();
  return services.map((s:any)=>({slug:s.slug}));
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
