/* ---------- wariant „Moje zdrowie”: ekrany karty, sprawy w rozmowie ----------
   Dane: wariant-dane.js (ZDROWIE; tam też powiadomienia — sprawy w OS.tiles, jak pismo z urzędu).
   Trzyma się wzorców bazy: ekrany w arkuszu dokumentu (#detail), sprawy w rozmowie z kartą potwierdzenia
   i Face ID. Numerek i recepta mają wygląd papierowego wydruku. Korzysta z funkcji bazy (core.js,
   scenarios.js), samej bazy nie zmienia. */
Object.assign(I,{
 strzykawka:'<path d="m14.5 4.5 5 5M17 7l-9.5 9.5-3 .5.5-3L14.5 4.5M9.5 9.5l2 2M11.5 7.5l2 2M4 20l2.5-2.5"/>',
 heart:'<path d="M12 20s-7.5-4.3-7.5-9.7A4 4 0 0 1 12 8.6a4 4 0 0 1 7.5 1.7C19.5 15.7 12 20 12 20z"/>',
 ticket:'<path d="M4 7.5h16v3a1.8 1.8 0 0 0 0 3.6v3H4v-3a1.8 1.8 0 0 0 0-3.6z"/><path d="M14.5 8v1.5M14.5 11.25v1.5M14.5 14.5V16"/>',
 bill:'<path d="M6.5 3.5h11v17l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.3-1.4z"/><path d="M9.5 8h5M9.5 11.5h5M9.5 15h3"/>',
 hosp:'<path d="M4.5 20.5V8.5l7.5-4 7.5 4v12z"/><path d="M12 9.5v5M9.5 12h5M9.5 20.5v-3h5v3"/>',
 cal:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
 pin:'<path d="M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.25"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
 rx:'<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 17.5V11h2.3a1.7 1.7 0 0 1 0 3.4H9.5M11.8 14.4l2.7 3.1"/>',
 hist:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 5v3.5H8M12 8v4l2.5 1.5"/>',
 scale:'<path d="M12 4v16M6.5 20h11M5 7.5h14M7.5 7.5 5 13h5zM16.5 7.5 14 13h5z"/>',
 user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5"/>',
 probowka:'<path d="M9 3.5h6M10 3.5v6.2L5.4 17.6A2 2 0 0 0 7.1 20.5h9.8a2 2 0 0 0 1.7-2.9L14 9.7V3.5"/><path d="M7.5 14.5h9"/>',
 pobierz:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2"/>',
 portfel:'<path d="M17.5 7.5V5.5a1.5 1.5 0 0 0-1.5-1.5H6a2.5 2.5 0 0 0 0 5h12.5a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H6A2.5 2.5 0 0 1 3.5 18V6.5"/><path d="M16 14.25h.01"/>'
});

const ZD=ZDROWIE,ZD_W=ZD.ostatnia,ZD_D=ZD.dzis;
const zdNr=n=>'K '+String(n).padStart(3,'0');
const zdZl=g=>g==null?'—':(g/100).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' zł';
const zdDataNa=t=>{const [d,m,r]=t.split('.').map(Number);return new Date(r,m-1,d)};
const zdNfz=v=>v.poz?null:v.pozycje.reduce((s,[,g])=>s+(g||0),0);
const zdRxSum=r=>r.leki.reduce((s,l)=>({cena:s.cena+l.cena,ty:s.ty+l.ty}),{cena:0,ty:0});
/* nazwy własne (lekarze, miasta, szpitale) poza słownikiem tłumaczeń bazy (data-t="0" jak w bazie) */
const zdN=n=>`<span data-t="0">${n}</span>`;
/* lista nazw jako osobne węzły — każda nazwa to jeden klucz tłumaczenia, nie sklejka kombinacji */
const zdLista=a=>a.map(x=>`<span>${x}</span>`).join(', ');
/* mapa placówki w aplikacji map telefonu (link uniwersalny) */
const zdMapaH=v=>`<a class="zd-link" href="https://www.google.com/maps/search/?api=1&query=${v.geo[0].toFixed(5)},${v.geo[1].toFixed(5)}" target="_blank" rel="noopener">Pokaż na mapie ${svg('pin')}</a>`;
const zdLekH=n=>`<button class="zd-lek" data-zd-lek="${n}" data-t="0">${n}</button>`;

/* ---------- kolejka w poczekalni: co 30 s wchodzi następna osoba ---------- */
const ZQ={teraz:ZD_D.teraz,nr:parseInt(ZD_D.numerek.replace(/\D/g,''),10)};
const zdPrzed=()=>Math.max(0,ZQ.nr-ZQ.teraz-1);
function zdTick(){
 const p=zdPrzed();
 document.querySelectorAll('[data-zd="teraz"]').forEach(e=>e.textContent=zdNr(ZQ.teraz));
 document.querySelectorAll('[data-zd="przed"]').forEach(e=>e.textContent=String(p));
 document.querySelectorAll('[data-zd="czas"]').forEach(e=>e.textContent=ZQ.teraz>=ZQ.nr
  ?`Twoja kolej — zapraszamy do gabinetu ${ZD_D.miejsce.match(/gabinet (\d+)/)[1]}.`
  :`Szacowany czas: ok. ${(p+1)*ZD_D.minNaOsobe} min.`);
}
setInterval(()=>{if(ZQ.teraz<ZQ.nr){ZQ.teraz++;zdTick()}},30000);

/* ---------- arkusz dokumentu (#detail) jak w bazie: Wróć, nazwa, zegar, treść ----------
   ZD_EKRAN pamięta, jak narysować bieżący ekran — „Wróć” z karty lekarza wraca tam, skąd ją otwarto. */
let ZD_EKRAN=null;
function zdArkusz(tytul,tresc,wstecz,rysuj){
 const det=$('#detail'),top=getComputedStyle($('.status')).display!=='none'?50:6;
 det.innerHTML=`<div style="height:${top}px;flex:none"></div><div class="nav"><button class="back" id="dclose">${svg('back')}Wróć</button><b>${tytul}</b><span></span></div>
  <div class="clock" id="dclock"></div><div class="body">${tresc}</div>`;
 tick();zdTick();det.classList.add('on');ZD_EKRAN=rysuj||null;
 $('#dclose').onclick=wstecz||(()=>det.classList.remove('on'));
}

const zdQueueH=()=>`<div class="zd-q"><div><small>Teraz</small><b data-zd="teraz">${zdNr(ZQ.teraz)}</b></div><div class="me"><small>Twój numerek</small><b>${ZD_D.numerek}</b></div><div><small>Przed Tobą</small><b data-zd="przed">${zdPrzed()}</b></div></div><div class="note" data-zd="czas"></div>`;
const zdPodpisH=()=>`<div class="valid zd-okaz">${svg('id')}<span>Okazanie tej karty w rejestracji jest niezbędne, żeby wizyta się odbyła. Karta zapisuje każdą wizytę pod kolejnym numerem.</span></div>`;
const zdDzisH=()=>`<div class="ui" id="zd-dzis">${hd('ticket','Dziś, '+ZD_D.godz+' · '+ZD_D.poradnia)}${zdQueueH()}
 <div class="rows">${rowsH([['Gdzie',ZD_D.miejsce],['Lekarz',zdLekH(ZD_D.lekarz)]])}</div>${zdMapaH(ZD_D)}
 <div class="actions"><button class="btn ghost" data-zd-a="brak">Zgłoś brak lekarza</button><button class="btn primary" data-zd-a="bilet">Pokaż bilecik</button></div></div>`;
const zdWizytyH=()=>`<div class="ui list" id="zd-wizyty">${hd('cal','Umówione wizyty')}
 ${ZD.umowione.map(v=>`<div class="it"><span class="pip${v.potwierdzona||v.odwolana?' g':''}"></span><span class="x"><b>${v.poradnia}</b><small>${v.data}, ${v.godz} · ${v.kolejka}. w kolejce tego dnia</small></span><a class="zd-mapa-ic" href="https://www.google.com/maps/search/?api=1&query=${v.geo[0].toFixed(5)},${v.geo[1].toFixed(5)}" target="_blank" rel="noopener" aria-label="Pokaż na mapie">${svg('pin')}</a>${v.odwolana?'<span class="zd-st">Odwołana</span>':v.potwierdzona?'<span class="zd-st ok">Potwierdzona</span>':'<button class="go" data-zd-a="potwierdz">Potwierdź</button>'}</div>`).join('')}</div>`;
const zdWizytaRowH=(v,i)=>`<button class="it" data-zd-wiz="${i}"><span class="zd-nr">${v.nr}</span><span class="x"><b>${v.poradnia}</b><small>${v.data} · ${zdN(v.lekarz)}${v.kod?'':' · <span class="zd-warn">bez kodu</span>'}</small></span><span class="zd-kw">${v.poz?'stawka POZ':zdZl(zdNfz(v))}</span></button>`;
const zdHistSumH=()=>`<div class="zd-hsum"><small>W ostatnich 12 miesiącach placówki rozliczyły z NFZ za Twoje wizyty</small><b>${zdZl(ZD.wizyty.reduce((s,v)=>s+(zdNfz(v)||0),0))}</b></div>`;
const ZD_PRAWA_GR={wizyta:'Przy wizycie',sor:'Na SOR',dok:'Dokumentacja i tajemnica'};
/* prawa w kontekście (bilecik, wizyty, SOR): kilka praw i link do wszystkich */
const zdPrawaBoxH=(k,ile=9)=>`<div class="ui">${hd('scale','Twoje prawa '+(k==='sor'?'na SOR':'przy wizycie'))}
 <div class="zd-prs">${ZD.prawa.filter(p=>p.k===k).slice(0,ile).map(p=>`<div class="zd-pr"><b>${p.t}</b><span>${p.s}</span><small>${p.a} ustawy o prawach pacjenta</small></div>`).join('')}
 ${k==='sor'?`<div class="zd-pr"><b>Normy czasu oczekiwania</b><span>Na lekarza czekasz najdłużej: kategoria czerwona — natychmiast, pomarańczowa — 10 min, żółta — 60 min, zielona — 120 min, niebieska — 240 min.</span><small><a href="${ZD.sorNormy}" target="_blank" rel="noopener">rozporządzenie o SOR, § 6 ust. 9</a></small></div>`:''}</div>
 <button class="zd-link" data-zd-prawa="${k}">Wszystkie prawa pacjenta ${svg('chev')}</button></div>`;

/* ---------- ekran karty: karta, podpis, sekcje (ikony jak szybkie akcje bazy), dzisiejsza wizyta ---------- */
const ZD_SEKCJE=[['ticket','Mój numerek','bilet'],['cal','Wizyty','wizyty'],['rx','E-recepty','recepty'],['hist','Historia','historia'],['probowka','Badania','badania'],
 ['strzykawka','Szczepienia','szczepienia'],['shield','Profilaktyka','profilaktyka'],['portfel','Wpłaty i koszty','koszty'],['user','Moi lekarze','lekarze'],['scale','Moje prawa','prawa'],['hosp','SOR na żywo','sor'],['pobierz','Pobierz dane','eksport']];
function zdOpen(){
 const d=DOCS.find(x=>x.id==='zdrowie');
 zdArkusz(d.name,`<div class="bigcard" style="background-image:url(${d.img})">${faceHTML(d)}</div>${zdPodpisH()}
  <div class="ui zd-kod-cta"><div class="actions"><button class="btn primary" data-zd-a="kod">Pokaż kod do rejestracji i apteki</button></div></div>
  <div class="quick zd-sekcje">${ZD_SEKCJE.map(x=>`<button data-zd-a="${x[2]}"><i>${svg(x[0])}</i>${x[1]}</button>`).join('')}</div>
  ${zdDzisH()}${zdDzieciH()}${zdUpowH()}`,null,zdOpen);
}
function zdOdswiez(){const x=$('#zd-wizyty');if(x)x.replaceWith(el(zdWizytyH()))}

const zdOpenDoc=openDoc;
openDoc=function(id){return id==='zdrowie'?zdOpen():zdOpenDoc(id)};

