import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    author: z.string().default("BuildScope 編輯部"),
    difficulty: z.enum(["入門", "中階", "進階"]).default("入門"),
    readingTime: z.string().default("5 分鐘"),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: glob({ base: "./src/content/news", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    sourceName: z.string().optional(),
    sourceUrl: z.string().url().optional().or(z.literal("")),
    coverImage: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const templates = defineCollection({
  loader: glob({ base: "./src/content/templates", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    fileType: z.string(),
    access: z.enum(["免費", "付費", "會員專享", "即將推出"]).default("即將推出"),
    actionLabel: z.string().default("預覽範本"),
    downloadUrl: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    sortOrder: z.coerce.number().default(100),
  }),
});

const ebooks = defineCollection({
  loader: glob({ base: "./src/content/ebooks", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    pages: z.string(),
    status: z.enum(["現已發售", "即將推出", "編輯中", "免費下載"]).default("編輯中"),
    format: z.string().default("PDF"),
    language: z.string().default("繁體中文"),
    coverImage: z.string().optional(),
    purchaseUrl: z.string().optional(),
    actionLabel: z.string().default("查看詳情"),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    sortOrder: z.coerce.number().default(100),
  }),
});

export const collections = { blog, news, templates, ebooks };
