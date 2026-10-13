# 內觀與宇宙（原型）
- 改名：config.js 的 name（及 manifest.webmanifest）
- 內容：data/days.json（每日一偈）、data/map.json（知識地圖；youtube 欄位填影片網址）
- 本機測試：python3 -m http.server 然後開 http://localhost:8000
- 發布：整個資料夾丟到任何靜態主機（GitHub Pages / Netlify / Cloudflare Pages）
- 修改內容後請把 sw.js 的 C='nguy-v1' 改版號，手機才會更新快取
