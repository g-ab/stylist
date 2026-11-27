// ---- fitting: every file is cleaned, given a viewBox, trimmed to what it draws, and (mark, favicon) squared,
// so the same file drops into avatars, icon buttons, headers and tabs without any tweaking
function svgClean(t){let d;try{d=new DOMParser().parseFromString(t,'image/svg+xml')}catch(e){return null}const r=d.documentElement;
  if(!r||r.nodeName.toLowerCase()!=='svg'||d.querySelector('parsererror'))return null;
  r.querySelectorAll('script,foreignObject').forEach(n=>n.remove());
  for(const n of [r,...r.querySelectorAll('*')])for(const a of [...n.attributes]){const v=a.value.trim();
    if(/^on/i.test(a.name)||(/href$/i.test(a.name)&&!/^#/.test(v)&&!/^data:image\//i.test(v)))n.removeAttribute(a.name)}
  return r}
function vbOf(r){const v=(r.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);if(v.length===4&&v.every(isFinite)&&v[2]>0&&v[3]>0)return v;
  const W=r.getAttribute('width')||'',H=r.getAttribute('height')||'',w=parseFloat(W),h=parseFloat(H);if(w>0&&h>0&&!/%/.test(W+H))return [0,0,w,h];
  const box=document.createElement('div');box.style.cssText='position:fixed;left:-9999px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden';
  const c=document.importNode(r,true);box.append(c);document.body.append(box);let b=null;try{b=c.getBBox()}catch(e){}box.remove();
  return b&&b.width>0&&b.height>0?[b.x,b.y,b.width,b.height]:[0,0,100,100]}
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});
async function fitSVG(t,square){const r=svgClean(t);if(!r)return null;if(!r.getAttribute('xmlns'))r.setAttribute('xmlns','http://www.w3.org/2000/svg');
  const vb=vbOf(r),N=480,s=N/Math.max(vb[2],vb[3]),W=Math.max(1,Math.round(vb[2]*s)),H=Math.max(1,Math.round(vb[3]*s));
  r.setAttribute('viewBox',vb.join(' '));r.setAttribute('width',W);r.setAttribute('height',H);r.removeAttribute('preserveAspectRatio');
  let bb=null,lum=null,cover=0;
  try{const im=await loadImg(svgSrc(new XMLSerializer().serializeToString(r))),cv=document.createElement('canvas');cv.width=W;cv.height=H;
    const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,W,H);const d=x.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1,L=0,A=0;
    for(let y=0;y<H;y++)for(let q=0;q<W;q++){const i=(y*W+q)*4,a=d[i+3];if(a>8){if(q<x0)x0=q;if(q>x1)x1=q;if(y<y0)y0=y;if(y>y1)y1=y;const w=a/255;L+=w*relLum(d[i],d[i+1],d[i+2]);A+=w}}
    if(x1>=0){bb=[x0,y0,x1+1,y1+1];lum=L/A;cover=A/((x1+1-x0)*(y1+1-y0))}}catch(e){}
  let [bx,by,bw,bh]=vb;
  if(bb){const p=.5/s;bx=vb[0]+bb[0]/s-p;by=vb[1]+bb[1]/s-p;bw=(bb[2]-bb[0])/s+2*p;bh=(bb[3]-bb[1])/s+2*p}
  if(square){const m=Math.max(bw,bh);bx-=(m-bw)/2;by-=(m-bh)/2;bw=bh=m}
  const f=n=>+n.toFixed(3);r.setAttribute('viewBox',[bx,by,bw,bh].map(f).join(' '));r.removeAttribute('width');r.removeAttribute('height');
  return {svg:new XMLSerializer().serializeToString(r),ratio:bw/bh,lum,full:cover>.82&&(!square||Math.abs(bb?(bb[2]-bb[0])/(bb[3]-bb[1])-1:0)<.08),fit:2}}
// ---- placing: a file goes into the slot it was dropped on or chosen for, and is fitted for every spot that asset shows in
async function addBrandFiles(list,slot){if(!slot)return;const [k,v]=slot,f=list[0];if(!f)return;
  if(!/\.svg$/i.test(f.name)&&f.type!=='image/svg+xml'){toast('That isn’t an SVG');return}
  if(f.size>300000){toast(`${f.name} is over 300 KB: export a lighter one`);return}
  const t=await f.text(),ok=/<svg[\s>]/i.test(t);let a=null;
  if(ok&&k==='main'){const w=await fitSVG(t,false),q=await fitSVG(t,true);a=w&&q?{...w,sq:q}:null} // one file, fitted wide (logo) and square (mark, favicon)
  else if(ok)a=await fitSVG(t,k!=='logo');
  if(!a){toast('No usable SVG there');return}
  APP.brand=APP.brand||{};APP.brand[k]={...(APP.brand[k]||{}),[v]:{name:f.name,...a}};
  saveApp();apply();if($('vBrand').hidden)showView('brand');toast(k==='main'?`Placed: symbol (${v})`:`Placed: ${BR_SLOTS.find(s=>s[0]===k)[1]} ${v}`)}
