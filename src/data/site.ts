export const SITE = {
  name: '工程白話文 BuildScope',
  shortName: 'BuildScope',
  description: '香港工程、QS、PM、合約、NEC、SOP 及地盤管理白話知識平台。',
  url: 'https://buildscope.hk',
  email: 'hello@buildscope.hk',
};

export const CATEGORIES = [
  { name: '工程管理', slug: 'project-management', code: 'PM', description: '由計劃、協調到交付，把項目管理落到地。' },
  { name: '工料測量', slug: 'quantity-surveying', code: 'QS', description: '估價、糧款、變更及成本控制實務。' },
  { name: '合約管理', slug: 'contract-management', code: 'CON', description: '合約條文、通知、索償與風險分配。' },
  { name: 'NEC 合約', slug: 'nec', code: 'NEC', description: 'Early Warning、Compensation Event 及協作機制。' },
  { name: '付款保障', slug: 'sop', code: 'SOP', description: '香港建造業付款流程與實務重點。' },
  { name: '地盤管理', slug: 'site-management', code: 'SITE', description: '進度、安全、品質與現場溝通方法。' },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug) ?? {
    name: slug,
    slug,
    code: slug.toUpperCase(),
    description: '',
  };
}
