const BRAND_MESSAGES=['VAŠ CHARLIE','HVALA NA POVJERENJU','DA NIJE VAS, NE BI BILO NI MENE!!'];

const DEFAULT_TARIFFS=[
 {name:'Tarifa 1 • Osijek',start:3.50,perKm:1.40},
 {name:'Tarifa 2 • Osijek noć/nedjelja • 5–6',start:4.50,perKm:1.70},
 {name:'Tarifa 3 • Osijek blagdan',start:4.00,perKm:1.55},
 {name:'Tarifa 4 • Osijek veliki blagdan',start:4.50,perKm:1.90},
 {name:'Tarifa 5 • Zadar',start:4.50,perKm:1.70},
 {name:'Tarifa 6 • Zadar noć',start:5.50,perKm:2.00}
];
function loadTariffs(){try{const saved=JSON.parse(localStorage.getItem('lanaTariffs')||'null');if(Array.isArray(saved)&&saved.length===6)return saved}catch{}return DEFAULT_TARIFFS.map(x=>({...x}))}
let tariffs=loadTariffs();
function saveTariffs(){localStorage.setItem('lanaTariffs',JSON.stringify(tariffs))}
function selectedPassengers(){return $('taxiPassengers')?.value||'1–4'}
function syncPassengerTariff(){const p=selectedPassengers();const sel=$('taxiTariff');if(!sel)return;if(p==='5–6'){const idx=tariffs.findIndex(x=>x.name.includes('Tarifa 2'));if(idx>=0)sel.value=String(idx)}renderTariffs()}