// files from before fitting existed, or from a package: fit them once, quietly
let brRefit=false;async function refitBrand(){if(brRefit)return;const B=APP.brand||{},todo=[];for(const k in B)for(const v in B[k]||{})if(B[k][v]&&B[k][v].fit!==2)todo.push([k,v]);
  if(!todo.length)return;brRefit=true;for(const [k,v] of todo){const a=B[k][v];let f=await fitSVG(a.svg,k!=='logo');if(f&&k==='main'){const q=await fitSVG(a.svg,true);f=q?{...f,sq:q}:null}if(f)B[k][v]={name:a.name,...(a.base?{base:true}:{}),...f};else B[k][v]={...a,fit:2}}
  brRefit=false;saveApp();apply()}
// which file a spot shows: its own file for the mode, else the main file for the mode; dark then falls back to the light ones
function brandSrc(k,m){const B=APP.brand||{},o=B[k]||{},M=B.main||{},mm=x=>x?(k==='logo'?x:(x.sq||x)):null;
  if(o[m])return {a:o[m],from:'own',m};if(M[m])return {a:mm(M[m]),from:'main',m};
  if(m==='dark'){if(o.light)return {a:o.light,from:'own',m:'light'};if(M.light)return {a:mm(M.light),from:'main',m:'light'}}
  return {a:null}}
function brandOf(k,m){return brandSrc(k,m).a}
// defaults: the files the opened app shipped (kept in APP.brandBase); on the built-in setup there are none, so a slot's default is empty
const BR_KEYS=['main','logo','favicon'];
// Mark and Main file merged into Symbol: old Mark files move into the symbol (refit later adds its wide/square versions), never overwriting one
function mergeMark(B){if(!B||!B.mark)return B;B.main=B.main||{};for(const v of ['light','dark']){const a=B.mark[v];if(a&&!B.main[v])B.main[v]={name:a.name,svg:a.svg,...(a.base?{base:true}:{})}}delete B.mark;return B}
function shipBrand(inc){mergeMark(inc);const m={};for(const k in inc){m[k]={};for(const v in inc[k]||{})if(inc[k][v])m[k][v]={...inc[k][v],base:true}}
  APP.brand={...(APP.brand||{}),...m};APP.brandBase={...(APP.brandBase||{}),...JSON.parse(JSON.stringify(m))}}
const brBaseOf=(k,v)=>((APP.brandBase||{})[k]||{})[v]||null;
function brSlotChanged(k,v){const a=((APP.brand||{})[k]||{})[v],b=brBaseOf(k,v);return !!a!==!!b||(!!a&&!a.base)}
const brChanged=()=>BR_KEYS.some(k=>['light','dark'].some(v=>brSlotChanged(k,v)));
function brReset(k,v){APP.brand=APP.brand||{};const b=brBaseOf(k,v),o={...(APP.brand[k]||{})};if(b)o[v]=JSON.parse(JSON.stringify(b));else delete o[v];APP.brand[k]=o}
function brResetAll(){APP.brand=JSON.parse(JSON.stringify(APP.brandBase||{}))}
const EMPTY_IC='<svg class="emp" viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke-dasharray="2 1.6"/></svg>';
// what could go wrong, per mode, against that mode's own surface
function brandWarns(k){const B=(APP.brand||{})[k]||{},out=[],t=tokens(),lab=k==='logo'?'logo':k==='mark'?'mark':'favicon';
  if(k==='logo'){const a=B.light||B.dark;if(a&&a.ratio<1.2)out.push('Nearly square: is this the symbol? Wide files go to Logo, square ones to Symbol.')}
  for(const m of ['light','dark']){const sr=brandSrc(k,m),a=k==='favicon'||sr.from==='main'?null:sr.a;if(!a||a.lum==null)continue; // main-file issues show once, under the main file
    if(contrast(a.lum,lumOf(t[m].sheet))<1.45)out.push(`Hard to see in ${m} mode: ${brandSrc(k,m).m===m?'this file is':'the light-mode file is used, and it’s'} too close to the background. Drop a ${m==='dark'?'light-coloured':'dark-coloured'} version for ${m} mode.`)}
  return out}
function mainWarns(){const M=(APP.brand||{}).main||{},t=tokens(),out=[];for(const m of ['light','dark']){const a=M[m]||(m==='dark'?M.light:null);if(!a||a.lum==null)continue;
  if(contrast(a.lum,lumOf(t[m].sheet))<1.45)out.push(`Hard to see in ${m} mode: ${M[m]?'this file is':'the light file is used, and it’s'} too close to the background. Drop a ${m==='dark'?'light-coloured':'dark-coloured'} file for ${m} mode.`)}return out}
