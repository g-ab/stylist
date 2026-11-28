// ---- the app layer: tokens and components the app owns; Stylist reads them, edits aliases and pins, never component code ----
const SCHEMA=1;     // stylist.json format version
const FRAMEWORK=5;  // what Stylist can style. 1: colour, typeface, corners, density. 2: + container tint, shadows. 3: + control heights, focus. 4: + icon set. 5: + letter spacing. Bump when a property is added (e.g. shadows) and fill its default in migrate().
// Stylist's version: <format>.<framework>. Bump the second number with FRAMEWORK, and also when a token is renamed.
// Shown in the header and written into every app's files (stylist.json, the theme's header), so an upgrade knows where it starts.
const VERSION='1.5';
// what each framework added: an upgrade lists what's new since the app's version
const FRAMEWORK_NOTES={2:'container tint and shadows',3:'control heights and focus',4:'icon sets',5:'letter spacing and motion'};
// Tokens renamed over time, e.g. {since:'1.6',from:'sheet',to:'surface'} (Stylist's own names, no --).
// Exports keep each old name pointing to the new one, so app code written for an older version keeps working;
// export.py lists where the app's code still uses an old name. Remove an entry only in a new major version.
const TOKEN_RENAMES=[];
const RESERVED=['grid','grid-major','axis','pencil','fill','cut','clay']; // never core tokens: names an app may define in its own app tokens
// a fresh start: no app loaded yet, so no app tokens or components until one is opened (Open from GitHub, Open app style…)
const appDefault=()=>({brand:{},name:'Your app',target:'css',tokens:{},components:[],
  pins:{light:{},dark:{}},changelog:[],review:[],reviewNote:'',snapshot:null,exported:null,source:'No app loaded'});
let APP=appDefault();
try{const a=JSON.parse(localStorage.getItem('stylist.app.v1')||'null');if(a)APP={...APP,...a,pins:{light:{},dark:{},...(a.pins||{})}};if(APP.name==='Blueprint')APP.name='Your app';if(/^Built-in/.test(APP.source||'')){APP.tokens={};APP.components=[];APP.source='No app loaded'} /* the old built-in setup was Cast's: drop it unless an app was opened */if(APP.brand&&APP.brand.mark){mergeMark(APP.brand);mergeMark(APP.brandBase)}}catch(e){}
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
