// ---- the Custom view ----
function refOptions(sel){const c=derive('light'),role=CORE.filter(n=>n in c),grp=(l,ns)=>`<optgroup label="${l}">${ns.map(n=>`<option value="${n}"${n===sel?' selected':''}>${n}</option>`).join('')}</optgroup>`;
  const st=p=>Array.from({length:12},(_,i)=>p+'-'+(i+1));return grp('Roles',role)+grp('Gray',st('gray'))+grp('Accent',st('accent'))+grp('Support',st('support'))}
// a component's brand spot (class bp-logo) shows the current logo for the mode, or the app's name; older saves had the name typed in
function compBrand(h){h=h.replace(/<b>Blueprint<\/b>/g,'<b class="bp-logo"></b>');const a=brandOf('logo',mode);
  const inner=a?`<img src="${svgSrc(a.svg)}" alt="${escH(APP.name)}" style="height:18px;width:auto;display:block">`:escH(APP.name);
  return h.replace(/(<([a-z][a-z0-9]*)\b[^>]*class="[^"]*\bbp-logo\b[^"]*"[^>]*>)[\s\S]*?(<\/\2>)/g,(m,o,t,c)=>o+inner+c)}
// the variables the exported files give the app (core + app tokens, current mode), as the app itself would see them
function themeVars(tg){const p=parseCSS(coreCSS(tg)+'\n'+appCSS(tg)),tv={...p.light,...(mode==='dark'?p.dark:{})};
  if(tg==='radix'){const {a}=radixNames();for(let i=1;i<=12;i++){tv['accent-'+i]=tv[a+'-'+i];tv['accent-a'+i]=tv[a+'-a'+i]}
    const f=parseFloat(tv['radius-factor'])||0;[3,4,6,8,12,16].forEach((b,i)=>tv['radius-'+(i+1)]=+(b*f).toFixed(2)+'px')}
  return tv}
// one app component in its own shadow root, themed with exactly those variables
function mountComp(host,c,tv){for(const k in tv)host.style.setProperty('--'+k,tv[k]);
  const sr=host.shadowRoot||host.attachShadow({mode:'open'});sr.innerHTML=`<style>:host{display:block;color:var(--ink,var(--foreground));font:14px/1.45 var(--font-ui,var(--font-sans,system-ui))}${c.css}</style>${compBrand(c.html)}`}
