import {writeFile} from 'node:fs/promises';
import {launch,open251} from './lib/mission-25-1-browser.mjs';
const browser=await launch();
try{
 const {page,errors,environment}=await open251(browser,5367,{viewport:{width:640,height:420}});
 const start=performance.now(),network=await page.evaluate(()=>window.p251.network());
 const components=new Map();for(const n of network.nodes){const a=components.get(n.component)??[];a.push(n);components.set(n.component,a);}
 const rows=[...components].map(([id,nodes])=>({id,nodes:nodes.length,connected:nodes.filter(n=>n.exit).length,bounds:[Math.min(...nodes.map(n=>n.x)),Math.min(...nodes.map(n=>n.z)),Math.max(...nodes.map(n=>n.x)),Math.max(...nodes.map(n=>n.z))]}));
 await writeFile('docs/mission-25-1-evidence/water-network.json',JSON.stringify({base:'66a078c3febb7fed26c72d23f068cb31cbb5b3e2',...network,components:rows,ms:performance.now()-start,errors,environment},null,2));
 console.log(JSON.stringify({metrics:network.metrics,components:rows,accesses:network.accesses.length,errors}));
}finally{await browser.close()}
