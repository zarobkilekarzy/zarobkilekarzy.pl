/* ---------- wersje językowe: 15 języków (patrz tlumaczenia/README.md) ----------
   Język z ?lang=xx (ustawia strona główna) albo zapamiętany wcześniej. Teksty interfejsu tłumaczy słownik z serwera;
   brakujące teksty zostają po polsku i trafiają do rejestru serwera (bez tłumaczenia maszynowego). Liczby i daty nie należą do klucza ({0}, {1}…). */
(function(){
 const LANGS=['pl','en','de','fr','es','it','pt','nl','cs','sk','sl','hu','ro','el','sv','uk'];
 // język wynika z adresu: /de/aplikacja, /fr/komputer... (bez prefiksu = polski); ?lang= zostaje jako zapas
 let L=(location.pathname.match(/^\/([a-z]{2})\//)||[])[1]||null;
 if(!L||!LANGS.includes(L)){try{L=new URLSearchParams(location.search).get('lang')}catch(e){}}
 if(!L||!LANGS.includes(L))L='pl';
 try{localStorage.setItem('mobLang',L)}catch(e){}
 window.LANG=L;document.documentElement.lang=L;
 window.GLOS=!['mt','ga'].includes(L);if(!window.GLOS)document.documentElement.classList.add('bezglosu');   // brak rozpoznawania i syntezy mowy w tym języku
 const NUM=/\d+(?:[.,:/]\d+)*/g;
 const szablon=s=>{const n=[];return [s.replace(NUM,m=>{n.push(m);return '{'+(n.length-1)+'}'}),n]};
 const wypelnij=(t,n)=>t.replace(/\{(\d+)\}/g,(m,i)=>n[+i]!=null?n[+i]:m);
 const doT=s=>s&&(/\b(OC|PESEL|ZUS|KDR|UFG)\b/.test(s)||/[a-ząćęłńóśźż]/.test(s))&&s.length<=700;
 window.T=s=>{if(L==='pl'||!window.I18N||!s)return s;const [t,n]=szablon(s);const x=window.I18N[t];return x?wypelnij(x,n):s};
 if(L==='pl')return;
 const ATR=['placeholder','aria-label','title','alt'];
 const POM='SCRIPT,STYLE,TEXTAREA,INPUT,SVG,svg,CODE';
 const orig=new WeakMap(),wyn=new WeakMap();   // węzeł -> tekst źródłowy, ostatnio wstawione tłumaczenie
 const kolejka=new Set();let timer=null;
 const pomin=el=>!el||el.closest&&el.closest('[data-t="0"],[data-h],'+POM);
 // [data-h]: zdanie z wyróżnieniem w środku tłumaczone w całości (z tagami), żeby szyk zdania pasował do języka
 function przetlumaczH(el){
  if(el.closest('[data-t="0"]'))return;
  const v=el.innerHTML.trim();if(!v||el.__h===v)return;
  const [t,n]=szablon(v);const x=window.I18N[t];
  if(x){el.innerHTML=wypelnij(x,n);el.__h=el.innerHTML.trim()}else{el.__h=null;kolejka.add(t)}
 }
 const pominA=el=>!el||el.closest&&el.closest('[data-t="0"],SCRIPT,STYLE');
 function przetlumaczTekst(node){
  const v=node.nodeValue;if(!v||!v.trim())return;
  if(wyn.get(node)===v)return;                 // to już nasze tłumaczenie
  orig.set(node,v);
  const s=v.trim();if(!doT(s))return;
  const [t,n]=szablon(s);const x=window.I18N[t];
  if(x){const nv=v.replace(s,wypelnij(x,n));wyn.set(node,nv);if(nv!==v)node.nodeValue=nv}
  else kolejka.add(t);
 }
 function przetlumaczAtr(el,a){
  const v=el.getAttribute(a);if(!v)return;
  const k='__t_'+a;if(el[k]===v)return;
  const s=v.trim();if(!doT(s))return;
  const [t,n]=szablon(s);const x=window.I18N[t];
  if(x){const nv=wypelnij(x,n);el[k]=nv;el.setAttribute(a,nv)}else kolejka.add(t);
 }
 function przejdz(root){
  if(!root)return;
  if(root.nodeType===3){if(!pomin(root.parentElement))przetlumaczTekst(root);return}
  if(root.nodeType!==1)return;
  if(root.matches('[data-h]')){przetlumaczH(root);return}
  if(pomin(root)){if(!pominA(root))ATR.forEach(a=>{if(root.hasAttribute(a))przetlumaczAtr(root,a)});return}
  if(root.nodeType===1&&!pominA(root))ATR.forEach(a=>{if(root.hasAttribute(a))przetlumaczAtr(root,a)});
  const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:n=>{
   if(n.nodeType===1){if(n.matches('[data-h]')){przetlumaczH(n);return NodeFilter.FILTER_REJECT}
    return n.matches('[data-t="0"],'+POM)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP}
   return NodeFilter.FILTER_ACCEPT}});
  let n;while((n=w.nextNode()))przetlumaczTekst(n);
  root.querySelectorAll&&root.querySelectorAll(ATR.map(a=>'['+a+']').join(',')).forEach(el=>{if(!pominA(el))ATR.forEach(a=>el.hasAttribute(a)&&przetlumaczAtr(el,a))});
  if(kolejka.size&&!timer)timer=setTimeout(dosylaj,250);
 }
 async function dosylaj(){
  timer=null;const t=[...kolejka].slice(0,120);t.forEach(x=>kolejka.delete(x));if(!t.length)return;
  try{const r=await fetch('/api/i18n/brak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang:L,teksty:t})});
   const j=await r.json();Object.assign(window.I18N,j.t||{});if(Object.keys(j.t||{}).length)przejdz(document.body)}catch(e){}
  if(kolejka.size)timer=setTimeout(dosylaj,400);
 }
 window.__i18nStart=function(){
  window.I18N=window.I18N||{};
  const mo=new MutationObserver(ms=>{for(const m of ms){
   if(m.type==='childList')m.addedNodes.forEach(przejdz);
   else if(m.type==='characterData'){if(!pomin(m.target.parentElement))przetlumaczTekst(m.target)}
   else if(m.type==='attributes'&&!pominA(m.target))przetlumaczAtr(m.target,m.attributeName)}
   if(kolejka.size&&!timer)timer=setTimeout(dosylaj,250)});
  mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATR});
  if(document.body)przejdz(document.body);
  document.addEventListener('DOMContentLoaded',()=>przejdz(document.body));
 };
 document.write('<script src="/api/i18n.js?lang='+L+'"><\/script>');
})();
