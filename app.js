const BRAND_MESSAGES=['VAŠ CHARLIE','HVALA NA UKAZANOM POVJERENJU','DA NIJE VAS, NE BI BILO NI MENE!!'];
const GREETINGS={
 standard:'👋 Dobro došli! Drago nam je što ste s nama.',
 warm:'🙂 Želimo vam ugodnu i lijepu vožnju.',
 returning:'🔁 Drago nam je ponovno vas voziti.',
 exit:'👋 Hvala na ukazanom povjerenju. Doviđenja i sretan put!',
 luggage:'🧳 Trebate li pomoć s prtljagom? Slobodno recite.'
};
let brandIndex=0, recognition=null, listening=false, shiftActive=false;
const $=id=>document.getElementById(id);
function showBrand(){
 const box=$('brandMessages');if(!box)return;
 const old=box.querySelector('.brandMsg');if(old)old.classList.add('leaving');
 setTimeout(()=>{box.replaceChildren();const el=document.createElement('div');el.className='brandMsg';el.textContent=BRAND_MESSAGES[brandIndex];box.appendChild(el);brandIndex=(brandIndex+1)%BRAND_MESSAGES.length},600);
}
function showSpeech(text,say=false){
 const box=$('lanaSpeech');if(!box)return;box.textContent=text;box.classList.add('show');clearTimeout(showSpeech.timer);showSpeech.timer=setTimeout(()=>box.classList.remove('show'),say?9000:6000);if(say)speak(text);
}
function preferredVoice(lang='hr-HR'){const vs=speechSynthesis.getVoices?.()||[];const exact=vs.find(v=>v.lang?.toLowerCase()===lang.toLowerCase()&&v.localService);return exact||vs.find(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()))||vs.find(v=>v.lang?.toLowerCase().startsWith('hr'))||null}
function speak(text,lang='hr-HR'){if(!('speechSynthesis'in window)){showSpeech('Na ovom uređaju glasovno čitanje nije dostupno.');return false}const u=new SpeechSynthesisUtterance(String(text).replace(/Charlie/gi,'Čarli'));u.lang=lang;u.voice=preferredVoice(lang);u.rate=1;u.pitch=1;speechSynthesis.cancel();speechSynthesis.resume();u.onstart=()=>{$('liveStatus').textContent='● Lana govori'};u.onend=()=>{$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna'};u.onerror=()=>{$('liveStatus').textContent='● glas nije dostupan'};speechSynthesis.speak(u);return true}
function greet(key){const t=GREETINGS[key];if(!t)return;showSpeech(t,true)}
document.querySelectorAll('[data-greet]').forEach(b=>b.addEventListener('click',()=>greet(b.dataset.greet)));
document.querySelectorAll('[data-say]').forEach(b=>b.addEventListener('click',()=>showSpeech(b.dataset.say,true)));
$('shellVoiceCore').onclick=()=>{showSpeech('Bok Čarli. Lana je spremna. Reci što treba.',true);startRecognition()};
$('shellMic').onclick=()=>{if(listening)stopRecognition();else startRecognition()};
function startRecognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){showSpeech('Glasovno slušanje nije podržano na ovom pregledniku.');return}if(listening)return;recognition=new SR();recognition.lang='hr-HR';recognition.interimResults=false;recognition.continuous=false;recognition.onstart=()=>{listening=true;$('shellMic').classList.add('active');$('shellMicSmall').textContent='slušam…';$('liveStatus').textContent='● Lana sluša'};recognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';showSpeech('Čula sam: '+text);handleCommand(text)};recognition.onerror=()=>{showSpeech('Nisam uspjela čuti naredbu.');stopRecognition()};recognition.onend=()=>stopRecognition();recognition.start()}
function stopRecognition(){listening=false;if(recognition){try{recognition.stop()}catch{}}recognition=null;const b=$('shellMic');if(b)b.classList.remove('active');if($('shellMicSmall'))$('shellMicSmall').textContent='isključen';$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna'}
function handleCommand(raw){const t=raw.toLowerCase();if(t.includes('započni')||t.includes('pokreni smjenu'))toggleShift(true);else if(t.includes('pauz')){showSpeech('U redu, pauza.');}else if(t.includes('pozdravi'))greet('standard');else if(t.includes('doviđenja'))greet('exit');else if(t.includes('prtljag'))greet('luggage');else speak('Razumjela sam naredbu: '+raw)}
function toggleShift(forceStart=false){shiftActive=forceStart?!shiftActive:!shiftActive;$('shellShift').classList.toggle('active',shiftActive);$('shellShiftSmall').textContent=shiftActive?'aktivna':'nema smjene';$('liveStatus').textContent=shiftActive?'● smjena aktivna':'● spremna';showSpeech(shiftActive?'Smjena je započela, Čarli.':'Smjena je završena, Čarli.',true)}
$('shellShift').onclick=()=>toggleShift();
$('shellTaxi').onclick=()=>{$('taxiPanel').hidden=false};
$('shellPassenger').onclick=()=>{$('passengerPanel').hidden=false};
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).hidden=true));
$('taxiCalc').onclick=()=>{const km=Number($('taxiKm').value||0),big=$('taxiPassengers').value==='5–6';if(!km){$('taxiResult').textContent='Unesi kilometražu.';return}const rate=big?1.8:1.5;const start=big?5:4;const price=start+km*rate;$('taxiResult').textContent='Privremeni izračun: '+price.toFixed(2)+' €. Tarife 1–6 ćemo spojiti kad unesemo službeni cjenik.';showSpeech('Privremeni izračun je '+price.toFixed(2)+' eura.',true)};
showBrand();setInterval(showBrand,8500);
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=()=>{};
