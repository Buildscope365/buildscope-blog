# 工程白話文 BuildScope 網站

以 Astro 建立、準備部署至 Cloudflare Workers Static Assets 的繁體中文工程知識網站。

## 已完成頁面

- 首頁
- 工程 Blog（可篩選分類）
- 工程新聞
- 文件範本
- 電子書
- 工程白話字典（即時搜尋）
- AI 工程工具（EOT Timeline Assistant 流程示範）
- 關於我們
- 自訂 404 頁面

## 本機預覽

```bash
npm install
npm run dev
```

預設網址：`http://localhost:4321`

## 建置及 Cloudflare 部署

```bash
npm run build
npm run deploy
```

Cloudflare 設定已寫入 `wrangler.jsonc`，使用：

- Workers Static Assets
- `dist/` 靜態輸出
- 自訂 404 頁面
- 自動 trailing slash
- Observability
- `nodejs_compat`

首次部署前，需要在本機登入 Cloudflare：

```bash
npx wrangler login
```

## 收款功能的後續擴充

目前網站為第一階段前端版本，已預留電子書、範本及 AI 工具入口。正式收款階段建議加入：

- Stripe Checkout：電子書／範本單次付款及會員訂閱
- 會員登入及「我的購買」頁面
- Cloudflare D1：會員、訂閱、購買權限及 AI Credits
- Cloudflare R2：私人電子書及範本檔案
- Stripe Webhook：付款成功後自動開放權限

## 品牌設計

- 背景：純白 `#FFFFFF`
- 主色：工程橙 `#F97316`
- 文字：黑色 `#111111`
- 不使用深藍色
- 內置 Noto Sans TC，確保繁體中文跨裝置顯示