function renderBrandSlots(){const B=APP.brand||{};let n=0;refitBrand();
  const slot=(k,v,lab)=>{const a=(B[k]||{})[v];if(a)n++;const s=a?null:k==='main'?(v==='dark'&&(B.main||{}).light?{a:B.main.light,from:'main',m:'light'}:{a:null}):brandSrc(k,v),src=a||(s&&s.a);
    const nm=a?escH(a.name):!src?(v==='dark'?'Optional':k==='main'?'Choose SVG':'Optional'):s.from==='main'&&k!=='main'?(s.m===v?'Uses symbol':'Uses symbol light'):'Uses light';
    return `<div class="bslot"><span>${lab}</span><button class="bbtn${a?' set':''}${!a&&src?' auto':''}${v==='dark'?' dk':''}" data-k="${k}" data-v="${v}" title="${a?'Replace':'Choose an SVG, or drop one here'}"><span class="th">${src?`<img src="${svgSrc(src.svg)}" alt="">`:EMPTY_IC}</span><span class="nm">${nm}</span>${brSlotChanged(k,v)?`<span class="rdot" data-rs="1" role="button" tabindex="0" data-tip="Reset ${lab.toLowerCase()} ${k==='main'?'symbol':k} to the default (${brBaseOf(k,v)?escH(brBaseOf(k,v).name):'empty'})" aria-label="Reset to the default"></span>`:''}${a&&a.base?'<span class="x" data-rm="1" role="button" aria-label="Remove">×</span>':''}</button></div>`};
  const md=v=>v==='light'?'Light mode':'Dark mode';
  $('brSlots').innerHTML=`<div class="bgrp bmain"><b>Symbol</b><small>Avatars, icon buttons and sign-in. Also fills Logo and Favicon when they’re empty</small>${['light','dark'].map(v=>slot('main',v,md(v))).join('')}${mainWarns().map(x=>`<small class="bwarn">${escH(x)}</small>`).join('')}</div>`+
  BR_SLOTS.map(([k,l,w,vs])=>{const ws=brandWarns(k);return `<div class="bgrp"><b>${l}</b><small>${w}</small>${vs.map(v=>slot(k,v,md(v))).join('')}${ws.map(x=>`<small class="bwarn">${escH(x)}</small>`).join('')}</div>`}).join('');
  $('brOut').textContent=n?`${n} file${n>1?'s':''}`:'none yet';$('brDl').disabled=!n}
// just the brand files (logos, favicon, the light/dark switch, a README), without the whole package
$('brDl').onclick=()=>{const fs=brandFiles();if(!fs.length){toast('Drop a symbol or logo first');return}
  downloadZip(fs,(APP.name||'app').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-brand.zip','Brand files saved')};
let brTarget=null;
$('brSlots').addEventListener('click',e=>{const b=e.target.closest('.bbtn');if(!b)return;const k=b.dataset.k,v=b.dataset.v;
  if(e.target.closest('[data-rs]')){brReset(k,v);saveApp();apply();return}
  if(e.target.closest('[data-rm]')){const o={...(APP.brand[k]||{})};delete o[v];APP.brand[k]=o;saveApp();apply();return}
  brTarget=[k,v];$('brFile').multiple=false;$('brFile').click()});
$('brFile').onchange=e=>{const fs=[...e.target.files];if(fs.length)addBrandFiles(fs,brTarget);brTarget=null;e.target.value=''};
const brGrp=$('brSlots').closest('.grp');
brGrp.addEventListener('dragover',e=>{e.preventDefault();e.stopPropagation();const b=e.target.closest('.bbtn');brGrp.querySelectorAll('.drop').forEach(x=>x!==b&&x.classList.remove('drop'));if(b)b.classList.add('drop')});
brGrp.addEventListener('dragleave',e=>{if(!brGrp.contains(e.relatedTarget))brGrp.querySelectorAll('.drop').forEach(x=>x.classList.remove('drop'))});
brGrp.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();brGrp.querySelectorAll('.drop').forEach(x=>x.classList.remove('drop'));const b=e.target.closest('.bbtn'),fs=[...e.dataTransfer.files];
  if(!fs.length)return;if(!b){toast('Drop the file on a slot');return}addBrandFiles(fs,[b.dataset.k,b.dataset.v])});
// ---- export: the fitted files, one per slot, and the CSS that swaps light/dark files
function splitAdaptive(t){const d=new DOMParser().parseFromString(t,'image/svg+xml'),g=c=>{const n=d.querySelector('svg.'+c);if(!n)return null;['class','x','y','width','height'].forEach(a=>n.removeAttribute(a));n.setAttribute('xmlns','http://www.w3.org/2000/svg');return new XMLSerializer().serializeToString(n)};return {light:g('cl'),dark:g('cd')}}
function brandFiles(){const out=[],B=APP.brand||{},tg=APP.target;
  const dkOf=k=>{const d=brandOf(k,'dark');return d&&d!==brandOf(k,'light')?d:null}; // a dark file only when it differs from the light one
  for(const k of ['logo','mark','favicon']){const l=brandOf(k,'light'),d=dkOf(k);
    if(l)out.push({name:'brand/'+brFile(k,'light'),type:'image/svg+xml',text:l.svg,note:`Brand ${k}, fitted by Stylist.`});
    if(d)out.push({name:'brand/'+brFile(k,'dark'),type:'image/svg+xml',text:d.svg,note:`Brand ${k} (dark mode), fitted by Stylist.`})}
  const fl=brandOf('favicon','light'),fd=dkOf('favicon');
  const dk=['logo','mark'].filter(k=>brandOf(k,'light')&&dkOf(k));
  if(dk.length){const D={css:[':root[data-theme="dark"]'],shadcn:['.dark'],radix:['.dark','.dark-theme']}[tg]||[':root[data-theme="dark"]'],sel=(s)=>D.map(d=>`${d} ${s}`).join(', ');
    out.push({name:'brand/brand.css',type:'text/css',text:`/* Stylist brand · ${APP.name}. Shows the light or dark file to match the theme.\n   Use both files, side by side:\n   <img class="brand-light" src="/brand/logo.svg" alt="${APP.name}"><img class="brand-dark" src="/brand/logo-dark.svg" alt="${APP.name}">\n   Size them by height only (width: auto): Stylist trimmed every file to its drawing, so the height you set is the height you see. */\n.brand-dark { display: none; }\n${sel('.brand-light')} { display: none; }\n${sel('.brand-dark')} { display: revert; }\n`+(tg==='css'?`@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) .brand-light { display: none; }\n  :root:not([data-theme="light"]) .brand-dark { display: revert; }\n}\n`:''),
      note:'Swaps light/dark brand files with the theme. Import once.'})}
  if(out.length)out.push({name:'brand/README.md',type:'text/markdown',text:`# ${APP.name} brand files\n\nGenerated by Stylist. Every file is trimmed to its drawing and has a viewBox; marks and the favicon are square. So set a height and keep width auto: it fits avatars, icon buttons, headers and tabs as is.\n\n${fl?'- Favicon: \`<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">\`'+(fd?', then \`<link rel="icon" type="image/svg+xml" href="/brand/favicon-dark.svg" media="(prefers-color-scheme: dark)">\` after it.\n':'.\n'):''}${dk.length?'- Light/dark: import `brand.css` once, then put both files side by side with the classes `brand-light` and `brand-dark`.\n':'- One file per asset: it’s used in both modes.\n'}${tg==='shadcn'?'- shadcn: put the mark in `<Avatar><AvatarImage src="/brand/mark.svg" /></Avatar>`, or in an icon `<Button size="icon">` as an `<img>` at `size-4`.\n':tg==='radix'?'- Radix: `<Avatar src="/brand/mark.svg" fallback="…" />` at any size 1–9; in an `<IconButton>` as an `<img>` at the icon size.\n':''}`,note:'How to use the brand files.'});
  return out}
