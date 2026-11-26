// ---- views ----
$('views').onclick=e=>{const b=e.target.closest('button');if(!b)return;$('views').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  showView(b.dataset.v)};
function showView(v){$('views').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===v));
  $('vComp').hidden=v!=='comp';$('vApp').hidden=v!=='app';$('vTok').hidden=v!=='tok';$('vCus').hidden=v!=='cus';$('vBrand').hidden=v!=='brand';$('vMot').hidden=v!=='mot';renderTokens();renderCustom();renderBrand();renderMotion();requestAnimationFrame(()=>placeInds(true))}
// gallery: tabs and segmented controls respond to clicks
function slideInd(c,instant){const ind=c.querySelector(':scope>.seg-ind,:scope>.tab-ind'),b=c.querySelector(':scope>[aria-pressed="true"],:scope>[aria-selected="true"]');if(!ind)return;
  if(!b||!b.offsetWidth){ind.style.opacity=0;return}if(instant){ind.style.transition='none'}ind.style.opacity=1;ind.style.width=b.offsetWidth+'px';ind.style.transform=`translateX(${b.offsetLeft}px)`;if(instant){ind.offsetWidth;ind.style.transition=''}}
function placeInds(instant){document.querySelectorAll('#vComp .has-ind,#vApp .has-ind').forEach(c=>slideInd(c,instant))}
document.querySelectorAll('#vComp .k-tabs,#vComp .k-seg,#vApp .k-tabs,#vApp .k-seg').forEach(c=>{const tab=c.classList.contains('k-tabs');c.classList.add('has-ind');const i=document.createElement('span');i.className=tab?'tab-ind':'seg-ind';c.prepend(i)});
document.querySelectorAll('.k-tabs').forEach(t=>t.onclick=e=>{const b=e.target.closest('button');if(b){t.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));slideInd(t)}});
document.querySelectorAll('.k-seg').forEach(t=>t.onclick=e=>{const b=e.target.closest('button');if(b){t.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));slideInd(t)}});
// ---- Tokens view: a read-only picture of every token, live ----
const CORE=['paper','sheet','ink','muted','rule','hover','accent','accent-strong','on-accent','fill-sel','accent-text','accent-line','support','support-strong','on-support','support-soft','support-text','danger'];
const APPT=['grid','grid-major','axis','pencil','fill','cut','clay'];
const LABEL={paper:'Background',sheet:'Surface',ink:'Text',muted:'Muted text',rule:'Border',accent:'Accent','accent-strong':'Accent hover','on-accent':'On accent','fill-sel':'Selected','hover':'Hover','accent-text':'Accent text','accent-line':'Accent line',support:'Support','support-strong':'Support hover','on-support':'On support','support-soft':'Support soft','support-text':'Support text',danger:'Danger',grid:'Grid','grid-major':'Grid major',axis:'Axis',pencil:'Pencil',fill:'Shape fill',cut:'Hole',clay:'Clay 3D'};
const short=v=>v.replace(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)( \/ ([\d.]+))?\)/,(m,l,c,h,_,a)=>`oklch ${(+l*100).toFixed(0)}% ${(+c).toFixed(3)} ${(+h).toFixed(0)}${a?' /'+a:''}`);
function renderTokens(){
  const t=tokens(),el=$('tokBody');if(!el||$('vTok').hidden)return;
  const sw=(names,m)=>names.map(n=>`<div class="t-sw"><span class="t-chip" data-copy="${t[m][n]}" data-name="--${n}" tabindex="0" role="button" title="--${n} · click to copy the hex" style="background:${t[m][n]}"></span><b>${LABEL[n]}${APP.pins[m]&&APP.pins[m][n]!=null?' <span class="t-pin">pinned</span>':''}</b><code>--${n}</code><small>${short(t[m][n])}</small></div>`).join('');
  const asw=m=>Object.entries(APP.tokens).map(([n,d])=>`<div class="t-sw"><span class="t-chip" data-copy="${resolveApp(d,m,t[m])}" data-name="--${escH(n)}" tabindex="0" role="button" title="--${escH(n)} · click to copy the hex" style="background:${resolveApp(d,m,t[m])}"></span><b>${escH(LABEL[n]||n)}</b><code>--${escH(n)}</code><small>${d.ref?'→ '+d.ref+((d.pct??100)<100?' · '+d.pct+'%':''):escH(short(d[m]||''))+' · pinned'}</small></div>`).join('');
  // colours in use, laid out like the scales: one row per group, each colour labelled with the scale step it comes from, or custom / pinned
  const CGROUPS=[['Base',['paper','sheet','ink','muted','rule','hover']],['Accent',['accent','accent-strong','on-accent','fill-sel','accent-text','accent-line']],['Support',['support','support-strong','on-support','support-soft','support-text']],['Status',['danger']]];
  const srcOf=(v,m)=>{for(const f of ['gray','accent','support'])for(let i=1;i<=12;i++)if(t[m][f+'-'+i]===v)return f+' '+i;return null};
  const cell=(n,label,v,src,bg)=>`<div class="t-cc"><span class="t-st" data-copy="${v}" data-name="--${escH(n)}" tabindex="0" role="button" title="--${escH(n)} · ${escH(short(v))} · click to copy" style="background:linear-gradient(${v},${v}),${bg}"></span><b>${escH(label)}</b><small>${escH(src)}</small></div>`;
  // soft to strong, as in the scales: lightest first in light mode, darkest first in dark mode (translucent ones measured over the surface)
  const lumOn=(v,bg)=>{const h=colorHex(v),b=colorHex(bg),c=i=>parseInt(h.slice(i,i+2),16),a=h.length>7?parseInt(h.slice(7,9),16)/255:1,mix=i=>a*c(i)+(1-a)*parseInt(b.slice(i,i+2),16);return relLum(mix(1),mix(3),mix(5))};
  const bySoft=(list,m)=>list.map(x=>[x,lumOn(x.v,t[m].sheet)]).sort((p,q)=>m==='light'?q[1]-p[1]:p[1]-q[1]).map(p=>p[0]);
  const crow=(g,cells)=>`<div class="t-crow"><span class="t-sn">${g}</span><div class="t-cells">${cells}</div></div>`;
  const cols=['light','dark'].map(m=>{const pin=n=>APP.pins[m]&&APP.pins[m][n]!=null;
    const core=CGROUPS.map(([g,ns])=>crow(g,bySoft(ns.map(n=>({n,v:t[m][n]})),m).map(({n,v})=>cell(n,LABEL[n]||n,v,pin(n)?'pinned':srcOf(v,m)||'custom',t[m].sheet)).join(''))).join('');
    const app=bySoft(Object.entries(APP.tokens).map(([n,d])=>({n,d,v:resolveApp(d,m,t[m])})),m).map(({n,d,v})=>cell(n,LABEL[n]||n,v,d.ref?d.ref.replace(/-(\d+)$/,' $1')+((d.pct??100)<100?' · '+d.pct+'%':''):'pinned',t[m].sheet)).join('');
    return `<div class="t-scl ${m}"><div class="t-sub">${m==='light'?'Light':'Dark'}</div>${core}${app?crow('Your app',app):''}</div>`}).join('');
  const modes=`<div class="k-card t-card"><div class="blk-h"><div><h4>Colours in use</h4></div></div><div class="t-scls">${cols}</div></div>`;
  const type=t.type.map(s=>`<div class="t-ty"><span class="t-tn"><b>${s.name}</b><small>${s.size}px · ${s.weight}${s.mono?' · mono':''}</small></span><span class="t-ts" style="font:${s.weight} ${s.size}px/1.4 var(${s.mono?'--font-mono':'--font-ui'});${s.upper?'text-transform:uppercase;letter-spacing:.08em;':''}">${s.sample}</span></div>`).join('');
  const sp=Object.entries(t.space).map(([k,v])=>`<div class="t-sp"><code>space-${k}</code><small>${v}px</small><span class="t-bar" style="width:${v}px"></span></div>`).join('');
  const rd=[...Object.entries(t.radius).map(([k,v])=>[k,v+'px',v+'px']),...Object.entries(t.nest).map(([k,v])=>[k,v>=9999?'999px':v+'px',v>=9999?'pill':NEST[k].label.split(' · ')[1]+' = '+v+'px']),['round',t.round==='0px'?'0px':'999px',S.pill?'controls: pill':'controls: off']].map(([k,v,l])=>`<div class="t-rd"><span style="border-radius:${v}"></span><code>radius-${k}</code><small>${l}</small></div>`).join('');
  const vis={bar:v=>`<span class="t-szv" style="height:${v}px;width:${v*2.4}px"></span>`,control:v=>`<span class="t-szv" style="height:${v}px;width:${v*2.4}px"></span>`,
    inset:v=>`<span class="t-inset" style="padding:${v}px"><i></i></span>`,gap:v=>`<span class="t-gap" style="gap:${v}px"><i></i><i></i></span>`};
  const sz=[['bar','Bar height',t.size.bar],['control','Control height',t.size.control],['inset','Inset inside a bar',t.size.inset],['gap','Gap between bars',t.size.gap]].map(([k,l,v])=>`<div class="t-sz">${vis[k](v)}<code>${k}</code><small>${l} · ${v}px</small></div>`).join('');
  const strip=(m,name,label)=>`<div class="t-strip"><span class="t-sn">${label}</span>${Array.from({length:12},(_,i)=>`<span class="t-st" data-copy="${t[m][name+'-'+(i+1)]}" data-name="--${name}-${i+1}" tabindex="0" role="button" title="--${name}-${i+1} · ${STEP_JOB[i]}${SRC[name]&&m===mode?' · '+SRC[name][i]:''} · click to copy the hex" style="background:${t[m][name+'-'+(i+1)]}"></span>`).join('')}</div>`;
  const nums=`<div class="t-strip t-nums"><span class="t-sn"></span>${Array.from({length:12},(_,i)=>`<span>${i+1}</span>`).join('')}</div>`;
  const jobs=`<div class="t-strip t-jobs"><span class="t-sn"></span><span style="grid-column:span 2">Backgrounds</span><span style="grid-column:span 3">Elements</span><span style="grid-column:span 3">Borders</span><span style="grid-column:span 2">Solid</span><span style="grid-column:span 2">Text</span></div>`;
  const scl=['light','dark'].map(m=>`<div class="t-scl ${m}"><div class="t-sub">${m==='light'?'Light':'Dark'}</div>${nums}${strip(m,'accent','Accent')}${strip(m,'support','Support')}${strip(m,'gray','Gray')}${jobs}</div>`).join('');
  el.innerHTML=`<div class="k-card t-card"><div class="blk-h"><div><h4>Scales</h4></div><span class="k-badge">Tailwind ${S.fam} + ${supFam()}</span></div><div class="t-scls">${scl}</div></div>
  ${modes}
   <div class="k-card t-card"><div class="blk-h"><div><h4>Typography</h4></div></div>
     <div class="t-fams"><div><span class="t-aa" style="font-family:var(--font-ui)">Aa</span><b>${S.ui}</b><small>Interface · --font-ui</small></div><div><span class="t-aa" style="font-family:var(--font-mono)">01</span><b>${S.mono}</b><small>Numbers &amp; labels · --font-mono</small></div></div>
     <div class="t-tys">${type}</div>
     <div class="t-sub" style="margin-top:14px">Letter spacing · Tracking ${t.track.base}em on all text · the steps follow it</div>
     <div class="t-trs">${TK.map(k=>`<div class="t-tr"><span class="t-tn"><b>${k[0].toUpperCase()+k.slice(1)}</b><small>--tracking-${k} · ${t.track[k]}em</small></span><span style="letter-spacing:var(--tracking-${k});font:600 ${DENS[S.dens].fs+5}px/1.3 var(--font-ui)">Pitcher vase</span><span style="letter-spacing:var(--tracking-${k});font:600 11px var(--font-mono);text-transform:uppercase;color:var(--muted)">Front W × H</span></div>`).join('')}</div></div>
   <div class="k-card t-card"><div class="blk-h"><div><h4>Shadows</h4></div></div>
     <div class="t-shs">${[['inset','Inset','Inputs, wells'],['raised','Raised','Cards, bars, panels'],['floating','Floating','Menus, popovers, toasts'],['overlay','Overlay','Dialogs']].map(([k,l,j])=>`<div class="t-sh"><span style="box-shadow:var(--shadow-${k})"></span><b>${l}</b><code>--shadow-${k}</code><small>${j}</small></div>`).join('')}</div></div>
   <div class="t-cols three">
     <div class="k-card t-card"><div class="blk-h"><div><h4>Spacing</h4><p>Steps of ${t.space[1]}px</p></div></div><div class="t-sps">${sp}</div></div>
     <div class="k-card t-card"><div class="blk-h"><div><h4>Radius</h4><p>${cornerName()} · one choice sets every step</p></div></div><div class="t-rds">${rd}</div></div>
     <div class="k-card t-card"><div class="blk-h"><div><h4>Sizes</h4><p>${densCustom()?'Custom':DENS[S.dens].name} density</p></div></div><div class="t-szs">${sz}</div></div>
   </div>`;
}
