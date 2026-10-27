import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import MfaForm from '@/components/mfa-form';
export const metadata={robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function MfaPage(){const auth=await requireAdmin({skipMfa:true});if(auth.error)redirect('/admin/login');return <MfaForm/>}