// the Brand view: the files on their own, then where they're judged
function fitLabel(k,i){const h=hOf();return {css:`--control-${k}`,shadcn:`size-${h[k]} · avatar, icon button`,radix:`size ${i+1} · Avatar, IconButton`}[APP.target]}
function brandFitNote(){const w=[...brandWarns('mark'),...brandWarns('logo')].filter(x=>x.includes(mode+' mode'));return w.length?` · <em class="wn">${escH(w[0])}</em>`:''}
function renderBrand(){renderBrandSlots();
  document.querySelectorAll('.bp-logo').forEach(s=>{const a=brandOf('logo',mode);s.innerHTML=a?`<img src="${svgSrc(a.svg)}" alt="${escH(APP.name)}" style="height:18px;width:auto;display:block">`:escH(APP.name)});const el=$('brBody');if(!el||$('vBrand').hidden)return;
  const img=(k,h)=>{const a=brandOf(k,mode);return a?`<img src="${svgSrc(a.svg)}" alt="" style="${h?'height:'+h+'px;width:auto':''}">`:''};
  const mark=s=>img('mark',s)||`<span class="ph-mark" style="width:${s}px;height:${s}px"><i></i></span>`;
  const mFull=()=>{const a=brandOf('mark',mode);return !a||a.full}; // an app-icon style mark fills; a bare symbol gets the padding an icon would
  const logo=h=>img('logo',h)||`<span class="ph-logo">${mark(h+6)}<b></b></span>`;
  const fav=s=>img('favicon',s)||`<span class="ph-fav" style="width:${s}px;height:${s}px"></span>`;
  const set=(k)=>{const s=brandSrc(k,mode);if(!s.a)return '<em>placeholder</em>';const w=s.from==='main'?'symbol':'own';return s.m===mode?`<em>${w} ${mode} file</em>`:`<em>${w} light file, no dark version</em>`};
  el.innerHTML=`<h3>Brand assets</h3>
  <div class="b-assets">
    <div class="b-card"><div class="b-stage">${logo(28)}</div><div class="b-lab">Logo${set('logo')}</div></div>
    <div class="b-card"><div class="b-stage">${mark(56)}</div><div class="b-lab">Symbol${set('mark')}</div></div>
    <div class="b-card"><div class="b-stage">${fav(48)}</div><div class="b-lab">Favicon${set('favicon')}</div></div></div>
  <h3>Fits your components</h3>
  <div class="b-card"><div class="b-rows">
    <div class="b-row"><div class="b-rl"><b>Icon buttons</b><small>The symbol inside a button, like an app switcher or home button</small></div>
      <div class="b-rv">${HK.map(k=>{const z=effHpx()[k];return `<figure><span class="slot" style="width:${z}px;height:${z}px">${mark(mFull()?z-8:Math.round(z*.56))}</span><figcaption>${k} · ${z}px</figcaption></figure>`}).join('')}</div></div>
    <div class="b-row"><div class="b-rl"><b>Avatars</b><small>The symbol as the app’s avatar, in lists and menus</small></div>
      <div class="b-rv">${HK.map(k=>{const z=effHpx()[k];return `<figure><span class="av${mFull()?'':' sym'}" style="width:${z}px;height:${z}px">${mark(mFull()?z:Math.round(z*.62))}</span><figcaption>${k} · ${z}px</figcaption></figure>`}).join('')}</div></div>
    <div class="b-row"><div class="b-rl"><b>Header bar</b><small>The logo in the title bar: ${Math.round(effHpx().sm*.7)}px tall in a ${effBar()}px bar</small></div>
      <div class="b-rv"><span class="hbar" style="height:${effBar()}px">${logo(Math.round(effHpx().sm*.7))}<span class="hnav"><b>Overview</b><span>Drawings</span><span>Settings</span></span></span></div></div>
  </div>${brandFitNote()?`<div class="b-lab">${brandFitNote().replace(/^ · /,'')}</div>`:''}</div>
  <h3>In context</h3>
  <div class="b-card"><div class="b-hdr"><span class="lg">${logo(20)}</span><nav><b>Overview</b><span>Drawings</span><span>Patterns</span><span>Settings</span></nav><span class="sp"></span><span class="k-av sm">GA</span></div>
    <div class="b-page">${mark(40)}<h4>Pitcher vase</h4></div><div class="b-lab">Header</div></div>
  <div class="b-card"><div class="b-sign"><div class="k-card"><span class="mk">${mark(44)}</span><h4>Sign in to ${escH(APP.name)}</h4>
    <label class="k-field" style="width:auto">Email<input class="k-input" value="gab@studio.com"></label><button class="k-btn pri">Sign in</button></div></div><div class="b-lab">Sign in</div></div>
  <div class="b-card"><div class="b-tabs"><span class="b-tab on"><span class="fv">${img('favicon')||'<i></i>'}</span>${escH(APP.name)}: Overview</span><span class="b-tab"><span class="fv"><i></i></span>Docs</span></div>
    <div class="b-sizes">${[16,32,64].map(z=>`<div><span style="width:${z+8}px;height:${z+8}px">${fav(z)}</span>${z}px</div>`).join('')}</div><div class="b-lab">Favicon</div></div>`}
