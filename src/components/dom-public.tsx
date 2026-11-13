'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Clock3, Instagram, Mail, MapPin, Menu, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { CATEGORY_PHOTOS, instagramLabel, sectionAnchor, splitSectionTitle, whatsappHref, type DomHighlight, type DomProduct, type DomSection, type DomSettings } from '@/lib/dom-data';

type Page = 'home' | 'catalog' | 'cuias' | 'bombas' | 'history' | 'contact';
type Props = { page: Page; sections: DomSection[]; products: DomProduct[]; highlights: DomHighlight[]; settings: DomSettings; photos: Record<string,string> };
const nav = [['Início','/'],['Catálogo','/catalogo'],['Cuias','/catalogo/cuias'],['Bombas','/catalogo/bombas'],['Nossa história','/nossa-historia'],['Fale conosco','/contato']];

function categoryHref(category: string) { return `/catalogo/${category}`; }
function instagramHref(value: string) { try { const url = new URL(value); if (url.protocol === 'https:' && ['instagram.com','www.instagram.com'].includes(url.hostname)) return url.toString(); } catch {} const name = value.trim().replace(/^@/,''); return `https://www.instagram.com/${encodeURIComponent(name || 'domcosse')}/`; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  return <div className="dc-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className="dc-modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}><button className="dc-icon-button dc-modal-close" onClick={onClose} aria-label="Fechar"><X/></button>{children}</div></div>;
}

