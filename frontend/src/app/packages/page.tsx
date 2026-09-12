import Link from 'next/link';

export default function Packages(){
  return (
    <main className="inner container">
      <div className="eyebrow">РИТУАЛЬНЫЕ УСЛУГИ · ПЕРМЬ</div>
      <h1>Пакеты услуг</h1>
      <p className="lead">Мы собираем готовые пакеты услуг для разных ситуаций, чтобы вам не пришлось согласовывать каждую деталь отдельно. Раздел наполняется — подробный состав и стоимость пакетов скоро появятся здесь.</p>
      <div className="ctaBox">
        <div className="eyebrow">НУЖНА ПОМОЩЬ</div>
        <h2>Обсудим ситуацию без обязательств</h2>
        <Link href="/#consult" className="button dark">Получить консультацию</Link>
      </div>
    </main>
  );
}