function activeTariff(){const i=Number($('taxiTariff')?.value||0);return tariffs[i]||tariffs[0]}
function renderTariffs(){const sel=$('taxiTariff');if(!sel)return;sel.innerHTML=tariffs.map((x,i)=>'<option value="'+i+'">'+x.name+'</option>').join('');const i=Number(sel.value||0),t=tariffs[i]||tariffs[0];$('taxiStart').value=t.start;$('taxiRate').value=t.perKm}
const LANGUAGES={hr:{name:'Hrvatski',speech:'hr-HR',code:'hr'},en:{name:'English',speech:'en-US',code:'en'},de:{name:'Deutsch',speech:'de-DE',code:'de'},it:{name:'Italiano',speech:'it-IT',code:'it'},fr:{name:'Français',speech:'fr-FR',code:'fr'},es:{name:'Español',speech:'es-ES',code:'es'},ru:{name:'Русский',speech:'ru-RU',code:'ru'},cs:{name:'Čeština',speech:'cs-CZ',code:'cs'},nl:{name:'Nederlands',speech:'nl-NL',code:'nl'},pl:{name:'Polski',speech:'pl-PL',code:'pl'},hu:{name:'Magyar',speech:'hu-HU',code:'hu'},sl:{name:'Slovenščina',speech:'sl-SI',code:'sl'}};let passengerLang=localStorage.getItem('lanaPassengerLang')||'en';let liveTranslate=false,translateDirection='toPassenger';function currentLanguage(){return LANGUAGES[passengerLang]||LANGUAGES.en}function setPassengerLanguage(code){if(!LANGUAGES[code])return;passengerLang=code;localStorage.setItem('lanaPassengerLang',code);document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===code));const b=$('selectedLang');if(b)b.textContent='🌐 '+currentLanguage().name;showSpeech('Odabran je jezik: '+currentLanguage().name+'.')}async function translateText(text,from,to){const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+from+'|'+to);if(!r.ok)throw new Error('translation');const d=await r.json();return d?.responseData?.translatedText||text}async function greetInPassengerLanguage(key){const source=GREETINGS[key]||GREETINGS.standard;if(passengerLang==='hr')return greet(key);try{const t=await translateText(source,'hr',currentLanguage().code);showSpeech(t,true);speak(t,currentLanguage().speech)}catch{showSpeech('Prijevod pozdrava trenutno nije dostupan.',true)}}
async function greetInPassengerLanguageText(source){if(passengerLang==='hr')return showSpeech(source,true);try{const t=await translateText(source,'hr',currentLanguage().code);showSpeech(t,true);speak(t,currentLanguage().speech)}catch{showSpeech('Prijevod pozdrava trenutno nije dostupan.',true)}}function startTranslationRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){showSpeech('Live prijevod nije podržan na ovom pregledniku.',true);return}if(listening)stopRecognition();recognition=new SR();recognition.lang=translateDirection==='toPassenger'?'hr-HR':currentLanguage().speech;recognition.interimResults=false;recognition.continuous=true;recognition.onstart=()=>{listening=true;$('shellMic').classList.add('active');$('shellMicSmall').textContent='prevodim…';$('liveStatus').textContent='● live prijevod'};recognition.onresult=async e=>{const t=e.results?.[0]?.[0]?.transcript?.trim();if(!t)return;try{const from=translateDirection==='toPassenger'?'hr':currentLanguage().code;const to=translateDirection==='toPassenger'?currentLanguage().code:'hr';const out=await translateText(t,from,to);showSpeech(out,true);speak(out,translateDirection==='toPassenger'?currentLanguage().speech:'hr-HR')}catch{showSpeech('Prijevod trenutno nije dostupan.',true)}};recognition.onend=()=>{listening=false;if(liveTranslate)setTimeout(startTranslationRecognition,350)};recognition.onerror=()=>{listening=false;if(liveTranslate)setTimeout(startTranslationRecognition,700)};recognition.start()}function toggleLiveTranslate(){liveTranslate=!liveTranslate;const b=$('liveTranslateBtn');if(b)b.textContent=liveTranslate?'⏹️ Zaustavi live prijevod':'🔄 Live prijevod';if(liveTranslate)startTranslationRecognition();else stopRecognition()}function toggleTranslationDirection(){translateDirection=translateDirection==='toPassenger'?'toDriver':'toPassenger';const b=$('translateDirection');if(b)b.textContent=translateDirection==='toPassenger'?'Čarli → putnik':'Putnik → Čarli';if(liveTranslate)startTranslationRecognition()}function greetInPassengerLanguageOld(key){return greet(key)}
const GREETINGS={
 standard:'Dobro došli! Drago nam je što ste s nama. Želimo vam ugodnu i lijepu vožnju.',
 warm:'Želimo vam ugodnu i lijepu vožnju.',
 returning:'Drago nam je ponovno vas voziti.',
 exit:'Hvala na ukazanom povjerenju. Doviđenja i sretan put!',
 luggage:'Trebate li pomoć s prtljagom? Slobodno recite.'
};
let brandIndex=0, recognition=null, listening=false, shiftActive=false, lanaSpeaking=false, pendingNavigation=false, recognitionRun=0;
const $=id=>document.getElementById(id);
function showBrand(){
 const box=$('brandMessages');if(!box)return;
 const old=box.querySelector('.brandMsg');
 if(old){old.classList.add('leaving');setTimeout(()=>old.remove(),4200)}
 const el=document.createElement('div');
 el.className='brandMsg brandMsg-'+brandIndex;
 const text=BRAND_MESSAGES[brandIndex];
 [...text].forEach((ch,i)=>{
   const span=document.createElement('span');
   span.className='brandLetter';
   span.style.setProperty('--i',i);
   span.textContent=ch===' '? '\u00A0' : ch;
   el.appendChild(span);
 });
 box.appendChild(el);
 brandIndex=(brandIndex+1)%BRAND_MESSAGES.length;
}
function showSpeech(text,say=false){
 const box=$('lanaSpeech');if(!box)return;box.textContent=text;box.classList.add('show');clearTimeout(showSpeech.timer);showSpeech.timer=setTimeout(()=>box.classList.remove('show'),say?9000:6000);if(say)speak(text);
}
const SPOKEN_CHARLIE={hr:'Čarli',en:'Charlie',de:'Tschärli',it:'Ciarli',fr:'Tcharli',es:'Chárli',ru:'Чарли',cs:'Čárlí',nl:'Tsjarlie',pl:'Czarli',hu:'Csárli',sl:'Čarli'};
function spokenCharlie(lang='hr-HR'){const code=String(lang).toLowerCase().split('-')[0];return SPOKEN_CHARLIE[code]||SPOKEN_CHARLIE.hr}
function prepareSpeechText(text,lang='hr-HR'){
  let s=String(text);
  const name=spokenCharlie(lang);
  s=s.replace(/Charliejeva/g,name+'eva').replace(/Charliejevu/g,name+'evu').replace(/Charliejev/g,name+'jev').replace(/Charlieju/g,name+'ju').replace(/Charliejem/g,name+'jem').replace(/Charlijeva/g,name+'eva').replace(/Charlijevu/g,name+'evu').replace(/Charlijev/g,name+'jev').replace(/Charliju/g,name+'ju').replace(/Charlijem/g,name+'jem').replace(/Charlie/gi,name);
  return s;
}
function preferredVoice(lang='hr-HR'){const vs=speechSynthesis.getVoices?.()||[];const exact=vs.find(v=>v.lang?.toLowerCase()===lang.toLowerCase()&&v.localService);return exact||vs.find(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()))||vs.find(v=>v.lang?.toLowerCase().startsWith('hr'))||null}
function speak(text,lang='hr-HR'){
  lanaSpeaking=true;
  if(!('speechSynthesis'in window)){lanaSpeaking=false;showSpeech('Na ovom uređaju glasovno čitanje nije dostupno.');return false}
  // Dok Lana govori, privremeno zaustavljamo samo jednu SpeechRecognition sesiju.
  // Gumb/mikrofon ostaje uključen, a slušanje se automatski nastavlja nakon govora.
  const resumeListening=listening;
  if(resumeListening){
    listening=false;
    try{recognition?.abort()}catch{}
    recognition=null;
  }
  const u=new SpeechSynthesisUtterance(prepareSpeechText(text,lang));
  u.lang=lang;u.voice=preferredVoice(lang);u.rate=1;u.pitch=1;
  speechSynthesis.cancel();speechSynthesis.resume();
  u.onstart=()=>{$('liveStatus').textContent='● Lana govori'};
  const resume=()=>{
    lanaSpeaking=false;
    $('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna';
    if(resumeListening){
      setTimeout(()=>{if(!lanaSpeaking){listening=true;startRecognition()}},350);
    }
  };
  u.onend=resume;u.onerror=resume;
  speechSynthesis.speak(u);return true
}
function greet(key){const t=GREETINGS[key];if(!t)return;showSpeech(t,true)}
document.querySelectorAll('[data-greet]').forEach(b=>b.addEventListener('click',()=>greetInPassengerLanguage(b.dataset.greet)));document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setPassengerLanguage(b.dataset.lang)));$('selectedLang').onclick=()=>{$('languagePanel').hidden=false;document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===passengerLang))};$('liveTranslateBtn').onclick=toggleLiveTranslate;$('translateDirection').onclick=toggleTranslationDirection;
document.querySelectorAll('[data-say]').forEach(b=>b.addEventListener('click',()=>showSpeech(b.dataset.say.replace(/^[^A-Za-zÀ-ž]+\s*/,'').trim(),true)));
$('shellVoiceCore').onclick=()=>{startRecognition();setTimeout(()=>showSpeech('Bok Čarli. Lana je spremna. Reci što treba.',true),250)};
$('shellMic').onclick=()=>{if(listening)stopRecognition();else startRecognition()};
window.__lanaNativeSpeech=function(text){
  const heard=String(text||'').trim();
  if(!heard)return;
  // Native Android prepoznavanje je zajednički ulaz za SVE glasovne naredbe.
  // Ne smijemo odbaciti naredbu samo zato što je Lana upravo završila govor.
  if(lanaSpeaking){
    setTimeout(()=>window.__lanaNativeSpeech(heard),250);
    return;
  }
  showSpeech('Čula sam: '+heard);
  handleCommand(heard);
};
function startRecognition(){
  if(lanaSpeaking)return;
  if(typeof window.AndroidLana!=='undefined' && typeof window.AndroidLana.startListening==='function'){
    listening=true;
    $('shellMic').classList.add('active');
    $('shellMicSmall').textContent='slušam…';
    $('liveStatus').textContent='● Lana sluša';
    window.AndroidLana.startListening();
    return;
  }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){showSpeech('Glasovno slušanje nije podržano na ovom pregledniku.');return}
  if(lanaSpeaking)return;
  if(listening&&recognition)return;
  listening=true;
  const run=++recognitionRun;
  const rec=new SR();
  recognition=rec;
  rec.lang='hr-HR';
  rec.interimResults=false;
  // Android Chrome je pouzdaniji kada se pojedinačna sesija završi nakon rezultata,
  // pa je odmah pokrenemo ponovno. Korisniku mikrofon ostaje uključen.
  rec.continuous=false;
  rec.maxAlternatives=3;
  rec.onstart=()=>{
    if(run!==recognitionRun)return;
    listening=true;
    $('shellMic').classList.add('active');
    $('shellMicSmall').textContent='slušam…';
    $('liveStatus').textContent='● Lana sluša';
  };
  rec.onaudiostart=()=>{
    if(run===recognitionRun)$('liveStatus').textContent='● Lana sluša · zvuk';
  };
  rec.onspeechstart=()=>{
    if(run===recognitionRun)$('liveStatus').textContent='● Lana sluša · čujem';
  };
  rec.onresult=e=>{
    if(run!==recognitionRun||lanaSpeaking)return;
    const result=e.results?.[e.resultIndex]?.[0];
    const text=result?.transcript?.trim()||'';
    if(text){
      showSpeech('Čula sam: '+text);
      handleCommand(text);
    }
  };
  rec.onerror=e=>{
    if(run!==recognitionRun)return;
    if(e?.error==='not-allowed'||e?.error==='service-not-allowed'){
      listening=false;
      $('shellMic').classList.remove('active');
      $('shellMicSmall').textContent='dozvola mikrofona';
      $('liveStatus').textContent='● uključi dozvolu mikrofona';
      return;
    }
    if(e?.error==='aborted')return;
    // no-speech, audio-capture i mrežne greške ne gase korisnikov mikrofon.
    if(listening&&!lanaSpeaking){
      recognition=null;
      setTimeout(()=>{if(listening&&!lanaSpeaking)startRecognition()},350);
    }
  };
  rec.onend=()=>{
    if(run!==recognitionRun)return;
    if(recognition===rec)recognition=null;
    if(listening&&!lanaSpeaking){
      setTimeout(()=>{if(listening&&!lanaSpeaking)startRecognition()},220);
    }
  };
  try{
    rec.start();
  }catch(e){
    if(run!==recognitionRun)return;
    recognition=null;
    if(listening&&!lanaSpeaking){
      setTimeout(()=>{if(listening&&!lanaSpeaking)startRecognition()},500);
    }
  }
}
function restartRecognition(){
  if(!listening)return;
  recognitionRun++;
  try{recognition?.abort()}catch{}
  recognition=null;
  setTimeout(()=>{if(listening&&!lanaSpeaking)startRecognition()},120);
}
function stopRecognition(){
  listening=false;
  recognitionRun++;
  if(typeof window.AndroidLana!=='undefined' && typeof window.AndroidLana.stopListening==='function'){
    try{window.AndroidLana.stopListening()}catch{}
  }
  if(recognition){try{recognition.abort()}catch{}}
  recognition=null;
  const b=$('shellMic');if(b)b.classList.remove('active');
  if($('shellMicSmall'))$('shellMicSmall').textContent='isključen';
  $('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna';
}
function normalizeNavigationDestination(raw){
 const s=String(raw||'').replace(/[?!.]+$/,'').trim();
 if(!s)return '';
 const ones={nula:0,jedan:1,jedna:1,jedno:1,dva:2,dvije:2,tri:3,četiri:4,cetiri:4,pet:5,šest:6,sest:6,sedam:7,osam:8,devet:9};
 const teens={jedanaest:11,dvanaest:12,trinaest:13,četrnaest:14,cetrnaest:14,petnaest:15,šesnaest:16,sestnaest:16,sedamnaest:17,osamnaest:18,devetnaest:19};
 const tens={dvadeset:20,trideset:30,četrdeset:40,cetrdeset:40,pedeset:50,šezdeset:60,sezdeset:60,sedamdeset:70,osamdeset:80,devedeset:90};
 const words=s.replace(/-/g,' ').split(/\s+/), out=[]; let i=0;
 while(i<words.length){
   const w=words[i].toLowerCase();
   if(teens[w]!==undefined){out.push(String(teens[w]));i++;continue}
   if(tens[w]!==undefined){
     let n=tens[w];
     if(i+1<words.length&&ones[words[i+1].toLowerCase()]!==undefined){n+=ones[words[i+1].toLowerCase()];i++}
     out.push(String(n));i++;continue
   }
   if(w==='sto'||w==='stotinu'){out.push('100');i++;continue}
   if(ones[w]!==undefined){
     out.push(String(ones[w]));i++;continue
   }
   out.push(words[i]);i++;
 }
 return out.join(' ').replace(/\s+/g,' ').trim();
}
function openMaps(destination){
 const clean=String(destination||'').trim();if(!clean)return;

 // 1) Ako je Lana pokrenuta unutar Android omotača, koristi pravi
 // Android ACTION_VIEW intent. Google službeno navodi google.navigation:q=
 // kao način za izravno pokretanje turn-by-turn navigacije.
 if(typeof window.AndroidLana!=='undefined' && typeof window.AndroidLana.navigate==='function'){
   try{window.AndroidLana.navigate(clean);return}catch{}
 }

 // 2) PWA/Chrome fallback: ne koristimo više Maps web URL niti
 // dir_action=navigate. Koristimo Android intent URL koji eksplicitno
 // cilja Google Maps paket. Time preskačemo web pregled rute.
 const encoded=encodeURIComponent(clean);
 const intentUrl='intent://navigation/now?q='+encoded+'&mode=d#Intent;scheme=google.navigation;package=com.google.android.apps.maps;end';

 try{
   window.location.href=intentUrl;
 }catch{
   // Posljednji fallback za uređaje/preglednike koji blokiraju intent://.
   window.location.href='google.navigation:q='+encoded+'&mode=d';
 }
}
function getCurrentPosition(){
 return new Promise((resolve,reject)=>{
   if(!navigator.geolocation)return reject(new Error('geolocation-unavailable'));
   navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
 });
}
async function routeToDestination(destination){
 const clean=destination.replace(/[?!.]+$/,'').trim();
 if(!clean)throw new Error('destination-empty');
 const pos=await getCurrentPosition();
 const {latitude,longitude}=pos.coords;
 const geoUrl='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=hr&q='+encodeURIComponent(clean);
 const geoRes=await fetch(geoUrl,{headers:{Accept:'application/json'}});
 if(!geoRes.ok)throw new Error('geocode-failed');
 const places=await geoRes.json();
 if(!places.length)throw new Error('destination-not-found');
 const destLat=Number(places[0].lat),destLon=Number(places[0].lon);
 const routeUrl='https://router.project-osrm.org/route/v1/driving/'+longitude+','+latitude+';'+destLon+','+destLat+'?overview=false';
 const routeRes=await fetch(routeUrl);
 if(!routeRes.ok)throw new Error('route-failed');
 const route=await routeRes.json();
 if(route.code!=='Ok'||!route.routes?.length)throw new Error('route-not-found');
 return {destination:clean,km:route.routes[0].distance/1000,minutes:route.routes[0].duration/60};
}
async function quoteRide(destination){
 showSpeech('Provjeravam cestovnu udaljenost do '+destination+'.',true);
 try{
   const r=await routeToDestination(destination);
   const km=r.km.toFixed(1),tariff=activeTariff(),price=tariff.start+r.km*tariff.perKm;
   showSpeech('Do '+r.destination+' ima približno '+km+' kilometara cestom. Po '+tariff.name+' cijena je oko '+price.toFixed(2)+' eura.',true);
   return {...r,price,tariff};
 }catch(err){
   const message=err?.code===1
     ? 'Za izračun cijene trebam tvoju lokaciju. Dopusti Lani pristup lokaciji pa pokušaj ponovno.'
     : 'Nisam uspjela dohvatiti cestovnu udaljenost. Pokušaj ponovno ili otvori navigaciju.';
   greetInPassengerLanguageText(message);
   return null;
 }
}
function handleCommand(raw){
 const original=String(raw||'').trim();
 if(!original)return;
 // "Lana" je pozivno ime, a ne dio naredbe. Uklanjamo ga da svaka
 // naredba prolazi kroz isti dispatcher, bez obzira na način izgovora.
 const t=original
   .replace(/^[,.;:!?\s]*(?:hej\s+)?lana\b[\s,.;:!?-]*/i,'')
   .replace(/^[,.;:!?\s]+|[,.;:!?\s]+$/g,'')
   .toLowerCase()
   .trim();
 if(!t)return showSpeech('Tu sam, Čarli. Reci što treba.',true);
 raw=original;
 if(pendingNavigation){
   if(t.includes('odustani')||t.includes('prekini')||t.includes('ne treba')){
     pendingNavigation=false;
     return showSpeech('U redu, ne otvaram navigaciju.',true);
   }
   pendingNavigation=false;
   const dest=normalizeNavigationDestination(raw);
   if(dest){openMaps(dest);return showSpeech('Pokrećem navigaciju prema '+dest+'.',true);}
 }
 if(t.includes('započni')||t.includes('pokreni smjenu'))return toggleShift(true);
 if(t.includes('pauz'))return showSpeech('U redu, pauza.',true);
 if(t.includes('pozdravi'))return greet('standard');
 if(t.includes('doviđenja'))return greet('exit');
 if(t.includes('prtljag'))return greet('luggage');
 if(t.includes('tišina')||t.includes('šuti')||t.includes('nemoj pričati')){
   speechSynthesis.cancel(); return showSpeech('U redu, šutim.');
 }
 if(t.includes('pričaj sa mnom')||t.includes('pričaj malo')||t.includes('razgovaraj sa mnom')){
   return showSpeech('Naravno, Čarli. Tu sam. Kako ide čekanje?',true);
 }
 if(t.includes('navigacij')||t.includes('otvori kartu')||t.includes('otvori google maps')){const m=raw.match(/(?:do|prema|za)\s+(.+)$/i);if(m){const dest=normalizeNavigationDestination(m[1]);if(!dest){pendingNavigation=true;return showSpeech('Reci mi odredište.',true)}openMaps(dest);return showSpeech('Pokrećem navigaciju prema '+dest+'.',true)}pendingNavigation=true;return showSpeech('Naravno. Reci mi samo odredište.',true)}
 if(t.includes('glazb')||t.includes('muzik')){
   if(t.includes('pauz')||t.includes('zaustav')){showMusicCommand('pause');return}
   const playMatch=raw.match(/(?:pusti|sviraj|pokreni)\s+(.+)$/i);
   if(playMatch?.[1]?.trim())return playMusicQuery(playMatch[1].trim());
   openMusicPanel();
   return showSpeech('Otvaram YouTube Music. Reci, na primjer: pusti Deep Purple.',true);
 }
 if(t.includes('koliko košta')||t.includes('cijena vožnje')||t.includes('koliko je do')){
   const m=raw.match(/(?:odavde\s+)?(?:do|za|prema)\s+(.+?)(?:\?|$)/i);
   const dest=m?.[1]?.trim();
   if(dest){quoteRide(dest);return}
   return showSpeech('Reci mi odredište, na primjer: koliko košta odavde do Hotela Kolovare.',true);
 }
 return speak('Razumjela sam. Reci mi što želiš napraviti, na primjer navigacija, glazba, razgovor ili izračun vožnje.');
}
function toggleShift(forceStart=false){shiftActive=forceStart?true:!shiftActive;$('shellShift').classList.toggle('active',shiftActive);$('shellShiftSmall').textContent=shiftActive?'aktivna':'nema smjene';$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna';showSpeech(shiftActive?'Smjena je započela, Čarli.':'Smjena je završena, Čarli.',true)}
$('shellShift').onclick=()=>toggleShift();
$('shellTaxi').onclick=()=>{$('taxiPanel').hidden=false};
$('shellPassenger').onclick=()=>{$('passengerPanel').hidden=false};
const musicGuideText='Tablet je povezan s Kodiaqom preko Bluetootha, pa zvuk YouTube Musica ide kroz zvučnike vozila.';
function openMusicPanel(){const p=$('musicPanel');if(p)p.hidden=false}
function musicGuide(){showSpeech(musicGuideText,true);if($('musicResult'))$('musicResult').textContent=musicGuideText}
function musicSearchUrl(query){return 'https://music.youtube.com/search?q='+encodeURIComponent(query)}
function playMusicQuery(query){
  const q=String(query||'').trim();
  if(!q)return;
  openMusicPanel();
  if($('musicQuery'))$('musicQuery').value=q;
  if($('musicResult'))$('musicResult').textContent='Tražim u YouTube Musicu: '+q;
  showSpeech('Pokušavam pustiti '+q+' u YouTube Musicu.',true);
  const intent='intent:#Intent;action=android.media.action.MEDIA_PLAY_FROM_SEARCH;S.android.intent.extra.focus=vnd.android.cursor.item/*;S.android.intent.extra.artist='+encodeURIComponent(q)+';S.android.intent.extra.query='+encodeURIComponent(q)+';S.query='+encodeURIComponent(q)+';package=com.google.android.apps.youtube.music;end';
  let fallback=setTimeout(()=>window.open(musicSearchUrl(q),'_blank'),1400);
  try{window.location.href=intent}catch{clearTimeout(fallback);window.open(musicSearchUrl(q),'_blank')}
}
$('musicOpen').onclick=()=>playMusicQuery($('musicQuery')?.value||'');
$('musicBluetooth').onclick=()=>musicGuide();
function showMusicCommand(command){
  openMusicPanel();
  if(command==='pause'){
    showSpeech('Pauziraj ili nastavi YouTube Music na tabletu. Ako je YouTube Music aktivan, Androidove medijske kontrole mogu preuzeti naredbu.',true);
    return;
  }
}
$('musicPause').onclick=()=>showMusicCommand('pause');
$('musicGuide').onclick=musicGuide;
$('musicSearch').onclick=()=>playMusicQuery($('musicQuery')?.value||'');
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).hidden=true));
$('taxiTariff').addEventListener('change',renderTariffs);
$('taxiStart').addEventListener('change',()=>{const i=Number($('taxiTariff').value||0);tariffs[i].start=Number($('taxiStart').value||0);saveTariffs()});
$('taxiRate').addEventListener('change',()=>{const i=Number($('taxiTariff').value||0);tariffs[i].perKm=Number($('taxiRate').value||0);saveTariffs()});
$('taxiPassengers').addEventListener('change',syncPassengerTariff);
$('taxiCalc').onclick=()=>{const km=Number($('taxiKm').value||0);if(!km){$('taxiResult').textContent='Unesi kilometražu.';return}const tariff=activeTariff(),price=tariff.start+km*tariff.perKm;$('taxiResult').textContent=tariff.name+': '+tariff.start.toFixed(2)+' € start + '+tariff.perKm.toFixed(2)+' €/km = '+price.toFixed(2)+' €.';showSpeech('Po '+tariff.name+' za '+km.toFixed(1)+' kilometara cijena je oko '+price.toFixed(2)+' eura.',true)};
renderTariffs();
syncPassengerTariff();
showBrand();setInterval(showBrand,18200);
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=()=>{};


