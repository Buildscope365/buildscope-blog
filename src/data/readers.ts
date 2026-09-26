export type ReaderStatus = "published" | "draft";

export interface ReaderSlide {
  src: string;
  label: string;
  alt: string;
}

export interface ReaderItem {
  slug: string;
  title: string;
  series: string;
  categoryLine: string;
  introduction: string;
  quickTakeaway: string;
  publishedDate: string;
  status: ReaderStatus;
  slides: ReaderSlide[];
  discussionQuestion: string;
  skoolDiscussionUrl: string | null;
  skoolCommunityUrl: string | null;
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

export const READERS: ReaderItem[] = [
  {
    slug: "tree-price-scope",
    title: "一棵樹個價，到底包啲乜？",
    series: "Engineering Plain Talk",
    categoryLine: "Landscape × QS",
    introduction: "報價寫一棵樹 $X，唔代表你比較緊同一樣嘢。",
    quickTakeaway: "比較 Tree Quotation，要逐項核對 Supply、Delivery、Planting、Support、Maintenance 同 Replacement Responsibility。",
    publishedDate: "2026-09-24",
    status: "published",
    slides: treeSlides.map(([filename, label, alt]) => ({
      src: `/images/readers/tree-price-scope/${filename}`,
      label,
      alt,
    })),
    discussionQuestion: "你收到三份 Tree Quotation，第一樣會比較乜？",
    skoolDiscussionUrl: "https://www.skool.com/buildscope-learning-lab-1916/breakdown?p=6b4b6eb7",
    // Optional secondary CTA for shared links. Keep null until the exact public Learning Lab URL is confirmed.
    skoolCommunityUrl: null,
  },
];
