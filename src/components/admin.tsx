'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleCheck, CircleX, Home, Image as ImageIcon, LogOut, Menu, Package, Pencil, Plus,
  Save, Settings, Shapes, Tag, Trash2, X,
} from 'lucide-react';
import { CUIA_SUBCATEGORIES, sortCategories, type Category, type CategoryIcon, type Product, type StoreSettings } from '@/lib/types';

type Page = 'painel' | 'produtos' | 'categorias' | 'configuracoes';
type ProductDraft = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'price'> & { price: string };
type CategoryDraft = { name: string; icon: CategoryIcon };

const blankProduct: ProductDraft = {
  name: '', description: '', price: '', category: '', cuia_subcategory: null,
  status: 'disponivel', image_url: null, gallery_urls: [],
};
const blankSettings: StoreSettings = {
  whatsapp: '', instagram: '', company_name: '', email: '', address: '', city: '', state: '', postal_code: '', banner_url: null,
};
const blankCategory: CategoryDraft = { name: '', icon: 'shapes' };
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

async function prepareImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use uma foto JPG, PNG ou WEBP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Cada foto deve ter até 5 MB.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar a foto.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (result) => result ? resolve(result) : reject(new Error('Não foi possível preparar a foto.')),
    'image/webp', .88,
  ));
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
}

function CategorySymbol({ icon, size = 22 }: { icon: CategoryIcon; size?: number }) {
  if (icon === 'cuia') return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M22 13h20l-3 8c10 4 14 12 12 24-2 10-9 14-19 14s-17-4-19-14c-2-12 2-20 12-24l-3-8Zm0 0h20M17 29h30M40 20l9-15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (icon === 'bomba') return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="m18 55 5 3 31-42-5-4L18 55Zm-1 1c-4 4-8 4-10 2s-1-6 3-9l6-4 5 4-4 7Zm30-44 5 4 4-5-5-4-4 5ZM50 6l9 7M25 46l5 3M32 36l5 3M39 27l5 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <Shapes size={size} aria-hidden="true"/>;
}

