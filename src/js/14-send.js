// ---- Send to your agent: the setup (settings + the logos you changed), to copy or to download as a file ----
// A logo travels only when it changed in Stylist since the app's files were loaded (brSlotChanged), so an app's own
// logos are never overwritten by accident. Each file carries a fingerprint (to catch damage on the way) and the
// fingerprint of the app's file it replaces (export.py stops if the app's file changed since it was loaded).
const BRAND_MAX=30*1024; // above this, logos go through Download brand files instead
// FNV-1a over the UTF-8 bytes of the text, line endings and outer whitespace normalised; export.py computes the same
function fnv(s){let h=0x811c9dc5;for(const b of new TextEncoder().encode(String(s).replace(/\r\n/g,'\n').trim())){h^=b;h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')}
function brandDelta(){const none={files:[],removed:[],tooBig:0};if(!brChanged())return none;
  const cur=APP.brand,now=Object.fromEntries(brandFiles().map(f=>[f.name,f.text]));
  // the same files with every changed slot put back as the app had it: what differs is what you changed
  const B=JSON.parse(JSON.stringify(cur||{}));
  for(const k of BR_KEYS)for(const v of ['light','dark'])if(brSlotChanged(k,v)){const b=brBaseOf(k,v);B[k]=B[k]||{};if(b)B[k][v]=JSON.parse(JSON.stringify(b));else delete B[k][v]}
  let was;APP.brand=B;try{was=Object.fromEntries(brandFiles().map(f=>[f.name,f.text]))}finally{APP.brand=cur}
  const files=Object.keys(now).filter(n=>now[n]!==was[n]).map(n=>({name:n,text:now[n],hash:fnv(now[n]),base:n in was?fnv(was[n]):null}));
  const removed=Object.keys(was).filter(n=>!(n in now)&&/\.svg$/.test(n));
  const size=files.filter(f=>/\.svg$/.test(f.name)).reduce((s,f)=>s+new Blob([f.text]).size,0);
  return size>BRAND_MAX?{files:[],removed,tooBig:size,want:files.filter(f=>/\.svg$/.test(f.name)).length}:{files,removed,tooBig:0}}
const kb=n=>`${Math.max(1,Math.round(n/1024))} KB`;
let sendText='';
function renderSend(){const d=brandDelta(),svgs=d.files.filter(f=>/\.svg$/.test(f.name)),lib={css:'No library',shadcn:'shadcn',radix:'Radix'}[APP.target];
  sendText=setupText(d);
  const own=[S.ui,S.mono].filter(n=>custom[n]);
  const rows=[`<li class="ok"><b>Your style settings</b><small>${escH(APP.name)} · ${lib}</small></li>`,
    svgs.length?`<li class="ok"><b>${svgs.length} logo${svgs.length>1?'s':''} you changed</b><small>${svgs.map(f=>escH(f.name.replace('brand/',''))).join(', ')} · ${kb(svgs.reduce((s,f)=>s+f.text.length,0))}</small></li>`
      :d.tooBig?`<li class="warn"><b>Logos you changed are too big to send this way (${kb(d.tooBig)})</b><small>Brand tab → Download brand files, and give that .zip to your agent too</small></li>`
      :`<li class="off"><b>No logo changes</b><small>The app keeps its own logos</small></li>`,
    d.removed.length?`<li class="warn"><b>Removed in Stylist: ${d.removed.map(n=>escH(n.replace('brand/',''))).join(', ')}</b><small>Your agent will ask you before deleting them in the app</small></li>`:'',
    own.length?`<li class="warn"><b>Your own font file isn’t included</b><small>${escH(own.join(', '))}: add it to the app yourself</small></li>`:''].join('');
  $('sendList').innerHTML=rows;
  const file=svgs.length>0||sendText.length>12000;
  $('sendCopy').classList.toggle('pri',!file);$('sendDl').classList.toggle('pri',file);
  $('sendHint').textContent=file?`Download it, attach it in ${APP.name}’s AI chat and say “apply this”.`:`Copy it and paste it in ${APP.name}’s AI chat. Nothing else to type.`}
function openSend(){renderSend();$('sendmod').hidden=false}
const closeSend=()=>{$('sendmod').hidden=true};
$('copy').onclick=openSend;$('sendClose').onclick=closeSend;$('sendmod').onclick=e=>{if(e.target===$('sendmod'))closeSend()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sendmod').hidden)closeSend()});
$('sendCopy').onclick=async()=>{if(await copyStr(sendText)){toast(`Copied. Paste it in ${APP.name}’s AI chat.`);closeSend()}else{const el=$('setup');el.textContent=sendText;el.hidden=false;closeSend();
  const r=document.createRange();r.selectNodeContents(el);const g=getSelection();g.removeAllRanges();g.addRange(r);toast('Copy the selected setup')}};
$('sendDl').onclick=async()=>{const name=(APP.name||'app').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-stylist-setup.md',blob=new Blob([sendText],{type:'text/markdown'});
  if(DLS){try{await DLS.save({filename:name,data:blob});toast('Setup saved');closeSend()}catch(e){if(!(e&&e.code==='declined'))toast('Download isn’t available here. Use Copy instead')}return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);toast('Setup saved');closeSend()};

$('ver').textContent='v'+VERSION;