/* ---------- wizyty: dziś i umówione ---------- */
function zdWizytyEkran(){zdArkusz('Wizyty',`${zdDzisH()}${zdWizytyH()}${zdPrawaBoxH('wizyta',3)}`,zdOpen,zdWizytyEkran)}

/* ---------- papierowy wydruk: wirtualny bilecik (wersaliki z CSS — tekst w kodzie zwykły, żeby słownik bazy go tłumaczył) ---------- */
function zdBilet(){
 const dzis=new Date().toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric'});
 zdArkusz('Wirtualny bilecik',`<div class="zd-papier zd-bil">
   <p class="zd-p-gl">${ZD_D.miejsce.split(',')[0]}<br>${ZD_D.poradnia}</p>
   <p class="zd-p-mt">${dzis} · godz. ${ZD_D.godz}</p><div class="zd-p-hr"></div>
   <p class="zd-p-et">Twój numerek</p><div class="zd-p-num">${ZD_D.numerek}</div><div class="zd-p-hr"></div>
   <div class="zd-p-row"><span>Teraz wywoływany</span><b data-zd="teraz">${zdNr(ZQ.teraz)}</b></div>
   <div class="zd-p-row"><span>Przed Tobą</span><b data-zd="przed">${zdPrzed()}</b></div>
   <p class="zd-p-mt" data-zd="czas"></p>
   <div class="zd-qr">${qrSVG(14)}</div>
   <p class="zd-p-mt">${ZD_D.miejsce.split(', ').slice(1).join(', ')} · ${zdN(ZD_D.lekarz)}</p>
   <p class="zd-p-st">Pokaż w rejestracji razem z kartą Moje zdrowie</p></div>
  <div class="ui zd-pod">${zdMapaH(ZD_D)}<div class="actions"><button class="btn ghost" data-zd-a="brak">Zgłoś brak lekarza</button></div></div>
  ${zdPrawaBoxH('wizyta',3)}`,zdOpen,zdBilet);
}

/* ---------- kod wizyty: jednorazowy QR i PIN (60 s) do pokazania w rejestracji i w aptece ----------
   Rejestracja skanuje go przy wizycie (wizyta zapisuje się na karcie), apteka przy wydaniu leków z dopłatą NFZ.
   Kod niesie tylko jednorazowy numer; bez potwierdzenia nie ma rozliczenia z NFZ. Przyciski „W rejestracji” /
   „W aptece” pokazują, co pacjent dostaje po zeskanowaniu. */
const ZD_KOD={pin:'',do:0,seed:1,t:0};
function zdKodNowy(){ZD_KOD.pin=String(100000+Math.floor(Math.random()*900000)).replace(/(\d{3})(\d{3})/,'$1 $2');ZD_KOD.seed=1+Math.floor(Math.random()*999);ZD_KOD.do=Date.now()+60000}
function zdKodTick(){
 const k=$('#zd-kod');if(!k){clearInterval(ZD_KOD.t);ZD_KOD.t=0;return}
 let s=Math.ceil((ZD_KOD.do-Date.now())/1000);
 if(s<=0){zdKodNowy();k.querySelector('.qr svg').outerHTML=qrSVG(ZD_KOD.seed);k.querySelector('.code').textContent=ZD_KOD.pin;s=60}
 k.querySelector('.zd-kod-czas i').style.width=(s/60*100)+'%';
 k.querySelector('[data-zd="kodczas"]').textContent=`Kod ważny jeszcze ${s} s, potem pojawi się nowy.`;
}
function zdKod(dz){
 const d=ZD.dzieci[dz];
 if(Date.now()>ZD_KOD.do||ZD_KOD.dz!==dz){zdKodNowy();ZD_KOD.dz=dz}
 zdArkusz('Kod wizyty',`<div class="ui" id="zd-kod">${hd('scan',d?'Kod dziecka: '+zdN(d.imie+' '+d.nazwisko):'Pokaż w rejestracji albo w aptece')}
   <div class="qr">${qrSVG(ZD_KOD.seed)}<div class="code" data-t="0">${ZD_KOD.pin}</div></div>
   <div class="zd-kod-czas"><i></i></div><div class="note" data-zd="kodczas"></div>
   <div class="zd-prs">
    <div class="zd-pr"><b>W rejestracji</b><span>Rejestracja skanuje kod albo wpisuje PIN. Wizyta zapisuje się na karcie pod kolejnym numerem.</span></div>
    <div class="zd-pr"><b>W aptece</b><span>Farmaceuta skanuje kod przy wydaniu leków z recepty. Recepta trafia do archiwum z godziną wydania.</span></div>
    <div class="zd-pr"><b>Jednorazowy</b><span>Kod działa raz i tylko przez 60 sekund. Nie zawiera Twoich danych, tylko numer, który system łączy z kartą.</span></div></div>
   <div class="note">Placówka nie rozliczy z NFZ wizyty, a apteka leku z dopłatą NFZ, jeśli nie potwierdzisz ich kodem.</div></div>
  <div class="ui">${hd('doc','Pokaz: co się dzieje po zeskanowaniu')}
   <div class="actions"><button class="btn ghost" data-zd-skan="rej"${d?` data-zd-dz="${dz}"`:''}>W rejestracji</button>${d?'':'<button class="btn ghost" data-zd-skan="apt">W aptece</button>'}</div></div>`,d?()=>zdDziecko(dz):zdOpen,()=>zdKod(dz));
 clearInterval(ZD_KOD.t);ZD_KOD.t=setInterval(zdKodTick,1000);zdKodTick();
}

/* ---------- szczepienia: do zrobienia, zaplanowane, wykonane i książeczka (wyciąg z elektronicznej karty) ---------- */
function zdSzczepienia(){
 const s=ZD.szczepienia;
 zdArkusz('Szczepienia',`<div class="ui list">${hd('strzykawka','Do zrobienia')}
   ${s.powt.length?s.powt.map((x,i)=>`<div class="it"><span class="pip"></span><span class="x"><b>${x.n}</b><small>${x.zalegle?`<span class="zd-warn">${x.kiedy}</span>`:x.kiedy} · ${x.zal}</small></span><button class="go" data-zd-szcz="${i}">Umów</button></div>`).join('')
    :'<div class="note">Nie masz zaległych szczepień.</div>'}</div>
  ${s.zapl.length?`<div class="ui list">${hd('cal','Zaplanowane')}${s.zapl.map(x=>`<div class="it"><span class="pip g"></span><span class="x"><b>${x.n}</b><small>${x.data}, ${x.godz} · <span>${x.gdzie}</span></small></span></div>`).join('')}</div>`:''}
  <div class="ui list">${hd('check','Wykonane')}${s.wyk.map(x=>`<div class="it"><span class="pip g"></span><span class="x"><b>${x.n}</b><small>${x.data} · ${x.dawka}</small></span></div>`).join('')}
   <button class="zd-link" data-zd-a="ksiazeczka">Książeczka szczepień ${svg('chev')}</button></div>
  <div class="ui"><div class="note">Zalecenia dla dorosłych z Programu Szczepień Ochronnych na 2026 r.: błonica i tężec — 1 dawka co 10 lat, grypa i COVID-19 — przed sezonem infekcyjnym i w jego trakcie. Widać szczepienia, które przychodnia wpisała do elektronicznej karty szczepień.</div>
   ${srcH('Komunikat GIS, Dz. Urz. MZ 2025 poz. 85')}<a class="zd-link" href="${s.zrodlo}" target="_blank" rel="noopener">Program Szczepień Ochronnych na 2026 r. (PDF) ${svg('chev')}</a></div>`,zdOpen,zdSzczepienia);
}
function zdKsiazeczka(){
 const s=ZD.szczepienia;
 zdArkusz('Książeczka szczepień',`<div class="zd-papier zd-rxp">
   <p class="zd-p-gl">Karta szczepień</p><p class="zd-p-mt">Wyciąg z elektronicznej karty szczepień</p>
   <div class="zd-p-row"><span>Pacjent</span><b>${(OS.imie+' '+OS.nazwisko).toUpperCase()}</b></div>
   <div class="zd-p-row"><span>PESEL</span><b>${OS.moje.pesel}</b></div><div class="zd-p-hr"></div>
   ${s.wyk.map(x=>`<div class="zd-p-lek"><b>${x.n}</b><span>${x.data} · ${x.dawka}</span><span>${x.gdzie}</span></div>`).join('<div class="zd-p-hr zd-p-hr-s"></div>')}
   <div class="zd-p-hr"></div><p class="zd-p-st">Szczepienia, których przychodnia nie wpisała elektronicznie, są tylko w papierowej karcie.</p></div>`,zdSzczepienia,zdKsiazeczka);
}

/* ---------- profilaktyka: bezpłatne programy NFZ według wieku i płci ---------- */
function zdProfilaktyka(){
 const rok=new Date().getFullYear();
 zdArkusz('Profilaktyka',`<div class="ui list zd-prof">${hd('shield','Programy NFZ dla Ciebie')}
   ${ZD.profilaktyka.map((p,i)=>{const moze=!p.nast||p.nast<=rok;return `<div class="it"><span class="pip${moze?'':' g'}"></span><span class="x"><b>${p.n}</b><small>${p.dla}, ${p.co}${p.ost?' · ostatnio '+p.ost:''}</small><small>${moze?'Możesz się zgłosić':'Kolejne badanie od '+p.nast}</small></span>${moze?`<button class="go" data-zd-prof="${i}">Zgłoś się</button>`:''}</div>`}).join('')}</div>
  <div class="ui"><div class="note">Programy są bezpłatne i nie wymagają skierowania. Lista zależy od Twojego wieku i płci.</div>${srcH('NFZ i pacjent.gov.pl')}
   ${ZD.profilaktyka.map(p=>`<a class="zd-link" href="${p.src}" target="_blank" rel="noopener">${p.zr} ${svg('chev')}</a>`).join('')}</div>`,zdOpen,zdProfilaktyka);
}

/* ---------- karty dzieci: lista na ekranie karty i karta dziecka z własnym kodem ---------- */
const zdLat=n=>n===1?'rok':n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'lata':'lat';
const zdDzieciH=()=>ZD.dzieci.length?`<div class="ui list">${hd('baby','Karty dzieci')}${ZD.dzieci.map((d,i)=>`<button class="it" data-zd-dziecko="${i}"><span class="x"><b>${zdN(d.imie+' '+d.nazwisko)}</b><small>${d.wiek} ${zdLat(d.wiek)} · karta ${d.karta}</small></span><span class="go">Pokaż</span></button>`).join('')}</div>`:'';
function zdDziecko(i){
 const d=ZD.dzieci[i],doc=DOCS.find(x=>x.id==='zdrowie');
 const karta={...doc,photo:0,holder:(d.imie+' '+d.nazwisko).toUpperCase(),f:[['Nr karty',d.karta],['Zapisane wizyty',String(d.wizytNaKarcie)]]};
 zdArkusz(zdN(d.imie),`<div class="bigcard" style="background-image:url(${doc.img})">${faceHTML(karta)}</div>
  <div class="valid zd-okaz">${svg('baby')}<span>Kartę dziecka widzi rodzic, który zgłosił je do ubezpieczenia, a drugi rodzic — po upoważnieniu. Od 16 lat dziecko samo przegląda swoje dane.</span></div>
  <div class="ui zd-kod-cta"><div class="actions"><button class="btn primary" data-zd-dzkod="${i}">Pokaż kod dziecka</button></div></div>
  <div class="ui list">${hd('strzykawka','Szczepienia obowiązkowe')}${d.szczep.map(x=>`<div class="it"><span class="pip${x.stan==='teraz'?'':' g'}"></span><span class="x"><b>${x.n}</b><small>${x.kiedy}</small></span>${x.stan==='ok'?'<span class="zd-st ok">Wykonane</span>':x.stan==='teraz'?`<button class="go" data-zd-dzszcz="${i}">Umów</button>`:''}</div>`).join('')}</div>
  <div class="ui list">${hd('hist','Ostatnie wizyty')}${d.wizyty.map(v=>`<div class="it"><span class="zd-nr">${v.nr}</span><span class="x"><b>${v.poradnia}</b><small>${v.data} · kod z karty, ${v.kod}</small></span><span class="zd-kw">${v.poz?'stawka POZ':zdZl(v.kwota)}</span></div>`).join('')}
   <div class="note">Szczepienia według Programu Szczepień Ochronnych na 2026 r. Wizyty dziecka potwierdzasz kodem z jego karty.</div></div>`,zdOpen,()=>zdDziecko(i));
}

