export type LibraryStatus = "published" | "draft";
export type RelatedStatus = "published" | "coming-soon";

export interface LibrarySlide {
  src: string;
  label: string;
  alt: string;
}

export interface RelatedContent {
  type: "Breakdown" | "Tool" | "Pocket Guide" | "Case Study";
  title: string;
  status: RelatedStatus;
  href?: string;
}

export interface LibraryItem {
  slug: string;
  categorySlug: string;
  title: string;
  series: string;
  category: string;
  categoryLabel: string;
  topic: string;
  audience: string[];
  format: string;
  introduction: string;
  quickTakeaway: string;
  publishedDate: string;
  status: LibraryStatus;
  slides: LibrarySlide[];
  related: RelatedContent[];
  skoolDiscussionUrl: string | null;
  discussionQuestion: string;
  gateway: {
    eyebrow: string;
    categoryLine: string;
    formatLine: string;
    ctaLabel: string;
  };
}

const treeSlides = [
  ["01-tree-rate-cover.jpg", "Tree Rate 封面", "一棵樹個價，到底包啲乜？"],
  ["02-plant-material.jpg", "植物材料", "植物品種、規格、質素及健康狀況"],
  ["03-delivery-to-site.jpg", "運送到場", "由苗圃到地盤的裝卸及運輸"],
  ["04-site-handling-and-access.jpg", "場內搬運", "地盤通道、吊運、保護及場內搬運"],
  ["05-planting-works.jpg", "種植施工", "人手、機械、泥土改良及種植工序"],
  ["06-support-and-protection.jpg", "支撐及保護", "樹木支架、保護措施及工地保護"],
  ["07-maintenance-and-establishment.jpg", "養護及維護", "澆水、施肥、修剪、除草及定期檢查"],
  ["08-risk-and-responsibility.jpg", "風險及責任", "成活期、更換風險及保養責任"],
  ["09-tree-rate-summary.jpg", "總結", "Tree Rate 包含材料、運送、種植、支撐、養護及風險"],
] as const;

export const LIBRARY_ITEMS: LibraryItem[] = [
  {
    slug: "tree-price-scope",
    categorySlug: "landscape",
    title: "一棵樹個價，到底包啲乜？",
    series: "Engineering Plain Talk",
    category: "Landscape",
    categoryLabel: "園景工程",
    topic: "Tree Supply & Planting",
    audience: ["QS", "Site", "Contracts"],
    format: "9-slide Visual Explainer",
    introduction: "報價寫一棵樹 $X，唔代表你比較緊同一樣嘢。",
    quickTakeaway: "一棵樹嘅成本唔只係植物本身。真正比較報價，需要睇 Supply、Delivery、Planting、Support、Maintenance 同 Replacement Responsibility。",
    publishedDate: "2026-09-24",
    status: "published",
    slides: treeSlides.map(([filename, label, alt]) => ({
      src: `/images/library/landscape/tree-price-scope/${filename}`,
      label,
      alt,
    })),
    related: [
      { type: "Breakdown", title: "點解同一款植物，三份報價可以差一倍？", status: "coming-soon" },
      { type: "Tool", title: "Tree Supply & Planting Scope Comparison Checklist", status: "coming-soon" },
      { type: "Pocket Guide", title: "Landscape Works｜收貨、種植與養護現場檢查", status: "coming-soon" },
      { type: "Case Study", title: "一棵樹由報價到種落地，中間發生咩事？", status: "coming-soon" },
    ],
    skoolDiscussionUrl: null,
    discussionQuestion: "你收到三份 Tree Quotation，第一樣會比較乜？",
    gateway: {
      eyebrow: "ENGINEERING PLAIN TALK",
      categoryLine: "LANDSCAPE × QS",
      formatLine: "9-SLIDE VISUAL EXPLAINER",
      ctaLabel: "READ FULL CAROUSEL →",
    },
  },
];

export const LIBRARY_CATEGORIES = Array.from(
  new Map(LIBRARY_ITEMS.map((item) => [item.categorySlug, {
    slug: item.categorySlug,
    name: item.category,
    label: item.categoryLabel,
  }])).values(),
);

export function getLibraryItemsByCategory(categorySlug: string) {
  return LIBRARY_ITEMS.filter((item) => item.categorySlug === categorySlug && item.status === "published");
}
