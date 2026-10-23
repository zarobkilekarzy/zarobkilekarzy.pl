/* ---------- wariant „Moje zdrowie”: karta w portfelu działająca jak tajwańska karta ubezpieczenia ----------
   Każda wizyta zapisuje się na karcie z kolejnym numerem, a pacjent dostaje rachunek: ile placówka rozlicza
   z NFZ. Dane fikcyjne; miasto, izba lekarska i rodzaj wizyt zależą od osoby (PROFIL), daty liczone od dziś.
   Kwoty przykładowe. Prawa pacjenta — teksty i artykuły jak na zarobkilekarzy.pl/prawa-pacjenta/ (src/data/prawa-pacjenta.ts).
   Ładowany po osoby.js, przed core.js (zloz.mjs) — karta i sprawy są w portfelu od pierwszego rysowania. */
const ZD_DZIEN=n=>{const d=new Date();d.setDate(d.getDate()+n);return d};
const ZD_DATA=d=>d.toLocaleDateString('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric'});
const ZD_GODZ=(()=>{const d=new Date();d.setMinutes(d.getMinutes()+50);d.setMinutes(d.getMinutes()<30?30:60,0,0);
 return d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})})();

/* miasto osoby: placówki, izba lekarska i „GPS” (przykładowe położenie w centrum, nie lokalizacja telefonu) */
const ZD_MIASTA={
 Warszawa:{w:'w Warszawie',izba:'Okręgowa Izba Lekarska w Warszawie',gps:[52.2297,21.0122]},
 Kraków:{w:'w Krakowie',izba:'Okręgowa Izba Lekarska w Krakowie',gps:[50.0614,19.9372]},
 Lublin:{w:'w Lublinie',izba:'Lubelska Izba Lekarska',gps:[51.2465,22.5684]},
 Gdańsk:{w:'w Gdańsku',izba:'Okręgowa Izba Lekarska w Gdańsku',gps:[54.352,18.6466]}
};
const ZD_MIASTO=ZD_MIASTA[OS.opis.split(',')[0].trim()]||ZD_MIASTA.Warszawa;
const ZD_SZPITAL='Szpital Miejski '+ZD_MIASTO.w,ZD_PRZYCH='Przychodnia Specjalistyczna '+ZD_MIASTO.w,ZD_POZ='Przychodnia Rodzinna '+ZD_MIASTO.w;