function renderCustom(){
  const el=$('cusBody');if(!el||$('vCus').hidden)return;
  if(!appLoaded()){el.innerHTML=`<div class="ap-empty"><h3>No app loaded yet</h3>
      <p>This tab is about your app: its custom tokens and components, changes made outside Stylist, and what was kept. Load your app to see them here.</p>
      <p>You can also drop the app’s files here: <code>stylist.json</code>, <code>components.json</code> and the CSS files.</p>
      <div class="ap-acts"><button class="btn pri" data-act="gh" type="button">Open from GitHub…</button><button class="btn" data-act="open" type="button">Open app style…</button></div>
      <p class="ap-alt">Styling an app that has no Stylist files yet? <button class="lnk" data-act="new" type="button">Start a new app</button></p></div>`;return}
  const t=tokens(),T=APP.tokens,tg=APP.target,R=APP.review||[],sw=v=>isColor(v)?`<span class="c-sw" style="background:${escH(v)}"></span>`:'';
  let h=`<div class="k-card c-card"><div class="blk-h"><div><h4>${escH(APP.name)}</h4><p>${escH((APP.source||''))}${APP.exported?` · last exported ${new Date(APP.exported).toLocaleDateString()}`:''}</p></div>
    <div class="k-row" style="gap:8px;flex-wrap:nowrap"><button class="k-btn" data-act="open">Open app style…</button><button class="k-btn" data-act="gh">Open from GitHub…</button><button class="k-btn pri" data-act="pkg">Export package…</button></div></div>
    <div class="k-row" style="gap:20px;align-items:flex-end"><label class="k-field">App name<input class="k-input" data-f="name" value="${escH(APP.name)}"></label>
    <div class="k-field" style="width:auto">Exports to<div class="k-seg" data-f="target">${Object.entries(TGT).map(([k,v])=>`<button data-v="${k}" aria-pressed="${k===tg}">${v}</button>`).join('')}</div></div>
    <button class="k-btn ghost sm" data-act="reset" style="margin-left:auto">Start over, no app</button></div>
    <div class="c-drop">Drop the app’s files here: stylist.json, stylist-theme.css, app-tokens.css, components.json, and brand SVGs (logo, mark, favicon)</div></div>`;
  // changes + pins
  const pins=[];for(const m of ['light','dark'])for(const k in APP.pins[m]||{})pins.push({m,k,v:APP.pins[m][k]});
  if(R.length||pins.length){
    h+=`<div class="k-card c-card"><div class="blk-h"><div><h4>Changes in the core files</h4><p>${R.length?`${R.length} value${R.length>1?'s differ':' differs'} from what Stylist last exported. Match it with Stylist’s controls, pin it as an exception, or revert to Stylist’s value.`:'Nothing left to review.'} ${escH(APP.reviewNote||'')}</p></div>
      ${R.length?'<div class="k-row" style="gap:6px;flex-wrap:nowrap"><button class="k-btn sm" data-act="allpin">Pin all</button><button class="k-btn sm ghost" data-act="allrev">Revert all</button></div>':''}</div>`;
    for(const r of R){const lab={changed:'Changed',added:'Added',removed:'Removed'}[r.kind],cls={changed:'acc',added:'sup',removed:'dng'}[r.kind];
      const acts=r.kind==='changed'?`${absorbName(tg,r.v)?`<button class="k-btn sm" data-rv="match" data-id="${r.id}">Match with controls</button>`:''}<button class="k-btn sm pri" data-rv="pin" data-id="${r.id}">Pin</button><button class="k-btn sm ghost" data-rv="revert" data-id="${r.id}">Revert</button>`
        :r.kind==='added'?`<button class="k-btn sm pri" data-rv="move" data-id="${r.id}">Move to app tokens</button><button class="k-btn sm ghost" data-rv="revert" data-id="${r.id}">Discard</button>`
        :`<button class="k-btn sm pri" data-rv="restore" data-id="${r.id}">Restore</button>`;
      h+=`<div class="c-chg"><div class="c-diff"><span class="k-badge ${cls}">${lab}</span><code>--${escH(r.v)}</code><span class="k-mut">${r.mode}</span>
        ${r.from!=null?sw(r.from)+`<span class="v" title="${escH(r.from)}">${escH(short(r.from))}</span>`:''}${r.kind==='changed'?'<span class="k-mut">→</span>':''}${r.to!=null?sw(r.to)+`<span class="v" title="${escH(r.to)}">${escH(short(r.to))}</span>`:''}</div>
        <div class="c-acts">${acts}</div><input class="k-input c-why" data-why="${r.id}" placeholder="Why? Optional, goes in the changelog"></div>`}
    if(pins.length)h+=`<div class="c-sub">Pinned: kept on every export</div>`+pins.map(p=>`<div class="c-chg"><div class="c-diff"><code>--${escH(p.k.replace(/^@shadcn:/,''))}</code>${p.k[0]==='@'?'<span class="k-badge">shadcn only</span>':''}<span class="k-mut">${p.m}</span>${sw(p.v)}<span class="v" title="${escH(p.v)}">${escH(short(p.v))}</span></div><div class="c-acts"><button class="k-btn sm ghost" data-unpin="${p.m}|${escH(p.k)}">Unpin</button></div></div>`).join('');
    h+='</div>'}
  // app tokens
  const rows=Object.entries(T).map(([n,d])=>{const L=resolveApp(d,'light',t.light),D=resolveApp(d,'dark',t.dark);
    const ctl=d.ref?`<span class="k-sel"><select class="k-input" data-tok="${escH(n)}"><option value="@pin">Pinned value</option>${refOptions(d.ref)}</select>${iconSVG('chevron')}</span><input class="k-input pct" type="number" min="1" max="100" data-pct="${escH(n)}" value="${d.pct??100}" title="Strength, %" aria-label="Strength in percent">`
      :`<span class="k-sel" style="flex:none;width:130px"><select class="k-input" data-tok="${escH(n)}"><option value="@pin" selected>Pinned value</option>${refOptions('')}</select>${iconSVG('chevron')}</span><input class="k-input raw" data-raw="${escH(n)}|light" value="${escH(d.light)}" aria-label="Light value"><input class="k-input raw" data-raw="${escH(n)}|dark" value="${escH(d.dark)}" aria-label="Dark value">`;
    return `<div class="c-tok"><code>--${escH(n)}</code><span class="c-chip" style="background:${escH(L)}" title="Light"></span><span class="c-chip" style="background:${escH(D)}" title="Dark"></span><div class="c-ctl">${ctl}</div><button class="k-btn ghost icon sm" data-del="${escH(n)}" aria-label="Remove --${escH(n)}" title="Remove">${iconSVG('close')}</button></div>`}).join('');
  h+=`<div class="k-card c-card"><div class="blk-h"><div><h4>Custom tokens</h4><p>Owned by the app. Point each one at a core token so it follows every restyle, or pin a value when it must stay put.</p></div><span class="k-badge">${Object.keys(T).length}</span></div>
    ${rows?`<div class="c-tok head"><span>Token</span><span>Light</span><span>Dark</span><span>Points to</span><span></span></div>${rows}`:'<p class="c-empty">No app tokens yet.</p>'}
    <div class="c-add"><input class="k-input" id="newTok" placeholder="New token, e.g. warning-soft"><button class="k-btn" data-act="addtok">Add token</button></div></div>`;
  // components
  const comps=APP.components.map(c=>({c,uses:compUses(c,tg),hs:heightStatus(c)}));
  h+=`<div class="k-card c-card"><div class="blk-h"><div><h4>Custom components</h4><p>Rendered with the variables Stylist exports for ${TGT[tg]}, so a change here is what the app gets.${tg==='tw'?' Utility classes aren’t compiled here: give each snippet its own CSS.':''}</p></div><span class="k-badge">${comps.length}</span></div>
    ${comps.length?`<div class="c-comps">${comps.map(({c,uses,hs},i)=>`<div class="c-comp"><div class="k-row sb"><b>${escH(c.name)}</b>${hs?` <span class="k-badge${hs.f?" acc":""}" title="${hs.f?"Uses the control height tokens":"Hard-coded height: won’t follow Stylist’s heights"}">${hs.f?"Follows heights":"Fixed "+escH(hs.v)}</span>`:""}<span class="k-mut">${uses.length} tokens</span></div><div class="c-host" data-ci="${i}"></div><div class="c-toks">${uses.map(u=>`<span class="k-badge${T[u]?' acc':''}">--${escH(u)}</span>`).join('')}</div></div>`).join('')}</div>`
    :'<p class="c-empty">No components.json yet. Add one to preview the app’s custom components here.</p>'}</div>`;
  // changelog
  const log=APP.changelog;
  h+=`<div class="k-card c-card"><div class="blk-h"><div><h4>Changelog</h4><p>Every value kept, matched or reverted after an edit outside Stylist. Saved in stylist.json.</p></div></div>
    ${log.length?`<ol class="c-log">${log.map(e=>`<li><time>${escH(e.date)}</time><div><code>${escH(e.token)}</code> · ${escH(e.mode||'')} · <b>${escH(e.action)}</b>${e.from!=null||e.to!=null?` · ${escH(short(String(e.from??'–')))} → ${escH(short(String(e.to??'–')))}`:''}${e.note?`<small>${escH(e.note)}</small>`:''}${e.reason?`<small>Why: ${escH(e.reason)}</small>`:''}</div></li>`).join('')}</ol>`:'<p class="c-empty">Nothing yet.</p>'}</div>`;
  el.innerHTML=h;
  // mount components in their own shadow roots, themed exactly as the exported files would theme the app
  const tv=themeVars(tg);
  el.querySelectorAll('.c-host').forEach(host=>{const c=APP.components[+host.dataset.ci];mountComp(host,c,tv);
    // tokens the snippet uses that this target's files don't define: they'd be missing in the real app too
    const miss=[...new Set([...(c.html+' '+c.css).matchAll(/var\(--([\w-]+)/g)].map(m=>m[1]))].filter(v=>tv[v]==null);
    if(miss.length){const d=document.createElement('p');d.className='c-miss';d.innerHTML=`Not defined for ${TGT[tg]}: ${miss.map(v=>`<code>--${escH(v)}</code>`).join(' ')}. Rename them to this target’s tokens, or add them as app tokens.`;host.after(d)}});
}
const cus=$('vCus');
cus.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  const a=b.dataset.act;
  if(a==='open')$('appFiles').click();
  if(a==='gh')openGh();
  else if(a==='pkg')openPkg();
  else if(a==='new'){APP.source='New app, not exported yet';saveApp();apply()}
  else if(a==='reset'){APP=appDefault();saveApp();apply();toast('Started over: no app loaded')}
  else if(a==='addtok'){const n=$('newTok').value.trim().replace(/^--/,'').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
    if(!n){toast('Give the token a name');return}if(APP.tokens[n]){toast(`--${n} already exists`);return}
    if(coreNames().includes(n)){toast(`--${n} is a core token. Pick another name`);return}
    APP.tokens[n]={ref:'accent-9'};saveApp();apply()}
  else if(a==='allpin'||a==='allrev'){[...APP.review].forEach(r=>resolveReview(r.id,a==='allpin'?(r.kind==='changed'?'pin':r.kind==='added'?'move':'restore'):(r.kind==='removed'?'restore':'revert')))}
  else if(b.dataset.rv)resolveReview(b.dataset.id,b.dataset.rv);
  else if(b.dataset.unpin){const [m,...k]=b.dataset.unpin.split('|');delete APP.pins[m][k.join('|')];saveApp();apply()}
  else if(b.dataset.del){delete APP.tokens[b.dataset.del];saveApp();apply()}
  else if(b.closest('[data-f="target"]')){APP.target=b.dataset.v;saveApp();apply()}});
