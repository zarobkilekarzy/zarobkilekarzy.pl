/* ---------- osoby demonstracyjne (fikcyjne): dokumenty w portfelu, przypomnienia i dane do przekazania ----------
   Wybór: ?osoba=jan w adresie albo w menu „Układ dokumentów”. Zapamiętywane w tej przeglądarce. */
const OSOBY={
 marta:{id:'marta',plec:'K',imie:'Marta',nazwisko:'Kowalska',wolacz:'Marto',opis:'Warszawa, 35 lat, mama trójki dzieci',
  docs:[
   {id:'dowod',name:'mDowód',img:'assets/card-mdowod-bez.png',strip:'assets/strip-mdowod.png',sub:'Dowód ważny do 20.05.2031',photo:1,holder:'MARTA KOWALSKA',line:'PESEL 91071427765',f:[['PESEL','91071427765'],['Data urodzenia','14.07.1991'],['Dowód osobisty','ABC 123456'],['Dowód ważny do','20.05.2031']],rows:[['Imię','Marta'],['Nazwisko','Kowalska'],['PESEL','91071427765'],['Data urodzenia','14.07.1991'],['Dowód osobisty','ABC 123456, ważny do 20.05.2031']],screen:'assets/mdowod-ekran.png'},
   {id:'kdr',name:'Karta Dużej Rodziny',img:'assets/card-kdr-bez.png',strip:'assets/strip-kdr.png',sub:'Ważna bezterminowo',photo:1,holder:'MARTA KOWALSKA',line:'Nr KDR 2024/118 554',f:[['Nr karty','2024/118 554'],['Ważna','bezterminowo'],['PESEL','91071427765']],rows:[['Posiadaczka','Marta Kowalska'],['PESEL','91071427765'],['Numer karty','KDR 2024/118 554'],['Ważna','bezterminowo (rodzic)']]},
   {id:'pj',name:'mPrawo jazdy',img:'assets/card-prawo-jazdy-bez.png',strip:'assets/strip-prawo-jazdy.png',sub:'Kat. B, 5 pkt karnych',photo:1,holder:'MARTA KOWALSKA',line:'Kategoria B, nr 01234/20/1465',f:[['Kategorie','B'],['Ważne do','30.06.2035'],['Nr blankietu','01234/20/1465'],['Punkty karne','5']],rows:[['Numer blankietu','01234/20/1465'],['Kategorie','B'],['Ważne do','30.06.2035'],['Punkty karne','5']]},
   {id:'auto',name:'Moje pojazdy',img:'assets/card-pojazdy-bez.png',strip:'assets/strip-pojazdy.png',sub:'Toyota Corolla, WX 4521K',alert:'OC za 11 dni',plate:'WX 4521K',model:'Toyota Corolla',kolor:'srebrny',holder:'TOYOTA COROLLA 1.8 HYBRID',who:'Toyota Corolla 1.8 Hybrid',line:'OC do 29.10.2026, badanie do 12.04.2027',f:[['OC do','29.10.2026'],['Badanie do','12.04.2027']],rows:[['Pojazd','Toyota Corolla 1.8 Hybrid, 2021'],['Nr rejestracyjny','WX 4521K'],['Kolor','srebrny'],['OC','Warta, do 29.10.2026'],['Badanie techniczne','do 12.04.2027'],['Ostatni odczyt licznika','58 210 km']]}
  ],
  tiles:[
   {i:'mail',h:'Pismo z Urzędu Skarbowego',d:'Odpowiedź do 26.10',k:'letter',u:1,s:'Wezwanie do wyjaśnień w sprawie ulgi termomodernizacyjnej',q:'Co jest w piśmie z Urzędu Skarbowego?'},
   {i:'car',h:'Koniec okresu OC Toyoty',d:'Za 11 dni, 29.10',k:'oc',u:1,s:'Warta, WX 4521K, umowa zwykle przedłuża się sama, jeśli jej nie wypowiesz',q:'Kiedy kończy się OC Toyoty i co mam zrobić?'},
   {i:'coin',h:'Podatek od nieruchomości',d:'210 zł do 16.11',k:'pay',s:'IV rata 2026, Urząd m.st. Warszawy',q:'Chcę zapłacić podatek od nieruchomości'}
  ],
  moje:{imie_nazwisko:'Marta Kowalska',data_urodzenia:'14.07.1991',pesel:'91071427765',dowod:'ABC 123456, ważny do 20.05.2031',nr_dowodu:'ABC 123456',
   pelnoletnosc:'tak, ukończone 18 lat',prawo_jazdy:'kat. B, ważne do 30.06.2035',pojazd:'Toyota Corolla, WX 4521K',pojazd_model:'Toyota Corolla',pojazd_kolor:'srebrny',oc:'Warta, polisa 908 123 456 789',adres:'ul. Kwiatowa 12, Warszawa'},
  sugg:[['Zgubiłam portfel','zastrzeżenie dokumentów'],['Miałam stłuczkę','oświadczenie bez druku'],['Kupuję używane auto','historia, OC i umowa'],['Urodziło nam się dziecko','zgłoszenie do USC'],['Dostałam dziwnego SMS-a','sprawdzę i zgłoszę']],
  ask:{dowod:'Kiedy mój dowód traci ważność?',pj:'Ile mam punktów karnych?',auto:'Kiedy kończy się OC?',kdr:'Gdzie mogę użyć Karty Dużej Rodziny?'}
 },
 jan:{id:'jan',plec:'M',imie:'Jan',nazwisko:'Wiśniewski',wolacz:'Janie',opis:'Kraków, 43 lata, własna firma, troje dzieci',
  docs:[
   {id:'dowod',name:'mDowód',img:'assets/card-mdowod-bez.png',strip:'assets/strip-mdowod.png',sub:'Dowód ważny do 20.05.2030',photo:1,holder:'JAN WIŚNIEWSKI',line:'PESEL 83051203455',f:[['PESEL','83051203455'],['Data urodzenia','12.05.1983'],['Dowód osobisty','CDE 778812'],['Dowód ważny do','20.05.2030']],rows:[['Imię','Jan'],['Nazwisko','Wiśniewski'],['PESEL','83051203455'],['Data urodzenia','12.05.1983'],['Dowód osobisty','CDE 778812, ważny do 20.05.2030']]},
   {id:'kdr',name:'Karta Dużej Rodziny',img:'assets/card-kdr-bez.png',strip:'assets/strip-kdr.png',sub:'Ważna bezterminowo',photo:1,holder:'JAN WIŚNIEWSKI',line:'Nr KDR 2021/044 117',f:[['Nr karty','2021/044 117'],['Ważna','bezterminowo'],['PESEL','83051203455']],rows:[['Posiadacz','Jan Wiśniewski'],['PESEL','83051203455'],['Numer karty','KDR 2021/044 117'],['Ważna','bezterminowo (rodzic)']]},
   {id:'pj',name:'mPrawo jazdy',img:'assets/card-prawo-jazdy-bez.png',strip:'assets/strip-prawo-jazdy.png',sub:'Kat. B, C, bez punktów',photo:1,holder:'JAN WIŚNIEWSKI',line:'Kategorie B, C, nr 00871/12/1261',f:[['Kategorie','B, C'],['Ważne do','30.09.2033'],['Nr blankietu','00871/12/1261'],['Punkty karne','0']],rows:[['Numer blankietu','00871/12/1261'],['Kategorie','B, C'],['Ważne do','30.09.2033'],['Punkty karne','0']]},
   {id:'auto',name:'Moje pojazdy',img:'assets/card-pojazdy-bez.png',strip:'assets/strip-pojazdy.png',sub:'Skoda Octavia i VW Transporter',alert:'OC Transportera za 16 dni',plate:'KR 7G210',model:'Skoda Octavia Combi',kolor:'granatowy',holder:'SKODA OCTAVIA COMBI 2.0 TDI',who:'Skoda Octavia Combi, VW Transporter',line:'2 pojazdy, OC Transportera do 03.11.2026',f:[['OC do','02.03.2027'],['Badanie do','15.01.2027']],
    more:[{plate:'KR 2M884',model:'Volkswagen Transporter',kolor:'biały'}],
    rows:[['Pojazd','Skoda Octavia Combi 2.0 TDI, 2020'],['Nr rejestracyjny','KR 7G210'],['OC','PZU, do 02.03.2027'],['Badanie techniczne','do 15.01.2027'],['Drugi pojazd','VW Transporter T6.1, KR 2M884, w leasingu'],['OC Transportera','Allianz, do 03.11.2026']]}
  ],
  tiles:[
   {i:'mail',h:'Wyjaśnienia VAT dla urzędu',d:'Odpowiedź do 28.10',k:'letter',u:1,s:'Czynności sprawdzające JPK_V7M za sierpień, US Kraków-Podgórze',q:'Co chce ode mnie Urząd Skarbowy?'},
   {i:'car',h:'Koniec okresu OC Transportera',d:'Za 16 dni, 03.11',k:'oc',u:1,s:'Allianz, KR 2M884, auto w leasingu, OC uzgodnij z VW Leasing',q:'Kończy się OC Transportera, co mam zrobić?'},
   {i:'coin',h:'Składki ZUS za październik',d:'1 926,76 zł do 20.11',k:'pay',s:'Składki społeczne, zdrowotna osobno',q:'Ile mam do zapłaty w ZUS i kiedy?'},
   {i:'coin',h:'Podatek od nieruchomości',d:'186 zł do 16.11',k:'pay',s:'IV rata 2026, Urząd Miasta Krakowa, przelewem',q:'Jak zapłacić podatek od nieruchomości?'}
  ],
  moje:{imie_nazwisko:'Jan Wiśniewski',data_urodzenia:'12.05.1983',pesel:'83051203455',dowod:'CDE 778812, ważny do 20.05.2030',nr_dowodu:'CDE 778812',
   pelnoletnosc:'tak, ukończone 18 lat',prawo_jazdy:'kat. B, C, ważne do 30.09.2033',pojazd:'Skoda Octavia Combi, KR 7G210',pojazd_model:'Skoda Octavia Combi',pojazd_kolor:'granatowy',oc:'PZU, polisa 1021 448 120',adres:'ul. Wielicka 28 m. 15, Kraków'},
  sugg:[['Zgubiłem portfel','zastrzeżenie dokumentów'],['Co chce ode mnie Urząd Skarbowy?','pismo w sprawie VAT'],['Chcę na chwilę odblokować PESEL','kredyt na nowe auto'],['Jedziemy z dziećmi do Egiptu','paszport Igora i ostrzeżenia MSZ'],['Miałem stłuczkę','oświadczenie bez druku']],
  ask:{dowod:'Kiedy mój dowód traci ważność?',pj:'Ile mam punktów karnych?',auto:'Kiedy kończy się OC moich aut?',kdr:'Gdzie mogę użyć Karty Dużej Rodziny?'}
 },
 ewa:{id:'ewa',plec:'K',imie:'Ewa',nazwisko:'Nowak',wolacz:'Ewo',opis:'Lublin, 57 lat, nauczycielka, opiekuje się mamą',
  docs:[
   {id:'dowod',name:'mDowód',img:'assets/card-mdowod-bez.png',strip:'assets/strip-mdowod.png',sub:'Dowód ważny do 05.12.2026',alert:'Ważny jeszcze 48 dni',photo:1,holder:'EWA NOWAK',line:'PESEL 69020312845',f:[['PESEL','69020312845'],['Data urodzenia','03.02.1969'],['Dowód osobisty','AXK 552190'],['Dowód ważny do','05.12.2026']],rows:[['Imię','Ewa'],['Nazwisko','Nowak'],['PESEL','69020312845'],['Data urodzenia','03.02.1969'],['Dowód osobisty','AXK 552190, ważny do 05.12.2026']]},
   {id:'kdr',name:'Karta Dużej Rodziny',img:'assets/card-kdr-bez.png',strip:'assets/strip-kdr.png',sub:'Ważna bezterminowo',photo:1,holder:'EWA NOWAK',line:'Nr KDR 2019/302 881',f:[['Nr karty','2019/302 881'],['Ważna','bezterminowo'],['PESEL','69020312845']],rows:[['Posiadaczka','Ewa Nowak'],['PESEL','69020312845'],['Numer karty','KDR 2019/302 881'],['Ważna','bezterminowo (rodzic)']]},
   {id:'pj',name:'mPrawo jazdy',img:'assets/card-prawo-jazdy-bez.png',strip:'assets/strip-prawo-jazdy.png',sub:'Kat. B, bezterminowe',photo:1,holder:'EWA NOWAK',line:'Kategoria B, nr 03311/98/0663',f:[['Kategorie','B'],['Ważne','bezterminowo'],['Nr blankietu','03311/98/0663'],['Punkty karne','0']],rows:[['Numer blankietu','03311/98/0663'],['Kategorie','B'],['Ważne','bezterminowo, wymiana do 19.01.2033'],['Punkty karne','0']]},
   {id:'auto',name:'Moje pojazdy',img:'assets/card-pojazdy-bez.png',strip:'assets/strip-pojazdy.png',sub:'Fiat Panda, LU 5521P',alert:'Badanie za 21 dni',plate:'LU 5521P',model:'Fiat Panda',kolor:'czerwony',holder:'FIAT PANDA 1.2',who:'Fiat Panda 1.2',line:'Badanie do 08.11.2026, OC do 14.06.2027',f:[['OC do','14.06.2027'],['Badanie do','08.11.2026']],rows:[['Pojazd','Fiat Panda 1.2, 2016'],['Nr rejestracyjny','LU 5521P'],['Kolor','czerwony'],['OC','Link4, do 14.06.2027'],['Badanie techniczne','do 08.11.2026'],['Ostatni odczyt licznika','88 140 km']]}
  ],
  tiles:[
   {i:'id',h:'Dowód traci ważność',d:'05.12.2026, za 48 dni',k:'renew',u:1,s:'Wniosek złożysz tutaj, potem odciski palców w urzędzie do 30 dni',q:'Mój dowód traci ważność, co mam zrobić?'},
   {i:'car',h:'Badanie techniczne Pandy',d:'Do 08.11, za 21 dni',k:'oc',u:1,s:'LU 5521P, stacja kontroli pojazdów',q:'Kiedy mam badanie techniczne auta?'},
   {i:'coin',h:'Podatek od nieruchomości',d:'164 zł do 16.11',k:'pay',s:'IV rata 2026, Urząd Miasta Lublin, BLIK',q:'Chcę zapłacić podatek od nieruchomości'},
   {i:'mail',h:'Informacja z ZUS o emeryturze',d:'Nowa wiadomość',k:'letter',s:'Wiek emerytalny 03.02.2029, wniosek złożysz od 04.01.2029',q:'Ile będę miała emerytury?'}
  ],
  moje:{imie_nazwisko:'Ewa Nowak',data_urodzenia:'03.02.1969',pesel:'69020312845',dowod:'AXK 552190, ważny do 05.12.2026',nr_dowodu:'AXK 552190',
   pelnoletnosc:'tak, ukończone 18 lat',prawo_jazdy:'kat. B, bezterminowe',pojazd:'Fiat Panda, LU 5521P',pojazd_model:'Fiat Panda',pojazd_kolor:'czerwony',oc:'Link4, polisa L4 0071 226 908',adres:'ul. Narutowicza 18 m. 3, Lublin'},
  sugg:[['Mój dowód traci ważność','wniosek tutaj, odciski w urzędzie'],['Ile będę miała emerytury?','prognoza z ZUS'],['Jakie recepty ma moja mama?','upoważnienie od mamy w IKP'],['Dostałam dziwnego SMS-a','sprawdzę i zgłoszę'],['Zgubiłam portfel','zastrzeżenie dokumentów']],
  ask:{dowod:'Mój dowód traci ważność, co mam zrobić?',pj:'Kiedy muszę wymienić prawo jazdy?',auto:'Kiedy mam badanie techniczne?',kdr:'Gdzie mogę użyć Karty Dużej Rodziny?'}
 },
 kacper:{id:'kacper',plec:'M',imie:'Kacper',nazwisko:'Zieliński',wolacz:'Kacprze',opis:'Gdańsk, 20 lat, student, prawo jazdy od stycznia',
  docs:[
   {id:'dowod',name:'mDowód',img:'assets/card-mdowod-bez.png',strip:'assets/strip-mdowod.png',sub:'Dowód ważny do 02.04.2034',photo:1,holder:'KACPER ZIELIŃSKI',line:'PESEL 06232141719',f:[['PESEL','06232141719'],['Data urodzenia','21.03.2006'],['Dowód osobisty','DFT 220419'],['Dowód ważny do','02.04.2034']],rows:[['Imię','Kacper'],['Nazwisko','Zieliński'],['PESEL','06232141719'],['Data urodzenia','21.03.2006'],['Dowód osobisty','DFT 220419, ważny do 02.04.2034']]},
   {id:'leg',name:'mLegitymacja studencka',img:'assets/card-legitymacja-bez.png',strip:'assets/strip-legitymacja.png',sub:'Ważna do 31.03.2027',photo:1,holder:'KACPER ZIELIŃSKI',line:'Politechnika Gdańska, nr albumu 198442',f:[['Nr albumu','198442'],['Ważna do','31.03.2027'],['Uczelnia','PG'],['Ulga PKP','51%']],rows:[['Uczelnia','Politechnika Gdańska'],['Wydział','Elektroniki, Telekomunikacji i Informatyki'],['Numer albumu','198442'],['Ważna do','31.03.2027']]},
   {id:'pj',name:'mPrawo jazdy',img:'assets/card-prawo-jazdy-bez.png',strip:'assets/strip-prawo-jazdy.png',sub:'Kat. B, okres próbny, 3 pkt',alert:'3 z 20 pkt',photo:1,holder:'KACPER ZIELIŃSKI',line:'Kategoria B, okres próbny do 14.01.2028',f:[['Kategorie','B'],['Okres próbny','do 14.01.2028'],['Nr blankietu','00512/26/2861'],['Punkty karne','3']],rows:[['Numer blankietu','00512/26/2861'],['Kategorie','B'],['Wydane','14.01.2026'],['Okres próbny','do 14.01.2028'],['Limit punktów','20 do 14.01.2027, potem 24'],['Punkty karne','3']]},
   {id:'auto',name:'Moje pojazdy',img:'assets/card-pojazdy-bez.png',strip:'assets/strip-pojazdy.png',sub:'Volkswagen Golf, GD 8K113',plate:'GD 8K113',model:'Volkswagen Golf IV',kolor:'czarny',holder:'VOLKSWAGEN GOLF IV 1.4',who:'Volkswagen Golf IV 1.4',line:'OC do 01.02.2027, badanie do 20.01.2027',f:[['OC do','01.02.2027'],['Badanie do','20.01.2027']],rows:[['Pojazd','Volkswagen Golf IV 1.4, 2003'],['Nr rejestracyjny','GD 8K113'],['Kolor','czarny'],['OC','Ergo Hestia, do 01.02.2027'],['Badanie techniczne','do 20.01.2027'],['Ostatni odczyt licznika','251 300 km']]}
  ],
  tiles:[
   {i:'coin',h:'Mandat do zapłaty',d:'200 zł do 22.10',k:'pay',u:1,s:'Prędkość +18 km/h, 3 punkty karne',q:'Jak zapłacić mandat?'},
   {i:'clock',h:'Punkty karne: 3 z 20',d:'Limit 20 pkt do 14.01.2027',k:'oc',u:1,s:'W pierwszym roku po przekroczeniu 20 pkt starosta cofnie uprawnienia',q:'Ile mam punktów karnych i kiedy wygasną?'},
   {i:'mail',h:'Stypendium rektora',d:'Nowa decyzja',k:'letter',s:'1 100 zł miesięcznie od października',q:'Co jest w decyzji z Politechniki?'},
   {i:'doc',h:'Głosowanie w Gdańsku',d:'Wybory 2027',k:'todo',s:'Możesz na stałe przepisać się do obwodu w Gdańsku',q:'Jak zagłosować w Gdańsku, skoro jestem zameldowany w Elblągu?'}
  ],
  moje:{imie_nazwisko:'Kacper Zieliński',data_urodzenia:'21.03.2006',pesel:'06232141719',dowod:'DFT 220419, ważny do 02.04.2034',nr_dowodu:'DFT 220419',
   pelnoletnosc:'tak, ukończone 18 lat',prawo_jazdy:'kat. B, okres próbny do 14.01.2028',pojazd:'Volkswagen Golf IV, GD 8K113',pojazd_model:'Volkswagen Golf IV',pojazd_kolor:'czarny',oc:'Ergo Hestia, polisa EH 330 128 774',adres:'ul. Grunwaldzka 102 m. 7, Gdańsk'},
  sugg:[['Dostałem mandat, ile mam punktów?','pierwszy rok, limit 20 pkt'],['Kupuję używane auto','historia, OC i umowa'],['Chcę głosować w Gdańsku','zmiana stałego obwodu'],['Zgubiłem portfel','zastrzeżenie dokumentów'],['Dostałem dziwnego SMS-a','sprawdzę i zgłoszę']],
  ask:{dowod:'Kiedy mój dowód traci ważność?',pj:'Ile mam punktów karnych?',auto:'Kiedy kończy się OC Golfa?',leg:'Jaką zniżkę na pociąg daje mi legitymacja?'}
 }
};
const OSOBA_ID=(()=>{let q=null;try{q=new URLSearchParams(location.search).get('osoba')}catch(e){}
 if(q&&OSOBY[q]){try{localStorage.setItem('mobOsoba',q)}catch(e){}return q}
 try{const s=localStorage.getItem('mobOsoba');if(s&&OSOBY[s])return s}catch(e){}return 'marta'})();
const OS=OSOBY[OSOBA_ID];
const rodz=(k,m)=>OS.plec==='K'?k:m;
document.documentElement.style.setProperty('--foto',`url(assets/foto-${OS.id}.jpg)`);
function zmienOsobe(id){if(!OSOBY[id]||id===OSOBA_ID)return;try{localStorage.setItem('mobOsoba',id)}catch(e){}const u=new URL(location.href);u.searchParams.set('osoba',id);location.replace(u.toString())}
