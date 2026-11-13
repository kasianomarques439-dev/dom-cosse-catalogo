import DomPublic from '@/components/dom-public';
import { getDomData } from '@/lib/dom-server-data';
export const dynamic = 'force-dynamic';
export default async function Bombas() { return <DomPublic page="bombas" {...await getDomData()}/>; }
