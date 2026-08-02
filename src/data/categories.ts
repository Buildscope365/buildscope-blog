export const BLOG_CATEGORIES: Record<string, string> = {
  "quantity-surveying": "QS 白話文",
  "contract-management": "合約管理",
  nec: "NEC",
  sop: "SOP Ordinance",
  "rfi-tq": "RFI / TQ",
  "eot-lad": "EOT / LAD",
  "vo-payment": "VO / Payment Claim",
  "site-management": "施工管理",
  "construction-technology": "工程技術",
  "ai-tools": "AI × 工程",
  "case-studies": "工程案例",
  "project-management": "工程管理",
  tender: "Tender",
};

export const categoryLabel = (value: string) => BLOG_CATEGORIES[value] ?? value;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("/", ".");
