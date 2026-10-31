// Editable source for the three teaching diagrams in the VO Instruction article.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const out = new URL("../public/images/blog/vo-instruction-payment-entitlement/", import.meta.url);
await mkdir(out, { recursive: true });
const navy = "#17324c", orange = "#d56b31", cream = "#f8f5ef", muted = "#61717e";
const base = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${cream}"/>${body}</svg>`;
const txt = (x, y, value, size=38, fill=navy, weight=600) => `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}">${value}</text>`;
const box = (x,y,w,h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff" stroke="#d8dedf" stroke-width="3"/>`;
const save = async (name, w, h, body) => sharp(Buffer.from(base(w,h,body))).png({ compressionLevel: 9, palette: true }).toFile(fileURLToPath(new URL(name,out)));

await save("vo-instruction-entitlement-map.png",1400,900,`
  ${txt(72,105,"FROM INSTRUCTION TO PAYMENT",55)}
  ${txt(72,158,"Five commercial checks • teaching diagram",28,muted,400)}
  ${[0,1,2,3,4].map((n)=>box(75+n*266,245,245,330)).join("")}
  ${["01","02","03","04","05"].map((v,n)=>txt(105+n*266,312,v,50,orange,700)).join("")}
  ${["AUTHORITY","SCOPE","ENTITLEMENT","VALUATION","PAYMENT"].map((v,n)=>txt(103+n*266,382,v,28,navy,700)).join("")}
  ${["Who instructed?","Original duty?","Contract basis?","Add or deduct?","Certified sum?"].map((v,n)=>txt(103+n*266,455,v,22,muted,400)).join("")}
  ${["Form and power","Drawings + spec","Notice + risk","Rates + records","Contract process"].map((v,n)=>txt(103+n*266,500,v,20,muted,400)).join("")}
  <path d="M90 665 H1310" stroke="${orange}" stroke-width="5"/>
  ${txt(75,735,"An instruction alone does not establish extra payment.",34,navy,600)}
  ${txt(75,790,"Check the signed contract, amendments and project facts.",26,muted,400)}
`);

await save("vo-instruction-scenario.png",1400,900,`
  ${txt(70,98,"ILLUSTRATIVE SCOPE CHANGE",54)}
  ${txt(70,150,"Hypothetical tile replacement • not a drawing or quotation",27,muted,400)}
  ${box(70,225,575,460)}${box(755,225,575,460)}
  ${txt(105,292,"ORIGINAL SCOPE",32,muted,700)}${txt(790,292,"REVISED SCOPE",32,orange,700)}
  ${Array.from({length:12},(_,n)=>{let x=120+(n%4)*120,y=340+Math.floor(n/4)*85;return `<rect x="${x}" y="${y}" width="112" height="78" fill="#d8d3ca" stroke="#fff" stroke-width="6"/>`;}).join("")}
  ${Array.from({length:6},(_,n)=>{let x=800+(n%2)*235,y=340+Math.floor(n/2)*85;return `<rect x="${x}" y="${y}" width="220" height="78" fill="#adaba5" stroke="#fff" stroke-width="6"/>`;}).join("")}
  ${txt(106,647,"600 × 600 mm porcelain tile",27,navy,600)}
  ${txt(790,647,"1200 × 600 mm natural stone",27,navy,600)}
  ${txt(75,770,"Assess added work AND omitted work under the contract.",34,navy,600)}
  ${txt(75,820,"Material value alone is not the variation valuation.",25,muted,400)}
`);

await save("vo-instruction-checklist.png",1200,1500,`
  ${txt(72,110,"VO INSTRUCTION",60)}${txt(72,180,"QS REVIEW CHECKLIST",60)}
  ${txt(72,240,"Practical review aid • follow your project contract",27,muted,400)}
  ${["Record the written instruction and issuer","Compare original drawings and scope","Identify addition, omission or original duty","Check entitlement and notice deadline","Keep measurements and contemporaneous records","Apply contract rates or justify new rates","Review programme and linked effects","Track entitlement, valuation and payment"].map((v,n)=>{
    const y=340+n*125;
    return `<rect x="74" y="${y-54}" width="1050" height="105" rx="14" fill="#fff" stroke="#d8dedf" stroke-width="2"/><rect x="105" y="${y-16}" width="30" height="30" rx="3" fill="none" stroke="${orange}" stroke-width="4"/>${txt(168,y+7,String(n+1).padStart(2,"0")+"  "+v,27,navy,600)}`;
  }).join("")}
  <path d="M74 1360 H1125" stroke="${orange}" stroke-width="5"/>
  ${txt(74,1412,"Instruction ≠ automatic payment",33,navy,700)}
  ${txt(74,1452,"Illustrative checklist; confirm the signed contract.",23,muted,400)}
`);
