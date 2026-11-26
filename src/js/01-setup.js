
// Icons: Stylist's preview roles drawn in Lucide (ISC), Tabler (MIT) or Phosphor (MIT). Baked in from npm (lucide-static 1.77, @tabler/icons 3.52, @phosphor-icons/core 2.1); the artifact can't load them at runtime.
const ICONS=JSON.parse(document.getElementById('iconData').textContent);
const ICON_SETS={lucide:{name:'Lucide',pkg:'lucide-react',lic:'ISC',vb:24},tabler:{name:'Tabler',pkg:'@tabler/icons-react',lic:'MIT',vb:24},phosphor:{name:'Phosphor',pkg:'@phosphor-icons/react',lic:'MIT',vb:256}};
const PH_W=['thin','light','regular','bold','fill','duotone'];
// letter spacing, in em. Tracking = all text; the scale = Tailwind's tracking-* steps (same defaults)
const TK=['tighter','tight','normal','wide','wider','widest'],TRACK_DEFAULT={base:0,tighter:-0.05,tight:-0.025,normal:0,wide:0.025,wider:0.05,widest:0.1}; // scale = these + Tracking
const RX_LS=[0.0025,0,0,-0.0025,-0.005,-0.00625,-0.0075,-0.01,-0.025]; // Radix's --letter-spacing-1…9 (3.3.0)
const qT=v=>Math.max(-0.2,Math.min(0.5,Math.round(v*1000)/1000)),emS=v=>`${+(+v).toFixed(5)}em`;
function trackOf(){const t=S.track||{},b=isFinite(+t.base)&&t.base!==''&&t.base!=null?qT(+t.base):0;return {base:b,...Object.fromEntries(TK.map(k=>[k,+(TRACK_DEFAULT[k]+b).toFixed(4)]))}} // one control: the scale follows Tracking
const ICON_DEFAULT={set:'lucide',stroke:2,weight:'regular'}; // Tabler is outline only: filled icons are a per-case design choice, made in code
const GF={
 Sans:['Inter','IBM Plex Sans','Geist','DM Sans','Instrument Sans','Manrope','Space Grotesk','Figtree','Plus Jakarta Sans','Outfit','Onest','Hanken Grotesk','Schibsted Grotesk','Host Grotesk','Funnel Sans','Albert Sans','Public Sans','Work Sans','Karla','Mulish','Rubik','Roboto','Open Sans','Lato','Noto Sans','Source Sans 3','Nunito Sans','Nunito','Montserrat','Poppins','Raleway','Lexend','Sora','Urbanist','Red Hat Text','Red Hat Display','Be Vietnam Pro','Archivo','Barlow','Fira Sans','PT Sans','Ubuntu','Cabin','Heebo','Kumbh Sans','Epilogue','Familjen Grotesk','Golos Text','Inclusive Sans','Atkinson Hyperlegible','Readex Pro','Wix Madefor Text','Chivo','Overpass','Commissioner','Jost','Libre Franklin','Hind','Mukta','Asap','Encode Sans','Titillium Web','Exo 2','Josefin Sans','Quicksand','Bricolage Grotesque','Syne','Unbounded','Questrial','Gantari','Afacad'],
 Serif:['Fraunces','Newsreader','Source Serif 4','Instrument Serif','Literata','Lora','Merriweather','IBM Plex Serif','EB Garamond','Cormorant Garamond','Libre Baskerville','Crimson Pro','Spectral','Young Serif','Playfair Display','DM Serif Display','Bitter','Roboto Slab','Zilla Slab','Gelasio'],
 Mono:['IBM Plex Mono','JetBrains Mono','Geist Mono','DM Mono','Space Mono','Roboto Mono','Source Code Pro','Fira Code','Fira Mono','Inconsolata','Red Hat Mono','Martian Mono','Azeret Mono','Spline Sans Mono','Sometype Mono','Chivo Mono','Kode Mono','Victor Mono','Overpass Mono','Noto Sans Mono','Reddit Mono','Atkinson Hyperlegible Mono','Ubuntu Mono','Cousine','Anonymous Pro','Courier Prime','Share Tech Mono','Xanh Mono']
};
// Fonts load on demand: previews fetch only the letters of their own name.
const loaded=new Set(),CUST='stylist.fonts.v1';
let custom={};try{custom=JSON.parse(localStorage.getItem(CUST)||'{}')}catch(e){}
function addCSS(href,fail){const l=document.createElement('link');l.rel='stylesheet';l.href=href;if(fail)l.onerror=()=>{l.remove();fail()};document.head.appendChild(l)}
function loadFont(name,previewOnly){
  if(custom[name]){if(!loaded.has(name)){loaded.add(name);try{const f=new FontFace(name,`url(${custom[name]})`);f.load().then(x=>document.fonts.add(x)).catch(()=>toast('That font file could not be read'))}catch(e){}}return}
  const q=encodeURIComponent(name).replace(/%20/g,'+'),base='https://fonts.googleapis.com/css2?family=';
  if(previewOnly){if(loaded.has(name)||loaded.has('p:'+name))return;loaded.add('p:'+name);addCSS(`${base}${q}&text=${encodeURIComponent(name)}&display=swap`);return}
  if(loaded.has(name))return;loaded.add(name);
  addCSS(`${base}${q}:wght@400;500;600&display=swap`,()=>addCSS(`${base}${q}:wght@400;700&display=swap`,()=>addCSS(`${base}${q}&display=swap`,()=>toast(`Couldn’t load “${name}” from Google Fonts`))));
}
const fam=n=>`"${n}"`;
// Corners: one choice (the lg size) sets the whole scale. The steps keep Radix's proportions (3·4·6·8·12·16 px at factor 1),
// so Radix gets an exact radius factor, and shadcn/Tailwind get the same sizes written out. Full = XL plus pill-shaped controls.
const CORNERS=[{name:'None',r:0},{name:'XS',r:2},{name:'S',r:4},{name:'M',r:6},{name:'L',r:8},{name:'XL',r:12},{name:'2XL',r:16},{name:'Full',r:12,pill:true}];
const RSTEP={xs:.375,sm:.5,md:.75,lg:1,xl:1.5,'2xl':2};
const OLD_ROUND={sharp:4,soft:8,round:12};
// Nested radius: something sitting close inside a container (inset ≤ 8px) gets corners parallel to its own: outer = inner + inset + border.
// Pill inside → pill outside. Cards and dialogs (big padding) keep their scale step: the rule would make them bloated.
const NEST={bar:{inner:'lg',inset:()=>DENS[S.dens].inset,border:0,pill:true,label:'bar · lg + inset'},segmented:{inner:'md',inset:()=>2,border:1,pill:true,label:'segmented · md + 2 + 1px border'},menu:{inner:'md',inset:()=>4,border:1,pill:false,label:'menu · md + 4 + 1px border'}};
function nestScale(){const r=radiusScale(),o={};for(const k in NEST){const n=NEST[k];o[k]=S.pill&&n.pill?9999:+(r[n.inner]+n.inset()+n.border).toFixed(2)}return o}
const nestVars=t=>Object.fromEntries(Object.entries(t.nest).map(([k,v])=>['radius-'+k,v>=9999?'9999px':v+'px']));
// =================== Motion: three spring speeds + quicker tween exits. Independent of Style. ===================
// Defaults follow Fluid Functionalism: fast 80ms, moderate 160ms (both critically damped), slow 240ms with 12% bounce; exits 75% of the enter time.
const MOTION_DEFAULT={fast:{d:80,b:0},moderate:{d:160,b:0},slow:{d:240,b:12},exit:75,reduced:'fade'};
const MK=['fast','moderate','slow'],MJOB={fast:'Hover, focus, tooltips',moderate:'Tabs, switches, dropdowns',slow:'Dialogs, side panels'};
const motionOf=()=>{const m=S.motion||{};return {...MOTION_DEFAULT,...m,...Object.fromEntries(MK.map(k=>[k,{...MOTION_DEFAULT[k],...(m[k]||{})}]))}};
// a spring that settles within d ms: damping ratio = 1 − bounce, sampled into a CSS linear() curve so no JS library is needed
function springX(d,b){const z=Math.max(.05,1-b/100),w=b>0?4.6/(z*d):6.64/d,wd=w*Math.sqrt(Math.max(0,1-z*z));
  return t=>z>=1?1-(1+w*t)*Math.exp(-w*t):1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z*w/wd*Math.sin(wd*t))}
