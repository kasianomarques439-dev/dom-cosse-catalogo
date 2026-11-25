'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { MAX_DESTAQUES } from '@/lib/dom-featured';
import type { DomFeature } from '@/lib/dom-data';

type Draft = DomFeature & { file?: File; preview?: string };
const blank = (position: number): Draft => ({ id: crypto.randomUUID(), type: 'cuia', name: '', description: '', image_url: '', badge: null, position, is_active: true });

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}

export default function DomFeaturedAdmin() {
  const [items, setItems] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try { const data = await request('/api/dom/featured'); setItems((data as DomFeature[]).map((item, position) => ({ ...item, position }))); setError(''); }
    catch (cause) { setError((cause as Error).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  function change(id: string, patch: Partial<Draft>) { setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item)); }
  function selectImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase()) || file.size > 10 * 1024 * 1024) { setError('Use JPG, PNG ou WebP com até 10 MB.'); event.target.value = ''; return; }
    change(id, { file, preview: URL.createObjectURL(file) });
    setError('');
  }
  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= items.length) return;
    setItems(current => { const next = [...current]; [next[index], next[other]] = [next[other], next[index]]; return next.map((item, position) => ({ ...item, position })); });
  }
  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      const payload = [];
      for (const item of items) {
        let image_url = item.image_url;
        if (item.file) {
          const form = new FormData(); form.append('file', item.file); form.append('purpose', 'highlight');
          const uploaded = await request('/api/upload', { method: 'POST', body: form });
          image_url = uploaded.url;
        }
        payload.push({ id: item.id, type: item.type, name: item.name.trim(), description: item.description.trim(), image_url, badge: item.badge?.trim() || null, position: item.position, is_active: item.is_active });
      }
      await request('/api/dom/featured', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      await load(); setNotice('Destaques salvos.');
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(item: Draft) {
    if (!window.confirm(`Excluir o destaque “${item.name || 'sem nome'}”?`)) return;
    if (item.id.startsWith('default-')) { setItems(current => current.filter(row => row.id !== item.id)); return; }
    setBusy(true); setError(''); setNotice('');
    try { await request(`/api/dom/featured?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' }); await load(); setNotice('Destaque excluído.'); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  if (loading) return <p role="status">Carregando destaques…</p>;
  return <section className="da-featured-admin" aria-labelledby="da-featured-heading">
    <h1 id="da-featured-heading">DESTAQUES DA LOJA</h1>
    <p>Adicione até {MAX_DESTAQUES} itens. O tipo é apenas uma identificação; você pode escolher livremente quantas cuias ou bombas quiser.</p>
    <p className="da-featured-count">{items.length} de {MAX_DESTAQUES} vagas usadas</p>
    {error && <p className="da-error" role="alert">{error}</p>}{notice && <p className="da-notice" role="status">{notice}</p>}
    <div className="da-featured-list">{items.map((item, index) => <article className="da-featured-item" key={item.id}>
      <div className="da-featured-item-head"><strong>{String(index + 1).padStart(2, '0')}</strong><label className="da-featured-active"><input type="checkbox" checked={item.is_active} onChange={event => change(item.id, { is_active: event.target.checked })}/> Ativo</label><div className="da-featured-order"><button type="button" className="da-button" disabled={index === 0 || busy} onClick={() => move(index, -1)} aria-label="Subir">↑</button><button type="button" className="da-button" disabled={index === items.length - 1 || busy} onClick={() => move(index, 1)} aria-label="Descer">↓</button></div></div>
      <label className="da-featured-photo">{(item.preview || item.image_url) && <img src={item.preview || item.image_url} alt="Prévia do destaque"/>}<span>Escolher foto</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => selectImage(item.id, event)}/></label>
      <div className="da-featured-fields"><label>Tipo<select value={item.type} onChange={event => change(item.id, { type: event.target.value as DomFeature['type'] })}><option value="cuia">Cuia</option><option value="bomba">Bomba</option></select></label>
        <label>Nome<input value={item.name} maxLength={60} onChange={event => change(item.id, { name: event.target.value })} required/></label>
        <label>Descrição curta<textarea value={item.description} maxLength={140} rows={2} onChange={event => change(item.id, { description: event.target.value })}/></label>
        <label>Selo opcional<input value={item.badge || ''} maxLength={60} placeholder="Ex.: Lançamento" onChange={event => change(item.id, { badge: event.target.value || null })}/></label></div>
      <button type="button" className="da-button da-danger" disabled={busy} onClick={() => void remove(item)}>Excluir</button>
    </article>)}</div>
    <div className="da-featured-actions"><button type="button" className="da-button" disabled={busy || items.length >= MAX_DESTAQUES} onClick={() => setItems(current => [...current, blank(current.length)])}>Adicionar destaque</button><button type="button" className="da-button da-save" disabled={busy} onClick={() => void save()}>{busy ? 'SALVANDO…' : 'SALVAR E PUBLICAR'}</button></div>
  </section>;
}
