const BRAND_MESSAGES=['VAŠ CHARLIE','HVALA NA UKAZANOM POVJERENJU','DA NIJE VAS, NE BI BILO NI MENE!!'];
const PASSENGER_MESSAGES={
 quickGreeting:['👋 Dobro došli!','Drago nam je što ste s nama.'],
 quickTrip:['😊 Želimo vam ugodno putovanje.','Uživajte u vožnji!'],
 quickLuggage:['🧳 Trebate li pomoć s prtljagom?','Slobodno recite Lani.'],
 quickThanks:['👍 Hvala na ukazanom povjerenju.','Hvala što ste se vozili s VAŠ CHARLIE.'],
 quickBye:['👋 Doviđenja i sretan put!','Želimo vam siguran put.']
};
let brandIndex=0;
function showBrand(){
 const box=document.getElementById('brandMessages'); if(!box)return;
 const old=box.querySelector('.brandMsg'); if(old)old.classList.add('leaving');
 setTimeout(()=>{box.replaceChildren();const el=document.createElement('div');el.className='brandMsg';el.textContent=BRAND_MESSAGES[brandIndex];box.appendChild(el);brandIndex=(brandIndex+1)%BRAND_MESSAGES.length},650);
}
function showPassenger(key){
 const box=document.getElementById('brandMessages');if(!box)return;
 const old=box.querySelector('.brandMsg');if(old)old.classList.add('leaving');
 const messages=PASSENGER_MESSAGES[key]||[];
 setTimeout(()=>{box.replaceChildren();messages.forEach((t,i)=>{const el=document.createElement('div');el.className='brandMsg';el.textContent=t;box.appendChild(el);if(i<messages.length-1)setTimeout(()=>{el.classList.add('leaving')},2200)});setTimeout(()=>{showBrand()},5000)},650);
}
showBrand();setInterval(showBrand,8500);
['quickGreeting','quickTrip','quickLuggage','quickThanks','quickBye'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('click',()=>showPassenger(id))});

function speak(text,lang='hr-HR'){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=lang;speechSynthesis.cancel();speechSynthesis.speak(u)}
const KEY='lanaTaxiDataV1';const data=JSON.parse(localStorage.getItem(KEY)||'{"active":false,"paused":false,"started":null}');
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
const shift=document.getElementById('shiftBtn'),pause=document.getElementById('pauseBtn'),voice=document.getElementById('voiceBtn');
if(shift)shift.onclick=()=>{if(!data.active){data.active=true;data.paused=false;data.started=Date.now()}else{data.active=false;data.paused=false;data.started=null}save()};
if(pause)pause.onclick=()=>{if(data.active){data.paused=!data.paused;save()}};
if(voice)voice.onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){speak('Lana je spremna.');return}const r=new SR();r.lang='hr-HR';r.onresult=e=>speak('Čula sam: '+e.results[0][0].transcript);r.start()};