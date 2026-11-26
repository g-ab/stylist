// ---- font picker ----
let fk=null,hi=-1;
function openPick(k,btn){fk=k;const p=$('fpop'),r=btn.getBoundingClientRect();p.hidden=false;
  p.style.left=r.left+'px';p.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-428))+'px';$('fq').value='';$('fq').placeholder=k==='mono'?'Search mono fonts':'Search Google Fonts';renderList();$('fq').focus()}
function closePick(){$('fpop').hidden=true;fk=null}
const esc=n=>n.replace(/[<>"&]/g,'');
function renderList(){
  const raw=$('fq').value.trim(),q=raw.toLowerCase(),cats=fk==='mono'?['Mono','Sans','Serif']:['Sans','Serif','Mono'];
  let h='',exact=false;const mine=Object.keys(custom).filter(n=>n.toLowerCase().includes(q));
  if(mine.length)h+='<h4>Your files</h4>'+mine.map(n=>`<button data-n="${esc(n)}" aria-selected="${S[fk]===n}" style="font-family:${fam(esc(n))}">${esc(n)}</button>`).join('');
  for(const c of cats){const l=GF[c].filter(n=>n.toLowerCase().includes(q));if(l.some(n=>n.toLowerCase()===q))exact=true;
    if(l.length)h+=`<h4>${c}</h4>`+l.map(n=>`<button data-n="${n}" aria-selected="${S[fk]===n}" style="font-family:${fam(n)},system-ui">${n}</button>`).join('')}
  if(q&&!exact){const nm=esc(raw).replace(/\b\w/g,m=>m.toUpperCase());h+=`<h4>Any Google font</h4><button class="any" data-n="${nm}">Use “${nm}”</button>`}
  $('flist').innerHTML=h;hi=-1;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const n=e.target.dataset.n;if(!e.target.classList.contains('any'))loadFont(n,true);io.unobserve(e.target)}}),{root:$('flist')});
  $('flist').querySelectorAll('button').forEach(b=>io.observe(b));
  const sel=$('flist').querySelector('[aria-selected="true"]');if(sel&&!q)sel.scrollIntoView({block:'center'});
}
function choose(n){if(!fk)return;S[fk]=n;loadFont(n);closePick();apply()}
document.querySelectorAll('.fbtn').forEach(b=>b.onclick=e=>{e.stopPropagation();fk===b.dataset.k?closePick():openPick(b.dataset.k,b)});
$('fq').oninput=renderList;
$('fq').onkeydown=e=>{const bs=[...$('flist').querySelectorAll('button')];
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();hi=Math.max(0,Math.min(bs.length-1,hi+(e.key==='ArrowDown'?1:-1)));bs.forEach((b,i)=>b.classList.toggle('hi',i===hi));bs[hi]&&bs[hi].scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'){const b=bs[hi]||bs[0];if(b)choose(b.dataset.n)}else if(e.key==='Escape')closePick()};
$('flist').onclick=e=>{const b=e.target.closest('button');if(b)choose(b.dataset.n)};
document.addEventListener('mousedown',e=>{if(fk&&!e.target.closest('#fpop,.fbtn'))closePick()});
// Your own font file: pick it in the menu, or drop it on a row.
function useFile(file,k){
  if(!file||!/\.(woff2?|ttf|otf)$/i.test(file.name)){toast('Use a .woff2, .woff, .ttf or .otf file');return}
  const name=file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').replace(/\s+(regular|variable|vf)$/i,'').trim();
  const rd=new FileReader();rd.onload=()=>{custom[name]=rd.result;loaded.delete(name);
    try{localStorage.setItem(CUST,JSON.stringify(custom))}catch(e){toast('Too big to remember after a reload, but it works for now')}
    S[k]=name;loadFont(name);closePick();apply()};rd.readAsDataURL(file)}
$('ffile').onchange=e=>{const k=fk;useFile(e.target.files[0],k);e.target.value=''};
document.querySelectorAll('.frow').forEach(r=>{
  r.ondragover=e=>{e.preventDefault();r.classList.add('drop')};r.ondragleave=()=>r.classList.remove('drop');
  r.ondrop=e=>{e.preventDefault();r.classList.remove('drop');useFile(e.dataTransfer.files[0],r.dataset.k)}});
$('round').onclick=e=>{const b=e.target.closest('button');if(b){const c=CORNERS[+b.dataset.i];S.radius=c.r;S.pill=!!c.pill;apply()}};
// what density touches: read-only, with a preview of the change when hovering a preset
function renderDensSpec(alt){const d=DENS[S.dens],u=unitOf(),a=alt?DENS[alt]:null,cur={bar:effBar(),ctl:effHpx().md},nx=a&&{bar:presetBar(a),ctl:a.h.md*a.unit};
  const rows=[
   ['bar','Bar height','Title bar, toolbars, tab bars (md + 2 × inset)',cur.bar,nx&&nx.bar,v=>`<i style="width:40px;height:${v/2}px"></i>`],
   ['ctl','Control height (md)','Buttons, fields, selects, segmented controls · all four sizes below',cur.ctl,nx&&nx.ctl,v=>`<i style="width:34px;height:${v/2}px;border-radius:5px"></i>`],
   ['inset','Inset','Padding inside a bar, around its buttons',d.inset,a&&a.inset,v=>`<span class="in" style="padding:${v/1.5}px"><i></i></span>`],
   ['fs','Text size','Body text; headings and labels follow it',d.fs,a&&a.fs,v=>`<b style="font-size:${v+2}px">Aa</b>`],
   ['unit','Spacing unit','Every space step, ×1 to ×16'+(densCustom()?' · set in Spacing':''),u,a&&a.unit,v=>`<i style="width:${v*2}px;height:8px;background:#1d232b;border:0;border-radius:2px"></i>`],
   ['gap','Gap','Between bars and floating panels (2 × unit)',2*u,a&&2*a.unit,v=>`<span class="gp" style="gap:${v/1.5}px"><i></i><i></i></span>`],
   ['pad','Card padding','Inside cards and panels',stOf(S.dens).pad*u,a&&stOf(alt).pad*a.unit,v=>`<span class="in" style="padding:${v/4}px"><i></i></span>`],
   ['rad','Radius','Controls; cards are 1.5 × · set in Radius',S.pill?'pill':S.radius,a&&(stOf(alt).pill?'pill':stOf(alt).radius),v=>`<i style="width:34px;height:16px;border-radius:${v==='pill'?'99':v/1.5}px"></i>`],
   ['type','Typeface','Interface text',S.ui,a&&stOf(alt).ui,v=>`<b style="font:600 15px '${escH(v)}',system-ui">Aa</b>`]];
  const f=v=>typeof v==='number'?v+'px':v;if(a)loadFont(stOf(alt).ui,true);
  $('dspec').innerHTML=rows.map(([k,l,w,v,n,vis])=>{const ch=n!=null&&n!==v;
    return `<div><span class="vis">${vis(ch?n:v)}</span><span class="lab"><b>${l}</b><small>${w}</small></span><span class="val">${ch?`<s>${f(v)}</s> → <em>${f(n)}</em>`:f(v)}</span></div>`}).join('')}
$('dens').addEventListener('mouseover',e=>{const b=e.target.closest('button');if(b)renderDensSpec(b.dataset.v)});
$('dens').addEventListener('mouseleave',()=>renderDensSpec());
$('dens').addEventListener('focusin',e=>{const b=e.target.closest('button');if(b)renderDensSpec(b.dataset.v)});
$('dens').addEventListener('focusout',()=>renderDensSpec());
$('dens').onclick=e=>{const b=e.target.closest('button');if(b)switchStyle(b.dataset.v)};
// the unit field: arrow keys step 2px (0.125rem); typed values round to whole pixels
$('unit').oninput=e=>{const v=parseFloat(e.target.value);if(!isFinite(v))return;S.unit=qUnit(v*16);apply()};
$('unit').onchange=$('unit').onblur=()=>{$('unit').value=+(unitOf()/16).toFixed(4)};
$('swatches').onclick=e=>{const b=e.target.closest('button');if(b){S.fam=b.dataset.f;apply()}};
$('supMode').innerHTML=Object.entries(SUP).map(([k,v])=>`<button data-v="${k}" title="${k==='custom'?'Pick its own colour below':'Follows the accent ('+v.name.toLowerCase()+')'}">${v.name}</button>`).join('');
$('supSw').innerHTML=FAMS.map(f=>`<button data-f="${f}" title="${f}" aria-label="${f}" style="background:${solidOf(f)}"></button>`).join('');
$('supMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.v==='custom'){S.supFam=supFam();S.sup='custom'}else{S.sup=b.dataset.v;S.supFam=null}apply()};
$('supSw').onclick=e=>{const b=e.target.closest('button');if(b){S.sup='custom';S.supFam=b.dataset.f;apply()}};
['sat','warm','tint'].forEach(k=>$(k).oninput=e=>{S[k]=+e.target.value;apply()});
// motion controls
function renderMotionCtl(){const m=motionOf();document.querySelectorAll('[data-m]').forEach(x=>{if(document.activeElement!==x)x.value=m[x.dataset.m][x.dataset.f]});
  $('mExit').value=m.exit;$('mExOut').textContent=m.exit+'% of enter';$('mRed').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===m.reduced));
  $('mOut').textContent=MK.map(k=>m[k].d).join(' · ')+' ms'}
