import { requireAdmin } from '@/lib/admin';
import { enforceIpLimit } from '@/lib/rate-limit';
export async function GET(req:Request) { const limited=await enforceIpLimit(req,'admin-check',30,900);if(limited)return limited;const auth=await requireAdmin(); if(auth.error)return auth.error; return Response.json({ok:true,mfaRequired:false},{headers:{'Cache-Control':'private, no-store'}}); }
