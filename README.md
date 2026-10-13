# 內觀與宇宙（原型）
- 改名：config.js 的 name（及 manifest.webmanifest）
- 內容：data/days.json（每日一偈）、data/map.json（知識地圖；youtube 欄位填影片網址）
- 本機測試：python3 -m http.server 然後開 http://localhost:8000
- 發布：整個資料夾丟到任何靜態主機（GitHub Pages / Netlify / Cloudflare Pages）
- 修改內容後請把 sw.js 的 C='nguy-v1' 改版號，手機才會更新快取

## 自動匯入新影片
- `.github/workflows/update-videos.yml`：每天台北 03:00（19:00 UTC）執行，也可在 Actions 頁手動 Run。
- `scripts/update_videos.py`：讀頻道 RSS（最新 15 支），合併進 data/videos.json（不刪舊的），用 data/qa.json 關鍵字 + data/keywords.json 自動標籤，有變更才 bump sw.js 版本並 commit。
- 自動標籤不準時：直接改 data/videos.json 該影片的 qa/nodes，或 data/qa.json 的 videos 列表；增補 data/keywords.json 可改善之後的標籤。
- GitHub 會在 60 天沒有 repo 活動時停用排程；workflow 在 50 天無 commit 時會自動做一個 keepalive 空 commit。
