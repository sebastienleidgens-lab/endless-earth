export const planningDiagnostic=`
window.p262.areaPlace=async function(gps,profile='eco'){
 window.p252.hold(false);if(!await planet.preparePoint(gps))throw Error('No streamed support at requested area');
 const q=this.localPoint(gps),a=planet.admission(q.x,q.z);if(!a.ok||!planet.canWalk(q.x,q.z))throw Error('Area point refused: '+(a.reason??'visible obstacle'));
 this.match({...q,profile});return {gps,local:q,admission:a};
};
window.p262.crossing=async function(start,end){
 window.p252.hold(false);const gps=planet.geo(end);if(!await planet.preparePoint(gps))throw Error('Exterior support still unavailable');
 this.match({...start,profile:'eco'});const run=target=>{let distance=0,steps=0,still=0;const trace=[];
  for(;steps<1200;steps++){const dx=target.x-avatar.position.x,dz=target.z-avatar.position.z,d=Math.hypot(dx,dz);if(d<.015)break;const before=avatar.position.clone(),s=Math.min(d,1.45/60);moveWithCollision(avatar.position,{x:dx/d*s,z:dz/d*s},(x,z)=>activeTerrain.relativeHeight(x,z),false,1/60);const moved=Math.hypot(avatar.position.x-before.x,avatar.position.z-before.z);distance+=moved;still=moved<1e-8?still+1:0;if(steps%15===0)trace.push({...window.p262.telemetry(),distanceM:distance});if(still>5)break;}
  return {completed:Math.hypot(target.x-avatar.position.x,target.z-avatar.position.z)<.015,distanceM:distance,steps,trace,end:avatar.position.toArray(),diagnostic:lastMovementDiagnostic(),inspection:this.inspect(avatar.position.x,avatar.position.z)};
 };const outward=run(end),back=outward.completed?run(start):null;return {outward,return:back};
};
window.p262.detour=async function(target){
 const origin=avatar.position.clone(),step=.4,radius=16,key=(x,z)=>x+','+z,nodes=new Map(),open=new Map(),closed=new Set();
 const first={ix:0,iz:0,x:origin.x,z:origin.z,g:0,parent:null};nodes.set('0,0',first);open.set('0,0',Math.hypot(target.x-origin.x,target.z-origin.z));
 let visited=0;
 while(open.size&&visited++<5000){let at=null,score=Infinity;for(const [k,v]of open)if(v<score){at=k;score=v;}open.delete(at);const n=nodes.get(at);
  if(Math.hypot(target.x-n.x,target.z-n.z)<.5){const route=[];let p=n;while(p){route.push({x:p.x,z:p.z});p=p.parent;}return {route:route.reverse(),visited};}closed.add(at);
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const ix=n.ix+dx,iz=n.iz+dz,k=key(ix,iz);if(Math.abs(ix*step)>radius||Math.abs(iz*step)>radius||closed.has(k))continue;
   const x=origin.x+ix*step,z=origin.z+iz*step,h=walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(n.x,n.z);if(h===null)continue;
   // Planning probes move a CLONE, never the actual actor, against exactly the
   // same swept controller. Only subsequent normal input advances the actor.
   const probe=new THREE.Vector3(n.x,h,n.z);moveWithCollision(probe,{x:x-n.x,z:z-n.z},(x,z)=>activeTerrain.relativeHeight(x,z),false,1/60);if(Math.hypot(probe.x-x,probe.z-z)>.01)continue;
   const g=n.g+Math.hypot(x-n.x,z-n.z);if(g>=(nodes.get(k)?.g??Infinity))continue;const q={ix,iz,x,z,g,parent:n};nodes.set(k,q);open.set(k,g+Math.hypot(target.x-x,target.z-z));
  }if(visited%32===0)await new Promise(r=>setTimeout(r,0));
 }return {route:null,visited};
};
`;
