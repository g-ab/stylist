// ---- sidebar tabs: one category of controls at a time ----
let PTAB='col';try{PTAB=localStorage.getItem('stylist.tab.v1')||'col'}catch(e){}
function showTab(t){PTAB=t;document.querySelectorAll('#ptabs button').forEach(b=>{const on=b.dataset.tab===t;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1});
  document.querySelectorAll('.ctl .grp').forEach(g=>g.hidden=g.dataset.tab!==t);try{renderIcons()}catch(e){}document.querySelector('.ctl').scrollTop=0;try{localStorage.setItem('stylist.tab.v1',t)}catch(e){}}
$('ptabs').onclick=e=>{const b=e.target.closest('button');if(b){showTab(b.dataset.tab);if(b.dataset.tab==='brand')showView('brand');if(b.dataset.tab==='motion')showView('mot')}};
$('ptabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const bs=[...$('ptabs').children],i=bs.findIndex(b=>b.dataset.tab===PTAB);
  const n=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+(e.key==='ArrowRight'?1:-1)+bs.length)%bs.length;showTab(bs[n].dataset.tab);bs[n].focus()};
showTab(document.querySelector(`#ptabs [data-tab="${PTAB}"]`)?PTAB:'col');
// =================== the library lens: captions + what each library can't do. Settings never change. ===================
const LIBN={css:'CSS',tw:'Tailwind',shadcn:'shadcn',radix:'Radix'};
function lensText(key){const L=APP.target,r=radiusScale(),u=unitOf(),h=hOf(),k=key.slice(2);
  if(key.startsWith('h-'))return {css:`--control-${k}`,tw:`h-${h[k]}`,shadcn:`h-${h[k]}`,radix:`size ${HK.indexOf(k)+1} · ${RX_H[HK.indexOf(k)]*u}px`}[L];
  return ({
    containers:{css:'--sheet',tw:'bg-sheet',shadcn:'--card · --popover',radix:'--color-panel-solid'},
    type:{css:'--font-ui · --font-mono',tw:'font-ui · font-mono',shadcn:'--font-sans · --font-mono',radix:'--default-font-family · --code-font-family'},
    corners:{css:`--radius-xs…2xl · lg ${r.lg}px`,tw:`rounded-xs…2xl · lg ${r.lg}px`,shadcn:`--radius ${r.lg}px${S.pill?' · pill controls: add rounded-full to buttons and inputs':''}`,radix:`--radius-factor ${+(r.lg/8).toFixed(3)}${S.pill?' · full':''}`},
    shadows:{css:'--shadow-inset · raised · floating · overlay',tw:'shadow-(--shadow-raised) and so on',shadcn:'inset-shadow-sm · shadow-sm · shadow-lg · shadow-2xl',radix:'--shadow-1 … 6'},
    focus:{css:'--focus · --focus-width · --focus-offset · --focus-ring',tw:'ring-focus · --focus-ring',shadcn:'--ring (colour and strength)',radix:'--focus-8 (colour and strength)'},
    icons:{css:iconStroked()?'stylist-icons.css · --icon-stroke':'stylist-icons.tsx · weight for every icon',shadcn:iconOf().set==='lucide'?'lucide-react, shadcn’s default · stylist-icons.css':`${ICON_SETS[iconOf().set].pkg} · swap lucide-react imports · ${iconStroked()?'stylist-icons.css':'stylist-icons.tsx'}`,radix:'your own UI · Radix keeps its built-in icons in its controls'},
    track:{css:'--tracking · --tracking-tighter…widest follow it',tw:'tracking-tighter…widest follow it',shadcn:'--tracking · tracking-tighter…widest follow it',radix:'--default-letter-spacing · --letter-spacing-1…9 follow it'},
    space:{css:`--space-1…16 · ${u}px per step`,tw:`--spacing ${rem(u)} · sizes like w-64 scale too`,shadcn:`--spacing ${rem(u)} · h-* and w-* scale too`,radix:'--space-1 … 9'}
  }[key]||{})[L]}
const LENS_OFF={
  radix:{fshape:'Radix always draws an outline.',fw:'Radix fixes the width at 2px.',foff:'Radix sets the offset per component.',h:'In Radix, sizes 1–4 follow its space scale (6, 8, 10, 12 × unit). Change the spacing unit instead.'},
  shadcn:{fshape:'shadcn components draw a ring.',fw:'Set in component code: ring-[3px].',foff:'Set in component code.'}};