// any colour → hex (#rrggbb, or #rrggbbaa when translucent), via the browser's own colour parser
function colorHex(c){const cv=document.createElement('canvas');cv.width=cv.height=1;const x=cv.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,1,1);x.fillStyle='#000';x.fillStyle=c;x.fillRect(0,0,1,1);
  const d=x.getImageData(0,0,1,1).data,h=n=>n.toString(16).padStart(2,'0');return '#'+h(d[0])+h(d[1])+h(d[2])+(d[3]<255?h(d[3]):'')} // sRGB, as the screen shows it
async function copyStr(v){try{await navigator.clipboard.writeText(v);return true}catch(e){const ta=document.createElement('textarea');ta.value=v;ta.style.cssText='position:fixed;opacity:0';document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();return ok}}
async function copySwatch(el){const hx=colorHex(el.dataset.copy);toast(await copyStr(hx)?`Copied ${hx} · ${el.dataset.name}`:`${hx} · ${el.dataset.name} (copy blocked, select it from here)`)}
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('#tokBody [data-copy]');if(el)copySwatch(el)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('#tokBody [data-copy]')){e.preventDefault();copySwatch(e.target)}});
let tt;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
// =================== Styles: switching or resetting puts the style's values back; if you changed any, a dialog lists what goes ===================
const radLab=(r,p)=>p?`${r}px, pill controls`:`${r}px`;
function styleEdits(){const st=stOf(S.dens),u=unitOf(),out=[];
  if(S.radius!==st.radius||!!S.pill!==st.pill)out.push(['Radius',radLab(S.radius,S.pill),radLab(st.radius,st.pill)]);
  if(S.ui!==st.ui)out.push(['Typeface',S.ui,st.ui]);
  if(u!==st.unit)out.push(['Spacing unit',u+'px',st.unit+'px']);
  const h=hOf();for(const k of HK)if(h[k]!==st.h[k])out.push([`${k} height`,h[k]*u+'px',st.h[k]*st.unit+'px']);
  return out}
function setStyle(k){const d=stOf(k);S.dens=k;S.unit=d.unit;S.h={...d.h};S.radius=d.radius;S.pill=d.pill;S.ui=d.ui;loadFont(d.ui);apply()}
// Switching always asks first and lists every value that changes; the ones you set yourself are marked, since those are the ones you lose.
// Resetting the current style asks only when you changed something.
function styleRows(k){const cur=stOf(S.dens),to=stOf(k),u=unitOf(),h=hOf(),mine=new Set(styleEdits().map(r=>r[0])),rows=[];
  const add=(l,a,b)=>{if(a!==b)rows.push([l,a,b,mine.has(l)])};
  add('Typeface',S.ui,to.ui);add('Radius',radLab(S.radius,S.pill),radLab(to.radius,to.pill));add('Spacing unit',u+'px',to.unit+'px');
  for(const x of HK)add(`${x} height`,h[x]*u+'px',to.h[x]*to.unit+'px');
  add('Text size',cur.fs+'px',to.fs+'px');add('Card padding',cur.pad*u+'px',to.pad*to.unit+'px');add('Inset',cur.inset+'px',to.inset+'px');
  return rows}