/* DRIVER WELCOME BUTTON • VAŠ CHARLIE */
(function setupDriverWelcome(){
  if(document.getElementById('driverWelcomeBtn')) return;
  const btn=document.createElement('button');
  btn.id='driverWelcomeBtn';
  btn.type='button';
  btn.className='driver-welcome-btn';
  btn.setAttribute('aria-label','Lana dobrodošlica za putnika');
  btn.innerHTML='<span>👋</span><b>DOBRO DOŠLI</b><small>Lana</small>';
  const greetings=document.querySelector('.lana-greetings');const lang=document.getElementById('selectedLang');if(greetings&&lang)greetings.insertBefore(btn,lang.nextSibling);else document.body.appendChild(btn);
  btn.addEventListener('click',()=>{
    const message='Dobro došli u VAŠ CHARLIE. Ja sam Lana, Charliejeva asistentica i tu sam da vam pomognem da vam vožnja bude što ugodnija. Ako želite svoju glazbu, Wi-Fi, informacije ili vam bilo što zatreba tijekom vožnje, samo mi se obratite. Uživajte u vožnji!';
    greetInPassengerLanguageText(message);
  });
})();

/* FINAL TEST FIXES 24-09-2026 */
(function(){
 const langBtn=$('selectedLang'), langPanel=$('languagePanel');
 if(langBtn&&langPanel){
   langBtn.onclick=(e)=>{e.preventDefault();e.stopPropagation();langPanel.hidden=false;langPanel.style.display='block';document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===passengerLang));};
   langPanel.querySelectorAll('[data-lang]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();setPassengerLanguage(b.dataset.lang);});
   const close=langPanel.querySelector('[data-close="languagePanel"]');
   if(close)close.onclick=(e)=>{e.preventDefault();e.stopPropagation();langPanel.hidden=true;langPanel.style.display='none';};
 }
})();

/* FIX PASS 2 */
(function(){
 const langBtn=$('selectedLang'), panel=$('languagePanel');
 if(langBtn&&panel){
   const open=()=>{panel.hidden=false;panel.style.display='block';panel.scrollIntoView({block:'nearest'});};
   langBtn.onclick=(e)=>{e.preventDefault();e.stopPropagation();open();};
   panel.querySelectorAll('[data-lang]').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();setPassengerLanguage(b.dataset.lang);panel.hidden=true;panel.style.display='none';});
   const close=panel.querySelector('[data-close="languagePanel"]'); if(close)close.onclick=(e)=>{e.preventDefault();e.stopPropagation();panel.hidden=true;panel.style.display='none';};
 }
})();