function renderLens(){const L=APP.target,off=LENS_OFF[L]||{};
  document.querySelectorAll('#libSeg button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===L));$('libBtn').title='Destination: '+({css:'None',tw:'Tailwind',shadcn:'shadcn',radix:'Radix'}[L]||'None');
  document.querySelectorAll('[data-lens-ctl]').forEach(el=>{const why=off[el.dataset.lensCtl]||'';el.classList.toggle('off',!!why);
    el.querySelectorAll('input,button').forEach(x=>x.disabled=!!why);
    const w=el.dataset.lensCtl==='h'?document.querySelector('.hwhy'):el.querySelector('.why');if(w)w.textContent=why});
}
const libClose=()=>{$('libSeg').hidden=true;$('libBtn').setAttribute('aria-expanded','false')};
$('libBtn').onclick=e=>{e.stopPropagation();const o=$('libSeg').hidden;amClose();$('libSeg').hidden=!o;$('libBtn').setAttribute('aria-expanded',String(o));if(o)($('libSeg').querySelector('[aria-selected="true"]')||$('libSeg').querySelector('button')).focus()};
$('libSeg').onclick=e=>{const b=e.target.closest('button');if(b){APP.target=b.dataset.t;saveApp();apply();libClose();$('libBtn').focus()}};
$('libSeg').onkeydown=e=>{const bs=[...$('libSeg').querySelectorAll('button')],i=bs.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length].focus()}else if(e.key==='Escape'){libClose();$('libBtn').focus()}};
document.addEventListener('mousedown',e=>{if(!e.target.closest('.libdd'))libClose()});
// ---- control height fields (px, moving one unit per arrow press) ----
$('hfields').innerHTML=HK.map(k=>`<label class="hf"><span>${k}</span><span class="unitf"><input type="number" data-h="${k}" aria-label="${k} control height in px"><span>px</span></span></label>`).join('');
function renderHeights(){const u=unitOf(),hp=effHpx();
  $('hfields').querySelectorAll('input').forEach(x=>{const k=x.dataset.h;x.step=u;x.min=H_MIN*u;x.max=H_MAX*u;if(document.activeElement!==x)x.value=hp[k]});
  $('hOut').textContent=HK.map(k=>hp[k]).join(' · ')+'px';
  // which of Stylist's controls follow the heights (read-only)
  $('follow').innerHTML=[['Button','Follows'],['Input','Follows'],['Select','Follows'],['Segmented control','Follows'],['Toolbar button','Follows · md'],['Bar','md + 2 × inset'],
    ['Checkbox · radio','Own size',1],['Switch','Own size',1],['Tabs','Text + padding',1]].map(([n,v,o])=>`<div class="${o?'own':''}"><span>${n}</span><span>${v}</span></div>`).join('');
}
$('hfields').addEventListener('input',e=>{const x=e.target;if(!x.dataset.h)return;const v=parseFloat(x.value);if(!isFinite(v))return;
  S.h={...hOf(),[x.dataset.h]:Math.max(H_MIN,Math.min(H_MAX,Math.round(v/unitOf())))};apply()});
$('hfields').addEventListener('change',e=>{if(e.target.dataset.h)e.target.value=hPx()[e.target.dataset.h]});
// ---- letter spacing ----
function renderTrack(){const t=trackOf();document.querySelectorAll('[data-tr]').forEach(x=>{if(document.activeElement!==x)x.value=t[x.dataset.tr]});
  $('trOut').textContent=`${t.base}em`}
