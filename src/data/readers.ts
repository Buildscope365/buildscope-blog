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
  returnTitle: string;
  returnDescription: string;
  returnCtaLabel: string;
  skoolClassroomLessonUrl: string | null;
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

const towerCraneSlides = [
  ["01-tower-crane-priority-cover.webp", "Tower Crane 優先排序", "Tower Crane 一日得咁多鐘，邊個 Trade 優先？"],
  ["02-common-mistake.webp", "常見誤解", "唔應該只看邊個最嘈、最急，或者邊個 Sub-con 最大聲"],
  ["03-critical-path.webp", "Critical Path", "先看吊運會否直接影響下一個 critical activity"],
  ["04-downstream-trade-impact.webp", "後續 Trade 影響", "唔係 Critical Path 的吊運，也可能卡住後續多個 Trade"],
  ["05-lifting-window.webp", "吊運窗口", "大型物料、場地通道、工作平台及天氣都會限制吊運窗口"],
  ["06-crane-efficiency.webp", "Crane Efficiency", "集中處理相近位置和物料，減少等待與頻繁轉換"],
  ["07-safety-first.webp", "安全先決", "Programme 再急，都不能凌駕 Safe Lifting Plan"],
  ["08-24-hour-lifting-plan.webp", "24-Hour Lifting Plan", "按 Critical Path、後續 Trade、時間窗口、吊運時間及安全限制排次序"],
  ["09-priority-summary.webp", "總結", "管理 Tower Crane 要保護整個施工流程，不只是填滿吊運 Booking"],
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
    returnTitle: "返回 Engineering Plain Talk Library",
    returnDescription: "返到 QS-001 整理工作重點，再按主題逐層進入 Pocket Guide、Tool Library 同 Community 討論。",
    returnCtaLabel: "返回 QS-001｜Engineering Plain Talk Library →",
    skoolClassroomLessonUrl: "https://www.skool.com/buildscope-learning-lab-1916/classroom/6907ec30?md=d71720ffe48c4b80bac4fd1cec9796e7",
    skoolDiscussionUrl: "https://www.skool.com/buildscope-learning-lab-1916/breakdown?p=6b4b6eb7",
    // Optional secondary CTA for shared links. Keep null until the exact public Learning Lab URL is confirmed.
    skoolCommunityUrl: null,
  },
  {
    slug: "tower-crane-priority",
    title: "Tower Crane 一日得咁多鐘，邊個 Trade 優先？",
    series: "Engineering Plain Talk",
    categoryLine: "Site Management × Planning",
    introduction: "Concrete、Rebar、Formwork、BS 個個都話急；排吊運要睇整個施工流程。",
    quickTakeaway: "先確認安全及吊運限制，再看 Critical Path、Trade Interface、吊運窗口與 Crane Efficiency，排出可執行的 24-Hour Lifting Plan。",
    publishedDate: "2026-09-28",
    status: "published",
    slides: towerCraneSlides.map(([filename, label, alt]) => ({
      src: `/images/readers/tower-crane-priority/${filename}`,
      label,
      alt,
    })),
    discussionQuestion: "你地盤通常係點決定邊個 Trade 先用 Tower Crane？",
    returnTitle: "返回 Engineering Plain Talk Library",
    returnDescription: "返到 STR-001 整理工作重點，再按主題逐層進入 Pocket Guide、Tool Library 同 Community 討論。",
    returnCtaLabel: "返回 STR-001｜Engineering Plain Talk Library →",
    skoolClassroomLessonUrl: "https://www.skool.com/buildscope-learning-lab-1916/classroom/6907ec30?md=28c1b45a2b5d4a058a6a385996e62dc9",
    skoolDiscussionUrl: null,
    skoolCommunityUrl: null,
  },
];