function springEase(d,b){if(d<=0)return 'linear';const x=springX(d,b),N=b>0?32:20,pts=[];for(let i=0;i<=N;i++)pts.push(i===N?1:+x(d*i/N).toFixed(4));return 'linear('+pts.join(', ')+')'}
const EXIT_EASE='cubic-bezier(.4, 0, 1, 1)';
function motionTokens(){const m=motionOf(),o={reduced:m.reduced,exitRatio:m.exit/100,exitEase:EXIT_EASE};
  for(const k of MK){const v=m[k];o[k]={duration:v.d,bounce:v.b,ease:springEase(v.d,v.b),exit:Math.round(v.d*m.exit/100)}}return o}
function motionVars(t){const o={};for(const k of MK){o['motion-'+k]=t.motion[k].duration+'ms';o['ease-'+k]=t.motion[k].ease;o['motion-'+k+'-exit']=t.motion[k].exit+'ms'}o['ease-exit']=t.motion.exitEase;o['motion-move']='1';return o}
function motionReduced(t){const o={'motion-move':'0'};for(const k of MK){o['ease-'+k]='ease-out';if(t.motion.reduced==='none'){o['motion-'+k]='0ms';o['motion-'+k+'-exit']='0ms'}}return o}
function motionCSS(t,tg){const ser=o=>Object.entries(o).map(([k,v])=>`  --${k}: ${v};`).join('\n');
  return `\n\n/* Motion · springs as CSS easing curves. Enter: transition: transform var(--motion-moderate) var(--ease-moderate). Exit: var(--motion-moderate-exit) var(--ease-exit).\n   Multiply movement by --motion-move (e.g. translate: 0 calc(8px * var(--motion-move))): it drops to 0 when the user asks for reduced motion${t.motion.reduced==='none'?', and durations drop to 0':', and fades stay'}. */\n:root {\n${ser(motionVars(t))}\n}\n@media (prefers-reduced-motion: reduce) {\n  :root {\n${ser(motionReduced(t)).replace(/^/gm,'  ')}\n  }\n}`}
