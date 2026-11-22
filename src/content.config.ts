import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    coverCaption: z.string().optional(),
    coverWidth: z.number().int().positive().optional(),
    coverHeight: z.number().int().positive().optional(),
    author: z.string().default("BuildScope 編輯部"),
    authorType: z.enum(["Organization", "Person"]).default("Organization"),
    difficulty: z.enum(["入門", "中階", "進階"]).default("入門"),
    readingTime: z.string().default("5 分鐘"),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    lastReviewedDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    sources: z.array(z.object({ name: z.string(), url: z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol), "來源必須是 HTTP(S) 網址。") })).default([]),
    relatedReaders: z.array(z.string()).default([]),
    relatedArticles: z.array(z.string()).default([]),
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
    sourceUrl: z.url().optional().or(z.literal("")),
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

const pocketGuides = defineCollection({
  loader: glob({ base: "./src/content/pocket-guides", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    topic: z.string(),
    purchaseUrl: z.url().startsWith("https://"),
    coverImage: z.string().optional(),
    sortOrder: z.coerce.number().default(100),
    draft: z.boolean().default(false),
  }),
});

const optionalUrl = z.union([z.url(), z.literal("")]).optional();

const readers = defineCollection({
  loader: glob({ base: "./src/content/readers", pattern: "**/*.md" }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string(),
    category: z.enum([
      "site-works",
      "contracts-qs",
      "building-services",
      "site-management",
      "design-statutory",
      "safety-environment",
      "ai-construction",
      "engineering-cases",
    ]),
    categoryLine: z.string(),
    tags: z.array(z.string()).default([]),
    introduction: z.string(),
    quickTakeaway: z.string(),
    publishedDate: z.coerce.date(),
    draft: z.boolean().default(true),
    slides: z.array(z.object({
      src: z.string(),
      label: z.string(),
      alt: z.string(),
    })).min(1).max(20),
    discussionQuestion: z.string(),
    sourceTitle: z.string().optional(),
    sourceUrl: optionalUrl,
    courseTitle: z.string().optional(),
    resourceTitle: z.string().optional(),
    resourcePreview: z.string().optional(),
    isProCourseAvailable: z.boolean().default(false),
    skoolCourseUrl: optionalUrl,
    skoolResourceUrl: optionalUrl,
    skoolDiscussionUrl: optionalUrl,
    toolUrl: optionalUrl,
    toolTitle: z.string().optional(),
  }),
});

const comics = defineCollection({
  loader: glob({ base: "./src/content/comics", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    episode: z.number().int().positive(),
    series: z.string(),
    category: z.string(),
    publishedDate: z.coerce.date(),
    description: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    imageWidth: z.number().int().positive(),
    imageHeight: z.number().int().positive(),
    seoTitle: z.string(),
    seoDescription: z.string(),
    story: z.array(z.string()).min(1),
    tipTitle: z.string(),
    tipIntroduction: z.array(z.string()).min(1),
    tipPoints: z.array(z.string()).min(1),
    tipClosing: z.string(),
    disclaimer: z.string(),
    skoolCourseUrl: z.url().startsWith("https://www.skool.com/buildscope-learning-lab-1916/classroom/").optional(),
    draft: z.boolean().default(false),
  }),
});

const courses = defineCollection({
  loader: glob({ base: "./src/content/courses", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(["contracts-qs", "ai-workflows", "statutory", "site-works"]),
    audience: z.string(),
    outcomes: z.array(z.string()).min(1),
    previewTitle: z.string(),
    previewDescription: z.string(),
    skoolCourseUrl: z.url().startsWith("https://www.skool.com/buildscope-learning-lab-1916/classroom/").optional(),
    sortOrder: z.number().int().positive().default(100),
    draft: z.boolean().default(true),
  }),
});

const englishProducts = defineCollection({
  loader: glob({ base: "./src/content/en/products", pattern: "**/*.md" }),
  schema: z.object({
    productId: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    language: z.literal("en-GB"),
    kind: z.enum(["pocket-guide", "ebook"]),
    category: z.enum(["Engineering Essentials", "Construction Technology", "Quantity Surveying", "Contracts & Commercial Management", "Project Management", "AI & Digital Construction"]),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    description: z.string().min(1),
    price: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    previewUrl: z.string().startsWith("/en/").optional(),
    gumroadUrl: z.url().startsWith("https://").refine((value) => new URL(value).hostname.endsWith("gumroad.com"), "Use a verified Gumroad URL").optional(),
    publicationDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    status: z.enum(["draft", "published"]).default("draft"),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }).refine((value) => value.status === "draft" || Boolean(value.publicationDate), "Published products need a publication date"),
});

const englishInsights = defineCollection({
  loader: glob({ base: "./src/content/en/insights", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    category: z.string(), coverImage: z.string().optional(), coverAlt: z.string().optional(),
    seoTitle: z.string().optional(), draft: z.boolean().default(true),
  }),
});

const englishResources = defineCollection({
  loader: glob({ base: "./src/content/en/resources", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    category: z.string(), downloadUrl: z.string().startsWith("/en/").optional(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { blog, news, templates, ebooks, pocketGuides, readers, comics, courses, englishProducts, englishInsights, englishResources };
