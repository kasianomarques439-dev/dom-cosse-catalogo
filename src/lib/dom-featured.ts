import { z } from 'zod';

export const MAX_DESTAQUES = 10;

export const featuredItemSchema = z.object({
  id: z.uuid(), type: z.enum(['cuia', 'bomba']), name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(140), image_url: z.string().min(1).max(1000), badge: z.string().trim().max(60).nullable(),
  position: z.number().int().min(0).max(MAX_DESTAQUES - 1), is_active: z.boolean(),
}).strict();

export const featuredListSchema = z.array(featuredItemSchema).max(MAX_DESTAQUES).refine(items =>
  new Set(items.map(item => item.id)).size === items.length && new Set(items.map(item => item.position)).size === items.length,
);