function switchStyle(k){const d=stOf(k),same=k===S.dens;
  const rows=same?styleEdits().map(([l,a,b])=>[l,a,b,true]):styleRows(k);if(!rows.length){if(!same){setStyle(k);toast(`Style: ${d.name}`)}return}
  const dl=$('stDlg'),n=rows.filter(r=>r[3]).length;
  dl.querySelector('h3').textContent=same?`Reset ${d.name}?`:`Switch to ${d.name}?`;
  dl.querySelector('p').textContent=same?'These changes will go back to the style’s values:':n?`These values will change. ${n===1?'The one marked “yours” is a change you made, and it’ll be lost.':`The ${n} marked “yours” are changes you made, and they’ll be lost.`}`:`These values will change:`;
  dl.querySelector('ul').innerHTML=rows.map(([l,a,b,m])=>`<li${m?' class="mine"':''}><b>${escH(l)}${m&&!same?' <em>yours</em>':''}</b> <span>${escH(a)}</span></li>`).join('');
  dl.querySelector('[data-ok]').textContent=same?'Reset':'Switch';
  dl.onclose=()=>{if(dl.returnValue==='ok'){setStyle(k);toast(same?`${d.name}: back to its own values`:`Style: ${d.name}`)}};dl.returnValue='';dl.showModal()}
{const dl=document.createElement('dialog');dl.id='stDlg';dl.innerHTML='<form method="dialog"><h3></h3><p></p><ul></ul><div class="sd-b"><button value="cancel" class="sd-c">Cancel</button><button value="ok" data-ok class="sd-o"></button></div></form>';document.body.append(dl)}
// =================== Motion view: the three springs drawn as curves, and live demos that use the tokens ===================
let motBuilt=false;
function curveSVG(k){const t=motionTokens()[k],d=t.duration,W=200,H=80,top=14,x=d>0?springX(d,t.bounce):()=>1,N=60;let en='',ex='';
  for(let i=0;i<=N;i++){const tt=d*i/N,X=i/N*W,Y=top+H-(i===N?1:x(tt))*H;en+=(i?'L':'M')+X.toFixed(1)+' '+Y.toFixed(1)}
  const xw=W*t.exit/Math.max(1,d);for(let i=0;i<=N;i++){const u=i/N,e=u*u*(1.6-0.6*u),X=u*xw,Y=top+e*H;ex+=(i?'L':'M')+X.toFixed(1)+' '+Y.toFixed(1)}
  return `<svg viewBox="-4 0 ${W+8} ${H+top+12}" aria-hidden="true"><path class="ax" d="M0 ${top+H}H${W}M0 ${top}V${top+H}"/><path class="tg" d="M0 ${top}H${W}"/><path class="ex" d="${ex}"/><path class="en" d="${en}"/></svg>`}
function renderMotion(){const el=$('motBody');if(!el||$('vMot').hidden)return;const mt=motionTokens();
  if(!motBuilt){motBuilt=true;
    el.innerHTML=`<div class="m-bar"><button class="k-btn" id="mReplay">Replay</button><label class="k-chk"><input type="checkbox" class="k-check" id="mSlow"> Slow motion ×5</label><label class="k-chk"><input type="checkbox" class="k-check" id="mRedPrev"> Preview reduced motion</label><span class="sp"></span></div>
    <h3>Springs</h3><div class="m-card"><div class="m-curves">${MK.map(k=>`<div class="m-cv" data-k="${k}"><b>${k[0].toUpperCase()+k.slice(1)}</b><small>${MJOB[k]}</small><div class="cv"></div><code></code></div>`).join('')}</div></div>
    <h3>In use</h3><div class="m-demos">
      <div class="m-card m-demo"><b>Hover highlight</b><small>Fast · one highlight glides to the nearest row</small><div class="m-list" id="mList"><span class="m-hl" id="mHl"></span>${['Pitcher vase','Planter','Lidded box','Tumbler','Bowl'].map(n=>`<div class="it">${n}</div>`).join('')}</div></div>
      <div class="m-card m-demo"><b>Tabs and switch</b><small>Moderate · indicators and toggles</small><div class="m-tabs" id="mTabs"><span class="m-ind" id="mInd"></span><button aria-selected="true">Front</button><button>Side</button><button>Top</button></div>
        <div class="m-sw" style="margin-top:16px"><input type="checkbox" class="k-switch" id="mSw" checked> Number the pieces</div></div>
      <div class="m-card m-demo"><b>Dropdown</b><small>Moderate in · quicker exit out</small><div class="m-ddw"><button class="k-btn" id="mDdBtn">Actions</button><div class="m-dd" id="mDd"><div>Duplicate</div><div>Rename</div><div>Export…</div></div></div><div style="height:118px"></div></div>
      <div class="m-card m-demo"><b>Dialog</b><small>Slow in · quicker exit out</small><div class="m-stage" id="mStage"><button class="k-btn" id="mDlgBtn">Open dialog</button><div class="m-scrim" id="mScrim"></div><div class="m-dlg"><b>Delete this piece?</b><p>It moves to the bin for 30 days.</p><button class="k-btn" id="mDlgClose">Close</button></div></div></div>
    </div>`;
    // fluid hover: the row whose centre is nearest the pointer wins
    const list=$('mList'),hl=$('mHl'),items=[...list.querySelectorAll('.it')];let cur=-1;
    const go=i=>{if(i===cur)return;const it=items[i];hl.style.height=it.offsetHeight+'px';hl.style.transform=`translateY(${it.offsetTop}px)`;if(cur<0){hl.style.transition='none';hl.offsetWidth;hl.style.transition=''}hl.classList.add('on');cur=i};
    list.addEventListener('pointermove',e=>{const y=e.clientY;let b=0,bd=1e9;items.forEach((it,i)=>{const r=it.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-y);if(d<bd){bd=d;b=i}});go(b)});
    list.addEventListener('pointerleave',()=>{hl.classList.remove('on');cur=-1});
    const tabs=$('mTabs'),ind=$('mInd'),place=()=>{const b=tabs.querySelector('[aria-selected="true"]');ind.style.width=b.offsetWidth+'px';ind.style.transform=`translateX(${b.offsetLeft}px)`};
    tabs.onclick=e=>{const b=e.target.closest('button');if(!b)return;tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));place()};
    requestAnimationFrame(()=>{ind.style.transition='none';place();ind.offsetWidth;ind.style.transition=''});
    $('mDdBtn').onclick=()=>$('mDd').classList.toggle('on');
    $('mDlgBtn').onclick=()=>$('mStage').classList.add('on');$('mDlgClose').onclick=()=>$('mStage').classList.remove('on');$('mScrim').onclick=()=>$('mStage').classList.remove('on');
    $('mSlow').onchange=e=>el.style.setProperty('--slowmo',e.target.checked?5:1);
    $('mRedPrev').onchange=()=>apply();
    $('mReplay').onclick=()=>{const k=+getComputedStyle(el).getPropertyValue('--slowmo')||1,w=ms=>new Promise(r=>setTimeout(r,ms*k));
      (async()=>{for(const i of [0,2,4,1]){go(i);await w(260)}hl.classList.remove('on');cur=-1;
        const bs=[...tabs.querySelectorAll('button')];for(const b of [bs[1],bs[2],bs[0]]){b.click();await w(380)}
        $('mSw').checked=!$('mSw').checked;await w(420);$('mSw').checked=!$('mSw').checked;await w(300);
        $('mDd').classList.add('on');await w(700);$('mDd').classList.remove('on');await w(400);
        $('mStage').classList.add('on');await w(1000);$('mStage').classList.remove('on')})()}}
  // reduced-motion preview: movement off, and with "No animation" durations too
  const red=$('mRedPrev').checked,m=motionOf();el.style.setProperty('--motion-move',red?0:1);
  for(const k of MK){if(red&&m.reduced==='none'){el.style.setProperty('--motion-'+k,'0ms');el.style.setProperty('--motion-'+k+'-exit','0ms')}if(red)el.style.setProperty('--ease-'+k,'ease-out')}
  el.querySelectorAll('.m-cv').forEach(c=>{const k=c.dataset.k,t=mt[k];c.querySelector('.cv').innerHTML=curveSVG(k);c.querySelector('code').textContent=`${t.duration}ms · ${t.bounce}% bounce · exit ${t.exit}ms`})}