function radiusScale(){const o={};for(const k in RSTEP)o[k]=+(S.radius*RSTEP[k]).toFixed(2);return o}
const cornerName=()=>{const c=CORNERS.find(c=>c.r===S.radius&&!!c.pill===!!S.pill);return c?c.name:`${S.radius}px${S.pill?' + pill controls':''}`};
// Styles: each sets heights, text size, unit, inset, card padding (in units), corners and a typeface. Colours stay with the colour theme.
// Soft and Dense take shadcn's Maia and Mira values (heights, text, card padding; corners rounded to Stylist's scale). compact/roomy: older saves only.
const DENS={default:{name:'Stylist',desc:'Today’s look',inset:4,unit:4,fs:14,h:{xs:6,sm:7,md:9,lg:11},pad:5,radius:8,pill:false,ui:'Schibsted Grotesk'},
 soft:{name:'Soft',desc:'Rounded, generous spacing',inset:5,unit:4,fs:14,h:{xs:6,sm:8,md:9,lg:10},pad:6,radius:12,pill:true,ui:'Schibsted Grotesk'},
 dense:{name:'Dense',desc:'Compact, for dense screens',inset:3,unit:4,fs:12,h:{xs:5,sm:6,md:7,lg:8},pad:4,radius:8,pill:false,ui:'Schibsted Grotesk'},
 compact:{legacy:1,name:'Compact',inset:4,unit:3,fs:13,h:{xs:7,sm:8,md:10,lg:12}},roomy:{legacy:1,name:'Roomy',inset:5,unit:5,fs:15,h:{xs:6,sm:7,md:8,lg:10}}};
