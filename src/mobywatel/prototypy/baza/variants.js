/* Warianty układu dokumentów: ?uklad=stos | karuzela | pion | lista | siatka */
const LAYOUTS=[
 ['stos','Stos','Jak dziś w mObywatelu i Apple Wallet'],
 ['karuzela','Karuzela','Duża karta przewijana w bok, akcje pod spodem'],
 ['pion','Pionowa karuzela','Karta na środku, przewijanie w górę i w dół'],
 ['lista','Lista ze statusem','Zdjęcie, dane i alerty w jednym wierszu'],
 ['siatka','Siatka 2×2','Wszystkie dokumenty naraz']
];
let VARIANT=(()=>{const v=new URLSearchParams(location.search).get('uklad');return LAYOUTS.some(l=>l[0]===v)?v:'stos'})();
app.dataset.v=VARIANT;
const ALT=$('#alt');
let carIdx=0;

function openDocQR(id){qrFlow({doc:id})}
function docActions(d){
 const base=[['scan','Potwierdź dane',()=>openDocQR(d.id)],['doc','Szczegóły',()=>openDoc(d.id)]];
 const ctx={dowod:['shield','Zastrzeż PESEL',()=>startTopic('Zastrzeż mój PESEL')],
  kdr:['coin','Partnerzy KDR',()=>startTopic('Gdzie mogę użyć Karty Dużej Rodziny?')],
  leg:['coin','Ulgi studenta',()=>startTopic(OS.ask.leg)],
  pj:['clock','Punkty karne',()=>startTopic('Ile mam punktów karnych?')],
  auto:['car','OC i badanie',()=>startTopic(OS.ask.auto)]}[d.id];
 if(d.id==='dowod')base[0]=['scan','Potwierdź dane',()=>openDocQR(d.id)];
 const ask=['dots','Zapytaj',()=>startTopic(OS.ask[d.id]||'Opowiedz mi o tym dokumencie')];
 return [...base,ctx,ask];
}
const statusH=d=>d.alert?`<span class="bad">${svg('alert')}${d.alert}</span>`:`<span class="good">${svg('check')}${d.sub}</span>`;

