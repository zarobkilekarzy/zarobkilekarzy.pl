/* Wspólne dla wariantów: napis „mObywatel Challenge” (powrót do strony konkursu), a na komputerze telefon
   przeskalowany do wysokości okna i panel obok z opisem, funkcjami i instrukcją wariantu (opis.json — ten sam
   plik czyta strona konkursu, src/mobywatel/data.ts). W ramce na stronie konkursu napisu i panelu nie ma.
   Funkcje mogą mieć link do artykułu na zarobkilekarzy.pl (`link`). Język przełącza ?lang=xx (słowniki w i18n/, zob. zloz.mjs). */
(function(){
 const app=document.getElementById('app');if(!app)return;
 const wRamce=window.top!==window.self;
 document.documentElement.classList.toggle('ch-ramka',wRamce);
 if(wRamce){
  /* w ramce na stronie konkursu: cały telefon bazy (390×844 z obręczą 11 px) w skali okna ramki */
  const ramka=()=>{app.style.transform=`scale(${Math.min(innerWidth/(390+24),innerHeight/(844+24))})`};
  ramka();addEventListener('resize',ramka);return;
 }
 const JEZYKI=[['pl','Polski'],['en','English'],['de','Deutsch'],['fr','Français'],['es','Español'],['it','Italiano'],['pt','Português'],['nl','Nederlands'],
  ['cs','Čeština'],['sk','Slovenčina'],['sl','Slovenščina'],['hu','Magyar'],['ro','Română'],['el','Ελληνικά'],['sv','Svenska'],['uk','Українська']];
 const STRONA='/mobywatel/';

 const bar=document.createElement('a');
 bar.className='ch-bar';bar.href=STRONA;
 bar.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span>mObywatel Challenge</span>';
 document.body.prepend(bar);

 /* komputer: scena (telefon w skali) + panel */
 const scena=document.createElement('div');scena.className='ch-scena';
 app.before(scena);scena.append(app);
 const panel=document.createElement('aside');panel.className='ch-panel';panel.setAttribute('aria-label','O prototypie');
 scena.after(panel);
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 fetch('opis.json').then(r=>r.json()).then(o=>{
  const L=window.LANG||'pl';
  panel.innerHTML=`<p class="ch-et">${esc(o.etykieta)}</p><h2 class="ch-tytul">${esc(o.tytul)}</h2><p class="ch-opis">${esc(o.opis)}</p>
   <h3>Funkcje</h3><ul>${o.funkcje.map(f=>`<li>${esc(f.t)}${f.link?` <a class="ch-art" href="${f.link.href}" target="_blank" rel="noopener">${esc(f.link.tekst)} →</a>`:''}</li>`).join('')}</ul>
   <h3>Jak przejść pokaz</h3><ol>${o.instrukcja.map(f=>`<li>${esc(f)}</li>`).join('')}</ol>
   <p class="ch-uwaga">${esc(o.uwaga)}</p>
   <label class="ch-jezyk"><span>Język</span><select data-t="0">${JEZYKI.map(([k,n])=>`<option value="${k}"${k===L?' selected':''}>${n}</option>`).join('')}</select></label>
   <p class="ch-stopka" data-t="0"><a href="${STRONA}">zarobkilekarzy.pl/mobywatel</a></p>`;
  panel.querySelector('select').onchange=e=>{const u=new URL(location.href);u.searchParams.set('lang',e.target.value);location.replace(u.toString())};
 }).catch(()=>{});

 /* telefon 390×844 w ramce bazy: skala do wysokości okna (pod napisem), żeby zmieścił się na laptopie */
 function skaluj(){
  const komputer=matchMedia('(min-width:521px)').matches;
  document.documentElement.classList.toggle('ch-komputer',komputer);
  if(!komputer){app.style.transform='';scena.style.width=scena.style.height='';return}
  const W=390,H=844,margines=22;
  const s=Math.min(1,(innerHeight-bar.offsetHeight-48)/(H+2*margines));
  app.style.transform=`scale(${s})`;app.style.transformOrigin='0 0';
  scena.style.width=(W*s)+'px';scena.style.height=(H*s)+'px';
 }
 skaluj();addEventListener('resize',skaluj);
})();
