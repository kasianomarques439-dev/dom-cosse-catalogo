import Link from 'next/link';
import type { CSSProperties } from 'react';
import { DEFAULT_DOM_SETTINGS, type DomFeature, type DomSettings } from '@/lib/dom-data';
import { contactAddress, contactMapsHref } from '@/lib/dom-data';

type Props = { featured: DomFeature[]; settings: DomSettings };

const rows = [
  { title: 'Cuias', lines: [
    'Cuia Bago de Toro Tradicional Porongo Ferro — virola em alpaca: 4mm, 6mm, 10mm, 15mm e 25mm.',
    'Cuia Bago de Toro Tradicional Porongo Ferro — virola em alpaca pé de metal: 4mm, 6mm, 10mm, 15mm e 25mm.',
    'Cuia Bago de Toro Tradicional Porongo Ferro — virola em alpaca com cicatriz: 4mm, 6mm, 10mm, 15mm e 25mm.',
    'Cuia Bago de Toro Premium — bocal em alpaca: 10mm, 15mm e 25mm.',
    'Cuia Bago de Toro Premium — bocal em alpaca com cicatriz: 10mm, 15mm e 25mm.',
    'Cuia Bago de Toro — madeira de lei com virola em alpaca: 10mm e 15mm.',
    'Cuia média Porongo Ferro — bocal e pé de metal.',
  ] },
  { title: 'Bombas em alpaca artesanais, feitas à mão', lines: ['Redonda torcida; redonda lisa; redonda cinzelada; chata torcida; chata lisa; chata detalhe; chata cinzelada xadrez; chata cinzelada bordada; chata larga lisa; chata larga lisa detalhe; chata larga cinzelada bordada; chata larga cinzelada xadrez.'] },
  { title: 'Bomba inox torcida', lines: ['Com biqueira; sem biqueira.'] },
];

