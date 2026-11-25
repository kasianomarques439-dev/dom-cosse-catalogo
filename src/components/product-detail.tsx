'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import type { Product } from '@/lib/types';
import { productWhatsAppHref } from '@/lib/links';
import { correctBagoNomenclature } from '@/lib/dom-data';
import { trackWhatsAppClick } from '@/lib/whatsapp-events';

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function ProductDetail({ product, categoryName, whatsapp }: { product: Product; categoryName: string; whatsapp: string }) {
  const photos = [...new Set([...(product.image_url ? [product.image_url] : []), ...(product.gallery_urls || [])])];
  const productName = correctBagoNomenclature(product.name);
  const productDescription = correctBagoNomenclature(product.description);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<number | null>(null);
  const currentPhoto = photos[active] || null;
  const consultHref = productWhatsAppHref(whatsapp, productName, product.category, { id: product.id, quantity: product.lot_quantity });
  const step = (direction: -1 | 1) => setActive((index) => (index + direction + photos.length) % photos.length);

  useEffect(() => {
    if (!zoomed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setZoomed(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKeyDown); };
  }, [zoomed]);

  return <>
    <header className="product-page-header"><div className="container product-page-header-inner"><Link href="/" className="logo" aria-label="Dom Cossé, início"><Image src="/dom-cosse-logo-badge.png" alt="Dom Cossé — Avios de Mate" width={1024} height={1024}/></Link><Link href="/#produtos" className="product-back"><ArrowLeft size={18}/>Voltar ao catálogo</Link></div></header>
    <main className="container product-page-main">
      <nav className="catalog-breadcrumb" aria-label="Trilha de navegação"><Link href="/">Início</Link><span aria-hidden="true">/</span><Link href="/#produtos">Catálogo</Link><span aria-hidden="true">/</span><span>{categoryName}</span></nav>
      <div className="product-page-layout">
        <div className="product-page-gallery">
          <div className="modal-image-wrap" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; if (start !== null && photos.length > 1 && Math.abs(start - (event.changedTouches[0]?.clientX ?? start)) > 36) step(start > (event.changedTouches[0]?.clientX ?? start) ? 1 : -1); }}>
            <button type="button" className="modal-image product-page-image" onClick={() => currentPhoto && setZoomed(true)} aria-label="Ampliar fotografia do produto">
              {currentPhoto ? <Image src={currentPhoto} alt={`${productName}, foto ${active + 1}`} fill sizes="(max-width: 767px) 100vw, 55vw" preload quality={88}/> : <span>Foto ainda não cadastrada</span>}
            </button>
            {photos.length > 1 && <><button className="gallery-step previous" type="button" onClick={() => step(-1)} aria-label="Foto anterior"><ChevronLeft/></button><button className="gallery-step next" type="button" onClick={() => step(1)} aria-label="Próxima foto"><ChevronRight/></button><span className="gallery-position">{active + 1} / {photos.length}</span></>}
          </div>
          {photos.length > 1 && <div className="product-gallery-thumbs" aria-label="Fotos do produto">{photos.map((url, index) => <button key={`${url}-${index}`} type="button" aria-label={`Ver foto ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}><Image src={url} alt="" fill sizes="72px" loading="lazy"/></button>)}</div>}
        </div>
        <div className="product-page-info"><p className="brand-intro-eyebrow">{categoryName}{product.lot_quantity ? ` · ${product.lot_quantity} cuias` : ''}</p><h1>{productName}</h1><p className="price">{product.price === null ? 'Preço sob consulta' : money(Number(product.price))}</p><p className={`availability ${product.status === 'esgotado' ? 'unavailable' : ''}`}><span aria-hidden="true"/>{product.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</p>{product.description && <div className="modal-description-block"><h2>Descrição</h2><p className="muted modal-description">{productDescription}</p></div>}<p className="muted">Referência: {product.id}</p>{consultHref && <a className="consult product-page-consult" href={consultHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'product_page', category: product.category, productId: product.id })}><FaWhatsapp size={21}/>Consultar pelo WhatsApp</a>}<p className="muted product-page-note">O clique abre uma conversa no WhatsApp. A disponibilidade pode ser confirmada no atendimento.</p></div>
      </div>
    </main>
    {consultHref && !zoomed && <a className="mobile-whatsapp-cta" href={consultHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ placement: 'mobile_sticky', category: product.category, productId: product.id })}><FaWhatsapp size={19}/>Consultar pelo WhatsApp</a>}
    {zoomed && currentPhoto && <div className="image-zoom" role="dialog" aria-modal="true" aria-label={`Foto ampliada: ${productName}`} onClick={() => setZoomed(false)}><button type="button" onClick={() => setZoomed(false)} aria-label="Fechar foto ampliada"><X/></button><Image src={currentPhoto} alt={productName} fill sizes="100vw" quality={90}/></div>}
  </>;
}
