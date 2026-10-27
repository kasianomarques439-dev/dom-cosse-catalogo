import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import AdminApp from '@/components/admin';
export const metadata={robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function AdminPage() { const auth=await requireAdmin(); if(auth.error){if(auth.error.status===401)redirect('/admin/login');if(auth.error.status===403){const role=await requireAdmin({skipMfa:true});redirect(role.error?'/admin/login':'/admin/mfa')}throw new Error('Serviço de identidade indisponível.');} return <AdminApp/>; }
