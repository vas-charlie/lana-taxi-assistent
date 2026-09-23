const BRAND_MESSAGES=['VAŠ CHARLIE','HVALA NA POVJERENJU','DA NIJE VAS, NE BI BILO NI MENE!!'];
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
document.querySelectorAll('[data-greet]').forEach(b=>b.addEventListener('click',()=>greet(b.dataset.greet)));
document.querySelectorAll('[data-say]').forEach(b=>b.addEventListener('click',()=>showSpeech(b.dataset.say.replace(/^[^A-Za-zÀ-ž]+\s*/,'').trim(),true)));
$('shellVoiceCore').onclick=()=>{showSpeech('Bok Čarli. Lana je spremna. Reci što treba.',true);startRecognition()};
$('shellMic').onclick=()=>{if(listening)stopRecognition();else startRecognition()};
function startRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){showSpeech('Glasovno slušanje nije podržano na ovom pregledniku.');return}if(listening)return;recognition=new SR();recognition.lang='hr-HR';recognition.interimResults=false;recognition.continuous=false;recognition.onstart=()=>{listening=true;$('shellMic').classList.add('active');$('shellMicSmall').textContent='slušam…';$('liveStatus').textContent='● Lana sluša'};recognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';showSpeech('Čula sam: '+text);handleCommand(text)};recognition.onerror=()=>{showSpeech('Nisam uspjela čuti naredbu.');stopRecognition()};recognition.onend=()=>stopRecognition();recognition.start()}
function stopRecognition(){listening=false;if(recognition){try{recognition.stop()}catch{}}recognition=null;const b=$('shellMic');if(b)b.classList.remove('active');if($('shellMicSmall'))$('shellMicSmall').textContent='isključen';$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna'}
function openMaps(destination){
 const q=encodeURIComponent(destination.trim());
 window.open('https://www.google.com/maps/dir/?api=1&destination='+q+'&travelmode=driving','_blank');
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
   const m=raw.match(/(?:do|prema|za)\\s+(.+)$/i);
   if(m){openMaps(m[1]);return showSpeech('Otvaram navigaciju prema '+m[1]+'.',true);}
   return showSpeech('Reci mi odredište, na primjer: navigacija do Hotela Kolovare.',true);
 }
 if(t.includes('glazb')||t.includes('muzik')){
   if(t.includes('pauz')||t.includes('zaustav')){showSpeech('U redu, pauziraj glazbu na uređaju.');return}
   return showSpeech('Glazbom mogu pomoći, ali upravljanje aplikacijom za reprodukciju ovisi o uređaju. Reci mi što želiš pustiti.',true);
 }
 if(t.includes('koliko košta')||t.includes('koliko košta')||t.includes('cijena vožnje')){
   const m=raw.match(/(?:do|za|prema)\\s+(.+?)(?:\\?|$)/i);
   const dest=m?.[1]?.trim();
   if(dest){showSpeech('Razumjela sam. Za '+dest+' trebam cestovnu udaljenost i tvoju aktivnu tarifu da izračunam točnu cijenu.',true);return}
   return showSpeech('Reci mi odredište, na primjer: koliko košta odavde do Hotela Kolovare.',true);
 }
 return speak('Razumjela sam. Reci mi što želiš napraviti, na primjer navigacija, glazba, razgovor ili izračun vožnje.');
}
function toggleShift(forceStart=false){shiftActive=forceStart?!shiftActive:!shiftActive;$('shellShift').classList.toggle('active',shiftActive);$('shellShiftSmall').textContent=shiftActive?'aktivna':'nema smjene';$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna';showSpeech(shiftActive?'Smjena je započela, Čarli.':'Smjena je završena, Čarli.',true)}
$('shellShift').onclick=()=>toggleShift();
$('shellTaxi').onclick=()=>{$('taxiPanel').hidden=false};
$('shellPassenger').onclick=()=>{$('passengerPanel').hidden=false};
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).hidden=true));
$('taxiCalc').onclick=()=>{const km=Number($('taxiKm').value||0),big=$('taxiPassengers').value==='5–6';if(!km){$('taxiResult').textContent='Unesi kilometražu.';return}const rate=big?1.8:1.5;const start=big?5:4;const price=start+km*rate;$('taxiResult').textContent='Privremeni izračun: '+price.toFixed(2)+' €. Tarife 1–6 ćemo spojiti kad unesemo službeni cjenik.';showSpeech('Privremeni izračun je '+price.toFixed(2)+' eura.',true)};
showBrand();setInterval(showBrand,18200);
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=()=>{};
