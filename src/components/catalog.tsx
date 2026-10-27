'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Image as ImageIcon,
  Instagram,
  Menu,
  MessageCircle,
  Search,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { CUIA_SUBCATEGORIES, type Product, type StoreSettings } from '@/lib/types';
import { productWhatsAppHref, retailerWhatsAppHref, whatsappNumber } from '@/lib/links';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function MateIcon({ type }: { type: 'cuia' | 'bomba' }) {
  return type === 'cuia' ? (
    <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 13h20l-3 8c10 4 14 12 12 24-2 10-9 14-19 14s-17-4-19-14c-2-12 2-20 12-24l-3-8Zm0 0h20M17 29h30M40 20l9-15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ) : (
    <svg viewBox="0 0 64 64" aria-hidden="true"><path d="m18 55 5 3 31-42-5-4L18 55Zm-1 1c-4 4-8 4-10 2s-1-6 3-9l6-4 5 4-4 7Zm30-44 5 4 4-5-5-4-4 5ZM50 6l9 7M25 46l5 3M32 36l5 3M39 27l5 3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
}

function ShapesIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="8" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="37" y="8" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="8" y="37" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="37" y="37" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
}

function instagramHref(value: string) {
  const input = value.trim();
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      return /(^|\.)instagram\.com$/i.test(url.hostname) ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }
  const username = input.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '');
  return username ? `https://www.instagram.com/${username}/` : undefined;
}

