import {LIFE_VERSION,identity,wardrobe,random,hash,attendance} from './village-identity.mjs';
import {lifeRoute,pathPose,distance,validateLifeRoute,modeAllowed} from './village-navigation.mjs';
export const PERSISTENCE_KEY='endless-earth-village-life-v1';
/** Camera-free simulation. Rendering leases, frusta and quality live in the adapter. */
export class VillageLifeDirector{
 constructor({seed=22022,graph=null}={}){this.seed=seed;this.graph=graph;this.clock=0;this.sequence=0;this.rng=random(seed);this.nextAttempt=this.delay();this.groups=[];this.residents=Array.from({length:32},(_,i)=>identity('angles:resident:'+i,['young-adult','adult','senior','adult','teen'][i%5]));this.lastVisit={};this.events=[];this.critters=[];this.encounterAt=0;this.stats={attempts:0,admitted:0,completed:0,routeRequests:0,refused:0,recoveries:0,weatherReturns:0};}
 delay(){return 30-Math.log(Math.max(.00001,1-this.rng()))*155}
 event(type,g,extra={}){this.events.push({time:this.clock,type,group:g.id,...extra});if(this.events.length>128)this.events.shift()}
 create(c={},options={}){
 if(!this.graph||this.groups.reduce((a,g)=>a+g.members.length,0)>36)return null;
 const r=this.rng,kind=options.kind??(r()<.12?'dog':r()<.09?'family':r()<.10?'friends':r()<.32?'couple':r()<.025?'cycle':r()<.018?'stroller':'solo');
 if(['family','stroller'].includes(kind)&&(c.hour<7||c.hour>21||c.storm>.25))return null;
 const mode=kind==='stroller'?'stroller':kind==='cycle'?'cycle':'walk',origin=options.origin??Math.floor(r()*this.graph.nodes.length);
 this.stats.routeRequests++;const route=lifeRoute(this.graph,origin,r,{mode,min:options.min??75,max:options.max??650});if(!route||!validateLifeRoute(route,this.graph,this.physical?.height,this.physical?.clear??(()=>true)))return null;
 if(!options.inspection&&r()>attendance(c,route.zone))return null;
 const id='life:'+this.sequence++,members=[],ages=kind==='family'?[['adult','child'],['adult','adult','young-child'],['adult','adult','child','young-child'],['adult','senior','child']][Math.floor(r()*4)]:kind==='couple'?['adult','adult']:kind==='friends'?['young-adult','teen','young-adult']:kind==='stroller'?['adult','baby']:['adult'];
 for(let i=0;i<ages.length;i++){
 let p;const used=new Set(this.groups.flatMap(g=>g.members.map(m=>m.person.id)));
 const recurring=r()<.68&&ages[i]!=='baby'&&!['child','young-child'].includes(ages[i]);const candidates=this.residents.filter(p=>!used.has(p.id)&&(!['family','stroller'].includes(kind)||i>0||p.age!=='teen')&&this.clock-(this.lastVisit[p.id]??-99999)>900);
 if(recurring&&candidates.length)p=candidates[Math.floor(r()*candidates.length)];else p=identity('angles:visitor:'+this.seed+':'+id+':'+i,ages[i]);
 // Children and the accompanied infant are explicit proportions, never scaled adults.
 if(['child','young-child','baby'].includes(ages[i]))p=identity('angles:visitor:'+this.seed+':'+id+':'+i,ages[i]);
 if(p.id.startsWith('angles:resident:'))this.lastVisit[p.id]=this.clock;members.push({person:p,outfit:wardrobe(p,c),s:Math.max(0,4-i*1.05),position:{...route.points[0],y:0},distance:0,phase:0,speed:0,foot:0,blocked:0});
 }
 const g={id,kind,mode,route,members,origin,goal:route.goal,activity:kind==='dog'?'sniff':members[0].person.favourite==='view'?'photo':members[0].person.favourite==='conversation'?'conversation':r()<.2?'photo':'observe',state:'depart',age:0,stateTime:0,progress:4,speed:Math.min(...members.filter(m=>m.person.age!=='baby').map(m=>m.person.speed))*(mode==='cycle'?2.7:1),wait:15+r()*65,pauseAt:route.length*(.3+r()*.35),paused:false,history:[origin],leg:0,returning:false,blocked:0,animal:kind==='dog'?{id:id+':dog',kind:'dog',seed:hash(id),size:.35+r()*.32,position:{...route.points[0],y:0},distance:0}:null};
 this.groups.push(g);this.stats.admitted++;this.event('departure',g,{kind});this.place(g,0,{});return g;
 }
 place(g,dt,physical){
 const others=this.groups.filter(other=>other!==g).flatMap(other=>other.members);
 for(let i=0;i<g.members.length;i++){const m=g.members[i],p=pathPose(g.route,m.s),e=this.graph.edges[p.edge],wide=(e?.width??0)>=3.2;
 const side=wide?(i%2===0?-.40:.40):0;let x=p.x-p.dz*side,z=p.z+p.dx*side;
 if(dt>0){let occupied=others.some(other=>Math.abs(other.position.y-m.position.y)<2&&distance(other.position,{x,z})<.52);if(occupied){const extra=(e?.width??0)>=3.2?.68:0,ax=p.x-p.dz*(side+extra),az=p.z+p.dx*(side+extra);if(extra&&(!physical.clear||physical.clear(ax,az))&&!others.some(other=>distance(other.position,{x:ax,z:az})<.52)){x=ax;z=az}else{m.speed=0;m.blocked+=dt;continue}}}
 if(physical.clear&&!physical.clear(x,z)){x=p.x;z=p.z}
 const y=physical.height?.(x,z);if(physical.height&&(y===null||!Number.isFinite(y))){m.speed=0;continue;}
 if(dt>0&&physical.clear&&(!physical.clear(x,z)||Math.abs((y??m.position.y)-m.position.y)>Math.max(.35,distance(m.position,{x,z})*.65))){m.speed=0;m.blocked+=dt;continue}
 const old={...m.position};if(dt>0){const step=distance(old,{x,z}),limit=m.person.speed*1.35*dt;if(step>limit){const t=limit/step;x=old.x+(x-old.x)*t;z=old.z+(z-old.z)*t;}if(physical.clear){const n=Math.max(1,Math.ceil(distance(old,{x,z})/.25));let safe=true;for(let k=1;k<=n;k++)if(!physical.clear(old.x+(x-old.x)*k/n,old.z+(z-old.z)*k/n)){safe=false;break}if(!safe){m.speed=0;m.blocked+=dt;continue}}}const travel=distance(old,{x,z});m.position={x,y:physical.height?.(x,z)??y??m.position.y??0,z};m.yaw=Math.atan2(p.dx,p.dz);m.speed=dt>0?travel/dt:0;
 if(dt>0){m.distance+=travel;m.phase=m.distance/(m.person.height*m.person.stride)*Math.PI;}
 }
 if(g.animal){const a=g.animal,previous=a.position,p=pathPose(g.route,Math.max(0,g.progress-1.3)),offset=g.state==='pause'&&g.activity==='sniff'?.48:0;a.position={x:p.x-p.dz*offset,y:physical.height?.(p.x-p.dz*offset,p.z+p.dx*offset)??g.members[0].position.y,z:p.z+p.dx*offset};if(a.position.y===null)a.position={...previous};a.distance+=dt>0?distance(a.position,previous):0;a.yaw=Math.atan2(p.dx,p.dz);}
 }
 update(dt,c={},physical={}){
 if(!Number.isFinite(dt)||dt<=0)return;this.clock+=dt;this.physical=physical;
 // No accumulated arrival burst on tab resume. Existing lives still advance.
 if(this.clock>=this.nextAttempt){this.stats.attempts++;this.create(c);if(this.rng()<.11)this.createCritter(c);this.nextAttempt=this.clock+this.delay();}
 for(const g of this.groups){g.age+=dt;g.stateTime+=dt;for(const m of g.members){const y=physical.height?.(m.position.x,m.position.z);if(Number.isFinite(y))m.position.y=y;}if(g.animal){const y=physical.height?.(g.animal.position.x,g.animal.position.z);if(Number.isFinite(y))g.animal.position.y=y;}
 if((c.storm>.25||c.rain>.65||c.snow>.5)&&!g.returning){g.returning=true;g.wait=Math.min(g.wait,8);this.stats.weatherReturns++;this.event('weather-return',g)}
 if(g.state==='depart'&&g.stateTime>=1.8){g.state='walk';g.stateTime=0;}
 if(g.state==='off-duty'&&this.clock<g.wakeAt){g.members.forEach(m=>m.speed=0);continue;}
 if(g.state==='off-duty'){g.state='rest';g.stateTime=90;g.homebound=false;g.returning=false;}
 if(g.state==='pause'||g.state==='activity'||g.state==='rest'){
  const duration=g.state==='rest'?90:g.state==='activity'?g.wait:g.activity==='sniff'?7:9;
  if(g.stateTime>=duration){if(g.state==='rest'){this.stats.routeRequests++;const next=lifeRoute(this.graph,g.goal,this.rng,{mode:g.mode,min:65,max:500,avoid:g.history.slice(-3)});if(next){g.route=next;g.origin=g.goal;g.goal=next.goal;g.history.push(next.goal);g.history=g.history.slice(-5);g.progress=0;g.members.forEach(m=>m.s=0);g.leg++;g.paused=false;g.pauseAt=next.length*.5;g.state='depart';this.event('next-intention',g)}else{g.state='rest';g.stateTime=0;this.stats.refused++;continue}}
   else if(g.state==='activity'){
    this.stats.completed++;this.event('routine-complete',g);
    const home=!g.homebound?lifeRoute(this.graph,g.goal,this.rng,{mode:g.mode,min:10,max:900,goal:g.origin}):null;
    if(home){g.route=home;g.goal=home.goal;g.progress=0;g.members.forEach(m=>m.s=0);g.state='depart';g.homebound=true;g.returning=true;this.event('return-to-origin',g)}
    else{g.state='off-duty';g.wakeAt=this.clock+300+this.rng()*1500;}
   }
   else g.state='walk';g.stateTime=0;
  }
  g.members.forEach(m=>m.speed=0);continue;
 }
 if(g.state!=='walk')continue;
 // Any member delayed by a physical obstruction holds its whole household.
 const blocked=g.members.some(m=>m.blocked>0),tail=Math.min(...g.members.filter(m=>m.person.age!=='baby').map(m=>m.s)),cohesion=g.progress-tail>6;
 const stopping=Math.max(0,(g.paused||g.returning?g.route.length:g.pauseAt)-g.progress),targetSpeed=Math.min(g.speed*(g.returning?1.10:1),Math.sqrt(2*.9*stopping));g.currentSpeed=Math.max(0,(g.currentSpeed??0)+Math.max(-1.1*dt,Math.min(.7*dt,targetSpeed-(g.currentSpeed??0))));
 let step=blocked||cohesion?0:g.currentSpeed*dt;const car=physical.vehicle;
 if(car){const cp=car.position,lead=pathPose(g.route,Math.min(g.route.length,g.progress+2));if(distance(lead,cp)<6&&Math.abs((g.members[0].position.y??0)-cp.y)<2.5)step=0;}
 g.progress=Math.min(g.paused||g.returning?g.route.length:g.pauseAt,g.progress+step);
 if(!g.paused&&g.progress>=g.pauseAt&&!g.returning){g.paused=true;g.state='pause';g.stateTime=0;this.event(g.activity==='sniff'?'sniff':'regroup',g);}
 for(let i=0;i<g.members.length;i++){const m=g.members[i],e=this.graph.edges[pathPose(g.route,g.progress).edge],wide=(e?.width??0)>=3.2,lag=wide&&['child','young-child'].includes(m.person.age)?-.60*Math.max(0,Math.sin(g.age*.045)):wide?Math.floor(i/2)*1.1:i*1.05,target=Math.max(0,g.progress-lag),pace=g.speed*(1.10+(m.person.age==='child'?.10:0));m.previousS=m.s;m.s=Math.min(target,m.s+pace*dt);if(m.person.age==='baby')m.s=g.members[0].s;}
 this.place(g,dt,physical);
 for(const m of g.members)if(m.blocked){m.s=m.previousS??m.s;if(m.blocked>12){g.blocked+=dt;}}
 if(blocked){this.stats.recoveries++;g.members.forEach(m=>m.blocked=0);if(g.blocked>40){g.state='activity';g.stateTime=0;g.wait=8;g.blocked=0;this.event('blocked-safe-stop',g)}}
 if(g.progress>=g.route.length&&g.members.every(m=>m.s>=g.route.length-(g.members.length*1.2))){g.goal=g.route.goal;g.state='activity';g.stateTime=0;g.members.forEach(m=>m.speed=0);this.event('arrival',g);}
 }
 for(const a of this.critters){a.age+=dt;if(a.state==='rest'&&a.age>=a.wait){a.state='walk';a.age=0;}if(a.state==='walk'){a.s=Math.min(a.route.length,a.s+dt*(a.kind==='cat'?.55:.9));const p=pathPose(a.route,a.s),y=physical.height?.(p.x,p.z);if((!physical.clear||physical.clear(p.x,p.z))&&y!==null){a.position={x:p.x,y:y??0,z:p.z};a.yaw=Math.atan2(p.dx,p.dz);a.distance=a.s;}if(a.s===a.route.length){a.state='rest';a.wait=120+this.rng()*240;a.age=0;}}}
 if(this.clock>=this.encounterAt){this.encounterAt=this.clock+5;const solos=this.groups.filter(g=>g.kind==='solo'&&g.state==='walk'&&this.clock-(g.lastEncounter??-900)>180);for(let i=0;i<solos.length;i++)for(let j=i+1;j<solos.length;j++){const a=solos[i],b=solos[j];if(distance(a.members[0].position,b.members[0].position)<2.2&&this.rng()<.12){for(const g of [a,b]){g.state='pause';g.stateTime=0;g.activity='conversation';g.lastEncounter=this.clock;this.event('encounter',g)}}}}
 // Ended routines retain their endpoint while observable. The adapter may drop
 // a representation, but only the simulation retires dormant logical visitors.
 }
 createCritter(c){if(this.critters.length>=3||c.storm>.2)return null;const r=this.rng,origin=Math.floor(r()*this.graph.nodes.length),route=lifeRoute(this.graph,origin,r,{min:20,max:100});if(!route)return null;const kind=route.zone==='forest'?'squirrel':route.zone==='village'||route.zone==='residential'?'cat':null;if(!kind)return null;const p=route.points[0],a={id:'critter:'+this.sequence++,kind,seed:hash(String(this.sequence)),size:kind==='cat'?.27:.16,route,s:0,position:{x:p.x,y:0,z:p.z},distance:0,age:0,state:'walk',wait:20};this.critters.push(a);return a;}
 retire(id){const g=this.groups.find(g=>g.id===id);if(!g||g.state!=='rest')return false;this.event('resting-virtual',g);return true;}
 snapshot(){return {version:LIFE_VERSION,seed:this.seed,rngState:this.rng.state,clock:this.clock,sequence:this.sequence,nextAttempt:this.nextAttempt,residents:this.residents.map(p=>p.id),lastVisit:this.lastVisit,groups:this.groups,critters:this.critters,stats:this.stats};}
 restore(data){try{if(!data||data.version!==LIFE_VERSION||data.seed!==this.seed||!Number.isFinite(data.clock)||!Number.isSafeInteger(data.sequence)||!Array.isArray(data.groups)||data.groups.length>40||JSON.stringify(data).length>180000)return false;for(const g of data.groups){if(!Number.isFinite(g.age)||!Number.isFinite(g.stateTime)||!Number.isFinite(g.progress)||!['walk','depart','pause','activity','rest','off-duty'].includes(g.state)||!Array.isArray(g.members)||g.members.length<1||g.members.length>4||!Array.isArray(g.route?.points)||g.route.points.length>this.graph.nodes.length||!Number.isFinite(g.route.length)||g.route.length<=0)return false;for(const p of g.route.points){const n=this.graph.nodes[p.node]?.point;if(!n||distance(n,p)>.001||!Number.isFinite(p.s)||(!this.graph.edges[p.edge]||!modeAllowed(this.graph.edges[p.edge],g.mode)))return false}for(const m of g.members)if(!Number.isFinite(m.s)||m.s<0||m.s>g.route.length||!Number.isFinite(m.position?.x)||!Number.isFinite(m.position?.z)||!m.person?.id||!m.outfit)return false;}
 this.clock=data.clock;if(Number.isInteger(data.rngState))this.rng.state=data.rngState;this.sequence=data.sequence;this.nextAttempt=Math.max(this.clock+1,data.nextAttempt??this.clock+this.delay());this.groups=data.groups;this.critters=[];this.lastVisit=data.lastVisit??{};this.stats={...this.stats,...data.stats};return true;}catch{return false}}
}