const stOf=k=>{const d=DENS[k]||DENS.default;return {...d,pad:d.pad??5,radius:d.radius??8,pill:!!d.pill,ui:d.ui||'Schibsted Grotesk'}};
// Control heights: four sizes, each a whole multiple of the spacing unit (so Tailwind/shadcn h-N classes land exactly). Bar = md + 2 × inset.
const HK=['xs','sm','md','lg'],H_MIN=3,H_MAX=24;
const hOf=()=>({...DENS[S.dens].h,...(S.h||{})}), hPx=()=>{const u=unitOf(),h=hOf();return Object.fromEntries(HK.map(k=>[k,h[k]*u]))};
const barOf=()=>hPx().md+2*DENS[S.dens].inset, presetBar=d=>d.h.md*d.unit+2*d.inset;
// Focus: Stylist's own terms; libraries that fix part of it get those controls greyed out (see LENS_OFF)
const FOCUS_DEFAULT={shape:'ring',w:2,off:2,str:100};
const focusOf=()=>({...FOCUS_DEFAULT,...(S.focus||{})});
const iconOf=()=>({...ICON_DEFAULT,...(S.icons||{})}), iconStroked=()=>iconOf().set!=='phosphor';
function iconBody(role){const ic=iconOf();
  if(ic.set==='phosphor')return [ICONS.phosphor[ic.weight][role],'fl',256];
  if(ic.set==='tabler')return [ICONS.tabler.outline[role],'st',24];
  return [ICONS.lucide[role],'st',24]}
function iconSVG(role,attrs=''){const [b,m,vb]=iconBody(role);return `<svg class="ic ic-${m}" data-i="${role}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true"${attrs}>${b||''}</svg>`}
function hydrateIcons(root){(root||document).querySelectorAll('svg.ic[data-i]').forEach(el=>{const [b,m,vb]=iconBody(el.dataset.i);
  el.setAttribute('viewBox',`0 0 ${vb} ${vb}`);el.classList.toggle('ic-st',m==='st');el.classList.toggle('ic-fl',m==='fl');el.innerHTML=b||''})}
