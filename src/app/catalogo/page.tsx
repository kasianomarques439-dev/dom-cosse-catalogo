import DomPublic from '@/components/dom-public';
import { getDomData } from '@/lib/dom-server-data';
export const dynamic = 'force-dynamic';
export default async function Catalogo() { return <DomPublic page="catalog" {...await getDomData()}/>; }
