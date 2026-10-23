/* ---------- Baza sylwetek pojazdów: model z CEPiK -> typ nadwozia i wymiary -> rysunek z boku w kolorze z rejestru ----------
   Sylwetki są rysowane parametrycznie (typ nadwozia, długość, wysokość, rozstaw osi), bez logotypów i detali stylistycznych marek. */
(function(root){
 /* typ, długość, wysokość, rozstaw osi [mm] */
 const BAZA={
  // Toyota
  'toyota corolla touring sports':['kombi',4650,1460,2700],'toyota corolla sedan':['sedan',4630,1435,2700],'toyota corolla cross':['suv',4460,1620,2640],'toyota corolla':['hatch',4370,1435,2640],
  'toyota yaris cross':['crossover',4180,1590,2560],'toyota yaris':['hatch',3940,1500,2560],'toyota aygo x':['crossover',3700,1510,2430],'toyota aygo':['mini',3470,1460,2340],
  'toyota c-hr':['crossover',4360,1555,2640],'toyota rav4':['suv',4600,1690,2690],'toyota auris':['hatch',4330,1475,2600],'toyota avensis':['sedan',4750,1480,2700],
  'toyota prius':['liftback',4600,1430,2750],'toyota land cruiser':['suv',4890,1880,2850],'toyota proace':['van',4960,1900,3275],'toyota hilux':['pickup',5325,1815,3085],
  // Skoda
  'skoda octavia combi':['kombi',4690,1470,2690],'skoda octavia':['liftback',4690,1470,2690],'skoda superb combi':['kombi',4900,1480,2840],'skoda superb':['liftback',4870,1470,2840],
  'skoda fabia combi':['kombi',4260,1470,2470],'skoda fabia':['hatch',4110,1460,2560],'skoda scala':['hatch',4360,1470,2650],'skoda kamiq':['crossover',4240,1530,2650],
  'skoda karoq':['suv',4390,1620,2640],'skoda kodiaq':['suv',4700,1680,2790],'skoda enyaq':['suv',4650,1620,2770],'skoda citigo':['mini',3600,1480,2420],'skoda rapid':['liftback',4480,1460,2600],
  // Volkswagen
  'volkswagen golf iv':['hatch',4150,1440,2510],'volkswagen golf v':['hatch',4200,1480,2580],'volkswagen golf vi':['hatch',4200,1480,2580],'volkswagen golf vii':['hatch',4260,1450,2620],
  'volkswagen golf variant':['kombi',4630,1480,2670],'volkswagen golf':['hatch',4280,1460,2630],'volkswagen polo':['hatch',4070,1450,2560],'volkswagen up':['mini',3600,1480,2420],
  'volkswagen passat variant':['kombi',4890,1510,2790],'volkswagen passat':['sedan',4770,1460,2790],'volkswagen tiguan':['suv',4510,1670,2680],'volkswagen t-roc':['crossover',4240,1570,2600],
  'volkswagen touran':['mpv',4530,1660,2790],'volkswagen sharan':['mpv',4850,1720,2920],'volkswagen arteon':['liftback',4860,1430,2840],'volkswagen id.3':['hatch',4260,1570,2770],
  'volkswagen id.4':['suv',4580,1640,2770],'volkswagen caddy':['kombivan',4500,1830,2750],'volkswagen transporter':['van',4900,1990,3000],'volkswagen crafter':['furgon',5990,2590,3640],
  'volkswagen amarok':['pickup',5250,1880,3270],'volkswagen touareg':['suv',4880,1710,2900],
  // Opel
  'opel astra sports tourer':['kombi',4640,1480,2730],'opel astra':['hatch',4370,1460,2680],'opel corsa':['hatch',4060,1440,2540],'opel insignia':['liftback',4900,1460,2830],
  'opel mokka':['crossover',4150,1530,2560],'opel grandland':['suv',4480,1610,2680],'opel zafira':['mpv',4660,1680,2760],'opel meriva':['mpv',4290,1620,2640],'opel vivaro':['van',4960,1900,2980],
  'opel combo':['kombivan',4400,1840,2790],'opel movano':['furgon',5410,2500,3450],'opel vectra':['sedan',4600,1460,2700],
  // Ford
  'ford focus kombi':['kombi',4670,1480,2700],'ford focus':['hatch',4380,1470,2700],'ford fiesta':['hatch',4040,1480,2490],'ford mondeo':['liftback',4870,1480,2850],
  'ford kuga':['suv',4610,1680,2710],'ford puma':['crossover',4190,1540,2590],'ford s-max':['mpv',4800,1660,2850],'ford transit custom':['van',4970,1980,2930],'ford transit':['furgon',5530,2540,3300],
  'ford ranger':['pickup',5370,1880,3270],'ford mustang':['coupe',4790,1390,2720],
  // Fiat
  'fiat panda':['mini',3650,1550,2300],'fiat 500':['mini',3570,1490,2300],'fiat tipo kombi':['kombi',4570,1510,2640],'fiat tipo':['sedan',4530,1500,2640],'fiat punto':['hatch',4070,1490,2510],
  'fiat seicento':['mini',3340,1440,2200],'fiat 126p':['mini',3050,1340,1840],'fiat doblo':['kombivan',4400,1850,2750],'fiat ducato':['furgon',5410,2520,3450],'fiat bravo':['hatch',4340,1500,2600],
  // Renault, Dacia
  'renault clio':['hatch',4050,1440,2580],'renault megane':['hatch',4360,1450,2670],'renault captur':['crossover',4230,1580,2640],'renault kadjar':['suv',4490,1610,2650],
  'renault austral':['suv',4510,1620,2670],'renault scenic':['mpv',4630,1650,2800],'renault trafic':['van',5000,1970,3100],'renault master':['furgon',5550,2500,3680],
  'dacia duster':['suv',4340,1650,2660],'dacia sandero':['hatch',4090,1500,2600],'dacia logan':['sedan',4400,1500,2650],'dacia jogger':['kombi',4550,1630,2900],'dacia spring':['mini',3730,1520,2420],
  // Hyundai, Kia
  'hyundai i10':['mini',3670,1480,2430],'hyundai i20':['hatch',4040,1450,2580],'hyundai i30 kombi':['kombi',4590,1470,2650],'hyundai i30':['hatch',4340,1450,2650],
  'hyundai tucson':['suv',4500,1650,2680],'hyundai kona':['crossover',4350,1580,2660],'hyundai santa fe':['suv',4790,1700,2815],'hyundai ioniq 5':['crossover',4640,1600,3000],
  'kia picanto':['mini',3600,1480,2400],'kia rio':['hatch',4070,1450,2580],'kia ceed sw':['kombi',4600,1470,2650],'kia ceed':['hatch',4320,1450,2650],'kia sportage':['suv',4520,1650,2680],
  'kia niro':['crossover',4420,1550,2720],'kia stonic':['crossover',4140,1520,2580],'kia sorento':['suv',4810,1700,2815],'kia ev6':['crossover',4680,1550,2900],
  // BMW, Audi, Mercedes
  'bmw seria 1':['hatch',4320,1430,2670],'bmw seria 3 touring':['kombi',4710,1440,2850],'bmw seria 3':['sedan',4710,1440,2850],'bmw seria 5':['sedan',4960,1480,2980],
  'bmw x1':['suv',4500,1640,2690],'bmw x3':['suv',4710,1680,2860],'bmw x5':['suv',4920,1750,2970],'bmw 3':['sedan',4710,1440,2850],'bmw 5':['sedan',4960,1480,2980],
  'audi a3 sportback':['hatch',4340,1430,2640],'audi a3':['hatch',4340,1430,2640],'audi a4 avant':['kombi',4760,1430,2820],'audi a4':['sedan',4760,1430,2820],
  'audi a6 avant':['kombi',4940,1470,2920],'audi a6':['sedan',4940,1460,2920],'audi q3':['suv',4480,1610,2680],'audi q5':['suv',4680,1660,2820],'audi q7':['suv',5060,1740,3000],
  'mercedes-benz klasa a':['hatch',4420,1440,2730],'mercedes-benz klasa c':['sedan',4750,1440,2870],'mercedes-benz klasa e':['sedan',4950,1470,2960],'mercedes-benz glc':['suv',4720,1640,2890],
  'mercedes-benz vito':['van',5140,1910,3200],'mercedes-benz sprinter':['furgon',5930,2650,3660],'mercedes-benz tourismo':['autokar',12140,3680,6080],
  // inne popularne
  'peugeot 208':['hatch',4060,1430,2540],'peugeot 308 sw':['kombi',4640,1440,2730],'peugeot 308':['hatch',4370,1440,2680],'peugeot 2008':['crossover',4300,1550,2610],'peugeot 3008':['suv',4540,1640,2680],
  'peugeot partner':['kombivan',4400,1840,2790],'citroen c3':['hatch',4010,1480,2540],'citroen c4':['crossover',4360,1520,2670],'citroen berlingo':['kombivan',4400,1840,2790],'citroen c5 aircross':['suv',4500,1670,2730],
  'nissan qashqai':['suv',4430,1630,2670],'nissan juke':['crossover',4210,1590,2640],'nissan micra':['hatch',4000,1450,2530],'nissan x-trail':['suv',4680,1720,2700],'nissan leaf':['hatch',4490,1540,2700],
  'mazda 3':['hatch',4460,1440,2730],'mazda 6':['sedan',4870,1450,2830],'mazda cx-30':['crossover',4400,1540,2650],'mazda cx-5':['suv',4580,1680,2700],'mazda mx-5':['kabriolet',3920,1230,2310],
  'honda civic':['hatch',4550,1410,2730],'honda jazz':['mini',4090,1530,2520],'honda cr-v':['suv',4700,1680,2700],'honda hr-v':['crossover',4330,1590,2610],
  'suzuki swift':['hatch',3860,1500,2450],'suzuki vitara':['crossover',4180,1610,2500],'suzuki ignis':['mini',3700,1600,2440],'suzuki s-cross':['crossover',4300,1580,2600],
  'seat leon':['hatch',4370,1460,2690],'seat ibiza':['hatch',4060,1450,2560],'seat arona':['crossover',4150,1550,2570],'seat ateca':['suv',4380,1620,2630],'cupra formentor':['crossover',4450,1520,2680],
  'tesla model 3':['sedan',4720,1440,2880],'tesla model y':['crossover',4750,1620,2890],'volvo xc40':['suv',4440,1650,2700],'volvo xc60':['suv',4710,1660,2870],'volvo xc90':['suv',4950,1780,2980],
  'volvo v60':['kombi',4760,1430,2870],'volvo v90':['kombi',4940,1480,2940],'mitsubishi asx':['crossover',4230,1590,2640],'mitsubishi outlander':['suv',4710,1740,2710],'mitsubishi space star':['mini',3850,1520,2450],
  'lexus nx':['suv',4660,1660,2690],'lexus ux':['crossover',4500,1540,2640],'jeep renegade':['suv',4240,1690,2570],'jeep compass':['suv',4400,1640,2640],'mg zs':['crossover',4320,1640,2585],
  'byd atto 3':['crossover',4460,1620,2720],'porsche 911':['coupe',4520,1300,2450],'mini cooper':['mini',3880,1430,2500],'smart fortwo':['mini',2700,1550,1870],
 };
 const ALIAS=[[/\bvw\b/g,'volkswagen'],[/mercedes(?!-benz)/g,'mercedes-benz'],[/\bclass\b/g,'klasa'],[/\bseria\s*(\d)/g,'seria $1'],[/\bsportswagon|sports\s*wagon|kombi|estate|\bsw\b|touring|avant|variant|combi\b/g,'$&'],[/škoda/g,'skoda'],[/citroën/g,'citroen']];
 const KOLORY={'biały':'#f1f2f4','bialy':'#f1f2f4','czarny':'#1d2026','srebrny':'#b8bdc5','szary':'#878d96','grafitowy':'#4b5159','czerwony':'#c6262d','bordowy':'#7a1f2b','niebieski':'#2d62c6',
  'granatowy':'#1e3462','zielony':'#2f7a4d','żółty':'#e6bc2f','zolty':'#e6bc2f','pomarańczowy':'#e5762a','pomaranczowy':'#e5762a','brązowy':'#6a4932','brazowy':'#6a4932','beżowy':'#cbb692','bezowy':'#cbb692',
  'fioletowy':'#6b4a9e','złoty':'#c7a34a','zloty':'#c7a34a','błękitny':'#5aa0dc'};
 const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
 function znajdz(model){
  let n=norm(model);ALIAS.forEach(([a,b])=>{n=n.replace(a,b)});
  let best=null;for(const k in BAZA){if(n.includes(k)&&(!best||k.length>best.length))best=k}
  if(best){const [typ,L,H,wb]=BAZA[best];return {klucz:best,typ,L,H,wb}}
  // nieznany model: zgadnij typ z nazwy
  const typ=/kombi|combi|variant|touring|avant|estate|\bsw\b|tourer/.test(n)?'kombi':/suv|4x4|x-trail|cross/.test(n)?'suv':/bus|autokar|autobus/.test(n)?'autokar':/furgon|dostawcz/.test(n)?'furgon':/\bvan\b/.test(n)?'van':/sedan|limuzyn/.test(n)?'sedan':'hatch';
  const D={hatch:[4300,1460,2640],kombi:[4650,1480,2700],suv:[4550,1660,2700],sedan:[4700,1450,2800],van:[4950,1950,3050],furgon:[5600,2550,3500],autokar:[12000,3600,6000]}[typ]||[4300,1460,2640];
  return {klucz:null,typ,L:D[0],H:D[1],wb:D[2]};
 }
 function kolor(k){const n=norm(k);for(const x in KOLORY)if(n.startsWith(x.slice(0,5)))return KOLORY[x];return /^#[0-9a-f]{6}$/i.test(k||'')?k:'#9aa1ab'}
 const mix=(h,t,a)=>{const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const A=p(h),B=p(t);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*a).toString(16).padStart(2,'0')).join('')};
 const lum=h=>{const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);return .2126*r+.7152*g+.0722*b};

 /* profil nadwozia: punkty (x od przodu, y od ziemi) w mm; zwraca też okna i koła */
 function profil(s){
  const {typ,L,H,wb}=s,big=typ==='autokar'||typ==='furgon';
  const r=typ==='autokar'?520:typ==='furgon'?360:typ==='suv'||typ==='pickup'?360:typ==='van'||typ==='kombivan'||typ==='mpv'?335:typ==='mini'?290:typ==='coupe'||typ==='kabriolet'?330:315;
  const c=typ==='suv'||typ==='pickup'?250:typ==='crossover'?215:big||typ==='van'?230:typ==='kombivan'||typ==='mpv'?190:165;
  const ohf=typ==='autokar'?L*0.21:typ==='furgon'||typ==='van'?(L-wb)*0.47:(L-wb)*0.52;
  const xf=ohf,xr=ohf+wb;
  const T={ // [wysokość linii okien, nos, koniec maski x, góra słupka A x, koniec dachu x, opadanie dachu, profil tyłu]
   hatch:{hb:.62,nose:.44,hood:.25,a:.43,re:.76,dr:.05,tail:[[.905,.74],[.978,.60],[1,.42]],g:[.27,.45,.75,.885]},
   mini:{hb:.60,nose:.46,hood:.20,a:.39,re:.86,dr:.03,tail:[[.965,.72],[.995,.56],[1,.40]],g:[.22,.41,.85,.95]},
   kombi:{hb:.63,nose:.43,hood:.25,a:.43,re:.91,dr:.035,tail:[[.975,.70],[.995,.56],[1,.40]],g:[.27,.45,.90,.965]},
   liftback:{hb:.63,nose:.42,hood:.25,a:.44,re:.70,dr:.03,tail:[[.93,.73],[.985,.68],[1,.44]],g:[.27,.46,.69,.91]},
   sedan:{hb:.63,nose:.42,hood:.26,a:.45,re:.67,dr:.025,tail:[[.83,.72],[.975,.70],[1,.46]],g:[.28,.47,.66,.82]},
   coupe:{hb:.62,nose:.40,hood:.32,a:.52,re:.68,dr:.05,tail:[[.90,.70],[.98,.66],[1,.44]],g:[.34,.54,.67,.88]},
   kabriolet:{hb:.70,nose:.42,hood:.34,a:.50,re:.60,dr:.08,tail:[[.80,.74],[.97,.72],[1,.48]],g:[.36,.51,.59,.70]},
   crossover:{hb:.62,nose:.47,hood:.25,a:.45,re:.77,dr:.06,tail:[[.925,.74],[.985,.60],[1,.43]],g:[.27,.47,.76,.90]},
   suv:{hb:.61,nose:.50,hood:.25,a:.43,re:.89,dr:.025,tail:[[.975,.72],[.995,.60],[1,.44]],g:[.27,.45,.88,.965]},
   mpv:{hb:.58,nose:.43,hood:.17,a:.37,re:.92,dr:.03,tail:[[.985,.70],[1,.55],[1,.42]],g:[.19,.39,.91,.975]},
   kombivan:{hb:.55,nose:.42,hood:.16,a:.33,re:.95,dr:.01,tail:[[.995,.75],[1,.55],[1,.40]],g:[.18,.35,.94,.985]},
   van:{hb:.53,nose:.36,hood:.10,a:.27,re:.985,dr:0,tail:[[1,.86],[1,.6],[1,.35]],g:[.12,.29,.97,.99],sideStop:.55},
   furgon:{hb:.50,nose:.32,hood:.10,a:.23,re:.99,dr:0,tail:[[1,.92],[1,.6],[1,.3]],g:[.115,.25,.30,.32],sideStop:.32},
   pickup:{hb:.60,nose:.52,hood:.24,a:.40,re:.62,dr:.02,tail:[[.64,.62],[1,.62],[1,.42]],g:[.26,.42,.61,.64]},
   autokar:{hb:.62,nose:.30,hood:.005,a:.035,re:.995,dr:0,tail:[[1,.94],[1,.6],[1,.25]],g:[.012,.04,.97,.99],bus:1}
  }[typ]||null;
  const t=T||{hb:.62,nose:.44,hood:.25,a:.43,re:.76,dr:.05,tail:[[.905,.74],[.978,.60],[1,.42]],g:[.27,.45,.75,.885]};
  const yb=c+(big?60:70),hb=H*t.hb,ny=H*t.nose,top=H,rd=H*t.dr;
  const X=f=>f*L;
  // obrys: od dolnego przodu, w górę przez maskę, dach, tył, dół z nadkolami
  const P=[];
  P.push(`M${X(.012)} ${-yb}`);
  P.push(`C${X(-.004)} ${-yb-60} ${X(-.006)} ${-ny+40} ${X(.006)} ${-ny}`);                        // zderzak
  P.push(`Q${X(.03)} ${-ny-H*.07} ${X(.09)} ${-ny-H*.09}`);                                          // przód maski
  P.push(`L${X(t.hood)} ${-hb}`);                                                                      // maska
  P.push(`Q${X(t.hood+(t.a-t.hood)*.55)} ${-(hb+(top-hb)*.82)} ${X(t.a)} ${-top}`);                    // szyba czołowa
  P.push(`Q${X((t.a+t.re)/2)} ${-top-H*.012} ${X(t.re)} ${-(top-rd)}`);                               // dach
  const tl=t.tail;
  const rk=t.rk!=null?t.rk:{hatch:.30,crossover:.32,liftback:.45,sedan:.35,coupe:.4,kabriolet:.3,mini:.55}[typ]!=null?{hatch:.30,crossover:.32,liftback:.45,sedan:.35,coupe:.4,kabriolet:.3,mini:.55}[typ]:.85;
  const yRe=top-rd,y0=H*tl[0][1];
  P.push(`Q${X(t.re+(tl[0][0]-t.re)*rk)} ${-(yRe-(yRe-y0)*(rk<.6?.12:.02))} ${X(tl[0][0])} ${-y0}`);          // tylna szyba / słupek D
  P.push(`Q${X(tl[1][0])} ${-H*(tl[0][1]-.02)} ${X(tl[1][0])} ${-H*tl[1][1]}`);
  P.push(`L${X(tl[2][0])} ${-H*tl[2][1]}`);
  P.push(`Q${X(1.004)} ${-yb-40} ${X(.985)} ${-yb}`);                                                 // tylny zderzak
  // dół i nadkola (od tyłu do przodu)
  const R=r+(big?60:45),dy=Math.max(0,r-c+ (big?20:0)),dx=Math.sqrt(Math.max(1,R*R-(r-c)*(r-c)));
  P.push(`L${xr+dx+20} ${-c}`);P.push(`L${xr+dx} ${-c}`);
  P.push(`A${R} ${R} 0 1 0 ${xr-dx} ${-c}`);
  P.push(`L${xf+dx} ${-c}`);
  P.push(`A${R} ${R} 0 1 0 ${xf-dx} ${-c}`);
  P.push(`L${X(.03)} ${-c}`);P.push(`Q${X(.012)} ${-c} ${X(.012)} ${-yb}Z`);
  // okna
  const [g0,g1,g2,g3]=t.g,gy=hb+H*.035,gt=top-H*.075;
  let G;
  if(t.bus){
   G=`M${X(g0)} ${-H*.30}L${X(g0+.006)} ${-gt}L${X(g3)} ${-gt}L${X(g3)} ${-gy}L${X(.06)} ${-gy}Q${X(.03)} ${-gy} ${X(.025)} ${-H*.30}Z`;
  }else if(t.sideStop){
   G=`M${X(g0+.01)} ${-gy}L${X(g1-.01)} ${-gt}L${X(g1+.06)} ${-gt}L${X(t.sideStop-.02)} ${-gt}L${X(t.sideStop-.02)} ${-gy}Z`;
  }else{
   G=`M${X(g0+.02)} ${-gy}Q${X(g0+(g1-g0)*.6)} ${-(gy+(gt-gy)*.85)} ${X(g1+.015)} ${-gt}`+
     `Q${X((g1+g2)/2)} ${-gt-H*.01} ${X(g2-.01)} ${-(gt-rd*.6)}`+
     `Q${X(g3-.005)} ${-(gt-rd*.6)} ${X(g3-.015)} ${-gy}Z`;
  }
  // słupek B (i C w dłuższych)
  const pil=[];
  if(!t.bus&&!t.sideStop&&typ!=='coupe'&&typ!=='kabriolet'){
   const pb=g1+(g2-g1)*(typ==='mini'||typ==='hatch'&&L<3900?.55:.47);pil.push(pb);
   if((typ==='kombi'||typ==='suv'||typ==='mpv'||typ==='kombivan')&&g3-g2<.12)pil.push(g2-.005);
  }
  if(t.bus)for(let i=1;i<9;i++)pil.push(.06+i*(.96-.06)/9);
  return {d:P.join(''),g:G,pil:pil.map(X),gy,gt,xf,xr,r,big,L,H};
 }

 let uid=0;
 function svg(model,kol,opt={}){
  const s=znajdz(model),p=profil(s),col=kolor(kol),id='sy'+(++uid);
  const dark=lum(col)<.25,light=lum(col)>.8;
  const pad=120,w=p.L+2*pad,h=p.H+pad*1.2;
  const glass=opt.glass||'#2a3442',stroke=light?'rgba(20,25,35,.28)':'rgba(0,0,0,.18)';
  const wheel=(x)=>`<g transform="translate(${x} ${-p.r})"><circle r="${p.r}" fill="#1b1d22"/><circle r="${p.r*.64}" fill="#9aa0a8"/><circle r="${p.r*.5}" fill="#c9cdd3"/><circle r="${p.r*.16}" fill="#80868f"/></g>`;
  const pillars=p.pil.map(x=>`<rect x="${x-26}" y="${-p.gt-20}" width="52" height="${p.gt-p.gy+40}" fill="${col}"/>`).join('');
  const shadow=opt.shadow===false?'':`<ellipse cx="${p.L/2}" cy="6" rx="${p.L*.48}" ry="${p.big?60:42}" fill="rgba(0,0,0,.22)"/>`;
  return `<svg class="sylwetka" viewBox="${-pad} ${-p.H-pad*.6} ${w} ${h}" role="img" aria-label="${(opt.label||model||'Pojazd').replace(/"/g,'')}" preserveAspectRatio="xMidYMax meet">
<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(col,'#ffffff',dark?.18:.22)}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="${mix(col,'#000000',dark?.25:.32)}"/></linearGradient>
<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(glass,'#ffffff',.28)}"/><stop offset=".6" stop-color="${glass}"/><stop offset="1" stop-color="${mix(glass,'#000000',.2)}"/></linearGradient>
<clipPath id="${id}c"><path d="${p.g}"/></clipPath></defs>
${shadow}<path d="${p.d}" fill="url(#${id}b)" stroke="${stroke}" stroke-width="${p.big?14:9}" stroke-linejoin="round"/>
<path d="${p.g}" fill="url(#${id}g)"/><g clip-path="url(#${id}c)">${pillars}</g>
${wheel(p.xf)}${wheel(p.xr)}</svg>`;
 }
 function opis(model){const s=znajdz(model);return {typ:s.typ,znany:!!s.klucz,klucz:s.klucz}}
 const api={svg,znajdz,kolor,opis,BAZA,TYPY:['hatch','mini','kombi','liftback','sedan','coupe','kabriolet','crossover','suv','mpv','kombivan','van','furgon','pickup','autokar']};
 if(typeof module!=='undefined')module.exports=api;else root.SYLWETKI=api;
})(this);