export default function DomPublic({ page, sections, products, highlights, settings, photos }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DomProduct | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [motion, setMotion] = useState(false);
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const whatsapp = whatsappHref(settings.whatsapp);
  const instagram = instagramHref(settings.instagram);
  const category = page === 'cuias' || page === 'bombas' ? page : null;
  const displayedSections = sections.filter(section => section.is_visible && products.some(product => product.section_id === section.id && product.is_published));
  useEffect(() => {
    const lowPower = (navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }).deviceMemory;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const canAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !(lowPower && lowPower <= 2) && !(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) && !saveData;
    if (!canAnimate) return;
    const start = () => setMotion(true);
    if (document.readyState === 'complete') { if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(start); else setTimeout(start, 0); } else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);
  useEffect(() => {
    if (!motion) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('dc-visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
    document.querySelectorAll('.dc-reveal').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [motion, page]);
  useEffect(() => {
    if (!motion || !heroRef.current) return;
    let scheduled = false;
    const update = () => { scheduled = false; if (heroRef.current && heroRef.current.getBoundingClientRect().bottom > 0) heroRef.current.style.setProperty('--hero-depth', `${Math.min(window.scrollY / 18, 42)}px`); };
    const scroll = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', scroll, { passive: true });
    return () => window.removeEventListener('scroll', scroll);
  }, [motion]);
  useEffect(() => {
    if (!motion || !orientationEnabled) return;
    function orient(event: DeviceOrientationEvent) {
      if (!heroRef.current || heroRef.current.getBoundingClientRect().bottom < 0) return;
      const rx = Math.max(-3, Math.min(3, (event.beta || 0) / 20));
      const ry = Math.max(-3, Math.min(3, (event.gamma || 0) / 20));
      heroRef.current.style.setProperty('--rx', `${rx}deg`);
      heroRef.current.style.setProperty('--ry', `${ry}deg`);
    }
    window.addEventListener('deviceorientation', orient, { passive: true });
    return () => window.removeEventListener('deviceorientation', orient);
  }, [motion, orientationEnabled]);
  async function enableOrientation() {
    if (!motion || orientationEnabled) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;
    const orientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<'granted'|'denied'>};
    if (!orientation.requestPermission || await orientation.requestPermission() === 'granted') setOrientationEnabled(true);
  }
  useEffect(() => {
    if (highlightIndex === null) return;
    const handler = (event: KeyboardEvent) => { if (event.key === 'ArrowLeft') setHighlightIndex(i => i === null ? 0 : (i + 2) % 3); if (event.key === 'ArrowRight') setHighlightIndex(i => i === null ? 0 : (i + 1) % 3); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [highlightIndex]);
  const tilt = (event: React.PointerEvent<HTMLElement>, max: number) => {
    if (!motion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    event.currentTarget.style.setProperty('--rx', `${-y * max * 2}deg`);
    event.currentTarget.style.setProperty('--ry', `${x * max * 2}deg`);
  };
  const untilt = (event: React.PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg'); };
  const photo = (slug: string) => photos[slug] || CATEGORY_PHOTOS[slug as keyof typeof CATEGORY_PHOTOS];
  const customBanner = !!(settings.banner_url || settings.banner_mobile_url);
  return <div className={`dc-site ${motion ? 'dc-motion' : ''}`}>
    <header className="dc-header"><div className="dc-header-inner"><Link href="/" className="dc-logo" aria-label="Dom Cossé, início"><img src="/dom-cosse-logo.png" alt="Dom Cossé Avios de Mate"/></Link><button className="dc-icon-button dc-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button></div>{menuOpen && <nav className="dc-menu" aria-label="Menu principal">{nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}<a className="dc-button dc-button-wa" href={whatsapp} target="_blank" rel="noreferrer"><FaWhatsapp/> Pedir no WhatsApp</a></nav>}</header>
    <main>
      {page === 'home' && <>
        <section className={`dc-hero ${customBanner ? 'dc-custom-hero' : 'dc-reference-hero'}`} ref={heroRef} onPointerMove={event => tilt(event, 3)} onPointerLeave={untilt} onTouchStart={enableOrientation} aria-label="Dom Cossé Avios de Mate"><picture className="dc-hero-photo"><source media="(min-width: 768px)" srcSet={settings.banner_url || settings.banner_mobile_url || '/banners/referencia-desktop.jpg'}/><img src={settings.banner_mobile_url || settings.banner_url || '/banners/referencia-mobile.jpg'} alt="" fetchPriority="high" decoding="async"/></picture>{customBanner ? <div className="dc-hero-content"><h1>DOM COSSÉ<br/>AVIOS DE MATE</h1><p>O autêntico mate gaúcho.</p><Link className="dc-button" href="/catalogo">Ver catálogo</Link><a className="dc-button dc-button-wa" href={whatsapp} target="_blank" rel="noreferrer"><FaWhatsapp/> Pedir no WhatsApp</a></div> : <><div className="dc-hero-accessibility"><h1>DOM COSSÉ<br/>AVIOS DE MATE</h1><p>O autêntico mate gaúcho.</p></div><Link className="dc-hero-hit dc-hero-hit-catalog" href="/catalogo" aria-label="Ver catálogo"/><a className="dc-hero-hit dc-hero-hit-whatsapp" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Pedir no WhatsApp"/></>}</section>
        <div className="dc-container dc-home-sections"><section><h2>DESTAQUES</h2><div className="dc-highlights">{[0,1,2].map(index => <button key={index} className="dc-highlight dc-reveal" onClick={() => { const item=highlights[index]; if (!item?.image_url) return; if (item.link_url) window.location.assign(item.link_url); else setHighlightIndex(index); }} aria-label={`Destaque ${String(index + 1).padStart(2, '0')}${highlights[index]?.title ? `, ${highlights[index].title}` : ''}${highlights[index]?.image_url ? highlights[index].link_url ? ', abrir link' : ', ampliar imagem' : ', sem imagem'}`}><div>{highlights[index]?.image_url && <img src={highlights[index].image_url!} alt={highlights[index].alt_text || highlights[index].title || `Destaque ${index+1}`}/>}</div><span>{String(index + 1).padStart(2, '0')}</span>{highlights[index]?.image_url && highlights[index]?.title && <small className="dc-highlight-title">{highlights[index].title}</small>}</button>)}</div></section>
          <section><h2>CATÁLOGO</h2><div className="dc-home-categories">{(['cuias','bombas'] as const).map(slug => <Link className="dc-home-category dc-reveal" key={slug} href={categoryHref(slug)} onPointerMove={event => tilt(event, 6)} onPointerLeave={untilt}><img src={photo(slug)} alt=""/><strong>{slug === 'cuias' ? 'Cuias' : 'Bombas'}</strong><ChevronRight/></Link>)}</div></section>
          <section><h2>NOSSA HISTÓRIA</h2><p>Conheça a trajetória da Dom Cossé e a nossa ligação com o mate gaúcho.</p><Link className="dc-button" href="/nossa-historia">Ler nossa história</Link></section>
          <section><h2>FALE CONOSCO</h2><p>Tire suas dúvidas, consulte modelos e faça seu pedido diretamente conosco.</p><Link className="dc-button" href="/contato">Entrar em contato</Link></section></div>
      </>}
      {page === 'catalog' && <div className="dc-container dc-page"><h1>CATÁLOGO</h1><p className="dc-intro">Escolha a categoria e veja todos os modelos.</p><div className="dc-catalog-categories">{(['cuias','bombas'] as const).map(slug => <Link className="dc-category-tile dc-reveal" key={slug} href={categoryHref(slug)} onPointerMove={event => tilt(event, 6)} onPointerLeave={untilt}><img src={photo(slug)} alt={`Categoria ${slug}`}/><strong>{slug.toUpperCase()} <ChevronRight/></strong></Link>)}</div></div>}
      {category && <div className="dc-container dc-page"><nav className="dc-breadcrumb" aria-label="Caminho"><Link href="/">Início</Link><ChevronRight/><Link href="/catalogo">Catálogo</Link><ChevronRight/><span>{category === 'cuias' ? 'Cuias' : 'Bombas'}</span></nav><h1>{category.toUpperCase()}</h1>{displayedSections.filter(section => section.category === category).length ? displayedSections.filter(section => section.category === category).map(section => { const title = splitSectionTitle(section.title); return <section className="dc-product-section" id={sectionAnchor(section)} key={section.id}><div className="dc-section-heading"><h2>{title.base}</h2>{title.pill && <div className="dc-pill-row dc-reveal"><i/><span>{title.pill}</span><i/></div>}</div><div className="dc-product-grid">{products.filter(product => product.section_id === section.id && product.is_published).map(product => <button className="dc-product-card dc-reveal" key={product.id} onClick={() => setSelectedProduct(product)} onPointerMove={event => tilt(event, 3)} onPointerLeave={untilt}><span className="dc-product-image">{product.image_url && <img src={product.image_url} alt={product.name} loading="lazy"/>}</span><strong>{product.name}</strong>{product.measure && <small>{product.measure}</small>}</button>)}</div></section>; }) : <div className="dc-empty-category">{sections.filter(section=>section.category===category).map(section=><span id={sectionAnchor(section)} key={section.id} className="dc-empty-anchor"/>)}<p>Novos modelos em breve. Peça pelo WhatsApp.</p><a className="dc-button dc-button-wa" href={whatsapp} target="_blank" rel="noreferrer"><FaWhatsapp/> Pedir no WhatsApp</a></div>}</div>}
      {page === 'history' && <div className="dc-container dc-page dc-text-page"><h1>NOSSA HISTÓRIA</h1><div className="dc-rule"/><p>{settings.history_text}</p></div>}
      {page === 'contact' && <div className="dc-container dc-page dc-text-page"><h1>FALE COM A DOM COSSÉ</h1><div className="dc-contact-list"><a href={whatsapp} target="_blank" rel="noreferrer"><FaWhatsapp/><span>WhatsApp<br/><strong>{settings.whatsapp}</strong></span></a><a href={instagram} target="_blank" rel="noreferrer"><Instagram/><span>Instagram<br/><strong>{instagramLabel(settings.instagram)}</strong></span></a><a href={`mailto:${settings.email}`}><Mail/><span>E-mail<br/><strong>{settings.email}</strong></span></a><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.address}, ${settings.city}/${settings.state}`)}`} target="_blank" rel="noreferrer"><MapPin/><span>Endereço<br/><strong>{settings.address}, {settings.city}/{settings.state}.</strong></span></a><div><Clock3/><span>Horário de atendimento<br/><strong>{settings.business_hours}</strong></span></div></div></div>}
    </main>
    <footer className="dc-footer"><div className="dc-container"><Link href="/" className="dc-footer-logo"><img src="/dom-cosse-logo.png" alt="Dom Cossé Avios de Mate"/></Link><div className="dc-footer-columns">{(['cuias','bombas'] as const).map(slug => <div key={slug}><h2>{slug.toUpperCase()}</h2>{sections.filter(section => section.category === slug && section.is_visible).map(section => <Link key={section.id} href={`${categoryHref(slug)}#${sectionAnchor(section)}`}>{section.short_label}</Link>)}</div>)}</div><nav>{[['Início','/'],['Catálogo','/catalogo'],['Nossa história','/nossa-historia'],['Fale conosco','/contato']].map(([label,href]) => <Link key={href} href={href}>{label}</Link>)}</nav><p>José Maria Representações Ltda. Ijuí/RS.<br/>© 2026 Dom Cossé Avios de Mate.</p></div></footer>
    <div className="dc-float-links"><a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram/></a><a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp/></a></div>
    {selectedProduct && <Modal title={selectedProduct.name} onClose={() => setSelectedProduct(null)}><div className="dc-product-detail"><div className="dc-product-detail-image" onPointerMove={event=>tilt(event,3)} onPointerLeave={untilt}>{selectedProduct.image_url && <img src={selectedProduct.image_url} alt={selectedProduct.name}/>}</div><h2>{selectedProduct.name}</h2>{selectedProduct.description && <p>{selectedProduct.description}</p>}<a className="dc-button dc-button-wa" href={whatsappHref(settings.whatsapp, selectedProduct.name)} target="_blank" rel="noreferrer"><FaWhatsapp/> Pedir no WhatsApp</a></div></Modal>}
    {highlightIndex !== null && <Modal title="Destaques da loja" onClose={() => setHighlightIndex(null)}><div className="dc-coverflow" onTouchStart={event => { (event.currentTarget as HTMLElement).dataset.touchX = String(event.touches[0].clientX); }} onTouchEnd={event => { const start = Number((event.currentTarget as HTMLElement).dataset.touchX); const delta = event.changedTouches[0].clientX - start; if (Math.abs(delta) > 40) setHighlightIndex((highlightIndex + (delta < 0 ? 1 : 2)) % 3); }}><button className="dc-icon-button" aria-label="Destaque anterior" onClick={() => setHighlightIndex((highlightIndex + 2) % 3)}><ChevronLeft/></button><div className="dc-coverflow-stage">{highlights.map((item,index) => item.image_url && <img key={index} className={index === highlightIndex ? 'active' : index === (highlightIndex + 1) % 3 ? 'next' : 'previous'} src={item.image_url} alt={item.alt_text || `Destaque ${index+1}`} style={{ '--side': index === (highlightIndex + 1) % 3 ? 1 : -1 } as CSSProperties}/>)}</div><button className="dc-icon-button" aria-label="Próximo destaque" onClick={() => setHighlightIndex((highlightIndex + 1) % 3)}><ChevronRight/></button></div><p className="dc-coverflow-counter">{highlights[highlightIndex]?.title && <strong>{highlights[highlightIndex].title}<br/></strong>}{String(highlightIndex + 1).padStart(2,'0')} / 03</p></Modal>}
  </div>;
}
