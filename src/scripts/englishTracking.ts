import {trackConversionEvent} from './conversionTracking';
export function initializeEnglishTracking(){
  if(typeof window==='undefined'||!location.pathname.startsWith('/en/'))return;
  const path=location.pathname;
  const pageType=path.startsWith('/en/pocket-library/')?'pocket_library':path.startsWith('/en/ebooks/')?'ebook':path.startsWith('/en/insights/')?'insight':path.startsWith('/en/resources/')?'resource':'english_page';
  trackConversionEvent('english_page_view',{site_edition:'english',content_category:pageType});
  if(pageType==='pocket_library')trackConversionEvent('english_pocket_library_view',{site_edition:'english'});
  if(document.querySelector('[data-en-gumroad]'))trackConversionEvent('english_product_view',{site_edition:'english',content_id:document.querySelector<HTMLElement>('[data-en-gumroad]')?.dataset.enGumroad});
  document.addEventListener('click',event=>{const target=event.target;if(!(target instanceof Element))return;const gumroad=target.closest<HTMLElement>('[data-en-gumroad]');if(gumroad)trackConversionEvent('english_gumroad_click',{site_edition:'english',content_id:gumroad.dataset.enGumroad,destination_url:(gumroad as HTMLAnchorElement).href});const download=target.closest<HTMLElement>('[data-en-download]');if(download)trackConversionEvent('english_resource_download',{site_edition:'english',content_id:download.dataset.enDownload});});
}