// =================== Reset dots: a control that differs from its default shows a dot; clicking it puts that control back ===================
// Defaults: colour controls follow the chosen colour theme; heights and the spacing unit follow the density; the rest follow the app's current style.
function resetDefs(){const st=stOf(S.dens),p=preset()||PRESETS[0],P=PRESETS[0],F=FOCUS_DEFAULT,I=ICON_DEFAULT,D=DENS[S.dens],fo=focusOf(),ic=iconOf(),h2=id=>$(id)&&$(id).closest('h2');
  const row=sel=>document.querySelector(sel);
  return [
   {at:()=>$('preBtn').closest('.grp').querySelector('h2'),what:'colour theme',def:P.name,ch:()=>S.id!==P.id,go:()=>{S={...S,id:P.id,fam:P.fam,sat:P.sat,warm:P.warm,sup:P.sup,supFam:null}}},
   {at:()=>h2('hueOut'),what:'accent',def:`${p.fam} · ${p.sat}%`,ch:()=>S.fam!==p.fam||S.sat!==p.sat,go:()=>{S.fam=p.fam;S.sat=p.sat}},
   {at:()=>h2('supOut'),what:'support',def:SUP[p.sup].name,ch:()=>S.sup!==p.sup||(S.supFam||null)!==(p.supFam||null),go:()=>{S.sup=p.sup;S.supFam=p.supFam||null}},
   {at:()=>h2('warmOut'),what:'neutrals',def:p.warm<45?'cool':p.warm>55?'warm':'grey',ch:()=>S.warm!==p.warm,go:()=>{S.warm=p.warm}},
   {at:()=>h2('tintOut'),what:'containers',def:P.tint===0?'white':P.tint+'%',ch:()=>S.tint!==P.tint,go:()=>{S.tint=P.tint}},
   {at:()=>row('.shr[data-k="color"]>span'),what:'shadow colour',def:'Auto · 8%',ch:()=>shOf().color!==SH_DEFAULT.color||shOf().op!==SH_DEFAULT.op,go:()=>{S.sh={...shOf(),color:SH_DEFAULT.color,op:SH_DEFAULT.op}}},
   ...[['blur','shadow blur',v=>v+'px'],['spread','shadow spread',v=>v+'px'],['x','shadow offset X',v=>v+'px'],['y','shadow offset Y',v=>v+'px']].map(([k,w,f])=>({at:()=>row(`.shr[data-k="${k}"]>span`),what:w,def:f(SH_DEFAULT[k]),ch:()=>shOf()[k]!==SH_DEFAULT[k],go:()=>{S.sh={...shOf(),[k]:SH_DEFAULT[k]}}})),
   ...[['fshape','shape',F.shape],['fw','w',F.w+'px'],['foff','off',F.off+'px'],['fstr','str',F.str+'%']].map(([c,k,d])=>({at:()=>row(`[data-lens-ctl="${c}"]>span`),what:'focus '+({shape:'shape',w:'width',off:'offset',str:'strength'})[k],def:d,ch:()=>fo[k]!==F[k],go:()=>{S.focus={...focusOf(),[k]:F[k]}}})),
   {at:()=>h2('rOut'),what:'radius',def:radLab(st.radius,st.pill),ch:()=>S.radius!==st.radius||!!S.pill!==st.pill,go:()=>{S.radius=st.radius;S.pill=st.pill}},
   ...['ui','mono'].map(k=>{const dv=k==='ui'?st.ui:P[k];return {at:()=>row(`.frow[data-k="${k}"]>span`),what:k==='ui'?'interface font':'numbers & labels font',def:dv,ch:()=>S[k]!==dv,go:()=>{S[k]=dv;loadFont(dv)}}}),
   {at:()=>row('.tf>span:first-child'),what:'tracking',def:'0em',ch:()=>trackOf().base!==0,go:()=>{delete S.track}},
   {at:()=>h2('icOut'),what:'icon set',def:I.set[0].toUpperCase()+I.set.slice(1),ch:()=>ic.set!==I.set,go:()=>{S.icons={...iconOf(),set:I.set}}},
   {at:()=>h2('icStrokeOut'),what:'icon stroke',def:I.stroke,ch:()=>ic.stroke!==I.stroke,go:()=>{S.icons={...iconOf(),stroke:I.stroke}}},
   {at:()=>row('[data-ic="weight"] h2'),what:'icon weight',def:I.weight,ch:()=>ic.weight!==I.weight,go:()=>{S.icons={...iconOf(),weight:I.weight}}},
   {at:()=>h2('brOut'),what:'brand',def:APP.brandBase&&Object.keys(APP.brandBase).length?'the app’s files':'empty',ch:()=>brChanged(),go:()=>{brResetAll();saveApp()}},
   ...MK.map(k=>({at:()=>row(`.mrow[data-k="${k}"]>span>b`),what:k+' motion',def:`${MOTION_DEFAULT[k].d}ms · ${MOTION_DEFAULT[k].b}% bounce`,ch:()=>{const m=motionOf()[k];return m.d!==MOTION_DEFAULT[k].d||m.b!==MOTION_DEFAULT[k].b},go:()=>{S.motion={...motionOf(),[k]:{...MOTION_DEFAULT[k]}}}})),
   {at:()=>h2('mExOut'),what:'exit speed',def:MOTION_DEFAULT.exit+'%',ch:()=>motionOf().exit!==MOTION_DEFAULT.exit,go:()=>{S.motion={...motionOf(),exit:MOTION_DEFAULT.exit}}},
   {at:()=>$('mRed').closest('.grp').querySelector('h2'),what:'reduced motion',def:'fades only',ch:()=>motionOf().reduced!==MOTION_DEFAULT.reduced,go:()=>{S.motion={...motionOf(),reduced:MOTION_DEFAULT.reduced}}},
   {at:()=>h2('densOut'),what:'style',def:`${st.name}’s own values`,ch:()=>styleEdits().length>0,go:()=>{switchStyle(S.dens);return 'own'}},
   ...HK.map(k=>({at:()=>row(`.hf input[data-h="${k}"]`)&&row(`.hf input[data-h="${k}"]`).closest('.hf').firstElementChild,what:`${k} height`,def:`${D.h[k]*unitOf()}px`,ch:()=>hOf()[k]!==D.h[k],go:()=>{S.h={...hOf(),[k]:D.h[k]}}})),
   {at:()=>h2('unitOut'),what:'spacing unit',def:`${D.unit}px`,ch:()=>unitOf()!==D.unit,go:()=>{S.unit=D.unit}}]}
