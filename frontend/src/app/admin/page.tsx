'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {api, uploadFile, imageUrl} from '@/lib/api';
import {maskPhone} from '@/lib/format';
import FlowerIcon from '@/components/FlowerIcon';
import BrandMark from '@/components/BrandMark';
import Modal from '@/components/Modal';

type Item = Record<string, any>;

const emptyService = {number:'', title:'', description:'', slug:'', seoTitle:'', seoDescription:''};
const emptyProduct = {category:'', title:'', description:'', price:'', priceOnRequest:true, images:[] as string[], active:true};
const emptyCategory = {name:''};
const emptyAbout = {text:'', images:[] as string[]};
const settingLabels:Record<string,string> = {
  company:'Название организации', brand:'Бренд (название сайта)', subtitle:'Подзаголовок бренда',
  city:'Город', address:'Адрес', phone:'Телефон', phone2:'Телефон (доп.)', email:'Email',
  heroTitle:'Заголовок на главной', heroText:'Текст на главной', hours:'Часы работы',
};

export default function Admin(){
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState<Item>({});
  const [services, setServices] = useState<Item[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Item[]>([]);
  const [leads, setLeads] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>(emptyService);
  const [productForm, setProductForm] = useState<Item>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState<Item>(emptyCategory);
  const [aboutForm, setAboutForm] = useState<Item>(emptyAbout);
  const [aboutId, setAboutId] = useState<string|null>(null);
  const [aboutUploading, setAboutUploading] = useState(false);
  const [settings, setSettings] = useState<Item>({});
  const [editing, setEditing] = useState<string|null>(null);
  const [editingProduct, setEditingProduct] = useState<string|null>(null);
  const [editingCategory, setEditingCategory] = useState<string|null>(null);
  const [productFilter, setProductFilter] = useState('all');
  const [leadQuery, setLeadQuery] = useState('');
  const [revealedLead, setRevealedLead] = useState<string|null>(null);
  const [uploading, setUploading] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type:string;id:string;label:string}|null>(null);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const reload = async () => {
    const [s,p,l,st,set] = await Promise.all([
      api<Item[]>('/services'),
      api<Item[]>('/products?all=1'),
      api<Item[]>('/leads'),
      api<Item>('/stats'),
      api<Item>('/settings'),
    ]);
    setServices(s); setProducts(p); setLeads(l); setStats(st); setSettings(set);
    try{ setCategories(await api<Item[]>('/categories')); }catch{ setCategories([]); }
    try{
      const about = await api<Item[]>('/about');
      if(about[0]){ setAboutId(about[0].id); setAboutForm(about[0]); }
    }catch{ /* backend not rebuilt yet */ }
  };

  useEffect(() => {
    (async () => {
      try{
        const me = await api<{authed:boolean}>('/me');
        if(!me.authed){ router.push('/admin/login'); return; }
        await reload();
      }catch{
        router.push('/admin/login');
      }finally{
        setAuthChecked(true);
      }
    })();
  }, []);

  async function logout(){
    await api('/logout', {method:'POST'});
    router.push('/admin/login');
  }

  const productCategories = Array.from(new Set(products.map(p=>p.category).filter(Boolean)));
  const filteredProducts = productFilter==='all' ? products : products.filter(p=>p.category===productFilter);
  const filteredLeads = leadQuery.trim()
    ? leads.filter(l => `${l.name||''} ${l.phone||''}`.toLowerCase().includes(leadQuery.trim().toLowerCase()))
    : leads;

  async function saveService(e:any){
    e.preventDefault();
    await api(editing ? `/services?id=${editing}` : '/services', {method: editing?'PUT':'POST', body: JSON.stringify(form)});
    setForm(emptyService); setEditing(null); setServiceModalOpen(false); reload();
  }
  async function saveProduct(e:any){
    e.preventDefault();
    await api(editingProduct ? `/products?id=${editingProduct}` : '/products', {method: editingProduct?'PUT':'POST', body: JSON.stringify(productForm)});
    setProductForm(emptyProduct); setEditingProduct(null); setProductModalOpen(false); reload();
  }
  async function saveCategory(e:any){
    e.preventDefault();
    await api(editingCategory ? `/categories?id=${editingCategory}` : '/categories', {method: editingCategory?'PUT':'POST', body: JSON.stringify(categoryForm)});
    setCategoryForm(emptyCategory); setEditingCategory(null); setCategoryModalOpen(false); reload();
  }
  function askDelete(type:string, id:string, label:string){
    setDeleteTarget({type, id, label});
  }
  async function confirmDelete(){
    if(!deleteTarget) return;
    await api(`/${deleteTarget.type}?id=${deleteTarget.id}`, {method:'DELETE'});
    setDeleteTarget(null);
    reload();
  }
  async function saveSettings(e:any){
    e.preventDefault();
    await api('/settings', {method:'PUT', body: JSON.stringify(settings)});
    alert('Настройки сохранены');
  }
  function removeField(key:string){
    const rest = {...settings};
    delete rest[key];
    setSettings(rest);
  }
  function addField(){
    const key = newFieldKey.trim();
    if(!key || key in settings) return;
    setSettings({...settings, [key]: newFieldValue});
    setNewFieldKey(''); setNewFieldValue('');
  }
  async function handleFiles(e:any){
    const files:File[] = Array.from(e.target.files||[]);
    if(!files.length) return;
    setUploading(true);
    try{
      const uploaded:string[] = [];
      for(const file of files){
        const res = await uploadFile(file);
        uploaded.push(res.url);
      }
      setProductForm((f:Item) => ({...f, images:[...(f.images||[]), ...uploaded]}));
    }catch{
      alert('Не удалось загрузить файл');
    }finally{
      setUploading(false);
      e.target.value = '';
    }
  }
  function removeImage(i:number){
    setProductForm((f:Item) => ({...f, images:(f.images||[]).filter((_:string,idx:number)=>idx!==i)}));
  }
  async function saveAbout(e:any){
    e.preventDefault();
    const saved = await api<Item>(aboutId ? `/about?id=${aboutId}` : '/about', {method: aboutId?'PUT':'POST', body: JSON.stringify(aboutForm)});
    setAboutId(saved.id); setAboutForm(saved);
    alert('Страница «О салоне» сохранена');
  }
  async function handleAboutFiles(e:any){
    const files:File[] = Array.from(e.target.files||[]);
    if(!files.length) return;
    setAboutUploading(true);
    try{
      const uploaded:string[] = [];
      for(const file of files){
        const res = await uploadFile(file);
        uploaded.push(res.url);
      }
      setAboutForm((f:Item) => ({...f, images:[...(f.images||[]), ...uploaded]}));
    }catch{
      alert('Не удалось загрузить файл');
    }finally{
      setAboutUploading(false);
      e.target.value = '';
    }
  }
  function removeAboutImage(i:number){
    setAboutForm((f:Item) => ({...f, images:(f.images||[]).filter((_:string,idx:number)=>idx!==i)}));
  }

  if(!authChecked) return <main className="adminPage"><div className="loginBox"><p>Проверяем доступ…</p></div></main>;

  return (
    <main className="adminPage">
      <div className="adminLayout">
        <aside>
          <div className="adminLogo"><BrandMark size={30}/><span>РЕНТА</span></div>
          {[['dashboard','Обзор'],['services','Услуги'],['products','Товары'],['categories','Категории'],['about','О салоне'],['leads','Заявки'],['settings','Настройки']].map(x=>
            <button key={x[0]} className={tab===x[0]?'active':''} onClick={()=>setTab(x[0])}>{x[1]}</button>
          )}
          <button onClick={logout} style={{marginTop:'auto',marginLeft:'auto'}}>Выйти</button>
        </aside>
        <section className="adminContent">
          <div className="adminTop">
            <div>
              <span>АДМИНИСТРАТИВНАЯ ПАНЕЛЬ</span>
              <h1>{tab==='dashboard'?'Обзор':tab==='services'?'Услуги':tab==='products'?'Ритуальные товары':tab==='categories'?'Категории товаров':tab==='about'?'О салоне':tab==='leads'?'Заявки':'Настройки сайта'}</h1>
            </div>
          </div>

          {tab==='dashboard' && <>
            <div className="statGrid">
              <div className="stat"><span>Посещения сегодня</span><b>{stats.visitsToday||0}</b></div>
              <div className="stat"><span>За неделю</span><b>{stats.visitsWeek||0}</b></div>
              <div className="stat"><span>За месяц</span><b>{stats.visitsMonth||0}</b></div>
              <div className="stat"><span>Заявки</span><b>{stats.leads||0}</b></div>
            </div>
          </>}

          {tab==='services' && <div className="manageGrid">
            <div className="listHead">
              <h2>Все услуги</h2>
              <button className="button dark" onClick={()=>{setForm(emptyService);setEditing(null);setServiceModalOpen(true)}}>+ Добавить услугу</button>
            </div>
            <div className="itemList">
              {services.map(s=>
                <article key={s.id}>
                  <div className="itemBody"><b>{s.number} · {s.title}</b><p>{s.description}</p></div>
                  <div>
                    <button onClick={()=>{setEditing(s.id);setForm(s);setServiceModalOpen(true)}}>Изменить</button>{' '}
                    <button onClick={()=>askDelete('services',s.id,s.title)}>Удалить</button>
                  </div>
                </article>
              )}
            </div>
          </div>}

          {serviceModalOpen &&
            <Modal title={editing?'Редактировать услугу':'Добавить услугу'} onClose={()=>{setServiceModalOpen(false);setEditing(null);setForm(emptyService)}}>
              <form className="adminForm" onSubmit={saveService}>
                <input placeholder="Номер" value={form.number||''} onChange={e=>setForm({...form,number:e.target.value})}/>
                <input required placeholder="Название" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/>
                <textarea required rows={4} placeholder="Описание" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/>
                <input placeholder="URL (slug), необязательно — сгенерируется само" value={form.slug||''} onChange={e=>setForm({...form,slug:e.target.value})}/>
                <input placeholder="SEO: заголовок страницы (title)" value={form.seoTitle||''} onChange={e=>setForm({...form,seoTitle:e.target.value})}/>
                <textarea rows={2} placeholder="SEO: описание страницы (description)" value={form.seoDescription||''} onChange={e=>setForm({...form,seoDescription:e.target.value})}/>
                <button className="button dark">Сохранить</button>
              </form>
            </Modal>
          }

          {tab==='products' && <div className="manageGrid">
            <div className="listHead">
              <h2>Все товары</h2>
              <button className="button dark" onClick={()=>{setProductForm(emptyProduct);setEditingProduct(null);setProductModalOpen(true)}}>+ Добавить товар</button>
            </div>
            <div>
              <div className="filterBar">
                <label>Фильтр по категории</label>
                <select value={productFilter} onChange={e=>setProductFilter(e.target.value)}>
                  <option value="all">Все категории ({products.length})</option>
                  {productCategories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="itemList">
                {filteredProducts.map(p=>{
                  const thumb = (p.images&&p.images[0]) || p.image;
                  return <article key={p.id}>
                    <div className="itemThumb">{thumb ? <img src={imageUrl(thumb)} alt={p.title}/> : <FlowerIcon size={26}/>}</div>
                    <div className="itemBody">
                      <b>{p.title}{p.active===false && <em className="badgeHidden"> · скрыт</em>}</b>
                      <p>{p.category} · {p.priceOnRequest?'По запросу':(p.price||'—')}</p>
                    </div>
                    <div>
                      <button onClick={()=>{setEditingProduct(p.id);setProductForm(p);setProductModalOpen(true)}}>Изменить</button>{' '}
                      <button onClick={()=>askDelete('products',p.id,p.title)}>Удалить</button>
                    </div>
                  </article>;
                })}
                {filteredProducts.length===0 && <p className="lead">Нет товаров в этой категории.</p>}
              </div>
            </div>
          </div>}

          {productModalOpen &&
            <Modal title={editingProduct?'Редактировать товар':'Добавить товар'} onClose={()=>{setProductModalOpen(false);setEditingProduct(null);setProductForm(emptyProduct)}}>
              <form className="adminForm" onSubmit={saveProduct}>
                <select value={productForm.category||''} onChange={e=>setProductForm({...productForm,category:e.target.value})}>
                  <option value="">Без категории</option>
                  {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {categories.length===0 && <p className="formError">Сначала добавьте категории на вкладке «Категории».</p>}
                <input required placeholder="Название" value={productForm.title||''} onChange={e=>setProductForm({...productForm,title:e.target.value})}/>
                <textarea required rows={3} placeholder="Описание" value={productForm.description||''} onChange={e=>setProductForm({...productForm,description:e.target.value})}/>
                <label className="checkboxRow">
                  <input type="checkbox" checked={!!productForm.priceOnRequest} onChange={e=>setProductForm({...productForm,priceOnRequest:e.target.checked})}/>
                  <span>Цена «по запросу»</span>
                </label>
                {!productForm.priceOnRequest &&
                  <input placeholder="Цена, например 15 000 ₽" value={productForm.price||''} onChange={e=>setProductForm({...productForm,price:e.target.value})}/>
                }
                <label className="checkboxRow">
                  <input type="checkbox" checked={productForm.active!==false} onChange={e=>setProductForm({...productForm,active:e.target.checked})}/>
                  <span>Показывать на сайте</span>
                </label>
                <div className="uploadRow">
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFiles}/>
                  {uploading && <span>Загрузка…</span>}
                </div>
                {(productForm.images||[]).length>0 &&
                  <div className="photoThumbs">
                    {(productForm.images||[]).map((img:string,i:number)=>
                      <div className="photoThumb" key={i}>
                        <img src={imageUrl(img)} alt=""/>
                        <button type="button" onClick={()=>removeImage(i)} aria-label="Удалить фото">×</button>
                      </div>
                    )}
                  </div>
                }
                <button className="button dark">Сохранить</button>
              </form>
            </Modal>
          }

          {tab==='categories' && <div className="manageGrid">
            <div className="listHead">
              <h2>Все категории</h2>
              <button className="button dark" onClick={()=>{setCategoryForm(emptyCategory);setEditingCategory(null);setCategoryModalOpen(true)}}>+ Добавить категорию</button>
            </div>
            <div className="itemList">
              {categories.map(c=>
                <article key={c.id}>
                  <div className="itemBody"><b>{c.name}</b></div>
                  <div>
                    <button onClick={()=>{setEditingCategory(c.id);setCategoryForm(c);setCategoryModalOpen(true)}}>Изменить</button>{' '}
                    <button onClick={()=>askDelete('categories',c.id,c.name)}>Удалить</button>
                  </div>
                </article>
              )}
              {categories.length===0 && <p className="lead">Пока нет ни одной категории.</p>}
            </div>
          </div>}

          {categoryModalOpen &&
            <Modal title={editingCategory?'Редактировать категорию':'Добавить категорию'} onClose={()=>{setCategoryModalOpen(false);setEditingCategory(null);setCategoryForm(emptyCategory)}}>
              <form className="adminForm" onSubmit={saveCategory}>
                <input required placeholder="Название категории" value={categoryForm.name||''} onChange={e=>setCategoryForm({...categoryForm,name:e.target.value})}/>
                <button className="button dark">Сохранить</button>
              </form>
            </Modal>
          }

          {tab==='about' && <form className="adminForm aboutForm" onSubmit={saveAbout}>
            <textarea required rows={6} placeholder="Текст страницы «О салоне»" value={aboutForm.text||''} onChange={e=>setAboutForm({...aboutForm,text:e.target.value})}/>
            <div className="uploadRow">
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleAboutFiles}/>
              {aboutUploading && <span>Загрузка…</span>}
            </div>
            {(aboutForm.images||[]).length>0 &&
              <div className="photoThumbs">
                {(aboutForm.images||[]).map((img:string,i:number)=>
                  <div className="photoThumb" key={i}>
                    <img src={imageUrl(img)} alt=""/>
                    <button type="button" onClick={()=>removeAboutImage(i)} aria-label="Удалить фото">×</button>
                  </div>
                )}
              </div>
            }
            <button className="button dark">Сохранить</button>
          </form>}

          {tab==='leads' && <>
            <div className="filterBar">
              <label>Поиск по имени или телефону</label>
              <input placeholder="Например, Иван или 950" value={leadQuery} onChange={e=>setLeadQuery(e.target.value)}/>
            </div>
            <div className="tableWrap">
              <table>
                <thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Сообщение</th></tr></thead>
                <tbody>
                  {filteredLeads.map(l=>
                    <tr key={l.id}>
                      <td>{new Date(l.createdAt).toLocaleString('ru-RU')}</td>
                      <td>{l.name}</td>
                      <td>
                        {revealedLead===l.id ? l.phone : maskPhone(l.phone)}{' '}
                        <button onClick={()=>setRevealedLead(revealedLead===l.id?null:l.id)}>{revealedLead===l.id?'Скрыть':'Показать'}</button>
                      </td>
                      <td>{l.message||'—'}</td>
                    </tr>
                  )}
                  {filteredLeads.length===0 && <tr><td colSpan={4}>Заявок не найдено.</td></tr>}
                </tbody>
              </table>
            </div>
          </>}

          {tab==='settings' && <form className="adminForm settingsForm" onSubmit={saveSettings}>
            {Object.entries(settings).map(([k,v])=>
              <div className="settingsField" key={k}>
                <label>{settingLabels[k]||k}<input value={String(v??'')} onChange={e=>setSettings({...settings,[k]:e.target.value})}/></label>
                <button type="button" onClick={()=>removeField(k)} aria-label="Удалить поле">×</button>
              </div>
            )}
            <div className="settingsAddField">
              <input placeholder="Название поля (например, instagram)" value={newFieldKey} onChange={e=>setNewFieldKey(e.target.value)}/>
              <input placeholder="Значение" value={newFieldValue} onChange={e=>setNewFieldValue(e.target.value)}/>
              <button type="button" onClick={addField}>+ Добавить поле</button>
            </div>
            <button className="button dark">Сохранить настройки</button>
          </form>}

          {deleteTarget &&
            <Modal title="Удалить запись?" onClose={()=>setDeleteTarget(null)}>
              <div className="confirmBody">
                <p>Вы уверены, что хотите удалить «{deleteTarget.label}»? Это действие нельзя отменить.</p>
                <div className="confirmActions">
                  <button type="button" onClick={()=>setDeleteTarget(null)}>Отмена</button>
                  <button type="button" className="button dark" onClick={confirmDelete}>Удалить</button>
                </div>
              </div>
            </Modal>
          }
        </section>
      </div>
    </main>
  );
}
