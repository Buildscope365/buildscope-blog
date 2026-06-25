# 工程白話文 BuildScope

以 Astro 7、Tailwind CSS 4、Markdown / MDX 及 Astro Content Collections 建立的香港工程知識平台。

## 本機開發

```bash
npm install
npm run dev
```

正式建置：

```bash
npm run build
npm run preview
```

## 新增文章

1. 複製 `src/content/blog/` 內任何 `.md` 檔案。
2. 改一個簡短英文檔名，例如 `extension-of-time-basics.md`。
3. 更新檔案頂部 `---` 之間的資料。
4. 在下方使用一般 Markdown 寫文章。
5. 執行 `npm run build`，Content Collection 會自動檢查欄位。

文章 frontmatter 範例：

```yaml
---
title: "文章標題"
description: "搜尋結果及分享預覽使用的簡介"
date: 2026-06-25
category: "contract-management"
tags: ["合約", "通知"]
coverImage: "/images/uploads/article-cover.jpg"
author: "BuildScope 編輯部"
difficulty: "入門"
featured: false
draft: false
readingTime: "6 分鐘"
heroAccent: "orange"
---
```

可用 `heroAccent`：`orange`、`red`、`blue`。

## 分類

分類定義集中在 `src/data/site.ts`。文章的 `category` 儲存分類 slug，必須與這裏的 slug 一致。

## 封面及 Open Graph 圖片

預設使用 `public/og-default.svg`。如文章有獨立封面：

1. 在 CMS 上傳圖片，檔案會存入 `public/images/uploads/`。
2. frontmatter 會自動加入 `coverImage: "/images/uploads/your-image.jpg"`。
3. 封面同時用於文章卡、文章頁及 Open Graph 分享圖片。

## Decap CMS

部署到 Netlify 並完成 Identity / Git Gateway 設定後，可在 `/admin/` 管理文章。

- CMS 入口：`public/admin/index.html`
- CMS 設定：`public/admin/config.yml`
- 文章目錄：`src/content/blog`
- 圖片上傳：`public/images/uploads`

### Netlify Identity / Git Gateway 設定

1. 把 repository 連接到 Netlify 並完成第一次部署。
2. 前往 **Project configuration → Identity**，選擇 **Enable Identity**。
3. Registration preferences 建議設為 **Invite only**。
4. 前往 **Project configuration → Identity → Services → Git Gateway**，選擇 **Enable Git Gateway**。
5. 在 Identity 頁面邀請需要管理文章的使用者。
6. 使用者接受邀請並設定密碼後，到 `https://你的網域/admin/` 登入。

> Netlify 已把 Git Gateway 標示為 deprecated。現有及已啟用的設定仍可運作，但 Netlify 不建議新專案長期依賴它，只會繼續修正重大安全問題。本專案按指定要求保留 `git-gateway` 設定；如 Netlify 帳戶不能新增 Git Gateway，建議改用 Decap CMS 的 GitHub backend 配合 OAuth。

`public/admin/config.yml` 預設使用 `main` branch。如 repository 的 production branch 不是 `main`，請更新：

```yaml
backend:
  name: git-gateway
  branch: 你的分支名稱
```

CMS 的新增、修改、刪除及圖片上傳都會建立 Git commit，Netlify 隨後會重新建置網站。

## Netlify

專案已包含 `netlify.toml` 和 Netlify Forms 所需欄位。

- Build command：`npm run build`
- Publish directory：`dist`
- 可在 Netlify 設定環境變數 `SITE_URL` 為正式網址。

上線前請同步更新：

- `astro.config.mjs` 的正式網址 fallback
- `public/robots.txt` 的 Sitemap 網址
- `src/data/site.ts` 的網址及聯絡電郵

## 內容聲明

現有文章、下載項目及電子書均為網站結構與設計示範內容，正式發布前應由合適的工程、合約或法律專業人士審閱。