let RS=[];
function renderResets(){RS=resetDefs();RS.forEach((r,i)=>{const el=r.at();if(!el)return;let d=el.querySelector(':scope>.rdot[data-ri]');
  if(!d){d=document.createElement('button');d.type='button';d.className='rdot';d.dataset.ri=i;const o=el.tagName==='H2'&&el.querySelector(':scope>output');o?el.insertBefore(d,o):el.append(d)}
  d.dataset.ri=i;const on=r.ch();d.hidden=!on;const t=`Reset ${r.what} to the default (${r.def})`;d.dataset.tip=t;d.setAttribute('aria-label',t)})}
document.addEventListener('click',e=>{const d=e.target.closest('.rdot[data-ri]');if(!d)return;e.preventDefault();e.stopPropagation();const r=RS[+d.dataset.ri];if(!r)return;hideTip();if(r.go()==='own')return;apply();toast(`${r.what[0].toUpperCase()+r.what.slice(1)} back to the default`)},true);
document.addEventListener('keydown',e=>{const d=e.target.closest&&e.target.closest('.rdot[data-rs]');if(d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();d.click()}});
// one tooltip for every dot
const rtip=document.createElement('div');rtip.id='rtip';rtip.hidden=true;document.body.append(rtip);
function hideTip(){rtip.hidden=true}
function showTip(d){rtip.textContent=d.dataset.tip;rtip.hidden=false;const b=d.getBoundingClientRect(),w=rtip.offsetWidth,h=rtip.offsetHeight;
  let x=b.left+b.width/2-w/2,y=b.top-h-8;x=Math.max(8,Math.min(innerWidth-w-8,x));if(y<8)y=b.bottom+8;rtip.style.left=x+'px';rtip.style.top=y+'px'}
for(const [ev,on] of [['mouseover',1],['focusin',1],['mouseout',0],['focusout',0]])document.addEventListener(ev,e=>{const d=e.target.closest&&e.target.closest('.rdot');if(!d)return;on?showTip(d):hideTip()});
apply();