cus.addEventListener('change',e=>{const x=e.target;
  if(x.dataset.f==='name'){APP.name=x.value.trim()||'App';saveApp();apply()}
  else if(x.dataset.tok){const n=x.dataset.tok,d=APP.tokens[n],t=tokens();
    APP.tokens[n]=x.value==='@pin'?{light:resolveApp(d,'light',t.light),dark:resolveApp(d,'dark',t.dark)}:{ref:x.value,...(d.ref&&d.pct?{pct:d.pct}:{})};saveApp();apply()}
  else if(x.dataset.pct){const d=APP.tokens[x.dataset.pct],v=Math.max(1,Math.min(100,Math.round(+x.value||100)));if(v>=100)delete d.pct;else d.pct=v;saveApp();apply()}
  else if(x.dataset.raw){const [n,m]=x.dataset.raw.split('|');APP.tokens[n][m]=x.value.trim();saveApp();apply()}});
cus.addEventListener('dragover',e=>{e.preventDefault();$('cusBody').classList.add('drag')});
cus.addEventListener('dragleave',e=>{if(!cus.contains(e.relatedTarget))$('cusBody').classList.remove('drag')});
cus.addEventListener('drop',e=>{e.preventDefault();$('cusBody').classList.remove('drag');if(e.dataTransfer.files.length)openFiles(e.dataTransfer.files)});
