(() => {
 'use strict';
 // Keep the originating time point in the URL, so deep links, reloads and tabs
 // retain the reading route without cookies or storage (including file://).
 const route=window.voedingRoute||[];
 const location=window.location;
 let largeText=location?new URL(location.href).searchParams.get('tekst')==='groot':false;
 function textLink(a){
  if(!location)return;
  const raw=a.getAttribute('href');if(!raw||raw.startsWith('#'))return;
  const dest=new URL(raw,location.href),guide=document.querySelector('[data-route-page]');
  if(!guide)return;
  const base=new URL('.',new URL(guide.dataset.routeBase+'index.html',location.href));
  if(dest.protocol!==base.protocol||dest.host!==base.host||!dest.pathname.startsWith(base.pathname)||!dest.pathname.endsWith('.html'))return;
  if(largeText)dest.searchParams.set('tekst','groot');else dest.searchParams.delete('tekst');
  a.href=dest.href;
 }
 const showTextSize=()=>{
  document.documentElement.classList.toggle('large-text',largeText);
  document.querySelectorAll('[data-text-size]').forEach(b=>{b.hidden=false;b.setAttribute('aria-pressed',String(largeText));b.textContent=largeText?'Kleine letters':'Grote letters';});
 };
 showTextSize();
 document.querySelectorAll('[data-text-size]').forEach(b=>b.addEventListener('click',()=>{
  largeText=!largeText;showTextSize();document.querySelectorAll('a[href]').forEach(textLink);
  if(location){const address=new URL(location.href);if(largeText)address.searchParams.set('tekst','groot');else address.searchParams.delete('tekst');try{window.history.replaceState(null,'',address.href);}catch{/* Links still carry the preference if file history is unavailable. */}}
 }));
 document.querySelectorAll('[data-print]').forEach(b=>{b.hidden=false;b.addEventListener('click',()=>window.print());});
 let routeStop=null;
 let routeRoot=null;
 if(location && route.length){
  const guide=document.querySelector('[data-route-page]');
  if(guide){
   routeRoot=new URL(guide.dataset.routeBase+'index.html',location.href);
   const own=route.find(s=>'timeline/'+s.id+'.html'===guide.dataset.routePage);
   const requested=new URL(location.href).searchParams.get('vanaf');
   routeStop=own||route.find(s=>s.id===requested)||null;
   if(routeStop){
    const i=route.indexOf(routeStop),next=route[i+1];
    const target=(p)=>new URL(p,routeRoot).href;
    const set=(selector,text)=>document.querySelectorAll(selector).forEach(el=>el.textContent=text);
    const link=(selector,href)=>document.querySelectorAll(selector).forEach(el=>el.href=target(href));
    const home=document.querySelector('[data-home-route]');
    // The overview is a place to choose a new stop, not another side path.
    // A bookmark in its URL must not look like the currently selected year.
    if(home){home.hidden=true;routeStop=null;}
    if(!home){
    set('[data-route-label]',own?'U leest nu: '+routeStop.year+' · '+routeStop.title:'U onderbrak de tijdlijn bij '+routeStop.year+' · '+routeStop.title);
    set('[data-route-context]',`Tijdsmoment ${i+1} van ${route.length} — ${routeStop.phase}. `+(own?'Lees de samenvatting hieronder. Daarna kunt u chronologisch verder of eerst extra uitleg lezen.':'U leest extra uitleg bij dit vertrekpunt. U kunt op elk moment terug naar de samenvatting, of verder naar het volgende tijdsmoment.'));
    set('[data-route-point]','Onthoud de samenvatting: '+routeStop.point);
    set('[data-route-short]',(own?'U leest nu':'Terugweg bewaard')+` · ${routeStop.year} · ${i+1}/${route.length}`);
    set('[data-route-back]','Terug naar '+routeStop.year+' · samenvatting');
    link('[data-route-back]','timeline/'+routeStop.id+'.html#kern');
    link('[data-route-overview]','index.html?vanaf='+routeStop.id+'#stop-'+routeStop.id);
    set('[data-route-next]',next?'Verder naar '+next.year+' — '+next.title+' →':'Afgerond: bekijk het geheel →');
    document.querySelectorAll('[data-route-next]').forEach(a=>a.setAttribute('aria-label',next?'Volgend tijdsmoment: '+next.year+' — '+next.title:'Tijdlijn afgerond: bekijk het geheel'));
    link('[data-route-next]',next?'timeline/'+next.id+'.html':'index.html?vanaf='+routeStop.id+'#stop-'+routeStop.id);
    }
   }
  }
 }
 const keepRoute=a=>{
  textLink(a);
  if(!routeStop||!routeRoot)return;
  const raw=a.getAttribute('href');
  if(!raw||raw.startsWith('#'))return;
  const dest=new URL(raw,location.href),base=new URL('.',routeRoot);
  if(dest.protocol!==base.protocol||dest.host!==base.host||!dest.pathname.startsWith(base.pathname))return;
  const relative=dest.pathname.slice(base.pathname.length);
  // A new time point becomes the new departure point. Never alter external sources.
  if(!['index.html','leeswijzer.html','begrippen.html','bronnen.html',...['beleid','bewerking','vetten','diabetes','belgie','granen'].map(t=>'themas/'+t+'.html')].includes(relative))return;
  dest.searchParams.set('vanaf',routeStop.id);a.href=dest.href;
 };
 document.querySelectorAll('a[href]').forEach(keepRoute);
 // Repeat the same controls after the article, without covering the reading area.
 const dock=document.querySelector('.route-dock');
 if(dock&&!document.querySelector('[data-home-route]')&&!location?.href.includes('leesversie.html')){
  const bottom=dock.cloneNode(true);bottom.setAttribute('aria-label','Na het lezen: terug of verder');
  document.querySelector('main')?.after(bottom);
 }
 const buttons = [...document.querySelectorAll('[data-filter]')];
 const filterTimeline = (value) => {
  buttons.forEach(b => b.setAttribute('aria-pressed',String(b.dataset.filter === value)));
  let count=0;
  document.querySelectorAll('.timeline-item').forEach(item=>{
   item.hidden=value!=='all' && item.dataset.theme!==value;
   if(!item.hidden) count++;
  });
  document.querySelectorAll('.timeline-phase').forEach(phase=>phase.hidden=![...phase.querySelectorAll('.timeline-item')].some(x=>!x.hidden));
  const label=document.getElementById('timeline-count');
  if(label) label.textContent=`${count} tijdsmoment${count===1?'':'en'}${value==='all'?'':' · '+buttons.find(b=>b.dataset.filter===value).textContent}`;
 };
 buttons.forEach(b=>b.addEventListener('click',()=>filterTimeline(b.dataset.filter)));
 // Period shortcuts always reveal their destination, even after a theme filter.
 document.querySelectorAll('a[href^="#fase-"]').forEach(a=>a.addEventListener('click',()=>filterTimeline('all')));
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 document.querySelectorAll('.search-section').forEach(section=>{
  const form=section.querySelector('form'),input=section.querySelector('input'),results=section.querySelector('.search-results'),list=results.querySelector('ul'),status=results.querySelector('[role="status"]');
  const index=(window.voedingIndex||[]).map(x=>({...x,normalized:normalize(x.text),titleNormalized:normalize(x.title)}));
  const update=()=>{
   const q=normalize(input.value.trim()); list.replaceChildren();results.hidden=!q;
   if(!q){status.textContent='';return;}
   const words=q.split(/\s+/);
   const hits=index.filter(x=>words.every(w=>x.normalized.includes(w))).sort((a,b)=>Number(b.titleNormalized.includes(q))-Number(a.titleNormalized.includes(q)));
   status.textContent=hits.length?`${hits.length} resultaat${hits.length===1?'':'en'}`:'Geen resultaten. Probeer een korter woord of bekijk de zes thema’s.';
   hits.forEach(hit=>{
    const li=document.createElement('li'),a=document.createElement('a'),kind=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('p');
    a.href=section.dataset.base+hit.path;keepRoute(a);kind.className='eyebrow';kind.textContent=hit.kind;title.textContent=hit.title;description.textContent=hit.description;
    a.append(kind,title,description);li.append(a);list.append(li);
   });
  };
  input.addEventListener('input',update);
  form.addEventListener('submit',event=>{event.preventDefault();update();});
  form.addEventListener('reset',()=>{input.value='';update();input.focus();});
 });
})();
