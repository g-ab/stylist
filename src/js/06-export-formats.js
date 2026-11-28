// ---- export: one set of tokens, written for each destination ----
function tokens(){const d=DENS[S.dens];
  return {light:derive('light'),dark:derive('dark'),
    font:{ui:`"${S.ui}", system-ui, sans-serif`,mono:`"${S.mono}", ui-monospace, monospace`},
    radius:radiusScale(),nest:nestScale(),motion:motionTokens(),round:S.pill?'9999px':'0px',
    size:{bar:barOf(),control:hPx().md,inset:d.inset,gap:2*unitOf(),text:d.fs,'card-padding':stOf(S.dens).pad*unitOf()},unit:unitOf(),controls:hPx(),focus:focusOf(),icons:iconOf(),track:trackOf(),
    space:Object.fromEntries(SPACE.map(n=>[n,+(n*unitOf()).toFixed(2)])),
    type:[{name:'Title',size:d.fs,weight:600,sample:'Overview'},{name:'Heading',size:d.fs+1,weight:600,sample:'Save changes?'},{name:'Body',size:d.fs,weight:400,sample:'Sketch the shape in three views.'},{name:'Body strong',size:d.fs,weight:500,sample:'Spring campaign'},{name:'Small',size:d.fs-1,weight:400,sample:'Latest changes are not saved.'},{name:'Caption',size:d.fs-2,weight:400,sample:'Hidden depth for new pieces'},{name:'Label',size:11,weight:600,mono:true,upper:true,sample:'Front  W × H'},{name:'Number',size:12,weight:400,mono:true,sample:'100 × 105 × 60'}]}}
// The theme loads its own Google fonts, so changing a font in Stylist is all it takes: the app needs no font link of its own.
// Google's first CSS API skips weights a family doesn't have (css2 rejects the whole request), so one line fits every font.
const fontNote=()=>{const g=[S.ui,S.mono].filter((n,i,a)=>!custom[n]&&a.indexOf(n)===i);if(!g.length)return '';
  return `/* Fonts: ${g.join(', ')}, loaded from Google Fonts below. The app needs no font link of its own. */\n@import url("https://fonts.googleapis.com/css?family=${g.map(n=>n.replace(/ /g,'+')+':400,500,600').join('|')}&display=swap");\n`};
// shadcn uses Tailwind's 8 shadow sizes: Stylist's levels land on sm, lg and 2xl, the rest are filled in between
function shadcnShadows(c,M){const D=M==='dark',g=grayScale(D),at=e=>shadowAt(e,D,g);
  return {'shadow-2xs':at(.08),'shadow-xs':at(.15),'shadow-sm':c['shadow-raised'],shadow:at(.32),'shadow-md':at(.45),'shadow-lg':c['shadow-floating'],'shadow-xl':at(.8),'shadow-2xl':c['shadow-overlay'],'inset-shadow-sm':c['shadow-inset']}}
// PT = the target being written; pins are applied to every block of it
let PT=null;
function pinMap(o,role){if(!PT)return o;const r={...o},p=(APP.pins&&APP.pins[role])||{};
  for(const k in r){const v=(PT==='shadcn'||PT==='radix')&&!k.startsWith('stylist-')?p['@'+PT+':'+k]:p[inName(PT,k)];if(v!=null)r[k]=v}return r}
const block=(sel,o,role='light')=>`${sel} {\n${Object.entries(pinMap(o,role)).map(([k,v])=>`  --${k}: ${v};`).join('\n')}\n}`;
const appRefs=()=>[...new Set(Object.values(APP.tokens).map(d=>d.ref).filter(Boolean))];
function base(t){return {...Object.fromEntries(Object.entries(t.light)),'font-ui':t.font.ui,'font-mono':t.font.mono,
  ...Object.fromEntries(Object.entries(t.radius).map(([k,v])=>['radius-'+k,v+'px'])),'radius-round':t.round,...nestVars(t),
  ...Object.fromEntries(Object.entries(t.size).map(([k,v])=>[k==='text'?'text-base':k,v+'px'])),'radius-pill':'999px',
  ...Object.fromEntries(Object.entries(t.space).map(([k,v])=>['space-'+k,v+'px'])),...ctlFocus(t)}}
