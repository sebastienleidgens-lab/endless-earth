import {mkdir,writeFile} from 'node:fs/promises';
import {launch,open24,settle} from './lib/mission-24-browser.mjs';
const out='docs/mission-25-evidence';await mkdir(out,{recursive:true});
const b=await launch();
try{
 const g=await open24(b,5361,{viewport:{width:800,height:520},append:`window.audit25=()=>{prepareWorldSenses();const banks=[];for(const a of riverAreas)for(const r of a.rings)for(let i=1;i<r.length;i++){const p=r[i-1],q=r[i],l=Math.hypot(q.x-p.x,q.z-p.z);for(let d=0;d<l;d+=4){const x=p.x+(q.x-p.x)*d/l,z=p.z+(q.z-p.z)*d/l;for(const side of [-1,1]){const nx=-(q.z-p.z)/l*side,nz=(q.x-p.x)/l*side;const dry={x:x+nx*.7,z:z+nz*.7},wet={x:x-nx*.7,z:z-nz*.7},s=activeTerrain.supportAt(wet.x,wet.z),h=groundHeight25(dry.x,dry.z);if(canWalk(dry.x,dry.z)&&s?.category==='water'&&Math.abs(h-s.height)<.22)banks.push({dry:{...dry,y:h},wet:{...wet,y:s.height},normal:{x:nx,z:nz},gap:h-s.height,source:a.tags});}}}return {banks,areas:riverAreas.map(a=>({tags:a.tags,points:a.rings.map(r=>r.length)})),rig:walkerModel.metrics,audio:sound.stats(),geography:window.endlessDiagnostics.terrain}};const groundHeight25=walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z));`});
 const p=g.page;const audit=await p.evaluate(()=>window.audit25());
 await p.evaluate(()=>window.c15.setup(['baseline',-620,-300,.7,.1,3.3,'third',0],'balanced','2026-06-21'));await settle(p);await p.evaluate(()=>window.c15.render());
 await p.screenshot({path:out+'/before-traveler.png'});
 await p.evaluate(()=>{window.c15.native(true);window.c15.record()});await p.keyboard.down('w');await p.waitForTimeout(2000);await p.keyboard.down('Shift');await p.waitForTimeout(4000);await p.keyboard.up('Shift');await p.keyboard.up('w');await p.waitForTimeout(1600);
 const video=await p.evaluate(()=>window.c15.stop());await p.evaluate(()=>window.c15.native(false));await writeFile(out+'/before-run.webm',Buffer.from(video));
 await writeFile(out+'/audit.json',JSON.stringify({base:'c73ee0748cb51911e919d4f672010ce3e75df360',environment:g.environment,startupMs:g.startupMs,...audit,errors:g.errors},null,2));
 console.log(JSON.stringify({banks:audit.banks.length,examples:audit.banks.slice(0,4),rig:audit.rig,errors:g.errors}));
}finally{await b.close()}
