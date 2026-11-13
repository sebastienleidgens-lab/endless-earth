import {writeFile,mkdir} from 'node:fs/promises';
import {launch,open17,settle} from './lib/mission-17-browser.mjs';
const dir='docs/mission-17-evidence/audit';await mkdir(dir,{recursive:true});
const b=await launch();try{
 const g=await open17(b),p=g.page;await p.addStyleTag({content:'.perf-panel,.build-badge,.menu-trigger,.help{visibility:hidden}'});
 await p.evaluate(()=>window.c15.setup(['bois',-430,340,1,-.12,0,'first']));await settle(p);
 const trees=await p.evaluate(()=>window.t17.trees());await writeFile('work/mission-17/trees.json',JSON.stringify(trees));
 const tree=trees.filter(t=>!t.needle&&Math.hypot(t.x+430,t.z-340)<80).sort((a,b)=>Math.hypot(a.x+430,a.z-340)-Math.hypot(b.x+430,b.z-340))[0];
 await p.evaluate(t=>window.t17.isolate(t.cell,t.index),tree);
 const rows=[];
 for(const [season,date]of [['summer','2026-06-21'],['autumn','2026-10-21'],['winter','2026-01-21']]){
  await p.evaluate(date=>window.t17.season(date),date);
  for(const [angle,a]of [['front',0],['profile',Math.PI/2],['three-quarter',Math.PI/4],['below',Math.PI*.7]]){
   await p.evaluate(({t,a,angle})=>window.t17.camera([t.x+Math.sin(a)*(angle==='below'?4:20),t.y+(angle==='below'?-1:5),t.z+Math.cos(a)*(angle==='below'?4:20)],[t.x,t.y+4,t.z],angle==='below'?65:45),{t:tree,a,angle});
   await p.evaluate(()=>window.t17.render());const file=season+'-'+angle+'.jpg';await p.screenshot({path:dir+'/'+file,type:'jpeg',quality:87});rows.push({season,angle,file,state:await p.evaluate(()=>window.t17.state())});
  }
 }
 await p.evaluate(t=>{window.t17.season('2026-10-21');window.t17.camera([t.x+14,t.y+5,t.z+14],[t.x,t.y+4,t.z]);},tree);
 for(const [id,retention,wind]of [['autumn-calendar',null,1],['autumn-no-season-mask',1,1],['autumn-no-wind',null,0]]){
  await p.evaluate(({retention,wind})=>{window.t17.season('2026-10-21');if(retention!==null)window.t17.retention(retention);window.t17.wind(wind);window.t17.render()},{retention,wind});await p.screenshot({path:dir+'/'+id+'.jpg',type:'jpeg',quality:90});rows.push({ablation:id,file:id+'.jpg',state:await p.evaluate(()=>window.t17.state())});
 }
 await writeFile(dir+'/captures.json',JSON.stringify({baseline:'9cde6af',method:'Unmodified Mission16 tree geometry, materials, calendar and climate; actual main.ts engine. Explicit single-tree isolation hides other tree cells for inspection. Terrain/buildings/lights retained. Owner screenshots unavailable in attachment.',tree,environment:g.environment,rows,errors:g.errors,warnings:g.warnings},null,2)+'\n');console.log(JSON.stringify({tree,captures:rows.length,errors:g.errors,warnings:g.warnings}));
}finally{await b.close()}
