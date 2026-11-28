// ---- colour: three 12-step scales (accent, support, gray), Radix-style; every role is a step ----
const SUP={analogous:{name:'Analogous',off:40},complementary:{name:'Complement',off:180},split:{name:'Split',off:210},triadic:{name:'Triadic',off:120},custom:{name:'Custom'}};
const STEP_JOB=['App background','Subtle background','Element','Hovered element','Pressed / selected','Subtle border','Border','Strong border / focus','Solid','Hovered solid','Low-contrast text','High-contrast text'];
const GL=[.993,.962,.938,.918,.898,.875,.84,.76,.63,.58,.505,.27], GD=[.175,.205,.24,.27,.30,.335,.39,.47,.60,.65,.735,.935];
const GCF=[.5,.7,.8,.9,1,1,1.1,1.2,1.3,1.3,1.4,1.6];
const AL=[.99,.975,.955,.93,.90,.865,.81,.73,0,0,0,.30], AD=[.18,.21,.25,.29,.33,.38,.44,.52,0,0,0,.93];
const ACL=[.06,.13,.24,.34,.44,.52,.6,.75,1,1,.85,.45], ACD=[.15,.2,.35,.45,.55,.62,.7,.85,1,1,.85,.3];
function grayScale(D){
  const w=S.warm,k=S.sat/100,nh=w<50?250:75,nc=Math.abs(w-50)/50*.022,tint=.006*k;
  const a=nc*Math.cos(nh*Math.PI/180)+tint*Math.cos(accHue()*Math.PI/180),b=nc*Math.sin(nh*Math.PI/180)+tint*Math.sin(accHue()*Math.PI/180);
  const C=Math.hypot(a,b),h=((Math.atan2(b,a)*180/Math.PI)+360)%360;
  const L=(D?GD:GL).slice(),y=i=>Y(L[i],C*GCF[i],h);
  // step 11 (muted text) must read on steps 1 and 2
  for(let i=0;i<40&&(cr(y(10),y(0))<4.6||cr(y(10),y(1))<4.6);i++)L[10]+=D?.01:-.01;
  return {L,C,h,css:L.map((l,i)=>ok(l,C*GCF[i],Math.round(h))),Y:L.map((l,i)=>y(i))};
}
// core tokens only: app tokens are stripped (they live in the app layer), then Stylist-name pins win
function derive(m){
  const c=deriveRaw(m);for(const k of RESERVED)delete c[k];
  const D=m==='dark',g=grayScale(D);
  if(S.tint!==50)c.sheet=surface(D,g);   // 50 = today's surface; 0 = pure white (neutral in dark); 100 = twice today's tint
  Object.assign(c,shadowSet(D,g));
  {const f=focusOf();c.focus=f.str>=100?c['accent-line']:`color-mix(in oklab, ${c['accent-line']} ${f.str}%, transparent)`}
  const p=(APP.pins&&APP.pins[m])||{};for(const k in p)if(k[0]!=='@'&&k in c)c[k]=p[k];return c;
}
// containers (cards, panels, menus): their own tint, in the direction the Neutrals slider sets. The page background keeps following Neutrals.
function surface(D,g){const t=(S.tint??50)/50,h=Math.round(g.h);
  return D?ok(GD[1],g.C*GCF[1]*t,h):ok(1-(1-GL[0])*t,g.C*GCF[0]*t,h)}
