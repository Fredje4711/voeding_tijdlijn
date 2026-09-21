import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL,fileURLToPath as fromURL} from 'node:url';
import {parseHTML} from 'linkedom';
import {timeline,topics,sources,glossary} from './inhoud.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='node_modules'||e.name==='.git'?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(root).filter(f=>f.endsWith('.html'));
const parsed=new Map(files.map(f=>[f,parseHTML(fs.readFileSync(f,'utf8')).document]));
let links=0;
for(const [f,doc] of parsed){
 assert.equal(doc.documentElement.lang,'nl',f+' mist Nederlands als documenttaal');
 assert.equal(doc.querySelectorAll('h1').length,1,f+' moet één hoofdtitel hebben');
 assert.ok(doc.querySelector('title')?.textContent.trim(),f+' mist paginatitel');
 assert.ok(doc.querySelector('meta[name=viewport]'),f+' mist viewport');
 assert.ok(doc.querySelector('main'),f+' mist main');
 const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length,f+' heeft dubbele IDs');
 for(const element of doc.querySelectorAll('a[href],link[href],script[src]')){
  const href=element.getAttribute('href')||element.getAttribute('src');
  const target=new URL(href,pathToFileURL(f));
  if(target.protocol!=='file:'){assert.equal(target.protocol,'https:',`${f}: onveilige of onbekende link ${href}`);continue;}
  const targetFile=fromURL(target);
  assert.ok(targetFile.startsWith(root+path.sep),`${f}: verwijzing buiten project ${href}`);
  assert.ok(fs.existsSync(targetFile),`${f}: ontbrekende verwijzing ${href}`);
  if(target.hash){const targetDoc=parsed.get(targetFile);assert.ok(targetDoc?.getElementById(decodeURIComponent(target.hash.slice(1))),`${f}: ontbrekend anker ${href}`);}
  links++;
 }
 const refresh=doc.querySelector('meta[http-equiv=refresh]');
 if(refresh){
  const dest=refresh.content.match(/^0; url=(.+)$/)?.[1];assert.ok(dest,`Ongeldige redirect ${f}`);
  const destURL=new URL(dest,pathToFileURL(f)),destDoc=parsed.get(fromURL(destURL));
  assert.ok(destDoc&&!destDoc.querySelector('meta[http-equiv=refresh]'),`Redirectketen of ontbrekend doel ${f}`);
 }
}
assert.ok(timeline.every((s,i)=>i===0||s.year>=timeline[i-1].year),'Tijdlijn staat niet in chronologische volgorde');
for(const t of topics){assert.ok(timeline.some(s=>s.theme===t.id),`Filter ${t.id} heeft geen stopmomenten`);for(const section of t.sections)for(const k of section[4])assert.ok(sources[k],`Onbekende bron ${k}`);}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const {document,window}=parseHTML(home);
const context=vm.createContext({document,window,console});
vm.runInContext(fs.readFileSync(path.join(root,'assets/zoeken.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/site.js'),'utf8'),context);
const click=el=>el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
for(const t of topics){
 click(document.querySelector(`[data-filter="${t.id}"]`));
 const visible=[...document.querySelectorAll('.timeline-item')].filter(e=>!e.hidden);
 assert.ok(visible.length>0,'Geen resultaten voor '+t.id);
 assert.ok(visible.every(e=>e.dataset.theme===t.id),'Onjuiste filterresultaten voor '+t.id);
 assert.equal(document.querySelectorAll('[data-filter][aria-pressed="true"]').length,1,'Filterselectie niet uniek');
 assert.ok(document.getElementById('timeline-count').textContent.startsWith(String(visible.length)),'Onjuiste resultaatstelling');
}
click(document.querySelector('a[href="#fase-1"]'));
assert.equal([...document.querySelectorAll('.timeline-item')].filter(e=>!e.hidden).length,timeline.length,'Periodelink moet filters herstellen');
assert.ok([...document.querySelectorAll('.timeline-phase')].every(p=>!p.hidden));
const input=document.getElementById('site-search');
const search=q=>{input.value=q;input.dispatchEvent(new window.Event('input',{bubbles:true}));return [...document.querySelectorAll('#search-results li strong')].map(x=>x.textContent);};
assert.deepEqual(search('zaadoliën'),search('zaadolien'),'Zoeken moet accenten verdragen');
assert.ok(search('zaadoliën').some(x=>x.includes('zaadoliën')),'Zaadoliëndossier niet gevonden');
assert.ok(search('diabetes remissie').some(x=>x.includes('Diabetes')),'Zoeken met meerdere woorden mislukt');
assert.ok(search('2026').some(x=>x.includes('2026')),'Nieuwe tijdlijnstop niet vindbaar');
assert.ok(search('HbA1c').includes('HbA1c'),'Begrippen niet doorzoekbaar');
assert.ok(document.querySelector('#search-results a[href="begrippen.html#hba1c"]'),'Zoekresultaat voor begrip moet naar het begrip springen');
assert.equal(search('qzxgeenresultaat').length,0,'Onverwachte resultaten');
assert.ok(document.querySelector('.search-status').textContent.includes('Geen resultaten'),'Geen lege-resultatenbericht');
search('<img src=x onerror=alert(1)>');
assert.equal(document.querySelectorAll('#search-results img').length,0,'Zoektekst mag geen HTML injecteren');
search('suiker');document.querySelector('form').dispatchEvent(new window.Event('reset',{bubbles:true,cancelable:true}));
assert.equal(input.value,'');assert.ok(document.getElementById('search-results').hidden,'Wis verbergt de resultaten niet');
for(const hit of window.voedingIndex){const target=new URL(hit.path,pathToFileURL(path.join(root,'index.html')));assert.ok(parsed.has(fromURL(target)));if(target.hash)assert.ok(parsed.get(fromURL(target)).getElementById(target.hash.slice(1)));}
assert.equal(window.voedingIndex.length,timeline.length+topics.length+glossary.length);
const redirects=JSON.parse(fs.readFileSync(path.join(root,'site/doorverwijzingen.json'),'utf8'));
assert.equal(files.length,timeline.length+topics.length+5+Object.keys(redirects).length,'Er staan onverwachte oude HTML-pagina’s zonder verwerking');
console.log(`OK — ${files.length} HTML-bestanden, ${links} lokale verwijzingen en ankers, ${Object.keys(redirects).length} oude routes.`);
console.log(`OK — ${topics.length} filters, periodeherstel, zoeken met accenten/meerdere woorden, lege resultaten, HTML-invoer, wissen en ${window.voedingIndex.length} zoekdoelen.`);

