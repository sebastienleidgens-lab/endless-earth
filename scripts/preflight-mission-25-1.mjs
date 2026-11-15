import {readFile,writeFile} from 'node:fs/promises';
import {launch,open251} from './lib/mission-25-1-browser.mjs';
const browser=await launch();
try{
 const probe=await readFile('scripts/probe-mission-25-1-voyage.mjs','utf8'),append=probe.split('append:`')[1].split('`}),p=g.page;')[0];
 const g=await open251(browser,5367,{viewport:{width:480,height:320},append}),p=g.page;
 const network=await p.evaluate(()=>window.p251.network());console.log('NETWORK',network.metrics);
 const rows=[];
 for(const component of [3,5]){
  const candidates=network.nodes.filter(n=>n.component===component&&n.exit).sort((a,b)=>a.z-b.z);let site;
  for(const n of candidates){const a=network.accesses.find(a=>a.id===n.exit);if(a&&Math.hypot(n.x-a.water.x,n.z-a.water.z)<10){site=a;break;}}
  const attach=await p.evaluate(site=>window.p251.attachment(site),site);console.log('ATTACH',component,attach);
  const lookup=new Map(network.nodes.map(n=>[n.x+','+n.z,n])),source=lookup.get(attach.x+','+attach.z),queue=[source],parent=new Map([[source.x+','+source.z,null]]),dist=new Map([[source.x+','+source.z,0]]);let target=source;
  for(let i=0;i<queue.length;i++){const n=queue[i],key=n.x+','+n.z,d=dist.get(key);if(d>dist.get(target.x+','+target.z))target=n;for(const [x,z]of n.links){const k=x+','+z;if(parent.has(k))continue;parent.set(k,key);dist.set(k,d+Math.hypot(n.x-x,n.z-z));queue.push(lookup.get(k));}}
  let key=target.x+','+target.z;const route=[];while(key){const n=lookup.get(key);route.push({x:n.x,z:n.z});key=parent.get(key);}route.reverse();let length=0,end=1;for(;end<route.length;end++){length+=Math.hypot(route[end].x-route[end-1].x,route[end].z-route[end-1].z);if(length>275)break;}
  const leg=route.slice(0,end+1),points=[site.water,...leg,...leg.slice(0,-1).reverse(),site.water];
  const result=await p.evaluate(a=>window.p251.simulate(...a),[site,points]);rows.push({component,points,result,available:dist.get(target.x+','+target.z)});console.log('RESULT',component,result.distance,result.cursor,points.length,result.reason,result.trace.at(-1));
 }
 await writeFile('docs/mission-25-1-evidence/navigation-preflight.json',JSON.stringify({method:'Accelerated controller simulation on the actual loaded pilot, NOT a native video or elapsed real-world navigation duration.',rows,errors:g.errors,environment:g.environment},null,2));
}finally{await browser.close()}
