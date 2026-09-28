const GATEWAY_MODEL='openai/gpt-5.5';
const HF_MODEL='openai/gpt-oss-120b:fastest';

const system=[
  'Ti si Lana, glasovna asistentica za VAŠ CHARLIE i razgovaraš s Čarlijem.',
  'Odgovaraj na hrvatskom, osim ako korisnik jasno govori drugim jezikom.',
  'Ovo je razgovor u automobilu: odgovori trebaju biti kratki, prirodni i laki za slušanje, uglavnom 1 do 3 rečenice.',
  'Budi topla, duhovita i prirodna, ali nemoj glumiti da si čovjek.',
  'Ne izmišljaj da si izvršila radnju na uređaju. Navigacija, glazba, smjena i druge funkcije aplikacije obrađuju se izvan ovog razgovornog modela.',
  'Ako korisnik govori o poslu, pomozi mu praktično i jasno. Ako samo želi razgovor, razgovaraj normalno.',
  'Ne ponavljaj korisnikovu rečenicu bez potrebe i ne završavaj svaku poruku pitanjem.',
  'Ovo je prvenstveno glasovni razgovor. Piši samo ono što Lana treba stvarno izgovoriti naglas.',
  'Nikada nemoj izgovarati niti opisivati emotikone, emoji-je, ikone ili njihove nazive. Ako bi u pisanom odgovoru prirodno koristila emoji, u glasovnom odgovoru ga jednostavno izostavi.',
  'Nikada nemoj koristiti niti izgovarati Markdown, zvjezdice, podvlake, navodnike kao tehničke oznake, kod, HTML, alt-tekst, opise naglasaka ili druge oznake formatiranja.',
  'Ne piši opise poput "nasmiješeno lice", "zvjezdica", "srce" ili slične opise simbola. Govori običnim prirodnim rečenicama.',
  'Nemoj pisati popise, naslove ili posebne oznake ako nisu nužni za razgovor. Kad nešto objašnjavaš, oblikuj to kao prirodan govor.',
  'Rečenice neka budu kratke i razgovorne, s prirodnom interpunkcijom koja omogućuje normalne pauze. Ne zvuči kao da čitaš tekst iz dokumenta.'
].join(' ');

async function callHuggingFace(messages){
  const token=process.env.HF_TOKEN;
  if(!token)return null;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      const upstream=await fetch('https://router.huggingface.co/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body:JSON.stringify({model:HF_MODEL,messages,max_tokens:220,stream:false}),
        signal:controller.signal
      });
      clearTimeout(timer);
      const data=await upstream.json().catch(()=>({}));
      if(upstream.ok){
        const reply=data?.choices?.[0]?.message?.content?.trim();
        if(reply)return reply;
      }else{
        console.error('Hugging Face error',upstream.status,data);
      }
    }catch(err){
      console.error('Hugging Face request failed',attempt+1,err?.name||err);
    }
    if(attempt===0)await new Promise(resolve=>setTimeout(resolve,350));
  }
  return null;
}

async function callGateway(messages,token){
  if(!token)return null;
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    const upstream=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({model:GATEWAY_MODEL,messages,max_tokens:220}),
      signal:controller.signal
    });
    clearTimeout(timer);
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok){
      console.error('AI Gateway error',upstream.status,data);
      return null;
    }
    return data?.choices?.[0]?.message?.content?.trim()||null;
  }catch(err){
    console.error('AI Gateway request failed',err?.name||err);
    return null;
  }
}

export default async function handler(req,res){
  if(req.method==='OPTIONS'){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    return res.status(204).end();
  }
  if(req.method!=='POST')return res.status(405).json({error:'method-not-allowed'});

  const incoming=Array.isArray(req.body?.messages)?req.body.messages:[];
  const messages=incoming
    .filter(m=>m&&((m.role==='user')||(m.role==='assistant'))&&typeof m.content==='string')
    .slice(-12);
  if(!messages.length)return res.status(400).json({error:'messages-required'});

  const promptMessages=[{role:'system',content:system},...messages];

  try{
    // Prefer Hugging Face. A transient provider/network failure gets a retry,
    // then the existing Gateway path gets a chance before the request fails.
    let reply=await callHuggingFace(promptMessages);

    if(!reply){
      const token=process.env.AI_GATEWAY_API_KEY||req.headers['x-vercel-oidc-token'];
      reply=await callGateway(promptMessages,token);
    }

    if(!reply){
      const configured=Boolean(process.env.HF_TOKEN||process.env.AI_GATEWAY_API_KEY||req.headers['x-vercel-oidc-token']);
      console.error('Conversation providers unavailable',configured?'configured':'not-configured');
      return res.status(configured?502:503).json({
        error:configured?'ai-provider-unavailable':'ai-provider-not-configured'
      });
    }

    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({reply});
  }catch(err){
    console.error('Conversation request failed',err);
    return res.status(500).json({error:'conversation-request-failed'});
  }
}

// Redeploy trigger: production HF_TOKEN was configured after the previous deployment.
