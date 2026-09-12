'use client';
import {useMemo,useState} from 'react';
import FlowerIcon from '@/components/FlowerIcon';
import {imageUrl} from '@/lib/api';

function ProductCard({p}:{p:any}){
  const images:string[] = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  const [idx,setIdx] = useState(0);
  return (
    <article>
      <div className="productPlaceholder">
        {images.length ? <>
          <img src={imageUrl(images[idx])} alt={p.title} className="productPhoto"/>
          {images.length>1 && <>
            <button type="button" className="photoNav prev" aria-label="Предыдущее фото" onClick={()=>setIdx(i=>(i-1+images.length)%images.length)}>‹</button>
            <button type="button" className="photoNav next" aria-label="Следующее фото" onClick={()=>setIdx(i=>(i+1)%images.length)}>›</button>
            <div className="photoDots">{images.map((_,i)=><span key={i} className={i===idx?'active':''}/>)}</div>
          </>}
        </> : <FlowerIcon size={44}/>}
      </div>
      <span className="eyebrow">{p.category}</span>
      <h2>{p.title}</h2>
      <p>{p.description}</p>
      <b>{p.priceOnRequest ? 'По запросу' : (p.price || 'По запросу')}</b>
    </article>
  );
}

export default function ProductsCatalog({products}:{products:any[]}){
  const categories=useMemo(()=>Array.from(new Set(products.map(p=>p.category).filter(Boolean))),[products]);
  const [active,setActive]=useState('all');
  const filtered=active==='all'?products:products.filter(p=>p.category===active);
  return <>
    <div className="categoryFilters">
      <button type="button" className={active==='all'?'active':''} onClick={()=>setActive('all')}>Все категории</button>
      {categories.map(c=><button type="button" key={c} className={active===c?'active':''} onClick={()=>setActive(c)}>{c}</button>)}
    </div>
    <div className="productGrid">
      {filtered.map((p:any)=><ProductCard key={p.id} p={p}/>)}
      {filtered.length===0&&<p className="lead">В этой категории пока нет товаров.</p>}
    </div>
  </>;
}