// shadows: Radix-style levels with roles, all built from strength + softness. e = elevation 0..1, so other libraries' scales can be filled in between.
const SH_LEVELS={raised:.25,floating:.6,overlay:1};
// the seed: one shadow you set (colour + opacity, blur, spread, offsets). It is the raised level; higher levels add a scaled copy of it.
const SH_DEFAULT={color:null,op:8,blur:3,spread:0,x:0,y:1.5}; // = Stylist's original shadows
const shOf=()=>({...SH_DEFAULT,...(S.sh||{})});
// Two layers per level, as Stylist always drew them: a tight contact layer and a wide ambient one, both growing with elevation e.
// The seed is the raised level's contact layer; every other value is the same ratio of it as in Stylist's original formula.
function shadowAt(e,D,g,inset){const s=shOf();if(s.op<=0)return 'none';
  const A=a=>+Math.min(.7,a*(s.op/8)*(D?2.6:1)).toFixed(3),r=v=>+v.toFixed(1);
  const col=a=>s.color?`color-mix(in srgb, ${s.color} ${+(a*100).toFixed(1)}%, transparent)`:ok(D?.08:.22,Math.min(.04,g.C*2),Math.round(g.h),a);
  const px=v=>v?v+'px':'0',L=(py,pb,a)=>`${px(r(s.x*py))} ${px(r(s.y*py))} ${px(r(s.blur*pb))}${s.spread?' '+px(s.spread):''} ${col(A(a))}`;
  if(inset)return `inset ${px(r(s.x/1.5))} ${px(r(s.y/1.5))} ${px(r(s.blur/1.5))} ${col(A(.06))}`;
  return `${L((1+2*e)/1.5,(2+4*e)/3,.08)}, ${L((2+16*e)/1.5,(6+42*e)/3,.06+.16*e)}`}
