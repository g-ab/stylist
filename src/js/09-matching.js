// ---- matching a hand-edited value with Stylist's controls ----
function toOK(s){s=String(s).trim();let m=s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i);if(m){let L=+m[1];if(m[2])L/=100;return [L,+m[3],+m[4]]}
  let r,g,b;m=s.match(/^#([0-9a-f]{3,8})$/i);
  if(m){let h=m[1];if(h.length<6)h=[...h.slice(0,3)].map(c=>c+c).join('');r=parseInt(h.slice(0,2),16)/255;g=parseInt(h.slice(2,4),16)/255;b=parseInt(h.slice(4,6),16)/255}
  else{m=s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);if(!m)return null;r=m[1]/255;g=m[2]/255;b=m[3]/255}
  const lin=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;[r,g,b]=[r,g,b].map(lin);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),mm=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),ss=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const L=.2104542553*l+.793617785*mm-.0040720468*ss,A=1.9779984951*l-2.428592205*mm+.4505937099*ss,B=.0259040371*l+.7827717662*mm-.808675766*ss;
  return [L,Math.hypot(A,B),((Math.atan2(B,A)*180/Math.PI)+360)%360]}
const fname=v=>{const m=String(v).match(/^\s*["']?([^"',]+)["']?/);return m?m[1].trim():null};
const near=(obj,f,x)=>Object.entries(obj).reduce((a,[k,o])=>Math.abs(f(o)-x)<Math.abs(f(obj[a])-x)?k:a,Object.keys(obj)[0]);
const ABSORB={
  accent:v=>{const o=toOK(v);if(!o||o[1]<.02)return null;const f=nearestFam(o[2]);const sat=Math.round(Math.max(10,Math.min(100,o[1]/TW[f][6][1]*100)));S.fam=f;S.sat=sat;return `accent set to ${f}, ${sat}%`},
  support:v=>{const o=toOK(v);if(!o||o[1]<.02)return null;const f=nearestFam(o[2],S.fam);S.sup='custom';S.supFam=f;return `support set to ${f}`},
  'font-ui':v=>{const n=fname(v);if(!n)return null;S.ui=n;return `interface font set to ${n}`},
  'font-mono':v=>{const n=fname(v);if(!n)return null;S.mono=n;return `mono font set to ${n}`},
  spacing:v=>setU(v),'space-1':v=>setU(v),
  'icon-stroke':v=>{const x=parseFloat(v);if(!isFinite(x))return null;S.icons={...iconOf(),stroke:Math.max(1,Math.min(3,Math.round(x*4)/4))};return `icon stroke set to ${S.icons.stroke}`},
  ...Object.fromEntries(HK.map(k=>['control-'+k,v=>{const x=parseFloat(v);if(!isFinite(x))return null;S.h={...hOf(),[k]:Math.max(H_MIN,Math.min(H_MAX,Math.round(x/unitOf())))};return `${k} height set to ${S.h[k]*unitOf()}px`}])),
  'text-base':v=>{const k=near(DENS,o=>o.fs,parseFloat(v));S.dens=k;return `density set to ${DENS[k].name}`}};
