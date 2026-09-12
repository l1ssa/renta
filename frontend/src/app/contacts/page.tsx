const ADDRESS = 'г. Пермь, ул. Мира, 59';
const LON = '56.175654';
const LAT = '57.975000';

export default function Contacts(){return <main className="inner container"><div className="eyebrow">КОНТАКТЫ</div><h1>Мы рядом</h1><div className="contactGrid"><div><h2>ООО «РЕНТА»</h2><p>{ADDRESS}</p><p><b><a href="tel:+79504596705">8 950 459-67-05</a></b><br/><b><a href="tel:+79504622731">8 950 462-27-31</a></b><br/>Круглосуточно</p><p><a href="mailto:renta_fs@mail.ru">renta_fs@mail.ru</a></p></div><div><iframe className="mapFrame" src={`https://yandex.ru/map-widget/v1/?ll=${LON}%2C${LAT}&z=17&pt=${LON},${LAT},pm2rdm`} title="Карта проезда" loading="lazy"/></div></div></main>}
