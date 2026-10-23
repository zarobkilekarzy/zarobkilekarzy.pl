/* ---------- tryb agenta: model językowy + narzędzia przez /api/agent, głos przez /api/stt i /api/tts ---------- */
let AGENT=false,NEXT_VOICE=false;
const scriptRoute=route,scriptStartTopic=startTopic;
CONVS.forEach(c=>{c.api=[];c.stan=null});
const _mk=mkConv;mkConv=function(box){const c=_mk(box);c.api=[];c.stan=null;return c};

function botText(html,txt){clearEmpty();msgs.append(el(`<div class="msg bot" data-t="0">${html}</div>`));end();touch('bot',txt||plain(html))}
function lockOld(box){box.querySelectorAll('.ui .actions').forEach(x=>x.remove());box.querySelectorAll('.chips').forEach(x=>x.remove())}

async function agentCall(c,extra,voice){
 inflight++;CALLS++;KONIEC=false;if(VOICE)vstate('think');
 const ty=el('<div class="typing"><i></i><i></i><i></i></div>');c.el.append(ty);end();
 let res=null,err=null;
 try{
  const r=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({conv:c.id,messages:c.api,stan:c.stan,osoba:OS.id,lang:window.LANG||'pl'},extra))});
  res=await r.json();if(!r.ok)err=res.error||('HTTP '+r.status);
 }catch(e){err=String(e)}
 CALLS--;ty.remove();
 try{
  if(err){if(VOICE)vstate('idle');return {err}}
  c.api=res.messages;c.stan=res.stan;
  await renderEvents(res.events||[],voice);
  return {};
 }finally{settle()}
}
async function agentSend(t,opts={}){
 const c=WR,typed=!opts.chip;let voice=opts.voice||NEXT_VOICE;NEXT_VOICE=false;
 if(typed)c.voiceMode=voice;else voice=!!c.voiceMode;
 clearStage();lockOld(c.el);
 c.api.push({role:'user',content:(voice?'[głos] ':'')+(opts.hidden||t)});
 const ft=voice&&VOICE&&typed?setTimeout(fillerPlay,600):null;   // agent myśli dłużej niż chwilę: krótkie „Już sprawdzam.”
 const r=await agentCall(c,{},voice);
 clearTimeout(ft);
 if(r&&r.err){c.api.pop();console.warn('agent:',r.err);await scriptRoute(t)}
}
async function agentConfirm(id,ok){
 const c=WR;const r=await agentCall(c,{confirm:{id,ok}},!!c.voiceMode);
 if(r&&r.err)await say(ok?'Nie udało się połączyć z rejestrem. Spróbuj jeszcze raz za chwilę.':'Anulowałem. Nic nie zostało wysłane.');
}
async function renderEvents(evs,voice){
 const speak=[];let qrEv=null;
 for(const e of evs){
  const before=msgs.lastChild;
  if(e.t==='text'){await sleep(140);botText(e.html,e.plain);speak.push(e.plain)}
  else if(e.t==='card'){await info(e)}
  else if(e.t==='qr'){await card(`<div class="ui">${hd('qr',e.title)}<div class="qr">${qrSVG(11)}<div class="code">${e.code}</div></div></div>`);if(e.after){await sleep(1400);await info(e.after)}}
  else if(e.t==='doc'){await S.docShow(e.id)}
  else if(e.t==='chips'){chips(e.opcje.map(o=>({label:o,go:()=>agentSend(o,{chip:true})})),true);if(e.mow)speak.push(e.mow)}
  else if(e.t==='multi'){multi(e.opcje,sel=>agentSend(sel.join(', '),{chip:true}),true);if(e.mow)speak.push(e.mow)}
  else if(e.t==='qrflow'){qrEv=e}
  else if(e.t==='koniec'){KONIEC=VOICE}
  else if(e.t==='confirm'){await confirmCard({icon:e.icon,title:e.title,source:e.source,rows:e.rows||[],note:e.note||'',body:e.body||'',label:e.label||'Potwierdź',pojazd:e.pojazd||null,tl:e.tl,then:()=>agentConfirm(e.id,true),onCancel:()=>agentConfirm(e.id,false)});if(voice)speak.push(e.mow||((e.title?e.title+'. ':'')+'Sprawdź dane na karcie i potwierdź.'))}
  if(VOICE&&(e.t==='qr'||e.t==='doc'||e.t==='confirm'))stageFrom(before);
 }
 if(qrEv){const c=WR;if(voice&&speak.length)speakText(speak.join(' '));setTimeout(()=>runQr(c,qrEv),voice?900:350);return}
 if(voice&&speak.length)speakText(speak.join(' '));
 else if(VOICE)afterTurn();
}
async function runQr(c,e){
 if(VOICE)vstate('wait');
 const r=e.mode==='scan'?await qrFlow({kto:e.kto,doc:e.dok||'dowod'}):await przyjmijFlow({cel:e.cel||'tozsamosc'});
 stopSpeaking();
 const res=await agentCall(c,{confirm:{id:e.id,ok:!!r.ok,wynik:r.wynik||null}},!!c.voiceMode);
 if(res&&res.err)await say(r.ok?'Dane zostały przekazane.':'Zamknięto skaner.');
}

