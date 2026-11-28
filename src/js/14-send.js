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
const PASTE_MAX=8000; // characters: longer than this, a paste may be cut or turned into an attachment by the chat app
function renderSend(){const d=brandDelta(),svgs=d.files.filter(f=>/\.svg$/.test(f.name));
  sendText=setupText(d);
  const own=[S.ui,S.mono].filter(n=>custom[n]),long=sendText.length>PASTE_MAX,app=escH(APP.name);
  $('sendSum').textContent=long?'Download the file and ask your agent “apply this”.':'Copy and paste the styling settings in your app’s agent chat.';
  // notes only when something needs your attention
  $('sendNotes').innerHTML=[
    d.tooBig?`Changed logos are too big to include (${kb(d.tooBig)}): Brand tab → Download brand files, and give that .zip too.`:'',
    d.removed.length?`Removed in Stylist: ${d.removed.map(n=>escH(n.replace('brand/',''))).join(', ')}. Your agent will ask before deleting them.`:'',
    own.length?`Your own font file (${escH(own.join(', '))}) isn’t included: add it to the app yourself.`:''].filter(Boolean).map(t=>`<li>${t}</li>`).join('');
  // Copy when it fits a paste, with Download beside it; Download alone (as the main action) when it doesn't
  $('sendCopy').hidden=long;$('sendDl').classList.toggle('pri',long)}
function openSend(){renderSend();$('sendmod').hidden=false}
const closeSend=()=>{$('sendmod').hidden=true};
$('copy').onclick=openSend;$('sendClose').onclick=closeSend;$('sendmod').onclick=e=>{if(e.target===$('sendmod'))closeSend()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sendmod').hidden)closeSend()});
$('sendCopy').onclick=async()=>{markSent();if(await copyStr(sendText)){toast(`Copied. Paste it in ${APP.name}’s AI chat.`);closeSend()}else{const el=$('setup');el.textContent=sendText;el.hidden=false;closeSend();
  const r=document.createRange();r.selectNodeContents(el);const g=getSelection();g.removeAllRanges();g.addRange(r);toast('Copy the selected setup')}};
const sendDownload=async()=>{const name=(APP.name||'app').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-stylist-setup.md',blob=new Blob([sendText],{type:'text/markdown'});
  if(DLS){try{await DLS.save({filename:name,data:blob});markSent();toast(`Saved. Attach it in ${APP.name}’s AI chat and say “apply this”.`);closeSend()}catch(e){if(!(e&&e.code==='declined'))toast('Download isn’t available here. Use Copy instead')}return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);markSent();toast(`Saved. Attach it in ${APP.name}’s AI chat and say “apply this”.`);closeSend()};
$('sendDl').onclick=sendDownload;

$('ver').textContent='v'+VERSION;
