import {getCollection} from 'astro:content';
export async function publishedProducts(kind?:'pocket-guide'|'ebook'){return (await getCollection('englishProducts',({data})=>data.status==='published'&&(!kind||data.kind===kind))).sort((a,b)=>Number(b.data.featured)-Number(a.data.featured)||(a.data.publicationDate?.getTime()??0)-(b.data.publicationDate?.getTime()??0)||a.data.title.localeCompare(b.data.title));}
export async function publishedInsights(){return (await getCollection('englishInsights',({data})=>!data.draft)).sort((a,b)=>b.data.date.getTime()-a.data.date.getTime());}
export async function publishedResources(){return (await getCollection('englishResources',({data})=>!data.draft)).sort((a,b)=>b.data.date.getTime()-a.data.date.getTime());}
export const englishSite='https://buildscope-blog.com';
export function crumbs(items:{name:string;path:string}[]){return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:new URL(item.path,englishSite).toString()}))};}