/* ---------- tryb głosowy: duży mikrofon, na ekranie tylko dokument i karta potwierdzenia ---------- */
let VOICE=false;
const VS={idle:'Dotknij, aby mówić',listen:'Słucham…',stt:'Rozpoznaję…',think:'Sprawdzam…',speak:'Mówię. Dotknij, aby przerwać',wait:'Potwierdź na karcie'};
function vstate(s){const v=$('#voice');if(!v)return;v.dataset.vs=s;$('#vstate').textContent=VS[s]||'';}
function stageFrom(before){
 const box=msgs;let n=before?before.nextSibling:box.firstChild;const nodes=[];
 while(n){nodes.push(n);n=n.nextSibling}
 nodes.filter(x=>x.nodeType===1&&x.classList.contains('ui')).forEach(node=>{const ph=document.createComment('scena');node.parentNode.insertBefore(ph,node);node._ph=ph;$('#vstage').append(node)});
}
function clearStage(){const st=$('#vstage');if(!st)return;[...st.children].forEach(n=>{if(n._ph&&n._ph.parentNode)n._ph.parentNode.replaceChild(n,n._ph);else n.remove()})}
function pendingConfirm(){return !!$('#vstage .ui .actions')}
function afterTurn(){if(!VOICE||CALLS)return;if(FILLER.end){FILLER.end.then(afterTurn);return}if(KONIEC){KONIEC=false;vstate('idle');setTimeout(()=>{if(VOICE&&!REC&&!SPEAKING)exitChat()},500);return}if(pendingConfirm()||(typeof PS!=='undefined'&&PS)||(typeof ZS!=='undefined'&&ZS)){vstate('wait');return}startRec()}
function enterVoice(){if(window.GLOS===false)return;audioCtx();fillerPrep();enterChat();closeHist();VOICE=true;app.classList.add('voicing');input.blur();$('#vheard').textContent='';vstate('idle');startRec()}
function exitVoice(){VOICE=false;stopRec(true);stopSpeaking();fillerStop();clearStage();app.classList.remove('voicing');vstate('idle');requestAnimationFrame(()=>{VIS.el.scrollTop=VIS.el.scrollHeight})}

