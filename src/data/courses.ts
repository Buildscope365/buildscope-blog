import { getCollection } from "astro:content";

export const courseCategories = {
  "contracts-qs": "合約與 QS",
  "ai-workflows": "AI 與工作流程",
  statutory: "法規與實務",
  "site-works": "地盤施工",
} as const;

export async function getPublishedCourses() {
  const courses = await getCollection("courses", ({ data }) => !data.draft);
  return courses.sort((a, b) => a.data.sortOrder - b.data.sortOrder || a.data.title.localeCompare(b.data.title, "zh-HK"));
}

export const skoolCommunityUrl = "https://www.skool.com/buildscope-learning-lab-1916";
