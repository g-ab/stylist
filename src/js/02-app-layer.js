// ---- the app layer: tokens and components the app owns; Stylist reads them, edits aliases and pins, never component code ----
const SCHEMA=1;     // stylist.json format version
const FRAMEWORK=5;  // what Stylist can style. 1: colour, typeface, corners, density. 2: + container tint, shadows. 3: + control heights, focus. 4: + icon set. 5: + letter spacing. Bump when a property is added (e.g. shadows) and fill its default in migrate().
const RESERVED=['grid','grid-major','axis','pencil','fill','cut','clay']; // were Blueprint tokens inside the core; now they live in Blueprint's app layer
const BP_TOKENS={grid:{ref:'gray-3'},'grid-major':{ref:'gray-5'},axis:{ref:'gray-8'},pencil:{ref:'gray-10'},fill:{ref:'ink',pct:5},
  cut:{light:'#d9480f',dark:'#ff8a4c'},clay:{light:'#d6b19a',dark:'#a9806a'}};
const BP_COMPS=[
 {name:'Canvas view',html:'<div class="cv"><span class="vl">FRONT</span><svg viewBox="0 0 300 160"><path class="ax" d="M0 140H300M80 0V160"/><rect class="sel" x="40" y="35" width="110" height="105"/><circle class="hole" cx="95" cy="88" r="22"/><circle class="jt" cx="40" cy="35" r="3.5"/><circle class="jt" cx="150" cy="35" r="3.5"/><circle class="jt" cx="150" cy="140" r="3.5"/><circle class="jt" cx="40" cy="140" r="3.5"/><text class="dim" x="95" y="27" text-anchor="middle">110</text></svg></div>',
  css:'.cv{position:relative;height:180px;border-radius:var(--radius-lg);overflow:hidden;box-shadow:inset 0 0 0 1px var(--rule);background-color:var(--sheet);background-image:linear-gradient(var(--grid-major) 1px,transparent 1px),linear-gradient(90deg,var(--grid-major) 1px,transparent 1px),linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:50px 50px,50px 50px,10px 10px,10px 10px}.cv svg{position:absolute;inset:0;width:100%;height:100%;fill:none}.vl{position:absolute;top:8px;left:8px;z-index:1;font:600 11px var(--font-mono);letter-spacing:.08em;color:var(--muted);background:var(--sheet);padding:2px 7px;border-radius:var(--radius-md);box-shadow:0 0 0 1px var(--rule)}.ax{stroke:var(--axis)}.sel{fill:var(--fill-sel);stroke:var(--accent-line);stroke-width:1.5}.hole{stroke:var(--cut);stroke-width:1.5;stroke-dasharray:4 3}.jt{fill:var(--sheet);stroke:var(--accent-line);stroke-width:1.5}.dim{font:600 11px var(--font-mono);fill:var(--accent-text)}'},
 {name:'Sketch',html:'<div class="sk"><svg viewBox="0 0 200 120"><path class="shape" d="M50 100V25h70v75z"/><path class="stroke" d="M128 35c26 8 38 38 26 66"/></svg><small>Shape fill · pencil stroke</small></div>',
  css:'.sk{display:grid;gap:6px;justify-items:center;padding:12px;background:var(--sheet);border-radius:var(--radius-lg);box-shadow:inset 0 0 0 1px var(--rule)}.sk svg{width:100%;height:120px;fill:none}.shape{fill:var(--fill);stroke:var(--ink);stroke-width:1.5}.stroke{stroke:var(--pencil);stroke-width:1.5;stroke-linecap:round}small{font-size:12px;color:var(--muted)}'},
 {name:'3D model',html:'<div class="m3"><span class="tag">3D</span><svg viewBox="0 0 160 130"><path class="f2" d="M40 30l40-18 40 18v70l-40 18-40-18z"/><path class="f1" d="M40 30l40 18v70l-40-18z"/><path class="f3" d="M80 48l40-18v70l-40 18z"/></svg></div>',
  css:'.m3{position:relative;display:grid;place-items:center;height:150px;background:var(--paper);border-radius:var(--radius-lg)}.m3 svg{height:120px}.f1{fill:var(--clay)}.f2{fill:var(--clay);filter:brightness(.82)}.f3{fill:var(--clay);filter:brightness(1.1)}.tag{position:absolute;top:8px;left:8px;font:600 11px var(--font-mono);letter-spacing:.08em;color:var(--muted)}'},
 {name:'Title bar',html:'<div class="bb"><b class="bp-logo">Your app</b><span class="sep">/</span><span class="nm">Pitcher vase</span><i></i><span class="unit">MM</span></div>',
  css:'.bb{display:inline-flex;align-items:center;gap:8px;height:var(--bar);padding:0 12px;background:var(--sheet);border-radius:var(--radius-lg);box-shadow:0 0 0 1px var(--rule)}.bb b{font-weight:600}.sep{color:var(--rule)}.nm{color:var(--muted)}.bb i{width:6px;height:6px;border-radius:50%;background:var(--accent)}.unit{font:500 11px var(--font-mono);letter-spacing:.07em;color:var(--muted);border:1px solid var(--rule);border-radius:var(--radius-sm);padding:2px 6px}'}
];
const appDefault=()=>({brand:{},name:'Your app',target:'css',tokens:JSON.parse(JSON.stringify(BP_TOKENS)),components:JSON.parse(JSON.stringify(BP_COMPS)),
  pins:{light:{},dark:{}},changelog:[],review:[],reviewNote:'',snapshot:null,exported:null,source:'Built-in setup'});
