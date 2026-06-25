import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum([
      'project-management',
      'quantity-surveying',
      'contract-management',
      'nec',
      'sop',
      'site-management',
    ]),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingTime: z.string().default('5 分鐘'),
    author: z.string().default('BuildScope 編輯部'),
    difficulty: z.enum(['入門', '進階', '專業']).default('入門'),
    heroAccent: z.enum(['orange', 'red', 'blue']).default('orange'),
  }),
});

export const collections = { blog };
