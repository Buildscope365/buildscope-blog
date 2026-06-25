export const SITE = {
  name: '工程白話文 BuildScope',
  shortName: 'BuildScope',
  description: '香港工程、QS、PM、合約 Claim、NEC、SOP、地盤管理及 AI 工具白話知識平台。',
  url: 'https://buildscope.hk',
  email: 'hello@buildscope.hk',
};

export const CATEGORIES = [
  { name: 'QS 白話文', slug: 'quantity-surveying', code: 'QS', description: '估價、糧款、VO、成本控制與商務實務。' },
  { name: '合約與 Claim', slug: 'contract-management', code: 'CLM', description: '通知、索償、記錄、權利與風險分配。' },
  { name: 'NEC 合約', slug: 'nec', code: 'NEC', description: 'Early Warning、Compensation Event 及協作機制。' },
  { name: 'SOP Ordinance', slug: 'sop', code: 'SOP', description: '香港建造業付款保障制度與實務重點。' },
  { name: 'RFI / TQ', slug: 'rfi-tq', code: 'RFI', description: '把技術疑問寫成清楚、可追蹤、可行動的文件。' },
  { name: 'EOT / LAD', slug: 'eot-lad', code: 'EOT', description: '工期延誤、記錄、時限與預定損害賠償。' },
  { name: 'VO / Payment Claim', slug: 'vo-payment', code: 'VO', description: '變更、估值、付款申索與證明文件。' },
  { name: '地盤管理', slug: 'site-management', code: 'SITE', description: '進度、安全、品質與現場溝通方法。' },
  { name: '工程技術', slug: 'construction-technology', code: 'TECH', description: '施工方法、圖則協調、品質及技術管理。' },
  { name: 'AI 工程工具', slug: 'ai-tools', code: 'AI', description: '用 AI 整理文件、資料與重複工程流程。' },
  { name: '工程案例', slug: 'case-studies', code: 'CASE', description: '由真實場景拆解決定、風險與可複製做法。' },
  { name: '工程管理', slug: 'project-management', code: 'PM', description: '由計劃、協調到交付，把項目管理落到地。' },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug) ?? {
    name: slug,
    slug,
    code: slug.toUpperCase(),
    description: '',
  };
}
