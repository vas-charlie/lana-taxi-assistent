const PASSENGER_SETS=[
 ['👋 Dobro došli!','Želite li spojiti svoj telefon putem Bluetootha?','Ako vam nešto treba, samo recite Lani.'],
 ['🎵 Želite li slušati svoju glazbu?','Možete se spojiti Bluetoothom na radio.','Ugodna vožnja i bezbrižno putovanje.'],
 ['📍 Stigli smo.','Hvala vam što ste se vozili s VAŠ CHARLIE.','Želimo vam ugodan ostatak dana!'],
 ['💙 Drago nam je što ste s nama.','Ako želite preporuku u Osijeku, pitajte Lanu.','Uživajte u vožnji.'],
 ['🙏 Hvala na ukazanom povjerenju.','Ako vam treba račun ili pomoć, samo recite.','Doviđenja i sretan put!']
];
let passengerSetIndex=0;

function renderPassengerMessages(){
 const box=document.getElementById('passengerMessages');
 if(!box)return;
 box.replaceChildren();
 for(const text of PASSENGER_SETS[passengerSetIndex]){
   const el=document.createElement('div');
   el.className='passengerMsg';
   el.textContent=text;
   box.appendChild(el);
 }
}
function rotatePassengerMessages(){
 const box=document.getElementById('passengerMessages');
 if(!box)return;
 [...box.children].forEach(el=>el.classList.add('leaving'));
 setTimeout(()=>{
   passengerSetIndex=(passengerSetIndex+1)%PASSENGER_SETS.length;
   renderPassengerMessages();
 },650);
}
function speak(text,lang='hr-HR'){
 if(!('speechSynthesis' in window))return;
 const u=new SpeechSynthesisUtterance(text);
 u.lang=lang;
 speechSynthesis.cancel();
 speechSynthesis.speak(u);
}
renderPassengerMessages();
setInterval(rotatePassengerMessages,8500);

const KEY='lanaTaxiDataV1';
const data=JSON.parse(localStorage.getItem(KEY)||'{"active":false,"paused":false,"started":null}');
function save(){localStorage.setItem(KEY,JSON.stringify(data));}
const shift=document.getElementById('shiftBtn');
const pause=document.getElementById('pauseBtn');
if(shift)shift.onclick=()=>{
 if(!data.active){data.active=true;data.paused=false;data.started=Date.now();save();}
 else{data.active=false;data.paused=false;data.started=null;save();}
};
if(pause)pause.onclick=()=>{
 if(!data.active)return;
 data.paused=!data.paused;
 save();
};
const voice=document.getElementById('voiceBtn');
if(voice)voice.onclick=()=>{
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){speak('Lana je spremna.');return;}
 const r=new SR();
 r.lang='hr-HR';
 r.onresult=e=>speak('Čula sam: '+e.results[0][0].transcript,'hr-HR');
 r.start();
};