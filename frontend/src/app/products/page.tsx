import {api} from '@/lib/api';
import ProductsCatalog from '@/components/ProductsCatalog';
import {fallbackProducts} from '@/lib/fallbackData';
export default async function Products(){let products:any[]=fallbackProducts;try{products=await api<any[]>('/products')}catch{}return <main className="inner container"><div className="eyebrow">РИТУАЛЬНЫЕ ТОВАРЫ</div><h1>Каталог</h1><p className="lead">Здесь будет размещён полный каталог ритуальных принадлежностей. Фотографии, цены и характеристики можно менять из административной панели.</p><ProductsCatalog products={products}/></main>}
