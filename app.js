const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const KEY='lanaTaxiDataV1';
const LANGS=[['🇭🇷','Hrvatski','Pozdrav! Dobro došli. Želite li spojiti telefon putem Bluetootha?','hr-HR'],['🇬🇧','English','Hello, welcome. Do you want to connect your phone by Bluetooth?','en-US'],['🇩🇪','Deutsch','Willkommen. Möchten Sie Ihr Telefon per Bluetooth verbinden?','de-DE'],['🇷🇺','Русский','Добро пожаловать. Хотите подключить телефон по Bluetooth?','ru-RU'],['🇮🇹','Italiano','Benvenuti. Volete collegare il telefono tramite Bluetooth?','it-IT'],['🇫🇷','Français','Bienvenue. Voulez-vous connecter le téléphone par Bluetooth ?','fr-FR'],['🇪🇸','Español','Bienvenidos. ¿Quieren conectar el teléfono por Bluetooth?','es-ES'],['🇨🇿','Čeština','Vítejte. Chcete připojit telefon přes Bluetooth?','cs-CZ'],['🇳🇱','Nederlands','Welkom. Wilt u uw telefoon via Bluetooth verbinden?','nl-NL'],['🇵🇱','Polski','Witamy. Chcecie połączyć telefon przez Bluetooth?','pl-PL'],['🇭🇺','Magyar','Üdvözlöm. Szeretné csatlakoztatni a telefonját Bluetooth-on?','hu-HU'],['🇸🇮','Slovenščina','Dobrodošli. Želite povezati telefon prek Bluetootha?','sl-SI'],['🇯🇵','日本語','ようこそ。Bluetoothで電話を接続しますか？','ja-JP']];
const data=JSON.parse(localStorage.getItem(KEY)||'{"active":false,"paused":false,"started":null,"pausedAt":null,"pauseTotal":0,"km":0,"rides":0,"income":0,"fuel":0,"uber":0,"bolt":0,"taxi":0,"tips":0,"history":[]}');
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function render(){const live=data.active; const paused=data.paused; $('#pauseBtn').hidden=!live; $('#pauseBtn').textContent=paused?'NASTAVI SMJENU':'PAUZA'; $('#pauseBtn').classList.toggle('paused',paused);$('#statusDot').classList.toggle('live',live);$('#statusTitle').textContent=live?'SMJENA JE AKTIVNA':'Lana je spremna';$('#statusSub').textContent=live?('Započeta '+new Date(data.started).toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'})):'Nema aktivne smjene';$('#shiftBtn').textContent=live?'ZAVRŠI SMJENU':'ZAPOČNI SMJENU';$('#shiftBtn').classList.toggle('active',live);$('#km').textContent=Number(data.km).toFixed(1);$('#income').textContent=Number(data.income).toFixed(2)+' €';$('#rides').textContent=data.rides;let ms=live?Date.now()-data.started-(data.pauseTotal||0)-(paused&&data.pausedAt?Date.now()-data.pausedAt:0):0;$('#hours').textContent=Math.floor(ms/3600000)+':'+String(Math.floor(ms/60000)%60).padStart(2,'0')}
function clock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'});$('#todayLabel').textContent=d.toLocaleDateString('hr-HR',{weekday:'short',day:'2-digit',month:'2-digit'})}
setInterval(()=>{clock();render()},1000);clock();render();

function open(title,body){$('#sheetContent').innerHTML='<h2>'+title+'</h2>'+body;$('#modal').classList.add('show')}
function close(){$('#modal').classList.remove('show')}$('#close').onclick=close;$('#modal').onclick=e=>{if(e.target.id==='modal')close()};

$('#shiftBtn').onclick=()=>{if(!data.active){data.active=true;data.paused=false;data.started=Date.now();data.pausedAt=null;data.pauseTotal=0;save()}else{const end=Date.now();if(data.paused&&data.pausedAt)data.pauseTotal+=(end-data.pausedAt);data.history.push({date:new Date().toISOString(),km:data.km,income:data.income,rides:data.rides,durationMs:end-data.started-data.pauseTotal});data.active=false;data.paused=false;data.started=null;data.pausedAt=null;data.pauseTotal=0;save();open('Smjena završena ✓','<p>Podaci su spremljeni na uređaju.</p><div class="result">'+Number(data.income).toFixed(2)+' € · '+Number(data.km).toFixed(1)+' km · '+data.rides+' vožnje</div>')}};
$('#pauseBtn').onclick=()=>{if(!data.active)return;if(!data.paused){data.paused=true;data.pausedAt=Date.now()}else{data.pauseTotal+=(Date.now()-data.pausedAt);data.paused=false;data.pausedAt=null}save()};

$$('[data-open]').forEach(b=>b.onclick=()=>{const k=b.dataset.open;
if(k==='fare')open('Kalkulator cijene','<div class="field"><label>Udaljenost (km)</label><input id="fareKm" type="number" step="0.1" value="5"></div><div class="field"><label>Cijena po km (€)</label><input id="fareRate" type="number" step="0.01" value="1.00"></div><div class="field"><label>Početna cijena (€)</label><input id="fareStart" type="number" step="0.01" value="3.00"></div><button class="action" id="calc">IZRAČUNAJ</button><div class="result" id="fareResult">8.00 €</div>');
if(k==='location')open('Lokacija','<p>Lana može zatražiti GPS dozvolu samo kada je ti pokreneš.</p><button class="action" id="locate">PRONAĐI MOJU LOKACIJU</button><div class="result" id="locResult">Lokacija nije zatražena.</div>');
if(k==='languages')open('Jezici za putnika','<p>Brzi izbor jezika. Dodirni jezik i Lana će izgovoriti frazu.</p><div class="chips">'+LANGS.map((x,i)=>'<button class="chip" data-lang-index="'+i+'">'+x[0]+' '+x[1]+'</button>').join('')+'</div><div class="result" id="phrase">Odaberi jezik.</div>');
if(k==='stats')open('Statistika','<div class="numbers"><div><b>'+data.rides+'</b><span>vožnje</span></div><div><b>'+Number(data.km).toFixed(1)+'</b><span>km</span></div><div><b>'+Number(data.income).toFixed(2)+' €</b><span>prihod</span></div><div><b>'+data.history.length+'</b><span>završene</span></div></div><p class="muted">Podaci se čuvaju lokalno na ovom uređaju.</p>');
if(k==='ride')open('Nova vožnja 🚕','<p>Odaberi jednu od svojih 6 tarifa i upiši završnu cijenu vožnje.</p><div class="field"><label>Tarifa</label><select id="rideTariff"><option>T1 · Osijek dnevna</option><option>T2 · Osijek noć / nedjelja</option><option>T3 · Osijek praznik</option><option>T4 · Osijek posebni datumi</option><option>T5 · Zadar dnevna</option><option>T6 · Zadar noćna</option></select></div><div class="row"><div class="field"><label>Km</label><input id="rideKm" type="number" step="0.1" value="0"></div><div class="field"><label>Naplaćeno (€)</label><input id="ridePrice" type="number" step="0.01" value="0"></div></div><button class="action" id="saveRide">SPREMI VOŽNJU</button>');
if(k==='fuel')open('Gorivo & kilometri','<div class="field"><label>Dodaj kilometre</label><input id="addKm" type="number" step="0.1" value="0"></div><div class="field"><label>Gorivo (€)</label><input id="addFuel" type="number" step="0.01" value="0"></div><button class="action" id="saveFuel">SPREMI</button>');
if(k==='income')open('Prihod','<div class="row"><div class="field"><label>Uber (€)</label><input id="uber" type="number" step="0.01" value="0"></div><div class="field"><label>Bolt (€)</label><input id="bolt" type="number" step="0.01" value="0"></div></div><div class="row"><div class="field"><label>Taxi (€)</label><input id="taxi" type="number" step="0.01" value="0"></div><div class="field"><label>Napojnica (€)</label><input id="tips" type="number" step="0.01" value="0"></div></div><button class="action" id="saveIncome">SPREMI PRIHOD</button>');
if(k==='passenger')open('Putnik 🌍','<p>Odaberi jezik, zatim jednu od brzih rečenica.</p><div class="chips">'+LANGS.map((x,i)=>'<button class="chip" data-passenger-index="'+i+'">'+x[0]+' '+x[1]+'</button>').join('')+'</div><div class="quickPhrases"><button class="action" data-phrase="greet">👋 POZDRAV</button><button class="action" data-phrase="thanks">🙏 HVALA</button><button class="action" data-phrase="nice">😊 UGODAN DAN</button></div><div class="result" id="speakResult">Odaberi jezik.</div>');
if(k==='more')open('Lana alati','<button class="action" id="reset">NOVI DAN / OBRIŠI DANAŠNJE PODATKE</button><p class="muted">Glasovne naredbe, pozivi, glazba i navigacija koriste funkcije uređaja kada im ti daš dozvolu.</p>')});

let passengerLang=0;
const PHRASES={
  greet:['Pozdrav! Dobro došli.','Hello! Welcome.','Willkommen!','Добро пожаловать!','Benvenuti!','Bienvenue !','¡Bienvenidos!','Vítejte!','Welkom!','Witamy!','Üdvözlöm!','Dobrodošli!','ようこそ！'],
  thanks:['Hvala vam!','Thank you!','Vielen Dank!','Спасибо!','Grazie!','Merci !','¡Gracias!','Děkuji!','Dank u!','Dziękuję!','Köszönöm!','Hvala vam!','ありがとうございます！'],
  nice:['Ugodan dan i doviđenja!','Have a nice day and goodbye!','Einen schönen Tag und auf Wiedersehen!','Хорошего дня и до свидания!','Buona giornata e arrivederci!','Bonne journée et au revoir !','¡Que tengan un buen día y hasta luego!','Hezký den a na shledanou!','Fijne dag en tot ziens!','Miłego dnia i do widzenia!','Szép napot és viszontlátásra!','Lep dan i nasvidenje!','良い一日を。さようなら！']
};
document.addEventListener('click',e=>{
if(e.target.id==='calc'){const km=+$('#fareKm').value||0,r=+$('#fareRate').value||0,s=+$('#fareStart').value||0;$('#fareResult').textContent=(s+km*r).toFixed(2)+' €'}
if(e.target.id==='locate'){if(!navigator.geolocation){$('#locResult').textContent='GPS nije dostupan.';return}$('#locResult').textContent='Tražim lokaciju…';navigator.geolocation.getCurrentPosition(p=>$('#locResult').innerHTML='📍 '+p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5),()=>$('#locResult').textContent='Lokaciju nije moguće dohvatiti. Provjeri dozvolu.')}
if(e.target.dataset.langIndex!==undefined){const i=Number(e.target.dataset.langIndex);const x=LANGS[i];if(x){passengerLang=i;$('#phrase').textContent=x[2];speak(x[2],x[3])}}
if(e.target.dataset.passengerIndex!==undefined){const i=Number(e.target.dataset.passengerIndex);const x=LANGS[i];if(x){passengerLang=i;$('#speakResult').textContent=x[2];speak(x[2],x[3])}}
if(e.target.dataset.phrase){const i=passengerLang;const x=LANGS[i]||LANGS[0];const phrase=PHRASES[e.target.dataset.phrase]?.[i]||PHRASES[e.target.dataset.phrase]?.[0];if(phrase){$('#speakResult').textContent=phrase;speak(phrase,x[3])}}
if(e.target.id==='saveRide'){const km=+$('#rideKm').value||0,p=+$('#ridePrice').value||0;data.km+=km;data.income+=p;data.rides+=1;save();close()}
if(e.target.id==='saveFuel'){data.km+=+$('#addKm').value||0;data.fuel+=+$('#addFuel').value||0;save();close()}
if(e.target.id==='saveIncome'){const u=+$('#uber').value||0,b=+$('#bolt').value||0,t=+$('#taxi').value||0,tip=+$('#tips').value||0;data.uber+=u;data.bolt+=b;data.taxi+=t;data.tips+=tip;data.income+=u+b+t+tip;data.rides+=(u>0?1:0)+(b>0?1:0)+(t>0?1:0);save();close()}
if(e.target.id==='reset'&&confirm('Obrisati današnje podatke?')){Object.assign(data,{active:false,paused:false,started:null,pausedAt:null,pauseTotal:0,km:0,rides:0,income:0,fuel:0,uber:0,bolt:0,taxi:0,tips:0});save();close()}
});

// Original Lana passenger-message area: exactly three messages, passenger-facing only.
const PASSENGER_SETS=[
 ['👋 Dobro došli!','Želite li spojiti svoj telefon putem Bluetootha?','Ako vam nešto treba, samo recite Lani.'],
 ['🎵 Želite li slušati svoju glazbu?','Možete se spojiti Bluetoothom na radio.','Ugodna vožnja i bezbrižno putovanje.'],
 ['📍 Stigli smo.','Hvala vam što ste se vozili s VAŠ CHARLIE.','Želimo vam ugodan ostatak dana!'],
 ['💙 Drago nam je što ste s nama.','Ako želite preporuku u Osijeku, pitajte Lanu.','Uživajte u vožnji.'],
 ['🙏 Hvala na ukazanom povjerenju.','Ako vam treba račun ili pomoć, samo recite.','Doviđenja i sretan put!']
];
let passengerSetIndex=0;
function renderPassengerMessages(){
 const box=$('#passengerMessages'); if(!box)return;
 box.innerHTML='';
 (PASSENGER_SETS[passengerSetIndex]||PASSENGER_SETS[0]).forEach((text,i)=>{
   const el=document.createElement('div');
   el.className='passengerMsg';
   el.textContent=text;
   box.appendChild(el);
 });
}
function rotatePassengerMessages(){
 const box=$('#passengerMessages'); if(!box)return;
 [...box.children].forEach(el=>el.classList.add('leaving'));
 setTimeout(()=>{
   passengerSetIndex=(passengerSetIndex+1)%PASSENGER_SETS.length;
   renderPassengerMessages();
 },650);
}
renderPassengerMessages();
setInterval(rotatePassengerMessages,8500);

function speak(text,lang){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=lang||'hr-HR';speechSynthesis.cancel();speechSynthesis.speak(u)}
$('#voiceBtn').onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){open('Glasovne naredbe','<p>Ovaj preglednik ne daje Lani pristup prepoznavanju glasa. Tekstualne naredbe i dalje rade.</p>');return}const r=new SR();r.lang='hr-HR';r.onresult=e=>{const t=e.results[0][0].transcript.toLowerCase();if(t.includes('započni')||t.includes('započni smjenu'))$('#shiftBtn').click();else if(t.includes('cijena'))open('Kalkulator cijene','<p>Reci ili upiši udaljenost i cijenu po kilometru.</p>');else open('Lana je čula','<p>„'+e.results[0][0].transcript+'“</p>')};r.start()};
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw-v9.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});