export interface ArticleSeoData {
  title: string;
  description: string;
  date: Date;
  updatedDate?: Date;
  author: string;
  authorType: "Person" | "Organization";
  coverImage?: string;
  sources: { name: string; url: string }[];
}

export function buildArticleJsonLd(data: ArticleSeoData, canonical: string, site: string) {
  if (data.updatedDate && data.updatedDate < data.date) throw new RangeError("內容更新日期不可早於發布日期。");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    inLanguage: "zh-Hant-HK",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    datePublished: data.date.toISOString(),
    ...(data.updatedDate ? { dateModified: data.updatedDate.toISOString() } : {}),
    author: { "@type": data.authorType, name: data.author },
    publisher: { "@type": "Organization", name: "工程白話文 BuildScope", url: site },
    ...(data.coverImage ? { image: new URL(data.coverImage, site).toString() } : {}),
    ...(data.sources.length ? { citation: data.sources.map((source) => ({ "@type": "CreativeWork", name: source.name, url: source.url })) } : {}),
  };
}
