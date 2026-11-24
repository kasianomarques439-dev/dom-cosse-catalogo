import { z } from 'zod';

export const sectionSchema = z.object({ category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(48), title: z.string().trim().min(1).max(180), short_label: z.string().trim().min(1).max(100), position: z.number().int().min(0).max(9999), is_visible: z.boolean() }).strict();