// control heights + focus, written the same way for CSS variables and Tailwind
const trackVars=t=>({tracking:emS(t.track.base),...Object.fromEntries(TK.map(k=>['tracking-'+k,emS(t.track[k])]))});
function ctlFocus(t){const f=t.focus;return {...(t.icons.set!=='phosphor'?{'icon-stroke':String(t.icons.stroke)}:{}),...trackVars(t),...Object.fromEntries(HK.map(k=>['control-'+k,t.controls[k]+'px'])),'focus-width':f.w+'px','focus-offset':f.off+'px',
  'focus-ring':f.shape==='ring'?'0 0 0 var(--focus-offset) var(--sheet), 0 0 0 calc(var(--focus-offset) + var(--focus-width)) var(--focus)':'0 0 #0000','focus-outline':f.shape==='outline'?'var(--focus-width) solid var(--focus)':'none'}}
// sRGB helpers for Radix: solid hex steps, and alpha steps that look the same over the background
function toRGB(v){const o=toOK(v);if(!o)return [0,0,0];const [L,C,H]=o,a=C*Math.cos(H*Math.PI/180),b=C*Math.sin(H*Math.PI/180);
  const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
  const g=v=>{v=Math.min(1,Math.max(0,v));return v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055};
  return [g(4.0767416621*l-3.3077115913*m+.2309699292*s),g(-1.2684380046*l+2.6097574011*m-.3413193965*s),g(-.0041960863*l-.7034186147*m+1.707614701*s)]}
const hx=c=>'#'+c.map(v=>Math.round(Math.min(1,Math.max(0,v))*255).toString(16).padStart(2,'0')).join('');
function alphaHex(t,b){let a=0;for(let i=0;i<3;i++){const d=t[i]-b[i];if(Math.abs(d)<1e-4)continue;a=Math.max(a,d>0?d/Math.max(1e-6,1-b[i]):-d/Math.max(1e-6,b[i]))}
  a=Math.min(1,Math.ceil(a*255)/255);if(a<=0)return hx(b)+'00';return hx(t.map((v,i)=>b[i]+(v-b[i])/a))+Math.round(a*255).toString(16).padStart(2,'0')}
function rxScale(c,name,src,M,contrast){const bg=toRGB(c['gray-1']),o={};
  for(let i=1;i<=12;i++)o[`${name}-${i}`]=hx(toRGB(c[src+'-'+i]));
  for(let i=1;i<=12;i++)o[`${name}-a${i}`]=alphaHex(toRGB(c[src+'-'+i]),bg);
  o[name+'-contrast']=contrast;o[name+'-surface']=hx(toRGB(c[src+'-'+(M==='dark'?3:2)]))+(M==='dark'?'80':'cc');
  o[name+'-indicator']=`var(--${name}-9)`;o[name+'-track']=`var(--${name}-9)`;return o}