// Exercise complete reading journeys using the production scripts and real URLs.
function visit(relative,web=false){
 const base=web?'https://example.org/voeding_tijdlijn/':pathToFileURL(root+path.sep).href;
 const address=new URL(relative,base);
 const file=decodeURIComponent(address.pathname.slice(new URL(base).pathname.length));
 const {document:doc,window:win}=parseHTML(fs.readFileSync(path.join(root,file),'utf8'));
 win.location={href:address.href};
 const ctx=vm.createContext({document:doc,window:win,URL,console});
 for(const script of ['route.js','zoeken.js','site.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',script),'utf8'),ctx);
 return {doc,win,address,base};
}
for(const web of [false,true]){
 const first=timeline[1],second=timeline[2];
 const initial=visit('timeline/'+first.file+'.html',web);
 const dossierLink=initial.doc.querySelector('.sidebar-dossier a').href;
 assert.equal(new URL(dossierLink,initial.address).searchParams.get('vanaf'),first.file);
 const dossier=visit('themas/'+first.theme+'.html?vanaf='+first.file,web);
 assert.ok(dossier.doc.querySelector('[data-route-label]').textContent.includes(first.title));
 assert.ok(dossier.doc.querySelector('[data-route-back]').href.endsWith(first.file+'.html#kern'));
 assert.ok(dossier.doc.querySelector('[data-route-next]').href.endsWith(second.file+'.html'));
 const other=dossier.doc.querySelector('.related a');
 assert.equal(new URL(other.href,dossier.address).searchParams.get('vanaf'),first.file,'Tweede dossier vergeet vertrekpunt');
 const otherURL=new URL(other.href,dossier.address);
 const deeper=visit(otherURL.href.slice(dossier.base.length),web);
 assert.ok(deeper.doc.querySelector('[data-route-back]').href.endsWith(first.file+'.html#kern'));
 const glossaryPage=visit('begrippen.html?vanaf='+first.file+'#hba1c',web);
 const searchInput=glossaryPage.doc.querySelector('input');searchInput.value='zaadoliën';searchInput.dispatchEvent(new glossaryPage.win.Event('input'));
 const result=glossaryPage.doc.querySelector('#search-results a[href*="themas/"]');
 assert.equal(new URL(result.href,glossaryPage.address).searchParams.get('vanaf'),first.file,'Zoekresultaten vergeten vertrekpunt');
 const overview=visit('index.html?vanaf='+first.file+'#stop-'+first.file,web);
 assert.equal(overview.doc.querySelector('[data-home-route]').hidden,true,'Overzicht mag een oude terugweg niet als actuele keuze tonen');
 assert.ok(!overview.doc.body.classList.contains('has-route'));
 assert.ok(!overview.doc.querySelector('.topic-card').href.includes('vanaf='),'Nieuwe themakeuze in overzicht mag oud tijdsmoment niet erven');
 assert.ok(overview.doc.getElementById('stop-'+first.file));
 const newStop=visit('timeline/'+second.file+'.html?vanaf='+first.file,web);
 assert.ok(newStop.doc.querySelector('[data-route-back]').href.endsWith(second.file+'.html#kern'),'Nieuw tijdsmoment moet vertrekpunt vervangen');
 const last=visit('timeline/'+timeline.at(-1).file+'.html',web);
 assert.ok(last.doc.querySelector('[data-route-next]').textContent.includes('Afgerond'));
 assert.ok(last.doc.querySelector('[data-route-next]').href.includes('index.html'));
 const direct=visit('themas/vetten.html',web);
 assert.equal(direct.doc.querySelector('[data-route-back]').textContent,'Terug naar de tijdlijn');
 const invalid=visit('themas/vetten.html?vanaf=onbekend',web);
 assert.equal(invalid.doc.querySelector('[data-route-back]').textContent,'Terug naar de tijdlijn');
 for(const a of dossier.doc.querySelectorAll('a[href]'))if(a.href.startsWith('https:')&&!a.href.startsWith(dossier.base))assert.ok(!a.href.includes('vanaf='),'Externe bron werd aangepast');
 assert.ok(!dossier.doc.querySelector('.related').hasAttribute('open'),'Zijpaden moeten standaard ingeklapt zijn');
 for(const stop of timeline){
  const current=visit('timeline/'+stop.file+'.html?vanaf='+first.file,web);
  assert.equal(current.doc.querySelector('[data-route-label]').textContent,'U leest nu: '+stop.year+' · '+stop.title);
  const contextLink=new URL(current.doc.querySelector('.sidebar-dossier a').href,current.address);
  assert.equal(contextLink.searchParams.get('vanaf'),stop.file,'Dossier moet het nieuw gekozen tijdsmoment onthouden');
  const side=visit(contextLink.href.slice(current.base.length),web);
  assert.ok(side.doc.querySelector('[data-route-back]').href.endsWith(stop.file+'.html#kern'));
 }
}
console.log('OK — leesroutes via meerdere dossiers, begrippen en zoeken; terug naar de kern, overzicht, nieuw vertrekpunt, einde en onbekende invoer, voor lokale bestanden en webadressen.');