/* ---------- głos: nagrywanie, rozpoznawanie, czytanie ---------- */
let AC=null,REC=null,SRC=null,SPEAKING=false,CALLS=0,KONIEC=false;   // CALLS: zapytania do agenta w toku; wtedy mikrofon czeka na odpowiedź. KONIEC: po pożegnaniu wracamy na ekran główny
function audioCtx(){if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state!=='running')try{AC.resume()}catch(e){}return AC}
function session(t){try{if(navigator.audioSession)navigator.audioSession.type=t}catch(e){}}
function speakDone(){SPEAKING=false;$('.bar').classList.remove('speaking');if(VOICE)afterTurn()}
function stopSpeaking(){SPEAKING=false;if(SRC){try{SRC.onended=null;SRC.stop()}catch(e){}SRC=null}try{speechSynthesis.cancel()}catch(e){}$('.bar').classList.remove('speaking')}
function fallbackSpeak(t){
 try{const u=new SpeechSynthesisUtterance(t);const LG=window.LANG||'pl';u.lang=LG==='pl'?'pl-PL':LG;const v=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith(LG));if(v)u.voice=v;
  u.onend=()=>{if(SPEAKING)speakDone()};SPEAKING=true;$('.bar').classList.add('speaking');if(VOICE)vstate('speak');speechSynthesis.speak(u)}
 catch(e){speakDone()}
}
/* wtrącenie: nagrane z góry, gra od razu; do czasu tłumaczenia „Już sprawdzam.” inne języki mówią przetłumaczone „Sprawdzam…” */
const FILLER={buf:null,lang:null,src:null,end:null};
function fillerTekst(){const T=window.T||(s=>s),t=T('Już sprawdzam.');return (window.LANG||'pl')!=='pl'&&t==='Już sprawdzam.'?T('Sprawdzam…'):t}
async function fillerPrep(){const L=window.LANG||'pl',ctx=audioCtx();if(!ctx||(FILLER.buf&&FILLER.lang===L))return;try{const ab=await ttsFetch(fillerTekst());FILLER.buf=przytnij(ctx,await ctx.decodeAudioData(ab));FILLER.lang=L}catch(e){}}
function przytnij(ctx,b){   // lektor dokleja ponad sekundę ciszy na końcu, a odpowiedź czeka na koniec wtrącenia
 const d=b.getChannelData(0);let e=d.length-1;while(e>0&&Math.abs(d[e])<0.02)e--;
 const n=Math.min(d.length,e+Math.round(b.sampleRate*0.12));if(n>=d.length-b.sampleRate*0.05)return b;
 const o=ctx.createBuffer(b.numberOfChannels,n,b.sampleRate);for(let c=0;c<b.numberOfChannels;c++)o.copyToChannel(b.getChannelData(c).subarray(0,n),c);return o}
