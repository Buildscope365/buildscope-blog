# Article 02｜來源、圖片及發佈 QA

核實日：2026-11-01（香港時間）。分支：`content/subcontractor-cost-overrun-article-02`。PR 供審閱，未獲合併／部署授權。

## 來源及主張登記

| 分類 | 主張及適用限制 | 第一手來源 | 狀態 |
| --- | --- | --- | --- |
| 法律 | Cap. 652 於 2025-08-28 全面生效；一般適用於當日或之後訂立的合約，按公共／私人、工程類別與門檻判斷 | [DEVB 2026-06-24](https://www.devb.gov.hk/en/legco_matters/replies_to_legco_questions/index_id_15528.html)、[CIC 簡易指南](https://www.cic.hk/content/dam/sopl/docs/sopl-brochure-en.pdf) | Verified；個案仍須核範圍 |
| 法律 | 公共主合約 500 萬門檻；私人主合約工程 500 萬、相關貨物／服務 50 萬；受規管主合約同鏈分判無最低分判額；部分現有私人樓宇工程排除 | [CIC 簡易指南 p.2–3](https://www.cic.hk/content/dam/sopl/docs/sopl-brochure-en.pdf)、[Cap. 652](https://www.elegislation.gov.hk/hk/cap652) | Verified；正文只用必要數字 |
| 法律 | Payment Response 書面、列擬付額／差額／計算；期限不遲於付款期限或申索後 30 日等較早日期；未回應不等於承認，但限制審裁 set-off | [CIC 簡易指南 p.4–5](https://www.cic.hk/content/dam/sopl/docs/sopl-brochure-en.pdf)、[Cap. 652 ss.19–21](https://www.elegislation.gov.hk/hk/cap652) | Verified／qualified：按送達及合約較早日期核算 |
| 法律 | 付款爭議與額外付款申索程序、28 日審裁期限 | [DEVB 審裁管轄指引 §6](https://www.devb.gov.hk/filemanager/en/content_2436/DEVB_model_practice_note_jurisdiction.pdf)、[DEVB 2026-06-24](https://www.devb.gov.hk/en/legco_matters/replies_to_legco_questions/index_id_15528.html) | Verified／qualified；個案計算需核實 |
| 法律 | 停工／減慢進度權只在法定條件及通知程序下行使，不因成本超支自動產生 | [CIC 簡易指南 p.7](https://www.cic.hk/content/dam/sopl/docs/sopl-brochure-en.pdf)、[Cap. 652 Part 4](https://www.elegislation.gov.hk/hk/cap652) | Verified／qualified |
| 合約 | 加價、扣款、接管、直接付款、終止、補救期、背對背回收均須逐份合約及事實判斷 | 個別分判合約未提供 | Qualified；正文不主張任何特定條款權利 |
| 作者建議 | 三軌付款／加價／履約評估，Recovery Plan、Cost to Complete、決策紀錄 | BuildScope 商務分析 | 明示為建議，非法律義務 |
| 假設 | 原價 10.0、已付 6.0、尚餘 4.0、現有完工 5.5、替換報價 5.2；單位 HK$ 百萬 | 教學假設 | 4.0 = 10.0 − 6.0；1.5 = 5.5 − 4.0；1.2 = 5.2 − 4.0；未計交接等 |

## 原稿與網站架構

未找到可讀的既有 Article 02 文字草稿或 SEO package；現有圖檔來自既有 visual pack。本文重新撰寫及核實。網站採 `src/content/blog/*.md` + `/blog/[id]/`；原建議 `/articles/.../` 未在既有架構存在。Canonical 與 JSON-LD 由既有 blog 模板產生。`date` 為預定發佈日 2026-11-01；`updatedDate` 不設，直至發佈後確有實質更新。

## 圖像 QA

| 檔案 | 像素 | 位置 | 來源及圖說摘要 | QA |
| --- | --- | --- | --- | --- |
| `subcontractor-distress-hero.webp` | 1400×790 | H1 後 | 棚架抽象示意；不代表真實地盤 | GO |
| `subcontractor-distress-decision-tree.png` | 1400×900 | 四項問題後 | BuildScope 一般商務分支，未暗示自動權利 | GO |
| `subcontractor-distress-scenario.png` | 1400×900 | 假設案例後 | HK$ 百萬元；4.0／5.5／5.2 同日同範圍餘下口徑；正文列未計項 | GO，需連同圖說使用 |
| `subcontractor-distress-checklist.png` | 1200×1500 | 實務步驟後 | 八項作者檢查建議；「SOP」須先核適用性 | GO |

Alt text 和完整 caption 置於文章 frontmatter／figure。四圖分開輸出，無第三方照片、客戶或保密資料。圖中文字、繁體、箭嘴、數字已於原尺寸視檢；手機縮圖細字依靠正文等效步驟，圖片可放大，關鍵資訊不只藏在圖中。PNG 文字線條保留無損，Hero WebP。

## Editorial gate

法律／合約義務、一般實務、作者建議及假設金額已區分；沒有虛構分判條款、真實項目或特定課程連結。SEO、圖說、來源及免責聲明齊備。最終 GO 須以 CI 與桌面／手機預覽結果、人工編輯審批為準；PR 不等於出版授權。

2026-11-01 PR #25 初次 CI：20/20 單元測試、Astro build、31 個 Reader／289 張圖順序及桌面 1440×900／手機 390×844 browser QA 均通過。已人工檢視兩種尺寸的全頁截圖：四圖載入，正文及圖說清晰；圖內細節在手機較細，以正文等效解釋。全頁截圖的固定導覽列曾出現在頁面中段，為測試在滾動後拍攝所致，已調整截圖前回頂並暫時解除固定定位；待更新 CI 再驗證圖像檔。
