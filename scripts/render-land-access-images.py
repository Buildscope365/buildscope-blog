"""Rebuild the four editorial images using a full CJK font passed as argv[1]."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys

font_path = sys.argv[1]
out = Path('public/images/blog/government-land-release-site-possession-date')
out.mkdir(parents=True, exist_ok=True)
navy, muted, yellow, bg, white = '#142e40', '#526977', '#e8bd46', '#f6f5ef', '#ffffff'

def f(size): return ImageFont.truetype(font_path, size)
def text(d, xy, s, size=28, fill=navy, spacing=12):
    d.multiline_text(xy, s, font=f(size), fill=fill, spacing=spacing)
def base(w,h,label):
    im=Image.new('RGB',(w,h),bg); d=ImageDraw.Draw(im)
    text(d,(76,58),label,19,muted)
    d.line((76,h-90,w-76,h-90),fill='#b5c2c4',width=2)
    text(d,(76,h-73),'BUILDSCOPE  /  工程白話文  ·  教學示意',18,muted)
    return im,d
def box(d, rect, fill=white,outline='#bdc9c9'):
    d.rectangle(rect,fill=fill,outline=outline,width=2)

im,d=base(1400,790,'CONTRACTS & COMMERCIAL  /  SITE ACCESS')
d.rectangle((78,164,168,173),fill=yellow)
text(d,(76,208),'政府話 2027 年\n工程展開',76)
text(d,(80,440),'承建商幾時可以進場？\n先看合約與分區 Access Date。',31,spacing=18)
box(d,(837,176,1310,581),'#e7eeea')
text(d,(865,199),'SITE ACCESS  /  示意',23)
box(d,(866,281,1060,486),'#d4e4db');text(d,(895,323),'A 區\n進場安排',29)
box(d,(1080,262,1280,527),'#f5e5b5');text(d,(1103,323),'B 區\n界面待查',29)
d.line((1070,259,1070,535),fill=muted,width=4)
text(d,(80,657),'政府公告的預計開工時間 ≠ 承建商的合同進場日期',26)
im.save(out/'hero.webp',quality=87,method=6)

im,d=base(1400,900,'01 / KEY LOGIC  ·  NEC4 ECC 標準機制')
text(d,(76,115),'由公告去到 CE 判斷，要經過幾道門',54)
steps=[('01  政府公告','預計工程展開\n不是進場承諾'),('02  合同核對','分區 Access Date\nScope／修訂條款'),('03  進度核對','Accepted Programme\n顯示的進場日期')]
for i,(head,body) in enumerate(steps):
    x=76+i*424; box(d,(x,250,x+383,454));text(d,(x+23,276),head,29);text(d,(x+23,342),body,23,muted)
    if i<2:text(d,(x+388,326),'→',34,'#a77c21')
d.rectangle((76,494,1324,642),fill=navy)
text(d,(104,516),'60.1(2) 判斷日期',23,'#f4d477')
text(d,(104,556),'Access Date 與 Accepted Programme 日期 → 較後者',31,white)
for i,(a,b) in enumerate([('事件','是否構成 CE？'),('時間','有否影響完工？'),('費用','按規則與證據評估')]):
    x=76+i*424;box(d,(x,678,x+383,784),'#e6ece9');text(d,(x+18,693),a,25);text(d,(x+18,738),b,20,muted)
im.quantize(colors=32,dither=Image.Dither.NONE).save(out/'logic.png',optimize=True)

im,d=base(1400,900,'02 / SCENARIO  ·  純屬假設案例')
text(d,(76,119),'同一合約，兩個工作面',58)
for x,tag,head,body,col in [(76,'A 區','可以施工','承建商可按安排\n推進相關活動。','#d7e7dd'),(716,'B 區','進場受阻','第三方工作／場地限制\n仍待核實。','#f5e5b5')]:
    box(d,(x,247,x+607,620));box(d,(x+27,275,x+185,328),col);text(d,(x+45,283),tag,24);text(d,(x+30,360),head,42);text(d,(x+30,449),body,27,muted)
box(d,(76,656,1323,788),'#e9efed');text(d,(106,674),'應分開回答',28);text(d,(106,720),'① 日期與分區　② 界面責任　③ 關鍵路徑　④ 費用因果',25)
im.quantize(colors=32,dither=Image.Dither.NONE).save(out/'scenario.png',optimize=True)

im,d=base(1200,1500,'03 / PRACTICAL GUIDE  ·  QS / PM / PLANNER')
text(d,(76,118),'進場受阻：\n先做五件事',66,spacing=15)
text(d,(77,327),'保留當期紀錄，同步管理工程、程序與商務影響。',27,muted)
items=[('01','查合同基線','分區 Access Dates、Scope、施工要求、修訂條款。'),('02','記錄實際限制','哪個工作面、何時、誰限制進場？保存照片及通訊。'),('03','保存當期 programme','Accepted Programme 版本、活動、關鍵路徑及替代工作。'),('04','時間與費用分開','分析完工影響；另列具因果關係的資源與成本。'),('05','跟合約程序通知','核對早期預警、CE 通知、報價及回覆要求。')]
for i,(n,head,body) in enumerate(items):
    y=420+i*185;box(d,(76,y,1124,y+158));d.rectangle((76,y,84,y+158),fill=yellow)
    text(d,(102,y+18),n,29,'#a47b20');text(d,(178,y+16),head,32);text(d,(178,y+78),body,22,muted)
d.rectangle((76,1360,1124,1403),fill=navy);text(d,(96,1365),'權利、時限及評估方法須以實際合同為準。',22,white)
im.quantize(colors=32,dither=Image.Dither.NONE).save(out/'checklist.png',optimize=True)
