import DomPublic from '@/components/dom-public';
import { getDomData } from '@/lib/dom-server-data';
export const dynamic = 'force-dynamic';
export default async function Cuias() { return <DomPublic page="cuias" {...await getDomData()}/>; }