const trIn=document.querySelector('[data-tr="base"]');trIn.addEventListener('input',()=>{const v=parseFloat(trIn.value);if(!isFinite(v))return;S.track={base:qT(v)};apply()});
trIn.closest('.grp').addEventListener('change',e=>{const x=e.target;if(x.dataset&&x.dataset.tr)x.value=trackOf()[x.dataset.tr]});
// ---- focus ----
function renderFocus(){const f=effFocus();
  document.querySelectorAll('#fShape button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===f.shape));
  [['fW','w'],['fOff','off'],['fStr','str']].forEach(([id,k])=>{if(document.activeElement!==$(id))$(id).value=f[k]});
  $('fOut').textContent=`${f.shape} · ${f.w}px`;
  const col=derive(mode).focus,ring=f.shape==='ring'?`box-shadow:0 0 0 ${f.off}px #f3f4f6,0 0 0 ${f.off+f.w}px ${col}`:`outline:${f.w}px solid ${col};outline-offset:${f.off}px`;
  $('fdemo').innerHTML=`<span class="b" style="${ring}">Focused</span><span class="i" style="${ring}">Field</span>`}
$('fShape').onclick=e=>{const b=e.target.closest('button');if(b&&!b.disabled){S.focus={...focusOf(),shape:b.dataset.v};apply()}};
[['fW','w',1,6],['fOff','off',0,6],['fStr','str',10,100]].forEach(([id,k,lo,hi])=>{$(id).oninput=e=>{const v=Math.round(+e.target.value);if(!isFinite(v))return;S.focus={...focusOf(),[k]:Math.max(lo,Math.min(hi,v))};apply()};$(id).onchange=()=>{$(id).value=focusOf()[k]}});
// ---- alignment guides: one row of controls per size, dashed lines at that height ----
function renderHeightGuides(){const el=$('kHeights');if(!el)return;const hp=effHpx(),chev=iconSVG('chevron');
  const row=(k,inner,lab)=>`<div class="k-hcard"><div class="k-hrow" style="--ctl:var(--ctl-${k})">${inner}</div><div class="k-hlab">${lab}</div></div>`;
  const set=`<button class="k-btn pri">Save changes</button><button class="k-btn">Cancel</button><input class="k-input" placeholder="Search projects"><span class="k-sel"><select class="k-input"><option>Choose a plan</option></select>${chev}</span><div class="k-seg"><button aria-pressed="true">B</button><button aria-pressed="false">I</button><button aria-pressed="false">U</button></div>`;
  el.innerHTML=`<h3>Heights</h3><p>One height per size. Every control at that size uses it, so a button and a field next to each other always line up.</p>`+
    HK.map(k=>row(k,set,`${k} · ${hp[k]}px · ${LIBN[APP.target]}: ${lensText('h-'+k)}`)).join('')+
    `<h3 style="margin-top:14px">In a row</h3><p>A form row at md. The guides mark the md height, so a custom control that doesn’t fit shows at a glance. The field shows the focus style.</p>`+
    row('md',`<input class="k-input is-focus" placeholder="Project name"><span class="k-sel"><select class="k-input"><option>Choose a plan</option></select>${chev}</span><button class="k-btn pri">Create project</button>`,`Input · Select · Button · ${hp.md}px`)}
// ---- icons tab ----
const IC_GROUPS=[['Navigation',['home','menu','search','arrange','more']],['Actions',['plus','edit','trash','copy','download']],['Status',['ok','alert','info','error','loader']],['Files',['file','page','folder','folder-open','image']],['Arrows',['left','right','up','down','chevron']]];
$('icWeight').innerHTML=PH_W.map(w=>`<button data-v="${w}"><svg class="ic ic-fl" viewBox="0 0 256 256">${ICONS.phosphor[w].home}</svg>${w}</button>`).join('');
function renderIcons(){const ic=iconOf(),set=ICON_SETS[ic.set];
  document.querySelectorAll('#icSet button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===ic.set));
  document.querySelectorAll('#icWeight button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===ic.weight));
  document.querySelectorAll('[data-ic]').forEach(g=>{const k=g.dataset.ic;g.hidden=g.dataset.tab!==document.querySelector('#ptabs [aria-selected="true"]')?.dataset.tab||(k==='stroke'?ic.set==='phosphor':ic.set!=='phosphor')});
  if(document.activeElement!==$('icStroke'))$('icStroke').value=ic.stroke;
  $('icStrokeOut').textContent=ic.stroke+'px';
  $('icOut').textContent=ic.set==='phosphor'?ic.weight:`${ic.stroke}px`;
  $('icStrip').style.setProperty('--icon-stroke',ic.stroke);
  $('icStrip').innerHTML=IC_GROUPS.map(([g,rs])=>`<div><span>${g}</span>${rs.map(r=>iconSVG(r)).join('')}</div>`).join('');
  hydrateIcons(document.querySelector('main'))}
$('icSet').onclick=e=>{const b=e.target.closest('button');if(b){S.icons={...iconOf(),set:b.dataset.v};apply()}};
$('icWeight').onclick=e=>{const b=e.target.closest('button');if(b){S.icons={...iconOf(),weight:b.dataset.v};apply()}};
$('icStroke').oninput=e=>{S.icons={...iconOf(),stroke:+e.target.value};apply()};
// =================== Brand: the app's logo, mark and favicon (SVG). App data, not style: kept in APP, shipped in the package. ===================
const BR_SLOTS=[['logo','Logo','Full logo, for headers',['light','dark']],['favicon','Favicon','Browser tabs',['light','dark']]];
const brFile=(k,v)=>`${k}${v==='dark'?'-dark':''}.svg`;
const svgSrc=t=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(t); // shown through <img>, so scripts inside an SVG never run
const relLum=(r,g,b)=>{const f=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const lumOf=c=>{const h=colorHex(c);return relLum(parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16))};
const contrast=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
