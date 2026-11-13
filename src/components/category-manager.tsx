'use client';

import { useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Category } from '@/lib/types';

type Draft = { originalSlug: string; name: string; slug: string; position: number };
const blank: Draft = { originalSlug: '', name: '', slug: '', position: 0 };
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48).replace(/-$/,'');

export default function CategoryManager({ categories, onUpdated }: { categories: Category[]; onUpdated: () => Promise<void> }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function send(url: string, method: string, body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Não foi possível salvar a categoria.');
    return data;
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const slug = draft.slug.trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 48) { setError('Use letras minúsculas, números e hífens no slug.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      if (draft.originalSlug) await send(`/api/categories/${draft.originalSlug}`, 'PATCH', { name: draft.name.trim(), slug, position: draft.position });
      else await send('/api/categories', 'POST', { name: draft.name.trim(), slug, position: draft.position, icon: 'shapes', image_url: null });
      setDraft(null); setNotice('Categoria salva e publicada.'); await onUpdated();
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true); setError(''); setNotice('');
    try { await send(`/api/categories/${deleting.slug}`, 'DELETE'); setDeleting(null); setNotice('Categoria excluída.'); await onUpdated(); }
    catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  return <>
    <h1>CATEGORIAS</h1>
    <p>Organize as categorias do catálogo. Cuias e Bombas mantêm seus endereços atuais.</p>
    <div className="da-stack">{categories.map(item => <article className="da-section-card" key={item.slug}>
      <div className="da-section-top"><strong>{item.name}</strong><button className="da-icon" aria-label={`Editar ${item.name}`} onClick={() => { setDraft({ originalSlug: item.slug, name: item.name, slug: item.slug, position: item.position ?? 0 }); setError(''); }}><Pencil/></button>{!['cuias','bombas'].includes(item.slug) && <button className="da-icon da-danger" aria-label={`Excluir ${item.name}`} onClick={() => setDeleting(item)}><Trash2/></button>}</div>
      <small>/{item.slug} · ordem {item.position ?? 0}</small>
    </article>)}</div>
    <button className="da-button" onClick={() => { setDraft({ ...blank, position: Math.max(-1, ...categories.map(item => item.position ?? 0)) + 1 }); setError(''); }}><Plus/> ADICIONAR CATEGORIA</button>
    {draft && <form className="da-form da-category-form" onSubmit={save}><h2>{draft.originalSlug ? 'EDITAR CATEGORIA' : 'NOVA CATEGORIA'}</h2><label>Nome<input required maxLength={80} value={draft.name} onChange={event => setDraft(current => current && ({ ...current, name: event.target.value, slug: current.originalSlug ? current.slug : slugify(event.target.value) }))}/></label><label>Slug<input required maxLength={48} value={draft.slug} disabled={['cuias','bombas'].includes(draft.originalSlug)} onChange={event => setDraft(current => current && ({ ...current, slug: event.target.value }))}/></label><label>Ordem de exibição<input type="number" min={0} max={9999} required value={draft.position} onChange={event => setDraft(current => current && ({ ...current, position: Number(event.target.value) }))}/></label><button className="da-button da-save" disabled={busy}><Check/> SALVAR E PUBLICAR</button><button className="da-button da-outline" type="button" onClick={() => setDraft(null)}><X/> CANCELAR</button></form>}
    {deleting && <div className="da-overlay da-confirm-backdrop"><div className="da-confirm" role="alertdialog" aria-modal="true" aria-label="Excluir categoria"><h2>EXCLUIR CATEGORIA?</h2><p>{deleting.name}</p><p>É necessário mover ou excluir suas seções e produtos primeiro.</p><div><button className="da-button da-outline" onClick={() => setDeleting(null)}>CANCELAR</button><button className="da-button da-delete" disabled={busy} onClick={remove}>EXCLUIR</button></div></div></div>}
    {error && <p className="da-error" role="alert">{error}</p>}{notice && <p className="da-notice" role="status"><Check/> {notice}</p>}
  </>;
}
