# AGENTS.md

這是一個給非工程師使用的 LINE 電子名片模板，目標是穩定、好改、可直接部署。

## 修改原則

- 修改時請保守穩定，不要做無謂重構
- 優先維持目前檔案結構與資料來源位置
- 若只是改名字、文字、按鈕連結，優先修改 [src/data/card.ts](/home/yanshan/code/line-card-studio/src/data/card.ts)
- 若要串接或調整 LINE 分享，優先查看 [src/lib/liff.ts](/home/yanshan/code/line-card-studio/src/lib/liff.ts) 與 [README_ZH.md](/home/yanshan/code/line-card-studio/README_ZH.md)

## 驗收要求

- 每次修改完成後必跑 `npm run lint`
- 每次修改完成後必跑 `npm run build`
- 如果失敗，先自行修復再交付

## 不建議的動作

- 不要隨意改掉資料檔命名與路徑
- 不要把資料重新寫死回 `page.tsx`
- 不要在沒有必要時加入資料庫、登入系統或複雜狀態管理
