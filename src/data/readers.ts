import { getCollection } from "astro:content";

export interface ReaderSlide {
  src: string;
  label: string;
  alt: string;
}

export interface ReaderItem {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  categoryLine: string;
  tags: string[];
  introduction: string;
  quickTakeaway: string;
  publishedDate: string;
  slides: ReaderSlide[];
  discussionQuestion: string;
  courseTitle: string | null;
  resourceTitle: string | null;
  resourcePreview: string | null;
  isProCourseAvailable: boolean;
  skoolCourseUrl: string | null;
  skoolResourceUrl: string | null;
  skoolDiscussionUrl: string | null;
}

export const VISUAL_CATEGORIES: Record<string, string> = {
  "site-works": "地盤施工",
  "contracts-qs": "Contracts & QS",
  "building-services": "Building Services",
  "site-management": "Site Management",
  "design-statutory": "Design / Statutory",
  "safety-environment": "Safety & Environment",
  "ai-construction": "AI for Construction",
  "engineering-cases": "工程案例",
};

const optionalUrl = (value?: string) => value?.trim() || null;

export async function getReaders(): Promise<ReaderItem[]> {
  const entries = await getCollection("readers", ({ data }) => !data.draft);
  const slugs = new Set<string>();

  const readers = entries.map(({ data }) => {
    if (slugs.has(data.slug)) {
      throw new Error(`Duplicate Visual Library slug: ${data.slug}`);
    }
    slugs.add(data.slug);

    return {
      slug: data.slug,
      title: data.title,
      category: data.category,
      categoryLabel: VISUAL_CATEGORIES[data.category] ?? data.category,
      categoryLine: data.categoryLine,
      tags: data.tags,
      introduction: data.introduction,
      quickTakeaway: data.quickTakeaway,
      publishedDate: data.publishedDate.toISOString().slice(0, 10),
      slides: data.slides,
      discussionQuestion: data.discussionQuestion,
      courseTitle: data.courseTitle?.trim() || null,
      resourceTitle: data.resourceTitle?.trim() || null,
      resourcePreview: data.resourcePreview?.trim() || null,
      isProCourseAvailable: data.isProCourseAvailable,
      skoolCourseUrl: optionalUrl(data.skoolCourseUrl),
      skoolResourceUrl: optionalUrl(data.skoolResourceUrl),
      skoolDiscussionUrl: optionalUrl(data.skoolDiscussionUrl),
    };
  });

  return readers.sort((a, b) => Date.parse(b.publishedDate) - Date.parse(a.publishedDate));
}