let APP=appDefault();
try{const a=JSON.parse(localStorage.getItem('stylist.app.v1')||'null');if(a)APP={...APP,...a,pins:{light:{},dark:{},...(a.pins||{})}};if(APP.name==='Blueprint')APP.name='Your app';if(APP.brand&&APP.brand.mark){mergeMark(APP.brand);mergeMark(APP.brandBase)}}catch(e){}
if(APP.target==='tw')APP.target='css'; // Tailwind as a target was retired; files made for it open as Plain CSS
const saveApp=()=>{try{localStorage.setItem('stylist.app.v1',JSON.stringify(APP))}catch(e){toast('Too big to remember after a reload')}};
// names in each target: shadcn renames some core tokens; Stylist-only tokens get a stylist- prefix there
const SHAD={paper:'background',ink:'foreground',sheet:'card',muted:'muted-foreground',rule:'border',danger:'destructive',accent:'primary','on-accent':'primary-foreground',hover:'accent'};
const SHAD_BACK={...Object.fromEntries(Object.entries(SHAD).map(([k,v])=>[v,k])),radius:'radius-lg','font-sans':'font-ui','font-mono':'font-mono',tracking:'tracking',...Object.fromEntries(['tighter','tight','normal','wide','wider','widest'].map(k=>['tracking-'+k,'tracking-'+k]))};
const outName=(tg,n)=>tg==='shadcn'?(SHAD[n]||'stylist-'+n):tg==='radix'?rxOut(n):n;
// Radix Themes: Stylist's accent and support take over the nearest Radix colour names; grays override --gray-*
const RX={red:'red',orange:'orange',amber:'amber',yellow:'yellow',lime:'lime',green:'green',emerald:'jade',teal:'teal',cyan:'cyan',sky:'sky',blue:'blue',indigo:'indigo',violet:'violet',purple:'purple',fuchsia:'plum',pink:'pink',rose:'ruby'};
function radixNames(){const a=RX[S.fam]||'indigo';let p=RX[supFam()]||'iris';if(p===a)p=a==='iris'?'mint':'iris';return {a,s:p}}
const RX_LIGHT=':root, .light, .light-theme',RX_DARK='.dark, .dark-theme',RT='.radix-themes',RT_DARK='.dark .radix-themes, .dark-theme .radix-themes, .radix-themes.dark, .radix-themes.dark-theme';
const RX_BACK={'color-background':'paper','color-panel-solid':'sheet','accent-contrast':'on-accent','default-font-family':'font-ui','code-font-family':'font-mono','radius-factor':'radius-factor','radius-full':'radius-round','default-letter-spacing':'tracking'};
function rxOut(n){if(/^(gray|accent)-\d+$/.test(n))return n;const m=n.match(/^support-(\d+)$/);if(m)return radixNames().s+'-'+m[1];
  return {paper:'color-background',sheet:'color-panel-solid','on-accent':'accent-contrast'}[n]||'stylist-'+n}