function buildAlt(){
 ALT.innerHTML='';ALT.className='alt';
 if(VARIANT==='stos')return;
 if(VARIANT==='karuzela'){
  ALT.innerHTML=`<div class="car" id="car">${DOCS.map(d=>`<button class="ccard dface" style="background-image:url(${d.img})" aria-label="${d.name}" data-id="${d.id}">${faceHTML(d)}</button>`).join('')}</div>
   <div class="dots">${DOCS.map((d,i)=>`<i class="${i===carIdx?'on':''}"></i>`).join('')}</div><div class="cstat" id="cstat"></div><div class="acts" id="acts"></div>`;
  const car=$('#car');
  car.querySelectorAll('.ccard').forEach((c,i)=>c.onclick=()=>{if(i!==carIdx){car.scrollTo({left:i*(c.offsetWidth+12),behavior:'smooth'});return}openDoc(c.dataset.id)});
  let t;car.addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(()=>{const w=car.querySelector('.ccard').offsetWidth+12;const i=Math.max(0,Math.min(DOCS.length-1,Math.round(car.scrollLeft/w)));if(i!==carIdx){carIdx=i;renderActs()}},60)});
  renderActs();
 }
 if(VARIANT==='pion'){
  ALT.innerHTML=`<div class="vwrap"><div class="vcar" id="vcar">${DOCS.map(d=>`<button class="vcard dface" style="background-image:url(${d.img})" aria-label="${d.name}" data-id="${d.id}">${faceHTML(d)}</button>`).join('')}</div>
   <div class="dots vdots">${DOCS.map((d,i)=>`<i class="${i===carIdx?'on':''}"></i>`).join('')}</div></div><div class="cstat" id="cstat"></div><div class="acts" id="acts"></div>`;
  const vc=$('#vcar');
  vc.querySelectorAll('.vcard').forEach((c,i)=>c.onclick=()=>{if(i!==carIdx){vc.scrollTo({top:i*(c.offsetHeight+12),behavior:'smooth'});return}openDoc(c.dataset.id)});
  let raf=0;vc.addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;vDepth()})},{passive:true});
  renderActs();
 }
 if(VARIANT==='lista'){
  ALT.innerHTML=DOCS.map(d=>`<button class="strip" style="background-image:url(${d.strip})" data-id="${d.id}">
   <span class="lead">${d.photo?`<span class="avatar">${PHOTO}</span>`:d.plate?plateH(d.plate):''}</span>
   <span class="st"><b>${d.name}</b><small>${d.id==='dowod'?PRIV(OS.imie+' '+OS.nazwisko,OS.imie):(d.who||OS.imie+' '+OS.nazwisko)}</small><em>${d.id==='dowod'?PRIV(d.line,'Dane ukryte'):d.line}</em></span>
   ${d.alert?`<span class="pill">${d.alert}</span>`:`<span class="chev">${svg('chev')}</span>`}</button>`).join('');
  ALT.querySelectorAll('.strip').forEach(b=>b.onclick=()=>openDoc(b.dataset.id));
 }
 if(VARIANT==='siatka'){
  ALT.innerHTML=`<div class="grid">${DOCS.map(d=>`<button class="gitem" data-id="${d.id}"><span class="gmini dface" style="background-image:url(${d.img})">${faceHTML(d)}</span><span class="gcap"><b>${d.name}</b>${statusH(d)}</span></button>`).join('')}</div>`;
  ALT.querySelectorAll('.gitem').forEach(b=>b.onclick=()=>openDoc(b.dataset.id));
 }
}
function renderActs(){
 const d=DOCS[carIdx];const a=$('#acts');if(!a)return;
 a.innerHTML=docActions(d).map((x,i)=>`<button data-i="${i}"><i>${svg(x[0])}</i><span>${x[1]}</span></button>`).join('');
 const acts=docActions(d);a.querySelectorAll('button').forEach(b=>b.onclick=()=>acts[+b.dataset.i][2]());
 document.querySelectorAll('.alt .dots i').forEach((x,i)=>x.classList.toggle('on',i===carIdx));
 const cs=$('#cstat');if(cs)cs.innerHTML=d.alert?`<span class="bad">${svg('alert')}${d.alert}</span><span class="sep"></span>${d.sub}`:`<span class="good">${svg('check')}Dokument ważny</span><span class="sep"></span>${d.sub}`;
}