/* ---------- osoby upoważnione: kto dostaje informację, dokumentację, wgląd w kartę i dokumentację po śmierci ----------
   Zakresy osobno dla każdej osoby; zmiana po potwierdzeniu twarzą działa od razu we wszystkich placówkach. */
const ZD_ZAKRESY=[
 ['info','Informacja o stanie zdrowia','Lekarz i pielęgniarka mogą tej osobie powiedzieć, co Ci jest, jak przebiega leczenie i jakie jest rokowanie.','art. 9 ust. 3'],
 ['dok','Dokumentacja medyczna','Może odebrać kopię Twojej dokumentacji w każdej placówce.','art. 26 ust. 1'],
 ['karta','Wgląd w kartę Moje zdrowie','Widzi w swoim mObywatelu Twoje wizyty, e-recepty i wyniki badań.','jak upoważnienie w Internetowym Koncie Pacjenta'],
 ['smierc','Także po mojej śmierci','Dostanie Twoją dokumentację, gdy Ciebie zabraknie.','art. 26 ust. 2']];
const zdZakresTxt=o=>{const z=ZD_ZAKRESY.filter(([k])=>o[k]).map(x=>x[1]);return z.length?zdLista(z):'bez dostępu'};
const zdUpowH=()=>{const u=ZD.upowaznienia;return `<div class="ui list">${hd('id','Osoby upoważnione')}
 ${u.osoby.map((o,i)=>`<button class="it" data-zd-upo="${i}"><span class="x"><b>${zdN(o.imie)}</b><small>${o.kto} · ${zdZakresTxt(o)}</small></span>${svg('chev')}</button>`).join('')||'<div class="note">Nikt nie jest upoważniony. Bez upoważnienia placówki nie udzielą nikomu informacji o Twoim zdrowiu.</div>'}
 <button class="zd-link" data-zd-a="upow">Zarządzaj upoważnieniami ${svg('chev')}</button></div>`};
function zdUpowaznieni(zapis){
 const u=ZD.upowaznienia;
 zdArkusz('Osoby upoważnione',`<div class="ui"><div class="note zd-sor-opis">Ty decydujesz, kto dostaje informacje o Twoim zdrowiu i Twoją dokumentację. Każdej osobie ustawiasz zakres osobno, a zmiana działa od razu we wszystkich placówkach.</div></div>
  <div class="ui list">${hd('id','Upoważnione osoby')}
   ${u.osoby.map((o,i)=>`<button class="it" data-zd-upo="${i}"><span class="x"><b>${zdN(o.imie)}</b><small>${o.kto} · <span data-t="0">${o.tel}</span></small><small>${zdZakresTxt(o)}</small></span>${svg('chev')}</button>`).join('')}
   <div class="actions"><button class="btn primary" data-zd-a="upowdodaj">Dodaj osobę</button></div></div>
  <div class="ui">${hd('doc','Po mojej śmierci')}
   <div class="zd-zak"><span><b>Sprzeciw wobec udostępnienia dokumentacji osobom bliskim</b><small>Po Twojej śmierci dokumentację dostaną osoby upoważnione z zakresem „Także po mojej śmierci”, a pozostali bliscy — nie. Bez sprzeciwu może ją dostać także osoba bliska.</small><small>art. 26 ust. 2 ustawy o prawach pacjenta</small></span>
    <button class="zd-sw" role="switch" aria-checked="${u.sprzeciw}" aria-label="Sprzeciw wobec udostępnienia dokumentacji osobom bliskim" data-zd-a="sprzeciw"></button></div>
   ${zapis?`<div class="valid">${svg('check')}Zapisano. Zmiana działa od razu we wszystkich placówkach.</div>`:''}</div>
  <div class="ui">${srcH('Ustawa o prawach pacjenta i Rzeczniku Praw Pacjenta')}<a class="zd-link" href="${u.ustawa}" target="_blank" rel="noopener">Tekst ustawy ${svg('chev')}</a></div>`,zdOpen,()=>zdUpowaznieni());
}
function zdUpowOsoba(i,zapis){
 const o=ZD.upowaznienia.osoby[i];
 zdArkusz('Upoważnienie',`<div class="ui">${hd('id',zdN(o.imie))}
   <div class="rows">${rowsH([['Kim jest',o.kto],['Telefon',`<a class="zd-tel" href="tel:${o.tel.replace(/\s/g,'')}" data-t="0">${o.tel}</a>`]])}</div></div>
  <div class="ui">${hd('scale','Zakres upoważnienia')}
   ${ZD_ZAKRESY.map(([k,t,op,pod])=>`<div class="zd-zak"><span><b>${t}</b><small>${op}</small><small>${pod}</small></span><button class="zd-sw" role="switch" aria-checked="${!!o[k]}" aria-label="${t}" data-zd-sw="${k}"></button></div>`).join('')}
   ${zapis?`<div class="valid">${svg('check')}Zapisano. Zmiana działa od razu we wszystkich placówkach.</div>`:''}
   <div class="actions"><button class="btn ghost" data-zd-upocof="${i}">Cofnij upoważnienie</button><button class="btn primary" data-zd-upozap="${i}">Zapisz zmiany</button></div></div>`,zdUpowaznieni,()=>zdUpowOsoba(i));
}

/* ---------- e-recepty: bieżące i archiwum z wyszukiwarką ---------- */
const zdRxSzukaj=(r,q)=>!q||norm([r.kod,r.lekarz,...r.leki.map(l=>l.n),r.zrealizowana?r.zrealizowana.apteka:''].join(' ')).includes(norm(q));
function zdRxListaH(q=''){
 const wiersz=(r,i)=>{const s=zdRxSum(r);return `<button class="it" data-zd-rx="${i}"><span class="pip${r.zrealizowana?' g':''}"></span><span class="x"><b>${zdLista(r.leki.map(l=>l.n))}</b><small>${r.zrealizowana
   ?`Zrealizowana ${r.zrealizowana.data} · płacisz ${zdZl(s.ty)} · NFZ dopłacił ${zdZl(s.cena-s.ty)}`
   :`Kod ${r.kod} · płacisz ${zdZl(s.ty)} · NFZ dopłaca ${zdZl(s.cena-s.ty)}`}</small></span><span class="go">Pokaż</span></button>`};
 const lista=ZD.recepty.map((r,i)=>[r,i]).filter(([r])=>zdRxSzukaj(r,q));
 const grupa=(t,rx)=>rx.length?`<div class="ui list">${hd('rx',t)}${rx.map(([r,i])=>wiersz(r,i)).join('')}</div>`:'';
 return lista.length?grupa('Do wykupienia',lista.filter(([r])=>!r.zrealizowana))+grupa('Zrealizowane',lista.filter(([r])=>r.zrealizowana))
  :`<div class="ui"><div class="note zd-sor-opis">Nie ma recepty z takim lekiem, lekarzem ani kodem.</div></div>`;
}
let ZD_RX_Q='';
function zdReceptyEkran(){
 zdArkusz('E-recepty',`<div class="ui zd-sor-szukaj"><label class="zd-szukaj">${svg('search')}<input type="search" id="zd-rx-q" placeholder="Lek, lekarz albo kod recepty" autocomplete="off" value="${ZD_RX_Q.replace(/"/g,'&quot;')}"></label></div>
  <div id="zd-rx-lista">${zdRxListaH(ZD_RX_Q)}</div>`,zdOpen,zdReceptyEkran);
 $('#zd-rx-q').addEventListener('input',e=>{ZD_RX_Q=e.target.value;$('#zd-rx-lista').innerHTML=zdRxListaH(ZD_RX_Q)});
}

/* ---------- papierowy wydruk: e-recepta z dopłatą NFZ; zrealizowana ma pieczątkę apteki ---------- */
function zdRecepta(i){
 const r=ZD.recepty[i],s=zdRxSum(r);
 zdArkusz('E-recepta',`<div class="zd-papier zd-rxp">
   ${r.zrealizowana?`<div class="zd-p-stamp"><span>Zrealizowana</span><small>${r.zrealizowana.data}</small><small>${r.zrealizowana.apteka}</small>${r.zrealizowana.kod?`<small>kod z karty, ${r.zrealizowana.kod}</small>`:''}</div>`:''}
   <p class="zd-p-gl">Recepta</p><p class="zd-p-mt">Informacja dla pacjenta</p>
   <div class="zd-p-kod"><span>Kod dostępu</span><b>${r.kod}</b></div>
   <div class="zd-p-row"><span>Pacjent</span><b>${(OS.imie+' '+OS.nazwisko).toUpperCase()}</b></div>
   <div class="zd-p-row"><span>PESEL</span><b>${OS.moje.pesel}</b></div>
   <div class="zd-p-row"><span>Wystawiona</span><b>${r.data}</b></div>
   <div class="zd-p-row"><span>Ważna do</span><b>${r.wazna}</b></div>
   <div class="zd-p-row"><span>Lekarz</span><b>${zdN(r.lekarz)}</b></div><div class="zd-p-hr"></div>
   ${r.leki.map(l=>`<div class="zd-p-lek"><b>${l.n}</b><span>${l.op} · ${l.d}</span>
    <div class="zd-p-row"><span>Odpłatność</span><b>${l.odp}</b></div>
    <div class="zd-p-row"><span>Cena w aptece</span><b>${zdZl(l.cena)}</b></div>
    <div class="zd-p-row"><span>Ty płacisz</span><b>${zdZl(l.ty)}</b></div>
    <div class="zd-p-row zd-p-nfz"><span>NFZ dopłaca</span><b>${zdZl(l.cena-l.ty)}</b></div></div>`).join('<div class="zd-p-hr zd-p-hr-s"></div>')}
   <div class="zd-p-hr"></div>
   <div class="zd-p-row zd-p-sum"><span>Razem płacisz</span><b>${zdZl(s.ty)}</b></div>
   <div class="zd-p-row zd-p-sum zd-p-nfz"><span>NFZ dopłaca</span><b>${zdZl(s.cena-s.ty)}</b></div>
   <p class="zd-p-st">Kwoty przykładowe — cena zależy od apteki i wybranego zamiennika.</p></div>
  <div class="ui"><div class="rows">${rowsH([['Lekarz',zdLekH(r.lekarz)]])}</div>
   <div class="actions"><button class="btn ghost" data-zd-adr="${i}">Zgłoś działanie niepożądane</button></div></div>`,zdReceptyEkran,()=>zdRecepta(i));
}

