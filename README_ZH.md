# LINE 電子名片模板

這是一個可部署到 Vercel 的 LINE 電子名片網站模板，適合拿來放個人介紹、品牌定位與聯絡方式。網站採用 Next.js 製作，可在手機瀏覽器與 LINE 內開啟，並支援 LIFF 分享或複製網址分享。

## 這個專案是做什麼的

- 提供一頁式手機優先電子名片網站
- 顯示照片、品牌英文、主標題、名字、自我介紹、服務重點
- 提供 LINE、Wechat、Facebook、Phone 四種聯絡按鈕
- 提供「分享給 LINE 好友 / 群組」與「複製名片連結」功能
- 若已設定 LIFF ID 且在 LINE 內開啟，會優先使用 LIFF 分享

## 如何本機啟動

1. 先安裝 Node.js 20 以上版本
2. 打開終端機，進入專案資料夾
3. 執行：

```bash
npm install
npm run dev
```

4. 瀏覽器打開 `http://localhost:3000`

## 如何更換照片

1. 把你的照片放到 `public/` 資料夾
2. 建議檔名簡單，例如：`public/profile.jpg`
3. 打開 [src/data/card.ts](/home/yanshan/code/line-card-studio/src/data/card.ts)
4. 把 `photoSrc` 改成：

```ts
photoSrc: "/profile.jpg",
```

## 如何更換文字與按鈕連結

所有主要文字與按鈕連結，都集中在 [src/data/card.ts](/home/yanshan/code/line-card-studio/src/data/card.ts)。

你可以修改：

- `brandEn`：品牌英文
- `heroTitle`：首頁主標題
- `displayName`：顯示名稱
- `intro`：自我介紹
- `bullets`：條列內容
- `links.lineUrl`：LINE 連結
- `links.wechatUrl`：Wechat 連結
- `links.facebookUrl`：Facebook 連結
- `links.phone`：電話

## 如何設定環境變數

1. 把 `.env.example` 複製成 `.env.local`
2. 打開 `.env.local`
3. 填入你的資料：

```bash
NEXT_PUBLIC_LIFF_ID=你的_LIFF_ID
NEXT_PUBLIC_SITE_URL=https://你的正式網址
```

說明：

- `NEXT_PUBLIC_LIFF_ID`：給 LINE 分享功能使用
- `NEXT_PUBLIC_SITE_URL`：給分享連結與 Open Graph 使用

如果 `NEXT_PUBLIC_LIFF_ID` 先不填，也沒關係，網站仍可正常使用，分享按鈕會自動退回複製網址。

## 如何部署到 Vercel

1. 先把專案放到 GitHub
2. 到 [Vercel](https://vercel.com/) 登入
3. 點擊 `Add New Project`
4. 選擇你的 GitHub repo
5. 保持預設設定直接部署
6. 到 Vercel 專案設定的 `Environment Variables`
7. 補上：
   `NEXT_PUBLIC_LIFF_ID`
   `NEXT_PUBLIC_SITE_URL`
8. 重新部署一次

## 如何建立 GitHub repo 並 push

如果你還沒有 GitHub repo，可以照下面做：

```bash
git init
git add .
git commit -m "first commit"
```

接著到 GitHub 網站建立一個新的空 repo，建立完成後 GitHub 會提供指令。一般會像這樣：

```bash
git remote add origin 你的-github-repo-url
git branch -M main
git push -u origin main
```

## 如何到 LINE Developers 建立 LIFF

1. 到 [LINE Developers](https://developers.line.biz/) 登入
2. 建立一個 Provider
3. 在 Provider 下建立 `LINE Login` Channel
4. 進入該 Channel 後台
5. 找到 `LIFF` 頁面
6. 建立新的 LIFF App
7. Endpoint URL 請填你的網站正式網址，例如：

```text
https://你的網域.vercel.app
```

8. 建立完成後，系統會給你一組 LIFF ID

## 如何把 LIFF ID 填回專案

1. 打開 `.env.local`
2. 填入：

```bash
NEXT_PUBLIC_LIFF_ID=剛剛取得的_LIFF_ID
```

3. 如果已部署到 Vercel，也要到 Vercel 的環境變數頁面填同一組值
4. 重新部署

## 正式上線前檢查清單

- `src/data/card.ts` 內的名字、介紹、按鈕連結都已改成正式資料
- `public/` 內的照片已換成正式照片
- `.env.local` 或 Vercel 環境變數已填入 `NEXT_PUBLIC_SITE_URL`
- 如果要用 LINE 內分享，已填入 `NEXT_PUBLIC_LIFF_ID`
- LINE、Wechat、Facebook、Phone 按鈕都有實際可用連結
- 手機實機已測試可正常開啟
- 在 LINE 內開啟時，分享功能已測試
- 已執行 `npm run lint`
- 已執行 `npm run build`
