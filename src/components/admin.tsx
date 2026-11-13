'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleX, Copy, Home, Image as ImageIcon, LogOut, Menu, Package, Pencil, Plus,
  Save, Settings, Shapes, Tag, Trash2, X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { CUIA_SUBCATEGORIES, DEFAULT_STORE_SETTINGS, LOT_QUANTITIES, sortCategories, type Category, type CategoryIcon, type Product, type StoreSettings } from '@/lib/types';

type Page = 'painel' | 'produtos' | 'categorias' | 'configuracoes' | 'banner';
type ProductDraft = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'price'> & { price: string };
type CategoryDraft = { name: string; icon: CategoryIcon; image_url: string | null };
type BannerDraft = Pick<StoreSettings, 'banner_url' | 'banner_mobile_url' | 'banner_desktop_x' | 'banner_desktop_y' | 'banner_mobile_x' | 'banner_mobile_y' | 'banner_cta_x' | 'banner_cta_y' | 'banner_mobile_cta_x' | 'banner_mobile_cta_y'>;
type BannerKind = 'desktop' | 'mobile';
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

function bannerFromSettings(settings: StoreSettings): BannerDraft {
  const current = { ...DEFAULT_STORE_SETTINGS, ...settings };
  return {
    banner_url: current.banner_url, banner_mobile_url: current.banner_mobile_url,
    banner_desktop_x: current.banner_desktop_x, banner_desktop_y: current.banner_desktop_y,
    banner_mobile_x: current.banner_mobile_x, banner_mobile_y: current.banner_mobile_y,
    banner_cta_x: current.banner_cta_x, banner_cta_y: current.banner_cta_y,
    banner_mobile_cta_x: current.banner_mobile_cta_x, banner_mobile_cta_y: current.banner_mobile_cta_y,
  };
}

function editableSettings(settings: StoreSettings): StoreSettings {
  const current = { ...DEFAULT_STORE_SETTINGS, ...settings };
  return {
    whatsapp: current.whatsapp, instagram: current.instagram, company_name: current.company_name,
    email: current.email, address: current.address, city: current.city, state: current.state,
    postal_code: current.postal_code, ...bannerFromSettings(current),
  };
}

const blankProduct: ProductDraft = {
  name: '', description: '', price: '', category: '', cuia_subcategory: null, lot_quantity: null,
  is_featured: false, featured_order: 0, is_published: false, status: 'disponivel', image_url: null, gallery_urls: [],
};
const blankSettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS, whatsapp: '', instagram: '', company_name: '', email: '', address: '', city: '', state: '', postal_code: '' };
const blankCategory: CategoryDraft = { name: '', icon: 'shapes', image_url: null };
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const productPrice = (price: number | null) => price === null ? 'Consulte pelo WhatsApp' : brl(Number(price));

