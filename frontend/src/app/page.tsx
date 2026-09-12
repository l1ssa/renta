import Link from 'next/link';import Image from 'next/image';import ConsultForm from '@/components/ConsultForm';import ServiceIcon from '@/components/ServiceIcon';import {api} from '@/lib/api';

const featured = [
  {slug:'oformlenie-dokumentov',title:'Оформление документов',description:'Поможем собрать и оформить необходимые документы для погребения.',icon:'documents'},
  {slug:'proshchalnyy-zal',title:'Прощальный зал',description:'Подберём и организуем подходящее место для прощания.',icon:'hall'},
  {slug:'ritualnyy-transport',title:'Ритуальный транспорт',description:'Предоставим катафалк и дополнительный транспорт.',icon:'transport'},
  {slug:'organizatsiya-kremacii',title:'Кремация',description:'Услуги кремации и погребения.',icon:'cremation'},
  {slug:'tanatopodgotovka',title:'Танатоподготовка',description:'Гигиенические, косметические и реставрационные процедуры.',icon:'thanato'},
  {slug:'blagoustroystvo-mest-zahoroneniy',title:'Уход за местами захоронения',description:'Благоустройство и уход за местами захоронений.',icon:'care'},
] as const;

async function getServices(){
  try{
    const all = await api<any[]>('/services');
    const bySlug = new Map(all.map((s:any)=>[s.slug,s]));
    return featured.map(f=>({...f,...(bySlug.get(f.slug)||{})}));
  }catch{
    return featured;
  }
}

export default async function Home(){
  const services = await getServices();
  return <main>
    <section className="hero container">
      <div className="heroText">
        <div className="eyebrow">РИТУАЛЬНЫЕ УСЛУГИ · ПЕРМЬ</div>
        <h1>Помогаем достойно<br/>организовать траурные мероприятия</h1>
        <div className="divider"/>
        <p>Возьмём на себя все организационные вопросы, оформление документов, транспорт и подбор необходимых принадлежностей. Сопровождаем вас на каждом этапе.</p>
        <div className="actions">
          <Link className="button dark" href="#consult">Получить консультацию</Link>
          <a className="button light" href="tel:+79504596705"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>&nbsp;Позвонить</a>
        </div>
        <div className="note"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-2.8 8.3-7 10-4.2-1.7-7-5.5-7-10V6l7-3z"/></svg><span><b>Без обязательств.</b><br/>Спокойно обсудим вашу ситуацию и подскажем, с чего начать.</span></div>
      </div>
      <div className="heroImage"><Image src="/images/hero-salon.png" alt="Наш зал ритуальных услуг" fill sizes="(max-width: 900px) 100vw, 58vw" style={{objectFit:'cover'}} priority/></div>
    </section>

    <section className="section" id="services">
      <div className="container">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">НАШИ УСЛУГИ</div>
            <h2>Берём заботы на себя</h2>
          </div>
          <Link href="/services" className="textLink">Все услуги →</Link>
        </div>
        <div className="divider onPaper small"/>
        <p className="sectionIntro">Организуем всё необходимое — от оформления документов до проведения прощания.</p>
        <div className="serviceGrid">
          {services.map((s:any,i)=>
            <Link className="serviceCard" href={`/services/${s.slug}`} key={s.slug||i}>
              <ServiceIcon type={s.icon}/>
              <span>{String(i+1).padStart(2,'0')}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </Link>
          )}
        </div>
      </div>
    </section>

    <section className="process" id="process">
      <div className="container">
        <div className="eyebrow">КАК ВСЁ ПРОХОДИТ</div>
        <h2>Сопровождаем на каждом этапе</h2>
        <div className="steps">
          <div><b>01</b><h3>Связываемся</h3><p>Вы звоните или оставляете заявку. Специалист отвечает и уточняет ситуацию.</p></div>
          <div><b>02</b><h3>Составляем план</h3><p>Обсуждаем необходимые услуги, документы, транспорт и ритуальные принадлежности.</p></div>
          <div><b>03</b><h3>Организуем</h3><p>Берём на себя согласованные организационные вопросы и сопровождаем церемонию.</p></div>
        </div>
      </div>
    </section>

    <section className="consult container" id="consult">
      <div>
        <div className="eyebrow">БЕСПЛАТНАЯ КОНСУЛЬТАЦИЯ</div>
        <h2>Мы поможем разобраться, с чего начать</h2>
        <p>Спокойно обсудим вашу ситуацию и объясним, какие действия необходимы сейчас.</p>
      </div>
      <ConsultForm/>
    </section>
  </main>;
}
