const $=s=>document.querySelector(s);
const app=$('#app'),input=$('#prompt');app.classList.add('ukryte');let msgs=$('#msgs'),inflight=0;
const FAST=!!window.FAST;
function settle(){setTimeout(()=>{inflight--;if(!inflight&&typeof onIdle==='function')onIdle()},0)}
const sleep=ms=>{inflight++;return new Promise(r=>setTimeout(()=>{r();settle()},FAST?5:ms))};
const now=()=>new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
const nowS=()=>new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const today=()=>new Date().toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric'});
function tick(){$('#clock').textContent=new Date().toLocaleTimeString('pl-PL',{hour:'numeric',minute:'2-digit'});const c=$('#dclock');if(c)c.textContent='Czas: '+nowS()+' '+today()}
tick();setInterval(tick,1000);

const I={
 doc:'<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M10 12h5M10 16h5"/>',
 shield:'<path d="M12 3.5 5.5 6v5c0 4.3 2.8 7.8 6.5 9.5 3.7-1.7 6.5-5.2 6.5-9.5V6z"/><path d="m9.2 12 2 2 3.6-3.8"/>',
 car:'<path d="M5 16.5v-4l2-5h10l2 5v4"/><path d="M4 16.5h16v2.5H4z"/><circle cx="8" cy="13.6" r=".9"/><circle cx="16" cy="13.6" r=".9"/>',
 baby:'<circle cx="12" cy="9" r="4.6"/><path d="M10.4 8.6h.01M13.6 8.6h.01M10.6 10.8s.6.6 1.4.6 1.4-.6 1.4-.6M6.8 20c1-2.8 3-4.3 5.2-4.3s4.2 1.5 5.2 4.3"/>',
 mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>',
 alert:'<path d="M12 4.5 3 19.5h18z"/><path d="M12 10v4M12 17h.01"/>',
 check:'<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.6 2.6 4.8-5"/>',
 qr:'<path d="M4.5 4.5h5.5v5.5H4.5zM14 4.5h5.5v5.5H14zM4.5 14h5.5v5.5H4.5zM14 14h2v2h-2zM17.5 17.5h2v2h-2zM14 17.5h2M17.5 14h2"/>',
 coin:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M14.6 9.8c0-1-1.1-1.6-2.6-1.6s-2.6.6-2.6 1.6 1.1 1.5 2.6 1.9 2.6.9 2.6 1.9-1.1 1.7-2.6 1.7-2.6-.6-2.6-1.7"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 id:'<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6 15.5c.6-1.3 1.7-2 3-2s2.4.7 3 2M14.5 10h3M14.5 13h3"/>',
 bell:'<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5zM10 20.5a2 2 0 0 0 4 0"/>',
 db:'<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
 chev:'<path d="m9.5 6 6 6-6 6"/>',
 back:'<path d="m14.5 5-7 7 7 7"/>',
 dots:'<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
 scan:'<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>'
};
const svg=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${I[n]||I.doc}</svg>`;

/* ---------- dokumenty (oficjalne grafiki kart z info.mobywatel.gov.pl) ---------- */
const DOCS=OS.docs;
function plateH(p){return `<span class="plate"><i>PL</i><b>${p}</b></span>`}
/* sylwetka auta z bazy (model i kolor z CEPiK); drugi pojazd mniejszy, z tyłu */
const SY=(m,k,o)=>typeof SYLWETKI!=='undefined'&&m?SYLWETKI.svg(m,k,o):'';
function sylH(d){if(!d.model)return '';const m=(d.more||[])[0];
 return `<span class="syl${m?' two':''}" aria-hidden="true">${m?`<span class="s2">${SY(m.model,m.kolor,{shadow:false})}</span>`:''}<span class="s1">${SY(d.model,d.kolor)}</span></span>`}
function sylBanner(p){if(!p||!p.model||typeof SYLWETKI==='undefined')return '';
 return `<div class="sylban">${SY(p.model,p.kolor,{label:p.model})}${p.nr?`<span class="sylnr">${plateH(p.nr)}</span>`:''}</div>`}
const PHOTO=`<span class="ph" role="img" aria-label="Zdjęcie: ${OS.imie} ${OS.nazwisko}"></span>`;
const LIVE='<span class="live" role="button" aria-label="Mój znak mObywatela: powiększ, aby przyjąć dane"></span>';
/* prywatność: po otwarciu aplikacji mDowód pokazuje tylko zdjęcie i imię */
const PRIV=(full,short)=>`<span class="pvf">${full}</span><span class="pvs">${short}</span>`;
const REVEAL='<span class="reveal" role="button" tabindex="0" aria-label="Pokaż dane z mDowodu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>Pokaż dane</span>';
function shortName(n){const p=n.split(' ');return p.length>1?p.slice(0,-1).join(' '):n}
function faceHTML(d){
 const cells=d.f.map(([k,v])=>`<span><small>${k}</small><b>${v}</b></span>`).join('');
 const ttl=`<span class="ttl">${d.name}</span>`;
 if(d.plate)return `<span class="face">${ttl}${sylH(d)}<span class="ov veh">${plateH(d.plate)}<span class="col"><span class="nm">${d.holder}</span><span class="dl">${cells}</span></span></span></span>`;
 return `<span class="face">${ttl}${d.id==='dowod'?LIVE:''}<span class="ov">${d.photo?PHOTO:''}<span class="col">${d.id==='dowod'?`<span class="nm">${PRIV(d.holder,shortName(d.holder))}</span><span class="dl pv">${cells}</span>${REVEAL}`:`<span class="nm">${d.holder}</span><span class="dl">${cells}</span>`}</span></span></span>`;
}
const STACK_ORDER=DOCS.map(d=>d.id).reverse();
function renderStack(){
 const st=$('#stack');st.innerHTML='';
 STACK_ORDER.map(id=>DOCS.find(d=>d.id===id)).forEach((d,i)=>{const c=document.createElement('button');c.className='card';c.style.backgroundImage=`url(${d.img})`;c.setAttribute('aria-label',d.name);c.style.zIndex=i+1;c.innerHTML=faceHTML(d);
  c.onclick=()=>{if(app.classList.contains('chatting')){exitChat();return}openDoc(d.id)};st.append(c)});
}
renderStack();

/* ---------- układ: wszystko na jednym ekranie ---------- */
function layout(){
 const H=app.clientHeight,W=app.clientWidth,framed=getComputedStyle($('.status')).display!=='none';
 const T=framed?50:Math.max(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat'))||0,6);
 const comp=$('#composer').offsetHeight;
 $('#top').style.top=T+'px';
 const titleTop=T+6; $('#title').style.top=titleTop+'px';app.style.setProperty('--histTop',(T+52)+'px');app.style.setProperty('--voiceTop',(T+52)+'px');app.style.setProperty('--qtopPad',(T+6)+'px');app.style.setProperty('--menuTop',(T+56)+'px');
 const n=DOCS.length;let cardW=W-32,cardH=cardW/1.5;
 const remH=$('#reminders').offsetHeight;
 const chatting=app.classList.contains('chatting');
 const stackTop=chatting?T+54:T+62;
 const remTop=H-comp-remH-6;
 const avail=remTop-14-stackTop;
 const k=1+(n-1)*0.25;
 if(!chatting&&cardH*k>avail){cardH=Math.max(120,avail/k);cardW=cardH*1.5}
 $('#stack').style.width=cardW+'px';$('#stack').style.margin='0 auto';
 let off=Math.max(cardH*0.25,Math.min(76,(avail-cardH)/(n-1)));
 const cards=[...document.querySelectorAll('.card')];
 if(chatting){
  const pocket=78;
  $('#stackwrap').style.top=stackTop+'px';$('#stackwrap').style.height=pocket+'px';$('#stackwrap').style.overflow='hidden';
  cards.forEach((c,i)=>{const j=n-1-i;c.style.zIndex=i+1;c.style.top=(j*7)+'px';c.style.transform=`scale(${.975-j*0.025})`;c.style.transformOrigin='50% 0'});
  const ct=T+52;$('#chat').style.top=ct+'px';$('#chat').style.height=(H-ct-comp+14)+'px';
 }else{
  $('#stackwrap').style.top=stackTop+'px';$('#stackwrap').style.height=((n-1)*off+cardH)+'px';$('#stackwrap').style.overflow='visible';
  cards.forEach((c,i)=>{c.style.zIndex=i+1;c.style.top=(i*off)+'px';c.style.transform='none'});
  const ct=T+54+80;$('#chat').style.top=ct+'px';$('#chat').style.height=(H-ct-comp+14)+'px';
 }
 let used=(n-1)*off+cardH;
 if(!chatting&&typeof layoutAlt==='function'&&VARIANT!=='stos')used=layoutAlt(stackTop,avail,W);
 $('#reminders').style.top=remTop+'px';
}
window.addEventListener('resize',layout);

/* ---------- przypomnienia ---------- */
const TILES=OS.tiles;
{const t=TILES[0],n=TILES.length-1;const b=document.createElement('button');b.className='rsum';b.setAttribute('aria-label','Do załatwienia: '+TILES.length+' sprawy');b.innerHTML=`<span class="rdot">${TILES.length}</span><span class="tx"><b>${t.h}</b><small><em>${t.d}</em> · i ${n} inne sprawy</small></span>${svg('chev')}`;b.onclick=openTodo;$('#tiles').append(b)}

/* ---------- szczegóły dokumentu ---------- */
function qrSVG(seed=7){
 let s=seed;const r=()=>(s=(s*9301+49297)%233280)/233280;const n=25;let p='';
 const fin=(x,y)=>`<rect x="${x}" y="${y}" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/><rect x="${x+1.5}" y="${y+1.5}" width="3" height="3"/>`;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){if((x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16))continue;if(r()>.52)p+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
 return `<svg viewBox="-1 -1 27 27" fill="currentColor" shape-rendering="crispEdges">${p}${fin(0.5,0.5)}${fin(18.5,0.5)}${fin(0.5,18.5)}</svg>`;
}
function rowsH(rows){return rows.map(([k,v])=>`<div class="row"><span>${k}</span><b>${v}</b></div>`).join('')}
function openDoc(id){
 const d=DOCS.find(x=>x.id===id),det=$('#detail');
 const top=getComputedStyle($('.status')).display!=='none'?50:6;
 const hero=id==='dowod'&&d.screen
  ?`<div class="idcard"><div class="crop"><img src="${d.screen}" alt="mDowód: ${OS.imie} ${OS.nazwisko}">${window.LANG&&window.LANG!=='pl'?`<div class="valid idv">${svg('check')}Dokument ważny</div>`:''}</div></div>`
  :`<div class="bigcard" style="background-image:url(${d.img})">${faceHTML(d)}</div><div class="valid">${svg('check')}Dokument ważny</div><div class="ui"><div class="rows" style="padding-top:2px">${rowsH(d.rows)}</div></div>`;
 const q=id==='dowod'?[['scan','Potwierdź swoje dane','qr'],['id','Dane dowodu','data'],['shield','Zastrzeż PESEL','pesel'],['dots','Zapytaj asystenta','ask']]
                     :[['scan','Potwierdź dane','qr'],['doc','Szczegóły','data'],['shield','Zgubiony portfel','lost'],['dots','Zapytaj asystenta','ask']];
 det.innerHTML=`<div style="height:${top}px;flex:none"></div><div class="nav"><button class="back" id="dclose">${svg('back')}Wróć</button><b>${d.name}</b><span></span></div>
  <div class="clock" id="dclock"></div>
  <div class="body">${hero}<div class="quick">${q.map(x=>`<button data-a="${x[2]}"><i>${svg(x[0])}</i>${x[1]}</button>`).join('')}</div><div class="qrbox" id="qrbox"></div></div>`;
 tick();det.classList.add('on');
 $('#dclose').onclick=()=>det.classList.remove('on');
 det.querySelectorAll('.quick button').forEach(b=>b.onclick=()=>{
  const a=b.dataset.a;
  if(a==='qr'){qrFlow({doc:id});return}
  if(a==='data')$('#qrbox').innerHTML=`<div class="ui"><div class="rows" style="padding-top:4px">${rowsH(d.rows)}</div></div>`;
  if(a==='pesel'||a==='lost'){det.classList.remove('on');startTopic(a==='pesel'?'Zastrzeż mój PESEL':rodz('Zgubiłam portfel','Zgubiłem portfel'))}
  if(a==='ask'){det.classList.remove('on');startTopic(OS.ask[id]||'Opowiedz mi o tym dokumencie')}
 });
}

/* ---------- rozmowa ---------- */
const esc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function el(h){const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstElementChild}
function end(){requestAnimationFrame(()=>msgs.scrollTo({top:msgs.scrollHeight,behavior:FAST?'auto':'smooth'}))}
function clearEmpty(){const e=msgs.querySelector('.empty');if(e)e.remove()}
function addUser(t){clearEmpty();msgs.append(el(`<div class="msg user" data-t="0">${esc(t)}</div>`));end();touch('user',t)}
async function say(t){clearEmpty();const ty=el('<div class="typing"><i></i><i></i><i></i></div>');msgs.append(ty);end();await sleep(Math.min(1100,400+t.replace(/<[^>]+>/g,'').length*6));ty.remove();msgs.append(el(`<div class="msg bot">${t}</div>`));end();touch('bot',plain(t))}
function hd(icon,title){return `<div class="hd"><div class="ic">${svg(icon)}</div><div class="tt">${title}</div></div>`}
const srcH=s=>s?`<div class="src">${svg('db')}${s}</div>`:'';
async function card(h){await sleep(160);const c=el(h);msgs.append(c);end();return c}
function info({icon='doc',title,source,rows=[],body='',flag='',note='',tone='',pojazd=null,tl=0}){
 return card(`<div class="ui ${tone}"${tl?' data-t="0"':''}>${hd(icon,title)}${sylBanner(pojazd)}${body?`<div class="body">${body}</div>`:''}${rows.length?`<div class="rows">${rowsH(rows)}</div>`:''}${flag?`<div class="flag">${flag}</div>`:''}${note?`<div class="note">${note}</div>`:''}${srcH(source)}</div>`);
}
const result=o=>info({icon:'check',tone:'ok',...o});
async function confirmCard({icon='doc',title,source,rows,note='',body='',label='Potwierdź',then,onCancel,pojazd=null,tl=0}){
 const c=await card(`<div class="ui"${tl?' data-t="0"':''}>${hd(icon,title)}${sylBanner(pojazd)}${body?`<div class="body">${body}</div>`:''}<div class="rows">${rowsH(rows)}</div>${note?`<div class="note">${note}</div>`:''}<div class="actions"><button class="btn ghost">${(window.T||(s=>s))('Anuluj')}</button><button class="btn primary">${label}</button></div>${srcH(source)}</div>`);
 const [no,ok]=c.querySelectorAll('.btn');
 ok.onclick=()=>act(async()=>{c.querySelector('.actions').remove();await faceid();c.classList.add('done');then&&then()});
 no.onclick=()=>act(()=>{c.querySelector('.actions').remove();onCancel?onCancel():say('Anulowałem. Nic nie zostało wysłane.')});
}
function chips(opts,noT){
 const row=el('<div class="chips"></div>');if(noT)row.dataset.t='0';
 opts.forEach(o=>{const b=el(`<button>${o.label}</button>`);b.onclick=()=>act(()=>{row.remove();pending=null;addUser(o.say||o.label);o.go&&o.go()});row.append(b)});
 msgs.append(row);end();
}
function multi(opts,next,noT){
 const row=el('<div class="chips"></div>'),sel=new Set();if(noT)row.dataset.t='0';
 opts.forEach(o=>{const b=el(`<button>${o}</button>`);b.onclick=()=>{sel.has(o)?sel.delete(o):sel.add(o);b.classList.toggle('sel')};row.append(b)});
 const n=el('<button class="next">Dalej</button>');n.onclick=()=>{if(!sel.size)return;act(()=>{row.remove();const a=opts.filter(o=>sel.has(o));addUser(a.join(', '));next(a)})};row.append(n);
 msgs.append(row);end();
}
function faceid(){inflight++;return new Promise(r=>{const f=$('#faceid');f.classList.add('on');setTimeout(()=>f.classList.add('done'),FAST?5:900);setTimeout(()=>{f.classList.remove('on','done');r();settle()},FAST?10:1450)})}
let pending=null;

function emptyState(box=VIS.el){
 if(box.children.length)return;
 const e=el(`<div class="empty"><h2>W czym mogę pomóc, ${OS.wolacz}?</h2><p>Załatwię sprawę urzędową, sprawdzę dane w rejestrach i pokażę dokument. Zanim cokolwiek wyślę, poproszę o potwierdzenie.</p><div class="sugg"></div></div>`);
 OS.sugg
  .forEach(([a,b])=>{const x=el(`<button><span>${a}<small>${b}</small></span>${svg('chev')}</button>`);x.onclick=()=>send(a);e.querySelector('.sugg').append(x)});
 box.append(e);
}
function enterChat(){if(!app.classList.contains('chatting')){app.classList.add('chatting');emptyState();layout()}}
function exitChat(){closeHist();app.classList.remove('chatting');input.blur();layout()}
function send(t){if(!t)return;enterChat();act(()=>{addUser(t);route(t)})}

/* ---------- rozmowy: osobne wątki z historią (w pamięci, do odświeżenia) ---------- */
const CONVS=[];let VIS=null,WR=null,idleQ=[],convSeq=0;
function mkConv(box){const c={id:++convSeq,el:box||document.createElement('div'),title:'',icon:'doc',last:'',t:Date.now(),pending:null,unread:false};c.el.className='msgs';c.el.removeAttribute('id');CONVS.push(c);return c}
function onIdle(){
 if(WR!==VIS){WR.pending=pending;pending=VIS.pending;WR=VIS;msgs=VIS.el}
 const q=idleQ;idleQ=[];q.forEach(r=>r());renderHist();
}
function idle(){return inflight?new Promise(r=>idleQ.push(r)):Promise.resolve()}
async function act(fn){if(inflight&&WR!==VIS)await idle();fn()}
function switchTo(c){
 if(c===VIS)return;
 $('#chat').replaceChild(c.el,VIS.el);VIS=c;c.unread=false;
 if(!inflight){WR.pending=pending;pending=c.pending;WR=c;msgs=c.el}
 emptyState(c.el);requestAnimationFrame(()=>{c.el.scrollTop=c.el.scrollHeight});renderHist();
}
function newConv(){
 if(!VIS.title){emptyState(VIS.el);return VIS}
 const c=CONVS.find(x=>!x.title&&x!==WR)||mkConv();switchTo(c);return c;
}
function topicIcon(t){const n=norm(t);return /portfel|zgubil|ukrad|zastrz/.test(n)?'shield':/stluczk|kolizj|wypadek|auto|samoch|pojazd|\boc\b|ubezpiecz/.test(n)?'car':/urodzi|dzieck|noworod/.test(n)?'baby':/sms|oszust|dziwn|podejrz/.test(n)?'alert':/skrzynk|pismo|doreczen|urzedu/.test(n)?'mail':/podatek|zaplac|oplat|kdr|duzej rodziny/.test(n)?'coin':/punkt/.test(n)?'clock':/dowod|pesel/.test(n)?'id':/zalatwienia|przypomn/.test(n)?'bell':'doc'}
const plain=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent.replace(/\s+/g,' ').trim()};
function touch(kind,text){
 const c=WR;if(!c)return;c.t=Date.now();
 if(kind==='user'&&!c.title){c.title=text.replace(/^📷\s*/,'Zdjęcie: ');c.icon=topicIcon(text)}
 if(kind==='bot')c.last=text;
 if(c!==VIS)c.unread=true;
 renderHist();
}
const hm=ts=>new Date(ts).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
function renderHist(){
 const list=CONVS.filter(c=>c.title).sort((a,b)=>b.t-a.t);
 const unread=list.some(c=>c.unread);
 const b=$('#histBtn');if(b){b.classList.toggle('has',unread);const n=$('#histCount');n.textContent=list.length>1?list.length:'';n.hidden=list.length<2}
 const h=$('#hlist');if(!h)return;
 h.innerHTML=list.length?list.map(c=>`<button data-c="${c.id}" class="${c===VIS?'on':''}${c.unread?' unread':''}"><span class="hic">${svg(c.icon)}</span><span class="mt"><b>${esc(c.title)}</b><small>${inflight&&c===WR?'<em>pisze…</em>':esc(c.last||'')}</small></span><span class="hr"><time>${hm(c.t)}</time>${c.unread?'<i></i>':''}</span></button>`).join('')
  :`<div class="hempty">${(window.T||(s=>s))('Tu pojawią się Twoje rozmowy.')}</div>`;
 h.querySelectorAll('button').forEach(x=>x.onclick=()=>{switchTo(CONVS.find(c=>c.id===+x.dataset.c));closeHist()});
}
function openHist(){if(!app.classList.contains('chatting'))return;renderHist();app.classList.add('hist');$('#histBtn').setAttribute('aria-expanded','true')}
function closeHist(){app.classList.remove('hist');const b=$('#histBtn');b&&b.setAttribute('aria-expanded','false')}
function startTopic(t,fn){if(VIS.title)newConv();enterChat();act(()=>{addUser(t);fn?fn():route(t)})}
VIS=WR=mkConv(msgs);
app.addEventListener('scroll',()=>{if(app.scrollTop||app.scrollLeft){app.scrollTop=0;app.scrollLeft=0}});

/* ---------- lista spraw do załatwienia (arkusz od dołu) ---------- */
function openTodo(){
 const t=$('#todo');
 t.querySelector('.tl').innerHTML=TILES.map((x,i)=>`<button data-i="${i}" class="${x.u?'urgent':''}"><span class="ti">${svg(x.i)}</span><span class="tx"><b>${x.h}</b><small>${x.d}</small><em>${x.s||''}</em></span>${svg('chev')}</button>`).join('');
 t.querySelectorAll('.tl button').forEach(b=>b.onclick=()=>{const x=TILES[+b.dataset.i];closeTodo();setTimeout(()=>startTopic(x.q||x.h,()=>S[x.k]()),180)});
 app.classList.add('todo');t.setAttribute('aria-hidden','false');
}
function closeTodo(){app.classList.remove('todo');$('#todo').setAttribute('aria-hidden','true')}
$('#todo .scrim').onclick=closeTodo;$('#todoClose').onclick=closeTodo;
$('#todoAsk').onclick=()=>{closeTodo();setTimeout(()=>startTopic('Co mam do załatwienia?',()=>S.todo()),180)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&app.classList.contains('todo'))closeTodo()});
