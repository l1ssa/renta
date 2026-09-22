'use client';
import {useState, FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {API} from '@/lib/api';
import BrandMark from '@/components/BrandMark';

export default function AdminLogin(){
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const router=useRouter();

  async function submit(e:FormEvent){
    e.preventDefault();
    setBusy(true);setError('');
    try{
      const r=await fetch(`${API}/login`,{
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({password})
      });
      if(!r.ok){
        const d=await r.json().catch(()=>({}));
        throw new Error(d.error||'Ошибка входа');
      }
      router.push('/admin');
      router.refresh();
    }catch(err:any){
      setError(err.message||'Ошибка входа');
    }finally{
      setBusy(false);
    }
  }

  return (
    <main className="adminPage">
      <div className="loginBox">
        <div className="loginLogo"><BrandMark size={34}/><span>РЕНТА</span></div>
        <h1>Вход в админ-панель</h1>
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            autoFocus
            required
          />
          <button className="button dark" disabled={busy}>{busy?'Входим…':'Войти'}</button>
        </form>
        {error && <p className="formError">{error}</p>}
      </div>
    </main>
  );
}