function radixCSS(t){const {a,s:sp}=radixNames();
  const sc=(c,M)=>({...rxScale(c,a,'accent',M,c['on-accent']),...rxScale(c,sp,'support',M,c['on-support']),...rxScale(c,'gray','gray',M,'white')});
  // Radix's 6 shadows: 1 inset · 2–3 panels (raised) · 4–5 small overlays (floating) · 6 dialogs (overlay), each with Radix's hairline ring
  const sh=(c,M)=>{const D=M==='dark',g=grayScale(D),at=e=>shadowAt(e,D,g),ring=D?'var(--gray-a6)':'var(--gray-a3)',w=x=>x==='none'?`0 0 0 1px ${ring}`:`0 0 0 1px ${ring}, ${x}`;
    return {'shadow-1':c['shadow-inset']==='none'?'inset 0 0 0 1px var(--gray-a5)':`inset 0 0 0 1px var(--gray-a5), ${c['shadow-inset']}`,'shadow-2':w(at(.12)),'shadow-3':w(c['shadow-raised']),'shadow-4':w(at(.45)),'shadow-5':w(c['shadow-floating']),'shadow-6':w(c['shadow-overlay'])}};
  const ex=c=>Object.fromEntries(appRefs().filter(r=>rxOut(r).startsWith('stylist-')&&c[r]!=null).map(r=>['stylist-'+r,c[r]]));
  const thm=(c,M)=>({'focus-8':c.focus,'color-background':c.paper,'color-panel-solid':c.sheet,'color-surface':c.sheet,...sh(c,M),...ex(c)});
  const fixed={'default-font-family':t.font.ui,'heading-font-family':t.font.ui,'code-font-family':t.font.mono,
    ...(t.icons.set!=='phosphor'?{'icon-stroke':String(t.icons.stroke)}:{}),'radius-factor':+(t.radius.lg/8).toFixed(3),...Object.fromEntries(RX_SPACE.map((n,i)=>['space-'+(i+1),pxs(n*t.unit)])),'default-letter-spacing':emS(t.track.base),...Object.fromEntries(RX_LS.map((v,i)=>['letter-spacing-'+(i+1),emS(v+t.track.base)])),'radius-full':t.round,'radius-thumb':S.radius>=6||S.pill?'9999px':'0.5px'};
  return fontNote()+block(RX_LIGHT,sc(t.light,'light'))+'\n\n'+block(RX_DARK,sc(t.dark,'dark'),'dark')+'\n\n'+block(RT,{...fixed,...thm(t.light,'light')})+'\n\n'+block(RT_DARK,thm(t.dark,'dark'),'dark')}
