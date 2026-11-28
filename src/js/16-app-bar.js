// ---- App bar: which app is being styled, where it came from, and what can be done with it ----
// The menu reads APP and APP.origin (see 02-app-layer.js): source, load date, the style as loaded (for Revert).
const appClose=()=>{$('appList').hidden=true;$('appBtn').setAttribute('aria-expanded','false')};
const libClose=appClose; // older name, still called in a few places
function srcLabel(o){if(!o)return '';if(o.new)return 'New app';const f=o.from||'';return f.startsWith('github:')?f.slice(7):'Opened from files'}
function dateLabel(d){if(!d)return '';const t=new Date(d+'T12:00:00');return isNaN(t)?d:t.toLocaleDateString(undefined,{day:'numeric',month:'short'})}
function renderAppBar(){const on=appLoaded(),o=APP.origin,gh=!!(o&&String(o.from||'').startsWith('github:'));
  $('appNm').textContent=on?(APP.name||'Untitled app'):'No app loaded';
  $('appSrc').textContent=on&&o?[srcLabel(o),o.loaded&&(o.new?'started ':'loaded ')+dateLabel(o.loaded)].filter(Boolean).join(' · '):'';
  $('appSrc').hidden=!$('appSrc').textContent;
  const made=APP.version||(APP.snapshot&&APP.snapshot.version);
  $('appInfo').innerHTML=on?`<b class="ai-n">${escH(APP.name||'Untitled app')}</b>`+
    (o?`<span>${o.new?'New app, not exported yet':gh?`From GitHub · <code>${escH(o.from.slice(7))}</code>`:'Opened from files'}</span>`+(o.loaded?`<span>${o.new?'Started':'Loaded'} ${escH(dateLabel(o.loaded))}${made?` · made with Stylist ${escH(String(made))}`:''}</span>`:''):`<span>${escH(APP.source||'')}</span>`)
    :'<b class="ai-n">No app loaded</b><span>Open your app’s style, or start a new one.</span>';
  $('mReload').hidden=!gh;$('mLink').hidden=!gh;
  $('mRevert').hidden=!(o&&o.base);$('mRevertL').textContent=o&&o.new?'Back to the start':'Revert to loaded style';
  $('mRename').hidden=!on;$('mClose').hidden=!on;
  document.querySelectorAll('#libSeg button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.t===APP.target)))}
const appItems=()=>[...$('appList').querySelectorAll('button')].filter(b=>!b.hidden&&!b.closest('[hidden]'));
$('appBtn').onclick=e=>{e.stopPropagation();const o=$('appList').hidden;amClose();renderAppBar();$('appList').hidden=!o;$('appBtn').setAttribute('aria-expanded',String(o));if(o)(appItems()[0]||$('appBtn')).focus()};
$('appList').onkeydown=e=>{const bs=appItems(),i=bs.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length].focus()}
  else if(e.key==='Escape'){appClose();$('appBtn').focus()}};
document.addEventListener('mousedown',e=>{if(!e.target.closest('.appdd'))appClose()});
$('libSeg').onclick=e=>{const b=e.target.closest('button[data-t]');if(!b)return;APP.target=b.dataset.t;saveApp();apply();appClose();$('appBtn').focus()};
$('mReload').onclick=async()=>{appClose();const g=ghParse(APP.origin.from.slice(7));if(!g)return;toast(`Reading ${ghLabel(g)}…`);
  try{if(!await ghOpen(g))toast('No Stylist files found there anymore')}catch(err){toast('Couldn’t read it from GitHub')}};
$('mLink').onclick=async()=>{appClose();const url=`${location.origin}${location.pathname}?app=${APP.origin.from.slice(7)}`;
  try{await navigator.clipboard.writeText(url);toast('Link copied: it opens Stylist with this app loaded')}catch(e){toast(url)}};
$('mRevert').onclick=()=>{const b=APP.origin&&APP.origin.base;appClose();if(!b)return;S=sanitizeS({...b.settings});APP.pins=JSON.parse(JSON.stringify(b.pins||{light:{},dark:{}}));saveApp();apply();
  toast(APP.origin.new?'Back to how it started':'Back to the style as loaded')};
$('mRename').onclick=()=>{const box=$('appInfo'),cur=APP.name||'';box.innerHTML=`<label class="ai-ren"><span>App name</span><input id="appRen" value="${escH(cur)}" maxlength="60" autocomplete="off"></label>`;
  const i=$('appRen');i.focus();i.select();
  const done=ok=>{if(ok&&i.value.trim()){APP.name=i.value.trim();saveApp();apply()}renderAppBar();$('mRename').focus()};
  i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();i.onblur=null;done(true);appClose();$('appBtn').focus()}else if(e.key==='Escape'){e.preventDefault();i.onblur=null;done(false)}};
  i.onblur=()=>done(true)};
function closeApp(){APP=appDefault();S={...PRESETS[0]};saveApp();apply();appClose();toast('App closed')}
// closing with changes the app's agent never got: say so first
const closeDlg=()=>{$('closemod').hidden=true};
$('mClose').onclick=()=>{appClose();if(!unsent()){closeApp();return}const n=escH(APP.name||'this app');
  $('closeTitle').textContent=`Close ${APP.name||'the app'}?`;
  $('closeText').innerHTML=`Your changes to ${n} haven’t been sent to its agent. Closing clears them from Stylist; ${n} itself doesn’t change.`;
  $('closemod').hidden=false;$('closeCancel').focus()};
$('closeCancel').onclick=()=>{closeDlg();$('appBtn').focus()};
$('closeSend').onclick=()=>{closeDlg();openSend()};
$('closeGo').onclick=()=>{closeDlg();closeApp()};
$('closemod').onclick=e=>{if(e.target===$('closemod'))closeDlg()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('closemod').hidden){closeDlg();$('appBtn').focus()}});