/* poradnie i lekarze (fikcyjni) — wpis w rejestrze: spec, rok uzyskania */
const ZD_PORADNIE={
 kardio:{u:'u kardiologa',poradnia:'Poradnia kardiologiczna',miejsce:ZD_SZPITAL+', budynek B, gabinet 12',lekarz:'lek. Jakub Wrona'},
 endo:{u:'u endokrynologa',poradnia:'Poradnia endokrynologiczna',miejsce:ZD_SZPITAL+', budynek B, gabinet 8',lekarz:'lek. Joanna Wilk'},
 orto:{u:'u ortopedy',poradnia:'Poradnia ortopedyczna',miejsce:ZD_PRZYCH+', gabinet 4',lekarz:'lek. Anna Sowa'},
 okul:{u:'u okulisty',poradnia:'Poradnia okulistyczna',miejsce:ZD_SZPITAL+', budynek A, gabinet 3',lekarz:'lek. Piotr Kruk'},
 stom:{u:'u stomatologa',poradnia:'Poradnia stomatologiczna',miejsce:ZD_PRZYCH+', gabinet 9',lekarz:'lek. dent. Iga Mróz'},
 derma:{u:'u dermatologa',poradnia:'Poradnia dermatologiczna',miejsce:ZD_PRZYCH+', gabinet 7',lekarz:'lek. Marek Lis'},
 poz:{u:'u lekarza rodzinnego',poradnia:'Poradnia lekarza rodzinnego (POZ)',miejsce:ZD_POZ+', gabinet 2',lekarz:'lek. Ewa Bąk'},
 usg:{u:'na badaniu USG',poradnia:'Pracownia USG',miejsce:ZD_SZPITAL+', budynek A, pracownia 1',lekarz:'lek. Tomasz Ryś'}
};
const ZD_LEKI={
 statyna:{n:'Atorwastatyna 20 mg',op:'30 tabl.',d:'1 tabletka wieczorem',odp:'30%',cena:1890,ty:567},
 ramipril:{n:'Ramipril 5 mg',op:'28 kaps.',d:'1 kapsułka rano',odp:'ryczałt',cena:1420,ty:320},
 tyroksyna:{n:'Lewotyroksyna 50 µg',op:'50 tabl.',d:'1 tabletka rano na czczo',odp:'ryczałt',cena:1150,ty:320},
 ketoprofen:{n:'Ketoprofen 100 mg',op:'20 kaps.',d:'1 kapsułka 2 razy dziennie po posiłku',odp:'30%',cena:1460,ty:438},
 krem:{n:'Mometazon, krem 0,1%',op:'15 g',d:'cienka warstwa raz dziennie, 2 tygodnie',odp:'100%',cena:1999,ty:1999},
 amoksycylina:{n:'Amoksycylina 1000 mg',op:'16 tabl.',d:'1 tabletka co 12 godzin przez 7 dni',odp:'30%',cena:2240,ty:672},
 desloratadyna:{n:'Desloratadyna 5 mg',op:'30 tabl.',d:'1 tabletka dziennie',odp:'100%',cena:1590,ty:1590},
 metformina:{n:'Metformina 500 mg',op:'60 tabl.',d:'1 tabletka 2 razy dziennie',odp:'ryczałt',cena:890,ty:320},
 omeprazol:{n:'Omeprazol 20 mg',op:'28 kaps.',d:'1 kapsułka rano',odp:'30%',cena:1260,ty:378}
};
/* osoba → wizyta dziś, umówione, recepta stała (lekarz i leki) i wizyta z historii dopasowane do wieku */
const ZD_PROFIL={
 marta:{dzis:'endo',umowione:['orto','okul'],recepta:['endo',['tyroksyna']],hist144:'endo',
  archiwum:[['endo',['tyroksyna'],-112],['poz',['amoksycylina'],-205],['poz',['desloratadyna'],-298]],
  skladka:{rodzaj:'etat',brutto:740000},wiek:35},
 jan:{dzis:'kardio',umowione:['orto','okul'],recepta:['poz',['statyna','ramipril']],hist144:'kardio',
  archiwum:[['poz',['statyna','ramipril'],-118],['poz',['amoksycylina'],-251],['poz',['omeprazol'],-330]],
  skladka:{rodzaj:'jdg',dochod:1100000},wiek:43},
 ewa:{dzis:'kardio',umowione:['orto','okul'],recepta:['poz',['statyna','ramipril']],hist144:'kardio',
  archiwum:[['poz',['statyna','ramipril'],-116],['poz',['metformina'],-160],['poz',['omeprazol'],-212]],
  skladka:{rodzaj:'etat',brutto:820000},wiek:57},
 kacper:{dzis:'orto',umowione:['okul','stom'],recepta:['orto',['ketoprofen']],hist144:'orto',
  archiwum:[['poz',['amoksycylina'],-148],['poz',['desloratadyna'],-287]],
  skladka:{rodzaj:'rodzina'},wiek:20}
}[OS.id]||{dzis:'kardio',umowione:['orto','okul'],recepta:['poz',['statyna','ramipril']],hist144:'kardio',archiwum:[],skladka:{rodzaj:'etat',brutto:740000},wiek:35};
const zdP=k=>({...ZD_PORADNIE[k]});

