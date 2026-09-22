// Демо-данные для статической сборки (GitHub Pages), когда бэкенд недоступен
// во время build. Совпадает с backend/data/*.json — держите в синхроне при
// правке содержимого услуг/товаров по умолчанию.

export const fallbackServices = [
  {id:'1', number:'01', title:'Оформление документов', description:'Оформление документов для погребения и помощь на каждом необходимом этапе.', slug:'oformlenie-dokumentov'},
  {id:'2', number:'02', title:'Прощальный зал', description:'Подбор и подготовка пространства для траурной церемонии.', slug:'proshchalnyy-zal'},
  {id:'3', number:'03', title:'Отпевание и панихида', description:'Организация отпевания и панихиды с учётом пожеланий семьи.', slug:'otpevanie-i-panihida'},
  {id:'4', number:'04', title:'Ритуальный транспорт', description:'Катафалк и дополнительный транспорт для организации перевозок.', slug:'ritualnyy-transport'},
  {id:'5', number:'05', title:'Подготовка места захоронения', description:'Подготовка места и организация необходимых работ перед захоронением.', slug:'podgotovka-mesta-zahoroneniya'},
  {id:'6', number:'06', title:'Доставка принадлежностей', description:'Доставка ритуальных принадлежностей в согласованное место и время.', slug:'dostavka-prinadlezhnostey'},
  {id:'7', number:'07', title:'Услуги церемониймейстера', description:'Тактичное сопровождение и координация прощальной церемонии.', slug:'uslugi-tseremoniymeystera'},
  {id:'8', number:'08', title:'Похоронное обеспечение', description:'Комплекс организационных услуг для проведения похорон.', slug:'pohoronnoe-obespechenie'},
  {id:'9', number:'09', title:'Эвакуация умерших', description:'Организация перевозки умершего в морг.', slug:'evakuatsiya-umershih'},
  {id:'10', number:'10', title:'Танатоподготовка', description:'Гигиенические, косметические и реставрационные процедуры.', slug:'tanatopodgotovka'},
  {id:'11', number:'11', title:'Эксгумация и перезахоронение', description:'Организация работ по эксгумации и перезахоронению.', slug:'ekshumatsiya-i-perezahoronenie'},
  {id:'12', number:'12', title:'Документы на компенсации и выплаты', description:'Помощь в подготовке документов на получение компенсаций и выплат, в том числе СВО.', slug:'dokumenty-na-kompensatsii-i-vyplaty'},
  {id:'13', number:'13', title:'Благоустройство мест захоронений', description:'Уход, благоустройство и поддержание мест захоронений.', slug:'blagoustroystvo-mest-zahoroneniy'},
  {id:'14', number:'14', title:'Организация кремации', description:'Услуги кремации и погребения.', slug:'organizatsiya-kremacii'},
];

export const fallbackProducts = [
  {id:'1', category:'Гробы', title:'Ритуальные гробы', description:'Каталог гробов различных моделей и вариантов отделки.', price:'', priceOnRequest:true, images:[] as string[], active:true},
  {id:'2', category:'Венки', title:'Ритуальные венки', description:'Венки и композиции для церемонии прощания.', price:'', priceOnRequest:true, images:[] as string[], active:true},
  {id:'3', category:'Текстиль', title:'Ритуальный текстиль', description:'Необходимые текстильные принадлежности для церемонии.', price:'', priceOnRequest:true, images:[] as string[], active:true},
  {id:'4', category:'Принадлежности', title:'Ритуальные принадлежности', description:'Основные принадлежности для организации похорон.', price:'', priceOnRequest:true, images:[] as string[], active:true},
  {id:'5', category:'Кремация', title:'Принадлежности для кремации', description:'Товары для организации кремации.', price:'', priceOnRequest:true, images:[] as string[], active:true},
  {id:'6', category:'Памятные товары', title:'Памятные изделия', description:'Изделия для оформления места памяти.', price:'', priceOnRequest:true, images:[] as string[], active:true},
];