function fillerPlay(){
 const ctx=audioCtx();if(!VOICE||!ctx||!FILLER.buf||SPEAKING||REC||FILLER.src)return;
 session('playback');const s=ctx.createBufferSource();s.buffer=FILLER.buf;s.connect(ctx.destination);FILLER.src=s;
 FILLER.end=new Promise(r=>{s.onended=()=>{FILLER.src=null;FILLER.end=null;r()}});s.start();
}
function fillerStop(){if(FILLER.src){try{FILLER.src.stop()}catch(e){}}}
function ttsFetch(t){return fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t,lang:window.LANG||'pl'})}).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()})}
async function speakText(t){
 stopSpeaking();t=t.trim();if(!t){if(VOICE)afterTurn();return}
 stopRec(true);   // mikrofon nie może nagrywać lektora: inaczej asystent odpowiada sam sobie
 session('playback');const ctx=audioCtx();
 // pierwsze zdanie osobno, żeby głos ruszył szybciej; reszta generuje się w tym czasie
 const m=t.match(/^.{12,}?[.!?](\s|$)/);const parts=m&&m[0].length<t.length?[m[0].trim(),t.slice(m[0].length).trim()]:[t];
 const token={};speakText.cur=token;
 try{
  if(!ctx)throw 0;
  const bufs=parts.map(ttsFetch);
  if(FILLER.end)await FILLER.end;   // odpowiedź zaczyna się po wtrąceniu, a nagranie generuje się w tym czasie
  if(speakText.cur!==token)return;
  SPEAKING=true;$('.bar').classList.add('speaking');if(VOICE)vstate('speak');
  for(const p of bufs){
   const ab=await p;if(speakText.cur!==token||!SPEAKING)return;
   const buf=await ctx.decodeAudioData(ab);if(ctx.state!=='running')try{await ctx.resume()}catch(e){}
   if(speakText.cur!==token||!SPEAKING)return;
   await new Promise(res=>{const s=ctx.createBufferSource();s.buffer=buf;s.connect(ctx.destination);SRC=s;s.onended=()=>{if(SRC===s)SRC=null;res()};s.start()});
   if(speakText.cur!==token||!SPEAKING)return;
  }
  speakDone();
 }catch(e){if(speakText.cur===token)fallbackSpeak(t)}
}
function glosDiag(d){try{fetch('/api/glos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({ua:navigator.userAgent.slice(0,160),lang:window.LANG||'pl',voice:VOICE},d)),keepalive:true}).catch(()=>{})}catch(e){}}
window.addEventListener('unhandledrejection',e=>glosDiag({wynik:'blad_js',err:String(e.reason&&(e.reason.stack||e.reason.message)||e.reason).slice(0,400)}));
window.addEventListener('error',e=>glosDiag({wynik:'blad_js',err:String(e.message)+' @'+e.filename+':'+e.lineno}));
function pickMime(){const c=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'];return window.MediaRecorder?c.find(m=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m))||'':''}
async function startRec(){
 if(REC)return;
 const bar=$('.bar');stopSpeaking();fillerStop();session('play-and-record');const ctx=audioCtx();
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
 catch(e){glosDiag({wynik:'brak_mikrofonu',err:String(e&&e.name||e)});session('playback');if(VOICE){vstate('idle');$('#vheard').textContent='Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki.'}else await say('Nie mam dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki.');return}
 glosDiag({wynik:'mikrofon_ok',ctx:ctx&&ctx.state,mime:pickMime(),as:navigator.audioSession&&navigator.audioSession.type});   // TYMCZASOWO: diagnostyka
 const mime=pickMime(),mr=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[];
 const an=ctx?ctx.createAnalyser():null;let src=null;if(an){an.fftSize=1024;src=ctx.createMediaStreamSource(stream);src.connect(an)}
 const data=new Float32Array(1024);let floor=0.01,spoke=false,lastVoice=Date.now(),voiced=0,maxRms=0,ctxStan=ctx&&ctx.state;const t0=Date.now();
 REC={mr,stream,timer:null,cancel:false};
 bar.classList.add('listening');input.placeholder='Słucham…';if(VOICE)vstate('listen');
 const lvl=v=>{bar.style.setProperty('--lvl',v);const m=$('#vmic');if(m)m.style.setProperty('--lvl',v)};
 mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 mr.onstop=async()=>{
  clearInterval(REC.timer);stream.getTracks().forEach(t=>t.stop());try{src&&src.disconnect()}catch(e){}session('playback');
  const cancel=REC.cancel;REC=null;bar.classList.remove('listening');lvl(0);input.placeholder='Co chcesz załatwić?';
  if(cancel)return;
  const dur=Date.now()-t0,dead=an&&maxRms<1e-5,diag={mime:mr.mimeType||mime,ms:dur,bajty:chunks.reduce((a,c)=>a+c.size,0),maxRms:+maxRms.toFixed(4),spoke,ctx:ctxStan+'/'+(ctx&&ctx.state)};
  // na części telefonów przeglądarka wstrzymuje pomiar głośności (same zera), choć mikrofon nagrywa: wtedy i tak wysyłamy nagranie
  if(!spoke&&an&&!dead){glosDiag(Object.assign({wynik:'cisza'},diag));if(VOICE){vstate('idle');$('#vheard').textContent='Nic nie usłyszałam. Dotknij mikrofonu i powiedz, w czym pomóc.'}else await say('Nic nie usłyszałam. Dotknij mikrofonu i powiedz, w czym pomóc.');return}
  if(VOICE)vstate('stt');else{input.placeholder='Rozpoznaję…';bar.classList.add('busy')}
  const blob=new Blob(chunks,{type:(mr.mimeType||mime||'audio/webm').split(';')[0]});
  let text='';
  try{const r=await fetch('/api/stt?lang='+(window.LANG||'pl'),{method:'POST',headers:{'Content-Type':blob.type,'X-Glos':JSON.stringify(Object.assign({dead},diag)).slice(0,600)},body:blob});const j=await r.json();text=(j.text||'').trim()}catch(e){}
  bar.classList.remove('busy');input.placeholder='Co chcesz załatwić?';
  if(!text){if(VOICE){vstate('idle');$('#vheard').textContent='Nie udało się rozpoznać. Spróbuj jeszcze raz.'}else await say('Nie udało mi się rozpoznać nagrania. Spróbuj jeszcze raz albo napisz.');return}
  if(VOICE)$('#vheard').textContent='„'+text+'”';
  NEXT_VOICE=true;send(text);
 };
 mr.start(250);
 REC.timer=setInterval(()=>{
  if(!an)return;if(ctx.state!=='running')try{ctx.resume()}catch(e){}
  an.getFloatTimeDomainData(data);let s=0;for(let i=0;i<data.length;i++)s+=data[i]*data[i];const rms=Math.sqrt(s/data.length);if(rms>maxRms)maxRms=rms;
  floor=Math.min(rms,floor*1.02);
  const thr=Math.max(0.012,floor*2.5);lvl(Math.min(1,rms/0.12).toFixed(2));
  if(rms>thr){if(++voiced>=2)spoke=true;lastVoice=Date.now()}else voiced=0;
  const el_=Date.now()-t0;
  if((spoke&&Date.now()-lastVoice>1000)||(!spoke&&el_>(VOICE?9000:7000))||el_>30000)stopRec();
 },80);
}
function stopRec(cancel){if(REC&&REC.mr.state!=='inactive'){REC.cancel=!!cancel;REC.mr.stop()}}
function vmicTap(){
 audioCtx();
 if(REC){stopRec();return}
 if(SPEAKING){stopSpeaking();startRec();return}
 const s=$('#voice').dataset.vs;if(s==='think'||s==='stt')return;
 startRec();
}

async function initAgent(){
 if(/tryb=skrypt/.test(location.search))return;
 try{const r=await fetch('/api/health',{cache:'no-store'});const j=await r.json();AGENT=!!j.agent;window.AGENT_INFO=j}catch(e){AGENT=false}
 if(!AGENT)return;
 app.dataset.agent='1';
 route=t=>agentSend(t);
 startTopic=function(t){if(VIS.title)newConv();enterChat();act(()=>{addUser(t);route(t)})};
 $('#mic').onclick=()=>enterVoice();
 $('#vmic').onclick=vmicTap;
 $('#vkbd').onclick=()=>{exitVoice();setTimeout(()=>input.focus(),50)};
 const _exit=exitChat;exitChat=function(){if(VOICE)exitVoice();_exit()};
 const _sw=switchTo;switchTo=function(c){if(VOICE)exitVoice();_sw(c)};
 $('#cam').onclick=()=>{enterChat();act(()=>{addUser('📷 zdjęcie dowodu rejestracyjnego');agentSend('',{hidden:'[zdjęcie] Zdjęcie dowodu rejestracyjnego pojazdu. Odczyt: numer rejestracyjny WE 4K221, VIN WVWZZZAUZKW118204, data pierwszej rejestracji 14.03.2019, Volkswagen Golf. Właściciel: Marek Zieliński.'})})};
 document.addEventListener('pointerdown',()=>audioCtx(),{once:true});
}
initAgent();