/* ---------- historia wizyt i rachunek każdej ---------- */
function zdHistoria(){
 zdArkusz('Historia wizyt',`<div class="ui list">${hd('hist','Wizyty zapisane na karcie')}${zdHistSumH()}${ZD.wizyty.map(zdWizytaRowH).join('')}
  <div class="note zd-hnote">Numer to kolejny zapis na karcie. Wizyty u lekarza rodzinnego nie mają osobnej kwoty: NFZ płaci przychodni stałą stawkę za każdego zapisanego pacjenta. Kwoty w prototypie są przykładowe.</div></div>`,zdOpen,zdHistoria);
}
function zdRachunek(i){
 const v=ZD.wizyty[i];
 zdArkusz('Wizyta nr '+v.nr,`<div class="ui">${hd('bill','Rachunek za wizytę nr '+v.nr)}
  <div class="rows">${rowsH([['Wizyta',v.poradnia+', '+v.data],['Gdzie',v.miejsce],['Lekarz',zdLekH(v.lekarz)],
   ['Obecność',v.kod?'kod z karty, '+v.kod:'<span class="zd-warn">bez potwierdzenia kodem</span>']])}</div>
  ${v.kod?'':'<div class="flag zd-ostrzezenie">Placówka rozliczyła tę wizytę z NFZ, ale wizyta nie ma potwierdzenia Twoim kodem z karty. Jeśli Cię tam nie było, zgłoś to.</div>'}
  <div class="rows zd-poz">${rowsH(v.pozycje.map(([n,g])=>[n,v.poz?'w stawce POZ':zdZl(g)]))}</div>
  <div class="rows zd-sum">${rowsH([['Placówka rozlicza z NFZ',v.poz?'stawka za pacjenta':zdZl(zdNfz(v))],['Twoja dopłata',zdZl(v.doplata)]])}</div>
  <div class="note">${v.poz||'Rachunek przychodzi po każdej wizycie, a wizyta zapisuje się na karcie z kolejnym numerem. Kwoty w prototypie są przykładowe.'}</div>
  <div class="actions"><button class="btn ghost" data-zd-niebylo="${i}">Tej wizyty nie było</button><button class="btn primary" data-zd-ocen="${i}">Oceń wizytę</button></div>${srcH('Rozliczenie placówki z NFZ')}</div>`,zdHistoria,()=>zdRachunek(i));
}

/* ---------- wpłaty i koszty: składka zdrowotna a leczenie widoczne na karcie (12 miesięcy) ---------- */
function zdKosztyLicz(){
 const wiz=ZD.wizyty.reduce((s,v)=>s+(zdNfz(v)||0),0);
 const leki=ZD.recepty.filter(r=>r.zrealizowana).reduce((s,r)=>{const x=zdRxSum(r);return s+x.cena-x.ty},0);
 const poz=Math.round(ZD.poz.stawka*ZD.poz.wsp);
 return {wpl:ZD.skladka.mies*12,wiz,leki,poz,suma:wiz+leki+poz};
}
function zdKoszty(){
 const k=zdKosztyLicz(),sk=ZD.skladka,max=Math.max(k.wpl,k.suma,1),pas=v=>`<i style="width:${Math.max(2,Math.round(v/max*100))}%"></i>`;
 const wplaty=sk.rodzaj==='rodzina'
  ?`<div class="note zd-sor-opis">Jesteś zgłoszony do ubezpieczenia przez rodzica jako członek rodziny — dziecko uczące się do 26 lat. Składki nie płacisz, a NFZ finansuje Twoje leczenie tak samo.</div>${srcH('Ustawa o świadczeniach opieki zdrowotnej, art. 5 pkt 3')}`
  :`<div class="rows">${rowsH(sk.rodzaj==='etat'
    ?[['Wynagrodzenie brutto',zdZl(sk.brutto)+' / mies.'],['Podstawa składki',zdZl(sk.podstawa)],['Składka zdrowotna 9%',zdZl(sk.mies)+' / mies.'],['Razem w 12 miesiącach',zdZl(k.wpl)]]
    :[['Dochód z działalności',zdZl(sk.dochod)+' / mies.'],['Składka zdrowotna 9% dochodu',zdZl(sk.mies)+' / mies.'],['Razem w 12 miesiącach',zdZl(k.wpl)]])}</div>
   ${sk.rodzaj==='etat'?'<div class="note">Podstawa składki to wynagrodzenie brutto bez składek społecznych płaconych przez pracownika (13,71%).</div>':''}
   ${srcH('Ustawa o świadczeniach opieki zdrowotnej, art. 79 i 81 · ZUS')}`;
 zdArkusz('Wpłaty i koszty',`<div class="ui">${hd('portfel','Ostatnie 12 miesięcy')}
   <div class="zd-bil-k"><div><small>Wpłaciłeś: składka zdrowotna</small><b>${zdZl(k.wpl)}</b><span class="zd-pas wpl">${pas(k.wpl)}</span></div>
    <div><small>Zużyłeś: Twoje leczenie</small><b>${zdZl(k.suma)}</b><span class="zd-pas uzy">${pas(k.suma)}</span></div></div>
   <div class="note">Składka nie jest oszczędnością na Twoim koncie. NFZ działa solidarnie: ze składek wszystkich opłaca leczenie każdego ubezpieczonego — także dzieci, seniorów i osób w szpitalu.</div></div>
  <div class="ui zd-k">${hd('doc','Wpłaty')}${wplaty}</div>
  <div class="ui zd-k">${hd('bill','Koszty Twojego leczenia')}
   <div class="rows">${rowsH([['Wizyty rozliczone z NFZ',zdZl(k.wiz)],['Dopłaty NFZ do leków',zdZl(k.leki)],['Lekarz rodzinny — stawka za Ciebie',zdZl(k.poz)],['Razem',zdZl(k.suma)]])}</div>
   <div class="note">Stawka lekarza rodzinnego: 232,56 zł rocznie × współczynnik wieku ${ZD.poz.wsp.toFixed(2).replace('.',',')} (zarządzenie Prezesa NFZ 65/2026/DSOZ). Zestawienie obejmuje koszty widoczne na karcie — bez np. ratownictwa medycznego. Wynagrodzenie, wizyty i leki w prototypie są przykładowe.</div>
   <div class="actions"><button class="btn ghost" data-zd-a="historia">Historia wizyt</button><button class="btn ghost" data-zd-a="recepty">E-recepty</button></div></div>`,zdOpen,zdKoszty);
}

/* ---------- badania i zabiegi: każde z kwotą (albo „w stawce POZ”) i zgłoszeniem, że go nie wykonano ---------- */
const zdBadKwota=b=>b.poz?'stawka POZ':zdZl(b.kwota);
function zdBadania(){
 zdArkusz('Badania i zabiegi',`<div class="ui list">${hd('probowka','Wykonane badania i zabiegi')}
  ${ZD.badania.map((b,i)=>`<button class="it" data-zd-bad="${i}"><span class="x"><b>${b.nazwa}</b><small>${b.data} · <span>${b.miejsce.split(',')[0]}</span></small></span><span class="zd-kw">${zdBadKwota(b)}</span></button>`).join('')}
  <div class="note zd-hnote">Badania zlecone przez lekarza rodzinnego NFZ opłaca w stałej stawce za pacjenta, więc nie mają osobnej kwoty. Jeśli któregoś badania nie było, zgłoś to — tak jak wizytę.</div></div>`,zdOpen,zdBadania);
}
function zdBadanie(i){
 const b=ZD.badania[i];
 zdArkusz(b.nazwa,`<div class="ui">${hd('probowka',b.nazwa)}
  <div class="rows">${rowsH([['Data',b.data],['Gdzie',b.miejsce],['Lekarz',zdLekH(b.lekarz)],...(b.wizyta?[['Wizyta na karcie','nr '+b.wizyta]]:[]),['Rozliczone z NFZ',b.poz?'w stawce POZ':zdZl(b.kwota)]])}</div>
  <div class="actions"><button class="btn ghost" data-zd-badnb="${i}">Tego badania nie wykonano</button></div>${srcH('Rozliczenie placówki z NFZ')}</div>`,zdBadania,()=>zdBadanie(i));
}

/* ---------- pobierz dane: eksport karty w otwartych formatach (HL7 FHIR R4 jako JSON, Markdown) ----------
   Plik powstaje w przeglądarce (bez serwera) po potwierdzeniu Face ID. */
const zdIso=t=>{const [d,m,r]=t.split('.');return `${r}-${m}-${d}`};
function zdFhir(){
 const pac={reference:'Patient/pacjent'},e=[];
 const r=(resource)=>e.push({fullUrl:`urn:uuid:${resource.resourceType.toLowerCase()}-${resource.id}`,resource});
 r({resourceType:'Patient',id:'pacjent',identifier:[{system:'urn:oid:2.16.840.1.113883.3.4424.1.1.616',value:OS.moje.pesel}],name:[{family:OS.nazwisko,given:[OS.imie]}],birthDate:zdIso(OS.moje.data_urodzenia)});
 r({resourceType:'Coverage',id:'nfz',status:'active',beneficiary:pac,payor:[{display:'Narodowy Fundusz Zdrowia (NFZ)'}]});
 ZD.wizyty.forEach(v=>{
  r({resourceType:'Encounter',id:'wizyta-'+v.nr,status:'finished',class:{system:'http://terminology.hl7.org/CodeSystem/v3-ActCode',code:'AMB',display:'ambulatory'},
   identifier:[{system:'urn:moje-zdrowie:wizyta',value:String(v.nr)}],type:[{text:v.poradnia}],subject:pac,participant:[{individual:{display:v.lekarz}}],
   period:{start:zdIso(v.data)},serviceProvider:{display:v.miejsce}});
  v.pozycje.forEach(([n,g],j)=>r({resourceType:'ChargeItem',id:`wizyta-${v.nr}-${j+1}`,status:'billed',code:{text:n},subject:pac,context:{reference:'Encounter/wizyta-'+v.nr},
   ...(v.poz?{note:[{text:'w stawce POZ (kapitacja) — bez osobnej kwoty'}]}:{priceOverride:{value:g/100,currency:'PLN'}})}));
 });
 ZD.badania.forEach((b,i)=>r({resourceType:'Procedure',id:'badanie-'+(i+1),status:'completed',code:{text:b.nazwa},subject:pac,performedDateTime:zdIso(b.data),
  performer:[{actor:{display:b.lekarz}}],location:{display:b.miejsce},...(b.wizyta?{encounter:{reference:'Encounter/wizyta-'+b.wizyta}}:{})}));
 ZD.recepty.forEach(x=>x.leki.forEach((l,j)=>r({resourceType:'MedicationRequest',id:`recepta-${x.kod}-${j+1}`,status:x.zrealizowana?'completed':'active',intent:'order',
  identifier:[{system:'urn:moje-zdrowie:kod-recepty',value:x.kod}],medicationCodeableConcept:{text:l.n+', '+l.op},subject:pac,authoredOn:zdIso(x.data),requester:{display:x.lekarz},
  dosageInstruction:[{text:l.d}],note:[{text:`odpłatność ${l.odp}; cena ${zdZl(l.cena)}; pacjent ${zdZl(l.ty)}; NFZ ${zdZl(l.cena-l.ty)}`}]})));
 return JSON.stringify({resourceType:'Bundle',type:'collection',timestamp:new Date().toISOString(),
  meta:{tag:[{display:'Prototyp mObywatela (zarobkilekarzy.pl) — dane fikcyjne'}]},entry:e},null,2);
}
function zdMarkdown(){
 const k=zdKosztyLicz(),t=[];
 t.push(`# Moje zdrowie — ${OS.imie} ${OS.nazwisko}`,'',`Eksport z ${new Date().toLocaleDateString('pl-PL')}. Prototyp mObywatela (zarobkilekarzy.pl) — dane fikcyjne.`,'');
 t.push('## Wizyty','','| Nr | Data | Poradnia | Lekarz | Rozliczone z NFZ |','|---|---|---|---|---|',...ZD.wizyty.map(v=>`| ${v.nr} | ${v.data} | ${v.poradnia} | ${v.lekarz} | ${v.poz?'stawka POZ':zdZl(zdNfz(v))} |`),'');
 t.push('## Badania i zabiegi','','| Data | Badanie | Gdzie | Rozliczone z NFZ |','|---|---|---|---|',...ZD.badania.map(b=>`| ${b.data} | ${b.nazwa} | ${b.miejsce} | ${b.poz?'stawka POZ':zdZl(b.kwota)} |`),'');
 t.push('## E-recepty','',...ZD.recepty.map(x=>`- ${x.data}, ${x.lekarz}, ${x.zrealizowana?'zrealizowana '+x.zrealizowana.data:'do wykupienia'}: `+x.leki.map(l=>`${l.n} (${l.op}; ${l.d}; płacisz ${zdZl(l.ty)}, NFZ ${zdZl(l.cena-l.ty)})`).join('; ')),'');
 t.push('## Wpłaty i koszty (12 miesięcy)','',`- Składka zdrowotna: ${zdZl(k.wpl)}`,`- Wizyty rozliczone z NFZ: ${zdZl(k.wiz)}`,`- Dopłaty NFZ do leków: ${zdZl(k.leki)}`,`- Lekarz rodzinny (stawka za pacjenta): ${zdZl(k.poz)}`,`- Razem koszty: ${zdZl(k.suma)}`,'');
 return t.join('\n');
}
function zdPobierz(rodzaj){
 const json=rodzaj==='fhir',tresc=json?zdFhir():zdMarkdown();
 const nazwa=`moje-zdrowie-${new Date().toISOString().slice(0,10)}.${json?'fhir.json':'md'}`;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([tresc],{type:json?'application/fhir+json':'text/markdown'}));a.download=nazwa;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 const st=$('#zd-eksport-stan');if(st)st.innerHTML=`<span>Zapisano plik:</span> <span data-t="0">${nazwa}</span>`;
}
function zdEksport(){
 zdArkusz('Pobierz dane',`<div class="ui">${hd('pobierz','Pobierz swoje dane')}
  <div class="note zd-sor-opis">Plik z Twoimi danymi z karty Moje zdrowie: wizyty i rachunki, badania i zabiegi, e-recepty, wpłaty i koszty. W otwartym formacie — do pracy z asystentem AI działającym na Twoim komputerze.</div>
  <div class="flag zd-ostrzezenie">To Twoje prywatne dane medyczne. Nie wklejaj ich do ChatGPT ani innych czatów w chmurze — trafią na serwery obcej firmy. Używaj ich z modelem uruchomionym lokalnie, np. polskim Bielikiem.</div>
  <div class="rows">${rowsH([['HL7 FHIR (JSON)','międzynarodowy standard danych medycznych'],['Markdown','zwykły tekst, łatwy do czytania dla modelu']])}</div>
  <div class="actions"><button class="btn ghost" data-zd-pobierz="md">Markdown</button><button class="btn primary" data-zd-pobierz="fhir">FHIR (JSON)</button></div>
  <p class="note" id="zd-eksport-stan" role="status"></p></div>`,zdOpen,zdEksport);
}

