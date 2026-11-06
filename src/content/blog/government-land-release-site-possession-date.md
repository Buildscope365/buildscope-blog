---
title: "政府話 2027 年交地，Contractor 可唔可以當係 Site Possession Date？"
seoTitle: "2027 年工程開展等於交地？NEC4 Access Date 與 Site Possession"
description: "政府預告 2027 年工程開展，能否直接寫入承建商進場日期？拆解 NEC4 ECC Access Date、Accepted Programme、60.1(2)、CE 與工期費用評估。"
date: 2026-11-07
category: "contract-management"
tags: ["NEC4", "Access Date", "Site Possession", "Accepted Programme", "CE", "EOT", "Programme"]
coverImage: "/images/blog/government-land-release-site-possession-date/hero.webp"
coverAlt: "生成工地情境圖：圍欄、工程進度圖和安全帽；並非元朗南工程實景或核實施工圖。"
coverCaption: "政府工程時間表與個別合約的進場安排，須分開核對。生成情境圖並非項目現場。"
coverWidth: 1400
coverHeight: 790
author: "BuildScope 編輯部"
authorType: "Organization"
difficulty: "中階"
readingTime: "8 分鐘"
featured: false
draft: false
lastReviewedDate: 2026-11-07
sources:
  - name: "土木工程拓展署：元朗南第二期合約六框架合約招標公告，2026-09-25"
    url: "https://www.info.gov.hk/gia/general/202609/25/P2026092500218.htm"
  - name: "土木工程拓展署：框架合約招標公告（施工要求安排）"
    url: "https://www.cedd.gov.hk/tc/tender-notices/contracts/tender-notices/index-id-2440.html"
  - name: "NEC Contracts：NEC4 ECC clauses 33.1、60.1(2) 官方解說"
    url: "https://www.neccontract.com/news/do-what-nec4-ecc-says-or-face-the-%E2%80%98enforcement-clauses%E2%80%99"
  - name: "NEC Contracts：Deciding the access date"
    url: "https://www.neccontract.com/support/faqs/deciding-the-access-date"
  - name: "NEC Contracts：Using the correct programme（NEC4 ECC）"
    url: "https://www.neccontract.com/support/faqs/using-the-correct-programme"
relatedReaders: ["programme-contractual-status", "delay-before-site"]
relatedArticles: ["vo-instruction-payment-entitlement"]
---

## 30 秒工程白話文

**唔可以。** 以土拓署 2026 年 9 月的元朗南第二期框架合約公告為例，原文係首批按「施工要求」推展的工程**預計於 2027 年第一季展開**，並無說承建商於某一日取得整個工地的合約進場權。招標新聞是項目層面的預期；承建商何時可進入、使用哪一部分地盤，要看已簽合約、Contract Data、Scope、施工要求和適用的 Accepted Programme。未有具體合約，不能判定某一項延誤有沒有賠償、工期延長或額外費用。

## 政府公告其實講咗甚麼？

土拓署在 **2026 年 9 月 25 日**公布元朗南新發展區第二期合約六（F1–F4）招標。公告指政府會選四名框架承建商，按實際需要以「施工要求」委派工程；首批工程**預計在 2027 年第一季展開**。土拓署的招標頁亦以「部分首批施工要求的工程」描述該預期。這不是已訂明的工地交付日期，更不能由「2027 年」推算每個工作面同日可用。

新聞用語「交地」亦可能指政府收回土地、向部門移交、批地予發展商，或向某工程承建商提供使用權。這幾件事的法律關係不同。編 programme 或 tender assumption 時，先找出該句話所屬文件、受益人、地段與工作範圍。

<figure><img src="/images/blog/government-land-release-site-possession-date/logic.png" alt="判斷圖：政府公告的預計工程開展時間，須先核對合約、分區 Access Date、Accepted Programme 日期，再判斷是否未按期提供進場，最後分別評估時間和費用。" width="1400" height="900" loading="lazy" decoding="async" /><figcaption>NEC4 ECC 一般邏輯：60.1(2) 比較相關分區的 Access Date 與 Accepted Programme 顯示的日期，以較後者作判斷；須核對適用修訂及具體事實。</figcaption></figure>

## 四個日期，唔可以互換

| 日期 | 一般意思 | 常見錯誤 |
| --- | --- | --- |
| Starting Date | 合約開始運作的日期；不代表所有工作面可進場 | 當成全場移交 |
| Access Date | Contract Data 指定某部分 Site 可獲准進入和使用的日期 | 只寫一個日期，忽略分區 |
| Planned Completion | 承建商在 programme 預計達成 Completion 的日期；受實際工程排序影響 | 以為它一變，合約完工日自動變 |
| Completion Date | 合約指定並按合約機制調整的履約日期 | 由接受 programme 直接改寫 |

NEC 官方解說指出，Starting Date 一般不應遲於 Access Date；提供進場的責任見 ECC 33.1。Accepted Programme 要顯示各項活動、其他人工作與進場安排。即使承建商的 Planned Completion 因阻礙而後移，**Completion Date 仍只按適用合約機制調整**。遇到分段移交，逐個 part of the Site 查，不能以一個「Site Possession Date」掩蓋分區差異。

