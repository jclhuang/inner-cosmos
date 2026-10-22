# 內觀與宇宙（原型）
- 改名：config.js 的 name（及 manifest.webmanifest）
- 內容：data/days.json（每日一偈）、data/map.json（知識地圖；youtube 欄位填影片網址）
- 本機測試：python3 -m http.server 然後開 http://localhost:8000
- 發布：整個資料夾丟到任何靜態主機（GitHub Pages / Netlify / Cloudflare Pages）
- 修改內容後請把 sw.js 的 C='nguy-v1' 改版號，手機才會更新快取

## 自動匯入新影片
- `.github/workflows/update-videos.yml`：每天台北 03:00（19:00 UTC）執行，也可在 Actions 頁手動 Run。
- 頻道清單在 `data/channels.json`（目前只有恆易座標視界；小國大棋已獨立成 https://jclhuang.github.io/xiaoguo-daqi/ ）。
- `scripts/update_videos.py`：讀每個頻道的 RSS（各最新 15 支），合併進 data/videos.json（不刪舊的），每支影片有 `channel` 欄位。
  - 只收「已公開」影片：預約首播（尚未播出）、未公開或私人影片會被跳過，等公開後的下一次執行才加入。
  - 用 data/qa.json 關鍵字 + data/keywords.json 自動標籤。
  - 有變更才 bump sw.js 版本並 commit。
  - 整個頻道補齊（需 yt-dlp）：`python scripts/update_videos.py --backfill hengyi`
- 自動標籤不準時：直接改 data/videos.json 該影片的 qa/nodes，或 data/qa.json 的 videos 列表；增補 data/keywords.json 可改善之後的標籤。
- GitHub 會在 60 天沒有 repo 活動時停用排程；workflow 在 50 天無 commit 時會自動做一個 keepalive 空 commit。

## 如何新增文章

文章頁（📜 文章）會列出 `data/articles.json`，這個檔案由 `scripts/build_articles.py` 自動產生，不要手改。

**方法一：傳給助理** — 在聊天裡把檔案傳給我（Word、PDF、PowerPoint、Markdown 或 Google 簡報連結），我幫你放進去並發布。

**方法二：自己在 GitHub 網頁上傳（拖拉即可）**
1. 打開 https://github.com/jclhuang/inner-cosmos/upload/main/content/inbox
2. 把檔案拖進頁面（可一次多個）：`.docx`（Word）、`.pdf`、`.pptx`（PowerPoint）、`.md`、或內含 Google 簡報／文件連結的 `.txt`
3. 按綠色的「Commit changes」
4. 約 1–3 分鐘後，GitHub 會自動：Word 轉成文章、PowerPoint 轉 PDF（兩者都可下載）、PDF 產生第一頁縮圖、自動標到相關概念與問答，再更新網站。可在 https://github.com/jclhuang/inner-cosmos/actions 看進度。

**想自訂標題、摘要、標籤、相關影片？** 用 Markdown 檔開頭的 front-matter：
```
---
title: 文章標題
date: 2026-10-18
summary: 一兩句摘要
tags: [華嚴經, AI]
nodes: [kong, yuanqi]        # 知識地圖節點 id（可省略，會自動判斷）
qa: [parallel]               # 問答 id（可省略）
video: https://www.youtube.com/watch?v=XXXXXXXXXXX
file: 我的簡報.pdf            # 附上 content/files/ 裡的檔案（可省略）
link: https://docs.google.com/presentation/d/...   # Google 簡報/文件會內嵌顯示（可省略）
---
內文……
```
- 刪除文章：刪掉 `content/articles/` 裡的 .md（或 `content/files/` 裡的檔案）即可，索引會自動更新。範例文章是 `content/articles/sample-intro.md`。
- PDF 不會預先存進手機快取，打開過一次後才可離線看。
