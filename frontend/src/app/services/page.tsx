import Link from 'next/link';
import {api} from '@/lib/api';
import {fallbackServices} from '@/lib/fallbackData';

export default async function Services(){
  let services:any[] = fallbackServices;
  try{ services = await api<any[]>('/services'); }catch{}
  return (
    <main className="inner container">
      <div className="eyebrow">РИТУАЛЬНЫЕ УСЛУГИ · ПЕРМЬ</div>
      <h1>Услуги</h1>
      <p className="lead">Помогаем организовать похороны, кремацию и другие необходимые процедуры. Состав услуги можно обсудить с сотрудником индивидуально.</p>
      <div className="allServices">
        {services.map((s:any)=>
          <article key={s.id}>
            <span>{s.number}</span>
            <h2><Link href={`/services/${s.slug}`}>{s.title}</Link></h2>
            <p>{s.description}</p>
          </article>
        )}
      </div>
      <div className="ctaBox">
        <div className="eyebrow">НУЖНА ПОМОЩЬ</div>
        <h2>Обсудим ситуацию без обязательств</h2>
        <Link href="/#consult" className="button dark">Получить консультацию</Link>
      </div>
    </main>
  );
}