export default function Catalog({
  initialProducts,
  settings,
}: {
  initialProducts: Product[];
  settings: StoreSettings;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [storeSettings, setStoreSettings] = useState(settings);
  const [category, setCategory] = useState<'todos' | 'cuias' | 'bombas'>('todos');
  const [cuiaSubcategory, setCuiaSubcategory] = useState('todos');
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [productsInView, setProductsInView] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = document.getElementById('produtos');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setProductsInView(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createClient();
    let active = true;
    const refresh = async () => {
      const [productResult, settingsResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('store_settings').select('*').eq('id', true).maybeSingle(),
      ]);
      if (!active) return;
      if (!productResult.error && productResult.data) setProducts(productResult.data as Product[]);
      if (!settingsResult.error && settingsResult.data) setStoreSettings(settingsResult.data as StoreSettings);
    };
    const channel = supabase
      .channel('catalog-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => void refresh())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(
    () => products.filter((product) =>
      (category === 'todos' || product.category === category)
      && (category !== 'cuias' || cuiaSubcategory === 'todos' || product.cuia_subcategory === cuiaSubcategory)
      && product.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
    ),
    [products, category, cuiaSubcategory, search],
  );

  const openProduct = (product: Product) => {
    previousFocus.current = document.activeElement as HTMLElement;
    setSelected(product);
    history.pushState({ productModal: true }, '', '#produto');
  };

  const closeProduct = () => {
    setSelected(null);
    if (location.hash === '#produto') history.back();
    previousFocus.current?.focus();
  };

  useEffect(() => {
    const pop = () => setSelected(null);
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeProduct();
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;
      const elements = Array.from(modalRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  const number = whatsappNumber(storeSettings.whatsapp);
  const whatsappHref = number ? `https://wa.me/${number}` : undefined;
  const instagram = instagramHref(storeSettings.instagram);
  const retailerHref = retailerWhatsAppHref(storeSettings.whatsapp);
  const selectCategory = (value: 'todos' | 'cuias' | 'bombas') => {
    setCategory(value);
    setCuiaSubcategory('todos');
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a className="logo" href="#inicio" aria-label="Dom Cossé, início"><strong>Dom Cossé</strong><small>AVIOS DE MATE</small></a>
          <nav className={`nav ${menu ? 'open' : ''}`} aria-label="Navegação principal">
            <a href="#inicio" onClick={() => setMenu(false)} aria-current="page">Início</a>
            <a href="#categorias" onClick={() => { setCategory('cuias'); setCuiaSubcategory('todos'); setMenu(false); }}>Cuias</a>
            <a href="#categorias" onClick={() => { setCategory('bombas'); setCuiaSubcategory('todos'); setMenu(false); }}>Bombas</a>
            <a href="#sobre" onClick={() => setMenu(false)}>Sobre Nós</a>
            <a href="#contato" onClick={() => setMenu(false)}>Contato</a>
          </nav>
          {whatsappHref ? (
            <a className="btn header-cta" href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={20}/><span className="cta-label">Fale no WhatsApp</span></a>
          ) : (
            <span className="btn header-cta is-disabled" aria-disabled="true" title="WhatsApp ainda não configurado"><MessageCircle size={20}/><span className="cta-label">Fale no WhatsApp</span></span>
          )}
          <button className="menu-button" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <h1>DOM COSSÉ</h1>
            <div className="hero-kicker-wrap"><span className="hero-rule"/><p className="hero-kicker">AVIOS DE MATE</p><span className="hero-rule"/></div>
            <p className="hero-subtitle">O AUTÊNTICO MATE GAÚCHO</p>
            <p className="hero-wholesale">Vendas no varejo e para lojistas</p>
            <a className="btn" href="#produtos">VER CATÁLOGO <ArrowRight size={20}/></a>
          </div>
        </section>

        <section className="container section" id="categorias">
          <div className="section-heading"><h2 className="section-title">CATEGORIAS</h2><button className="text-link" onClick={() => selectCategory('todos')}>Ver todas</button></div>
          <div className="category-grid">
            <button className={`category-card ${category === 'todos' ? 'active' : ''}`} onClick={() => selectCategory('todos')} aria-pressed={category === 'todos'}><span className="category-icon all-icon"><ShapesIcon/></span><span>TODOS</span><ArrowRight className="arrow"/></button>
            <button className={`category-card ${category === 'cuias' ? 'active' : ''}`} onClick={() => selectCategory('cuias')} aria-pressed={category === 'cuias'}><MateIcon type="cuia"/><span>CUIAS</span><ArrowRight className="arrow"/></button>
            <button className={`category-card ${category === 'bombas' ? 'active' : ''}`} onClick={() => selectCategory('bombas')} aria-pressed={category === 'bombas'}><MateIcon type="bomba"/><span>BOMBAS</span><ArrowRight className="arrow"/></button>
          </div>
        </section>

        <section className="container section products-section" id="produtos">
          <div className="products-head"><h2 className="section-title">PRODUTOS</h2><label className="search-wrap"><Search size={19} aria-hidden="true"/><input className="search" type="search" placeholder="Buscar produto..." aria-label="Buscar produto" enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)}/></label></div>
          {category === 'cuias' && <label className="cuia-subcategory-filter"><span>Tipo de cuia</span><select aria-label="Filtrar por tipo de cuia" value={cuiaSubcategory} onChange={(event) => setCuiaSubcategory(event.target.value)}><option value="todos">Todas as cuias</option>{CUIA_SUBCATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
          {visible.length === 0 ? (
            <div className="empty"><ImageIcon/><strong>{products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}</strong><span>{products.length === 0 ? 'Em breve, nossos produtos estarão disponíveis aqui.' : 'Tente outro termo ou categoria.'}</span></div>
          ) : (
            <div className="product-grid">
              {visible.map((product) => (
                <article className={`product-card ${product.status === 'esgotado' ? 'sold' : ''}`} key={product.id} onClick={() => openProduct(product)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProduct(product); } }} tabIndex={0} aria-label={`Ver detalhes de ${product.name}`}>
                  <div className="product-photo">{product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw" loading="lazy" decoding="async"/> : <div className="photo-placeholder"><ImageIcon/></div>}{product.status === 'esgotado' && <span className="sold-label">ESGOTADO</span>}</div>
                  <div className="product-info"><h3 className="product-name">{product.name}</h3><p className="price">{money(Number(product.price))}</p><button type="button" className="consult" onClick={() => openProduct(product)}>Ver detalhes</button></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="container info-section" id="sobre"><h2 className="section-title">SOBRE NÓS</h2><p>Dom Cossé — Avios de Mate. O autêntico mate gaúcho.</p></section>
        <section className="container info-section contact-section" id="contato">
          <h2 className="section-title">CONTATO</h2>
          <div className="footer-links">
            {whatsappHref && <a className="btn" href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp</a>}
            {instagram && <a className="btn" href={instagram} target="_blank" rel="noopener noreferrer"><Instagram size={18}/>Instagram<ArrowUpRight size={14}/></a>}
            {retailerHref && <a className="btn retailer-contact" href={retailerHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>Atendimento para lojistas</a>}
            {!whatsappHref && !instagram && <p className="muted">Os canais de contato ainda não foram configurados.</p>}
          </div>
          {(storeSettings.company_name || storeSettings.email || storeSettings.address) && <div className="store-contact-details">{storeSettings.company_name && <p>{storeSettings.company_name}</p>}{storeSettings.email && <p><a href={`mailto:${storeSettings.email}`}>{storeSettings.email}</a></p>}{storeSettings.address && <p>{storeSettings.address}{storeSettings.city ? `, ${storeSettings.city}` : ''}{storeSettings.state ? ` - ${storeSettings.state}` : ''}{storeSettings.postal_code ? ` · CEP ${storeSettings.postal_code}` : ''}</p>}</div>}
        </section>
      </main>

      <footer className="footer"><div className="container footer-inner"><a className="logo" href="#inicio" aria-label="Dom Cossé, início"><strong>Dom Cossé</strong><small>AVIOS DE MATE</small></a><p>Dom Cossé — Avios de Mate</p><div className="footer-links">{whatsappHref && <a className="btn" href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp</a>}{instagram && <a className="btn" href={instagram} target="_blank" rel="noopener noreferrer"><Instagram size={18}/>Instagram<ArrowUpRight size={14}/></a>}</div></div></footer>

      {(whatsappHref || instagram) && <div className={`social-floats ${productsInView ? 'hidden' : ''}`} aria-label="Redes sociais" aria-hidden={productsInView}>{whatsappHref && <a className="social-float wa" href={whatsappHref} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" tabIndex={productsInView ? -1 : 0}><MessageCircle size={24}/></a>}{instagram && <a className="social-float ig" href={instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer" tabIndex={productsInView ? -1 : 0}><Instagram size={24}/></a>}</div>}

      {selected && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProduct(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1} ref={modalRef}><button className="modal-close" onClick={closeProduct} aria-label="Fechar detalhes"><X/></button><div className="modal-body"><div className="modal-image">{selected.image_url ? <Image src={selected.image_url} alt={selected.name} fill sizes="(max-width: 767px) 100vw, 50vw"/> : <div className="photo-placeholder"><ImageIcon/></div>}</div><div className="modal-info"><p className="muted">{selected.category === 'cuias' ? 'Cuia' : 'Bomba'}</p><h2 id="detail-title">{selected.name}</h2>{selected.description && <p className="muted modal-description">{selected.description}</p>}<p className="price">{money(Number(selected.price))}</p><p className={`availability ${selected.status === 'esgotado' ? 'unavailable' : ''}`}><span aria-hidden="true"/>{selected.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</p><a className="consult" href={productWhatsAppHref(storeSettings.whatsapp, selected.name, selected.category)} target="_blank" rel="noopener noreferrer" aria-disabled={!whatsappNumber(storeSettings.whatsapp)} onClick={(event) => { if (!whatsappNumber(storeSettings.whatsapp)) event.preventDefault(); }}>Consultar pelo WhatsApp</a></div></div></div></div>}
    </>
  );
}