const whatsapp = (number: string, message: string) => {
  const digits = number.replace(/\D/g, '');
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

const defaultArea = DEFAULT_DOM_SETTINGS;

export default function DomHome({ featured, settings }: Props) {
  const desktop = settings.home_banner_desktop_url || '';
  const mobile = settings.home_banner_mobile_url || '';
  const primary = whatsapp(settings.whatsapp, 'Olá! Sou lojista e gostaria de informações sobre os produtos da Dom Cossé.');
  const secondary = whatsapp(settings.whatsapp_secondary || '+55 55 3317-3112', 'Olá! Sou lojista e gostaria de informações sobre os produtos da Dom Cossé.');
  const mainFeatures = featured.filter(item => item.is_active).sort((a, b) => a.position - b.position).slice(0, 10);
  const clickStyle = {
    '--desktop-left': `${settings.banner_desktop_cta_left ?? defaultArea.banner_desktop_cta_left}%`,
    '--desktop-top': `${settings.banner_desktop_cta_top ?? defaultArea.banner_desktop_cta_top}%`,
    '--desktop-width': `${settings.banner_desktop_cta_width ?? defaultArea.banner_desktop_cta_width}%`,
    '--desktop-height': `${settings.banner_desktop_cta_height ?? defaultArea.banner_desktop_cta_height}%`,
    '--mobile-left': `${settings.banner_mobile_cta_left ?? defaultArea.banner_mobile_cta_left}%`,
    '--mobile-top': `${settings.banner_mobile_cta_top ?? defaultArea.banner_mobile_cta_top}%`,
    '--mobile-width': `${settings.banner_mobile_cta_width ?? defaultArea.banner_mobile_cta_width}%`,
    '--mobile-height': `${settings.banner_mobile_cta_height ?? defaultArea.banner_mobile_cta_height}%`,
  } as CSSProperties;
  const logoData = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Dom Cossé Avios de Mate', url: 'https://domcosse.com.br', logo: 'https://domcosse.com.br/dom-cosse-logo.webp' };
  return <div className="dc-home">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoData) }}/>
    <header className="dc-home-header">
      <div className="dc-home-header-main">
        <Link href="/" className="dc-home-logo" aria-label="Dom Cossé, início"><img src="/dom-cosse-logo.webp" alt="Dom Cossé Avios de Mate" width="108" height="65"/></Link>
        <a className="dc-home-contact" href={primary} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">☏</span> Fale conosco</a>
      </div>
      <nav className="dc-home-nav" aria-label="Navegação principal">
        <a href="#destaques">Destaques</a><a href="#historia">História</a><a href="#linhas">Linhas</a><a href="#atendimento">Atendimento</a>
      </nav>
    </header>
    <main>
      <section className="dc-cover" aria-label="Dom Cossé Avios de Mate">
        <picture>
          {mobile && <source media="(max-aspect-ratio: 1/1)" srcSet={mobile}/>}
          <source media="(max-aspect-ratio: 1/1)" type="image/webp" srcSet="/banners/banner-mobile.webp"/>
          <source media="(max-aspect-ratio: 1/1)" srcSet="/banners/banner-mobile.jpg"/>
          {desktop && <source srcSet={desktop}/>}
          <source type="image/webp" srcSet="/banners/banner-desktop.webp"/>
          <img src="/banners/banner-desktop.jpg" width="1674" height="940" alt="Dom Cossé Avios de Mate — cuia de porongo com virola em alpaca e bomba artesanal ao pôr do sol" loading="eager" fetchPriority="high" decoding="async"/>
        </picture>
        <a className="dc-cover-hotspot" style={clickStyle} href={primary} target="_blank" rel="noopener noreferrer" aria-label="Fale conosco pelo WhatsApp"><span>Fale conosco pelo WhatsApp</span></a>
      </section>

      <div className="dc-home-content">
        {mainFeatures.length > 0 && <section className="dc-home-section dc-feature-section" id="destaques" aria-labelledby="featured-title">
          <p className="dc-eyebrow">PARA LOJISTAS</p><h1 id="featured-title">Destaques da loja</h1><p className="dc-section-intro">Peças artesanais para compor a sua seleção de avios de mate.</p>
          <div className="dc-feature-grid">{mainFeatures.map(item => <a className="dc-feature-card" key={item.id} href={whatsapp(settings.whatsapp, `Olá! Tenho interesse em ${item.name}. Sou lojista.`)} target="_blank" rel="noopener noreferrer">
            <span className="dc-feature-image"><img src={item.image_url || '/images/highlight-placeholder.svg'} alt={item.name} loading="lazy" decoding="async" width="800" height="800"/></span>
            <span className="dc-feature-meta"><span className="dc-feature-type">{item.type === 'bomba' ? 'Bomba' : 'Cuia'}</span>{item.badge && <span className="dc-feature-badge">{item.badge}</span>}</span>
            <strong>{item.name}</strong>{item.description && <span className="dc-feature-description">{item.description}</span>}
          </a>)}</div>
        </section>}

        <section className="dc-home-section dc-history" id="historia"><p className="dc-eyebrow">TRADIÇÃO NO PAMPA</p><h2>Nossa História</h2><p>{settings.history_text}</p></section>

        <section className="dc-home-section" id="linhas"><p className="dc-eyebrow">VARIEDADE PARA SUA LOJA</p><h2>Nossas Linhas</h2><div className="dc-lines">{rows.map(group => <details key={group.title}><summary>{group.title}</summary><ul>{group.lines.map(line => <li key={line}>{line}</li>)}</ul></details>)}</div></section>

        <section className="dc-home-section" id="diferenciais"><p className="dc-eyebrow">CUIDADO EM CADA DETALHE</p><h2>Nossos Diferenciais</h2><div className="dc-differentials"><article><span>01</span><h3>Cuias Bago de Toro</h3><p>Trabalhamos com cuias Bago de Toro da variedade Porongo Ferro, com virola e bocal em alpaca legítima.</p></article><article><span>02</span><h3>Bombas artesanais</h3><p>Bombas feitas à mão em alpaca legítima.</p></article><article><span>03</span><h3>Peças singulares</h3><p>O porongo natural apresenta variações de cor e marcas próprias de cada peça.</p></article></div></section>

        <section className="dc-home-section dc-education" id="avios"><p className="dc-eyebrow">CULTURA DO MATE</p><h2>Conheça os Avios de Mate</h2><div className="dc-education-grid">
          <article><h3>Avios de Mate</h3><p>Conjunto de utensílios e acessórios usados para preparar, transportar e servir chimarrão ou mate.</p></article>
          <article><h3>Cuia Bago de Toro</h3><p>Modelo tradicional de cuia para mate, feito de porongo natural, com formato arredondado e sem pé.</p></article>
          <article><h3>Porongo Ferro</h3><p>Porongo de casco firme. Curtido de forma orgânica e natural, pode ser usado após enxaguar com água corrente.</p></article>
          <article><h3>Metal Alpaca</h3><p>Liga metálica de cobre, níquel e zinco, muito usada em bombas, virolas e bocais. Não contém prata.</p></article>
        </div></section>

        <section className="dc-home-section dc-wholesale" id="atendimento"><p className="dc-eyebrow">ATENDIMENTO A LOJISTAS</p><h2>Vamos conversar?</h2><p>{settings.showroom_text}</p><div className="dc-wholesale-actions"><a href={primary} target="_blank" rel="noopener noreferrer">WhatsApp principal <strong>{settings.whatsapp}</strong></a><a href={secondary} target="_blank" rel="noopener noreferrer">WhatsApp <strong>{settings.whatsapp_secondary || '+55 55 3317-3112'}</strong></a></div>{settings.email && <a className="dc-home-email" href={`mailto:${settings.email}`}>{settings.email}</a>}</section>
      </div>
    </main>
    <footer className="dc-home-footer"><Link href="/" aria-label="Dom Cossé, início"><img src="/dom-cosse-logo.webp" alt="Dom Cossé Avios de Mate" width="96" height="58"/></Link><p>DOM COSSÉ AVIOS DE MATE</p><address><a href={contactMapsHref(settings)} target="_blank" rel="noopener noreferrer">{contactAddress(settings)}</a></address>{settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}<a href={primary} target="_blank" rel="noopener noreferrer">Fale conosco pelo WhatsApp</a><small>© 2026 Dom Cossé Avios de Mate.</small></footer>
    <a className="dc-home-float" href={primary} target="_blank" rel="noopener noreferrer" aria-label="Fale conosco pelo WhatsApp"><span aria-hidden="true">☏</span></a>
  </div>;
}
