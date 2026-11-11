// Appearance-only regional proof: exact geometry and tree identity comparisons.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const out='docs/mission-13-evidence/optimization',sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info']}),rows=[],errors=[],requests=[];
try{
 const p=await b.newPage({viewport:{width:960,height:640}});p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(r.url().includes('/materials/france/'))requests.push(r.url())});await p.addInitScript(()=>window.fixtureHold=true);
 await p.goto('http://localhost:5173/endless-earth/fixtures/regions.html?materials=hybrid&fixture=atlantic-village&region=poitou&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z');await p.waitForFunction(()=>window.regionalFixture?.ready);
 await p.addStyleTag({content:'header,footer,.nature-controls{visibility:hidden}#material-proof{position:fixed;top:12px;left:12px;background:#142820ed;color:#eee8d2;padding:10px;z-index:4;font:14px system-ui;max-width:80vw}'});
 for(const fixture of ['atlantic-village','mediterranean-rock'])for(const region of ['poitou','atlantic','mediterranean']){
  await p.evaluate(async({fixture,region})=>{const a=window.regionalFixture;a.view();await a.choose(fixture,region);a.view();for(let i=0;i<240;i++)a.advance(1);for(let i=0;i<75;i++)a.advance(0);a.step(0);let label=document.querySelector('#material-proof');if(!label){label=document.createElement('div');label.id='material-proof';document.body.append(label)}label.textContent='SCÈNE SYNTHÉTIQUE · matières '+region+' · dimensions et relief fixes'},{fixture,region});
  const s=await p.evaluate(()=>window.regionalFixture.state(true));s.physicalSha256=sha(s.physicalMeshes);s.treeSha256=sha(s.trees);delete s.physicalMeshes;delete s.terrainPositions;delete s.trees;
  assert.equal(s.roadWidthM,5.5);assert.equal(s.humanHeightM,1.65);assert.equal(s.authentic.active,'hybrid');assert.ok(s.authentic.cache.resident<=2);
  await p.screenshot({path:`${out}/fixture-${fixture}-${region}.jpg`,type:'jpeg',quality:90});await p.evaluate(()=>{window.regionalFixture.view(true);for(let i=0;i<75;i++)window.regionalFixture.advance(0);window.regionalFixture.step(0)});await p.screenshot({path:`${out}/fixture-${fixture}-${region}-close.jpg`,type:'jpeg',quality:90});await p.evaluate(()=>{window.regionalFixture.materialView();for(let i=0;i<75;i++)window.regionalFixture.advance(0);window.regionalFixture.step(0)});await p.screenshot({path:`${out}/fixture-${fixture}-${region}-material.jpg`,type:'jpeg',quality:90});rows.push(s);console.log('PASS synthetic',fixture,region,s.physicalSha256.slice(0,8));
 }
 for(const fixture of ['atlantic-village','mediterranean-rock']){const rs=rows.filter(r=>r.fixture===fixture);assert.equal(new Set(rs.map(r=>r.physicalSha256)).size,1,'physical attributes must survive style changes');assert.equal(new Set(rs.map(r=>r.treeSha256)).size,1,'tree anchors/classes/scales must survive style changes')}
 // Each retained family is also shown in less flattering weather/light.
 for(const [fixture,region] of [['atlantic-village','atlantic'],['mediterranean-rock','mediterranean']]){
  await p.evaluate(async({fixture,region})=>{window.regionalFixture.view();await window.regionalFixture.choose(fixture,region);window.regionalFixture.view(true)},{fixture,region});
  for(const [moment,weather] of [['morning','clear'],['evening','rain'],['night','clear']]){
   await p.evaluate(({moment,weather})=>{for(const [name,value] of [['Moment de la journée',moment],['Météo simulée',weather]]){const e=document.querySelector('[aria-label="'+name+'"]');e.value=value;e.dispatchEvent(new Event('change'))}for(let i=0;i<240;i++)window.regionalFixture.advance(1);window.regionalFixture.step(0)},{moment,weather});await p.screenshot({path:`${out}/fixture-${region}-${moment}-${weather}.jpg`,type:'jpeg',quality:90});
  }
 }
 const cdp=await p.context().newCDPSession(p);await cdp.send('HeapProfiler.collectGarbage');const heapBefore=await cdp.send('Runtime.getHeapUsage'),cycles=[];
 for(let i=0;i<12;i++){
  const region=['poitou','atlantic','mediterranean'][i%3];await p.evaluate(async region=>{const a=window.regionalFixture;a.view();await a.choose('atlantic-village',region);for(let i=0;i<75;i++)a.advance(0);a.step(0)},region);const s=await p.evaluate(()=>window.regionalFixture.state());assert.ok(s.authentic.cache.resident<=2&&s.authentic.cache.gpuBytesEstimate<=829356);cycles.push({region,memory:s.memory,programs:s.programs,cache:s.authentic.cache,trees:sha(s.trees)});
 }
 for(let i=0;i<3;i++){const rs=cycles.filter(r=>r.region===['poitou','atlantic','mediterranean'][i]);assert.deepEqual(rs.at(-1).memory,rs.at(-2).memory);assert.equal(new Set(rs.map(r=>r.trees)).size,1)}
 await p.evaluate(async()=>{const a=window.regionalFixture;await Promise.all([a.choose('atlantic-village','atlantic'),a.choose('atlantic-village','poitou'),a.choose('atlantic-village','mediterranean')]);a.step(0)});assert.equal((await p.evaluate(()=>window.regionalFixture.state())).authentic.region,'mediterranean');
 await cdp.send('HeapProfiler.collectGarbage');const heapAfter=await cdp.send('Runtime.getHeapUsage');
 await p.setViewportSize({width:390,height:844});await p.addStyleTag({content:'header,footer,.nature-controls{visibility:visible}#material-proof{display:none}'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:out+'/fixture-mobile.jpg',type:'jpeg',quality:86});assert.deepEqual(errors,[]);
 await writeFile(out+'/regional-fixtures.json.gz',gzipSync(JSON.stringify({method:'Two explicitly synthetic landscapes × three appearance-only contexts; positions, normals, UVs and indices of all meshes plus complete tree anchors/classes/scales hashed identically across contexts. Heights/roof pitches/roads/building footprints fixed. Twelve cache changes and a concurrent stale-load race. No claim of actual Atlantic/Mediterranean towns.',rows,cycles,heapBefore,heapAfter,requests,errors}),{level:9,mtime:0}));console.log('PASS regional physical identity, bounded two-context pool, repeated identities, concurrent selection, mobile');
}finally{await b.close()}
