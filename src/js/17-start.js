// ---- Start screen: shown while no app is loaded. Open from GitHub, open the app's files, or start a new app ----
// A ?app=owner/repo link loads the app straight away (13-github.js), so the screen only flashes while it reads.
let stPick=0; // the preset a new app starts from
function renderStart(){const on=appLoaded();document.body.classList.toggle('noapp',!on);$('start').hidden=on;
  if(on){$('stHome').hidden=false;$('stNewForm').hidden=true}}
$('stPre').innerHTML=PRESETS.map((p,i)=>`<button type="button" role="radio" aria-checked="${i===0}" data-i="${i}">${swatch(p)}<span>${escH(p.name)}</span></button>`).join('');
$('stPre').onclick=e=>{const b=e.target.closest('button[data-i]');if(!b)return;stPick=+b.dataset.i;$('stPre').querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',String(x===b)))};
$('stDest').onclick=e=>{const b=e.target.closest('button[data-t]');if(!b)return;$('stDest').querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',String(x===b)))};
for(const g of ['stPre','stDest'])$(g).onkeydown=e=>{if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();
  const bs=[...$(g).querySelectorAll('button')],i=bs.indexOf(document.activeElement),n=bs[(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+bs.length)%bs.length];n.focus();n.click()};
$('stRepo').value=ghLast?ghLast.repo+(ghLast.path?'/'+ghLast.path:''):'';
$('stGh').onsubmit=async e=>{e.preventDefault();const g=ghParse($('stRepo').value),m=$('stGhMsg');
  if(!g){m.textContent='Type the repo, like g-ab/cast, or paste its GitHub link.';return}
  $('stGhGo').disabled=true;m.textContent=`Reading ${ghLabel(g)}…`;
  try{if(await ghOpen(g))m.textContent='';else m.textContent=`No Stylist files found in ${ghLabel(g)}. Check the folder, and that the repo is public.`}
  catch(err){m.textContent='GitHub can’t be reached from here. This works on the Stylist website (g-ab.github.io/stylist), with an internet connection.'}
  $('stGhGo').disabled=false};
$('stFiles').onclick=()=>$('appFiles').click();
$('stNew').onclick=()=>{$('stHome').hidden=true;$('stNewForm').hidden=false;$('stName').value='';$('stName').focus()};
const stHomeBack=()=>{$('stNewForm').hidden=true;$('stHome').hidden=false;$('stNew').focus()};
$('stBack').onclick=stHomeBack;$('stCancel').onclick=stHomeBack;
// as the preset picker does, a preset sets the colours
function startNew(name,target,pi){const p=PRESETS[pi]||PRESETS[0];S={...PRESETS[0],id:p.id,fam:p.fam,sat:p.sat,warm:p.warm,sup:p.sup,supFam:null};
  APP=appDefault();APP.name=name;APP.target=TGT[target]?target:'css';APP.source='New app, not exported yet';
  APP.origin={new:true,style:[],sent:[],loaded:today(),base:{settings:{...S},pins:{light:{},dark:{}}}};saveApp();apply();showView('comp');toast(`${name}: ready to style`)}
$('stNewForm').onsubmit=e=>{e.preventDefault();const n=$('stName').value.trim();if(!n){$('stName').focus();return}
  startNew(n,($('stDest').querySelector('[aria-checked="true"]')||{}).dataset?.t||'css',stPick)};
// drop the app's files anywhere on the start screen
$('start').addEventListener('dragover',e=>{e.preventDefault();$('start').classList.add('drag')});
$('start').addEventListener('dragleave',e=>{if(!$('start').contains(e.relatedTarget))$('start').classList.remove('drag')});
$('start').addEventListener('drop',e=>{e.preventDefault();$('start').classList.remove('drag');if(e.dataTransfer.files.length)openFiles(e.dataTransfer.files)});
renderStart();