const inName=(tg,v)=>tg==='shadcn'||tg==='radix'?(v.startsWith('stylist-')?v.slice(8):(tg==='shadcn'?SHAD_BACK:RX_BACK)[v]||null):v;
const pinKey=(tg,v)=>{const n=inName(tg,v);return (tg==='shadcn'||tg==='radix')&&!v.startsWith('stylist-')?'@'+tg+':'+v:n};
let BG={mode:'white',color:'#f3efe8'};try{const b=JSON.parse(localStorage.getItem('stylist.bg.v1')||'null');if(b)BG={...BG,...b}}catch(e){}
const saveBG=()=>{try{localStorage.setItem('stylist.bg.v1',JSON.stringify(BG))}catch(e){}};
function isDarkHex(h){const n=parseInt(h.slice(1),16),f=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(n>>16&255)+.7152*f(n>>8&255)+.0722*f(n&255)<.18}
try{const s=JSON.parse(localStorage.getItem('stylist.style.v1')||'null');if(s)S={...S,...s};}catch(e){}
if(S.round){S.radius=OLD_ROUND[S.round]??8;S.pill=false}delete S.round;if(S.unit==null)S.unit=(DENS[S.dens]||DENS.default).unit;if(!S.h)S.h={...(DENS[S.dens]||DENS.default).h};if(!S.focus)S.focus={...FOCUS_DEFAULT};if(!S.icons)S.icons={...ICON_DEFAULT};if(S.tint==null)S.tint=0;if(S.shStr==null)S.shStr=50;if(S.shSoft==null)S.shSoft=50;if(!S.motion)S.motion=JSON.parse(JSON.stringify(MOTION_DEFAULT));if(!S.sh)S.sh={...SH_DEFAULT,op:+(S.shStr*8/50).toFixed(1),blur:+(3*(.5+S.shSoft/100)).toFixed(1)}; // framework 2 defaults: white containers
if(!PRESETS.some(p=>p.id===S.id)||!S.ui)S={...PRESETS[0]};if(!S.sup)S.sup='analogous';if(!S.fam||!TW[S.fam])S.fam=nearestFam(S.hue??258);delete S.hue;delete S.supHue;delete S.font;
const $=id=>document.getElementById(id);
const ok=(l,c,h,a)=>`oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h}${a!=null?' / '+a:''})`;
function preset(){return PRESETS.find(p=>p.id===S.id)}
function colorsUntouched(){const p=preset();return p&&p.exact&&['fam','sat','warm'].every(k=>S[k]===p[k])}
// OKLCH -> relative luminance (sRGB, clipped), for the contrast guard
function Y(L,C,h){const a=C*Math.cos(h*Math.PI/180),b=C*Math.sin(h*Math.PI/180);
  const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
  const cl=v=>{v=Math.min(1,Math.max(0,v));const g=v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;const q=Math.min(1,Math.max(0,g));return q<=.04045?q/12.92:((q+.055)/1.055)**2.4};
  const r=cl(4.0767416621*l-3.3077115913*m+.2309699292*s),g=cl(-1.2684380046*l+2.6097574011*m-.3413193965*s),bb=cl(-.0041960863*l-.7034186147*m+1.707614701*s);
  return .2126*r+.7152*g+.0722*bb}
function cr(a,b){return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