function vDepth(){
 const vc=$('#vcar');if(!vc)return;const cards=[...vc.querySelectorAll('.vcard')];if(!cards.length)return;
 const step=cards[0].offsetHeight+12,pos=vc.scrollTop/step;
 cards.forEach((c,i)=>{const d=Math.min(1.4,Math.abs(i-pos));c.style.transform=`scale(${1-0.1*Math.min(1,d)})`;c.style.opacity=1-0.35*Math.min(1,d)});
 const i=Math.max(0,Math.min(DOCS.length-1,Math.round(pos)));if(i!==carIdx){carIdx=i;renderActs()}
}
/* zwraca wysokość zajętą przez wariant */
function layoutAlt(top,h,W){
 ALT.style.top=top+'px';
 if(VARIANT==='karuzela'){
  const compact=h<330;ALT.classList.toggle('compact',compact);
  const actH=0,dotH=10,gaps=12+12+30;
  const cardW=Math.min(W-40,(h-actH-dotH-gaps)*1.5),cardH=cardW/1.5,pad=(W-cardW)/2;
  const car=$('#car');car.style.paddingInline=pad+'px';car.style.scrollPaddingInline=pad+'px';car.style.height=cardH+'px';
  car.querySelectorAll('.ccard').forEach(c=>{c.style.width=cardW+'px';c.style.height=cardH+'px'});
  car.scrollLeft=carIdx*(cardW+12);
  const used=cardH+gaps+dotH+actH,extra=Math.max(0,h-used);
  $('.alt .dots').style.marginTop='14px';$('#cstat').style.marginTop='12px';
  ALT.style.height=h+'px';return h;
 }
 if(VARIANT==='pion'){
  const compact=h<360;ALT.classList.toggle('compact',compact);
  const actH=0,statH=20,gaps=10+12;
  const vh=Math.max(120,h-actH-statH-gaps);
  let cardW=Math.min(W-48,(vh-(compact?36:56))*1.5);const cardH=cardW/1.5;
  const vc=$('#vcar');vc.style.height=vh+'px';const pad=(vh-cardH)/2;vc.style.paddingBlock=pad+'px';vc.style.scrollPaddingBlock=pad+'px';
  vc.querySelectorAll('.vcard').forEach(c=>{c.style.width=cardW+'px';c.style.height=cardH+'px'});
  vc.scrollTop=carIdx*(cardH+12);vDepth();
  $('#cstat').style.marginTop='10px';$('#acts').style.marginTop='12px';
  ALT.style.height=h+'px';return h;
 }
 if(VARIANT==='lista'){
  const rowW=W-32,rowH=Math.max(40,Math.min(104,(h-3*8)/4));
  const s=Math.max(rowW/400,rowH/100),av=Math.round(Math.min(52*s+4,rowH-6)),pl=Math.round(24*s+(52*s-av)/2);ALT.style.setProperty('--av',av+'px');
  ALT.classList.toggle('tight',rowH<70);ALT.classList.toggle('xtight',rowH<52);
  ALT.querySelectorAll('.strip').forEach(b=>{b.style.height=rowH+'px';b.style.paddingLeft=pl+'px'});
  const used=4*rowH+3*8;ALT.style.height=used+'px';return Math.max(used,h);
 }
 if(VARIANT==='siatka'){
  const tw=(W-32-12)/2;let cw=tw,capH=40;
  if(2*(cw/1.5+capH)+12>h){capH=34;cw=Math.max(72,((h-12)/2-capH)*1.5)}
  ALT.classList.toggle('tight',capH<40);
  ALT.querySelectorAll('.gitem').forEach(b=>{b.style.width=tw+'px'});
  ALT.querySelectorAll('.gmini').forEach(m=>{m.style.width=cw+'px';m.style.height=cw/1.5+'px'});
  const used=2*(cw/1.5+capH)+12;ALT.style.height=used+'px';return Math.max(used,h);
 }
 return 0;
}

/* menu rozwijane z góry: przełączanie wariantów */
function setVariant(v){
 if(v===VARIANT){closeMenu();return}
 VARIANT=v;app.dataset.v=v;carIdx=0;buildAlt();layout();renderMenu();closeMenu();
 try{const u=new URL(location.href);u.searchParams.set('uklad',v);history.replaceState(null,'',u.toString())}catch(e){}
}
function renderMenu(){
 const m=$('#lmenu');if(!m)return;
 const mo=m.querySelector('.mo');if(mo){mo.innerHTML=Object.values(OSOBY).map(o=>`<button data-o="${o.id}" class="${o.id===OS.id?'on':''}" aria-label="${o.imie} ${o.nazwisko}, ${o.opis}"><span class="oav" style="background-image:url(assets/foto-${o.id}.jpg)"></span><b>${o.imie}</b><small>${o.opis.split(',')[0]}</small></button>`).join('');
  mo.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.o===OS.id){closeMenu();return}zmienOsobe(b.dataset.o)})}
 m.querySelector('.ml').innerHTML=LAYOUTS.map(([k,t,s])=>`<button data-k="${k}" class="${k===VARIANT?'on':''}"><span class="mi mi-${k}"><i></i><i></i><i></i><i></i></span><span class="mt"><b>${t}</b><small>${s}</small></span>${k===VARIANT?svg('check'):''}</button>`).join('');
 m.querySelectorAll('.ml button').forEach(b=>b.onclick=()=>setVariant(b.dataset.k));
}
function openMenu(){if(app.classList.contains('chatting'))return;closeHist();renderMenu();app.classList.add('menu');$('#title').setAttribute('aria-expanded','true')}
function closeMenu(){app.classList.remove('menu');$('#title').setAttribute('aria-expanded','false')}
$('#title').onclick=()=>app.classList.contains('menu')?closeMenu():openMenu();
$('#lmenu .scrim').onclick=closeMenu;
buildAlt();
