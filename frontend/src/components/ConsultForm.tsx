'use client';
import {FormEvent,useState} from 'react';
import {api} from '@/lib/api';

export default function ConsultForm(){
  const [sent,setSent] = useState(false);
  const [busy,setBusy] = useState(false);
  const [consent,setConsent] = useState(false);
  const [offer,setOffer] = useState(false);
  const [error,setError] = useState('');

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!consent || !offer){
      setError('Нужно согласиться на обработку персональных данных и условия оферты.');
      return;
    }
    setError(''); setBusy(true);
    const f = new FormData(e.currentTarget);
    try{
      await api('/leads', {method:'POST', body: JSON.stringify({
        name: f.get('name'), phone: f.get('phone'), message: f.get('message'),
        consent, offerAccepted: offer,
      })});
      setSent(true);
    }catch{
      setError('Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
    }finally{
      setBusy(false);
    }
  }

  if(sent) return <div className="success"><b>Спасибо. Заявка принята.</b><br/>Специалист свяжется с вами и спокойно обсудит дальнейшие шаги.</div>;

  return (
    <form className="consultForm" onSubmit={submit}>
      <input name="name" placeholder="Ваше имя" required/>
      <input name="phone" placeholder="Телефон" required/>
      <textarea name="message" placeholder="Как мы можем вам помочь?" rows={5}/>
      <label>
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>
        <span>Соглашаюсь на <a href="/privacy-policy" target="_blank" rel="noopener">обработку персональных данных</a></span>
      </label>
      <label>
        <input type="checkbox" checked={offer} onChange={e=>setOffer(e.target.checked)} required/>
        <span>Принимаю условия <a href="/oferta" target="_blank" rel="noopener">публичной оферты</a></span>
      </label>
      {error && <p className="formError">{error}</p>}
      <button className="button dark" disabled={busy || !consent || !offer}>{busy?'Отправляем…':'Получить консультацию'}</button>
    </form>
  );
}
