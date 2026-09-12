// Показывает телефон в защищённом виде: начало и последние 4 символа,
// остальное скрыто точками. Используется в админке, чтобы номер клиента
// не был виден полностью с первого взгляда.
export function maskPhone(phone?:string):string{
  const clean=(phone||'').trim();
  if(clean.length<=6)return clean;
  const start=clean.slice(0,2);
  const end=clean.slice(-4);
  return `${start} •••• ${end}`;
}