for(const web of [false,true]){
 const start=visit('index.html',web);
 const size=start.doc.querySelector('[data-text-size]');
 assert.equal(start.doc.querySelectorAll('.reading-tools button, .reading-tools a').length,1,'Leesbediening moet precies één knop hebben');
 assert.equal(size.textContent,'Grote letters');
 size.dispatchEvent(new start.win.Event('click'));
 assert.equal(size.textContent,'Kleine letters');
 assert.ok(start.doc.documentElement.classList.contains('large-text'));
 assert.equal(size.getAttribute('aria-pressed'),'true');
 const firstLink=new URL(start.doc.querySelector('.hero-actions a').href,start.address);
 assert.equal(firstLink.searchParams.get('tekst'),'groot');
 const large=visit(firstLink.href.slice(start.base.length),web);
 assert.ok(large.doc.documentElement.classList.contains('large-text'));
 const side=new URL(large.doc.querySelector('.extra-reading a').href,large.address);
 assert.equal(side.searchParams.get('tekst'),'groot');
 assert.equal(side.searchParams.get('vanaf'),timeline[0].file);
 const dossier=visit(side.href.slice(large.base.length),web);
 assert.ok(dossier.doc.documentElement.classList.contains('large-text'));
 dossier.doc.querySelector('[data-text-size]').dispatchEvent(new dossier.win.Event('click'));
 assert.equal(dossier.doc.querySelector('[data-text-size]').textContent,'Grote letters');
 assert.ok(!dossier.doc.documentElement.classList.contains('large-text'));
 assert.ok(!dossier.doc.querySelector('[data-route-back]').href.includes('tekst='));
 const reader=visit('leesversie.html?tekst=groot',web);
 assert.equal(reader.doc.querySelectorAll('.continuous-stop').length,17);
 assert.equal(reader.doc.querySelectorAll('.period-balance').length,3);
 assert.equal(reader.doc.querySelectorAll('.continuous-stop h4').length,51);
 let printed=false;reader.win.print=()=>{printed=true;};
 reader.doc.querySelector('[data-print]').dispatchEvent(new reader.win.Event('click'));
 assert.ok(printed,'Afdrukknop moet afdrukdialoog aanroepen');
 for(const [i,stop] of timeline.entries()){
  const page=visit('timeline/'+stop.file+'.html',web);
  assert.deepEqual([...page.doc.querySelectorAll('.prose h2')].map(h=>h.textContent),['Wat gebeurde er?','Waarom hoort dit in het verhaal?','Wat weten we, en waarover bestaat discussie?']);
  assert.equal(page.doc.querySelectorAll('.period-balance').length,!timeline[i+1]||timeline[i+1].phase!==stop.phase?1:0);
  assert.ok(page.doc.querySelector('[data-route-back]').hidden,'Tijdsmoment heeft vorige/overzicht/volgende, geen overbodige terugknop naar zichzelf');
  assert.equal(page.doc.querySelectorAll('.route-dock').length,2);
 }
 assert.ok(visit('timeline/2024-diabetesremissie.html',web).doc.querySelector('.word-explanation'));
}
console.log('OK — grotere letters blijven behouden tijdens doorklikken; terugschakelen, 17 vaste paginaopbouwen, 3 tussenbalansen en de doorlopende afdrukversie.');