const ZDROWIE={
 karta:'4471 8820 06',
 wizytNaKarcie:147,
 /* dziś: wirtualny bilecik i kolejka w poczekalni (licznik w wariant.js) */
 dzis:{...zdP(ZD_PROFIL.dzis),godz:ZD_GODZ,numerek:'K 014',teraz:11,minNaOsobe:9},
 /* umówione: przypomnienie z prośbą o potwierdzenie i miejscem w kolejce tego dnia */
 umowione:[
  {...zdP(ZD_PROFIL.umowione[0]),data:ZD_DATA(ZD_DZIEN(2)),godz:'09:00',kolejka:4,potwierdzona:false},
  {...zdP(ZD_PROFIL.umowione[1]),data:ZD_DATA(ZD_DZIEN(23)),godz:'12:15',kolejka:9,potwierdzona:true}
 ],
 /* historia wizyt zapisanych na karcie (od najnowszej): pozycje w groszach, null = poza rozliczeniem za wizytę */
 wizyty:[
  {nr:147,...zdP('derma'),data:ZD_DATA(ZD_DZIEN(-3)),pozycje:[['Porada specjalistyczna',12000],['Badanie dermatoskopowe',4500],['E-recepta',0]],doplata:0},
  {nr:146,...zdP('poz'),data:ZD_DATA(ZD_DZIEN(-24)),pozycje:[['Porada lekarza rodzinnego',null],['E-recepta',null]],doplata:0,
   poz:'Lekarz rodzinny: NFZ płaci przychodni stałą stawkę za każdego zapisanego pacjenta, a nie za wizytę — dlatego ta wizyta nie ma osobnej kwoty.'},
  {nr:145,...zdP('usg'),data:ZD_DATA(ZD_DZIEN(-41)),pozycje:[['USG jamy brzusznej',9500]],doplata:0},
  {nr:144,...zdP(ZD_PROFIL.hist144),data:ZD_DATA(ZD_DZIEN(-58)),pozycje:{
    kardio:[['Porada specjalistyczna',14000],['EKG spoczynkowe',3500],['Badania krwi (lipidogram)',2800]],
    endo:[['Porada specjalistyczna',13000],['Badania krwi (TSH, fT4)',4200],['USG tarczycy',7000]],
    orto:[['Porada specjalistyczna',12500],['RTG stawu kolanowego',6000]]}[ZD_PROFIL.hist144],doplata:0},
  {nr:143,...zdP('stom'),data:ZD_DATA(ZD_DZIEN(-97)),pozycje:[['Przegląd stomatologiczny',6800],['Wypełnienie (1 ząb)',11200]],doplata:0}
 ],
 /* e-recepty: cena w aptece, Twoja dopłata i dopłata NFZ (w groszach); kwoty przykładowe */
 recepty:[
  {kod:'4821',data:ZD_DATA(ZD_DZIEN(-24)),lekarz:ZD_PORADNIE[ZD_PROFIL.recepta[0]].lekarz,wazna:ZD_DATA(ZD_DZIEN(341)),zrealizowana:false,
   leki:ZD_PROFIL.recepta[1].map(k=>ZD_LEKI[k])},
  {kod:'7306',data:ZD_DATA(ZD_DZIEN(-3)),lekarz:'lek. Marek Lis',wazna:ZD_DATA(ZD_DZIEN(27)),zrealizowana:false,leki:[ZD_LEKI.krem]},
  /* archiwum: zrealizowane w aptece (data, apteka); kody fikcyjne */
  ...ZD_PROFIL.archiwum.map(([p,l,d],i)=>({kod:String(5170+i*913).slice(-4),data:ZD_DATA(ZD_DZIEN(d)),lekarz:ZD_PORADNIE[p].lekarz,wazna:ZD_DATA(ZD_DZIEN(d+30)),
   zrealizowana:{data:ZD_DATA(ZD_DZIEN(d+1)),apteka:'Apteka Rodzinna '+ZD_MIASTO.w},leki:l.map(k=>ZD_LEKI[k])}))
 ],
 /* wpłaty i koszty (ostatnie 12 miesięcy): składka zdrowotna 9% podstawy (art. 79 ustawy o świadczeniach);
    u pracownika podstawa = brutto − składki społeczne pracownika 13,71% (art. 81), w działalności na skali — 9% dochodu;
    dziecko uczące się do 26 lat zgłoszone jako członek rodziny (art. 5 pkt 3) nie płaci. Brutto i dochód — fikcyjne.
    Stawka POZ za pacjenta: 232,56 zł rocznie od 1.07.2026 × współczynnik wieku (zarządzenie 65/2026/DSOZ, src/data/poz.ts). */
 skladka:(()=>{const k=ZD_PROFIL.skladka;
  if(k.rodzaj==='rodzina')return {rodzaj:k.rodzaj,mies:0};
  const podstawa=k.rodzaj==='etat'?Math.round(k.brutto*(1-0.1371)):k.dochod;
  return {rodzaj:k.rodzaj,brutto:k.brutto,dochod:k.dochod,podstawa,mies:Math.round(podstawa*0.09)}})(),
 poz:{stawka:23256,wsp:ZD_PROFIL.wiek>=40&&ZD_PROFIL.wiek<=65?1.34:1.0},
 /* rejestr lekarzy (fikcyjne wpisy — w prawdziwej usłudze: Centralny Rejestr Lekarzy, Naczelna Izba Lekarska);
    izba z miasta osoby, bo pokaz dzieje się w jej mieście */
 lekarze:{
  'lek. Jakub Wrona':{pwz:'5873214',od:'2009',spec:[['kardiologia','2016'],['choroby wewnętrzne','2013']]},
  'lek. Joanna Wilk':{pwz:'6043187',od:'2010',spec:[['endokrynologia','2018'],['choroby wewnętrzne','2015']]},
  'lek. Anna Sowa':{pwz:'3360981',od:'2001',spec:[['ortopedia i traumatologia narządu ruchu','2008']]},
  'lek. Piotr Kruk':{pwz:'6618402',od:'2014',spec:[['okulistyka','2020']]},
  'lek. Marek Lis':{pwz:'4492057',od:'2005',spec:[['dermatologia i wenerologia','2011']]},
  'lek. Ewa Bąk':{pwz:'7120836',od:'2017',spec:[['medycyna rodzinna','2023']]},
  'lek. Tomasz Ryś':{pwz:'2984410',od:'1998',spec:[['radiologia i diagnostyka obrazowa','2004']]},
  'lek. dent. Iga Mróz':{pwz:'8301559',od:'2019',spec:[],dent:true}
 },
 izba:ZD_MIASTO.izba,
 /* prawa pacjenta (ustawa o prawach pacjenta i RPP, Dz.U. 2024 poz. 581) — kontekst: wizyta, sor, dokumentacja */
 ustawa:'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000581',
 prawa:[
  {k:'wizyta',t:'Informacja, którą zrozumiesz',s:'Masz prawo do informacji, którą zrozumiesz: o rozpoznaniu, możliwych metodach leczenia, ich skutkach i rokowaniu.',a:'art. 9'},
  {k:'wizyta',t:'Zgoda na leczenie',s:'Decyzja należy do Ciebie — po tym, jak dostaniesz pełną informację. Na operację i zabieg o podwyższonym ryzyku zgoda musi być na piśmie.',a:'art. 16–18'},
  {k:'wizyta',t:'Druga opinia',s:'Możesz żądać konsultacji innego lekarza albo konsylium. Lekarz może odmówić, ale musi wpisać odmowę do dokumentacji.',a:'art. 6 ust. 3–5'},
  {k:'wizyta',t:'Bliska osoba przy Tobie',s:'Na Twoje życzenie — także przy badaniu. Odmowa jest możliwa tylko z dwóch powodów i musi trafić do dokumentacji.',a:'art. 21'},
  {k:'wizyta',t:'Intymność i godność',s:'Masz prawo do poszanowania intymności i godności. Obecność osób, które nie udzielają Ci świadczenia — na przykład studentów — wymaga Twojej zgody.',a:'art. 20, 22'},
  {k:'sor',t:'Pomoc w nagłym przypadku',s:'Przy zagrożeniu zdrowia lub życia masz prawo do natychmiastowej pomocy — niezależnie od kolejek i skierowań.',a:'art. 7'},
  {k:'sor',t:'Leczenie bólu',s:'Placówka ma ocenić, jak mocno boli, leczyć ból i sprawdzać, czy leczenie działa.',a:'art. 20a'},
  {k:'dok',t:'Kopia dokumentacji',s:'Pierwsza kopia w danym zakresie jest bezpłatna. Za kolejne placówka może pobrać opłatę, ale tylko do ustawowego limitu.',a:'art. 28'},
  {k:'dok',t:'Tajemnica',s:'Personel musi zachować informacje o Tobie w tajemnicy. To Ty wskazujesz w dokumentacji, kto może je dostać — i możesz to w każdej chwili zmienić.',a:'art. 13–14'}
 ],
 /* normy czasu na SOR: rozporządzenie o SOR, § 6 ust. 9 (Dz.U. 2025 poz. 1646) — jak mapa na stronie */
 sorNormy:'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250001646',
 rpp:{tel:'800 190 590',mail:'kancelaria@rpp.gov.pl',duzyDruk:'https://zarobkilekarzy.pl/prawa-pacjenta/duzy-druk.pdf',strona:'https://zarobkilekarzy.pl/prawa-pacjenta/'},
 /* ocena lekarza po wizycie: trzy kategorie, skala 1–5 */
 oceny:['Wyjaśnienie, co mi jest','Szacunek i życzliwość','Punktualność'],
 sor:'https://zarobkilekarzy.pl/prawa-pacjenta/sor/',
 gps:ZD_MIASTO.gps
};
ZDROWIE.ostatnia=ZDROWIE.wizyty[0];
/* badania i zabiegi: pozycje z rachunków wizyt (bez porad i e-recept) i badania zlecone przez lekarza rodzinnego
   (opłacane ze stawki POZ — bez osobnej kwoty); od najnowszych. Każde można zgłosić jako niewykonane. */
{
 const naDate=t=>{const [d,m,r]=t.split('.').map(Number);return new Date(r,m-1,d)};
 ZDROWIE.badania=[
  ...ZDROWIE.wizyty.flatMap(v=>v.pozycje.filter(([n])=>!/^(Porada|E-recepta)/.test(n)).map(([n,g])=>({nazwa:n,data:v.data,miejsce:v.miejsce,lekarz:v.lekarz,wizyta:v.nr,kwota:g,poz:!!v.poz}))),
  {nazwa:'Morfologia krwi z rozmazem',data:ZD_DATA(ZD_DZIEN(-62)),miejsce:ZD_POZ+', punkt pobrań',lekarz:'lek. Ewa Bąk',kwota:null,poz:true},
  {nazwa:'RTG klatki piersiowej',data:ZD_DATA(ZD_DZIEN(-150)),miejsce:ZD_SZPITAL+', pracownia RTG',lekarz:'lek. Ewa Bąk',kwota:null,poz:true}
 ].sort((a,b)=>naDate(b.data)-naDate(a.data));
}

