import { revalidatePath } from 'next/cache';

export function refreshCatalog() {
  for (const path of ['/', '/catalogo', '/catalogo/cuias', '/catalogo/bombas', '/nossa-historia', '/contato']) revalidatePath(path);
  revalidatePath('/catalogo/[slug]', 'page');
}
