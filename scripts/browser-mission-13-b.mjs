import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const out='docs/mission-13-evidence/materials';await mkdir(out,{recursive:true});
const catalog=JSON.parse(await readFile('public/materials/authentic/catalog.json','utf8'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:650}}),errors=[],external=[];
 page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('request',r=>{if(!new URL(r.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/))external.push(r.url())});
 await page.goto('http://localhost:5173/endless-earth/fixtures/materials.html?perf=1&hold=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z');
 await page.waitForFunction(()=>window.materialLab?.ready);await page.evaluate(()=>document.body.setAttribute('data-capture',''));
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,ua:navigator.userAgent,pixelRatio:devicePixelRatio}});
 const rows=[];
 async function scenario(id,moment='afternoon',weather='clear',distance='close',capture=true){
  await page.evaluate(({id,moment,weather,distance})=>{window.materialLab.choose(id,distance);for(const [label,value] of [['Moment de la journée',moment],['Météo simulée',weather]]){const s=document.querySelector('[aria-label="'+label+'"]');s.value=value;s.dispatchEvent(new Event('change'))}for(let i=0;i<30;i++)window.materialLab.step(1);window.materialLab.render()},{id,moment,weather,distance});
  const state=await page.evaluate(()=>window.materialLab.state());
  assert.deepEqual(state.geometryPositions[0],state.geometryPositions[1]);assert.deepEqual(state.geometryPositions[0],state.geometryPositions[2]);
  const name=`${id}-${distance}-${moment}-${weather}.jpg`;
  if(capture)await page.screenshot({path:out+'/'+name,type:'jpeg',quality:89});
  rows.push({id,moment,weather,distance,image:capture?name:null,camera:state.camera,projection:state.projection,metres:state.metres,scaleStatus:state.scaleStatus,identities:state.identities,climate:{date:state.climate.date,weather:state.climate.weather,moment:state.climate.moment},positionsIdentical:true});
 }
 for(const e of catalog.entries){await scenario(e.id);console.log('Captured',e.id)}
 for(const id of ['stone-rubble','plaster-worn','roof-flat','gravel'])await scenario(id,'afternoon','clear','wide');
 const lighting=[['morning','clear'],['afternoon','clear'],['evening','clear'],['night','clear'],['afternoon','overcast'],['afternoon','rain'],['evening','rain']];
 for(const e of catalog.entries)for(const [moment,weather] of lighting)await scenario(e.id,moment,weather,'close',e.id==='stone-rubble'||e.id==='roof-flat');
 for(const e of catalog.entries){await scenario(e.id,'afternoon','clear','far',e.id==='stone-rubble');}
 const bench=[];await page.setViewportSize({width:800,height:600});
 for(const profile of ['eco','balanced','quality']){
  await page.evaluate(p=>window.materialLab.profile(p),profile);
  for(const id of ['stone-rubble','roof-flat','gravel']){
   await scenario(id,'afternoon','clear','close',false);
   for(let round=0;round<3;round++)for(const approach of (round%2?['hybrid','photographic','procedural']:['procedural','photographic','hybrid'])){
    await page.evaluate(a=>window.materialLab.synchronized(a),approach);
    const samples=[];for(let i=0;i<5;i++)samples.push(await page.evaluate(a=>window.materialLab.synchronized(a),approach));
    const s=await page.evaluate(()=>window.materialLab.state());bench.push({profile,id,round,approach,samples,camera:s.camera,projection:s.projection,climate:s.climate.date});
   }
  }
 }
 const cdp=await page.context().newCDPSession(page),cycles=[];
 await page.evaluate(()=>{window.materialLab.profile('balanced');window.materialLab.choose('stone-rubble')});
 for(let i=0;i<4;i++){
  if(i)await page.evaluate(()=>window.materialLab.reload());
  await page.evaluate(()=>window.materialLab.render());await cdp.send('HeapProfiler.collectGarbage');
  const s=await page.evaluate(()=>window.materialLab.state());cycles.push({cycle:i,memory:s.memory,programs:s.programs,identities:s.identities,heap:await cdp.send('Runtime.getHeapUsage')});
 }
 assert.deepEqual(cycles[1].memory,cycles[3].memory);assert.deepEqual(cycles[0].identities,cycles[3].identities);assert.equal(cycles[1].programs,cycles[3].programs);
 // An invalid new atlas must not destroy an already loaded library.
 await page.route('**/materials/authentic/hybrid.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from('invalid')}));
 await page.evaluate(()=>window.materialLab.reload());assert.ok(await page.evaluate(()=>window.materialLab.ready));assert.match(await page.locator('#status').innerText(),/dernier état conservé/);
 const corruptState=await page.evaluate(()=>window.materialLab.state());assert.deepEqual(corruptState.identities,cycles[3].identities);await page.unroute('**/materials/authentic/hybrid.png');
 await page.evaluate(()=>window.materialLab.reload());
 await page.evaluate(()=>document.body.removeAttribute('data-capture'));await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.materialLab.render());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:out+'/mobile.jpg',type:'jpeg',quality:86});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const quantile=(xs,p)=>{const a=[...xs].sort((a,b)=>a-b),x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.ceil(x)]-a[i])*(x-i)};
 const metrics=[];
 for(const profile of ['eco','balanced','quality'])for(const id of ['stone-rubble','roof-flat','gravel'])for(const approach of ['photographic','procedural','hybrid']){
  const samples=bench.filter(r=>r.profile===profile&&r.id===id&&r.approach===approach).flatMap(r=>r.samples),ms=samples.map(s=>s.ms);
  metrics.push({profile,id,approach,n:ms.length,medianMs:quantile(ms,.5),p95Ms:quantile(ms,.95),maxMs:Math.max(...ms),calls:samples[0].calls,triangles:samples[0].triangles});
 }
 await writeFile(out+'/measurements.json.gz',gzipSync(JSON.stringify({environment,rows,bench,cycles,corruptState:{memory:corruptState.memory,identities:corruptState.identities},errors,external}),{level:9,mtime:0}));
 await writeFile(out+'/summary.json',JSON.stringify({method:'Synthetic metric specimens in one real WebGL renderer, same camera/positions, Mission 11 sky frozen for each triptych. Photographic is Standard PBR with source height/roughness; procedural uses actual Mission 12 architecture/ground shaders and atlases; hybrid uses one packed Lambert atlas and shared DNA. Not integrated in the geographic pilot.',environment,materials:catalog.entries.length,lightingCases:lighting,allMaterialLightingChecks:catalog.entries.length*lighting.length,screenshots:[...new Set(rows.filter(r=>r.image).map(r=>r.image))],renderSamples:bench.reduce((n,r)=>n+r.samples.length,0),metrics,cycles,corruptReloadKeptLastGood:true,mobile:[390,844],errors,external,limitations:['SwiftShader synchronized render/full framebuffer readback costs, not physical GPU FPS','15 timing samples per approach/profile/specimen; P95 is descriptive of this bounded run','Resident lab includes all three approaches; per-approach GPU bytes are catalogue estimates','No geographic material integration or new walking video before 13C approval']},null,2)+'\n');
 console.log('PASS 10 materials, 70 light/weather checks, 405 timed renders, reloads, corrupt reload, mobile, no third-party requests');
}finally{await browser.close()}