/* ---------- moi lekarze: z wizyt i recept, każdy prowadzi do wpisu w rejestrze ---------- */
function zdLekarzeEkran(){
 const imiona=[...new Set([ZD_D.lekarz,...ZD.umowione.map(v=>v.lekarz),...ZD.wizyty.map(v=>v.lekarz),...ZD.recepty.map(r=>r.lekarz)])].filter(n=>ZD.lekarze[n]);
 zdArkusz('Moi lekarze',`<div class="ui list">${hd('user','Lekarze z Twoich wizyt i recept')}
  ${imiona.map(n=>{const l=ZD.lekarze[n];return `<button class="it" data-zd-lek="${n}"><span class="x"><b>${zdN(n)}</b><small>${l.spec.length?l.spec.map(([s])=>s).join(', '):'lekarz dentysta'}</small></span>${svg('chev')}</button>`}).join('')}
  <div class="note zd-hnote">Dotknij lekarza, żeby zobaczyć wpis w rejestrze: prawo wykonywania zawodu i specjalizacje.</div></div>`,zdOpen,zdLekarzeEkran);
}

/* ---------- moje prawa ---------- */
function zdPrawa(k){
 zdArkusz('Moje prawa',`${Object.entries(ZD_PRAWA_GR).map(([g,t])=>`<div class="ui" id="zd-pr-${g}">${hd('scale',t)}<div class="zd-prs">${ZD.prawa.filter(p=>p.k===g).map(p=>`<div class="zd-pr"><b>${p.t}</b><span>${p.s}</span><small><a href="${ZD.ustawa}" target="_blank" rel="noopener">${p.a} ustawy o prawach pacjenta</a></small></div>`).join('')}</div></div>`).join('')}
  <div class="ui">${hd('alert','Gdy coś poszło nie tak')}<div class="rows">${rowsH([['Informacja Pacjenta',`<a href="tel:+48800190590">${ZD.rpp.tel}</a>`],['Kiedy','bezpłatnie, całą dobę'],['Rzecznik Praw Pacjenta',ZD.rpp.mail]])}</div>
   <div class="actions"><button class="btn primary" data-zd-a="rpp">Złóż skargę do Rzecznika</button></div>
   <a class="zd-link" href="${ZD.rpp.duzyDruk}" target="_blank" rel="noopener">Karta praw pacjenta w dużym druku (PDF) ${svg('chev')}</a>
   ${srcH('Ustawa o prawach pacjenta i RPP, Dz.U. 2024 poz. 581 · zarobkilekarzy.pl/prawa-pacjenta')}</div>`,zdOpen,()=>zdPrawa(k));
 if(k){const g=$('#zd-pr-'+k);g&&g.scrollIntoView({block:'start'})}
}

/* ---------- sprawdź lekarza: wpis w rejestrze lekarzy (bez orzeczeń) ---------- */
function zdLekarz(n){
 const l=ZD.lekarze[n],wroc=ZD_EKRAN||zdOpen;
 if(!l)return;
 zdArkusz('Lekarz',`<div class="ui">${hd('user',zdN(n))}
  <div class="valid zd-pwz">${svg('check')}Prawo wykonywania zawodu ważne</div>
  <div class="rows">${rowsH([['Numer PWZ',l.pwz],['Zawód',l.dent?'lekarz dentysta':'lekarz'],['Prawo wykonywania zawodu od',l.od],['Izba lekarska',ZD.izba]])}</div>
  ${l.spec.length?`<div class="rows">${rowsH(l.spec.map(([s,r])=>['Specjalista',s+' ('+r+')']))}</div>`:''}
  <div class="note">Te same dane są w publicznym rejestrze lekarzy. W prototypie wpis jest fikcyjny.</div>
  ${srcH('Centralny Rejestr Lekarzy, Naczelna Izba Lekarska')}</div>`,wroc,()=>zdLekarz(n));
}

/* ---------- SOR na żywo: mapa jak „Kolejki na SOR” na zarobkilekarzy.pl ----------
   Geometria, nazwy i współrzędne: sor-mapa.json (narzedzia/sor-mapa.mjs, z builda strony). Kolejki: migawka TOPSOR,
   którą co 2 minuty uzupełnia Worker strony (dane.zarobkilekarzy.pl, CORS dla każdej domeny). Kolor i normy liczone
   jak w lib/sor/measure.ts strony: rozporządzenie o SOR, § 6 ust. 9 (Dz.U. 2025 poz. 1646).
   Ekran ma część stałą (pole wyszukiwania, przycisk „najbliższe”) i trzy części odświeżane osobno — przeładowanie
   migawki nie gubi tekstu wpisywanego w wyszukiwarkę. */
