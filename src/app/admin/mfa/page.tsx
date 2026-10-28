import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
export const metadata={robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function MfaPage(){const auth=await requireAdmin();if(auth.error)redirect('/admin/login');redirect('/admin')}
