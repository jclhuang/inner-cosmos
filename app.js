const CFG=window.APP_CONFIG;document.title=CFG.name;appname.textContent=CFG.name;tagline.textContent=CFG.tagline;
let DAYS=[],MAP={nodes:[],edges:[]},QA=[],VIDS=[],MED=[],CHS=[],ARTS=[];const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get:k=>JSON.parse(localStorage.getItem(k)||'null'),set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
function todayIdx(){const d=Math.floor((new Date().setHours(0,0,0,0)-new Date(CFG.startDate+'T00:00:00'))/864e5);return d<0?1:(d%DAYS.length)+1}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1800)}
const node=id=>MAP.nodes.find(n=>n.id===id);
function cbetaUrl(c){return 'https://cbetaonline.dila.edu.tw/zh/'+c.replace('n','').replace(/^(T\d\d)/,'T')}
function chips(ids){return '<div class="chips">'+ids.map(i=>{const n=node(i);return n?`<button class="chip ${n.type}" data-node="${i}">${esc(n.label)}</button>`:''}).join('')+'</div>'}
function renderDay(n){const d=DAYS[n-1],notes=store.get('notes')||{},t=todayIdx();
view.innerHTML=`<div class="daynav"><button id="prev" ${n<=1?'disabled':''}>‹ 前一天</button><span>第 ${n} 天${n===t?'・今日':''}</span><button id="next" ${n>=DAYS.length?'disabled':''}>後一天 ›</button></div>
<div class="card"><h3>${esc(d.title)}</h3><div class="quote">${esc(d.quote)}</div><div class="src">${esc(d.source)}<br><a href="${cbetaUrl(d.cbeta)}" target="_blank" rel="noopener">CBETA ${esc(d.cbeta)}</a></div></div>
<div class="card"><h3>白話</h3>${esc(d.plain)}</div>
<div class="card sci"><h3>科學對照・${esc(d.science.field)}</h3>${esc(d.science.text)}<div class="ref">參考：${esc(d.science.ref)}</div><div class="ref">※ 這是供思考的對照與類比，並非「科學證明佛法」。</div></div>
<div class="card"><h3>今日一問</h3><div class="q">${esc(d.question)}</div><textarea id="note" placeholder="寫下你的一句心得…">${esc(notes[n]||'')}</textarea><button class="btn" id="save">儲存心得</button><button class="btn ghost" id="share">分享</button></div>
<div class="card"><h3>相關概念</h3>${chips(d.nodes)}</div>${latestHTML()}`;
prev.onclick=()=>go('day',n-1);next.onclick=()=>go('day',n+1);
save.onclick=()=>{const v=note.value.trim(),o=store.get('notes')||{};if(v)o[n]=v;else delete o[n];store.set('notes',o);toast('已儲存在這台裝置')};
share.onclick=async()=>{const txt=`${d.quote}\n——${d.source}\n\n${d.question}\n\n${CFG.name}`;const data={title:CFG.name,text:txt,url:location.href.split('#')[0]};
try{if(navigator.share){await navigator.share(data)}else{await navigator.clipboard.writeText(txt+'\n'+data.url);toast('已複製，可貼上分享')}}catch(e){}};}
function streak(){const o=store.get('notes')||{};let s=0;for(let i=todayIdx();i>=1&&o[i];i--)s++;return s}
function renderCal(){const o=store.get('notes')||{},t=todayIdx();
view.innerHTML=`<div class="card"><div class="streak">🔥 連續 ${streak()} 天</div><div class="legend">已寫心得 ${Object.keys(o).length} / ${DAYS.length} 天</div></div><div class="card"><div class="grid">${DAYS.map(d=>`<button class="cell ${o[d.day]?'done':''} ${d.day===t?'today':''}" data-day="${d.day}">${d.day}</button>`).join('')}</div></div>
<div class="card">${DAYS.map(d=>`<div data-day="${d.day}" style="padding:6px 0;border-bottom:1px solid #2b2f66">${d.day}. ${esc(d.title)} <span class="ref">${esc(d.science.field)}</span></div>`).join('')}</div>`}
function renderMap(){view.innerHTML=`<div class="legend"><span style="color:var(--gold)">● 佛學概念</span>　<span style="color:var(--sci)">● 科學／AI</span>　點選節點看說明・可拖曳</div><div id="mapwrap"><svg id="svg"></svg></div>`;
const W=mapwrap.clientWidth,H=mapwrap.clientHeight,N=MAP.nodes.map(n=>{const b=n.type==='b',arr=MAP.nodes.filter(x=>x.type===n.type),k=arr.indexOf(n),a=k/arr.length*Math.PI*2-Math.PI/2+(b?0:Math.PI/arr.length);return{...n,x:W/2+Math.cos(a)*W*(b?.26:.40),y:H/2+Math.sin(a)*H*(b?.25:.43)}});
const idx=Object.fromEntries(N.map(n=>[n.id,n]));
const ns='http://www.w3.org/2000/svg';const mk=(t,a)=>{const e=document.createElementNS(ns,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const lines=MAP.edges.map(e=>{const l=mk('line',{stroke:'#4a4f8f','stroke-width':1.2,'stroke-opacity':.7});svg.appendChild(l);return[l,idx[e.a],idx[e.b]]});
const draw=()=>{lines.forEach(([l,a,b])=>{l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y)});N.forEach(n=>n.g.setAttribute('transform',`translate(${n.x},${n.y})`))};
N.forEach(n=>{const g=mk('g',{style:'cursor:pointer'}),c=n.type==='b'?'#d9b46a':'#7fb8d9';g.appendChild(mk('circle',{r:n.type==='b'?30:27,fill:c,'fill-opacity':.18,stroke:c,'stroke-width':1.5}));const t=mk('text',{'text-anchor':'middle',dy:5,fill:'#f2ecd9','font-size':n.short.length>4?12:14});t.textContent=n.short;g.appendChild(t);svg.appendChild(g);n.g=g;
let sx,sy,moved;g.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;moved=false;try{g.setPointerCapture(e.pointerId)}catch(_){}});g.addEventListener('pointermove',e=>{if(sx==null)return;if(Math.hypot(e.clientX-sx,e.clientY-sy)>6)moved=true;if(moved){const r=svg.getBoundingClientRect();n.x=e.clientX-r.left;n.y=e.clientY-r.top;draw()}});g.addEventListener('pointerup',()=>{sx=null;if(!moved)openNode(n.id)})});draw()}
function openNode(id){const n=node(id),nb=MAP.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a);
sheetbody.innerHTML=`<h2>${esc(n.label)}</h2><div class="legend" style="text-align:left">${n.type==='b'?'佛學概念':'科學／AI'}</div><div class="card"><h3>說明與對照理由</h3>${esc(n.explain)}</div><div class="card"><h3>${n.type==='b'?'經文':'參考來源'}</h3>${esc(n.quote)}</div><div class="card"><h3>想一想</h3><div class="q">${esc(n.question)}</div></div>
<div class="card"><h3>連結概念</h3>${chips(nb)}</div>${n.days.length?`<div class="card"><h3>相關每日一偈</h3><div class="chips">${n.days.map(d=>`<button class="chip" data-day="${d}">第${d}天・${esc(DAYS[d-1].title)}</button>`).join('')}</div></div>`:''}
<div class="card"><h3>相關影片</h3>${n.youtube?`<a class="btn" href="${esc(n.youtube)}" target="_blank" rel="noopener">▶ ${esc((VIDS.find(v=>v.id===n.videoId)||{}).title||'觀看影片')}</a>`:`<a class="btn ghost" href="${CFG.channel}" target="_blank" rel="noopener">▶ 前往「${esc(CFG.channelName)}」頻道</a>`}</div>`;sheet.hidden=false}
function go(v,arg){sheet.hidden=true;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===({day:'today',article:'articles'}[v]||v)));
if(v==='today'){renderDay(todayIdx());history.replaceState(0,'','#today')}else if(v==='day'){renderDay(arg);history.replaceState(0,'','#day/'+arg)}else if(v==='cal'){renderCal();history.replaceState(0,'','#cal')}else if(v==='videos'){renderVideos(arg);history.replaceState(0,'','#videos'+(arg?'/'+arg:''))}else if(v==='articles'){renderArticles();history.replaceState(0,'','#articles')}else if(v==='article'){renderArticle(arg);history.replaceState(0,'','#article/'+encodeURIComponent(arg))}else if(v==='qa'){renderQA(arg);history.replaceState(0,'','#qa')}else if(v==='med'){renderMed();history.replaceState(0,'','#med')}else{renderMap();history.replaceState(0,'','#map'+(arg?'/'+arg:''));if(arg)openNode(arg)}scrollTo(0,0)}
document.addEventListener('click',e=>{const t=e.target.closest('[data-day],[data-node],[data-v],[data-ask],[data-art]');if(!t)return;if(t.dataset.art){go('article',t.dataset.art);return}if(t.dataset.ask!=null){ask(t.dataset.ask);return}if(t.dataset.v)go(t.dataset.v);else if(t.dataset.day)go('day',+t.dataset.day);else if(t.dataset.qa){}else{if(view.querySelector('#svg'))openNode(t.dataset.node);else go('map',t.dataset.node)}});
$('.close').onclick=()=>sheet.hidden=true;sheet.onclick=e=>{if(e.target===sheet)sheet.hidden=true};
function route(){const h=location.hash.slice(1).split('/');if(h[0]==='day')go('day',+h[1]);else if(h[0]==='map')go('map',h[1]);else if(h[0]==='cal')go('cal');else if(h[0]==='qa')go('qa');else if(h[0]==='videos')go('videos',h[1]);else if(h[0]==='articles')go('articles');else if(h[0]==='article')go('article',decodeURIComponent(h[1]||''));else if(h[0]==='med')go('med');else go('today')}
window.addEventListener('hashchange',route);
const J=u=>fetch(u).then(r=>r.json());Promise.all([J('data/days.json'),J('data/map.json'),J('data/qa.json'),J('data/videos.json'),J('data/meditation.json'),J('data/articles.json').catch(()=>[])]).then(([d,m,q,v,md,ar])=>{DAYS=d;MAP=m;QA=q;VIDS=v.videos;CHS=v.channels||[];MED=md;ARTS=ar;buildIndex();route()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

const chOf=v=>CHS.find(c=>c.key===v.channel)||{short:'',name:'',key:''};
const vcard=v=>`<a class="vcard" href="${v.url}" target="_blank" rel="noopener"><img loading="lazy" src="${v.thumbnail}" alt=""><span>${esc(v.title.replace(/#\S+/g,'').trim())}</span><small>${CHS.length>1?`<b class="badge ch-${chOf(v).key}">${esc(chOf(v).short)}</b> `:''}${(v.published||'').slice(0,10)}${v.type==='short'?'・Shorts':''}</small></a>`;
const sortedV=()=>VIDS.filter(v=>v.published).sort((a,b)=>b.published.localeCompare(a.published));
function latestHTML(){const L=sortedV().slice(0,5);if(!L.length)return'';
return `<div class="card"><h3>最新影片</h3><div class="vrow">${L.map(vcard).join('')}</div><button class="vlink" data-v="videos">看全部影片 ›</button></div>`}
function renderVideos(f){f=f||'all';const L=sortedV().filter(v=>f==='all'||v.channel===f);
view.innerHTML=`<h2>全部影片</h2><div class="chips tabs" ${CHS.length>1?'':'hidden'}>${[['all','全部']].concat(CHS.map(c=>[c.key,c.name])).map(([k,n])=>`<button class="chip ${k===f?'sel':''}" data-vf="${k}">${esc(n)}（${k==='all'?VIDS.length:VIDS.filter(v=>v.channel===k).length}）</button>`).join('')}</div>
<div class="vgrid">${L.map(vcard).join('')}</div>${CHS.filter(c=>f==='all'||c.key===f).map(c=>`<a class="vlink" href="${c.url}" target="_blank" rel="noopener">▶ 前往「${esc(c.name)}」頻道</a>`).join('')}`;
document.querySelectorAll('[data-vf]').forEach(b=>b.onclick=()=>{renderVideos(b.dataset.vf);history.replaceState(0,'','#videos/'+b.dataset.vf)})}
/* ===== 文章與簡報 ===== */
const kindLabel={md:'文章',pdf:'PDF',slides:'簡報',link:'連結',file:'檔案'};
function renderArticles(t){const tags=[...new Set(ARTS.flatMap(a=>a.tags))];const L=ARTS.filter(a=>!t||a.tags.includes(t));
view.innerHTML=`<h2>文章與簡報</h2>${tags.length?`<div class="chips tabs"><button class="chip ${!t?'sel':''}" data-at="">全部</button>${tags.map(x=>`<button class="chip ${x===t?'sel':''}" data-at="${esc(x)}">${esc(x)}</button>`).join('')}</div>`:''}
${L.length?L.map(a=>`<div class="card acard" data-art="${esc(a.id)}">${a.thumb?`<img src="${a.thumb}" alt="" loading="lazy">`:''}<div><div class="ameta"><b class="badge">${kindLabel[a.kind]||'文章'}</b> ${esc(a.date)}${a.sample?' ・<span class="warn">範例</span>':''}</div><div class="atitle">${esc(a.title)}</div><div class="asum">${esc(a.summary||'')}</div><div class="chips">${a.tags.map(x=>`<span class="tag">#${esc(x)}</span>`).join('')}</div></div></div>`).join(''):'<div class="card">還沒有文章。</div>'}`;
document.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>renderArticles(b.dataset.at||''))}
async function renderArticle(id){const a=ARTS.find(x=>x.id===id);if(!a){renderArticles();return}
const v=a.video&&VIDS.find(x=>x.id===a.video);
view.innerHTML=`<button class="chip" data-v="articles">‹ 文章列表</button><article class="card art"><div class="ameta"><b class="badge">${kindLabel[a.kind]||'文章'}</b> ${esc(a.date)}${a.sample?' ・<span class="warn">範例</span>':''}</div><h2>${esc(a.title)}</h2><div class="chips">${a.tags.map(x=>`<span class="tag">#${esc(x)}</span>`).join('')}</div>
<div id="artbody">${a.md?'載入中…':`<p>${esc(a.summary||'')}</p>`}</div>
${a.embed?`<div class="embed"><iframe src="${a.embed}" allowfullscreen loading="lazy"></iframe></div>`:''}
${a.pdf&&!a.md&&a.thumb?`<a href="${a.pdf}" target="_blank" rel="noopener"><img class="pthumb" src="${a.thumb}" alt="PDF 第一頁"></a>`:''}
<div>${a.pdf?`<a class="btn" href="${a.pdf}" target="_blank" rel="noopener">開啟 PDF</a><a class="btn ghost" href="${a.pdf}" download>下載 PDF</a>`:''}${a.pptx?`<a class="btn ghost" href="${a.pptx}" download>下載 PPTX</a>`:''}${a.docx?`<a class="btn ghost" href="${a.docx}" download>下載 Word</a>`:''}${a.link?`<a class="btn ghost" href="${esc(a.link)}" target="_blank" rel="noopener">開啟原始連結</a>`:''}</div></article>
${a.nodes.length?`<div class="card"><h3>相關概念</h3>${chips(a.nodes)}</div>`:''}
${a.qa.length?`<div class="card"><h3>相關問答</h3><div class="chips">${a.qa.map(i=>QA.find(q=>q.id===i)).filter(Boolean).map(q=>`<button class="chip" data-ask="${esc(q.question)}">${esc(q.question)}</button>`).join('')}</div></div>`:''}
${v?`<div class="card"><h3>相關影片</h3><div class="vrow">${vcard(v)}</div></div>`:''}`;
if(a.md){try{let t=await fetch(a.md).then(r=>r.text());t=t.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/,'').replace(/^\s*# .*\n/,'');const el=$('#artbody');if(!el)return;el.innerHTML=marked.parse(t);
const base=a.md.replace(/[^/]+$/,'');el.querySelectorAll('img').forEach(i=>{const s=i.getAttribute('src');if(s&&!/^(https?:|data:|\/)/.test(s))i.src=base+s;i.loading='lazy'});
el.querySelectorAll('a[href^="http"]').forEach(x=>{x.target='_blank';x.rel='noopener'});el.querySelectorAll('script,iframe,object').forEach(x=>x.remove())}catch(e){$('#artbody').textContent='文章載入失敗（離線時需先開啟過一次）。'}}}
/* ===== 智慧問答（離線檢索；未來可在 answerBackend 換成 LLM） ===== */
const SYN=[["人工智慧","ai"],["人工智能","ai"],["chatgpt","ai"],["機器人","ai"],["打坐","冥想"],["禪修","冥想"],["靜坐","冥想"],["坐禪","冥想"],["多元宇宙","平行宇宙"],["多重宇宙","平行宇宙"],["平行世界","平行宇宙"],["轉世","輪迴"],["投胎","輪迴"],["業力","業"],["死後","死亡"],["往生","死亡"],["焦躁","焦慮"],["緊張","焦慮"],["發脾氣","生氣"],["憤怒","生氣"],["靈魂","意識"],["腦袋","大腦"],["量子力學","量子"],["空性","空"]];
let IDX=[];
const norm=s=>{s=String(s).toLowerCase().replace(/[\s，。？！、：；「」『』（）()?!,.\-—…《》]/g,'');for(const[a,b]of SYN)s=s.split(a).join(b);return s};
const grams=s=>{const g=new Set();for(let i=0;i<s.length-1;i++)g.add(s.slice(i,i+2));return g};
function buildIndex(){IDX=[];
QA.forEach(x=>IDX.push({kind:'qa',ref:x,head:norm(x.question+x.keywords.join('')),keys:[...new Set(x.keywords.map(norm))],body:norm(x.buddhist.text+x.science.text)}));
DAYS.forEach(d=>IDX.push({kind:'day',ref:d,head:norm(d.title+d.science.field),keys:[norm(d.title)],body:norm(d.quote+d.plain+d.science.text+d.question)}));
MAP.nodes.forEach(n=>IDX.push({kind:'node',ref:n,head:norm(n.label),keys:[norm(n.label),norm(n.short)],body:norm(n.explain+n.quote)}));
IDX.forEach(e=>{e.hg=grams(e.head);e.bg=grams(e.body)})}
function search(q){const nq=norm(q),qg=grams(nq);if(!qg.size)return[];
return IDX.map(e=>{let s=0;for(const k of e.keys)if(k.length>=1&&nq.includes(k))s+=3*k.length;for(const g of qg){if(e.hg.has(g))s+=1.5;if(e.bg.has(g))s+=.4}s=s*Math.min(1,4/Math.sqrt(qg.size));if(e.kind!=='qa')s*=.8;return{e,s}}).sort((a,b)=>b.s-a.s)}
/* 換成 LLM 時：answerBackend = async(q,ctx)=> fetch('https://<worker>/ask',{method:'POST',body:JSON.stringify({q,ctx})}) ，ctx 為 search(q) 前幾筆策展內容 */
let answerBackend=null;
const vidLinks=ids=>ids.map(id=>VIDS.find(v=>v.id===id)).filter(Boolean).map(v=>`<a class="vlink" href="${v.url}" target="_blank" rel="noopener">▶ ${esc(v.title)}</a>`).join('');
function answerHTML(r){const{e,s}=r,conf=Math.min(99,Math.round(s/18*100));const cl=conf>=70?'高':conf>=45?'中':'低';
if(e.kind==='qa'){const x=e.ref;return `<div class="ans"><div class="ans-q">${esc(x.question)}</div><div class="conf">相符程度：${cl}</div>
<h3>佛教觀點</h3><p>${esc(x.buddhist.text)}</p><blockquote>${esc(x.buddhist.quote)}<br><small>——${esc(x.buddhist.ref)}（CBETA ${esc(x.buddhist.cbeta)}）</small></blockquote>
<h3 class="sc">科學觀點（對照，不是證明）</h3><p>${esc(x.science.text)}</p><div class="ref">來源：${esc(x.science.source)}</div>${x.science.consensus?`<div class="ref warn">⚠ ${esc(x.science.consensus)}</div>`:''}
${x.nodes.length?`<h3>相關概念</h3>${chips(x.nodes)}`:''}${x.days.length?`<h3>相關每日一偈</h3><div class="chips">${x.days.map(d=>`<button class="chip" data-day="${d}">第${d}天</button>`).join('')}</div>`:''}
<h3>相關影片</h3>${vidLinks(x.videos)||`<a class="vlink" href="${CFG.channel}" target="_blank" rel="noopener">▶ 前往「${esc(CFG.channelName)}」頻道</a>`}</div>`}
if(e.kind==='day'){const d=e.ref;return `<div class="ans"><div class="ans-q">每日一偈・第${d.day}天：${esc(d.title)}</div><div class="conf">相符程度：${cl}</div><blockquote>${esc(d.quote)}<br><small>——${esc(d.source)}</small></blockquote><p>${esc(d.plain)}</p><h3 class="sc">科學對照</h3><p>${esc(d.science.text)}</p><button class="chip" data-day="${d.day}">看完整內容</button></div>`}
const n=e.ref;return `<div class="ans"><div class="ans-q">知識地圖：${esc(n.label)}</div><div class="conf">相符程度：${cl}</div><p>${esc(n.explain)}</p><p class="ref">${esc(n.quote)}</p><button class="chip ${n.type}" data-node="${n.id}">在地圖中打開</button></div>`}
const SUGG=["佛教怎麼看平行宇宙？","AI 有沒有心？","量子糾纏是不是證明了緣起？","靜坐真的能減輕焦慮嗎？","輪迴存在嗎？","時間是什麼？","有自由意志嗎？","大爆炸之前是什麼？"];
let CHAT=[];
function renderQA(){view.innerHTML=`<div class="card note">💬 <b>智慧問答</b>：答案只來自本 App 整理過的經文與科學資料（共 ${QA.length} 題＋每日一偈＋知識地圖），不是即時生成的 AI，也可能沒整理到你的問題。</div>
${latestHTML()}<div id="chat"></div><div class="chips" id="sugg">${SUGG.map(q=>`<button class="chip" data-ask="${esc(q)}">${esc(q)}</button>`).join('')}</div>
<form id="askf" class="askbar"><input id="askin" placeholder="輸入你的問題，例如：AI 有佛性嗎？" autocomplete="off"><button class="btn">問</button></form>`;
drawChat();askf.onsubmit=e=>{e.preventDefault();const v=askin.value.trim();if(v){ask(v);askin.value=''}}}
function ask(q){const r=search(q),top=r[0];let html;
if(top&&top.s>=6)html=answerHTML(top);else{const rel=r.filter(x=>x.e.kind==='qa').slice(0,3);html=`<div class="ans"><p>這個問題我還沒整理到 🙏。也許這些相關主題可以幫上忙：</p><div class="chips">${rel.map(x=>`<button class="chip" data-ask="${esc(x.e.ref.question)}">${esc(x.e.ref.question)}</button>`).join('')}</div><p class="ref">也歡迎到「${esc(CFG.channelName)}」頻道留言提問。</p></div>`}
CHAT.push({q,html});if(!view.querySelector('#chat'))go('qa');drawChat()}
function drawChat(){const c=$('#chat');if(!c)return;c.innerHTML=CHAT.map(m=>`<div class="bubble me">${esc(m.q)}</div><div class="bubble bot">${m.html}</div>`).join('');const last=c.lastElementChild;if(last)last.previousElementSibling.scrollIntoView({block:'start'})}

/* ===== 靜坐計時 ===== */
const dk=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
let AC=null,TM=null,wake=null;const MS={total:0,left:0,run:false,interval:0,breath:false,last:0};
function bell(f=432,dur=4){AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime;[1,2.76,5.4].forEach((m,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f*m;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.25/(i+1),t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur/(i+1));o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur)})}
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function medLog(){return store.get('medlog')||[]}
function medStats(){const L=medLog(),days=new Set(L.map(x=>x.d));let st=0,d=new Date();const k=dk;if(!days.has(k(d)))d.setDate(d.getDate()-1);while(days.has(k(d))){st++;d.setDate(d.getDate()-1)}return{min:Math.round(L.reduce((a,x)=>a+x.m,0)),n:L.length,st}}
function chart(){const L=medLog(),out=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dk(d);out.push({k,m:L.filter(x=>x.d===k).reduce((a,x)=>a+x.m,0),w:'日一二三四五六'[d.getDay()]})}const mx=Math.max(10,...out.map(o=>o.m));return `<div class="bars">${out.map(o=>`<div class="bar"><div style="height:${o.m/mx*100}%"></div><span>${o.w}</span><small>${Math.round(o.m)}</small></div>`).join('')}</div>`}
function sciCard(){const i=(store.get('medsci')||0)%MED.length,m=MED[i];return `<div class="card sci"><h3>冥想科學 ${i+1}/${MED.length}・${esc(m.title)}</h3>${esc(m.text)}<div class="ref">${esc(m.cite)} <a href="https://doi.org/${m.doi}" target="_blank" rel="noopener">doi:${m.doi}</a></div><button class="btn ghost" id="nextsci">下一則</button></div>`}
function renderMed(){const S=medStats();view.innerHTML=`<div class="card timer"><div id="breath" class="breath ${MS.breath?'on':''} ${MS.run?'run':''}"><div id="tleft">${fmt(MS.left||(MS.total||600))}</div><div id="bhint">${MS.breath?'吸氣…':''}</div></div>
<div class="chips presets">${[5,10,15,20,30].map(m=>`<button class="chip ${((MS.total||600)===m*60)?'sel':''}" data-min="${m}">${m} 分</button>`).join('')}<button class="chip" data-min="custom">自訂</button></div>
<div class="opts"><label><input type="checkbox" id="optb" ${MS.breath?'checked':''}> 呼吸引導</label><label>間隔鐘 <select id="opti">${[0,1,3,5,10].map(v=>`<option value="${v}" ${MS.interval==v?'selected':''}>${v?v+' 分':'不用'}</option>`).join('')}</select></label></div>
<div><button class="btn" id="tstart">${MS.run?'暫停':(MS.left&&MS.left<MS.total?'繼續':'開始')}</button><button class="btn ghost" id="tend">結束</button></div></div>
<div class="card"><h3>我的靜坐紀錄</h3><div class="stats"><div><b>${S.min}</b><span>總分鐘</span></div><div><b>${S.n}</b><span>次數</span></div><div><b>${S.st}</b><span>連續天數</span></div></div>${chart()}</div><div id="scibox">${sciCard()}</div>`;
document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{if(MS.run)return;let m=b.dataset.min;if(m==='custom'){m=parseInt(prompt('靜坐幾分鐘？（1–180）','25'));if(!(m>0&&m<=180))return}MS.total=m*60;MS.left=MS.total;renderMed()});
optb.onchange=()=>{MS.breath=optb.checked;breath.classList.toggle('on',MS.breath)};opti.onchange=()=>MS.interval=+opti.value;
tstart.onclick=()=>MS.run?pauseT():startT();tend.onclick=()=>endT(true);bindSci()}
function bindSci(){const b=$('#nextsci');if(b)b.onclick=()=>{store.set('medsci',(store.get('medsci')||0)+1);scibox.innerHTML=sciCard();bindSci()}}
async function startT(){if(!MS.total)MS.total=600;if(!MS.left||MS.left<=0)MS.left=MS.total;if(MS.left===MS.total)bell();MS.run=true;MS.last=Date.now();try{wake=await navigator.wakeLock?.request('screen')}catch(e){}
TM=setInterval(()=>{const now=Date.now(),dt=(now-MS.last)/1000;MS.last=now;const before=MS.total-MS.left;MS.left-=dt;const el=MS.total-MS.left;if(MS.interval&&Math.floor(el/(MS.interval*60))>Math.floor(before/(MS.interval*60))&&MS.left>1)bell(528,2.5);
const t=$('#tleft');if(t)t.textContent=fmt(Math.max(0,MS.left));const h=$('#bhint');if(h)h.textContent=MS.breath?((el%10)<4?'吸氣…':(el%10)<6?'停留…':'吐氣…'):'';if(MS.left<=0)endT(false)},250);renderMed()}
function pauseT(){MS.run=false;clearInterval(TM);wake?.release?.();wake=null;renderMed()}
function endT(manual){const done=(MS.total-Math.max(0,MS.left))/60;clearInterval(TM);MS.run=false;wake?.release?.();wake=null;if(done>=0.5){const L=medLog();L.push({d:dk(new Date()),m:+done.toFixed(1),t:Date.now()});store.set('medlog',L);store.set('medsci',(store.get('medsci')||0)+1);bell(432,5);toast(`完成 ${Math.round(done)} 分鐘 🙏`)}MS.left=MS.total;if(view.querySelector('#breath'))renderMed()}
document.addEventListener('visibilitychange',async()=>{if(MS.run&&document.visibilityState==='visible'){try{wake=await navigator.wakeLock?.request('screen')}catch(e){}}});
