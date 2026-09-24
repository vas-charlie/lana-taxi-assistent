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
const LANGUAGES={hr:{name:'Hrvatski',speech:'hr-HR',code:'hr'},en:{name:'English',speech:'en-US',code:'en'},de:{name:'Deutsch',speech:'de-DE',code:'de'},it:{name:'Italiano',speech:'it-IT',code:'it'},fr:{name:'Français',speech:'fr-FR',code:'fr'},es:{name:'Español',speech:'es-ES',code:'es'},ru:{name:'Русский',speech:'ru-RU',code:'ru'},cs:{name:'Čeština',speech:'cs-CZ',code:'cs'},nl:{name:'Nederlands',speech:'nl-NL',code:'nl'},pl:{name:'Polski',speech:'pl-PL',code:'pl'},hu:{name:'Magyar',speech:'hu-HU',code:'hu'},sl:{name:'Slovenščina',speech:'sl-SI',code:'sl'}};let passengerLang=localStorage.getItem('lanaPassengerLang')||'en';let liveTranslate=false,translateDirection='toPassenger';function currentLanguage(){return LANGUAGES[passengerLang]||LANGUAGES.en}function setPassengerLanguage(code){if(!LANGUAGES[code])return;passengerLang=code;localStorage.setItem('lanaPassengerLang',code);document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===code));const b=$('selectedLang');if(b)b.textContent='🌐 '+currentLanguage().name;showSpeech('Odabran je jezik: '+currentLanguage().name+'.')}async function translateText(text,from,to){const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+from+'|'+to);if(!r.ok)throw new Error('translation');const d=await r.json();return d?.responseData?.translatedText||text}async function greetInPassengerLanguage(key){const source=GREETINGS[key]||GREETINGS.standard;if(passengerLang==='hr')return greet(key);try{const t=await translateText(source,'hr',currentLanguage().code);showSpeech(t,true);speak(t,currentLanguage().speech)}catch{showSpeech('Prijevod pozdrava trenutno nije dostupan.',true)}}function startTranslationRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){showSpeech('Live prijevod nije podržan na ovom pregledniku.',true);return}if(listening)stopRecognition();recognition=new SR();recognition.lang=translateDirection==='toPassenger'?'hr-HR':currentLanguage().speech;recognition.interimResults=false;recognition.continuous=false;recognition.onstart=()=>{listening=true;$('shellMic').classList.add('active');$('shellMicSmall').textContent='prevodim…';$('liveStatus').textContent='● live prijevod'};recognition.onresult=async e=>{const t=e.results?.[0]?.[0]?.transcript?.trim();if(!t)return;try{const from=translateDirection==='toPassenger'?'hr':currentLanguage().code;const to=translateDirection==='toPassenger'?currentLanguage().code:'hr';const out=await translateText(t,from,to);showSpeech(out,true);speak(out,translateDirection==='toPassenger'?currentLanguage().speech:'hr-HR')}catch{showSpeech('Prijevod trenutno nije dostupan.',true)}};recognition.onend=()=>{listening=false;if(liveTranslate)setTimeout(startTranslationRecognition,350)};recognition.onerror=()=>{listening=false;if(liveTranslate)setTimeout(startTranslationRecognition,700)};recognition.start()}function toggleLiveTranslate(){liveTranslate=!liveTranslate;const b=$('liveTranslateBtn');if(b)b.textContent=liveTranslate?'⏹️ Zaustavi live prijevod':'🔄 Live prijevod';if(liveTranslate)startTranslationRecognition();else stopRecognition()}function toggleTranslationDirection(){translateDirection=translateDirection==='toPassenger'?'toDriver':'toPassenger';const b=$('translateDirection');if(b)b.textContent=translateDirection==='toPassenger'?'Čarli → putnik':'Putnik → Čarli';if(liveTranslate)startTranslationRecognition()}function greetInPassengerLanguageOld(key){return greet(key)}
const GREETINGS={
 standard:'Dobro došli! Drago nam je što ste s nama.',
 warm:'Želimo vam ugodnu i lijepu vožnju.',
 returning:'Drago nam je ponovno vas voziti.',
 exit:'Hvala na ukazanom povjerenju. Doviđenja i sretan put!',
 luggage:'Trebate li pomoć s prtljagom? Slobodno recite.'
};
let brandIndex=0, recognition=null, listening=false, shiftActive=false;
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
function preferredVoice(lang='hr-HR'){const vs=speechSynthesis.getVoices?.()||[];const exact=vs.find(v=>v.lang?.toLowerCase()===lang.toLowerCase()&&v.localService);return exact||vs.find(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()))||vs.find(v=>v.lang?.toLowerCase().startsWith('hr'))||null}
function speak(text,lang='hr-HR'){if(!('speechSynthesis'in window)){showSpeech('Na ovom uređaju glasovno čitanje nije dostupno.');return false}const u=new SpeechSynthesisUtterance(String(text).replace(/Charlie/gi,'Čarli'));u.lang=lang;u.voice=preferredVoice(lang);u.rate=1;u.pitch=1;speechSynthesis.cancel();speechSynthesis.resume();u.onstart=()=>{$('liveStatus').textContent='● Lana govori'};u.onend=()=>{$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna'};u.onerror=()=>{$('liveStatus').textContent='● glas nije dostupan'};speechSynthesis.speak(u);return true}
function greet(key){const t=GREETINGS[key];if(!t)return;showSpeech(t,true)}
document.querySelectorAll('[data-greet]').forEach(b=>b.addEventListener('click',()=>greetInPassengerLanguage(b.dataset.greet)));document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setPassengerLanguage(b.dataset.lang)));$('selectedLang').onclick=()=>{$('languagePanel').hidden=false;document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===passengerLang))};$('liveTranslateBtn').onclick=toggleLiveTranslate;$('translateDirection').onclick=toggleTranslationDirection;
document.querySelectorAll('[data-say]').forEach(b=>b.addEventListener('click',()=>showSpeech(b.dataset.say.replace(/^[^A-Za-zÀ-ž]+\s*/,'').trim(),true)));
$('shellVoiceCore').onclick=()=>{showSpeech('Bok Čarli. Lana je spremna. Reci što treba.',true);startRecognition()};
$('shellMic').onclick=()=>{if(listening)stopRecognition();else startRecognition()};
function startRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){showSpeech('Glasovno slušanje nije podržano na ovom pregledniku.');return}if(listening)return;recognition=new SR();recognition.lang='hr-HR';recognition.interimResults=false;recognition.continuous=false;recognition.onstart=()=>{listening=true;$('shellMic').classList.add('active');$('shellMicSmall').textContent='slušam…';$('liveStatus').textContent='● Lana sluša'};recognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';showSpeech('Čula sam: '+text);handleCommand(text)};recognition.onerror=()=>{showSpeech('Nisam uspjela čuti naredbu.');stopRecognition()};recognition.onend=()=>stopRecognition();recognition.start()}
function stopRecognition(){listening=false;if(recognition){try{recognition.stop()}catch{}}recognition=null;const b=$('shellMic');if(b)b.classList.remove('active');if($('shellMicSmall'))$('shellMicSmall').textContent='isključen';$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna'}
function openMaps(destination){
 const q=encodeURIComponent(destination.trim());
 window.open('https://www.google.com/maps/dir/?api=1&destination='+q+'&travelmode=driving','_blank');
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
   showSpeech(message,true);
   return null;
 }
}
function handleCommand(raw){
 const t=raw.toLowerCase().trim();
 if(!t)return;
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
 if(t.includes('navigacij')||t.includes('otvori kartu')||t.includes('otvori google maps')){
   const m=raw.match(/(?:do|prema|za)\s+(.+)$/i);
   if(m){openMaps(m[1]);return showSpeech('Otvaram navigaciju prema '+m[1]+'.',true);}
   return showSpeech('Reci mi odredište, na primjer: navigacija do Hotela Kolovare.',true);
 }
 if(t.includes('glazb')||t.includes('muzik')){
   if(t.includes('pauz')||t.includes('zaustav')){showSpeech('Za pauzu upotrijebi kontrolu glazbenog playera na tabletu.',true);return}
   openMusicPanel();
   return showSpeech('Otvaram glazbeni modul. Tablet šalje zvuk preko Bluetootha u Kodiaq.',true);
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
const musicGuideText='Ako želite svoju glazbu, možete je pustiti na tabletu. Tablet je već povezan s Kodiaqom preko Bluetootha pa će zvuk ići preko zvučnika vozila.';
function openMusicPanel(){const p=$('musicPanel');if(p)p.hidden=false}
function musicGuide(){showSpeech(musicGuideText,true);if($('musicResult'))$('musicResult').textContent=musicGuideText}
$('musicOpen').onclick=()=>{
  const candidates=['https://music.youtube.com/','https://open.spotify.com/'];
  const target=window.confirm('Otvoriti YouTube Music?')?candidates[0]:candidates[1];
  window.open(target,'_blank');
  showSpeech('Otvaram glazbu na tabletu.',true);
};
$('musicBluetooth').onclick=()=>musicGuide();
$('musicPause').onclick=()=>{
  const media=document.querySelector('audio,video');
  if(media){media.paused?media.play():media.pause();showSpeech(media.paused?'Glazba je pauzirana.':'Glazba nastavlja.',true);return}
  if('mediaSession' in navigator){showSpeech('Zaustavi ili nastavi glazbu na tabletu. Android će, ako dopušta, proslijediti naredbu glazbenom playeru.',true);return}
  showSpeech('Za pauzu ili nastavak glazbe upotrijebi kontrole glazbenog playera na tabletu.',true);
};
$('musicGuide').onclick=musicGuide;
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