const SOR_URL='https://dane.zarobkilekarzy.pl/sor/teraz.json';
const SOR_ETAPY=[['Rejestracja'],['Triaż'],['Najwyższy','czerwony',0],['Wysoki','pomarańczowy',10],['Średni','żółty',60],['Niski','zielony',120],['Najniższy','niebieski',240]];
const SOR_KLASY=['nikt nie czeka na lekarza','czas w normie','ponad normę','ponad 2× normę'];
const SOR={mapa:null,teraz:null,wyb:null,blad:false,timer:0,tryb:'',q:'',ja:null};
const zdOs=n=>n===1?'osoba':n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'osoby':'osób';
const zdLiczba=n=>n.toLocaleString('pl-PL');
const sorMin=w=>{if(!w)return null;let m=/^(\d+)\s*min/.exec(w);if(m)return +m[1];m=/^powyżej\s+(\d+)\s+godzin/.exec(w);return m?+m[1]*60+1:null};
function sorPomiar(e){
 let ktos=false,cls=0;
 const over=e.map(([n,w],i)=>{const norm=SOR_ETAPY[i][2];if(norm==null||!n)return false;ktos=true;const low=sorMin(w);if(norm===0||low==null)return false;
  const r=low/norm;cls=Math.max(cls,r>2?3:r>1?2:1);return r>1});
 return {cls:ktos&&cls===0?null:cls,przed:e.reduce((s,[n])=>s+(n||0),0),over};
}
const sorHM=iso=>new Date(iso).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Warsaw'});
/* odległość w linii prostej (km) */
function sorKm([la1,lo1],[la2,lo2]){const R=6371,r=Math.PI/180,a=Math.sin((la2-la1)*r/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin((lo2-lo1)*r/2)**2;return 2*R*Math.asin(Math.sqrt(a))}
const sorKmTxt=km=>km<1?Math.round(km*1000/50)*50+' m':(km<10?km.toFixed(1).replace('.',','):Math.round(km))+' km';
/* stan każdego SOR z migawki: przy błędzie ostatni udany pomiar, pomiar o 30 min starszy od najświeższego nie barwi */
function sorStan(){
 const t=SOR.teraz,wpisy=SOR.mapa.sor.map(s=>{const r=t&&t.sor[s.k];return r&&r.blad&&r.poprzedni&&r.poprzedni.e?r.poprzedni:r});
 const naj=wpisy.reduce((m,w)=>w&&w.e&&w.t>m?w.t:m,'');
 const seen=new Set();let przed=0,sor=0;
 const stan=wpisy.map((w,i)=>{
  if(!w||!w.e)return null;
  const stary=(Date.parse(naj)-Date.parse(w.t))/60000>30,m=sorPomiar(w.e),k=SOR.mapa.sor[i].k;
  if(!stary&&!seen.has(k)){seen.add(k);przed+=m.przed;sor++}
  return {w,m,stary};
 });
 return {stan,naj,przed,sor};
}
const sorKl=st=>!st||st.stary||st.m.cls==null?'x':st.m.cls;
async function sorWczytaj(){
 try{
  if(!SOR.mapa)SOR.mapa=await (await fetch('sor-mapa.json')).json();
  SOR.teraz=await (await fetch(SOR_URL,{cache:'no-store'})).json();SOR.blad=false;
 }catch(e){SOR.blad=true}
 sorRysuj();
}

function sorMapaH(stan,naj,przed,sor){
 const S_=SOR.mapa.sor,r=st=>st&&!st.stary&&st.m.cls!=null?Math.min(14,3.6+1.1*Math.sqrt(st.m.przed)):2.6;
 const kol=S_.map((s,i)=>i).sort((a,b)=>{const ka=sorKl(stan[a]),kb=sorKl(stan[b]);return (ka==='x'?-1:ka)-(kb==='x'?-1:kb)||r(stan[b])-r(stan[a])});
 const pts=kol.map(i=>`<circle class="zd-pt k${sorKl(stan[i])}${i===SOR.wyb?' on':''}" cx="${S_[i].x}" cy="${S_[i].y}" r="${r(stan[i]).toFixed(1)}"/>`).join('');
 const g=SOR.mapa.geo,ja=SOR.ja&&[g.x[0]*SOR.ja[1]+g.x[1]*SOR.ja[0]+g.x[2],g.y[0]*SOR.ja[1]+g.y[1]*SOR.ja[0]+g.y[2]];
 return `<div class="ui">${hd('hosp','Kolejki na SOR teraz')}
  <p class="zd-sor-sum">${SOR.teraz?`<b>${zdLiczba(przed)}</b> ${przed===1?'osoba czeka':zdOs(przed)==='osoby'?'osoby czekają':'osób czeka'} na lekarza w ${sor} SOR-ach`:'Brak świeżych danych z systemu TOPSOR'}</p>
  <div class="zd-mapa"><svg viewBox="${SOR.mapa.viewBox}" role="img" aria-label="Mapa Polski z ${S_.length} SOR-ami. Kolor punktu: najdłuższy czas oczekiwania wobec normy, wielkość: liczba osób przed lekarzem. Dotknij punktu, żeby zobaczyć kolejkę.">
   <g class="zd-reg">${SOR.mapa.regiony.map(d=>`<path d="${d}"/>`).join('')}</g><g>${pts}</g>
   ${ja?`<g class="zd-ja"><circle cx="${ja[0].toFixed(1)}" cy="${ja[1].toFixed(1)}" r="13"/><circle cx="${ja[0].toFixed(1)}" cy="${ja[1].toFixed(1)}" r="5.5"/></g>`:''}</svg></div>
  <div class="zd-leg">${SOR_KLASY.map((t,i)=>`<span><i class="k${i}"></i>${t}</span>`).join('')}<span><i class="kx"></i>brak pomiaru</span>${ja?'<span><i class="kja"></i>Ty</span>':''}</div>
  <div class="note">${naj?'Stan z '+sorHM(naj)+' · każdy SOR sprawdzany co 10 minut':''}</div></div>`;
}
/* wyniki: najbliższe od „Ty” albo trafienia wyszukiwarki; bez jednego i drugiego — nic */
function sorWynikiH(stan){
 const S_=SOR.mapa.sor;let ids=[],tytul='';
 if(SOR.tryb==='gps'&&SOR.ja){ids=S_.map((s,i)=>i).sort((a,b)=>sorKm(SOR.ja,[S_[a].lat,S_[a].lng])-sorKm(SOR.ja,[S_[b].lat,S_[b].lng])).slice(0,5);tytul='Najbliżej Ciebie'}
 else if(SOR.tryb==='szukaj'&&SOR.q.trim().length>=2){
  const q=norm(SOR.q.trim());ids=S_.map((s,i)=>i).filter(i=>norm(S_[i].c+' '+S_[i].n+' '+S_[i].a).includes(q)).slice(0,8);
  if(!ids.length)return `<div class="ui"><div class="note zd-sor-opis">Nie ma SOR w takim mieście ani o takiej nazwie.</div></div>`;
  tytul='Wyniki wyszukiwania';
 }
 if(!ids.length)return '';
 return `<div class="ui list">${hd(SOR.tryb==='gps'?'pin':'hosp',tytul)}${ids.map(i=>{const s=stan[i],km=SOR.tryb==='gps'?sorKmTxt(sorKm(SOR.ja,[S_[i].lat,S_[i].lng]))+' · ':'';
  return `<button class="it" data-sor="${i}"><span class="pip zd-pip k${sorKl(s)}"></span><span class="x"><b>${zdN(S_[i].n)}</b><small>${km}${zdN(S_[i].c)} · ${s?zdLiczba(s.m.przed)+' '+zdOs(s.m.przed)+' przed lekarzem':'brak danych'}</small></span><span class="go">Kolejka</span></button>`}).join('')}</div>`;
}
function sorWybranyH(stan){
 const wyb=SOR.mapa.sor[SOR.wyb],st=stan[SOR.wyb];
 const etapy=st?SOR_ETAPY.map(([l,c,norm],i)=>{const [n,w]=st.w.e[i];return `<div class="zd-et${st.m.over[i]?' over':''}"><span>${l}${c?`<small>${c} · ${norm===0?'natychmiast':'do '+norm+' min'}</small>`:''}</span><b>${n==null?'–':zdLiczba(n)}</b><em>${!w||w==='-'?'–':w}</em></div>`}).join(''):'';
 const km=SOR.ja?' · '+sorKmTxt(sorKm(SOR.ja,[wyb.lat,wyb.lng]))+' od Ciebie':'';
 return `<div class="ui">${hd('pin',zdN(wyb.n))}<p class="zd-sor-adr">${zdN(wyb.c+', '+wyb.a)}${km}</p>
  ${st?`<div class="zd-q"><div><small>Na oddziale</small><b>${st.w.w==null?'–':zdLiczba(st.w.w)}</b></div><div class="me"><small>Przed lekarzem</small><b>${zdLiczba(st.m.przed)}</b></div><div><small>Stan z</small><b>${sorHM(st.w.t)}</b></div></div>
  <div class="zd-ets"><div class="zd-et zd-et-h"><span>Etap</span><b>Osób</b><em>Czas</em></div>${etapy}</div>`:'<div class="note">Brak danych z systemu TOPSOR dla tego SOR.</div>'}
  ${srcH('pacjent.gov.pl, system TOPSOR (NFZ)')}</div>`;
}
function sorRysuj(){
 const box=$('#zd-sor-ekran');if(!box)return;
 const czesc=(id,h)=>{const e=$('#'+id);if(e)e.innerHTML=h};
 if(!SOR.mapa){czesc('zd-sor-mapa',`<div class="ui"><div class="note zd-sor-czekaj">${SOR.blad?'Nie udało się wczytać mapy.':'Wczytuję stan kolejek…'}</div></div>`);return}
 const {stan,naj,przed,sor}=sorStan(),S_=SOR.mapa.sor;
 if(SOR.wyb==null){const miasto=OS.opis.split(',')[0].trim();
  SOR.wyb=S_.map((s,i)=>i).filter(i=>S_[i].c===miasto).sort((a,b)=>((stan[b]&&stan[b].m.przed)||0)-((stan[a]&&stan[a].m.przed)||0))[0]??0}
 czesc('zd-sor-mapa',sorMapaH(stan,naj,przed,sor));
 czesc('zd-sor-wyniki',sorWynikiH(stan));
 czesc('zd-sor-wyb',sorWybranyH(stan));
}
function zdSor(){
 zdArkusz('SOR na żywo',`<div id="zd-sor-ekran">
  <div class="ui zd-sor-szukaj"><label class="zd-szukaj">${svg('search')}<input type="search" id="zd-sor-q" placeholder="Miasto albo nazwa szpitala" autocomplete="off" value="${SOR.q.replace(/"/g,'&quot;')}"></label>
   <button class="btn primary zd-gps" data-zd-a="gps">${svg('pin')}Pokaż najbliższe oddziały ratunkowe</button></div>
  <div id="zd-sor-wyniki"></div><div id="zd-sor-mapa"></div><div id="zd-sor-wyb"></div>
  ${zdPrawaBoxH('sor')}
  <div class="ui"><div class="note zd-sor-opis">Kolor to najdłuższy czas oczekiwania w kategoriach żółtej, zielonej i niebieskiej wobec normy z rozporządzenia o SOR. Czasy z systemu TOPSOR są średnie i przybliżone.</div>
   <a class="zd-link" href="${ZD.sor}" target="_blank" rel="noopener">Pełna mapa na zarobkilekarzy.pl ${svg('chev')}</a></div></div>`,zdOpen);
 $('#zd-sor-q').addEventListener('input',e=>{SOR.q=e.target.value;SOR.tryb='szukaj';if(SOR.mapa)$('#zd-sor-wyniki').innerHTML=sorWynikiH(sorStan().stan)});
 sorRysuj();sorWczytaj();
 clearInterval(SOR.timer);SOR.timer=setInterval(()=>{if($('#zd-sor-ekran'))sorWczytaj();else clearInterval(SOR.timer)},120000);
}
/* „GPS”: krótkie ustalanie położenia, potem przykładowe położenie w mieście osoby (ZDROWIE.gps) */
function sorGps(b){
 if(b.disabled)return;
 const txt=b.innerHTML;b.disabled=true;b.innerHTML=`${svg('pin')}Ustalam położenie…`;
 setTimeout(()=>{
  b.disabled=false;b.innerHTML=txt;
  SOR.ja=ZD.gps;SOR.tryb='gps';SOR.q='';$('#zd-sor-q').value='';
  if(!SOR.mapa)return;
  const S_=SOR.mapa.sor;SOR.wyb=S_.map((s,i)=>i).sort((a,c)=>sorKm(SOR.ja,[S_[a].lat,S_[a].lng])-sorKm(SOR.ja,[S_[c].lat,S_[c].lng]))[0];
  sorRysuj();
 },1100);
}
/* dotknięcie mapy wybiera najbliższy SOR (punkty w miastach leżą gęsto), wiersz listy — swój SOR */
$('#detail').addEventListener('click',e=>{
 const gps=e.target.closest('.zd-gps');if(gps){sorGps(gps);return}
 const lista=e.target.closest('[data-sor]'),svgEl=e.target.closest('.zd-mapa svg');
 if(lista){SOR.wyb=+lista.dataset.sor;sorRysuj();$('#zd-sor-wyb').scrollIntoView({behavior:'smooth',block:'start'});return}
 if(!svgEl||!SOR.mapa)return;
 const p=svgEl.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svgEl.getScreenCTM().inverse());
 let best=-1,bd=24*24;SOR.mapa.sor.forEach((s,i)=>{const d=(s.x-q.x)**2+(s.y-q.y)**2;if(d<bd){bd=d;best=i}});
 if(best>=0){SOR.wyb=best;sorRysuj();$('#zd-sor-wyb').scrollIntoView({behavior:'smooth',block:'start'})}
});

/* ---------- akcje z ekranów karty ---------- */
const zdTemat=(t,fn)=>{$('#detail').classList.remove('on');setTimeout(()=>startTopic(t,fn),180)};
$('#detail').addEventListener('click',e=>{
 const lek=e.target.closest('[data-zd-lek]');if(lek){zdLekarz(lek.dataset.zdLek);return}
 const rx=e.target.closest('[data-zd-rx]');if(rx){zdRecepta(+rx.dataset.zdRx);return}
 const wiz=e.target.closest('[data-zd-wiz]');if(wiz){zdRachunek(+wiz.dataset.zdWiz);return}
 const bad=e.target.closest('[data-zd-bad]');if(bad){zdBadanie(+bad.dataset.zdBad);return}
 const badnb=e.target.closest('[data-zd-badnb]');if(badnb){const b=ZD.badania[+badnb.dataset.zdBadnb];zdTemat(b.nazwa+' '+b.data+' — nie wykonano',()=>S.zdBadanieNieBylo(+badnb.dataset.zdBadnb));return}
 const pob=e.target.closest('[data-zd-pobierz]');if(pob){act(async()=>{await faceid();zdPobierz(pob.dataset.zdPobierz)});return}
 const pr=e.target.closest('[data-zd-prawa]');if(pr){zdPrawa(pr.dataset.zdPrawa);return}
 const adr=e.target.closest('[data-zd-adr]');if(adr){const i=+adr.dataset.zdAdr;zdTemat('Zgłaszam działanie niepożądane leku',()=>S.zdNiepozadane(i));return}
 const nb=e.target.closest('[data-zd-niebylo]');
 if(nb){const v=ZD.wizyty[+nb.dataset.zdNiebylo];zdTemat('Wizyty '+v.u+' '+v.data+' nie było',()=>S.zdNieOdbyla(v));return}
 const sk=e.target.closest('[data-zd-skan]');
 if(sk){const dz=sk.dataset.zdDz;sk.dataset.zdSkan==='rej'?zdTemat('Rejestracja skanuje '+(dz?'kod dziecka':'mój kod'),()=>S.zdSkanRej(dz==null?undefined:+dz)):zdTemat('Apteka skanuje mój kod',S.zdSkanApt);return}
 const dzi=e.target.closest('[data-zd-dziecko]');if(dzi){zdDziecko(+dzi.dataset.zdDziecko);return}
 const dzk=e.target.closest('[data-zd-dzkod]');if(dzk){zdKod(+dzk.dataset.zdDzkod);return}
 const dzs=e.target.closest('[data-zd-dzszcz]');
 if(dzs){const d=ZD.dzieci[+dzs.dataset.zdDzszcz],x=d.szczep.find(y=>y.stan==='teraz');zdTemat('Umawiam szczepienie dziecka',()=>S.zdSzczepUmow(x.n,d.imie+' '+d.nazwisko,()=>{x.stan='plan'}));return}
 const sz=e.target.closest('[data-zd-szcz]');
 if(sz){const s=ZD.szczepienia,x=s.powt[+sz.dataset.zdSzcz];zdTemat('Umawiam szczepienie',()=>S.zdSzczepUmow(x.n,null,(t)=>{s.powt.splice(s.powt.indexOf(x),1);s.zapl.push({n:x.n,data:t.data,godz:t.godz,gdzie:ZD_PORADNIE.poz.miejsce})}));return}
 const upo=e.target.closest('[data-zd-upo]');if(upo){zdUpowOsoba(+upo.dataset.zdUpo);return}
 const sw=e.target.closest('[data-zd-sw]');if(sw){sw.setAttribute('aria-checked',String(sw.getAttribute('aria-checked')!=='true'));return}
 const uz=e.target.closest('[data-zd-upozap]');
 if(uz){const i=+uz.dataset.zdUpozap,o=ZD.upowaznienia.osoby[i],st={};document.querySelectorAll('#detail [data-zd-sw]').forEach(b=>st[b.dataset.zdSw]=b.getAttribute('aria-checked')==='true');
  act(async()=>{await faceid();Object.assign(o,st);zdUpowOsoba(i,true)});return}
 const uc=e.target.closest('[data-zd-upocof]');if(uc){const i=+uc.dataset.zdUpocof;zdTemat('Cofam upoważnienie',()=>S.zdUpowCofnij(i));return}
 const pf=e.target.closest('[data-zd-prof]');if(pf){zdTemat('Zgłaszam się do programu profilaktyki',()=>S.zdProfZapis(+pf.dataset.zdProf));return}
 const oc=e.target.closest('[data-zd-ocen]');
 if(oc){const v=ZD.wizyty[+oc.dataset.zdOcen];zdTemat('Ocena wizyty',()=>S.zdOcena(v));return}
 const b=e.target.closest('[data-zd-a]');if(!b)return;
 const a=b.dataset.zdA,o=ZD.umowione[0];
 const ekrany={upow:()=>zdUpowaznieni(),kod:()=>zdKod(),szczepienia:zdSzczepienia,ksiazeczka:zdKsiazeczka,profilaktyka:zdProfilaktyka,badania:zdBadania,eksport:zdEksport,bilet:zdBilet,wizyty:zdWizytyEkran,recepty:zdReceptyEkran,historia:zdHistoria,koszty:zdKoszty,lekarze:zdLekarzeEkran,prawa:()=>zdPrawa(),sor:zdSor};
 if(a==='sprzeciw'){const u=ZD.upowaznienia;act(async()=>{await faceid();u.sprzeciw=!u.sprzeciw;zdUpowaznieni(true)});return}
 if(a==='upowdodaj'){zdTemat('Chcę upoważnić kolejną osobę',S.zdUpowDodaj);return}
 if(ekrany[a])ekrany[a]();
 else if(a==='brak')zdTemat('Lekarz nie przyjmuje — zgłaszam brak lekarza',S.zdBrakLekarza);
 else if(a==='potwierdz')zdTemat('Wizyta '+o.u+' '+o.data,S.zdPrzypomnienie);
 else if(a==='rpp')zdTemat('Chcę złożyć skargę do Rzecznika Praw Pacjenta',S.zdSkarga);
});

