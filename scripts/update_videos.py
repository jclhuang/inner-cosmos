#!/usr/bin/env python3
"""每日匯入「恆易座標視界」新影片：讀 RSS → 合併 data/videos.json（永不刪除）→ 依關鍵字標到問答與地圖 → 有變更才升級 sw.js 快取版本。"""
import json, re, sys, urllib.request, xml.etree.ElementTree as ET, os
CH = "UCx01p-nB9wSd85kWWRlhcXw"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda f: os.path.join(ROOT, f)
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015", "m": "http://search.yahoo.com/mrss/"}

def load(f): return json.load(open(P(f), encoding="utf-8"))
def save(f, d): open(P(f), "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False, indent=1) + "\n")

def fetch_feed(src=None):
    raw = open(src, "rb").read() if src else urllib.request.urlopen(
        urllib.request.Request(f"https://www.youtube.com/feeds/videos.xml?channel_id={CH}", headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()
    out = []
    for e in ET.fromstring(raw).findall("a:entry", NS):
        vid = e.find("yt:videoId", NS).text
        link = e.find("a:link", NS).get("href", "")
        g = e.find("m:group", NS)
        out.append(dict(id=vid, title=e.find("a:title", NS).text or "",
                        type="short" if "/shorts/" in link else "video",
                        url=link or f"https://www.youtube.com/watch?v={vid}",
                        published=e.find("a:published", NS).text,
                        thumbnail=g.find("m:thumbnail", NS).get("url") if g is not None and g.find("m:thumbnail", NS) is not None else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                        description=(g.find("m:description", NS).text or "") if g is not None else ""))
    return out

def keyword_table():
    """關鍵字 → 問答 id / 地圖節點 id。重用問答 keywords、地圖名稱，再加 data/keywords.json 的補充表。"""
    qa, mp = load("data/qa.json"), load("data/map.json")
    extra = load("data/keywords.json")
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

def tag(text, table, limit=3):
    t = text.lower(); score = {}
    for k, ids in table.items():
        if k in t:
            for i in ids: score[i] = score.get(i, 0) + len(k)
    return [i for i, _ in sorted(score.items(), key=lambda x: -x[1])[:limit]]

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    data = load("data/videos.json"); vids = data["videos"]; byid = {v["id"]: v for v in vids}
    qa, mp = load("data/qa.json"), load("data/map.json")
    tq, tn = keyword_table()
    feed = fetch_feed(src); changed = False; new = []
    for f in feed:
        v = byid.get(f["id"])
        if v is None:
            desc = f.pop("description")
            text = f["title"] + " " + desc[:300]
            f["qa"], f["nodes"] = tag(text, tq), tag(text, tn)
            vids.append(f); byid[f["id"]] = f; new.append(f); changed = True
            for x in qa:
                if x["id"] in f["qa"] and f["id"] not in x["videos"]: x["videos"].insert(0, f["id"])
            for n in mp["nodes"]:
                if n["id"] in f["nodes"] and not n.get("youtube"):  # 只補空白，不覆蓋手動指定
                    n["youtube"], n["videoId"] = f["url"], f["id"]
        else:  # 補齊舊資料欄位（日期、縮圖），不改標題/標籤
            for k in ("published", "thumbnail"):
                if not v.get(k): v[k] = f[k]; changed = True
    for v in vids:
        if not v.get("thumbnail"): v["thumbnail"] = f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg"; changed = True
    if not changed: print("no changes"); return
    vids.sort(key=lambda v: v.get("published") or "", reverse=True)
    save("data/videos.json", data); save("data/qa.json", qa); save("data/map.json", mp)
    sw = open(P("sw.js"), encoding="utf-8").read()
    sw = re.sub(r"const C='nguy-v(\d+)'", lambda m: f"const C='nguy-v{int(m.group(1))+1}'", sw, count=1)
    open(P("sw.js"), "w", encoding="utf-8").write(sw)
    for f in new: print("NEW", f["id"], f["title"], "qa=", f["qa"], "nodes=", f["nodes"])
    print("changed; sw bumped")

if __name__ == "__main__": main()
