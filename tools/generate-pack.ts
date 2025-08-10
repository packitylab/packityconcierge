import 'dotenv/config';
import fetch from 'node-fetch';

const voiceMap: Record<string,string> = {
  kai: process.env.ELEVENLABS_VOICE_KAI!,
  lunari: process.env.ELEVENLABS_VOICE_LUNARI!
};

function arg(k: string, def?: string){
  const v = process.argv.find(x => x.startsWith(`--${k}=`));
  return v ? v.split('=')[1] : def;
}

(async () => {
  const sku = arg('sku','TESTSKU');
  const voiceKey = (arg('voice','lunari') as 'kai'|'lunari');
  const voiceId = voiceMap[voiceKey];

  // 1) Get product info (replace with Admin query by SKU)
  const product = { title: `Demo ${sku}`, highlights: ['Breathable','Summer fit','Neutral tones'], price: '29.99' };

  // 2) Ask GPT for hooks + script + captions
  const prompt = `Create 5 short hooks and a 25s product script for ${product.title} (price ${product.price}). Tone: futuristic, clean, playful. Provide JSON with keys hooks[], script, captions (IG, TikTok, YT).`;
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5.1", messages: [{ role:'user', content: prompt }] })
  });
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  const pack = JSON.parse(text);

  // 3) Render VO with ElevenLabs (optional if API key provided)
  const stability  = parseFloat(process.env.ELEVENLABS_STABILITY  || '0.60');
  const similarity = parseFloat(process.env.ELEVENLABS_SIMILARITY || '1.00');
  const style      = parseFloat(process.env.ELEVENLABS_STYLE      || '0.15');
  const speed      = parseFloat(process.env.ELEVENLABS_SPEED      || '1.11');
  const boost      = (process.env.ELEVENLABS_SPEAKER_BOOST || 'true') === 'true';

  if (process.env.ELEVENLABS_API_KEY) {
    const vo = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: pack.script, model_id: 'eleven_multilingual_v2',
        voice_settings: { stability, similarity_boost: similarity, style, use_speaker_boost: boost, speed } })
    });
    const buf = Buffer.from(await vo.arrayBuffer());
    const fs = await import('fs');
    fs.writeFileSync(`./dist/${sku}-${voiceKey}.mp3`, buf);
  }

  const fs = await import('fs');
  fs.writeFileSync(`./dist/${sku}-pack.json`, JSON.stringify(pack, null, 2));
  console.log('Pack generated in /dist');
})();
