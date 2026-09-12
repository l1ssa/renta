import Link from 'next/link';
import {api, imageUrl} from '@/lib/api';

const fallbackText = 'Мы помогаем семьям достойно организовать прощание и берём на себя организационные вопросы в непростой момент. Раздел наполняется — подробнее о салоне, команде и подходе к работе расскажем здесь совсем скоро.';

async function getAbout(){
  try{
    const items = await api<any[]>('/about');
    return items[0] || null;
  }catch{
    return null;
  }
}

export default async function About(){
  const about = await getAbout();
  const text = about?.text || fallbackText;
  const images:string[] = about?.images || [];
  return (
    <main className="inner container">
      <div className="eyebrow">РИТУАЛЬНЫЕ УСЛУГИ · ПЕРМЬ</div>
      <h1>О салоне</h1>
      <p className="lead">{text}</p>
      {images.length>0 &&
        <div className="aboutGallery">
          {images.map((img,i)=><img key={i} src={imageUrl(img)} alt="О салоне"/>)}
        </div>
      }
      <div className="ctaBox">
        <div className="eyebrow">НУЖНА ПОМОЩЬ</div>
        <h2>Обсудим ситуацию без обязательств</h2>
        <Link href="/#consult" className="button dark">Получить консультацию</Link>
      </div>
    </main>
  );
}