function shadowSet(D,g){const o={'shadow-inset':shadowAt(0,D,g,true)};for(const n in SH_LEVELS)o['shadow-'+n]=shadowAt(SH_LEVELS[n],D,g);return o}
const isShadow=k=>k.startsWith('shadow-');
function deriveRaw(m){
  const D=m==='dark',g=grayScale(D),a=hueScale(S.fam,D,g),sp=hueScale(supFam(),D,g),G=i=>g.css[i-1],A=i=>a.css[i-1],P=i=>sp.css[i-1];
  const scales={};for(let i=1;i<=12;i++){scales['gray-'+i]=G(i);scales['accent-'+i]=A(i);scales['support-'+i]=P(i)}
  const support={support:P(9),'support-strong':P(10),'on-support':sp.on,'support-soft':P(3),'support-text':P(11),'support-line':sp.line};SRC.accent=a.src;SRC.support=sp.src;
  if(colorsUntouched()){const x=preset().exact[m];
    // the app's own colours, pinned onto the matching steps
    const pin=D?{1:'paper',2:'sheet',3:'grid',5:'grid-major',6:'rule',8:'axis',10:'pencil',11:'muted',12:'ink'}:{1:'sheet',2:'paper',3:'grid',5:'grid-major',6:'rule',8:'axis',10:'pencil',11:'muted',12:'ink'};
    for(const s in pin)scales['gray-'+s]=x[pin[s]];scales['accent-9']=x.accent;scales['accent-10']=x['accent-strong'];
    return {...x,'accent-text':x.accent,'accent-line':x.accent,...support,...scales}}
  const ink=g.css[11];
  const roles=D?{paper:G(1),sheet:G(2),hover:G(4)}:{paper:G(2),sheet:G(1),hover:G(3)};
  return {...roles,ink,muted:G(11),rule:G(6),grid:G(3),'grid-major':G(5),axis:G(8),pencil:G(10),
    accent:A(9),'accent-strong':A(10),'on-accent':a.on,'fill-sel':A(3),'accent-text':A(11),'accent-line':a.line,...support,
    fill:ok(g.L[11],g.C*1.6,Math.round(g.h),.05),danger:D?'#f08a5d':'#b4400f',...scales};
}
function apply(){
  const c=derive(mode),r=radiusScale(),d=DENS[S.dens],hp=effHpx(),fo=effFocus();
  const bg=BG.mode==='paper'?c.paper:BG.mode==='custom'?BG.color:(mode==='dark'?c.sheet:'#ffffff');
  const mn=document.querySelector('main');mn.style.setProperty('--mainbg',bg);
  mn.classList.toggle('dk',BG.mode==='custom'?isDarkHex(BG.color):mode==='dark');
  const bp=$('bgpick');bp.querySelector('[data-b=white]').style.background=mode==='dark'?c.sheet:'#ffffff';bp.querySelector('[data-b=paper]').style.background=c.paper;
  bp.querySelectorAll('[data-b]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.b===BG.mode));
  const cl=bp.querySelector('label');cl.classList.toggle('set',BG.mode==='custom');cl.style.setProperty('--bgc',BG.color);
  // preview: shadcn-only pins shown on the Stylist token they come from; base pins (fonts, corners, sizes) on the preview's own names
  const pv={...c},lp=APP.pins.light||{},mp=APP.pins[mode]||{},extra={};
  for(const k in mp)if(k.startsWith('@shadcn:')&&APP.target==='shadcn'){const n=inName('shadcn',k.slice(8));if(n&&n in pv)pv[n]=mp[k]}
  for(const k in lp){let n=k;if(k[0]==='@'){if(!k.startsWith('@shadcn:')||APP.target!=='shadcn')continue;n=inName('shadcn',k.slice(8))}if(n&&!(n in c))extra[PREVIEW_ALIAS[n]||n]=lp[k]}
  const appNames=Object.keys(APP.tokens);
  document.querySelectorAll('.pv').forEach(el=>{
    for(const k in pv)el.style.setProperty('--'+k,pv[k]);
    (el._app||[]).forEach(n=>{if(!APP.tokens[n])el.style.removeProperty('--'+n)});el._app=appNames;
    for(const n of appNames)el.style.setProperty('--'+n,appExpr(APP.tokens[n],mode,'preview'));
    el.style.setProperty('--font-ui',fam(S.ui)+',system-ui,sans-serif');
    el.style.setProperty('--font-mono',fam(S.mono)+',ui-monospace,monospace');
    for(const k in r)el.style.setProperty('--r-'+k,r[k]+'px');el.style.setProperty('--r-round',S.pill?'9999px':'0px');
    el.style.setProperty('--bar',effBar()+'px');el.style.setProperty('--ctl',hp.md+'px');for(const k of HK)el.style.setProperty('--ctl-'+k,hp[k]+'px');el.style.setProperty('--icon-stroke',iconOf().stroke);{const tr=trackOf();el.style.setProperty('--tracking',tr.base+'em');for(const k of TK)el.style.setProperty('--tracking-'+k,tr[k]+'em')}el.style.setProperty('--focus-width',fo.w+'px');el.style.setProperty('--focus-offset',fo.off+'px');el.style.setProperty('--focus-ring',fo.shape==='ring'?'0 0 0 var(--focus-offset) var(--sheet), 0 0 0 calc(var(--focus-offset) + var(--focus-width)) var(--focus)':'0 0 #0000');el.style.setProperty('--focus-outline',fo.shape==='outline'?'var(--focus-width) solid var(--focus)':'none');
    el.style.setProperty('--inset',d.inset+'px');el.style.setProperty('--gap',2*unitOf()+'px');el.style.setProperty('--u',unitOf()+'px');{const mt=motionTokens();for(const k of MK){el.style.setProperty('--motion-'+k,mt[k].duration+'ms');el.style.setProperty('--ease-'+k,mt[k].ease);el.style.setProperty('--motion-'+k+'-exit',mt[k].exit+'ms')}el.style.setProperty('--ease-exit',EXIT_EASE)}el.style.setProperty('--pad',stOf(S.dens).pad*unitOf()+'px');el.style.setProperty('--fs',d.fs+'px');
    for(const k in extra)el.style.setProperty('--'+k,extra[k]);
  });
  $('sat').value=S.sat;$('warm').value=S.warm;
  $('hueOut').textContent=`${S.fam} · ${S.sat}%`;
  document.querySelectorAll('#swatches button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===S.fam));
  document.querySelectorAll('#supMode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===S.sup));
  document.querySelectorAll('#supSw button').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.f===supFam());b.classList.toggle('linked',S.sup!=='custom')});
  $('supOut').innerHTML=`<span class="pair"><i style="background:${c.accent}"></i><i style="background:${c.support}"></i></span>${supFam()} · ${S.sup==='custom'?'unlinked':'linked'}`;
  $('warmOut').textContent=S.warm<45?'cool':S.warm>55?'warm':'grey';
  $('tint').value=S.tint;renderShadowCtl();renderMotionCtl();
  $('tintOut').textContent=S.tint===0?'white':S.tint===50?'as today':S.tint<50?'barely tinted':'tinted';
  {const s=shOf();$('shOut').textContent=s.op?`blur ${s.blur} · y ${s.y} · ${s.op}%`:'none'}
  document.querySelectorAll('#presets .pre').forEach(b=>{b.setAttribute('aria-selected',b.dataset.id===S.id);b.removeAttribute('aria-pressed')});
  {const p=preset(),edited=p&&KEYS.some(k=>S[k]!==p[k]);if(p)$('preBtn').innerHTML=`${swatch({...p,...(edited?{exact:null,fam:S.fam,sat:S.sat,warm:S.warm,sup:S.sup,supFam:S.supFam}:{})})}<span><b>${p.name}${edited?' <em>edited</em>':''}</b><small>${p.desc}</small></span><svg class="lu chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>`}
  loadFont(S.ui);loadFont(S.mono);
  document.querySelectorAll('.fbtn').forEach(b=>{const n=S[b.dataset.k];b.innerHTML=`<span class="fn" style="font-family:${fam(n)},system-ui">${n}</span>${custom[n]?'<span class="cu">File</span>':''}<svg viewBox="0 0 10 10"><path d="M2.5 4l2.5 2.5L7.5 4"/></svg>`});
  document.querySelectorAll('#round button').forEach(b=>{const c=CORNERS[+b.dataset.i];b.setAttribute('aria-pressed',c.r===S.radius&&!!c.pill===!!S.pill)});$('rOut').textContent=`${cornerName()} · ${r.sm}/${r.md}/${r.lg}/${r.xl}px`;
  const U=unitOf();document.querySelectorAll('#dens button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===S.dens));
  {const n=typeof styleEdits==='function'?styleEdits().length:0;$('densOut').textContent=n?`${n} change${n>1?'s':''}`:''}
  renderDensSpec();
  if(typeof renderLens==='function'){renderHeights();renderFocus();renderLens();renderHeightGuides();renderAppBar();if(typeof renderStart==='function')renderStart()}
  if(typeof renderIcons==='function')renderIcons();
  if(typeof renderBrand==='function')renderBrand();
  if(typeof renderMotion==='function')renderMotion();
  if(typeof placeInds==='function')requestAnimationFrame(()=>placeInds());
  if(typeof renderTrack==='function')renderTrack();
  if(typeof renderResets==='function')renderResets();
  if(document.activeElement!==$('unit'))$('unit').value=+(U/16).toFixed(4);
  $('unitOut').textContent=pxs(U);
  $('uscale').innerHTML=[1,2,4,6,8].map(n=>`<div><span>×${n}</span><i style="width:${n*U}px"></i><span>${rem(n*U)} (${pxs(n*U)})</span></div>`).join('');
  const p=preset(),edited=p&&KEYS.some(k=>S[k]!==p[k]);
  if(typeof renderTokens==='function')renderTokens();
  if(typeof renderCustom==='function')renderCustom();
  if(typeof renderAppPreview==='function'&&!$('vApp').hidden)renderAppPreview();
  try{localStorage.setItem('stylist.style.v1',JSON.stringify(S))}catch(e){}
}
function setupText(d){ // short: a request line, the settings (compact) and any changed logos; the steps live in APPLY.md
  d=d||brandDelta();
  const cj={stylist:SCHEMA,version:VERSION,framework:FRAMEWORK,app:APP.name,target:APP.target,settings:recipeSettings(),pins:APP.pins};
  if(APP.origin){const o=APP.origin; // the app may already hold this very style (sent before): that fits too
    cj.from={style:[...new Set([...o.style,...(o.sent||[]),styleFp(cj.settings,cj.pins)])],loaded:o.loaded,...(o.from?{source:o.from}:{}),...(o.new?{new:true}:{})}}
  if(d.files.length||d.removed.length)cj.brand={files:d.files.map(f=>({name:f.name,hash:f.hash,base:f.base})),removed:d.removed};
  const own=[S.ui,S.mono].filter(n=>custom[n]),notes=[];
  if(d.files.length)notes.push('Logos changed in Stylist are at the end; export.py writes them.');
  if(d.tooBig)notes.push(`Logos changed in Stylist were too big to include: they come as a separate .zip ("Download brand files").`);
  if(d.removed.length)notes.push(`Removed in Stylist: ${d.removed.join(', ')}. Ask before deleting them in the app.`);
  if(own.length)notes.push(`Not included: the font file ${own.join(', ')}. Add it to the app.`);
  return [`Apply this Stylist setup to ${APP.name}. How: https://github.com/g-ab/stylist/blob/main/APPLY.md`,
    ...(notes.length?['',...notes]:[]),'','```json',JSON.stringify(cj),'```',
    ...(d.files.length?d.files.flatMap(f=>['',`<!-- stylist-file ${f.name} -->`,'````'+(/\.svg$/.test(f.name)?'svg':/\.css$/.test(f.name)?'css':'markdown'),f.text.replace(/\r\n/g,'\n').trim(),'````']):[]),''].join('\n');
}
function swatch(p){const c=p.exact?p.exact.light:(()=>{const s=S;S={...p};const d=derive('light');S=s;return d})();return `<span class="sw"><i style="background:${c.paper}"></i><i style="background:${c.sheet}"></i><i style="background:${c.ink}"></i><i style="background:${c.accent}"></i></span>`}
$('presets').innerHTML=PRESETS.map(p=>`<button class="pre" role="option" data-id="${p.id}">${swatch(p)}<span><b>${p.name}</b><small>${p.desc}</small></span></button>`).join('');
$('round').innerHTML=CORNERS.map((c,i)=>`<button data-i="${i}" title="${c.name}${c.pill?': XL radius, pill-shaped buttons and fields':' · '+c.r+'px'}"><i style="border-radius:${c.pill?'999px':Math.min(c.r*1.25,11)+'px'}"></i>${c.name}</button>`).join('');
$('dens').innerHTML=Object.entries(DENS).filter(([k,v])=>!v.legacy).map(([k,v])=>`<button data-v="${k}" title="${v.desc}">${v.name}</button>`).join('');
$('swatches').innerHTML=FAMS.map(f=>`<button data-f="${f}" title="${f}" aria-label="${f}" style="background:${solidOf(f)}"></button>`).join('');
const preClose=()=>{$('presets').hidden=true;$('preBtn').setAttribute('aria-expanded','false')};
$('preBtn').onclick=e=>{e.stopPropagation();const o=$('presets').hidden;$('presets').hidden=!o;$('preBtn').setAttribute('aria-expanded',String(o));if(o)($('presets').querySelector('[aria-selected="true"]')||$('presets').firstElementChild).focus()};
$('presets').onclick=e=>{const b=e.target.closest('.pre');if(b){const p=PRESETS.find(p=>p.id===b.dataset.id);S={...S,id:p.id,fam:p.fam,sat:p.sat,warm:p.warm,sup:p.sup,supFam:null};preClose();apply();$('preBtn').focus()}};
$('presets').onkeydown=e=>{const bs=[...$('presets').children],i=bs.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length].focus()}else if(e.key==='Escape'){preClose();$('preBtn').focus()}};
document.addEventListener('mousedown',e=>{if(!e.target.closest('.pdd'))preClose()});