// What the chosen library actually draws where it fixes a value. Shown in greyed controls and the preview; Stylist's own values stay saved.
const RX_H=[6,8,10,12]; // Radix sizes 1–4 = --space-5…8 = these multiples of the unit
const LIB_FOCUS={shadcn:{shape:'ring',w:3,off:0},radix:{shape:'outline',w:2,off:2}};
const effFocus=()=>({...focusOf(),...(LIB_FOCUS[APP.target]||{})});
const effHpx=()=>APP.target==='radix'?Object.fromEntries(HK.map((k,i)=>[k,RX_H[i]*unitOf()])):hPx();
const effBar=()=>effHpx().md+2*DENS[S.dens].inset;
// Spacing: one base unit (px, whole pixels) × a fixed scale. A density preset sets heights, text and the unit; editing the unit makes it Custom.
const SPACE=[1,2,3,4,6,8,12,16],RX_SPACE=[1,2,3,4,6,8,10,12,16],UNIT_MIN=2,UNIT_MAX=12;
const unitOf=()=>S.unit??DENS[S.dens].unit, densCustom=()=>unitOf()!==DENS[S.dens].unit||HK.some(k=>hOf()[k]!==DENS[S.dens].h[k]);
const rem=px=>+(px/16).toFixed(4)+'rem';
// the unit is whole pixels: arrow keys step 0.125rem (2px), typed values round to the nearest pixel
const qUnit=px=>Math.max(UNIT_MIN,Math.min(UNIT_MAX,Math.round(px))), pxs=v=>+v.toFixed(2)+'px';
// The app's colours today, kept exact for the Current preset.
const CURRENT={
 light:{paper:'#eceff3',sheet:'#fbfcfd',ink:'#1a2b3c',muted:'#5f6d7c',rule:'#d5dce4',grid:'#e7ecf1','grid-major':'#d0d8e1',axis:'#9aa8b7',accent:'#0b5fd0','accent-strong':'#084aa3','on-accent':'#ffffff',pencil:'#6f757d',fill:'rgba(26,43,60,.05)','fill-sel':'rgba(11,95,208,.10)',hover:'rgba(26,43,60,.06)',danger:'#b4400f',cut:'#d9480f',clay:'#d6b19a'},
 dark:{paper:'#0d131b',sheet:'#121a24',ink:'#dce6f1',muted:'#8d9bab',rule:'#243243',grid:'#18222e','grid-major':'#223042',axis:'#3e5068',accent:'#5ea3ff','accent-strong':'#86baff','on-accent':'#06182f',pencil:'#a3adb8',fill:'rgba(220,230,241,.05)','fill-sel':'rgba(94,163,255,.14)',hover:'rgba(220,230,241,.07)',danger:'#f08a5d',cut:'#ff8a4c',clay:'#a9806a'}
};
const TW={"red":[[0.971,0.013,17.4],[0.936,0.032,17.7],[0.885,0.062,18.3],[0.808,0.114,19.6],[0.704,0.191,22.2],[0.637,0.237,25.3],[0.577,0.245,27.3],[0.505,0.213,27.5],[0.444,0.177,26.9],[0.396,0.141,25.7],[0.258,0.092,26.0]],"orange":[[0.98,0.016,73.7],[0.954,0.038,75.2],[0.901,0.076,70.7],[0.837,0.128,66.3],[0.75,0.183,55.9],[0.705,0.213,47.6],[0.646,0.222,41.1],[0.553,0.195,38.4],[0.47,0.157,37.3],[0.408,0.123,38.2],[0.266,0.079,36.3]],"amber":[[0.987,0.022,95.3],[0.962,0.059,95.6],[0.924,0.12,95.7],[0.879,0.169,91.6],[0.828,0.189,84.4],[0.769,0.188,70.1],[0.666,0.179,58.3],[0.555,0.163,49.0],[0.473,0.137,46.2],[0.414,0.112,45.9],[0.279,0.077,45.6]],"yellow":[[0.987,0.026,102.2],[0.973,0.071,103.2],[0.945,0.129,101.5],[0.905,0.182,98.1],[0.852,0.199,91.9],[0.795,0.184,86.0],[0.681,0.162,75.8],[0.554,0.135,66.4],[0.476,0.114,61.9],[0.421,0.095,57.7],[0.286,0.066,53.8]],"lime":[[0.986,0.031,120.8],[0.967,0.067,122.3],[0.938,0.127,124.3],[0.897,0.196,126.7],[0.841,0.238,128.8],[0.768,0.233,130.8],[0.648,0.2,131.7],[0.532,0.157,131.6],[0.453,0.124,130.9],[0.405,0.101,131.1],[0.274,0.072,132.1]],"green":[[0.982,0.018,155.8],[0.962,0.044,156.7],[0.925,0.084,156.0],[0.871,0.15,154.4],[0.792,0.209,151.7],[0.723,0.219,149.6],[0.627,0.194,149.2],[0.527,0.154,150.1],[0.448,0.119,151.3],[0.393,0.095,152.5],[0.266,0.065,152.9]],"emerald":[[0.979,0.021,166.1],[0.95,0.052,163.1],[0.905,0.093,164.2],[0.845,0.143,165.0],[0.765,0.177,163.2],[0.696,0.17,162.5],[0.596,0.145,163.2],[0.508,0.118,165.6],[0.432,0.095,166.9],[0.378,0.077,168.9],[0.262,0.051,172.6]],"teal":[[0.984,0.014,180.7],[0.953,0.051,180.8],[0.91,0.096,180.4],[0.855,0.138,181.1],[0.777,0.152,181.9],[0.704,0.14,182.5],[0.6,0.118,184.7],[0.511,0.096,186.4],[0.437,0.078,188.2],[0.386,0.063,188.4],[0.277,0.046,192.5]],"cyan":[[0.984,0.019,200.9],[0.956,0.045,203.4],[0.917,0.08,205.0],[0.865,0.127,207.1],[0.789,0.154,211.5],[0.715,0.143,215.2],[0.609,0.126,221.7],[0.52,0.105,223.1],[0.45,0.085,224.3],[0.398,0.07,227.4],[0.302,0.056,229.7]],"sky":[[0.977,0.013,236.6],[0.951,0.026,236.8],[0.901,0.058,230.9],[0.828,0.111,230.3],[0.746,0.16,232.7],[0.685,0.169,237.3],[0.588,0.158,242.0],[0.5,0.134,242.7],[0.443,0.11,240.8],[0.391,0.09,240.9],[0.293,0.066,243.2]],"blue":[[0.97,0.014,254.6],[0.932,0.032,255.6],[0.882,0.059,254.1],[0.809,0.105,251.8],[0.707,0.165,254.6],[0.623,0.214,259.8],[0.546,0.245,262.9],[0.488,0.243,264.4],[0.424,0.199,265.6],[0.379,0.146,265.5],[0.282,0.091,267.9]],"indigo":[[0.962,0.018,272.3],[0.93,0.034,272.8],[0.87,0.065,274.0],[0.785,0.115,274.7],[0.673,0.182,276.9],[0.585,0.233,277.1],[0.511,0.262,277.0],[0.457,0.24,277.0],[0.398,0.195,277.4],[0.359,0.144,278.7],[0.257,0.09,281.3]],"violet":[[0.969,0.016,293.8],[0.943,0.029,294.6],[0.894,0.057,293.3],[0.811,0.111,293.6],[0.702,0.183,293.5],[0.606,0.25,292.7],[0.541,0.281,293.0],[0.491,0.27,292.6],[0.432,0.232,292.8],[0.38,0.189,293.7],[0.283,0.141,291.1]],"purple":[[0.977,0.014,308.3],[0.946,0.033,307.2],[0.902,0.063,306.7],[0.827,0.119,306.4],[0.714,0.203,305.5],[0.627,0.265,303.9],[0.558,0.288,302.3],[0.496,0.265,301.9],[0.438,0.218,303.7],[0.381,0.176,305.0],[0.291,0.149,302.7]],"fuchsia":[[0.977,0.017,320.1],[0.952,0.037,318.9],[0.903,0.076,319.6],[0.833,0.145,321.4],[0.74,0.238,322.2],[0.667,0.295,322.1],[0.591,0.293,322.9],[0.518,0.253,323.9],[0.452,0.211,324.6],[0.401,0.17,325.6],[0.293,0.136,325.7]],"pink":[[0.971,0.014,343.2],[0.948,0.028,342.3],[0.899,0.061,343.2],[0.823,0.12,346.0],[0.718,0.202,349.8],[0.656,0.241,354.3],[0.592,0.249,0.6],[0.525,0.223,4.0],[0.459,0.187,3.8],[0.408,0.153,2.4],[0.284,0.109,3.9]],"rose":[[0.969,0.015,12.4],[0.941,0.03,12.6],[0.892,0.058,10.0],[0.81,0.117,11.6],[0.712,0.194,13.4],[0.645,0.246,16.4],[0.586,0.253,17.6],[0.514,0.222,16.9],[0.455,0.188,13.7],[0.41,0.159,10.3],[0.271,0.105,12.1]]};
const FAMS=Object.keys(TW);
// Accent and support come from real Tailwind v4 palettes (tailwindcss 4.3); each Radix step takes a Tailwind step.
const twx=x=>ok(x[0],x[1],x[2]), Yx=x=>Y(x[0],x[1],x[2]), mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const accHue=()=>TW[S.fam][5][2];
function nearestFam(h,ex){let best,bd=1e9;for(const f of FAMS){if(f===ex)continue;const d=Math.abs(((TW[f][5][2]-h+540)%360)-180);if(d<bd){bd=d;best=f}}return best}
function supFam(){return S.sup==='custom'&&S.supFam?S.supFam:nearestFam((accHue()+(SUP[S.sup]||SUP.analogous).off)%360,S.fam)}
const SRC={};
function solidOf(f){const sv={...S};S={...S,sat:100};const v=hueScale(f,false,grayScale(false)).css[8];S=sv;return v}
function hueScale(fam,D,g){
  const k=S.sat/100,T=i=>{const [L,C,H]=TW[fam][i];return [L,C*k,H]},H=TW[fam][5][2];
  const pass=(x,ys)=>ys.every(y=>cr(Yx(x),y)>=4.5);
  let st,src,on;
  if(!D){
    st=[mixc([1,0,H],T(0),.5),T(0),T(1),mixc(T(1),T(2),.5),T(2),T(3),mixc(T(3),T(4),.5),T(4),0,0,0,T(9)];
    src=['50·white','50','100','100·200','200','300','300·400','400','','','','900'];
    // bright families (yellow, amber, lime) get dark text on 400, like Tailwind's own examples; the rest white on 600, or 700 if 600 is too light
    const bright=TW[fam][5][0]>=.76&&pass(T(4),[Yx(T(10))])&&pass(T(3),[Yx(T(10))]);
    if(bright){st[8]=T(4);st[9]=T(3);src[8]='400';src[9]='300';on=twx(T(10))}
    else if(pass(T(6),[1])&&pass(T(7),[1])){st[8]=T(6);st[9]=T(7);src[8]='600';src[9]='700';on='#ffffff'}
    else{st[8]=T(7);st[9]=T(8);src[8]='700';src[9]='800';on='#ffffff'}
    const bg=[g.Y[0],g.Y[1],Yx(st[2])];const ti=[7,8,9].find(i=>pass(T(i),bg))??9;st[10]=T(ti);src[10]=['50','100','200','300','400','500','600','700','800','900'][ti];
  }else{
    const g1=[g.L[0],g.C*GCF[0],H];
    st=[mixc(g1,T(10),.3),mixc(g1,T(10),.55),T(10),T(9),mixc(T(9),T(8),.5),T(8),T(7),T(6),0,0,0,T(1)];
    src=['950·dim','950·dim','950','900','900·800','800','700','600','','','','100'];
    const dk=Yx(T(10));
    if(pass(T(4),[dk])){st[8]=T(4);st[9]=T(3);src[8]='400';src[9]='300'}
    else{st[8]=T(3);st[9]=T(2);src[8]='300';src[9]='200'}
    on=twx(T(10));
    const bg=[g.Y[0],g.Y[1],Yx(st[2])];const ti=[3,2,1].find(i=>pass(T(i),bg))??1;st[10]=T(ti);src[10]=['50','100','200','300'][ti];
  }
  const line=cr(Yx(st[8]),D?g.Y[1]:g.Y[0])>=3&&cr(Yx(st[8]),D?g.Y[0]:g.Y[1])>=3?st[8]:st[10];
  return {css:st.map(twx),on,line:twx(line),src:src.map(s=>fam+'-'+s)};
}
const PRESETS=[
 {id:'current',sup:'analogous',supFam:null,name:'Default',desc:'Stylist’s default palette',ui:'Schibsted Grotesk',mono:'IBM Plex Mono',fam:'blue',sat:100,warm:22,radius:8,pill:false,dens:'default',unit:4,h:{xs:6,sm:7,md:9,lg:11},focus:{shape:'ring',w:2,off:2,str:100},icons:{set:'lucide',stroke:2,weight:'regular'},tint:0,shStr:50,shSoft:50,sh:{color:null,op:8,blur:3,spread:0,x:0,y:1.5},motion:{fast:{d:80,b:0},moderate:{d:160,b:0},slow:{d:240,b:12},exit:75,reduced:'fade'},exact:CURRENT},
 {id:'warm',sup:'split',supFam:null,name:'Warm paper',desc:'Sketchbook cream, emerald',fam:'emerald',sat:100,warm:88},
 {id:'ink',sup:'analogous',supFam:null,name:'Ink',desc:'Near-monochrome, quiet',fam:'blue',sat:22,warm:50},
 {id:'kiln',sup:'split',supFam:null,name:'Kiln',desc:'Warm greys, teal',fam:'teal',sat:100,warm:70}
];
const KEYS=['fam','sat','warm','sup','supFam']; // a colour theme sets only these; fonts, corners and density stay as you set them
let S={...PRESETS[0]},mode='light';
