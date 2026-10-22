#!/usr/bin/env python3
"""每日匯入 data/channels.json 列出的頻道新影片：
讀 RSS → 只收「已公開」影片（排除尚未首播/未公開）→ 合併 data/videos.json（永不刪除）
→ 依關鍵字標到問答與地圖 → 有變更才升級 sw.js 快取版本。
用法：python scripts/update_videos.py            # 正常執行
      python scripts/update_videos.py --backfill <channelKey>   # 用 yt-dlp 補齊整個頻道（需安裝 yt-dlp）"""
import json, re, sys, time, os, subprocess, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda f: os.path.join(ROOT, f)
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015", "m": "http://search.yahoo.com/mrss/"}
UA = {"User-Agent": "Mozilla/5.0", "Accept-Language": "en"}

def load(f): return json.load(open(P(f), encoding="utf-8"))
def save(f, d): open(P(f), "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False, indent=1) + "\n")
def get(url, tries=5, wait=3):
    for i in range(tries):  # YouTube RSS 偶爾隨機回 404/5xx，重試
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        except Exception as e:
            err = e; time.sleep(wait + i)
    raise err

def fetch_feed(ch):
    out = []
    for e in ET.fromstring(get(f"https://www.youtube.com/feeds/videos.xml?channel_id={ch['id']}", tries=12, wait=2)).findall("a:entry", NS):
        vid = e.find("yt:videoId", NS).text; link = e.find("a:link", NS).get("href", ""); g = e.find("m:group", NS)
        th = g.find("m:thumbnail", NS) if g is not None else None
        out.append(dict(id=vid, title=e.find("a:title", NS).text or "", type="short" if "/shorts/" in link else "video",
                        url=link or f"https://www.youtube.com/watch?v={vid}", published=e.find("a:published", NS).text,
                        thumbnail=th.get("url") if th is not None else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                        description=(g.find("m:description", NS).text or "") if g is not None else "",
                        views=int((g.find("m:community/m:statistics", NS).get("views") or 0)) if g is not None and g.find("m:community/m:statistics", NS) is not None else 0))
    return out

def fallback_list(ch, n=15):
    """RSS 常隨機 404：改用 yt-dlp 讀頻道最新 n 支（影片＋Shorts）。"""
    out = []
    for tab in ("videos", "shorts"):
        r = subprocess.run(["yt-dlp", "--flat-playlist", "-I", f"1:{n}", "--print", "%(id)s\t%(title)s", f"{ch['url']}/{tab}"], capture_output=True, text=True, timeout=180)
        for l in r.stdout.splitlines():
            vid, title = l.split("\t", 1)
            out.append(dict(id=vid, title=title, type="short" if tab == "shorts" else "video",
                            url=(f"https://www.youtube.com/shorts/{vid}" if tab == "shorts" else f"https://www.youtube.com/watch?v={vid}"),
                            published=None, thumbnail=f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg", description=""))
    if not out: raise RuntimeError("yt-dlp 也拿不到清單")
    return out

_LIVE = {}
def channel_live_map(url, n=40):
    """yt-dlp 頻道清單（不需開影片頁）：{影片ID: live_status}。用來在影片頁被 YouTube 擋時判斷是否為首播前。"""
    global _LIVE
    if url not in _LIVE:
        _LIVE[url] = {}
        for tab in ("videos", "shorts", "streams"):
            try:
                r = subprocess.run(["yt-dlp", "--flat-playlist", "-I", f"1:{n}", "--print", "%(id)s\t%(live_status)s", f"{url}/{tab}"], capture_output=True, text=True, timeout=180)
                for l in r.stdout.splitlines():
                    i, st = l.split("\t", 1); _LIVE[url][i] = st
            except Exception as e: print("yt-dlp live map failed", e)
    return _LIVE[url]

def decide(f, url):
    """回傳 (是否收錄, 公開日期)。影片頁可判斷就用影片頁；被擋（無法判斷）時改看頻道清單的 live_status。"""
    ok, d = public_status(f["id"])
    if ok is not None: return ok, d
    st = channel_live_map(url).get(f["id"])
    if st is None: return (f.get("views", 0) > 20), None   # 清單裡也沒有：只在 RSS 觀看數明顯大於 0 時收錄
    return st not in ("is_upcoming", "is_live"), None

def public_status(vid):
    """回傳 (是否已公開, 公開日期或 None)。看不出來時回 (None, None) → 這次先跳過，下次再試。"""
    try: h = get(f"https://www.youtube.com/watch?v={vid}", 2).decode("utf-8", "ignore")
    except Exception: return None, None
    st = re.search(r'"playabilityStatus":\{"status":"([A-Z_]+)"', h)
    if not st: return None, None
    if '"isUpcoming":true' in h or '"isUnlisted":true' in h or st.group(1) != "OK": return False, None
    d = re.search(r'"(?:publishDate|uploadDate)":"([^"]+)"', h)
    return True, d.group(1) if d else None

def keyword_table():
    qa, mp, extra = load("data/qa.json"), load("data/map.json"), load("data/keywords.json")
    tq, tn = {}, {}
    for x in qa:
        for k in x["keywords"] + [x["question"].rstrip("？?")]:
            if len(k) >= 2: tq.setdefault(k.lower(), set()).add(x["id"])
    for n in mp["nodes"]:
        for k in {n["label"], n["short"]}:
            for part in re.split(r"[／/]", k):
                if len(part) >= 2: tn.setdefault(part.lower(), set()).add(n["id"])
    for k, v in extra["qa"].items(): tq.setdefault(k.lower(), set()).update(v)
    for k, v in extra["nodes"].items(): tn.setdefault(k.lower(), set()).update(v)
    return tq, tn

def tag(text, table, limit=3, minscore=1):
    t = text.lower(); score = {}
    for k, ids in table.items():
        if k in t:
            for i in ids: score[i] = score.get(i, 0) + len(k)
    return [i for i, s in sorted(score.items(), key=lambda x: -x[1]) if s >= minscore][:limit]

def add_video(f, ch, ctx):
    vids, byid, qa, mp, tq, tn = ctx
    desc = f.pop("description", "")
    strict = ch.get("tagMode") == "strict"   # 小國大棋：只看標題、門檻較高，才不會亂標
    text = f["title"] if strict else f["title"] + " " + desc[:300]
    f["channel"] = ch["key"]
    f["qa"], f["nodes"] = tag(text, tq, minscore=4 if strict else 1), tag(text, tn, minscore=4 if strict else 1)
    vids.append(f); byid[f["id"]] = f
    for x in qa:
        if x["id"] in f["qa"] and f["id"] not in x["videos"]: x["videos"].insert(0, f["id"])
    for n in mp["nodes"]:
        if n["id"] in f["nodes"] and not n.get("youtube"): n["youtube"], n["videoId"] = f["url"], f["id"]
    print("NEW", ch["key"], f["id"], f["title"][:40], "qa=", f["qa"], "nodes=", f["nodes"])

def utc(d):
    try: return datetime.fromisoformat(d).astimezone(timezone.utc).isoformat()
    except Exception: return d

def finish(data, qa, mp):
    for v in data["videos"]:
        if v.get("published"): v["published"] = utc(v["published"])
    data["videos"].sort(key=lambda v: v.get("published") or "", reverse=True)
    data.pop("channel", None); data.pop("channelId", None)
    data["channels"] = load("data/channels.json"); data["fetched"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    save("data/videos.json", data); save("data/qa.json", qa); save("data/map.json", mp)
    sw = open(P("sw.js"), encoding="utf-8").read()
    sw = re.sub(r"const C='nguy-v(\d+)'", lambda m: f"const C='nguy-v{int(m.group(1))+1}'", sw, count=1)
    open(P("sw.js"), "w", encoding="utf-8").write(sw); print("changed; sw bumped")

def main():
    chans = load("data/channels.json"); data = load("data/videos.json"); vids = data["videos"]
    byid = {v["id"]: v for v in vids}; qa, mp = load("data/qa.json"), load("data/map.json"); tq, tn = keyword_table()
    ctx = (vids, byid, qa, mp, tq, tn); changed = False
    for v in vids:
        if not v.get("channel"): v["channel"] = "hengyi"; changed = True
    now = datetime.now(timezone.utc)
    if len(sys.argv) > 2 and sys.argv[1] == "--backfill":
        ch = next(c for c in chans if c["key"] == sys.argv[2])
        for tab in ("videos", "shorts"):
            lines = subprocess.run(["yt-dlp", "--flat-playlist", "--print", "%(id)s\t%(title)s", f"{ch['url']}/{tab}"], capture_output=True, text=True).stdout.splitlines()
            for l in lines:
                vid, title = l.split("\t", 1)
                if vid in byid: continue
                ok, d = decide(dict(id=vid), ch["url"])
                if not ok: print("skip (not public yet)", vid, title[:30]); continue
                add_video(dict(id=vid, title=title, type="short" if tab == "shorts" else "video",
                               url=(f"https://www.youtube.com/shorts/{vid}" if tab == "shorts" else f"https://www.youtube.com/watch?v={vid}"),
                               published=d, thumbnail=f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"), ch, ctx); changed = True
    for ch in chans:
        try: feed = fetch_feed(ch)
        except Exception as e:
            print("RSS failed for", ch["name"], e, "→ 改用 yt-dlp")
            try: feed = fetch_feed_fb = fallback_list(ch)
            except Exception as e2: print("fallback failed", e2); continue
        for f in feed:
            v = byid.get(f["id"])
            if v is None:
                if f["published"] and datetime.fromisoformat(f["published"]) > now: print("skip future", f["id"]); continue
                ok, d = decide(f, ch["url"]); f.pop("views", None)
                if not ok: print("skip (premiere/not public or unknown)", f["id"], f["title"][:30]); continue
                if d and (len(d) > 10 or not f["published"]): f["published"] = utc(d)
                if not f["published"]: print("skip (no date)", f["id"]); continue  # 首播：用實際公開時間
                add_video(f, ch, ctx); changed = True
            else:
                for k in ("published", "thumbnail"):
                    if not v.get(k) and f.get(k): v[k] = f[k]; changed = True
    for v in vids:
        if not v.get("thumbnail"): v["thumbnail"] = f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg"; changed = True
    if changed: finish(data, qa, mp)
    else: print("no changes")

if __name__ == "__main__": main()