{
 const holder=(OS.imie+' '+OS.nazwisko).toUpperCase();
 const zd=ZDROWIE,o=zd.umowione[0],w=zd.ostatnia;
 OS.docs.splice(1,0,{id:'zdrowie',name:'Moje zdrowie',img:'assets/card-zdrowie.svg',strip:'assets/strip-zdrowie.svg',
  sub:'Dziś '+zd.dzis.godz+', numerek '+zd.dzis.numerek,photo:1,holder,line:'Karta nr '+zd.karta,
  f:[['Nr karty',zd.karta],['Zapisane wizyty',String(zd.wizytNaKarcie)]],
  rows:[['Posiadacz',OS.imie+' '+OS.nazwisko],['Numer karty',zd.karta],['Zapisane wizyty',String(zd.wizytNaKarcie)]]});
 OS.tiles.unshift(
  {i:'bell',h:'Potwierdź wizytę '+o.u,d:o.data+', '+o.godz+' · '+o.kolejka+'. w kolejce',k:'zdPrzypomnienie',u:1,
   s:o.miejsce+', <span data-t="0">'+o.lekarz+'</span>',q:'Wizyta '+o.u+' '+o.data},
  {i:'check',h:'Czy wizyta się odbyła?',d:w.poradnia+', '+w.data,k:'zdPoWizycie',u:1,
   s:'Potwierdź wizytę i oceń lekarza',q:'Wizyta '+w.u+' '+w.data}
 );
 OS.ask.zdrowie='Co jest na mojej karcie zdrowia?';
}