const setU=v=>{const x=parseFloat(v)*(/rem/.test(v)?16:1);if(!isFinite(x))return null;S.unit=qUnit(x);return `spacing unit set to ${rem(S.unit)} (${pxs(S.unit)})`};
const setR=lg=>{S.radius=Math.max(0,Math.min(32,+lg.toFixed(1)));return `corners set to ${cornerName()}`};
for(const k in RSTEP)ABSORB['radius-'+k]=v=>{const x=parseFloat(v);return isFinite(x)?setR(x/RSTEP[k]):null};
const setT=k=>v=>{const x=parseFloat(v)*(/px/.test(v)?1/16:1);if(!isFinite(x))return null;S.track={base:qT(x-TRACK_DEFAULT[k])};return `tracking set to ${S.track.base}em`};
ABSORB.tracking=setT('base');for(const k of TK)ABSORB['tracking-'+k]=setT(k);
ABSORB['radius-round']=v=>{S.pill=parseFloat(v)>100;return `pill controls ${S.pill?'on':'off'}`};
ABSORB['radius-factor']=v=>{const x=parseFloat(v);return isFinite(x)?setR(x*8):null};
const absorbName=(tg,v)=>{const n=inName(tg,v);return n&&ABSORB[n]?n:null};
function logChange(r,action,note){APP.changelog.unshift({date:new Date().toISOString().slice(0,10),token:'--'+r.v,mode:r.mode,from:r.from??null,to:r.to??null,action,...(note?{note}:{}),...(r.why?{reason:r.why}:{})})}
function resolveReview(id,act){const r=APP.review.find(x=>x.id===id);if(!r)return;const tg=APP.target;let note='';
  const inp=document.querySelector(`[data-why="${id}"]`);r.why=inp&&inp.value.trim()||'';
  if(act==='pin'){APP.pins[r.mode][pinKey(tg,r.v)]=r.to;note='kept as a pinned value'}
  else if(act==='match'){const n=absorbName(tg,r.v),res=n&&ABSORB[n](r.to);if(!res){toast('Stylist’s controls can’t make that value. Pin it instead');return}
    note=res+' (closest match; pin it if it must be exact)'}
  else if(act==='move'){const twin=APP.review.find(x=>x!==r&&x.v===r.v&&x.kind==='added');
    APP.tokens[r.v]={light:r.mode==='light'?r.to:(twin?twin.to:r.to),dark:r.mode==='dark'?r.to:(twin?twin.to:r.to)};
    if(twin){logChange(twin,'moved to app tokens');APP.review=APP.review.filter(x=>x!==twin)}note='now an app token'}
  else if(act==='revert')note=r.kind==='added'?'discarded: Stylist doesn’t write it':'Stylist’s value comes back on the next export';
  else if(act==='restore')note='Stylist writes it again on the next export';
  logChange(r,act==='move'?'moved to app tokens':act==='match'?'matched':act==='pin'?'pinned':act==='restore'?'restored':'reverted',note);
  APP.review=APP.review.filter(x=>x!==r);saveApp();apply()}
// ---- usage ----
const KNAME={btn:'Button',field:'Field',input:'Input',sel:'Select',opt:'Option',check:'Checkbox',radio:'Radio',switch:'Switch',range:'Slider',tabs:'Tabs',seg:'Segmented',menu:'Menu',tip:'Tooltip',toast:'Toast',card:'Card',badge:'Badge',table:'Table',panel:'Panel',link:'Link',or:'Divider',list:'List',li:'List',lt:'List',th:'Thumbnail',mut:'Text',av:'Avatar',stats:'Stats',bars:'Chart',leg:'Chart',set:'Setting',val:'Setting',tl:'Timeline',empty:'Empty state',canvas:'Canvas',tag:'Tag',glz:'Swatch'};
let CU=null;
function coreUsage(){if(CU)return CU;CU={};for(const ss of document.styleSheets){let rules;try{rules=ss.cssRules}catch(e){continue}
  for(const r of rules){if(!r.selectorText)continue;const k=(r.selectorText.match(/\.k-([a-z]+)/)||[])[1];if(!k)continue;const nm=KNAME[k]||k;
    for(const v of r.style.cssText.matchAll(/var\(--([\w-]+)/g)){const t=PREVIEW_BACK[v[1]]||v[1];(CU[t]||(CU[t]=new Set)).add(nm)}}}return CU}
// height tokens (any library's) or Tailwind h-N classes = follows; raw px heights = fixed
function heightStatus(c){const css=c.css||'',html=c.html||'';
  if(/height\s*:\s*[^;}]*var\(--(control|ctl|bar|base-button-height|text-field-height|select-trigger-height|space-[5-8])/.test(css)||/class="[^"]*\bh-\d+\b/.test(html))return {f:1};
  const m=css.match(/(?:^|[;{\s])(?:min-)?height\s*:\s*(\d+(?:\.\d+)?px)/);const px=m?parseFloat(m[1]):0;return px>=16&&px<=64?{f:0,v:m[1]}:null} // only heights in the control range: panels and canvases are not controls
function compUses(c,tg){const s=new Set(c.tokens||[]);for(const v of (c.html+' '+c.css).matchAll(/var\(--([\w-]+)/g))s.add(inName(tg,v[1])||v[1]);return [...s]}