/* ---------- sprawy w rozmowie (wywołuje je też lista „Do załatwienia”: OS.tiles → S[k]) ---------- */
Object.assign(S,{
 async zdKarta(){
  await info({icon:'heart',title:'Moje zdrowie',source:'Karta Moje zdrowie, rejestr wizyt NFZ',rows:[['Dziś',ZD_D.godz+', '+ZD_D.poradnia+', numerek '+ZD_D.numerek],['Umówione wizyty',String(ZD.umowione.filter(v=>!v.odwolana).length)],['E-recepty do wykupienia',String(ZD.recepty.filter(r=>!r.zrealizowana).length)],['Ostatnia wizyta',ZD_W.data+', NFZ: '+zdZl(zdNfz(ZD_W))],['Zapisane wizyty',String(ZD.wizytNaKarcie)]]});
  chips([{label:'Otwórz kartę',go:()=>{exitChat();zdOpen()}},{label:'Pokaż numerek',go:()=>{exitChat();zdBilet()}},{label:'Historia wizyt',go:()=>{exitChat();zdHistoria()}},{label:'Wpłaty i koszty',go:()=>{exitChat();zdKoszty()}}]);
 },
 async zdPrzypomnienie(){
  const o=ZD.umowione[0];
  await info({icon:'cal',title:'Wizyta '+o.u+', '+o.data,source:'Rejestr wizyt NFZ',rows:[['Kiedy',o.data+', '+o.godz],['Gdzie',o.miejsce],['Lekarz',zdN(o.lekarz)],['Kolejka tego dnia','jesteś '+o.kolejka+'.']]});
  if(o.potwierdzona||o.odwolana){await say(o.odwolana?'Tę wizytę już odwołano.':'Ta wizyta jest już potwierdzona. W dniu wizyty numerek pojawi się na karcie Moje zdrowie.');return}
  await say('Potwierdzisz, że przyjdziesz? Jeśli nie możesz, odwołaj — termin dostanie następna osoba z kolejki.');
  chips([
   {label:'Potwierdzam, przyjdę',go:()=>confirmCard({icon:'check',title:'Potwierdzenie wizyty',source:'Rejestr wizyt NFZ',rows:[['Wizyta',o.poradnia+', '+o.data+', '+o.godz],['Kolejka tego dnia',o.kolejka+'. miejsce']],label:'Potwierdź',
    then:()=>{o.potwierdzona=true;zdOdswiez();result({title:'Wizyta potwierdzona',rows:[['W dniu wizyty','numerek na karcie Moje zdrowie'],['Przypomnienie','rano w dniu wizyty']],note:'Na wizytę zabierz kartę Moje zdrowie — bez jej okazania w rejestracji wizyta się nie odbędzie.'})}})},
   {label:'Odwołuję wizytę',go:()=>confirmCard({icon:'cal',title:'Odwołanie wizyty',source:'Rejestr wizyt NFZ',rows:[['Wizyta',o.poradnia+', '+o.data+', '+o.godz]],label:'Odwołaj wizytę',
    then:()=>{o.odwolana=true;zdOdswiez();result({title:'Wizyta odwołana',rows:[['Termin','przekazany następnej osobie z kolejki']]})}})}
  ]);
 },
 async zdPoWizycie(){
  await info({icon:'doc',title:'Wizyta nr '+ZD_W.nr+' na Twojej karcie',source:'Karta Moje zdrowie, rozliczenie z NFZ',rows:[['Kiedy',ZD_W.data],['Gdzie',ZD_W.poradnia+', '+ZD_W.miejsce],['Lekarz',zdN(ZD_W.lekarz)],['Placówka rozlicza z NFZ',zdZl(zdNfz(ZD_W))]]});
  await say('Czy ta wizyta się odbyła?');
  chips([{label:'Tak, odbyła się',go:()=>S.zdOcena(ZD_W)},{label:'Nie, nie było jej',go:()=>S.zdNieOdbyla(ZD_W)}]);
 },
 /* ocena w trzech kategoriach: pytanie po pytaniu, odpowiedź przyciskiem 1–5 (jak inne wybory w rozmowie) */
 async zdOcena(v=ZD_W){
  const val=[];
  const pytaj=async i=>{
   if(i===ZD.oceny.length){
    await result({title:'Ocena wysłana: '+zdN(v.lekarz),rows:ZD.oceny.map((k,j)=>[k,val[j]+' / 5']),note:'Ocena trafia do placówki i do NFZ bez Twojego imienia.'});return}
   await say(i===0?`Oceń wizytę w trzech sprawach, od 1 (źle) do 5 (bardzo dobrze). Ocena jest anonimowa.<br><br><b>${ZD.oceny[0]}</b>`:`<b>${ZD.oceny[i]}</b>`);
   chips([1,2,3,4,5].map(n=>({label:String(n),say:ZD.oceny[i]+': '+n,go:()=>{val[i]=n;pytaj(i+1)}})));
  };
  await pytaj(0);
 },
 async zdNieOdbyla(v=ZD_W){
  await say('Sprawdźmy to. Na Twojej karcie jest wizyta, którą placówka rozlicza z NFZ:');
  confirmCard({icon:'alert',title:'Zgłoszenie: wizyty nie było',source:'NFZ, kontrola rozliczeń',rows:[['Wizyta',v.poradnia+', '+v.data],['Na karcie','wizyta nr '+v.nr],['Rozliczona z NFZ',v.poz?'w stawce POZ':zdZl(zdNfz(v))]],
   note:'NFZ sprawdzi rozliczenie placówki. Nie musisz niczego dołączać.',label:'Wyślij zgłoszenie',
   then:()=>result({title:'Zgłoszenie wysłane do NFZ',rows:[['Numer zgłoszenia','NFZ/2026/'+(41000+Math.floor(Math.random()*900))],['Odpowiedź','w skrzynce mObywatela']]})});
 },
 async zdSkanRej(dz){
  const g=new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}),d=ZD.dzieci[dz];
  if(d){
   await say('Rejestracja zeskanowała kod z karty dziecka. Wizyta zapisała się na jego karcie.');
   result({title:'Wizyta dziecka potwierdzona kodem',rows:[['Pacjent',zdN(d.imie+' '+d.nazwisko)],['Wizyta',ZD_PORADNIE.poz.poradnia+', dziś'],['Gdzie',ZD_PORADNIE.poz.miejsce],['Potwierdzono',g],['Na karcie dziecka','wizyta nr '+(d.wizytNaKarcie+1)]],
    note:'Każde dziecko ma własny kod — potwierdza tylko jego wizyty.'});return}
  await say('Rejestracja zeskanowała Twój kod. Wizyta zapisała się na karcie.');
  result({title:'Wizyta potwierdzona kodem',rows:[['Wizyta',ZD_D.poradnia+', dziś '+ZD_D.godz],['Gdzie',ZD_D.miejsce],['Potwierdzono',g],['Na karcie','wizyta nr '+(ZD.wizytNaKarcie+1)]],
   note:'Tylko potwierdzoną kodem wizytę placówka może rozliczyć z NFZ. Rachunek przyjdzie po wizycie.'});
 },
 /* umówienie szczepienia (dorosły albo dziecko) w przychodni POZ; po = co zmienić po umówieniu */
 async zdSzczepUmow(n,kto,po){
  const t={data:ZD_DATA(ZD_DZIEN(4)),godz:'15:30'},poz=ZD_PORADNIE.poz;
  await say('Umówię szczepienie w Twojej przychodni rodzinnej. Pierwszy wolny termin:');
  confirmCard({icon:'cal',title:'Umówienie szczepienia',source:'e-rejestracja, przychodnia POZ',rows:[['Szczepienie',n],...(kto?[['Dla',zdN(kto)]]:[]),['Gdzie',poz.miejsce],['Termin',t.data+', '+t.godz],...(/^Grypa/.test(n)?[['Odpłatność','zależy od wieku i grupy ryzyka']]:[])],label:'Umów',
   then:()=>{po&&po(t);result({title:'Szczepienie umówione',rows:[['Szczepienie',n],['Termin',t.data+', '+t.godz]],note:'Dzień wcześniej przyjdzie przypomnienie. Na szczepienie pokaż kod z karty.'})}});
 },
 async zdSzczepPrzyp(){
  const s=ZD.szczepienia,x=s.powt.find(y=>y.zalegle);
  if(!x){await say('Nie masz już zaległych szczepień.');return}
  await info({icon:'alert',title:'Szczepienie do powtórzenia',source:'Program Szczepień Ochronnych na 2026 r.',rows:[['Szczepienie',x.n],['Zalecenie',x.zal],['Ostatnia dawka',s.wyk.find(y=>y.n===x.n).data],['Stan',x.kiedy]]});
  await say('Umówić szczepienie w Twojej przychodni rodzinnej?');
  chips([{label:'Tak, umów',go:()=>S.zdSzczepUmow(x.n,null,t=>{s.powt.splice(s.powt.indexOf(x),1);s.zapl.push({n:x.n,data:t.data,godz:t.godz,gdzie:ZD_PORADNIE.poz.miejsce})})},{label:'Nie teraz',go:()=>say('Dobrze. Szczepienie zostaje na liście „Do zrobienia” w karcie Moje zdrowie.')}]);
 },
 async zdProfZapis(i){
  const p=ZD.profilaktyka[i],t={data:ZD_DATA(ZD_DZIEN(11)),godz:'10:20'};
  await say('Program jest bezpłatny i nie wymaga skierowania. Pierwszy krok: '+p.krok+'.');
  confirmCard({icon:'shield',title:p.n,source:'NFZ, program profilaktyczny',rows:[['Dla',p.dla+', '+p.co],['Pierwszy krok',p.krok],['Termin',t.data+', '+t.godz]],label:'Zapisz mnie',
   then:()=>{p.ost=null;p.nast=new Date().getFullYear()+1;result({title:'Zapisano do programu',rows:[['Program',p.n],['Termin',t.data+', '+t.godz]],note:'Wynik badania trafi na Twoje konto pacjenta. Przypomnienie przyjdzie dzień wcześniej.'})}});
 },
 async zdSkanApt(){
  const r=ZD.recepty.find(x=>!x.zrealizowana);
  if(!r){await say('Nie masz już recepty do wykupienia — wszystkie są w archiwum.');return}
  const g=new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}),s=zdRxSum(r),apteka='Apteka Rodzinna '+ZD_MIASTO.w;
  r.zrealizowana={data:ZD_DATA(ZD_DZIEN(0)),apteka,kod:g};
  await say('Apteka zeskanowała Twój kod przy wydaniu leków z recepty '+r.kod+'.');
  result({title:'Wydanie leków potwierdzone kodem',rows:[['Apteka',apteka],['Leki',zdLista(r.leki.map(l=>l.n))],['Płacisz',zdZl(s.ty)],['NFZ dopłaci aptece',zdZl(s.cena-s.ty)],['Potwierdzono',g]],
   note:'NFZ dopłaca aptece tylko do leków wydanych z Twoim kodem. Recepta jest teraz w archiwum e-recept.'});
 },
 async zdUpowDodaj(){
  const u=ZD.upowaznienia,[imie,kto,tel]=u.kandydat;
  if(u.osoby.some(o=>o.imie===imie)){await say('Ta osoba jest już na liście upoważnionych. Zakres zmienisz w karcie Moje zdrowie.');return}
  await say('Kogo upoważniasz? Wybierz osobę z kontaktów albo wpisz imię, nazwisko i telefon.');
  chips([{label:imie+' ('+kto+')',go:async()=>{
   await say('Do czego upoważniasz tę osobę? Możesz wybrać kilka zakresów.');
   multi(ZD_ZAKRESY.map(x=>x[1]),wyb=>{
    const z=Object.fromEntries(ZD_ZAKRESY.map(([k,t])=>[k,wyb.includes(t)]));
    confirmCard({icon:'id',title:'Nowe upoważnienie',source:'Rejestr upoważnień pacjenta',rows:[['Osoba',zdN(imie)],['Kim jest',kto],['Telefon',zdN(tel)],['Zakres',zdLista(wyb)]],label:'Podpisz i zapisz',
     then:()=>{u.osoby.push({imie,kto,tel,...z});result({title:'Upoważnienie zapisane',rows:[['Osoba',zdN(imie)],['Zakres',zdLista(wyb)]],note:'Działa od razu we wszystkich placówkach. Zmienisz je albo cofniesz w każdej chwili w karcie Moje zdrowie.'})}});
   });
  }}]);
 },
 async zdUpowCofnij(i){
  const o=ZD.upowaznienia.osoby[i];
  if(!o){await say('Tej osoby nie ma już na liście upoważnionych.');return}
  await say('Po cofnięciu placówki nie udzielą tej osobie informacji ani dokumentacji.');
  confirmCard({icon:'alert',title:'Cofnięcie upoważnienia',source:'Rejestr upoważnień pacjenta',rows:[['Osoba',zdN(o.imie)],['Kim jest',o.kto],['Traci dostęp do',zdZakresTxt(o)]],label:'Cofnij upoważnienie',
   then:()=>{ZD.upowaznienia.osoby.splice(i,1);result({title:'Upoważnienie cofnięte',rows:[['Osoba',zdN(o.imie)]],note:'Działa od razu we wszystkich placówkach.'})}});
 },
 async zdBrakLekarza(){
  await say('Przykro mi. Zgłoszę to rejestracji i do NFZ, a Twoje miejsce w kolejce zostanie zachowane.');
  confirmCard({icon:'alert',title:'Zgłoszenie: brak lekarza',source:'Rejestracja placówki, NFZ',rows:[['Wizyta',ZD_D.poradnia+', dziś '+ZD_D.godz],['Numerek',ZD_D.numerek],['Problem','lekarz nie przyjmuje o umówionej porze']],label:'Wyślij zgłoszenie',
   then:()=>result({title:'Zgłoszenie wysłane',rows:[['Odbiorca','rejestracja placówki i oddział NFZ'],['Twoje miejsce','zachowane, nowy termin przyjdzie w powiadomieniu']]})});
 },
 async zdBadanieNieBylo(i=0){
  const b=ZD.badania[i];
  await say('Sprawdźmy to. Na Twojej karcie jest badanie, które placówka rozlicza z NFZ:');
  confirmCard({icon:'alert',title:'Zgłoszenie: badania nie wykonano',source:'NFZ, kontrola rozliczeń',rows:[['Badanie',b.nazwa],['Data',b.data],['Gdzie',b.miejsce],['Rozliczone z NFZ',b.poz?'w stawce POZ':zdZl(b.kwota)]],
   note:'NFZ sprawdzi rozliczenie placówki. Nie musisz niczego dołączać.',label:'Wyślij zgłoszenie',
   then:()=>result({title:'Zgłoszenie wysłane do NFZ',rows:[['Numer zgłoszenia','NFZ/2026/'+(42000+Math.floor(Math.random()*900))],['Odpowiedź','w skrzynce mObywatela']]})});
 },
 /* działanie niepożądane leku (także interakcja z innymi lekami) — zgłoszenie do URPL, jak na zarobkilekarzy.pl/prawa-pacjenta/ */
 async zdNiepozadane(i=0){
  const r=ZD.recepty[i];
  await info({icon:'alert',title:'Zgłoszenie działania niepożądanego leku',source:'URPL — Urząd Rejestracji Produktów Leczniczych',body:'Możesz zgłosić, że lek Ci zaszkodził albo źle działa razem z innymi lekami. Zgłoszenia trafiają do urzędu, który nadzoruje bezpieczeństwo leków.'});
  await say('Jeśli masz duszność, obrzęk twarzy lub gardła albo inną silną reakcję — zadzwoń pod 112. W pozostałych sytuacjach przygotuję zgłoszenie.');
  const inne=[...new Set(ZD.recepty.filter((x,j)=>j!==i&&(!x.zrealizowana||ZD_DZIEN(-120)<=zdDataNa(x.zrealizowana.data))).flatMap(x=>x.leki.map(l=>l.n)))];
  const lek=async l=>{
   await say('Jakie objawy '+rodz('zauważyłaś','zauważyłeś')+'? Możesz wybrać kilka.');
   multi(['Wysypka lub świąd','Nudności lub wymioty','Biegunka','Ból brzucha','Zawroty głowy','Ból głowy','Senność','Kołatanie serca','Obrzęk','Inne'],async ob=>{
    await say('Kiedy się zaczęły?');
    chips(['Dziś','Wczoraj','Kilka dni temu','Ponad tydzień temu'].map(t=>({label:t,go:async()=>{
     if(inne.length)await say('Przyjmujesz też inne leki z Twoich recept. Dołączę je do zgłoszenia, żeby można było sprawdzić interakcję.');
     confirmCard({icon:'alert',title:'Zgłoszenie do URPL',source:'URPL, formularz zgłoszenia działania niepożądanego',
      rows:[['Lek',l.n],['Objawy',zdLista(ob)],['Początek',t],['Inne leki',inne.length?zdLista(inne):'brak'],['Recepta','kod '+r.kod+', '+zdN(r.lekarz)],['Zgłaszający',zdN(OS.imie+' '+OS.nazwisko)]],
      note:'Kopię zgłoszenia dostanie lekarz, który wystawił receptę.',label:'Wyślij zgłoszenie',
      then:()=>result({title:'Zgłoszenie wysłane do URPL',rows:[['Numer zgłoszenia','URPL/2026/'+(70000+Math.floor(Math.random()*9000))],['Kopia',zdN(r.lekarz)],['Co dalej','jeśli objawy się nasilają — skontaktuj się z lekarzem']]})});
    }})));
   });
  };
  if(r.leki.length>1){await say('Którego leku dotyczy zgłoszenie?');chips(r.leki.map(l=>({label:l.n,go:()=>lek(l)})))}
  else await lek(r.leki[0]);
 },
 /* skarga do RPP: sprawy z zarobkilekarzy.pl/prawa-pacjenta/ (droga „Nie uszanowano moich praw”) */
 async zdSkarga(){
  await info({icon:'scale',title:'Skarga do Rzecznika Praw Pacjenta',source:'Ustawa o prawach pacjenta i RPP, Dz.U. 2024 poz. 581',rows:[['Koszt','bezpłatnie (art. 50 ust. 2)'],['Infolinia',ZD.rpp.tel+', całą dobę'],['Kiedy','gdy nie uszanowano Twoich praw pacjenta']]});
  await say('Czego dotyczy sprawa?');
  chips(['Odmówiono mi informacji','Odmówiono mi dokumentacji','Zabrakło szacunku i intymności'].map(t=>({label:t,go:()=>confirmCard({icon:'scale',title:'Wniosek do Rzecznika Praw Pacjenta',source:'Rzecznik Praw Pacjenta, ePUAP',
   rows:[['Sprawa',t],['Wizyta',ZD_W.poradnia+', '+ZD_W.data],['Wnioskodawca',zdN(OS.imie+' '+OS.nazwisko)],['Koszt','bezpłatnie']],note:'Wniosek trafi do Rzecznika przez ePUAP razem z danymi wizyty z karty Moje zdrowie.',label:'Wyślij wniosek',
   then:()=>result({title:'Wniosek wysłany do Rzecznika Praw Pacjenta',rows:[['Kanał','ePUAP'],['Odpowiedź','w skrzynce mObywatela'],['Pytania',ZD.rpp.tel]]})})})));
 },
 /* „Do załatwienia” ze wszystkich spraw osoby — w bazie lista jest wpisana na sztywno, bez spraw wariantu */
 async todo(){
  await say('Oto, co czeka na Ciebie:');
  const c=await card(`<div class="ui list">${hd('bell','Do załatwienia')}${OS.tiles.map((t,i)=>`<button class="it" data-i="${i}"><span class="pip"></span><span class="x"><b>${t.h}</b><small>${t.d}</small></span><span class="go">Otwórz</span></button>`).join('')}</div>`);
  c.querySelectorAll('.it').forEach(b=>b.onclick=()=>act(()=>{const t=OS.tiles[+b.dataset.i];addUser(t.h);S[t.k]()}));
 }
});

