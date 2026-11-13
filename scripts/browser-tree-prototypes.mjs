import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launch,open17,settle} from './lib/mission-17-browser.mjs';
const dir='docs/mission-17-evidence',port=Number(process.env.MISSION17_PORT??5317);
await mkdir(dir+'/prototypes',{recursive:true});await mkdir(dir+'/game',{recursive:true});await mkdir(dir+'/methods',{recursive:true});
const browser=await launch(),rows=[],errors=[];
try{
 const p=await browser.newPage({viewport:{width:1000,height:760}});p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.addInitScript(()=>window.tree17Hold=true);
 await p.goto(`http://localhost:${port}/endless-earth/fixtures/trees.html?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);await p.waitForFunction(()=>window.tree17?.ready);await p.addStyleTag({content:'header,footer,.nature-controls,#title{display:none}'});
 const environment=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}});
 for(const id of ['spreading','slender','riverside','young']){
  for(const season of ['summer','winter'])for(const angle of ['front','profile','three-quarter','below']){
   await p.evaluate(([id,s,v])=>window.tree17.choose(id,s,v),[id,season,angle]);const file=`prototypes/${id}-${season}-${angle}.jpg`;await p.screenshot({path:dir+'/'+file,type:'jpeg',quality:86});rows.push({kind:'workshop',id,season,angle,file,state:await p.evaluate(()=>window.tree17.state())});
  }
  for(const season of ['spring','autumn']){await p.evaluate(([id,s])=>window.tree17.choose(id,s),[id,season]);const file=`prototypes/${id}-${season}.jpg`;await p.screenshot({path:dir+'/'+file,type:'jpeg',quality:86});rows.push({kind:'workshop',id,season,angle:'three-quarter',file,state:await p.evaluate(()=>window.tree17.state())})}
 }
 for(const season of ['summer','winter']){await p.evaluate(s=>window.tree17.choose('all',s),season);const file=`prototypes/all-${season}.jpg`;await p.screenshot({path:dir+'/'+file,type:'jpeg',quality:90});rows.push({kind:'same-scale',season,file,state:await p.evaluate(()=>window.tree17.state())})}
 // Equal camera, light and metric scene; the supplier remains an offline sample.
 await p.evaluate(()=>window.tree17.choose('slender'));await p.evaluate(()=>window.tree17.camera([-23+24,9,28],[-23,8,0],43));
 // Move only the camera to inspect the original slender at its own fixed anchor.
 await p.evaluate(()=>window.tree17.camera([20,9,28],[-4,8,0],43));await p.screenshot({path:dir+'/methods/original-slender.jpg',type:'jpeg',quality:88});
 const before=await p.evaluate(()=>window.tree17.state());const supplier=await p.evaluate(()=>window.tree17.sapling());await p.evaluate(()=>window.tree17.camera([1,9,28],[-23,8,0],43));await p.screenshot({path:dir+'/methods/sapling.jpg',type:'jpeg',quality:88});
 await writeFile(dir+'/methods/evaluation.json',JSON.stringify({method:'Actual Blender Sapling 0.3.6 evaluated mesh imported into the same Three.js workshop, native metres, identical camera relative to the tree, FOV, daylight and colour palette. Different shapes and leaf counts, not a matched quality benchmark. Original generator offers explicit graph/leaf attachment. No claim that Sapling cannot be tuned better.',supplier,original:before,source:JSON.parse(await readFile('work/mission-17/sapling-evaluation.json','utf8')).tool},null,2)+'\n');
 await p.close();
 const g=await open17(browser,{query:'&lighting=off'}),q=g.page;await q.addStyleTag({content:'.walk-menu-button,.menu-toggle,.build-badge,.perf-panel{visibility:hidden}'});await q.evaluate(()=>window.c15.setup(['inspection',-430,340,1,-.12,0,'first']));await settle(q);
 const trees=await q.evaluate(()=>window.t17.trees()),tree=trees.filter(t=>!t.needle&&Math.hypot(t.x+430,t.z-340)<80).sort((a,b)=>Math.hypot(a.x+430,a.z-340)-Math.hypot(b.x+430,b.z-340))[0];await q.evaluate(t=>window.t17.isolate(t.cell,t.index),tree);
 for(const id of ['spreading','slender','riverside','young']){
  const metrics=await q.evaluate(({id,t})=>window.t17.prototype(id,t),{id,t:tree});
  for(const [season,date]of [['summer','2026-06-21'],['autumn','2026-10-21'],['winter','2026-01-21']]){
   await q.evaluate(d=>window.t17.season(d),date);
   for(const distance of [5,15,40]){
    const top=metrics.bounds[4],target=[tree.x,tree.ground+top*.5,tree.z],position=[tree.x+distance*.707,tree.ground+Math.min(top*.5,6),tree.z+distance*.707];
    await q.evaluate(({position,target})=>window.t17.camera(position,target,55),{position,target});
    for(const version of ['before','after']){await q.evaluate(v=>{window.t17.originalVisible(v==='before');window.t17.render()},version);const file=`game/${id}-${season}-${distance}m-${version}.jpg`;await q.screenshot({path:dir+'/'+file,type:'jpeg',quality:85});rows.push({kind:'game',id,season,distance,version,file,tree,metrics,state:await q.evaluate(()=>window.t17.state())})}
   }
  }
 }
 errors.push(...g.errors);assert.deepEqual(errors,[]);
 await writeFile(dir+'/captures.json',JSON.stringify({baseline:'9cde6af',method:'Real Three.js + unmodified Mission16 main.ts, scene, terrain, sky, calendar, weather and renderer. Explicit diagnostic single-tree isolation; only the inspected mesh changes. Paired camera/climate held between before and after. Fine M14 solar cache disabled for BOTH in-world variants to avoid applying stale crown shadows. No geographic anchor edited, no production forest replaced. 5m views intentionally crop large trees for near inspection; 15/40m show full form. Workshop uses original shared naturalSky and native walker.',environment,rows,errors,warnings:g.warnings},null,2)+'\n');console.log(JSON.stringify({captures:rows.length,errors,environment}));
}finally{await browser.close()}
