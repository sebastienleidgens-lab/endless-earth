import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {launch,open251,settle} from './lib/mission-25-1-browser.mjs';
import {indexNativeWebM} from './lib/native-webm.mjs';
const out='docs/mission-25-1-evidence',port=Number(process.env.M251_PORT??5367);
await mkdir('work/mission-25-1/raw',{recursive:true});
const network=JSON.parse(await readFile(out+'/water-network.json','utf8'));
const lookup=new Map(network.nodes.map(n=>[`${n.x},${n.z}`,n]));
function pathBetween(start,component){
 const queue=[start],previous=new Map([[`${start.x},${start.z}`,null]]),distances=new Map([[`${start.x},${start.z}`,0]]);let target=start;
 for(let i=0;i<queue.length;i++){
  const n=queue[i],key=`${n.x},${n.z}`,d=distances.get(key);if(d>distances.get(`${target.x},${target.z}`))target=n;
  for(const [x,z]of n.links){const k=`${x},${z}`,other=lookup.get(k);if(previous.has(k)||other.component!==component)continue;previous.set(k,key);distances.set(k,d+Math.hypot(x-n.x,z-n.z));queue.push(other);}
 }
 const path=[];let k=`${target.x},${target.z}`;while(k){path.push(lookup.get(k));k=previous.get(k);}path.reverse();
 let length=0,end=1;for(;end<path.length;end++){length+=Math.hypot(path[end].x-path[end-1].x,path[end].z-path[end-1].z);if(length>=275)break;}
 const leg=path.slice(0,end+1).map(n=>({x:n.x,z:n.z}));return {points:[...leg,...leg.slice(0,-1).reverse()],oneWay:length,available:distances.get(`${target.x},${target.z}`)};
}
const browser=await launch(),results=[];
try{
 for(const component of process.argv[2]?process.argv[2].split(',').map(Number):[3,5]){
  const game=await open251(browser,port,{viewport:{width:640,height:420}}),p=game.page;
  const nodes=network.nodes.filter(n=>n.component===component&&n.exit).sort((a,b)=>a.z-b.z);
  let selected=null;
  for(const n of nodes){const site=network.accesses.find(a=>a.id===n.exit);if(!site)continue;const dx=n.x-site.water.x,dz=n.z-site.water.z;if(Math.hypot(dx,dz)<10){selected={node:n,site};break;}}
  if(!selected)throw Error('No genuine bank connected to component '+component);
  await p.evaluate(()=>window.p251.network());const attachment=await p.evaluate(site=>window.p251.attachment(site),selected.site);if(!attachment||attachment.component!==component)throw Error('Bank attachment mismatch');selected.node=lookup.get(`${attachment.x},${attachment.z}`);
  const route=pathBetween(selected.node,component);route.points.unshift({...selected.site.water});route.points.push({...selected.site.water});
  await p.evaluate(s=>window.p25.bank(s),selected.site);await settle(p);
  await p.evaluate(()=>window.p251.network()); // Complete the same native surface network before timing.
  await p.locator('canvas').click({position:{x:550,y:210}});await p.evaluate(()=>window.p25.audio());
  await p.evaluate(()=>{window.c15.native(true);window.c15.record()});
  await p.locator('#action-boat').click();await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='boating');
  await p.evaluate(points=>window.p251.route(points),route.points);
  const started=Date.now(),trace=[],name='voyage-'+component;let previous=null,distance=0,stalled=0;
  while((Date.now()-started)/1000<1050){
   await p.waitForTimeout(1000);
   const state=await p.evaluate(()=>({state:window.p251.state(),driver:window.p251.driver}));
   const position=state.state.position;
   const step=previous?Math.hypot(position[0]-previous[0],position[2]-previous[2]):0;distance+=step;stalled=step<.02?stalled+1:0;previous=position;
   trace.push({seconds:(Date.now()-started)/1000,distance,...state});
   if(trace.length%30===0){console.log(name,Math.round(trace.at(-1).seconds)+'s',distance.toFixed(1)+'m',state.driver);await writeFile(out+'/'+name+'-progress.json',JSON.stringify({distance,last:trace.at(-1),errors:game.errors},null,2));}
   if(state.driver?.done&&trace.at(-1).seconds>=610)break;
   if(stalled>60){console.log('STALLED',name,state);break;}
  }
  await p.evaluate(()=>window.p251.stopDriver());
  await p.locator('#action-recover').click();
  let docking='not completed';try{await p.waitForFunction(()=>window.endlessPlayerDiagnostics.state==='walking',{},{timeout:120000});docking='walking';}catch{}
  await p.waitForTimeout(1000);const bytes=await p.evaluate(()=>window.c15.stop()),frames=await p.evaluate(()=>{window.c15.native(false);return window.cFrames;});
  await writeFile(out+'/'+name+'.webm',Buffer.from(bytes));const media=await indexNativeWebM(out+'/'+name+'.webm','work/mission-25-1/raw/'+name+'.webm');
  const result={name,component,site:selected.site,route,seconds:(Date.now()-started)/1000,distance,docking,trace,frames,media,errors:game.errors,environment:game.environment,method:'Native wall-clock video + AudioContext mix. Diagnostic placement at a verified dry bank before recording. Diagnostic waypoint driver supplies only forward/turn inputs to the unchanged production PackraftController; no position assignment during voyage. True loaded Anglin, estimated game depth. Software SwiftShader.'};
  await writeFile(out+'/'+name+'.json',JSON.stringify(result,null,2));results.push({name,distance,seconds:result.seconds,docking,errors:game.errors});await p.close();console.log('FINISHED',results.at(-1));
 }
 await writeFile(out+'/voyages.json',JSON.stringify(results,null,2));
}finally{await browser.close()}
