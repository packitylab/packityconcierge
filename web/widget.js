(() => {
  const ORIGIN = window.PACKITY_WIDGET_ORIGIN || 'http://localhost:8787';
  const persona = window.PACKITY_PERSONA || 'lunari';

  const css = `.pl-float{position:fixed;right:18px;bottom:18px;z-index:9999}.pl-btn{border:none;border-radius:9999px;padding:14px 18px;box-shadow:0 10px 30px rgba(0,0,0,.2);background:rgba(255,255,255,.8);backdrop-filter:blur(8px);cursor:pointer}.pl-panel{position:fixed;right:18px;bottom:80px;width:340px;max-height:60vh;overflow:auto;border-radius:16px;background:rgba(20,20,22,.55);backdrop-filter:blur(14px);padding:12px 12px 64px;color:#fff;font-family:Inter,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.35);display:none}.pl-panel.show{display:block}.pl-input{position:absolute;left:12px;right:12px;bottom:12px;display:flex;gap:8px}.pl-input input{flex:1;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;padding:10px}.pl-bubble{margin:8px 0;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.08)}.pl-bubble.user{background:rgba(255,255,255,.14)}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const btnWrap = document.createElement('div'); btnWrap.className = 'pl-float';
  const btn = document.createElement('button'); btn.className = 'pl-btn'; btn.textContent = '💬 Kai/Lunari';
  btnWrap.appendChild(btn);

  const panel = document.createElement('div'); panel.className = 'pl-panel'; panel.innerHTML = `<div id="pl-chat"></div><div class="pl-input"><input id="pl-in" placeholder="Ask about products…"/><button id="pl-send">Send</button></div>`;
  document.body.appendChild(btnWrap); document.body.appendChild(panel);

  const chat = panel.querySelector('#pl-chat');
  const input = panel.querySelector('#pl-in');
  const send = panel.querySelector('#pl-send');

  let conversation = [];
  const push = (text, me=false) => {
    const b = document.createElement('div'); b.className = 'pl-bubble' + (me?' user':''); b.textContent = text; chat.appendChild(b); chat.scrollTop = chat.scrollHeight; };

  btn.onclick = () => panel.classList.toggle('show');

  async function ask(text){
    push(text,true);
    const r = await fetch(`${ORIGIN}/api/realtime/message`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ persona, input:text, conversation }) });
    const j = await r.json();
    if(j.text){ push(j.text); conversation.push({ role:'assistant', content:j.text }); }
    else if(j.result){ push(`[${j.tool}] done`); }
  }

  send.onclick = () => { const t = input.value.trim(); if(!t) return; conversation.push({ role:'user', content:t }); input.value=''; ask(t); };
})();
