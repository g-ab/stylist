// ---- App preview: the loaded app's own components (its components.json), styled live; a note while the app has none ----
function renderAppPreview(){const el=$('appBody');if(!el)return;const comps=APP.components||[];
  if(!comps.length){el.innerHTML=`<div class="ap-empty"><h3>No components from ${escH(APP.name||'this app')} yet</h3>
      <p>App preview shows the components listed in the app’s <code>components.json</code>, styled live. ${APP.origin&&APP.origin.new?'A new app has none until its agent adds them.':'This app’s files have none.'}</p>
      <p>Meanwhile, the Components view shows Stylist’s own components with your style.</p></div>`;return}
  el.innerHTML=`<div class="ap-head"><h4>${escH(APP.name)}</h4><p>${comps.length} component${comps.length>1?'s':''} from the app, styled exactly as its files style it.</p></div>
    <div class="ap-grid">${comps.map((c,i)=>`<figure class="ap-item"><div class="ap-host" data-ci="${i}"></div><figcaption>${escH(c.name)}</figcaption></figure>`).join('')}</div>`;
  const tv=themeVars(APP.target);el.querySelectorAll('.ap-host').forEach(h=>mountComp(h,comps[+h.dataset.ci],tv))}
