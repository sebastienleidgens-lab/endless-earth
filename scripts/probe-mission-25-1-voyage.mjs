import {readFile,writeFile} from 'node:fs/promises';
import {launch,open251} from './lib/mission-25-1-browser.mjs';
const browser=await launch();
try{
 const g=await open251(browser,5367,{viewport:{width:480,height:320},append:`
 window.p251.simulate=(site,points)=>{
  const provider=scene.userData.aquaticProvider;provider.network.build();
  const a=new PlayerActivity(),b=new PackraftController(a),p={...site.dry};b.launch(p,0,provider,playerWaterClear);for(let i=0;i<50;i++)b.update(.1,p,{forward:0,strafe:0},provider,playerWaterClear);
  let cursor=0,distance=0,last={...p},stalled=0;const trace=[];
  for(let i=0;i<12000;i++){
   while(cursor<points.length-1&&Math.hypot(points[cursor].x-p.x,points[cursor].z-p.z)<1.3)cursor++;
   const q=points[cursor],remaining=Math.hypot(q.x-p.x,q.z-p.z);if(cursor===points.length-1&&remaining<1.5)break;
   const angle=Math.atan2(Math.sin(Math.atan2(q.x-p.x,q.z-p.z)-b.heading),Math.cos(Math.atan2(q.x-p.x,q.z-p.z)-b.heading));
   b.update(.1,p,{forward:Math.abs(angle)<.65?1:0,strafe:Math.max(-1,Math.min(1,angle*1.6-b.yawRate*.9))},provider,playerWaterClear);
   const step=Math.hypot(p.x-last.x,p.z-last.z);distance+=step;stalled=step<.0001?stalled+1:0;last={...p};
   if(i%30===0)trace.push({i,p:{...p},cursor,target:q,angle,speed:b.speed,reason:b.reason,clear:b.clearAt(provider,playerWaterClear,p.x,p.z,b.heading),route:provider.returnRouteVerified(p.x,p.z)});
   if(stalled>60)break;
  }
  return {site,cursor,distance,p,reason:b.reason,trace};
 };`}),p=g.page;
 await p.evaluate(()=>window.p251.network());
 const data=JSON.parse(await readFile('docs/mission-25-1-evidence/water-network.json','utf8'));
 const site=data.accesses.find(a=>a.id==='estimated-bank-64');
 const attach=await p.evaluate(s=>window.p251.attachment(s),site);
 const points=[site.water,{x:-496,z:-712},{x:-500,z:-716},{x:-504,z:-720},{x:-508,z:-724}];
 const simulation=await p.evaluate(a=>window.p251.simulate(...a),[site,points]);await writeFile('work/mission-25-1/voyage-probe.json',JSON.stringify({attach,simulation,errors:g.errors},null,2));console.log(JSON.stringify({attach,last:simulation.trace.at(-1),distance:simulation.distance,errors:g.errors}));
}finally{await browser.close()}