const FMT={
  css:{note:'Plain CSS. Works anywhere: link the file and use var(--accent) and so on. Dark mode follows the system, or set data-theme="dark" on <html>. Letter spacing: put letter-spacing: var(--tracking) on body; --tracking-tight and the rest are for headings and labels. Nested corners: use --radius-bar, --radius-segmented and --radius-menu on a container whose items sit a few px inside it, so its corners run parallel to theirs.',
    out:t=>fontNote()+block(':root',base(t))+'\n\n'+`@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])',t.dark,'dark').replace(/^/gm,'  ')}\n}\n\n`+block(':root[data-theme="dark"]',t.dark,'dark')},
  tw:{note:'Tailwind v4. Paste into your main CSS after @import "tailwindcss". Gives classes like bg-sheet, text-ink, border-rule, rounded-lg, font-ui. Shadows: shadow-(--shadow-raised) and so on. --spacing is Stylist’s unit: Tailwind sizes (w-64, h-9) scale with it too. Dark mode uses the .dark class.',
    out:t=>{const names=Object.keys(t.light).filter(n=>!isShadow(n));
      const th=pinMap({'font-ui':t.font.ui,'font-mono':t.font.mono,...Object.fromEntries(Object.entries(t.radius).map(([k,v])=>['radius-'+k,v+'px'])),'radius-round':t.round,...nestVars(t),...ctlFocus(t)},'light');
      return fontNote()+'@import "tailwindcss";\n\n@custom-variant dark (&:where(.dark, .dark *));\n\n'+block(':root',t.light)+'\n\n'+block('.dark',t.dark,'dark')+'\n\n'+
      `@theme inline {\n${names.map(n=>`  --color-${n}: var(--${n});`).join('\n')}\n${Object.entries(th).map(([k,v])=>`  --${k}: ${v};`).join('\n')}\n  --spacing: ${rem(t.unit)};\n}`}},
  shadcn:{note:'shadcn/ui theme (Tailwind v4). Replace the :root and .dark blocks in globals.css. Your colours and shadows are mapped to shadcn’s names (shadow-2xs to shadow-2xl, inset-shadow-sm), so its components pick them up. The @theme inline block at the end writes Stylist’s exact radius sizes: keep it after shadcn’s own. Its --spacing is Stylist’s unit, so shadcn’s heights (h-9) and widths scale with it too. shadcn buttons stay rounded-md with Full: add rounded-full to them for pill controls. Letter spacing: the tracking-tighter…widest classes use Stylist’s scale; for the default, add tracking-(--tracking) to body in @layer base. Nested corners: shadcn writes these radii into its components, so swap rounded-md for rounded-(--radius-menu) on DropdownMenuContent and similar popovers, and for rounded-(--radius-segmented) on TabsList.',
    out:t=>{const m=(c,M)=>({background:c.paper,foreground:c.ink,card:c.sheet,'card-foreground':c.ink,popover:c.sheet,'popover-foreground':c.ink,primary:c.accent,'primary-foreground':c['on-accent'],secondary:c.paper,'secondary-foreground':c.ink,muted:c.paper,'muted-foreground':c.muted,accent:c.hover,'accent-foreground':c.ink,destructive:c.danger,border:c.rule,input:c.rule,ring:c.focus,'chart-1':c['accent-9'],'chart-2':c['support-9'],'chart-3':c['accent-7'],'chart-4':c['support-7'],'chart-5':c['gray-9'],...shadcnShadows(c,M)});
      // Stylist-only tokens that app tokens point to ride along with a stylist- prefix, so app-tokens.css can reference them
      const ex=c=>Object.fromEntries(appRefs().filter(r=>!SHAD[r]&&c[r]!=null).map(r=>['stylist-'+r,c[r]]));
      return fontNote()+block(':root',{radius:t.radius.lg+'px',...m(t.light,'light'),'font-sans':t.font.ui,'font-mono':t.font.mono,...(t.icons.set!=='phosphor'?{'icon-stroke':String(t.icons.stroke)}:{}),tracking:emS(t.track.base),...ex(t.light)})+'\n\n'+block('.dark',{...m(t.dark,'dark'),...ex(t.dark)},'dark')+'\n\n'+block('@theme inline',{...Object.fromEntries(Object.entries(t.radius).map(([k,v])=>['radius-'+k,v+'px'])),...nestVars(t),spacing:rem(t.unit),...Object.fromEntries(TK.map(k=>['tracking-'+k,emS(t.track[k])]))})}},
  radix:{get note(){const {a,s:p}=radixNames();return `Radix Themes. Load after @radix-ui/themes/styles.css and use <Theme accentColor="${a}" grayColor="gray">. Stylist rewrites the ${a}, ${p} and gray scales (with alpha steps), backgrounds, fonts, shadows 1–6, space 1–9, letter spacing (the default and each text size’s step, shifted by Stylist’s Tracking) and the radius factor, so the Theme's radius prop no longer matters. Dark mode: Radix's .dark / .dark-theme classes. Nested corners: Radix works them out itself from the radius factor, so Stylist’s nested radii aren’t written here.`},
    out:t=>radixCSS(t)},
  json:{note:'JSON with light and dark values side by side, for Figma variables or any other tool. App tokens are listed under "app".',
    out:t=>JSON.stringify({color:Object.fromEntries(Object.keys(t.light).filter(k=>!isShadow(k)).map(k=>[k,{light:t.light[k],dark:t.dark[k]}])),font:t.font,radius:t.radius,radiusNested:t.nest,motion:t.motion,size:t.size,controls:t.controls,focus:t.focus,icons:t.icons,tracking:t.track,shadow:Object.fromEntries(Object.keys(t.light).filter(isShadow).map(k=>[k.slice(7),{light:t.light[k],dark:t.dark[k]}])),
      app:Object.fromEntries(Object.entries(APP.tokens).map(([n,d])=>[n,{light:resolveApp(d,'light',t.light),dark:resolveApp(d,'dark',t.dark)}]))},null,2)}
};
let fmt='css';
function renderExport(){$('xcode').textContent=fmt==='json'?FMT.json.out(tokens()):coreCSS(fmt)+'\n\n'+appCSS(fmt);$('xnote').textContent=FMT[fmt].note+(fmt==='json'?'':' The app tokens follow at the end (app-tokens.css in the package).');
  $('xfmt').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===fmt))}
$('export').onclick=()=>{renderExport();$('xmod').hidden=false};
$('xfmt').onclick=e=>{const b=e.target.closest('button');if(b){fmt=b.dataset.f;renderExport()}};
const closeX=()=>$('xmod').hidden=true;
$('xClose').onclick=closeX;$('xmod').onclick=e=>{if(e.target===$('xmod'))closeX()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('xmod').hidden)closeX()});
$('xCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('xcode').textContent);toast('Copied')}catch(e){const r=document.createRange();r.selectNodeContents($('xcode'));const g=getSelection();g.removeAllRanges();g.addRange(r);toast('Selected. Copy it with ⌘C')}};