## NEC4 ECC 60.1(2)：點樣判斷 CE？

在**未經項目修訂的 NEC4 ECC 標準機制**下，若 Client 未能讓 Contractor 在相關部分 Site **Access Date 與 Accepted Programme 顯示的進場日期兩者較後之日**進入和使用，可能構成 Compensation Event（CE）。例如 Contract Data 訂明 A 區於某日可用，但已接受的 programme 合理地將該區工作安排得更後，不能單看較早的 Contract Data 日期就推斷已發生 60.1(2) 事件。先查該 programme 在相關時點是否 Accepted、顯示哪個工作面及日期。

CE 是**事件分類及評估機制**，不等於自動獲得一段工期延長（EOT）或某筆額外款項。時間方面，需評估該事件對 Planned Completion、Completion Date 或 Key Date 的實際影響；費用方面，需按適用的 Prices／Defined Cost 評估規則、風險及證據處理。通知、報價、減損、早期預警及評估日期亦要按合約辦理。單有閒置相片或一張新聞截圖，並不足以證明全部時間及金額。

**香港工程必須再看合約層級。** 先核對 NEC standard 版本，再查香港版本或修訂、Additional Conditions of Contract（ACC）、Z clauses、Contract Data、Scope 與項目專用條款。本文未取得元朗南 F1–F4 的完整適用合約及施工要求，**不宣稱該框架合約必然以未經修訂的 60.1(2) 處理任何一宗延誤**。

## 假設案例：分區進場與界面延誤

**以下純屬教學假設，不是元朗南工程資料。** 某 NEC4 ECC 工程有 A、B 兩區。A 區可用，B 區原定較後才供承建商進場；B 區尚有第三方遷線和污染土地處理。承建商在 A 區施工，同時準備 B 區。到 B 區需使用之日仍不能進場，團隊應先確認 B 區在 Contract Data 和相關 Accepted Programme 的日期、當時進場的實際限制，以及遷線和除污究竟由誰負責。

如阻礙只令非關鍵活動多了浮動時間，未必延後 Planned Completion；若 B 區工作牽連後續基礎、道路及測試的關鍵路徑，則應用 contemporaneous programme 展示「原本怎樣做、實際怎樣受阻、已採取甚麼替代施工及剩餘影響」。界面原因可能牽涉 60.1(2)、其他 CE 條款，亦可能由承建商承擔；不能把任何第三方 delay 一律貼上「交地 CE」。

<figure><img src="/images/blog/government-land-release-site-possession-date/scenario.png" alt="教學假設比較：A 區可施工、B 區未能進場；須按 B 區合約和已接受進度表日期、界面責任及關鍵路徑，分開判斷 CE、工期及費用。" width="1400" height="900" loading="lazy" decoding="async" /><figcaption>假設分區場景；圖內沒有真實日期、索償天數或價款。A 區可用不代表 B 區已可進場，B 區受阻亦不等於自動延長 Completion Date。</figcaption></figure>

## QS／PM／Planner 要留下甚麼證據？

1. **合約基線：** Contract Data 的分區 Access Dates、Scope 界面、施工要求、修訂及當時有效的 Accepted Programme 版本。
2. **當日現況：** 進場申請、拒絕或限制通知、照片（有地點和時間）、現場日誌、第三方工作及相關會議紀錄。
3. **進度因果：** 受影響活動、前置關係、當期更新、critical path、可用其他工作面和可行緩解措施；保存原版與修訂版。
4. **費用分隔：** 只記錄與事件有因果關係的勞工、機械、分判及改序費用，標明原計劃、實際投入和其他同時事件。
5. **合約程序：** 查核誰須通知、何時通知、早期預警、報價與回覆時限；沿用合約指定通訊渠道，不用口頭共識取代正式程序。

<figure><img src="/images/blog/government-land-release-site-possession-date/checklist.png" alt="七項 QS／PM 進場及延誤證據清單：查合同、界面、現場、Programme、通知、責任及減損。" width="1200" height="1500" loading="lazy" decoding="async" /><figcaption>BuildScope 七項工作核對；正文把資料歸納成五個執行步驟。屬一般實務建議，正式通知與權利須按個別合約及事實核定。</figcaption></figure>

## 三個 Takeaways

1. 政府說「2027 年第一季預計開工」，是政策／招標進度資訊，不是各區合同 Access Date。
2. 未修訂 NEC4 ECC 60.1(2) 看相關區域的 Contract Data Access Date 與 Accepted Programme 日期中的**較後者**；香港及項目修訂要逐層核對。
3. CE、完工日期調整與額外費用是三個須分別證明及評估的問題。界面責任、當期 programme 與現場紀錄決定分析質量。

**資料核實截至 2026 年 11 月 7 日。** 本文只作一般工程及合約知識分享；實際權利及責任須按有關合約條款、修訂、事實及適用法例判斷。延伸閱讀：[Programme 合約地位圖解](/read/programme-contractual-status/)、[開工前延誤圖解](/read/delay-before-site/)與[Instruction、VO、付款資格](/blog/vo-instruction-payment-entitlement/)。BuildScope Learning Lab 為付費社群；本題專屬課程連結**待提供**。
