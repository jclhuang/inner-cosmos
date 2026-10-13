const CFG=window.APP_CONFIG;document.title=CFG.name;appname.textContent=CFG.name;tagline.textContent=CFG.tagline;
let DAYS=[],MAP={nodes:[],edges:[]};const $=s=>document.querySelector(s);
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
<div class="card"><h3>相關概念</h3>${chips(d.nodes)}</div>`;
prev.onclick=()=>go('day',n-1);next.onclick=()=>go('day',n+1);
save.onclick=()=>{const v=note.value.trim(),o=store.get('notes')||{};if(v)o[n]=v;else delete o[n];store.set('notes',o);toast('已儲存在這台裝置')};
share.onclick=async()=>{const txt=`${d.quote}\n——${d.source}\n\n${d.question}\n\n${CFG.name}`;const data={title:CFG.name,text:txt,url:location.href.split('#')[0]};
try{if(navigator.share){await navigator.share(data)}else{await navigator.clipboard.writeText(txt+'\n'+data.url);toast('已複製，可貼上分享')}}catch(e){}};}
function streak(){const o=store.get('notes')||{};let s=0;for(let i=todayIdx();i>=1&&o[i];i--)s++;return s}
function renderCal(){const o=store.get('notes')||{},t=todayIdx();
view.innerHTML=`<div class="card"><div class="streak">🔥 連續 ${streak()} 天</div><div class="legend">已寫心得 ${Object.keys(o).length} / ${DAYS.length} 天</div></div><div class="card"><div class="grid">${DAYS.map(d=>`<button class="cell ${o[d.day]?'done':''} ${d.day===t?'today':''}" data-day="${d.day}">${d.day}</button>`).join('')}</div></div>
<div class="card">${DAYS.map(d=>`<div data-day="${d.day}" style="padding:6px 0;border-bottom:1px solid #2b2f66">${d.day}. ${esc(d.title)} <span class="ref">${esc(d.science.field)}</span></div>`).join('')}</div>`}
function renderMap(){view.innerHTML=`<div class="legend"><span style="color:var(--gold)">● 佛學概念</span>　<span style="color:var(--sci)">● 科學／AI</span>　點選節點看說明・可拖曳</div><div id="mapwrap"><svg id="svg"></svg></div>`;
const W=mapwrap.clientWidth,H=mapwrap.clientHeight,N=MAP.nodes.map(n=>{const b=n.type==='b',arr=MAP.nodes.filter(x=>x.type===n.type),k=arr.indexOf(n),a=k/arr.length*Math.PI*2-Math.PI/2+(b?0:Math.PI/arr.length);return{...n,x:W/2+Math.cos(a)*W*(b?.25:.39),y:H/2+Math.sin(a)*H*(b?.22:.42)}});
const idx=Object.fromEntries(N.map(n=>[n.id,n]));
const ns='http://www.w3.org/2000/svg';const mk=(t,a)=>{const e=document.createElementNS(ns,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const lines=MAP.edges.map(e=>{const l=mk('line',{stroke:'#4a4f8f','stroke-width':1.2,'stroke-opacity':.7});svg.appendChild(l);return[l,idx[e.a],idx[e.b]]});
const draw=()=>{lines.forEach(([l,a,b])=>{l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y)});N.forEach(n=>n.g.setAttribute('transform',`translate(${n.x},${n.y})`))};
N.forEach(n=>{const g=mk('g',{style:'cursor:pointer'}),c=n.type==='b'?'#d9b46a':'#7fb8d9';g.appendChild(mk('circle',{r:n.type==='b'?26:20,fill:c,'fill-opacity':.18,stroke:c,'stroke-width':1.5}));const t=mk('text',{'text-anchor':'middle',dy:5,fill:'#f2ecd9','font-size':n.label.length>5?11:14});t.textContent=n.label;g.appendChild(t);svg.appendChild(g);n.g=g;
let sx,sy,moved;g.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;moved=false;try{g.setPointerCapture(e.pointerId)}catch(_){}});g.addEventListener('pointermove',e=>{if(sx==null)return;if(Math.hypot(e.clientX-sx,e.clientY-sy)>6)moved=true;if(moved){const r=svg.getBoundingClientRect();n.x=e.clientX-r.left;n.y=e.clientY-r.top;draw()}});g.addEventListener('pointerup',()=>{sx=null;if(!moved)openNode(n.id)})});draw()}
function openNode(id){const n=node(id),nb=MAP.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a);
sheetbody.innerHTML=`<h2>${esc(n.label)}</h2><div class="legend" style="text-align:left">${n.type==='b'?'佛學概念':'科學／AI'}</div><div class="card"><h3>說明與對照理由</h3>${esc(n.explain)}</div><div class="card"><h3>${n.type==='b'?'經文':'參考來源'}</h3>${esc(n.quote)}</div><div class="card"><h3>想一想</h3><div class="q">${esc(n.question)}</div></div>
<div class="card"><h3>連結概念</h3>${chips(nb)}</div>${n.days.length?`<div class="card"><h3>相關每日一偈</h3><div class="chips">${n.days.map(d=>`<button class="chip" data-day="${d}">第${d}天・${esc(DAYS[d-1].title)}</button>`).join('')}</div></div>`:''}
<div class="card"><h3>相關影片</h3>${n.youtube?`<a class="btn" href="${esc(n.youtube)}" target="_blank" rel="noopener">▶ 觀看影片</a>`:`<a class="btn ghost" href="${CFG.channel}" target="_blank" rel="noopener">▶ 前往「${esc(CFG.channelName)}」頻道</a>`}</div>`;sheet.hidden=false}
function go(v,arg){sheet.hidden=true;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===(v==='day'?'today':v)));
if(v==='today'){renderDay(todayIdx());history.replaceState(0,'','#today')}else if(v==='day'){renderDay(arg);history.replaceState(0,'','#day/'+arg)}else if(v==='cal'){renderCal();history.replaceState(0,'','#cal')}else{renderMap();history.replaceState(0,'','#map'+(arg?'/'+arg:''));if(arg)openNode(arg)}scrollTo(0,0)}
document.addEventListener('click',e=>{const t=e.target.closest('[data-day],[data-node],[data-v]');if(!t)return;if(t.dataset.v)go(t.dataset.v);else if(t.dataset.day)go('day',+t.dataset.day);else{if(view.querySelector('#svg'))openNode(t.dataset.node);else go('map',t.dataset.node)}});
$('.close').onclick=()=>sheet.hidden=true;sheet.onclick=e=>{if(e.target===sheet)sheet.hidden=true};
function route(){const h=location.hash.slice(1).split('/');if(h[0]==='day')go('day',+h[1]);else if(h[0]==='map')go('map',h[1]);else if(h[0]==='cal')go('cal');else go('today')}
window.addEventListener('hashchange',route);
Promise.all([fetch('data/days.json').then(r=>r.json()),fetch('data/map.json').then(r=>r.json())]).then(([d,m])=>{DAYS=d;MAP=m;route()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
