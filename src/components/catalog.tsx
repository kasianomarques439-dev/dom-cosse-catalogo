'use client';

import Image from 'next/image';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Handshake,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { createClient } from '@/lib/supabase/browser';
import { hasSupabaseConfig } from '@/lib/supabase/env';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_SETTINGS, sortCategories, type Category, type CategoryIcon, type Product, type StoreSettings } from '@/lib/types';
import { catalogWhatsAppHref, productWhatsAppHref, retailerWhatsAppHref, whatsappNumber } from '@/lib/links';
import { trackWhatsAppClick } from '@/lib/whatsapp-events';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function MateIcon({ type }: { type: CategoryIcon }) {
  if (type === 'shapes') return <Box/>;
  if (type === 'cuia') return (
    <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 13h20l-3 8c10 4 14 12 12 24-2 10-9 14-19 14s-17-4-19-14c-2-12 2-20 12-24l-3-8Zm0 0h20M17 29h30M40 20l9-15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true"><path d="m18 55 5 3 31-42-5-4L18 55Zm-1 1c-4 4-8 4-10 2s-1-6 3-9l6-4 5 4-4 7Zm30-44 5 4 4-5-5-4-4 5ZM50 6l9 7M25 46l5 3M32 36l5 3M39 27l5 3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
}

function ShapesIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="8" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="37" y="8" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="8" y="37" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="37" y="37" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
}

