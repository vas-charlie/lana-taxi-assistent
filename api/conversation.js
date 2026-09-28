const MODEL='openai/gpt-5.5';

export default async function handler(req,res){
  if(req.method==='OPTIONS'){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    return res.status(204).end();
  }
  if(req.method!=='POST')return res.status(405).json({error:'method-not-allowed'});
  const token=process.env.AI_GATEWAY_API_KEY||req.headers['x-vercel-oidc-token'];
  if(!token)return res.status(503).json({error:'ai-auth-unavailable'});
  const incoming=Array.isArray(req.body?.messages)?req.body.messages:[];
  const messages=incoming
    .filter(m=>m&&((m.role==='user')||(m.role==='assistant'))&&typeof m.content==='string')
    .slice(-12);
  if(!messages.length)return res.status(400).json({error:'messages-required'});

  const system=[
    'Ti si Lana, glasovna asistentica za VAŠ CHARLIE i razgovaraš s Čarlijem.',
    'Odgovaraj na hrvatskom, osim ako korisnik jasno govori drugim jezikom.',
    'Ovo je razgovor u automobilu: odgovori trebaju biti kratki, prirodni i laki za slušanje, uglavnom 1 do 3 rečenice.',
    'Budi topla, duhovita i prirodna, ali nemoj glumiti da si čovjek.',
    'Ne izmišljaj da si izvršila radnju na uređaju. Navigacija, glazba, smjena i druge funkcije aplikacije obrađuju se izvan ovog razgovornog modela.',
    'Ako korisnik govori o poslu, pomozi mu praktično i jasno. Ako samo želi razgovor, razgovaraj normalno.',
    'Ne ponavljaj korisnikovu rečenicu bez potrebe i ne završavaj svaku poruku pitanjem.'
  ].join(' ');

  try{
    const upstream=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({
        model:MODEL,
        messages:[{role:'system',content:system},...messages],
        max_tokens:220
      })
    });
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok){
      console.error('AI Gateway error',upstream.status,data);
      return res.status(502).json({error:'ai-gateway-error'});
    }
    const reply=data?.choices?.[0]?.message?.content?.trim();
    if(!reply)return res.status(502).json({error:'empty-ai-response'});
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({reply});
  }catch(err){
    console.error('Conversation request failed',err);
    return res.status(500).json({error:'conversation-request-failed'});
  }
}
