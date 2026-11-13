export const WHATSAPP_PLACEMENTS = [
  'hero', 'essence', 'mobile_sticky', 'header', 'product_card', 'product_modal',
  'product_page', 'contact', 'footer', 'floating',
] as const;

export type WhatsAppPlacement = typeof WHATSAPP_PLACEMENTS[number];

export function trackWhatsAppClick(event: {
  placement: WhatsAppPlacement;
  category?: string | null;
  productId?: string | null;
}) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    page_path: window.location.pathname,
    placement: event.placement,
    category: event.category || null,
    product_id: event.productId || null,
  });
  const url = '/api/analytics/whatsapp';
  if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return;
  void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, credentials: 'same-origin', keepalive: true }).catch(() => undefined);
}