function ProductCard({ product, onOpen, whatsapp, revealIndex = 0 }: { product: Product; onOpen: (product: Product) => void; whatsapp: string; revealIndex?: number }) {
  const consultHref = productWhatsAppHref(whatsapp, product.name, product.category, { id: product.id, quantity: product.lot_quantity });
  return <article data-reveal="card" style={{ '--reveal-delay': `${Math.min(revealIndex, 6) * 65}ms` } as CSSProperties} className={`product-card ${product.status === 'esgotado' ? 'sold' : ''}`} onClick={() => onOpen(product)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(product); } }} tabIndex={0} aria-label={`Ver detalhes de ${product.name}`}>
    <div className="product-photo">{product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 767px) 72vw, (max-width: 1023px) 35vw, 22vw" loading="lazy" decoding="async"/> : <span className="product-photo-empty">Imagem em breve</span>}{product.is_featured && <span className="featured-label">DESTAQUE</span>}{product.status === 'esgotado' && <span className="sold-label">ESGOTADO</span>}</div>
    <div className="product-info"><h3 className="product-name"><a href={`/produtos/${product.id}`} onClick={(event) => event.stopPropagation()}>{product.name}</a></h3>{product.description && <p className="product-description">{product.description}</p>}{product.lot_quantity && <p className="product-quantity">Lote com {product.lot_quantity} cuias</p>}<p className={`availability ${product.status === 'esgotado' ? 'unavailable' : ''}`}><span aria-hidden="true"/>{product.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</p><p className="price">{product.price === null ? 'Preço sob consulta' : money(Number(product.price))}</p>{consultHref && <a className={`consult ${product.status === 'esgotado' ? 'restock-action' : ''}`} href={consultHref} target="_blank" rel="noopener noreferrer" onClick={(event) => { event.stopPropagation(); trackWhatsAppClick({ placement: 'product_card', category: product.category, productId: product.id }); }}><FaWhatsapp size={18}/>{product.status === 'esgotado' ? 'Consultar reposição' : 'Pedir pelo WhatsApp'}</a>}</div>
  </article>;
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
  initialCatalogError,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
  settings: StoreSettings;
  initialCatalogError: string | null;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [catalogError, setCatalogError] = useState(initialCatalogError);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [storeSettings, setStoreSettings] = useState(settings);
  const [category, setCategory] = useState('todos');
  const [activeNav, setActiveNav] = useState('inicio');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [filterVirola, setFilterVirola] = useState('todas');
  const [filterMeasure, setFilterMeasure] = useState('todas');
  const [filterAvailability, setFilterAvailability] = useState('todas');
  const [sortOrder, setSortOrder] = useState('recentes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const galleryTouchStart = useRef<number | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    const supabase = createClient();
    let active = true;
    const refresh = async () => {
      const [productResult, settingsResult, categoryResult] = await Promise.all([
        supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(500),
        supabase.from('store_settings').select('*').eq('id', true).maybeSingle(),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (!active) return;
      if (!productResult.error && productResult.data) {
        const rows = productResult.data as Product[];
        setProducts(rows);
        setCatalogError(null);
        setSelected((current) => current ? rows.find((product) => product.id === current.id) || null : null);
      } else {
        setCatalogError('Não foi possível carregar o catálogo. Tente novamente.');
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
      && (filterCategory === 'todas' || product.category === filterCategory)
      && (filterVirola === 'todas' || (filterVirola === 'virola' ? Boolean(product.cuia_subcategory?.includes('_virola_')) : filterVirola === 'bocal' ? Boolean(product.cuia_subcategory?.includes('_bocal_')) : product.category === 'cuias' && !product.cuia_subcategory))
      && (filterMeasure === 'todas' || String(product.cuia_subcategory || '').endsWith(`_${filterMeasure}mm`))
      && (filterAvailability === 'todas' || product.status === filterAvailability)
      && `${product.name} ${product.description} ${product.id} ${product.cuia_subcategory || ""} ${product.category}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
    ),
    [products, category, search, filterCategory, filterVirola, filterMeasure, filterAvailability],
  );
  const sortedVisible = useMemo(() => [...visible].sort((a, b) => {
    if (sortOrder === 'nome') return a.name.localeCompare(b.name, 'pt-BR');
    if (sortOrder === 'preco') return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
    if (sortOrder === 'disponiveis') return Number(b.status === 'disponivel') - Number(a.status === 'disponivel') || b.created_at.localeCompare(a.created_at);
    return b.created_at.localeCompare(a.created_at);
  }), [visible, sortOrder]);
  const featuredProducts = useMemo(() => products.filter((product) => product.is_published && product.is_featured).sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0) || b.created_at.localeCompare(a.created_at)).slice(0, 4), [products]);
  const measureCategory = filterCategory !== 'todas' ? filterCategory : category;
  const hasActiveFilters = Boolean(search || category !== 'todos' || filterCategory !== 'todas' || filterVirola !== 'todas' || filterMeasure !== 'todas' || filterAvailability !== 'todas' || sortOrder !== 'recentes');
  const clearFilters = () => { setSearch(''); setCategory('todos'); setFilterCategory('todas'); setFilterVirola('todas'); setFilterMeasure('todas'); setFilterAvailability('todas'); setSortOrder('recentes'); };

  async function retryCatalog() {
    setCatalogLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      setProducts((data || []) as Product[]);
      setCatalogError(null);
    } catch {
      setCatalogError('Não foi possível carregar o catálogo. Tente novamente.');
    } finally { setCatalogLoading(false); }
  }

  const openProduct = (product: Product) => {
    previousFocus.current = document.activeElement as HTMLElement;
    setSelectedPhoto(product.image_url);
    setZoomed(false);
    setSelected(product);
    history.pushState({ productModal: true }, '', '#produto');
  };

  const closeProduct = () => {
    setSelected(null);
    setSelectedPhoto(null);
    setZoomed(false);
    if (location.hash === '#produto') history.back();
    previousFocus.current?.focus();
  };

  useEffect(() => {
    const pop = () => setSelected(null);
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menu]);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && zoomed) {
        setZoomed(false);
        return;
      }
      if (event.key === 'Escape') {
        closeProduct();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const photos = [...(selected.image_url ? [selected.image_url] : []), ...(selected.gallery_urls || [])];
        if (photos.length > 1) {
          event.preventDefault();
          const index = Math.max(0, photos.indexOf(selectedPhoto || photos[0]));
          const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + photos.length) % photos.length;
          setSelectedPhoto(photos[next]);
        }
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
  }, [selected, selectedPhoto, zoomed]);

  const number = whatsappNumber(storeSettings.whatsapp);
  const whatsappHref = number ? catalogWhatsAppHref(storeSettings.whatsapp, category === 'todos' ? null : category) : undefined;
  const instagram = instagramHref(storeSettings.instagram);
  const instagramLabel = instagram ? `@${new URL(instagram).pathname.replace(/^\/+|\/+$/g, '')}` : '';
  const storeAddress = [storeSettings.address, [storeSettings.city, storeSettings.state].filter(Boolean).join('/')].filter(Boolean).join(' — ');
  const heroDesktopImage = storeSettings.banner_url || '/banners/hero-clean-home.png';
  const heroMobileImage = storeSettings.banner_mobile_url || (storeSettings.banner_url ? heroDesktopImage : '/banners/hero-clean-home.png');
  const selectedPhotos = selected ? [...new Set([...(selected.image_url ? [selected.image_url] : []), ...(selected.gallery_urls || [])])] : [];
  const displayedPhoto = selectedPhotos.includes(selectedPhoto || '') ? selectedPhoto : selectedPhotos[0] || null;
  const stepPhoto = (offset: -1 | 1) => {
    if (!selectedPhotos.length) return;
    const index = Math.max(0, selectedPhotos.indexOf(displayedPhoto || selectedPhotos[0]));
    setSelectedPhoto(selectedPhotos[(index + offset + selectedPhotos.length) % selectedPhotos.length]);
  };
  const finishGallerySwipe = (endX: number) => {
    const startX = galleryTouchStart.current;
    galleryTouchStart.current = null;
    if (startX !== null && Math.abs(startX - endX) > 36) stepPhoto(startX > endX ? 1 : -1);
  };
  const selectCategory = (value: string) => {
    setCategory(value);
    setFilterCategory(value === 'todos' ? 'todas' : value);
    setActiveNav(value === 'cuias' || value === 'bombas' || value === 'lotes-de-cuias' ? value : 'inicio');
  };

  useEffect(() => {
    if (category !== 'todos') document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [category]);

  useEffect(() => {
    let frame: number | null = null;
    let positionFrame: number | null = null;
    let observer: IntersectionObserver | null = null;
    let mutations: MutationObserver | null = null;
    const pending = new Set<Element>();
    const positions = new Map<Element, number>();
    let lastFallbackY = window.scrollY;
    const root = document.documentElement;

    const reveal = (element: Element) => {
      pending.delete(element);
      positions.delete(element);
      element.classList.add('is-visible');
      observer?.unobserve(element);
    };

    const refreshPositions = () => {
      if (positionFrame !== null) return;
      positionFrame = window.requestAnimationFrame(() => {
        positionFrame = null;
        const scrollY = window.scrollY;
        for (const element of pending) {
          if (element.isConnected) positions.set(element, element.getBoundingClientRect().top + scrollY);
          else {
            pending.delete(element);
            positions.delete(element);
            observer?.unobserve(element);
          }
        }
      });
    };

    const updateScrollState = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const scrollY = window.scrollY;
        const nextScrolled = scrollY > 36;
        setHeaderScrolled((current) => current === nextScrolled ? current : nextScrolled);

        const jumpThreshold = Math.max(window.innerHeight * 0.65, 250);
        if (Math.abs(scrollY - lastFallbackY) < jumpThreshold) return;
        lastFallbackY = scrollY;
        const revealBoundary = scrollY + window.innerHeight * 0.92;
        for (const [element, top] of positions) {
          if (top <= revealBoundary) reveal(element);
        }
      });
    };

    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', refreshPositions, { passive: true });

    try {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (pending.has(entry.target)) positions.set(entry.target, entry.boundingClientRect.top + window.scrollY);
            if (entry.isIntersecting) reveal(entry.target);
          }
        }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });

        const observe = (element: Element) => {
          const candidates = element.matches('[data-reveal]') ? [element] : [];
          candidates.push(...element.querySelectorAll('[data-reveal]'));
          candidates.forEach((candidate) => {
            if (candidate.classList.contains('motion-observed')) return;
            candidate.classList.add('motion-observed');
            pending.add(candidate);
            observer?.observe(candidate);
          });
        };

        root.classList.add('motion-ready');
        document.querySelectorAll('[data-reveal]').forEach(observe);
        mutations = new MutationObserver((records) => {
          let refresh = false;
          records.forEach((record) => {
            record.addedNodes.forEach((node) => {
              if (node instanceof Element) {
                observe(node);
                refresh = true;
              }
            });
            if (record.removedNodes.length) refresh = true;
          });
          for (const element of pending) {
            if (!element.isConnected) {
              pending.delete(element);
              positions.delete(element);
              observer?.unobserve(element);
              refresh = true;
            }
          }
          if (refresh) refreshPositions();
        });
        mutations.observe(document.body, { childList: true, subtree: true });
      }
    } catch {
      root.classList.remove('motion-ready');
      observer?.disconnect();
      mutations?.disconnect();
      observer = null;
      mutations = null;
      pending.clear();
      positions.clear();
      document.querySelectorAll('.motion-observed').forEach((element) => element.classList.remove('motion-observed'));
    }

    updateScrollState();
    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', refreshPositions);
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (positionFrame !== null) window.cancelAnimationFrame(positionFrame);
      observer?.disconnect();
      mutations?.disconnect();
      root.classList.remove('motion-ready');
      document.querySelectorAll('.motion-observed').forEach((element) => element.classList.remove('motion-observed'));
    };
  }, []);

  return (
    <>
      <header className={`header ${category === 'todos' ? 'header-home' : ''} ${category === 'todos' && headerScrolled ? 'header-scrolled' : ''}`}>
        <div className="container header-inner">
          <a className="logo wordmark-logo" href="#inicio" onClick={() => { setCategory('todos'); setFilterCategory('todas'); setActiveNav('inicio'); }} aria-label="Dom Cossé, início"><span>Dom Cossé</span></a>
          <nav id="primary-navigation" className={`nav ${menu ? 'open' : ''}`} aria-label="Navegação principal">
            <a href="#inicio" onClick={() => { setCategory('todos'); setActiveNav('inicio'); setMenu(false); }} aria-current={activeNav === 'inicio' ? 'page' : undefined}>Início</a>
            <a href="#produtos" onClick={() => { setActiveNav('catalogo'); setMenu(false); }} aria-current={activeNav === 'catalogo' ? 'page' : undefined}>Catálogo</a>
            <a href="#produtos" onClick={() => { selectCategory('cuias'); setMenu(false); }}>Cuias</a>
            <a href="#produtos" onClick={() => { selectCategory('bombas'); setMenu(false); }}>Bombas</a>
            <a href="#produtos" onClick={() => { selectCategory('lotes-de-cuias'); setMenu(false); }}>Lotes</a>
            <a href="#atacado" onClick={() => { setActiveNav('atacado'); setMenu(false); }}>Varejo e lojistas</a>
            <a href="#essencia" onClick={() => { setActiveNav('essencia'); setMenu(false); }}>Nossa essência</a>
            <a href="#contato" onClick={() => { setActiveNav('contato'); setMenu(false); }} aria-current={activeNav === 'contato' ? 'page' : undefined}>Contato</a>
          </nav>
          <div className="header-tools">
            <div className="header-actions">
              <label className="header-search-field"><input aria-label="Buscar produtos" type="search" placeholder="Buscar produtos..." value={search} onChange={(event) => setSearch(event.target.value)}/><Search size={17} aria-hidden="true"/></label>
              <button className="header-icon-button header-search-button" type="button" aria-label="Buscar produtos" onClick={() => { document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }); window.setTimeout(() => searchInput.current?.focus(), 350); }}><Search size={20}/></button>
              {whatsappHref && <a className="btn header-cta" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'header', category: category === 'todos' ? null : category })}><FaWhatsapp size={20}/><span className="cta-label">WhatsApp</span></a>}
              <button className="menu-button" type="button" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-controls="primary-navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {category === 'todos' && <section className="hero hero-branded-banner" id="inicio" aria-label="Dom Cossé — Avios de Mate" data-reveal="section">
          <div className="hero-banner-frame">
            <h1 className="sr-only">Dom Cossé — Avios de Mate. O autêntico mate gaúcho.</h1>
            <picture className="hero-banner-picture">
              <source media="(max-width: 639px)" srcSet={heroMobileImage} width={1086} height={875}/>
              <img className="hero-banner-image" src={heroDesktopImage} width={1086} height={875} alt="Dom Cossé — Avios de Mate. O autêntico mate gaúcho." fetchPriority="high" decoding="async"/>
            </picture>
            {whatsappHref && <a className="hero-image-link hero-image-link-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp" onClick={() => trackWhatsAppClick({ placement: 'hero' })}/>}
            <a className="hero-image-link hero-image-link-catalog" href="#catalogo" aria-label="Ver catálogo"/>
          </div>
        </section>}

        {category === 'todos' && <section className="brand-benefits" aria-label="Benefícios Dom Cossé" data-reveal="section"><div className="brand-benefits-inner"><div><ShieldCheck aria-hidden="true"/><span>Qualidade artesanal</span></div><i aria-hidden="true"/><div><Handshake aria-hidden="true"/><span>Atendimento direto</span></div><i aria-hidden="true"/><div><Truck aria-hidden="true"/><span>Envio para todo o Brasil</span></div></div></section>}

        <section className={`container section ${category === 'todos' ? 'categories-home' : 'categories-list'}`} id="categorias" data-reveal="section">
          {category === 'todos' ? <div className="section-heading"><h2 className="section-title">Conheça nossos produtos</h2></div> : <div className="category-page-heading"><p className="catalog-breadcrumb"><a href="#inicio" onClick={() => selectCategory('todos')}>Início</a><span aria-hidden="true">/</span>{(categories.length ? categories : DEFAULT_CATEGORIES).find((item) => item.slug === category)?.name || category}</p><h2>{(categories.length ? categories : DEFAULT_CATEGORIES).find((item) => item.slug === category)?.name || category}</h2></div>}
          <div className="category-grid">
            {category !== 'todos' && <button className="category-card" onClick={() => selectCategory('todos')} aria-pressed={false}><span className="category-icon all-icon"><ShapesIcon/></span><span>TODOS</span><ArrowRight className="arrow"/></button>}
            {(categories.length ? categories : DEFAULT_CATEGORIES).filter((item) => category !== 'todos' || item.slug === 'cuias' || item.slug === 'bombas').map((item, index) => {
              const fallbackImage = DEFAULT_CATEGORIES.find((fallback) => fallback.slug === item.slug)?.image_url ?? '';
              const homeImage = item.slug === 'cuias' ? '/images/categorias/cuias-card.png' : item.slug === 'bombas' ? '/images/categorias/bombas.png' : item.image_url || fallbackImage;
              const categoryImage = category === 'todos' ? homeImage : item.image_url || fallbackImage;
              const homeProductImage = item.slug === 'cuias' ? '/images/categorias/cuias-produto.png' : item.slug === 'bombas' ? '/images/categorias/bombas-produto.png' : '';
              const homeProductImageWidth = item.slug === 'cuias' ? 250 : 255;
              const homeProductImageHeight = item.slug === 'cuias' ? 286 : 293;
              return <button key={item.slug} data-reveal="card" className={['category-card', 'category-photo-card', 'category-' + item.slug, category === item.slug ? 'active' : ''].filter(Boolean).join(' ')} style={{ '--category-image': 'url("' + categoryImage + '")', '--reveal-delay': (index * 80) + 'ms' } as CSSProperties} onClick={() => selectCategory(item.slug)} aria-pressed={category === item.slug}>
                <span className="category-cover" aria-hidden="true"/>
                {category === 'todos' && homeProductImage && <Image className="category-product-image" src={homeProductImage} alt="" aria-hidden="true" width={homeProductImageWidth} height={homeProductImageHeight} unoptimized/>}
                <span className="category-icon"><MateIcon type={item.icon}/></span>
                <span className="category-label-group"><span className="category-name">{item.name}</span>{category === 'todos' ? <span className="category-arrow" aria-hidden="true"><ArrowRight/></span> : <ArrowRight className="arrow"/>}</span>
              </button>;
            })}
          </div>
        </section>

        {category === 'todos' && featuredProducts.length > 0 && <section className="container section featured-products-section" id="destaques" data-reveal="section">
          <div className="products-head"><h2 className="section-title">Produtos em destaque</h2></div>
          <div className="product-grid">{featuredProducts.map((product, index) => <ProductCard key={product.id} product={product} onOpen={openProduct} whatsapp={storeSettings.whatsapp} revealIndex={index}/>)}</div>
        </section>}

        <section className="container section products-section" id="produtos" data-reveal="section">
          <span id="catalogo" className="anchor-alias" aria-hidden="true"/>
          <div className="products-head"><h2 className="section-title">Catálogo completo</h2><div className="catalog-head-actions">{products.length > 0 && !catalogError && <button className="catalog-mobile-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-filters-panel" onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={17}/>{filtersOpen ? 'Fechar filtros' : 'Filtros'}</button>}{hasActiveFilters && <button className="catalog-clear-filters" type="button" onClick={clearFilters}><RotateCcw size={15}/>Limpar filtros</button>}</div></div>
          {products.length > 0 && !catalogError && <div className={`catalog-filters ${filtersOpen ? 'filters-open' : ''}`} id="catalog-filters-panel" aria-label="Filtros do catálogo">
            <label className="catalog-search-filter"><span className="sr-only">Buscar no catálogo</span><Search size={19} aria-hidden="true"/><input ref={searchInput} className="search" type="search" placeholder="Buscar no catálogo..." aria-label="Buscar produto" enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
            <label className="filter-category"><span className="sr-only">Categoria</span><select value={filterCategory} onChange={(event) => { setFilterCategory(event.target.value); setCategory(event.target.value === 'todas' ? 'todos' : event.target.value); }}><option value="todas">Categoria</option>{(categories.length ? categories : DEFAULT_CATEGORIES).map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            {measureCategory === 'cuias' && <label className="filter-virola"><span className="sr-only">Tipo de acabamento da cuia</span><select value={filterVirola} onChange={(event) => setFilterVirola(event.target.value)}><option value="todas">Virola ou bocal</option><option value="virola">Virola de alpaca</option><option value="bocal">Bocal de alpaca</option><option value="sem">Sem acabamento informado</option></select></label>}
            {measureCategory === 'cuias' && <label className="filter-measure"><span className="sr-only">Largura da virola ou bocal</span><select value={filterMeasure} onChange={(event) => setFilterMeasure(event.target.value)}><option value="todas">Medida da virola</option>{['4','6','10','15','25'].map((value) => <option key={value} value={value}>{value} mm</option>)}</select></label>}
            <label className="filter-availability"><span className="sr-only">Disponibilidade</span><select value={filterAvailability} onChange={(event) => setFilterAvailability(event.target.value)}><option value="todas">Disponibilidade</option><option value="disponivel">Disponível</option><option value="esgotado">Esgotado</option></select></label>
            <label className="filter-sort"><span className="sr-only">Ordenar produtos</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="recentes">Mais recentes</option><option value="nome">Nome A–Z</option><option value="preco">Menor preço</option><option value="disponiveis">Disponíveis primeiro</option></select></label>
          </div>}
          {!catalogError && products.length > 0 && <p className="catalog-results-count" role="status">{sortedVisible.length} {sortedVisible.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>}
          {catalogError ? <div className="catalog-state catalog-error" role="alert"><strong>Não foi possível carregar o catálogo.</strong><span>Tente novamente em instantes.</span><button type="button" onClick={() => void retryCatalog()} disabled={catalogLoading}>{catalogLoading ? 'Carregando…' : 'Tentar novamente'}</button></div>
            : products.length === 0 ? <div className="catalog-empty catalog-empty-compact" data-reveal="card"><Package size={36} strokeWidth={1.6} aria-hidden="true"/><strong>Nosso catálogo está em preparação.</strong><span>Enquanto isso, consulte cuias, bombas e lotes disponíveis diretamente com nossa equipe.</span>{whatsappHref && <a className="empty-whatsapp-cta" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'contact' })}><FaWhatsapp size={17}/>Consultar pelo WhatsApp</a>}</div>
              : sortedVisible.length > 0 ? <div className="product-grid">{sortedVisible.map((product, index) => <ProductCard key={product.id} product={product} onOpen={openProduct} whatsapp={storeSettings.whatsapp} revealIndex={index}/>)}</div>
              : <div className="catalog-empty" data-reveal="card"><Package size={36} strokeWidth={1.6} aria-hidden="true"/><strong>Nenhum produto encontrado.</strong><span>Tente ajustar os filtros ou limpar sua busca.</span>{hasActiveFilters && <button className="catalog-clear-filters" type="button" onClick={clearFilters}>Limpar filtros</button>}</div>}
        </section>

        {category === 'todos' && <section className="retail-section container" id="atacado" data-reveal="section"><div className="retail-heading"><h2 className="section-title">Varejo e lojistas</h2><p>Escolha o tipo de atendimento. Disponibilidade e condições são confirmadas pelo WhatsApp.</p></div><div className="retail-options"><article><h3>Para você</h3><p>Consulte modelos, valores e disponibilidade.</p>{whatsappHref && <a className="btn retail-button" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'contact' })}><FaWhatsapp/>Consultar produtos</a>}</article><article><h3>Para lojistas</h3><p>Converse com nossa equipe sobre revenda.</p>{whatsappNumber(storeSettings.whatsapp) && <a className="btn retail-button retailer" href={retailerWhatsAppHref(storeSettings.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'contact' })}><FaWhatsapp/>Sou lojista</a>}</article></div></section>}

        {category === 'todos' && <section className="essence-section" id="essencia" data-reveal="section"><div className="container essence-inner"><h2>Nossa essência</h2><p>A Dom Cossé reúne cuias, bombas e avios para quem valoriza a tradição do mate gaúcho.</p></div></section>}

        <section className="how-to-section container" id="como-pedir" data-reveal="section"><h2 className="section-title">Como pedir</h2><div className="how-to-steps"><div><span className="how-to-icon"><ShoppingCart/></span><strong>1. Consulte os modelos disponíveis.</strong></div><ArrowRight className="step-arrow"/><div><span className="how-to-icon"><FaWhatsapp/></span><strong>2. Fale com nossa equipe pelo WhatsApp.</strong></div><ArrowRight className="step-arrow"/><div><span className="how-to-icon"><Handshake/></span><strong>3. Confirme valores, pagamento e entrega.</strong></div></div></section>

        <section className="faq-section container" id="duvidas" data-reveal="section"><h2 className="section-title">Dúvidas frequentes</h2><div className="faq-list"><details><summary>Como faço um pedido?</summary><p>Escolha um modelo e envie sua consulta pelo WhatsApp. A equipe confirma os próximos passos no atendimento.</p></details><details><summary>Como confirmo frete e entrega?</summary><p>As opções de envio e a entrega são confirmadas no atendimento, conforme o pedido e o destino.</p></details><details><summary>Como funciona o atendimento para lojistas?</summary><p>Use o botão “Sou lojista” para iniciar uma conversa dedicada. As condições comerciais são confirmadas diretamente pela equipe.</p></details><details><summary>Onde encontro as medidas do produto?</summary><p>Para consultar as medidas dos modelos disponíveis, fale com nossa equipe pelo WhatsApp.</p></details></div></section>

        <section className="contact-section" id="contato" data-reveal="section">
          <div className="container contact-inner">
            <h2 className="section-title">Fale com a Dom Cossé</h2>
            <p>Estamos à disposição para ajudar com pedidos, produtos e atendimento para lojistas.</p>
            <div className="contact-methods">
              {storeAddress && <a className="contact-method contact-location-row" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([storeAddress, storeSettings.postal_code].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" aria-label={`Localização: ${storeAddress}`}><span className="contact-method-icon"><MapPin aria-hidden="true"/></span><span className="contact-method-copy"><strong>Localização</strong><span className="contact-address-text">{storeAddress}{storeSettings.postal_code ? ` · CEP ${storeSettings.postal_code}` : ''}</span></span></a>}
              {instagram && <a className="contact-method" href={instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${instagramLabel}`}><span className="contact-method-icon"><Instagram aria-hidden="true"/></span><span className="contact-method-copy"><strong>Instagram</strong><span>{instagramLabel}</span></span></a>}
              {whatsappHref && <a className="contact-method" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'contact', category: category === 'todos' ? null : category })} aria-label={`WhatsApp: ${storeSettings.whatsapp}`}><span className="contact-method-icon"><FaWhatsapp aria-hidden="true"/></span><span className="contact-method-copy"><strong>WhatsApp</strong><span>{storeSettings.whatsapp}</span></span></a>}
              {storeSettings.email && <a className="contact-method" href={`mailto:${storeSettings.email}`} aria-label={`E-mail: ${storeSettings.email}`}><span className="contact-method-icon"><Mail aria-hidden="true"/></span><span className="contact-method-copy"><strong>E-mail</strong><span>{storeSettings.email}</span></span></a>}
            </div>
          </div>
        </section>

      </main>

      <footer className="footer" id="rodape" data-reveal="section"><div className="container footer-inner"><a className="logo footer-logo wordmark-logo" href="#inicio" aria-label="Dom Cossé, início"><span>Dom Cossé</span></a><p className="footer-slogan">O autêntico mate gaúcho</p><nav className="footer-links" aria-label="Links do rodapé"><a href="#inicio">Início</a><i>|</i><a href="#produtos">Catálogo</a><i>|</i><a href="#categorias" onClick={() => selectCategory('cuias')}>Cuias</a><i>|</i><a href="#categorias" onClick={() => selectCategory('bombas')}>Bombas</a><i>|</i><a href="#categorias" onClick={() => selectCategory('lotes-de-cuias')}>Lotes</a><i>|</i><a href="#atacado">Varejo e lojistas</a><i>|</i><a href="#essencia">Nossa essência</a><i>|</i><a href="#contato">Contato</a></nav><div className="footer-social-icons" aria-label="Redes sociais">{whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={() => trackWhatsAppClick({ placement: 'contact', category: category === 'todos' ? null : category })}><FaWhatsapp/><span>WhatsApp</span></a>}{instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram/><span>Instagram</span></a>}</div><small className="footer-company">{storeSettings.company_name}</small></div></footer>

      {(whatsappHref || instagram) && <div className="social-floats" aria-label="Atalhos para redes sociais">{whatsappHref && <a className="social-float wa" href={whatsappHref} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'floating', category: category === 'todos' ? null : category })}><FaWhatsapp size={24}/></a>}{instagram && <a className="social-float ig" href={instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><Instagram size={22}/></a>}</div>}


      {selected && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProduct(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1} ref={modalRef}>
        <button className="modal-close" onClick={closeProduct} aria-label="Fechar detalhes"><X/></button><h2 className="modal-mobile-title">Detalhes do produto</h2>
        <div className="modal-body"><div>
          <div className="modal-image-wrap" onTouchStart={(event) => { galleryTouchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => finishGallerySwipe(event.changedTouches[0]?.clientX ?? 0)}>
            <button className="modal-image" type="button" onClick={() => displayedPhoto && setZoomed(true)} aria-label="Ampliar fotografia do produto">
              {displayedPhoto ? <Image src={displayedPhoto} alt={selected.name} fill sizes="(max-width: 767px) 100vw, 50vw" quality={82}/> : <span>Foto ainda não cadastrada</span>}
            </button>
            {selectedPhotos.length > 1 && <><button className="gallery-step previous" type="button" onClick={() => stepPhoto(-1)} aria-label="Foto anterior"><ChevronLeft/></button><button className="gallery-step next" type="button" onClick={() => stepPhoto(1)} aria-label="Próxima foto"><ChevronRight/></button><span className="gallery-position">{selectedPhotos.indexOf(displayedPhoto || '') + 1} / {selectedPhotos.length}</span></>}
          </div>
          {selectedPhotos.length > 1 && <div className="product-gallery-thumbs" aria-label="Fotos do produto">{selectedPhotos.map((url, index) => <button key={`${url}-${index}`} type="button" aria-label={`Ver foto ${index + 1}`} aria-pressed={displayedPhoto === url} onClick={() => setSelectedPhoto(url)}><Image src={url} alt="" fill sizes="72px" loading="lazy"/></button>)}</div>}
        </div><div className="modal-info">
          <p className="muted">{categories.find((item) => item.slug === selected.category)?.name || selected.category}{selected.lot_quantity ? ` · Lote com ${selected.lot_quantity} cuias` : ''}</p><h2 id="detail-title">{selected.name}</h2><p className="price">{selected.price === null ? 'Consulte pelo WhatsApp' : money(Number(selected.price))}</p><p className={`availability ${selected.status === 'esgotado' ? 'unavailable' : ''}`}><span aria-hidden="true"/>{selected.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</p>
          {selected.description && <div className="modal-description-block"><h3>Descrição</h3><p className="muted modal-description">{selected.description}</p></div>}
          <a className="consult" href={productWhatsAppHref(storeSettings.whatsapp, selected.name, selected.category, { id: selected.id, quantity: selected.lot_quantity })} target="_blank" rel="noopener noreferrer" aria-disabled={!whatsappNumber(storeSettings.whatsapp)} onClick={(event) => { if (!whatsappNumber(storeSettings.whatsapp)) event.preventDefault(); else trackWhatsAppClick({ placement: 'product_modal', category: selected.category, productId: selected.id }); }}><FaWhatsapp size={21}/>Consultar pelo WhatsApp</a>
          <a className="product-page-link" href={`/produtos/${selected.id}`}>Abrir página deste produto</a>
        </div></div></div></div>}
      {zoomed && displayedPhoto && <div className="image-zoom" role="dialog" aria-modal="true" aria-label={`Foto ampliada: ${selected?.name || 'produto'}`} onClick={() => setZoomed(false)}><button type="button" onClick={() => setZoomed(false)} aria-label="Fechar foto ampliada"><X/></button><Image src={displayedPhoto} alt={selected?.name || 'Foto do produto'} fill sizes="100vw" quality={90}/></div>}
    </>
  );
}