async function prepareImage(file: File, maxDimension = 1600, quality = .88): Promise<File> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Cada foto deve ter até 5 MB.');
  const extension = file.name.toLowerCase();
  const isHeic = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(file.type.toLowerCase()) || /\.(heic|heif)$/.test(extension);
  let source: Blob = file;
  if (isHeic) {
    try {
      const convert = (await import('heic2any')).default;
      const converted = await convert({ blob: file, toType: 'image/jpeg', quality: .92 });
      source = Array.isArray(converted) ? converted[0] : converted;
    } catch {
      throw new Error('Não foi possível converter esta foto HEIC. Tente salvar uma cópia como JPG e enviá-la novamente.');
    }
  } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
    throw new Error('Escolha uma foto JPG, PNG, WEBP ou HEIC/HEIF.');
  }

  let bitmap: ImageBitmap | null = null;
  let fallbackImage: HTMLImageElement | null = null;
  let sourceUrl: string | null = null;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    sourceUrl = URL.createObjectURL(source);
    fallbackImage = new window.Image();
    fallbackImage.src = sourceUrl;
    try {
      await fallbackImage.decode();
    } catch {
      URL.revokeObjectURL(sourceUrl);
      sourceUrl = null;
      throw new Error('O celular não conseguiu abrir esta foto. Escolha outro arquivo JPG, PNG, WEBP ou HEIC.');
    }
  }
  const sourceWidth = bitmap?.width || fallbackImage?.naturalWidth || 0;
  const sourceHeight = bitmap?.height || fallbackImage?.naturalHeight || 0;
  if (!sourceWidth || !sourceHeight) { bitmap?.close(); if (sourceUrl) URL.revokeObjectURL(sourceUrl); throw new Error('A foto selecionada está vazia ou inválida.'); }
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap?.close(); if (sourceUrl) URL.revokeObjectURL(sourceUrl); throw new Error('Não foi possível preparar a foto.'); }
  ctx.drawImage(bitmap || fallbackImage!, 0, 0, canvas.width, canvas.height);
  bitmap?.close();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  const toBlob = (type: string) => new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (result) => result ? resolve(result) : reject(new Error('Não foi possível preparar a foto.')),
    type, quality,
  ));
  let blob = await toBlob('image/webp');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) blob = await toBlob('image/jpeg');
  const extensionByMime: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const outputType = blob.type.toLowerCase();
  const outputExtension = extensionByMime[outputType];
  if (!outputExtension) throw new Error('O celular gerou um formato de foto incompatível. Tente outra imagem.');
  if (blob.size > 5 * 1024 * 1024) throw new Error('A foto otimizada ainda passa de 5 MB. Escolha uma imagem menor.');
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${baseName}.${outputExtension}`, { type: outputType, lastModified: Date.now() });
}

function CategorySymbol({ icon, size = 22 }: { icon: CategoryIcon; size?: number }) {
  if (icon === 'cuia') return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="M22 13h20l-3 8c10 4 14 12 12 24-2 10-9 14-19 14s-17-4-19-14c-2-12 2-20 12-24l-3-8Zm0 0h20M17 29h30M40 20l9-15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (icon === 'bomba') return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><path d="m18 55 5 3 31-42-5-4L18 55Zm-1 1c-4 4-8 4-10 2s-1-6 3-9l6-4 5 4-4 7Zm30-44 5 4 4-5-5-4-4 5ZM50 6l9 7M25 46l5 3M32 36l5 3M39 27l5 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <Shapes size={size} aria-hidden="true"/>;
}

function BannerSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="banner-slider"><span>{label}: {value}%</span><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}

export default function AdminApp() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(blankSettings);
  const [bannerDraft, setBannerDraft] = useState<BannerDraft>(bannerFromSettings(blankSettings));
  const [bannerFiles, setBannerFiles] = useState<Record<BannerKind, File | null>>({ desktop: null, mobile: null });
  const [bannerPreviews, setBannerPreviews] = useState<Record<BannerKind, string | null>>({ desktop: null, mobile: null });
  const [page, setPage] = useState<Page>('painel');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(blankProduct);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(blankCategory);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [publicationFilter, setPublicationFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [whatsappClicks, setWhatsappClicks] = useState<number | null>(null);
  const mainPhotoInput = useRef<HTMLInputElement>(null);
  const cameraPhotoInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const bannerDesktopInput = useRef<HTMLInputElement>(null);
  const bannerMobileInput = useRef<HTMLInputElement>(null);
  const bannerPreviewUrls = useRef<Record<BannerKind, string | null>>({ desktop: null, mobile: null });
  const removedPhotos = useRef<string[]>([]);
  const uploadedPhotos = useRef<string[]>([]);
  const livePreview = useRef<string | null>(null);

  const message = (value: string, error = false) => { setNotice(value); setNoticeError(error); };

  useEffect(() => () => {
    for (const url of Object.values(bannerPreviewUrls.current)) if (url) URL.revokeObjectURL(url);
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
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
      const editable = editableSettings(storeSettings as StoreSettings);
      setSettings(editable);
      setBannerDraft(bannerFromSettings(editable));
      void fetch('/api/admin/whatsapp-clicks', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then((result) => setWhatsappClicks(typeof result?.count === 'number' ? result.count : null)).catch(() => setWhatsappClicks(null));
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Não foi possível carregar os dados do painel.';
      setLoadError(text);
      throw error;
    }
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

  async function uploadPhoto(file: File, maxDimension = 1600, quality = .88) {
    const prepared = await prepareImage(file, maxDimension, quality);
    const data = new FormData();
    data.set('file', prepared);
    const result = await requestJson<{ url: string }>('/api/upload', { method: 'POST', body: data });
    return result.url;
  }

  async function uploadCategoryPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    message('Enviando foto da categoria…');
    try {
      const image_url = await uploadPhoto(file);
      setCategoryDraft((current) => ({ ...current, image_url }));
      message('Foto da categoria carregada. Salve a categoria para publicar.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível enviar a foto.', true); }
    finally { setBusy(false); }
  }

  async function deletePhotos(urls: string[]) {
    const uniqueUrls = [...new Set(urls)];
    if (!uniqueUrls.length) return;
    await requestJson('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls: uniqueUrls }) });
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
    if (cameraPhotoInput.current) cameraPhotoInput.current.value = '';
    if (galleryInput.current) galleryInput.current.value = '';
  }

  async function abandonProductDraft() {
    setBusy(true);
    try {
      await deletePhotos(uploadedPhotos.current).catch(() => undefined);
      uploadedPhotos.current = [];
      resetProductDraft();
      setShowProductForm(false);
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
    const maxPhotos = draft.category === 'lotes-de-cuias' ? 48 : 10;
    const available = Math.max(0, maxPhotos - draft.gallery_urls.length - (draft.image_url ? 1 : 0));
    if (files.length > available) { message(`Ainda cabem ${available} foto(s) neste produto (máximo ${maxPhotos}).`, true); return; }
    setBusy(true);
    const uploaded: string[] = [];
    try {
      for (let index = 0; index < files.length; index += 4) {
        const batch = files.slice(index, index + 4);
        message(`Enviando fotos ${index + 1}–${index + batch.length} de ${files.length}…`);
        const results = await Promise.allSettled(batch.map((file) => uploadPhoto(file)));
        uploaded.push(...results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []));
        if (results.some((result) => result.status === 'rejected')) {
          const failed = results.find((result) => result.status === 'rejected');
          throw failed?.status === 'rejected' ? failed.reason : new Error('Não foi possível enviar todas as fotos.');
        }
      }
      uploadedPhotos.current.push(...uploaded);
      setDraft((current) => {
        if (!current.image_url && uploaded.length) return { ...current, image_url: uploaded[0], gallery_urls: [...current.gallery_urls, ...uploaded.slice(1)] };
        return { ...current, gallery_urls: [...current.gallery_urls, ...uploaded] };
      });
      message(`${uploaded.length} foto(s) carregada(s). Salve o produto para publicar.`);
    } catch (error) {
      await deletePhotos(uploaded).catch(() => undefined);
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

  function movePhoto(url: string, offset: -1 | 1) {
    setDraft((current) => {
      const photos = [...(current.image_url ? [current.image_url] : []), ...current.gallery_urls];
      const index = photos.indexOf(url);
      const nextIndex = index + offset;
      if (index < 0 || nextIndex < 0 || nextIndex >= photos.length) return current;
      [photos[index], photos[nextIndex]] = [photos[nextIndex], photos[index]];
      return { ...current, image_url: photos[0] || null, gallery_urls: photos.slice(1) };
    });
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

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.category) { message('Cadastre ou selecione uma categoria antes de salvar.', true); return; }
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const publish = submitter instanceof HTMLButtonElement && submitter.value === 'publish';
    const wasEditing = editingProduct;
    setBusy(true);
    message(publish ? 'Salvando e publicando produto…' : 'Salvando produto como rascunho…');
    try {
      const payload = {
        ...draft,
        is_published: publish,
        featured_order: draft.is_featured ? Number(draft.featured_order || 0) : 0,
        price: draft.price.trim() ? Number(draft.price.replace(',', '.')) : null,
        cuia_subcategory: draft.category === 'cuias' ? draft.cuia_subcategory : null,
        lot_quantity: draft.category === 'lotes-de-cuias' ? draft.lot_quantity : null,
      };
      const saved = await requestJson<Product>(wasEditing ? `/api/products/${wasEditing}` : '/api/products', {
        method: wasEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let cleanupFailed = false;
      try { await deletePhotos(removedPhotos.current); } catch { cleanupFailed = true; }
      removedPhotos.current = [];
      uploadedPhotos.current = [];
      setProducts((current) => wasEditing ? current.map((product) => product.id === saved.id ? saved : product) : [saved, ...current]);
      resetProductDraft();
      setShowProductForm(false);
      const result = publish
        ? (wasEditing ? 'Produto atualizado e publicado no site.' : 'Produto salvo e publicado no site.')
        : (wasEditing ? 'Alterações salvas como rascunho. O produto saiu do catálogo público.' : 'Produto salvo como rascunho; ele ainda não aparece no site público.');
      message(cleanupFailed ? `${result} Algumas fotos removidas não puderam ser limpas do Storage.` : result);
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível salvar o produto.', true); }
    finally { setBusy(false); }
  }

  function editProduct(product: Product) {
    clearPreviewUrl();
    uploadedPhotos.current = [];
    removedPhotos.current = [];
    setDraft({ ...product, is_published: product.is_published ?? true, price: product.price === null ? '' : String(product.price).replace('.', ','), gallery_urls: product.gallery_urls || [], lot_quantity: product.lot_quantity || null, is_featured: product.is_featured || false, featured_order: product.featured_order || 0 });
    setEditingProduct(product.id);
    setShowProductForm(true);
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

  async function togglePublication(product: Product) {
    setBusyProduct(product.id);
    try {
      const updated = await requestJson<Product>(`/api/products/${product.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, is_published: !product.is_published, gallery_urls: product.gallery_urls || [] }),
      });
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
      message(updated.is_published ? 'Produto publicado no catálogo.' : 'Produto salvo como rascunho e removido do catálogo público.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível alterar a publicação.', true); }
    finally { setBusyProduct(null); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir “${product.name}”? Esta ação não pode ser desfeita.`)) return;
    setBusyProduct(product.id);
    try {
      await requestJson(`/api/products/${product.id}`, { method: 'DELETE' });
      await load();
      const otherProducts = products.filter((item) => item.id !== product.id);
      const referencedUrls = new Set(otherProducts.flatMap((item) => [...(item.image_url ? [item.image_url] : []), ...(item.gallery_urls || [])]));
      const removableUrls = [...(product.image_url ? [product.image_url] : []), ...(product.gallery_urls || [])].filter((url) => !referencedUrls.has(url));
      try { await deletePhotos(removableUrls); message('Produto excluído.'); }
      catch { message('Produto excluído; algumas fotos não puderam ser removidas do Storage.', true); }
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível excluir o produto.', true); }
    finally { setBusyProduct(null); }
  }

  async function duplicateProduct(product: Product) {
    if (!window.confirm(`Criar uma cópia de “${product.name}”?`)) return;
    setBusyProduct(product.id);
    try {
      const copy = await requestJson<Product>('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${product.name} (cópia)`, description: product.description, price: product.price, category: product.category, cuia_subcategory: product.cuia_subcategory, lot_quantity: product.lot_quantity, is_featured: product.is_featured, featured_order: product.featured_order || 0, is_published: false, status: product.status, image_url: product.image_url, gallery_urls: product.gallery_urls || [] }),
      });
      setProducts((current) => [copy, ...current]);
      message(`Cópia de “${product.name}” criada como rascunho.`);
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível duplicar o produto.', true); }
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
      setShowCategoryForm(false);
      message(editingCategory ? `Categoria “${category.name}” atualizada.` : `Categoria “${category.name}” criada.`);
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível salvar a categoria.', true); }
    finally { setBusy(false); }
  }

  function editCategory(category: Category) {
    setEditingCategory(category.slug);
    setCategoryDraft({ name: category.name, icon: category.icon, image_url: category.image_url || null });
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
      setSettings(editableSettings(result));
      message('Configurações salvas.');
    } catch (error) { message(error instanceof Error ? error.message : 'Não foi possível salvar as configurações.', true); }
    finally { setBusy(false); }
  }

  function clearBannerPreview(kind: BannerKind) {
    if (bannerPreviewUrls.current[kind]) URL.revokeObjectURL(bannerPreviewUrls.current[kind]);
    bannerPreviewUrls.current[kind] = null;
    setBannerPreviews((current) => ({ ...current, [kind]: null }));
    setBannerFiles((current) => ({ ...current, [kind]: null }));
  }

  function resetBannerDraft() {
    clearBannerPreview('desktop');
    clearBannerPreview('mobile');
    setBannerDraft(bannerFromSettings(settings));
    message('Edição cancelada. O banner publicado foi mantido.');
  }

  function changeBanner(event: ChangeEvent<HTMLInputElement>, kind: BannerKind) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      message('Use uma imagem JPG, PNG ou WEBP de até 5 MB.', true);
      return;
    }
    clearBannerPreview(kind);
    const preview = URL.createObjectURL(file);
    bannerPreviewUrls.current[kind] = preview;
    setBannerPreviews((current) => ({ ...current, [kind]: preview }));
    setBannerFiles((current) => ({ ...current, [kind]: file }));
    message('Prévia pronta. Clique em Salvar e publicar para trocar o banner.');
  }

  function removeBannerImage(kind: BannerKind) {
    clearBannerPreview(kind);
    setBannerDraft((current) => ({ ...current, [kind === 'desktop' ? 'banner_url' : 'banner_mobile_url']: null }));
  }

  async function saveBanner(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    message('Publicando banner…');
    const newlyUploaded: string[] = [];
    try {
      let desktopUrl = bannerDraft.banner_url;
      let mobileUrl = bannerDraft.banner_mobile_url;
      if (bannerFiles.desktop) {
        desktopUrl = await uploadPhoto(bannerFiles.desktop, 3000, .94);
        newlyUploaded.push(desktopUrl);
      }
      if (bannerFiles.mobile) {
        mobileUrl = await uploadPhoto(bannerFiles.mobile, 3000, .94);
        newlyUploaded.push(mobileUrl);
      }
      const result = await requestJson<StoreSettings>('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...bannerDraft, banner_url: desktopUrl, banner_mobile_url: mobileUrl }),
      });
      const savedBanner = bannerFromSettings(result);
      setSettings((current) => ({ ...current, ...savedBanner }));
      setBannerDraft(savedBanner);
      clearBannerPreview('desktop');
      clearBannerPreview('mobile');
      message('Banner salvo e publicado no site.');
    } catch (error) {
      await deletePhotos(newlyUploaded).catch(() => undefined);
      message(error instanceof Error ? error.message : 'Não foi possível publicar o banner.', true);
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
    && (statusFilter === 'todos' || product.status === statusFilter)
    && (publicationFilter === 'todos' || (publicationFilter === 'publicados' ? product.is_published : !product.is_published))),
  [products, productSearch, categoryFilter, statusFilter, publicationFilter]);
  const categoryCounts = useMemo(() => Object.fromEntries(categories.map((category) => [
    category.slug, products.filter((product) => product.category === category.slug).length,
  ])), [categories, products]);
  const menu: { id: Page; label: string; icon: typeof Home }[] = [
    { id: 'painel', label: 'Painel', icon: Home }, { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'categorias', label: 'Categorias', icon: Shapes },
    { id: 'banner', label: 'Personalizar Banner Principal', icon: ImageIcon },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];
  const desktopBannerPreview = bannerPreviews.desktop || bannerDraft.banner_url || '/dom-cosse-banner.png';
  const mobileBannerPreview = bannerPreviews.mobile || bannerDraft.banner_mobile_url || desktopBannerPreview;
  const hasMobileBannerPreview = Boolean(bannerPreviews.mobile || bannerDraft.banner_mobile_url);

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link className="logo" href="/" aria-label="Dom Cossé"><Image src="/dom-cosse-logo-badge.png" alt="Dom Cossé — Avios de Mate" width={1024} height={1024}/></Link>
        <button className="admin-menu-button" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        <span className="admin-account">Administrador</span>
        <nav className={`admin-nav ${menuOpen ? 'open' : ''}`} aria-label="Administração">
          {menu.map(({ id, label, icon: Icon }) => <button key={id} className={`admin-link ${page === id ? 'active' : ''}`} aria-label={label} aria-current={page === id ? 'page' : undefined} onClick={() => { setPage(id); setMenuOpen(false); }}><Icon size={20}/><span>{label}</span></button>)}
          <button className="admin-link admin-logout-mobile" onClick={logout} aria-label="Sair"><LogOut size={20}/><span>Sair</span></button>
        </nav>
        <button className={`admin-link admin-logout ${menuOpen ? 'open' : ''}`} onClick={logout} aria-label="Sair"><LogOut size={20}/><span>Sair</span></button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div><h1 className="section-title">{page === 'painel' ? 'Painel' : page === 'produtos' ? (editingProduct ? 'Editar produto' : 'Produtos') : page === 'categorias' ? 'Categorias' : page === 'banner' ? 'Personalizar Banner Principal' : 'Configurações da Loja'}</h1><p className="muted" style={{ margin: '.35rem 0 0' }}>{page === 'painel' ? 'Dom Cossé — Avios de Mate' : page === 'banner' ? 'Ajuste as imagens e o enquadramento do banner da tela inicial.' : page === 'configuracoes' ? 'Gerencie as informações da sua loja.' : 'Dom Cossé — Avios de Mate'}</p></div>
          <div className="admin-top-actions">
            {page === 'produtos' && !showProductForm && <button className="btn" onClick={() => { resetProductDraft(); setShowProductForm(true); }}><Plus size={18}/>Adicionar Produto</button>}
            {page === 'categorias' && !showCategoryForm && <button className="btn" onClick={() => { setEditingCategory(null); setCategoryDraft(blankCategory); setShowCategoryForm(true); }}><Plus size={18}/>Adicionar Categoria</button>}
            <div className="admin-user-badge"><Image src="/dom-cosse-logo-badge.png" alt="" width={40} height={40}/><span><strong>Dom Cossé</strong><small>Administrador</small></span><ChevronDown size={16}/></div>
          </div>
        </div>
        {notice && <p className={`notice ${noticeError ? 'danger' : ''}`} role={noticeError ? 'alert' : 'status'}>{notice}</p>}
        {loading && <p className="muted" role="status">Carregando dados do Supabase…</p>}
        {loadError && !loading && <div className="admin-card admin-load-error" role="alert"><strong>Não foi possível carregar os dados.</strong><span>{loadError}</span><button className="filter-chip" onClick={() => void load()}>Tentar novamente</button></div>}

        {!loading && page === 'painel' && <>
          <div className="admin-stat-grid">
            <div className="admin-stat"><span className="admin-stat-icon"><Package/></span><div><strong>{products.length}</strong><span>Total de produtos</span></div></div>
            <div className="admin-stat"><span className="admin-stat-icon"><Tag/></span><div><strong>{categories.length}</strong><span>Categorias</span></div></div>
            <div className="admin-stat"><span className="admin-stat-icon available"><CircleCheck/></span><div><strong>{products.filter((product) => product.status === 'disponivel').length}</strong><span>Disponíveis</span></div></div>
            <div className="admin-stat"><span className="admin-stat-icon unavailable"><CircleX/></span><div><strong>{products.filter((product) => product.status === 'esgotado').length}</strong><span>Esgotados</span></div></div>
          </div>
          <div className="admin-dashboard-grid">
            <section className="admin-card"><h2 className="section-title">Ações rápidas</h2><div className="admin-quick-actions"><button className="filter-chip" onClick={() => { resetProductDraft(); setShowProductForm(true); setPage('produtos'); }}><Plus size={17}/> Novo produto</button><button className="filter-chip" onClick={() => setPage('produtos')}><Package size={17}/> Gerenciar produtos</button><button className="filter-chip" onClick={() => setPage('categorias')}><Shapes size={17}/> Gerenciar categorias</button><button className="filter-chip" onClick={() => setPage('banner')}><ImageIcon size={17}/> Personalizar banner principal</button><button className="filter-chip" onClick={() => setPage('configuracoes')}><Settings size={17}/> Configurações da loja</button><small className="muted">Cliques no WhatsApp nos últimos 7 dias: {whatsappClicks === null ? '—' : whatsappClicks}</small></div></section>
            <section className="admin-card"><div className="admin-card-heading"><h2 className="section-title">Produtos recentes</h2><button className="text-link" onClick={() => setPage('produtos')}>Ver todos →</button></div>{products.length ? <div className="row-cards admin-recent">{products.slice(0, 4).map((product) => <article className="product-row" key={product.id}>{product.image_url ? <Image src={product.image_url} alt="" width={56} height={64} unoptimized/> : <div className="row-thumb"/>}<div className="product-row-content"><strong>{product.name}</strong><div className="muted">{categories.find((category) => category.slug === product.category)?.name || product.category}{product.lot_quantity ? ` · Lote de ${product.lot_quantity}` : ''} · {productPrice(product.price)}</div></div><span className={`admin-status ${product.status}`}>{product.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</span></article>)}</div> : <p className="muted">Nenhum produto cadastrado.</p>}</section>
          </div>
        </>}

        {!loading && page === 'categorias' && <>
          {showCategoryForm && <form className="admin-card category-editor" onSubmit={saveCategory}>
            <h2 className="section-title">{editingCategory ? 'Editar categoria' : 'Nova categoria'}</h2>
            <div className="form-grid">
              <label className="field"><span>Nome</span><input required maxLength={80} value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} placeholder="Ex.: Cuias"/></label>
              <label className="field"><span>Ícone</span><select value={categoryDraft.icon} onChange={(event) => setCategoryDraft({ ...categoryDraft, icon: event.target.value as CategoryIcon })}><option value="cuia">Cuia</option><option value="bomba">Bomba</option><option value="shapes">Grade</option></select></label>
              <label className="field"><span>Foto da categoria</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCategoryPhoto}/><small>JPG, PNG ou WEBP. A foto de “Lotes de Cuias” já vem cadastrada.</small></label>
              {categoryDraft.image_url && <div className="photo-main-preview"><Image src={categoryDraft.image_url} alt="Prévia da foto da categoria" fill sizes="240px" unoptimized/></div>}
            </div>
            <div className="preview-actions"><button className="btn" disabled={busy}><Save size={18}/>{busy ? 'Salvando…' : editingCategory ? 'Salvar categoria' : 'Adicionar categoria'}</button><button className="filter-chip" type="button" onClick={() => { setEditingCategory(null); setCategoryDraft(blankCategory); setShowCategoryForm(false); }}><X size={16}/>Cancelar</button></div>
          </form>}
          <section className="admin-card admin-table-card"><h2 className="section-title">Categorias cadastradas</h2>
            {categories.length === 0 ? <p className="muted">Nenhuma categoria cadastrada.</p> : <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Ícone</th><th>Nome da categoria</th><th>Produtos</th><th>Ações</th></tr></thead><tbody>{categories.map((category) => <tr key={category.slug}><td><span className="category-icon"><CategorySymbol icon={category.icon}/></span></td><td><strong>{category.name}</strong></td><td>{categoryCounts[category.slug] || 0}</td><td><div className="admin-row-actions"><button className="filter-chip" onClick={() => { editCategory(category); setShowCategoryForm(true); }} aria-label={`Editar ${category.name}`}><Pencil size={17}/></button><button className="filter-chip danger-action" onClick={() => void deleteCategory(category)} disabled={busyProduct === `category:${category.slug}`} aria-label={`Excluir ${category.name}`}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
          </section>
        </>}

        {!loading && page === 'produtos' && <>
          {showProductForm && <div className="admin-form-layout">
            <form id="product-form" className="admin-card" onSubmit={saveProduct}>
              <h2 className="section-title">{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>
              <div className="photo-manager">
                <div className="photo-main-preview">
                  {draft.image_url ? <Image src={draft.image_url} alt="Foto principal do produto" fill sizes="(max-width: 767px) 100vw, 320px" unoptimized/> : <div className="photo-placeholder"><ImageIcon size={40}/><span>Foto principal</span></div>}
                </div>
                <div className="photo-controls">
                  <input ref={cameraPhotoInput} className="visually-hidden" type="file" accept={PHOTO_ACCEPT} capture="environment" onChange={uploadMainPhoto}/>
                  <input ref={mainPhotoInput} className="visually-hidden" type="file" accept={PHOTO_ACCEPT} onChange={uploadMainPhoto}/>
                  <input ref={galleryInput} className="visually-hidden" type="file" accept={PHOTO_ACCEPT} multiple onChange={uploadGalleryPhotos}/>
                  <div className="photo-picker-actions"><button type="button" className="filter-chip" onClick={() => cameraPhotoInput.current?.click()} disabled={busy}><ImageIcon size={17}/>Tirar foto</button>
                  <button type="button" className="filter-chip" onClick={() => mainPhotoInput.current?.click()} disabled={busy}><ImageIcon size={17}/>Escolher foto principal</button>
                  <button type="button" className="filter-chip photo-picker-gallery" onClick={() => galleryInput.current?.click()} disabled={busy}><Plus size={17}/>Adicionar fotos da galeria</button></div>
                  <small className="muted">Escolha fotos salvas na galeria ou tire uma foto. Aceita JPG, PNG, WEBP e HEIC/HEIF; até 5 MB por imagem. Lotes aceitam até 48 fotos.</small>
                </div>
                {(draft.image_url || draft.gallery_urls.length > 0) && <div className="photo-gallery-editor" aria-label="Galeria de fotos do produto">
                  {[...(draft.image_url ? [draft.image_url] : []), ...draft.gallery_urls].map((url, index, photos) => <article className={`photo-thumb ${index === 0 ? 'is-main' : ''}`} key={`${url}-${index}`}><button className="photo-thumb-select" type="button" onClick={() => chooseMainPhoto(url)} aria-label={index === 0 ? 'Imagem principal selecionada' : 'Definir como imagem principal'} aria-pressed={index === 0}><Image src={url} alt={index === 0 ? 'Imagem principal' : `Foto ${index + 1}`} fill sizes="90px" unoptimized/><span>{index === 0 ? 'Capa' : `Foto ${index + 1}`}</span></button><div className="photo-thumb-tools"><button type="button" onClick={() => movePhoto(url, -1)} disabled={index === 0} aria-label={`Mover foto ${index + 1} para a esquerda`}><ChevronLeft size={16}/></button><button type="button" onClick={() => movePhoto(url, 1)} disabled={index === photos.length - 1} aria-label={`Mover foto ${index + 1} para a direita`}><ChevronRight size={16}/></button><button type="button" className="photo-thumb-remove" onClick={() => removePhoto(url)} aria-label={`Remover foto ${index + 1}`}><X size={16}/></button></div></article>)}
                </div>}
              </div>
              <div className="form-grid">
                <label className="field wide"><span>Nome do produto</span><input required maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label>
                <label className="field"><span>Categoria</span><select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value, cuia_subcategory: null, lot_quantity: event.target.value === 'lotes-de-cuias' ? draft.lot_quantity || 6 : null })}><option value="" disabled>Selecione</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
                {draft.category === 'cuias' && <label className="field"><span>Tipo de cuia</span><select value={draft.cuia_subcategory || ''} onChange={(event) => setDraft({ ...draft, cuia_subcategory: event.target.value as Product['cuia_subcategory'] })}><option value="">Selecione</option>{CUIA_SUBCATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
                {draft.category === 'lotes-de-cuias' && <label className="field"><span>Quantidade de cuias no lote</span><select required value={draft.lot_quantity || ''} onChange={(event) => setDraft({ ...draft, lot_quantity: Number(event.target.value) as Product['lot_quantity'] })}><option value="" disabled>Selecione</option>{LOT_QUANTITIES.map((quantity) => <option key={quantity} value={quantity}>{quantity} unidades</option>)}</select></label>}
                <label className="field"><span>Preço (R$){draft.category === 'lotes-de-cuias' ? ' · opcional' : ''}</span><input required={draft.category !== 'lotes-de-cuias'} type="text" inputMode="decimal" placeholder={draft.category === 'lotes-de-cuias' ? 'Opcional' : '0,00'} value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value.replace(/[^\d,.]/g, '') })}/></label>
                <label className="field wide"><span>Descrição</span><textarea maxLength={2000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label>
                <label className="field wide featured-toggle"><span>Produto em destaque</span><span><input type="checkbox" checked={draft.is_featured} onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })}/> Mostrar na seção de destaques</span></label>
                {draft.is_featured && <label className="field"><span>Ordem dos destaques</span><input type="number" min="0" max="999" step="1" value={draft.featured_order} onChange={(event) => setDraft({ ...draft, featured_order: Math.max(0, Math.min(999, Number(event.target.value) || 0)) })}/><small>Número menor aparece primeiro. Empates usam a data de cadastro.</small></label>}
                <div className="field wide"><span>Status</span><div className="segmented"><button type="button" className={draft.status === 'disponivel' ? 'active' : ''} aria-pressed={draft.status === 'disponivel'} onClick={() => setDraft({ ...draft, status: 'disponivel' })}>Disponível</button><button type="button" className={draft.status === 'esgotado' ? 'sold-active' : ''} aria-pressed={draft.status === 'esgotado'} onClick={() => setDraft({ ...draft, status: 'esgotado' })}>Esgotado</button></div></div>
              </div>
              <div className="preview-actions product-submit"><button className="filter-chip product-save-draft" type="submit" value="draft" disabled={busy || categories.length === 0}><Save size={18}/>{busy ? 'Salvando…' : 'Salvar produto'}</button><button className="btn product-publish" type="submit" value="publish" disabled={busy || categories.length === 0}><Save size={18}/>{busy ? 'Salvando…' : 'Salvar e publicar no site'}</button><button className="filter-chip product-cancel" type="button" disabled={busy} onClick={() => { if (editingProduct) void abandonProductDraft(); else { resetProductDraft(); setShowProductForm(false); } }}><X size={16}/>Cancelar edição</button></div>
            </form>
            <aside className="admin-card preview-wrap"><h2 className="section-title">Prévia do catálogo</h2><article className={`product-card admin-product-preview ${draft.status === 'esgotado' ? 'sold' : ''}`}><div className="product-photo">{draft.image_url ? <Image src={draft.image_url} alt="Prévia do produto" fill sizes="280px" unoptimized/> : <ImageIcon size={38} color="#aaa"/>}{draft.is_featured && <span className="featured-label">DESTAQUE</span>}{draft.status === 'esgotado' && <span className="sold-label">ESGOTADO</span>}</div><div className="product-info"><h3 className="product-name">{draft.name || 'Nome do produto'}</h3>{draft.category && <p className="product-quantity">{categories.find((category) => category.slug === draft.category)?.name || draft.category}{draft.lot_quantity ? ` · Lote com ${draft.lot_quantity} cuias` : ''}</p>}<p className="price">{draft.price ? brl(Number(draft.price.replace(',', '.'))) : draft.category === 'lotes-de-cuias' ? 'Consulte pelo WhatsApp' : 'Preço cadastrado'}</p><p className={`availability ${draft.status === 'esgotado' ? 'unavailable' : ''}`}><span aria-hidden="true"/>{draft.status === 'esgotado' ? 'Esgotado' : 'Disponível'} · {draft.is_published ? 'Publicado' : 'Rascunho'}</p><button type="button" className="consult" disabled><FaWhatsapp size={18}/>Ver detalhes</button></div></article></aside>
          </div>}
          <section className="admin-card admin-products-list"><div className="admin-card-heading"><h2 className="section-title">Produtos cadastrados</h2><span className="muted">{filteredProducts.length} de {products.length}</span></div><div className="admin-product-filters"><label className="field">Buscar produto<input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar produto…"/></label><label className="field">Categoria<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="todos">Todas</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label><label className="field">Disponibilidade<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="todos">Todos</option><option value="disponivel">Disponíveis</option><option value="esgotado">Esgotados</option></select></label><label className="field">Publicação<select value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)}><option value="todos">Todas</option><option value="publicados">Publicados</option><option value="rascunhos">Rascunhos</option></select></label></div>
            {filteredProducts.length === 0 ? <p className="muted admin-empty-products">{products.length ? 'Nenhum produto corresponde aos filtros.' : 'Adicione produtos para que eles apareçam aqui.'}</p> : <div className="admin-table-scroll"><table className="admin-table product-admin-table"><thead><tr><th>Imagem</th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Disponibilidade</th><th>Ações</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id}><td>{product.image_url ? <Image className="admin-product-thumb" src={product.image_url} alt="" width={48} height={48} unoptimized/> : <span className="admin-product-thumb placeholder"/>}</td><td><strong>{product.name}</strong>{product.is_featured && <small className="admin-table-note">Destaque</small>}</td><td>{categories.find((category) => category.slug === product.category)?.name || product.category}</td><td>{productPrice(product.price)}</td><td><button className={`admin-status ${product.status}`} disabled={Boolean(busyProduct)} onClick={() => void toggleAvailability(product)}>{product.status === 'disponivel' ? 'Disponível' : 'Esgotado'}</button><button className="admin-table-note admin-publish-toggle" disabled={Boolean(busyProduct)} onClick={() => void togglePublication(product)}>{product.is_published ? 'Publicado' : 'Rascunho'} · alterar</button></td><td><div className="admin-row-actions"><button className="filter-chip" disabled={Boolean(busyProduct)} onClick={() => editProduct(product)} aria-label={`Editar ${product.name}`}><Pencil size={17}/></button><button className="filter-chip" disabled={Boolean(busyProduct)} onClick={() => void duplicateProduct(product)} aria-label={`Duplicar ${product.name}`}><Copy size={17}/></button><button className="filter-chip danger-action" disabled={Boolean(busyProduct)} onClick={() => void deleteProduct(product)} aria-label={`Excluir ${product.name}`}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
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
        </>}

        {!loading && page === 'banner' && <form className="admin-card" onSubmit={saveBanner}>
          <h2 className="section-title">PERSONALIZAR BANNER PRINCIPAL</h2>
          <p className="muted">Veja as imagens e ajuste o enquadramento antes de publicar. A área pontilhada mostra onde o botão do catálogo será clicável. Use imagens que já contenham a marca e o botão desenhado.</p>
          <input ref={bannerDesktopInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => changeBanner(event, 'desktop')}/>
          <input ref={bannerMobileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => changeBanner(event, 'mobile')}/>
          <div className="banner-editor-grid">
            <section className="banner-editor-panel" aria-label="Banner para computador">
              <h3>Computador</h3>
              <div className="banner-editor-preview" role="img" aria-label="Prévia do banner para computador" style={{ backgroundImage: `url("${desktopBannerPreview}")`, backgroundPosition: `${bannerDraft.banner_desktop_x}% ${bannerDraft.banner_desktop_y}%` }}><span className="banner-preview-hotspot" style={{ left: `${bannerDraft.banner_cta_x}%`, top: `${bannerDraft.banner_cta_y}%` }}/></div>
              <div className="banner-editor-actions"><button type="button" className="filter-chip" onClick={() => bannerDesktopInput.current?.click()} disabled={busy}><ImageIcon size={17}/>Enviar imagem</button>{(bannerDraft.banner_url || bannerFiles.desktop) && <button type="button" className="filter-chip danger-action" onClick={() => removeBannerImage('desktop')} disabled={busy}><Trash2 size={17}/>Usar imagem padrão</button>}</div>
              <div className="banner-editor-controls">
                <BannerSlider label="Enquadramento horizontal" value={bannerDraft.banner_desktop_x} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_desktop_x: value }))}/>
                <BannerSlider label="Enquadramento vertical" value={bannerDraft.banner_desktop_y} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_desktop_y: value }))}/>
                <BannerSlider label="Botão horizontal" value={bannerDraft.banner_cta_x} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_cta_x: value }))}/>
                <BannerSlider label="Botão vertical" value={bannerDraft.banner_cta_y} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_cta_y: value }))}/>
              </div>
            </section>
            <section className="banner-editor-panel" aria-label="Banner para celular">
              <h3>Celular</h3>
              <div className={`banner-editor-preview mobile ${hasMobileBannerPreview ? '' : 'landscape'}`} role="img" aria-label="Prévia do banner para celular" style={{ backgroundImage: `url("${mobileBannerPreview}")`, backgroundPosition: `${bannerDraft.banner_mobile_x}% ${bannerDraft.banner_mobile_y}%` }}><span className="banner-preview-hotspot" style={{ left: `${bannerDraft.banner_mobile_cta_x}%`, top: `${bannerDraft.banner_mobile_cta_y}%` }}/></div>
              <p className="muted">A imagem para celular é opcional. Sem ela, o banner completo do computador aparece sem cortes.</p>
              <div className="banner-editor-actions"><button type="button" className="filter-chip" onClick={() => bannerMobileInput.current?.click()} disabled={busy}><ImageIcon size={17}/>Enviar imagem mobile</button>{(bannerDraft.banner_mobile_url || bannerFiles.mobile) && <button type="button" className="filter-chip danger-action" onClick={() => removeBannerImage('mobile')} disabled={busy}><Trash2 size={17}/>Usar imagem do computador</button>}</div>
              <div className="banner-editor-controls">
                <BannerSlider label="Enquadramento horizontal" value={bannerDraft.banner_mobile_x} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_mobile_x: value }))}/>
                <BannerSlider label="Enquadramento vertical" value={bannerDraft.banner_mobile_y} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_mobile_y: value }))}/>
                <BannerSlider label="Botão horizontal" value={bannerDraft.banner_mobile_cta_x} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_mobile_cta_x: value }))}/>
                <BannerSlider label="Botão vertical" value={bannerDraft.banner_mobile_cta_y} onChange={(value) => setBannerDraft((current) => ({ ...current, banner_mobile_cta_y: value }))}/>
              </div>
            </section>
          </div>
          <div className="banner-editor-actions"><button type="submit" className="btn" disabled={busy}><Save size={18}/>{busy ? 'Publicando…' : 'Salvar e publicar'}</button><button type="button" className="filter-chip" disabled={busy} onClick={resetBannerDraft}><X size={17}/>Cancelar edição</button></div>
        </form>}
      </main>
    </div>
  );
}