document.querySelectorAll('[data-m]').forEach(x=>x.addEventListener('input',()=>{if(x.value==='')return;const v=Math.round(+x.value);if(!isFinite(v))return;const m=motionOf(),k=x.dataset.m,f=x.dataset.f;
  m[k]={...m[k],[f]:Math.max(+x.min,Math.min(+x.max,v))};S.motion=m;apply()}));
$('mExit').oninput=e=>{S.motion={...motionOf(),exit:+e.target.value};apply()};
$('mRed').onclick=e=>{const b=e.target.closest('button');if(b){S.motion={...motionOf(),reduced:b.dataset.v};apply()}};
// shadow seed controls: slider and number stay in step
function renderShadowCtl(){const s=shOf();document.querySelectorAll('[data-sh]').forEach(x=>{if(document.activeElement!==x)x.value=s[x.dataset.sh]});
  if(document.activeElement!==$('shOp'))$('shOp').value=s.op;$('shColTxt').textContent=s.color||'Auto';
  const g=grayScale(mode==='dark');$('shColor').value=s.color||colorHex(ok(.22,Math.min(.04,g.C*2),Math.round(g.h))).slice(0,7);$('shColor').nextElementSibling.style.background=s.color||$('shColor').value}
document.querySelectorAll('[data-sh]').forEach(x=>x.addEventListener('input',()=>{const v=Math.round(+x.value*2)/2;if(!isFinite(v)||x.value==='')return;const lo=+x.min,hi=+x.max;S.sh={...shOf(),[x.dataset.sh]:Math.max(lo,Math.min(hi,v))};apply()}));
$('shOp').addEventListener('input',e=>{const v=Math.round(+e.target.value*2)/2;if(!isFinite(v)||e.target.value==='')return;S.sh={...shOf(),op:Math.max(0,Math.min(60,v))};apply()});
$('shColor').addEventListener('input',e=>{S.sh={...shOf(),color:e.target.value};apply()});
$('mode').onclick=e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.v;$('mode').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));apply()};
$('reset').onclick=()=>{S={...PRESETS[0]};apply();toast('Back to the defaults')};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(setupText());toast('Copied. Paste it to Claude to apply.')}catch(e){const el=$('setup');el.hidden=false;const r=document.createRange();r.selectNodeContents(el);const g=getSelection();g.removeAllRanges();g.addRange(r);toast('Copy the selected line and paste it to Claude')}};
