// ---- App preview: the loaded app's own components (its components.json), styled live; an empty state until there is one ----
function renderAppPreview(){const el=$('appBody');if(!el)return;const comps=APP.components||[];
  if(!comps.length){el.innerHTML=`<div class="ap-empty"><h3>No app loaded yet</h3>
      <p>App preview shows your app’s own components, styled live. Load your app to see them here.</p>
      <p>Starting a new app? Style it with the Components view for now. Once your app has components in its <code>components.json</code>, they show up here.</p>
      <div class="ap-acts"><button class="btn pri" data-act="gh" type="button">Open from GitHub…</button><button class="btn" data-act="open" type="button">Open app style…</button></div></div>`;return}
  el.innerHTML=`<div class="ap-head"><h4>${escH(APP.name)}</h4><p>${comps.length} component${comps.length>1?'s':''} from the app, styled exactly as its files style it.</p></div>
    <div class="ap-grid">${comps.map((c,i)=>`<figure class="ap-item"><div class="ap-host" data-ci="${i}"></div><figcaption>${escH(c.name)}</figcaption></figure>`).join('')}</div>`;
  const tv=themeVars(APP.target);el.querySelectorAll('.ap-host').forEach(h=>mountComp(h,comps[+h.dataset.ci],tv))}
$('appBody').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;if(b.dataset.act==='gh')openGh();if(b.dataset.act==='open')$('appFiles').click()});