const zdRoute=route;
route=function(t){
 if(pending)return zdRoute(t);
 const n=norm(t);
 if(/brak lekarza|nie ma lekarza|lekarz nie przyjmuje/.test(n))return S.zdBrakLekarza();
 if(/nie bylo|nie odbyl/.test(n))return S.zdNieOdbyla();
 if(/skarg|rzecznik/.test(n))return S.zdSkarga();
 if(/niepozadan|interakc|zaszkodzi/.test(n))return S.zdNiepozadane();
 if(/skladk|wplac|koszt/.test(n)){exitChat();return zdKoszty()}
 if(/badan|zabieg/.test(n)){exitChat();return zdBadania()}
 if(/pobierz|eksport|fhir/.test(n)){exitChat();return zdEksport()}
 if(/ocen/.test(n))return S.zdOcena();
 if(/odbyla|dermatolog/.test(n))return S.zdPoWizycie();
 if(/potwierdz\w* wizyt|ortoped|odwol\w* wizyt/.test(n))return S.zdPrzypomnienie();
 if(/zdrowi|karta zdrowia|rachun|wizyt|lekarz|numerek|bilecik|kolejk|recept|prawa pacjenta/.test(n))return S.zdKarta();
 return zdRoute(t);
};

/* na osobnym hoście „/” to spis wariantów — orzełek na ekranie głównym zostaje w aplikacji */
{const home=$('#homeBtn').onclick;$('#homeBtn').onclick=()=>{if(!app.classList.contains('chatting')&&!$('#detail').classList.contains('on'))return;home()}}
