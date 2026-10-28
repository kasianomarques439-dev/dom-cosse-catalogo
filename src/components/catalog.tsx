'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Store,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { createClient } from '@/lib/supabase/browser';
import { hasSupabaseConfig } from '@/lib/supabase/env';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_SETTINGS, sortCategories, type Category, type CategoryIcon, type Product, type StoreSettings } from '@/lib/types';
import { productWhatsAppHref, retailerWhatsAppHref, whatsappNumber } from '@/lib/links';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function MateIcon({ type }: { type: CategoryIcon }) {
  if (type === 'shapes') return <ShapesIcon/>;
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
  initialCategories,
  settings,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
  settings: StoreSettings;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [storeSettings, setStoreSettings] = useState(settings);
  const [category, setCategory] = useState('todos');
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    const supabase = createClient();
    let active = true;
    const refresh = async () => {
      const [productResult, settingsResult, categoryResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('store_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (!active) return;
      if (!productResult.error && productResult.data) {
        const rows = productResult.data as Product[];
        setProducts(rows);
        setSelected((current) => current ? rows.find((product) => product.id === current.id) || null : null);
      }
      if (!settingsResult.error && settingsResult.data) setStoreSettings({ ...DEFAULT_STORE_SETTINGS, ...settingsResult.data } as StoreSettings);
      if (!categoryResult.error && categoryResult.data) setCategories(sortCategories(categoryResult.data as Category[]));
    };
    const channel = supabase
      .channel('catalog-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => void refresh())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(
    () => products.filter((product) =>
      (category === 'todos' || product.category === category)
      && product.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
    ),
    [products, category, search],
  );

  const openProduct = (product: Product) => {
    previousFocus.current = document.activeElement as HTMLElement;
    setSelectedPhoto(product.image_url);
    setSelected(product);
    history.pushState({ productModal: true }, '', '#produto');
  };

  const closeProduct = () => {
    setSelected(null);
    setSelectedPhoto(null);
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
  const storeAddress = [storeSettings.address, [storeSettings.city, storeSettings.state].filter(Boolean).join('/')].filter(Boolean).join(' — ');
  const brandedBanner = !storeSettings.banner_url;
  const heroImage = storeSettings.banner_url || '/dom-cosse-banner.png';
  const selectCategory = (value: string) => {
    setCategory(value);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]);

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a className="logo" href="#inicio" onClick={() => setCategory('todos')} aria-label="Dom Cossé, início"><Image src="/dom-cosse-logo.png" alt="Dom Cossé — Avios de Mate" width={386} height={374} priority/></a>
          <nav className={`nav ${menu ? 'open' : ''}`} aria-label="Navegação principal">
            <a href="#inicio" onClick={() => { setCategory('todos'); setMenu(false); }} aria-current="page">Início</a>
            {(categories.length ? categories : DEFAULT_CATEGORIES).filter((item) => ['cuias', 'bombas'].includes(item.slug)).map((item) => <a key={item.slug} href="#categorias" onClick={() => { setCategory(item.slug); setMenu(false); }}>{item.name}</a>)}
            <a href="#sobre" onClick={() => setMenu(false)}>Sobre Nós</a>
          </nav>
          <div className="header-tools">
            <span className="header-wholesale">Varejo e lojistas</span>
            <div className="header-actions">
              <button className="header-icon-button header-search-button" type="button" aria-label="Buscar produtos" onClick={() => { document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }); window.setTimeout(() => searchInput.current?.focus(), 350); }}><Search size={20}/></button>
              <span className="header-icon-button header-heart" role="img" aria-label="Favoritos"><Heart size={20}/></span>
              <a className="header-icon-button header-cart" href="#produtos" aria-label="Ver catálogo"><ShoppingCart size={20}/></a>
              {whatsappHref && <a className="btn header-cta" href={whatsappHref} target="_blank" rel="noopener noreferrer"><FaWhatsapp size={20}/><span className="cta-label">Fale no WhatsApp</span></a>}
              <button className="menu-button" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {category === 'todos' && <section className={`hero hero-with-photo ${brandedBanner ? 'hero-branded-banner' : ''}`} id="inicio" style={{ backgroundImage: brandedBanner ? `url("${heroImage}")` : `linear-gradient(90deg, #111a13b8 0%, #10191245 55%, #121a1260 100%), url("${heroImage}")` }}>
          <div className="hero-content">
            <h1>DOM COSSÉ</h1>
            <div className="hero-kicker-wrap"><span className="hero-rule"/><p className="hero-kicker">AVIOS DE MATE</p><span className="hero-rule"/></div>
            <p className="hero-subtitle">O AUTÊNTICO MATE GAÚCHO</p>
            <a className="btn" href="#produtos">VER CATÁLOGO <ArrowRight size={20}/></a>
          </div>
        </section>}

        <section className={`container section ${category === 'todos' ? 'categories-home' : 'categories-list'}`} id="categorias">
          {category === 'todos' ? <div className="section-heading"><h2 className="section-title">CATEGORIAS</h2><button className="text-link" onClick={() => selectCategory('todos')}>Ver todas</button></div> : <div className="category-page-heading"><p className="catalog-breadcrumb"><a href="#inicio" onClick={() => setCategory('todos')}>Início</a><span aria-hidden="true">/</span>{(categories.length ? categories : DEFAULT_CATEGORIES).find((item) => item.slug === category)?.name || category}</p><h2>{(categories.length ? categories : DEFAULT_CATEGORIES).find((item) => item.slug === category)?.name.toLocaleUpperCase('pt-BR') || category}</h2></div>}
          <div className="category-grid">
            <button className={`category-card ${category === 'todos' ? 'active' : ''}`} onClick={() => selectCategory('todos')} aria-pressed={category === 'todos'}><span className="category-icon all-icon"><ShapesIcon/></span><span>TODOS</span><ArrowRight className="arrow"/></button>
            {(categories.length ? categories : DEFAULT_CATEGORIES).map((item) => <button key={item.slug} className={`category-card ${category === item.slug ? 'active' : ''}`} onClick={() => selectCategory(item.slug)} aria-pressed={category === item.slug}><span className="category-icon"><MateIcon type={item.icon}/></span><span>{item.name.toLocaleUpperCase('pt-BR')}</span><ArrowRight className="arrow"/></button>)}
          </div>
        </section>

        <section className="container section products-section" id="produtos">
          <div className="products-head"><label className="search-wrap"><Search size={19} aria-hidden="true"/><input ref={searchInput} className="search" type="search" placeholder={category === 'cuias' ? 'Buscar cuia...' : category === 'bombas' ? 'Buscar bomba...' : 'Buscar produto...'} aria-label="Buscar produto" enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)}/></label>{category === 'todos' && <h2 className="section-title">PRODUTOS</h2>}</div>
          {visible.length === 0 ? (
            products.length === 0 ? <><div className="product-grid product-grid-empty" aria-label="Espaços visuais para fotografias e informações futuras"><span className="sr-only">Espaços de demonstração. Cadastre os produtos reais no painel para substituir estes campos.</span>{Array.from({ length: 4 }, (_, index) => <article className="product-card product-card-placeholder" key={index} aria-hidden="true"><div className="product-photo"><Heart className="placeholder-heart"/></div><div className="product-info"><h3 className="product-name">Nome do produto</h3><p className="price">Preço cadastrado</p><button type="button" className="consult" disabled><FaWhatsapp size={18}/>Ver detalhes</button></div></article>)}</div><p className="sr-only" role="status">Nenhum produto cadastrado ainda.</p></> : <div className="empty"><strong>Nenhum produto encontrado</strong><span>Tente outro termo ou categoria.</span></div>
          ) : (
            <div className="product-grid">
              {visible.map((product) => (
                <article className={`product-card ${product.status === 'esgotado' ? 'sold' : ''}`} key={product.id} onClick={() => openProduct(product)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProduct(product); } }} tabIndex={0} aria-label={`Ver detalhes de ${product.name}`}>
                  <div className="product-photo">{product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw" loading="lazy" decoding="async"/> : <span className="sr-only">Foto ainda não cadastrada</span>}<span className="favorite-mark" aria-hidden="true"><Heart/></span>{product.status === 'esgotado' && <span className="sold-label">ESGOTADO</span>}</div>
                  <div className="product-info"><h3 className="product-name">{product.name}</h3><p className="price">{money(Number(product.price))}</p><button type="button" className="consult" onClick={(event) => { event.stopPropagation(); openProduct(product); }}><FaWhatsapp size={18}/>Ver detalhes</button></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="contact-section" id="contato">
          <div className="container contact-inner">
            <h2>FALE COM A DOM COSSÉ</h2>
            <p>Vendas no varejo e para lojistas</p>
            {whatsappHref && <a className="contact-action primary" href={retailerHref} target="_blank" rel="noopener noreferrer"><FaWhatsapp/><span>Chamar no WhatsApp</span><ArrowRight/></a>}
            {whatsappHref && <a className="contact-action" href={retailerHref} target="_blank" rel="noopener noreferrer"><Store/><span>Atendimento para lojistas</span><ArrowRight/></a>}
            {instagram && <a className="contact-action" href={instagram} target="_blank" rel="noopener noreferrer"><Instagram/><span>Acompanhe no Instagram</span><ArrowRight/></a>}
            {storeAddress && <div className="contact-location"><MapPin/><div><strong>Onde estamos</strong><span>{storeAddress}{storeSettings.postal_code ? ` · CEP ${storeSettings.postal_code}` : ''}</span></div></div>}
          </div>
        </section>

      </main>

      <footer className="footer" id="sobre"><div className="container footer-inner"><a className="logo footer-logo" href="#inicio" aria-label="Dom Cossé, início"><Image src="/dom-cosse-logo.png" alt="Dom Cossé — Avios de Mate" width={386} height={374}/></a><div className="footer-business"><strong>Dom Cossé — Avios de Mate</strong><span>Vendas no varejo e para lojistas</span></div><div className="footer-contact"><p><MapPin size={18}/><span>{storeAddress}{storeSettings.postal_code ? ` · CEP ${storeSettings.postal_code}` : ''}</span></p>{whatsappHref && <a href={retailerHref} target="_blank" rel="noopener noreferrer"><FaWhatsapp size={18}/><span>WhatsApp: {storeSettings.whatsapp}</span></a>}</div><div className="footer-social">{instagram && <a href={instagram} target="_blank" rel="noopener noreferrer"><Instagram size={18}/><span>@domcosse</span></a>}{storeSettings.email && <a href={`mailto:${storeSettings.email}`}><Mail size={18}/><span>{storeSettings.email}</span></a>}</div></div></footer>

      {(whatsappHref || instagram) && <div className="social-floats" aria-label="Redes sociais">{whatsappHref && <a className="social-float wa" href={whatsappHref} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><FaWhatsapp size={24}/></a>}{instagram && <a className="social-float ig" href={instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><Instagram size={24}/></a>}</div>}


      {selected && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProduct(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1} ref={modalRef}><button className="modal-close" onClick={closeProduct} aria-label="Fechar detalhes"><X/></button><h2 className="modal-mobile-title">Detalhes do produto</h2><div className="modal-body"><div><div className="modal-image">{(selectedPhoto || selected.image_url) ? <Image src={(selectedPhoto || selected.image_url)!} alt={selected.name} fill sizes="(max-width: 767px) 100vw, 50vw"/> : <span className="sr-only">Foto ainda não cadastrada</span>}</div><div className="product-gallery-thumbs" aria-label="Fotos do produto">{[...(selected.image_url ? [selected.image_url] : []), ...(selected.gallery_urls || [])].map((url, index) => <button key={`${url}-${index}`} type="button" aria-label={`Ver foto ${index + 1}`} aria-pressed={(selectedPhoto || selected.image_url) === url} onClick={() => setSelectedPhoto(url)}><Image src={url} alt="" fill sizes="64px"/></button>)}{Array.from({ length: Math.max(0, 3 - (selected.gallery_urls?.length || 0) - (selected.image_url ? 1 : 0)) }, (_, index) => <span className="gallery-empty" key={`empty-${index}`} aria-hidden="true"/>)}</div></div><div className="modal-info"><p className="muted">{categories.find((item) => item.slug === selected.category)?.name || selected.category}</p><h2 id="detail-title">{selected.name}</h2><p className="price">{money(Number(selected.price))}</p><p className={`availability ${selected.status === 'esgotado' ? 'unavailable' : ''}`}><span aria-hidden="true"/>{selected.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</p>{selected.description && <div className="modal-description-block"><h3>Descrição</h3><p className="muted modal-description">{selected.description}</p></div>}<a className="consult" href={productWhatsAppHref(storeSettings.whatsapp, selected.name, selected.category)} target="_blank" rel="noopener noreferrer" aria-disabled={!whatsappNumber(storeSettings.whatsapp)} onClick={(event) => { if (!whatsappNumber(storeSettings.whatsapp)) event.preventDefault(); }}><FaWhatsapp size={21}/>Consultar pelo WhatsApp</a></div></div></div></div>}
    </>
  );
}
