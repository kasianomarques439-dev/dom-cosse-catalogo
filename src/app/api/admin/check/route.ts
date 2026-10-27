import { requireAdmin } from '@/lib/admin';
import { enforceIpLimit } from '@/lib/rate-limit';
export async function GET(req:Request) { const limited=await enforceIpLimit(req,'admin-check',30,900);if(limited)return limited;const auth=await requireAdmin({skipMfa:true}); if(auth.error)return auth.error; const {data}=await auth.supabase.auth.mfa.getAuthenticatorAssuranceLevel(); return Response.json({ok:true,mfaRequired:process.env.NODE_ENV==='production'&&data?.currentLevel!=='aal2'},{headers:{'Cache-Control':'private, no-store'}}); }