export default function AdminApp() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(blankSettings);
  const [page, setPage] = useState<Page>('painel');
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(blankProduct);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(blankCategory);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const mainPhotoInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const removedPhotos = useRef<string[]>([]);
  const uploadedPhotos = useRef<string[]>([]);
  const livePreview = useRef<string | null>(null);

  const message = (value: string, error = false) => { setNotice(value); setNoticeError(error); };

  const load = useCallback(async () => {
    const [productResponse, categoryResponse, settingsResponse] = await Promise.all([
      fetch('/api/products', { cache: 'no-store' }),
      fetch('/api/categories', { cache: 'no-store' }),
      fetch('/api/settings', { cache: 'no-store' }),
    ]);
    const responses = [productResponse, categoryResponse, settingsResponse];
    if (responses.some((response) => !response.ok)) {
      const failed = responses.find((response) => !response.ok);
      const result = await failed?.json().catch(() => null);
      throw new Error(result?.error || 'Não foi possível carregar os dados do painel.');
    }
    const [productRows, categoryRows, storeSettings] = await Promise.all(responses.map((response) => response.json()));
    setProducts(productRows as Product[]);
    setCategories(sortCategories(categoryRows as Category[]));
    setSettings(storeSettings as StoreSettings);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void load().catch((error: unknown) => { if (active) message(error instanceof Error ? error.message : 'Falha ao carregar o painel.', true); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [load]);

  async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || 'A operação não foi concluída.');
    return body as T;
  }

  async function uploadPhoto(file: File) {
    const prepared = await prepareImage(file);
    const data = new FormData();
    data.set('file', prepared);
    const result = await requestJson<{ url: string }>('/api/upload', { method: 'POST', body: data });
    return result.url;
  }

  async function deletePhoto(url: string) {
    await requestJson('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  }

  function clearPreviewUrl() {
    if (livePreview.current) URL.revokeObjectURL(livePreview.current);
    livePreview.current = null;
  }

  function resetProductDraft() {
    clearPreviewUrl();
    setDraft({ ...blankProduct, category: categories[0]?.slug || '' });
    setEditingProduct(null);
    removedPhotos.current = [];
    if (mainPhotoInput.current) mainPhotoInput.current.value = '';
    if (galleryInput.current) galleryInput.current.value = '';
  }

  async function abandonProductDraft() {
    setBusy(true);
    try {
      await Promise.all(uploadedPhotos.current.map((url) => deletePhoto(url).catch(() => undefined)));
      uploadedPhotos.current = [];
      resetProductDraft();
      message('Edição cancelada.');
    } finally { setBusy(false); }
  }

  async function uploadMainPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const previous = draft.image_url;
    setBusy(true);
    try {
      const preview = URL.createObjectURL(file);
      clearPreviewUrl();
      livePreview.current = preview;
      setDraft((current) => ({ ...current, image_url: preview }));
      message('Enviando foto principal…');
      const url = await uploadPhoto(file);
      uploadedPhotos.current.push(url);
      if (previous && previous !== url && !removedPhotos.current.includes(previous)) removedPhotos.current.push(previous);
      clearPreviewUrl();
      setDraft((current) => ({ ...current, image_url: url }));
      message('Foto principal carregada. Salve o produto para publicar.');
    } catch (error) {
      clearPreviewUrl();
      setDraft((current) => ({ ...current, image_url: previous }));
      message(error instanceof Error ? error.message : 'Não foi possível enviar a foto.', true);
    } finally { setBusy(false); }
  }

  async function uploadGalleryPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    const available = Math.max(0, 10 - draft.gallery_urls.length - (draft.image_url ? 1 : 0));
    if (files.length > available) { message(`Este produto aceita até ${available} foto(s) adicional(is).`, true); return; }
    setBusy(true);
    const uploaded: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        message(`Enviando foto ${index + 1} de ${files.length}…`);
        uploaded.push(await uploadPhoto(file));
      }
      uploadedPhotos.current.push(...uploaded);
      setDraft((current) => {
        if (!current.image_url && uploaded.length) return { ...current, image_url: uploaded[0], gallery_urls: [...current.gallery_urls, ...uploaded.slice(1)] };
        return { ...current, gallery_urls: [...current.gallery_urls, ...uploaded] };
      });
      message(`${uploaded.length} foto(s) carregada(s). Salve o produto para publicar.`);
    } catch (error) {
      await Promise.all(uploaded.map((url) => deletePhoto(url).catch(() => undefined)));
      message(error instanceof Error ? error.message : 'Não foi possível enviar as fotos.', true);
    } finally { setBusy(false); }
  }

  function chooseMainPhoto(url: string) {
    setDraft((current) => ({
      ...current,
      image_url: url,
      gallery_urls: current.gallery_urls.filter((photo) => photo !== url).concat(current.image_url && current.image_url !== url ? [current.image_url] : []),
    }));
  }

  function removePhoto(url: string) {
    if (!window.confirm('Remover esta foto do produto?')) return;
    setDraft((current) => {
      if (current.image_url === url) {
        const [nextMain, ...rest] = current.gallery_urls;
        if (!removedPhotos.current.includes(url)) removedPhotos.current.push(url);
        return { ...current, image_url: nextMain || null, gallery_urls: rest };
      }
      if (!removedPhotos.current.includes(url)) removedPhotos.current.push(url);
      return { ...current, gallery_urls: current.gallery_urls.filter((photo) => photo !== url) };
    });
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!draft.category) { message('Cadastre ou selecione uma categoria antes de salvar.', true); return; }
    setBusy(true);
    message('Salvando produto…');
    try {
      const payload = {
        ...draft,
        price: Number(draft.price.replace(',', '.')),
        cuia_subcategory: draft.category === 'cuias' ? draft.cuia_subcategory : null,
      };
      await requestJson(editingProduct ? `/api/products/${editingProduct}` : '/api/products', {
        method: editingProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const cleanupErrors = await Promise.all(removedPhotos.current.map((url) => deletePhoto(url).then(() => false).catch(() => true)));
      removedPhotos.current = [];
      uploadedPhotos.current = [];
      resetProductDraft();
      await load();
      message(cleanupErrors.some(Boolean) ? 'Produto salvo; uma foto removida não pôde ser limpa do Storage.' : editingProduct ? 'Produto atualizado.' : 'Produto cadastrado.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível salvar o produto.', true); }
    finally { setBusy(false); }
  }

  function editProduct(product: Product) {
    clearPreviewUrl();
    uploadedPhotos.current = [];
    removedPhotos.current = [];
    setDraft({ ...product, price: String(product.price).replace('.', ','), gallery_urls: product.gallery_urls || [] });
    setEditingProduct(product.id);
    setPage('produtos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleAvailability(product: Product) {
    setBusyProduct(product.id);
    try {
      await requestJson(`/api/products/${product.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, status: product.status === 'disponivel' ? 'esgotado' : 'disponivel', gallery_urls: product.gallery_urls || [] }),
      });
      await load();
      message('Disponibilidade atualizada.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível alterar a disponibilidade.', true); }
    finally { setBusyProduct(null); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir “${product.name}”? Esta ação não pode ser desfeita.`)) return;
    setBusyProduct(product.id);
    try {
      await requestJson(`/api/products/${product.id}`, { method: 'DELETE' });
      await load();
      message('Produto excluído.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível excluir o produto.', true); }
    finally { setBusyProduct(null); }
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    message('Salvando categoria…');
    try {
      const category = await requestJson<Category>(editingCategory ? `/api/categories/${editingCategory}` : '/api/categories', {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryDraft),
      });
      await load();
      setCategoryDraft(blankCategory);
      setEditingCategory(null);
      message(editingCategory ? `Categoria “${category.name}” atualizada.` : `Categoria “${category.name}” criada.`);
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível salvar a categoria.', true); }
    finally { setBusy(false); }
  }

  function editCategory(category: Category) {
    setEditingCategory(category.slug);
    setCategoryDraft({ name: category.name, icon: category.icon });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteCategory(category: Category) {
    const count = products.filter((product) => product.category === category.slug).length;
    if (count) { message(`“${category.name}” tem ${count} produto(s). Reatribua-os antes de excluir.`, true); return; }
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setBusyProduct(`category:${category.slug}`);
    try {
      await requestJson(`/api/categories/${category.slug}`, { method: 'DELETE' });
      await load();
      message(`Categoria “${category.name}” excluída.`);
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível excluir a categoria.', true); }
    finally { setBusyProduct(null); }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    message('Salvando configurações…');
    try {
      const result = await requestJson<StoreSettings>('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      });
      setSettings(result);
      message('Configurações salvas.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível salvar as configurações.', true); }
    finally { setBusy(false); }
  }

  async function changeBanner(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const previous = settings.banner_url;
    const preview = URL.createObjectURL(file);
    setBusy(true);
    setSettings((current) => ({ ...current, banner_url: preview }));
    message('Enviando banner…');
    try {
      const url = await uploadPhoto(file);
      setSettings((current) => ({ ...current, banner_url: url }));
      message('Banner carregado. Salve as alterações para publicar.');
    } catch (error) {
      URL.revokeObjectURL(preview);
      setSettings((current) => ({ ...current, banner_url: previous }));
      message(error instanceof Error ? error.message : 'Não foi possível enviar o banner.', true);
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const filteredProducts = useMemo(() => products.filter((product) =>
    product.name.toLocaleLowerCase('pt-BR').includes(productSearch.toLocaleLowerCase('pt-BR'))
    && (categoryFilter === 'todos' || product.category === categoryFilter)
    && (statusFilter === 'todos' || product.status === statusFilter)),
  [products, productSearch, categoryFilter, statusFilter]);
  const categoryCounts = useMemo(() => Object.fromEntries(categories.map((category) => [
    category.slug, products.filter((product) => product.category === category.slug).length,
  ])), [categories, products]);
  const menu: { id: Page; label: string; icon: typeof Home }[] = [
    { id: 'painel', label: 'Painel', icon: Home }, { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'categorias', label: 'Categorias', icon: Shapes }, { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link className="logo" href="/" aria-label="Dom Cossé"><Image src="/dom-cosse-logo.png" alt="Dom Cossé — Avios de Mate" width={386} height={374}/></Link>
        <button className="admin-menu-button" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        <span className="admin-account">Administrador</span>
        <nav className={`admin-nav ${menuOpen ? 'open' : ''}`} aria-label="Administração">
          {menu.map(({ id, label, icon: Icon }) => <button key={id} className={`admin-link ${page === id ? 'active' : ''}`} aria-label={label} aria-current={page === id ? 'page' : undefined} onClick={() => { setPage(id); setMenuOpen(false); }}><Icon size={20}/><span>{label}</span></button>)}
        </nav>
        <button className={`admin-link admin-logout ${menuOpen ? 'open' : ''}`} onClick={logout} aria-label="Sair"><LogOut size={20}/><span>Sair</span></button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div><h1 className="section-title">{page === 'painel' ? 'Painel' : page === 'produtos' ? (editingProduct ? 'Editar produto' : 'Produtos') : page === 'categorias' ? 'Categorias' : 'Configurações'}</h1><p className="muted" style={{ margin: '.35rem 0 0' }}>Dom Cossé – Avios de Mate</p></div>
          {page === 'produtos' && <button className="btn" onClick={() => { resetProductDraft(); setPage('produtos'); document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' }); }}><Plus size={18}/>Novo produto</button>}
        </div>
        {notice && <p className={`notice ${noticeError ? 'danger' : ''}`} role={noticeError ? 'alert' : 'status'}>{notice}</p>}
        {loading && <p className="muted" role="status">Carregando dados do Supabase…</p>}

        {!loading && page === 'painel' && <>
          <div className="admin-stat-grid">
            <div className="admin-stat"><span className="admin-stat-icon"><Package/></span><div><strong>{products.length}</strong><span>Total de produtos</span></div></div>
            <div className="admin-stat"><span className="admin-stat-icon available"><CircleCheck/></span><div><strong>{products.filter((product) => product.status === 'disponivel').length}</strong><span>Disponíveis</span></div></div>
            <div className="admin-stat"><span className="admin-stat-icon unavailable"><CircleX/></span><div><strong>{products.filter((product) => product.status === 'esgotado').length}</strong><span>Esgotados</span></div></div>
            <div className="admin-stat"><span className="admin-stat-icon"><Tag/></span><div><strong>{categories.length}</strong><span>Categorias</span></div></div>
          </div>
          <div className="admin-dashboard-grid">
            <section className="admin-card"><div className="dashboard-chart"><div className="section-heading"><h2 className="section-title">Visualizações do catálogo</h2><span className="muted">Últimos 7 dias</span></div><div className="dashboard-chart-empty" role="status">A medição de visualizações ainda não está habilitada.</div></div><h2 className="section-title">Produtos recentes</h2>{products.length ? <div className="row-cards admin-recent">{products.slice(0, 4).map((product) => <article className="product-row" key={product.id}>{product.image_url ? <Image src={product.image_url} alt="" width={56} height={64} unoptimized/> : <div className="row-thumb"/>}<div className="product-row-content"><strong>{product.name}</strong><div className="muted">{categories.find((category) => category.slug === product.category)?.name || product.category} · {brl(Number(product.price))}</div></div><button className="filter-chip" onClick={() => editProduct(product)} aria-label={`Editar ${product.name}`}><Pencil size={18}/></button></article>)}</div> : <p className="muted">Nenhum produto cadastrado.</p>}<button className="text-link" onClick={() => setPage('produtos')}>Ver todos os produtos →</button></section>
            <section className="admin-card"><h2 className="section-title">Ações rápidas</h2><div className="admin-quick-actions"><button className="filter-chip" onClick={() => { resetProductDraft(); setPage('produtos'); }}><Plus size={17}/> Novo produto</button><button className="filter-chip" onClick={() => setPage('produtos')}><Package size={17}/> Gerenciar produtos</button><button className="filter-chip" onClick={() => setPage('categorias')}><Shapes size={17}/> Gerenciar categorias</button><button className="filter-chip" onClick={() => setPage('configuracoes')}><Settings size={17}/> Configurações da loja</button></div></section>
          </div>
        </>}

        {!loading && page === 'categorias' && <>
          <form className="admin-card category-editor" onSubmit={saveCategory}>
            <h2 className="section-title">{editingCategory ? 'Editar categoria' : 'Nova categoria'}</h2>
            <div className="form-grid">
              <label className="field"><span>Nome</span><input required maxLength={80} value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} placeholder="Ex.: Cuias"/></label>
              <label className="field"><span>Ícone</span><select value={categoryDraft.icon} onChange={(event) => setCategoryDraft({ ...categoryDraft, icon: event.target.value as CategoryIcon })}><option value="cuia">Cuia</option><option value="bomba">Bomba</option><option value="shapes">Grade</option></select></label>
            </div>
            <div className="preview-actions"><button className="btn" disabled={busy}><Save size={18}/>{busy ? 'Salvando…' : editingCategory ? 'Salvar categoria' : 'Adicionar categoria'}</button>{editingCategory && <button className="filter-chip" type="button" onClick={() => { setEditingCategory(null); setCategoryDraft(blankCategory); }}><X size={16}/>Cancelar</button>}</div>
          </form>
          <section className="admin-card" style={{ marginTop: '1rem' }}><h2 className="section-title">Categorias cadastradas</h2>
            {categories.length === 0 ? <p className="muted">Nenhuma categoria retornada pelo banco.</p> : <div className="row-cards category-list">{categories.map((category) => <article className="category-row" key={category.slug}><span className="category-icon"><CategorySymbol icon={category.icon}/></span><div className="product-row-content"><strong>{category.name}</strong><span className="muted">{categoryCounts[category.slug] || 0} produto(s) · código {category.slug}</span></div><div className="preview-actions"><button className="filter-chip" onClick={() => editCategory(category)} aria-label={`Editar ${category.name}`}><Pencil size={18}/></button><button className="filter-chip danger-action" onClick={() => void deleteCategory(category)} disabled={busyProduct === `category:${category.slug}`} aria-label={`Excluir ${category.name}`}><Trash2 size={18}/></button></div></article>)}</div>}
          </section>
        </>}

        {!loading && page === 'produtos' && <>
          <div className="admin-form-layout">
            <form id="product-form" className="admin-card" onSubmit={saveProduct}>
              <h2 className="section-title">{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>
              <div className="photo-manager">
                <div className="photo-main-preview">
                  {draft.image_url ? <Image src={draft.image_url} alt="Foto principal do produto" fill sizes="(max-width: 767px) 100vw, 320px" unoptimized/> : <div className="photo-placeholder"><ImageIcon size={40}/><span>Foto principal</span></div>}
                </div>
                <div className="photo-controls">
                  <input ref={mainPhotoInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={uploadMainPhoto}/>
                  <input ref={galleryInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadGalleryPhotos}/>
                  <button type="button" className="filter-chip" onClick={() => mainPhotoInput.current?.click()} disabled={busy}><ImageIcon size={17}/>Tirar foto / escolher principal</button>
                  <button type="button" className="filter-chip" onClick={() => galleryInput.current?.click()} disabled={busy}><Plus size={17}/>Escolher da galeria</button>
                  <small className="muted">No celular, “Tirar foto” solicita a câmera quando disponível. Se não houver câmera, use “Escolher da galeria”. Até 5 MB por foto.</small>
                </div>
                {(draft.image_url || draft.gallery_urls.length > 0) && <div className="photo-gallery-editor" aria-label="Galeria de fotos do produto">
                  {[...(draft.image_url ? [draft.image_url] : []), ...draft.gallery_urls].map((url, index) => <article className={`photo-thumb ${index === 0 ? 'is-main' : ''}`} key={`${url}-${index}`}><button className="photo-thumb-select" type="button" onClick={() => chooseMainPhoto(url)} aria-label={index === 0 ? 'Imagem principal selecionada' : 'Definir como imagem principal'} aria-pressed={index === 0}><Image src={url} alt={index === 0 ? 'Imagem principal' : `Foto ${index + 1}`} fill sizes="90px" unoptimized/><span>{index === 0 ? 'Principal' : 'Definir principal'}</span></button><button className="photo-thumb-remove" type="button" onClick={() => removePhoto(url)} aria-label={`Remover foto ${index + 1}`}><X size={16}/></button></article>)}
                </div>}
              </div>
              <div className="form-grid">
                <label className="field wide"><span>Nome do produto</span><input required maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label>
                <label className="field"><span>Categoria</span><select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value, cuia_subcategory: null })}><option value="" disabled>Selecione</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
                {draft.category === 'cuias' && <label className="field"><span>Tipo de cuia</span><select value={draft.cuia_subcategory || ''} onChange={(event) => setDraft({ ...draft, cuia_subcategory: event.target.value as Product['cuia_subcategory'] })}><option value="">Selecione</option>{CUIA_SUBCATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
                <label className="field"><span>Preço (R$)</span><input required type="text" inputMode="decimal" placeholder="0,00" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value.replace(/[^\d,.]/g, '') })}/></label>
                <label className="field wide"><span>Descrição</span><textarea maxLength={2000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label>
                <div className="field wide"><span>Status</span><div className="segmented"><button type="button" className={draft.status === 'disponivel' ? 'active' : ''} aria-pressed={draft.status === 'disponivel'} onClick={() => setDraft({ ...draft, status: 'disponivel' })}>Disponível</button><button type="button" className={draft.status === 'esgotado' ? 'sold-active' : ''} aria-pressed={draft.status === 'esgotado'} onClick={() => setDraft({ ...draft, status: 'esgotado' })}>Esgotado</button></div></div>
              </div>
              <div className="preview-actions product-submit"><button className="btn" type="submit" disabled={busy || categories.length === 0}><Save size={18}/>{busy ? 'Salvando…' : editingProduct ? 'Salvar alterações' : 'Adicionar produto'}</button>{editingProduct && <button className="filter-chip" type="button" disabled={busy} onClick={() => void abandonProductDraft()}><X size={16}/>Cancelar edição</button>}</div>
            </form>
            <aside className="admin-card preview-wrap"><h2 className="section-title">Prévia</h2><div className={`preview-card ${draft.status === 'esgotado' ? 'sold' : ''}`}><div className="preview-photo">{draft.image_url ? <Image src={draft.image_url} alt="Prévia do produto" fill sizes="240px" unoptimized/> : <ImageIcon size={38} color="#aaa"/>}{draft.status === 'esgotado' && <span className="sold-label">ESGOTADO</span>}</div><div className="product-info"><p className="product-name">{draft.name || 'Nome do produto'}</p><p className="price">{draft.price ? brl(Number(draft.price.replace(',', '.'))) : 'Preço cadastrado'}</p></div></div></aside>
          </div>
          <section className="admin-card" style={{ marginTop: '1rem' }}><h2 className="section-title">Produtos cadastrados</h2><div className="admin-product-filters"><label className="field">Buscar produto<input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)}/></label><label className="field">Categoria<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="todos">Todas</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label><label className="field">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="todos">Todos</option><option value="disponivel">Disponíveis</option><option value="esgotado">Esgotados</option></select></label></div>
            {filteredProducts.length === 0 ? <p className="muted">{products.length ? 'Nenhum produto corresponde aos filtros.' : 'Nenhum produto cadastrado.'}</p> : <div className="row-cards">{filteredProducts.map((product) => <article className="product-row" key={product.id}>{product.image_url ? <Image src={product.image_url} alt="" width={56} height={64} unoptimized/> : <div className="row-thumb"/>}<div className="product-row-content"><strong>{product.name}</strong><span className="muted">{categories.find((category) => category.slug === product.category)?.name || product.category} · {brl(Number(product.price))} · {product.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</span></div><div className="preview-actions"><button className="filter-chip" disabled={Boolean(busyProduct)} onClick={() => void toggleAvailability(product)}>{busyProduct === product.id ? 'Atualizando…' : product.status === 'disponivel' ? 'Esgotar' : 'Disponibilizar'}</button><button className="filter-chip" disabled={Boolean(busyProduct)} onClick={() => editProduct(product)} aria-label={`Editar ${product.name}`}><Pencil size={18}/></button><button className="filter-chip danger-action" disabled={Boolean(busyProduct)} onClick={() => void deleteProduct(product)} aria-label={`Excluir ${product.name}`}><Trash2 size={18}/></button></div></article>)}</div>}
          </section>
        </>}

        {!loading && page === 'configuracoes' && <>
          <form className="admin-card" onSubmit={saveSettings}><h2 className="section-title">Configurações da loja</h2><div className="form-grid">
            <label className="field wide"><span>Empresa</span><input maxLength={160} value={settings.company_name} onChange={(event) => setSettings({ ...settings, company_name: event.target.value })}/></label>
            <label className="field"><span>WhatsApp do vendedor</span><input type="tel" inputMode="tel" value={settings.whatsapp} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })}/></label>
            <label className="field"><span>Instagram</span><input value={settings.instagram} onChange={(event) => setSettings({ ...settings, instagram: event.target.value })}/></label>
            <label className="field"><span>E-mail</span><input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })}/></label>
            <label className="field wide"><span>Endereço</span><input value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })}/></label>
            <label className="field"><span>Cidade</span><input value={settings.city} onChange={(event) => setSettings({ ...settings, city: event.target.value })}/></label>
            <label className="field"><span>Estado</span><input maxLength={2} value={settings.state} onChange={(event) => setSettings({ ...settings, state: event.target.value.toUpperCase() })}/></label>
            <label className="field"><span>CEP</span><input value={settings.postal_code} onChange={(event) => setSettings({ ...settings, postal_code: event.target.value })}/></label>
          </div><button className="btn" style={{ marginTop: '1rem' }} disabled={busy}><Save size={18}/>{busy ? 'Salvando…' : 'Salvar configurações'}</button></form>
          <form className="admin-card banner-settings" onSubmit={saveSettings}><h2 className="section-title">Banner da página inicial</h2><p className="muted">Envie, substitua ou remova a fotografia da capa.</p><input ref={bannerInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={changeBanner}/>{settings.banner_url ? <div className="banner-preview" role="img" aria-label="Prévia do banner" style={{ backgroundImage: `url("${settings.banner_url}")` }}/> : <div className="banner-preview" role="img" aria-label="Banner padrão Dom Cossé" style={{ backgroundImage: 'url("/dom-cosse-banner.png")' }}/>}<div className="preview-actions"><button type="button" className="filter-chip" onClick={() => bannerInput.current?.click()} disabled={busy}><ImageIcon size={17}/>{settings.banner_url ? 'Trocar imagem' : 'Enviar imagem'}</button>{settings.banner_url && <button type="button" className="filter-chip danger-action" onClick={() => setSettings({ ...settings, banner_url: null })} disabled={busy}><Trash2 size={17}/>Remover</button>}<button className="btn" disabled={busy}><Save size={18}/>{busy ? 'Salvando…' : 'Salvar banner'}</button></div></form>
        </>}
      </main>
    </div>
  );
}
