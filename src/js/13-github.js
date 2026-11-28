// ---- Open from GitHub: load an app's Stylist files from a public repo, no download needed ----
// Reads raw.githubusercontent.com (the repo's default branch, as it is now) and hands the files to openFiles(),
// exactly as "Open app style…" does. The last repo is remembered, so syncing again is one click.
// Also opens from a link: ?app=owner/repo (optionally ?app=owner/repo/folder).
const GH_FILES=['stylist.json','stylist-theme.css','app-tokens.css','components.json','stylist-icons.css',
  'brand/logo.svg','brand/logo-dark.svg','brand/mark.svg','brand/mark-dark.svg','brand/favicon.svg','brand/favicon-dark.svg'];
let ghLast=null;try{ghLast=JSON.parse(localStorage.getItem('stylist.gh.v1')||'null')}catch(e){}
// "owner/repo", "owner/repo/folder", "github.com/owner/repo", ".../tree/branch/folder" → {owner,repo,ref,path}
function ghParse(s,folder){s=String(s||'').trim().replace(/^https?:\/\//,'').replace(/^(www\.)?github\.com\//,'').replace(/\.git$/,'').replace(/\/+$/,'');
  const p=s.split('/').filter(Boolean);if(p.length<2||!/^[\w.-]+$/.test(p[0])||!/^[\w.-]+$/.test(p[1]))return null;
  let ref='HEAD',path=p.slice(2);if(path[0]==='tree'&&path[1]){ref=path[1];path=path.slice(2)}
  const extra=String(folder||'').trim().replace(/^\/+|\/+$/g,'');if(extra)path=extra.split('/');
  if(path.some(x=>x==='..'))return null;
  return {owner:p[0],repo:p[1],ref,path:path.join('/')}}
const ghLabel=g=>`${g.owner}/${g.repo}${g.path?'/'+g.path:''}`;
async function ghFetch(g){const base=`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${encodeURIComponent(g.ref)}/${g.path?g.path+'/':''}`;
  const got=await Promise.all(GH_FILES.map(async n=>{try{const r=await fetch(base+n,{cache:'no-store'});return r.ok?new File([await r.text()],n):null}catch(e){return {err:e}}}));
  if(got.length&&got.every(x=>x&&x.err))throw new Error('offline');
  return got.filter(x=>x&&!x.err)}
async function ghOpen(g){const files=await ghFetch(g);
  if(!files.some(f=>f.name==='stylist.json'||f.name==='stylist-theme.css'))return false;
  await openFiles(files);
  APP.source=`Opened from GitHub: ${ghLabel(g)} · ${new Date().toLocaleDateString()}`;APP.gh=ghLabel(g);if(APP.origin)APP.origin.from='github:'+ghLabel(g);saveApp();apply();
  ghLast={repo:`${g.owner}/${g.repo}`,path:g.path};try{localStorage.setItem('stylist.gh.v1',JSON.stringify(ghLast))}catch(e){}
  return true}
function openGh(){$('ghRepo').value=ghLast?ghLast.repo+(ghLast.path?'/'+ghLast.path:''):'';$('ghMsg').textContent='';
  $('ghLink').hidden=!ghLast;$('ghGo').disabled=false;$('ghmod').hidden=false;setTimeout(()=>$('ghRepo').focus(),0)}
const closeGh=()=>{$('ghmod').hidden=true};
$('mGh').onclick=openGh;$('ghClose').onclick=closeGh;$('ghCancel').onclick=closeGh;
$('ghmod').onclick=e=>{if(e.target===$('ghmod'))closeGh()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('ghmod').hidden)closeGh()});
$('ghRepo').oninput=()=>{$('ghLink').hidden=!ghParse($('ghRepo').value)};
$('ghForm').onsubmit=async e=>{e.preventDefault();const g=ghParse($('ghRepo').value);
  if(!g){$('ghMsg').textContent='Paste the repo’s link, like github.com/g-ab/cast, or just g-ab/cast.';return}
  $('ghGo').disabled=true;$('ghMsg').textContent=`Reading ${ghLabel(g)}…`;
  try{if(await ghOpen(g))closeGh();else $('ghMsg').textContent=`No Stylist files found in ${ghLabel(g)}. Check the folder, and that the repo is public.`}
  catch(err){$('ghMsg').textContent='GitHub can’t be reached from here. This works on the Stylist website (g-ab.github.io/stylist), with an internet connection.'}
  $('ghGo').disabled=false};
$('ghLink').onclick=async()=>{const g=ghParse($('ghRepo').value);if(!g)return;
  const url=`${location.origin}${location.pathname}?app=${ghLabel(g)}`;
  try{await navigator.clipboard.writeText(url);toast('Link copied: it opens Stylist with this app loaded')}catch(e){$('ghMsg').textContent=url}};
// a link with ?app=owner/repo opens that app straight away
{const q=new URLSearchParams(location.search).get('app'),g=q&&ghParse(q);
  if(g)ghOpen(g).then(ok=>{if(!ok)toast(`No Stylist files found in ${ghLabel(g)}`)}).catch(()=>toast('GitHub can’t be reached from here'))}
