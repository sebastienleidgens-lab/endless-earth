import * as THREE from 'three';
const provenance='Décor artistique original M25.2 : banc, roche et tronc inventés pour le jeu, sans attestation géographique.';
const smooth=t=>t*t*(3-2*t);
const intersect=(p,r,b)=>{const x=Math.max(b.min.x,Math.min(b.max.x,p.x)),y=Math.max(b.min.y,Math.min(b.max.y,p.y)),z=Math.max(b.min.z,Math.min(b.max.z,p.z));return (p.x-x)**2+(p.y-y)**2+(p.z-z)**2<(r-.008)**2;};
/** Additive local geometry owner. Geographic collision is always queried first.
 * Every animated crossing is swept against the SAME boxes used by free walking.
 */
export function createInteractionDecor(scene,world){
 const group=new THREE.Group();group.name='Décors artistiques interactifs';group.userData.provenance=provenance;scene.add(group);
 const colliders=[],items=[],materials=[],geometries=[];const metrics={provenance,objects:0,colliders:0,sweeps:0,rejected:0,last:null};
 const mat=c=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:.94});materials.push(m);return m;},wood=mat(0x716047),iron=mat(0x464b45),stone=mat(0x85857a),bark=mat(0x504332),cut=mat(0xaa9270);
 function mesh(g,m,x,y,z){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;}
 function box(id,x,y,z,w,h,d,m){mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);colliders.push({id,min:{x:x-w/2,y:y-h/2,z:z-d/2},max:{x:x+w/2,y:y+h/2,z:z+d/2}});}
 function site(x,z){const c=world.camp({x,z},0);if(!c.ok)return null;const s=world.query(x,z);for(let dz=-1.4;dz<=1.4;dz+=.35)for(let dx=-1.5;dx<=1.5;dx+=.35){const q=world.query(x+dx,z+dz);if(!q.ok||Math.abs(q.height-s.height)>.14)return null;}return {x,y:s.height,z};}
 const centers=[];for(const [sx,sz]of [[-620,-300],[-612,-300],[-620,-310]]){let chosen=null;for(let i=0;i<30&&!chosen;i++){const x=sx+(i%6)*2,z=sz-Math.floor(i/6)*3;if(centers.every(p=>Math.hypot(p.x-x,p.z-z)>4))chosen=site(x,z);}if(chosen)centers.push(chosen);}
 function register(kind,p,width,depth,height,actions){const id='artistic-'+kind,s={id,kind,position:p,width,depth,height:p.y+height,normal:{x:0,y:1,z:0},heading:0,loaded:true,permission:true,colliderId:id,provenance,actions,validate:()=>group.parent===scene};world.interactions.register(s);items.push(s);return id;}
 if(centers[0]){const p=centers[0],id=register('bench',p,1.5,.55,.46,['sit']);for(const dz of [-.19,0,.19])box(id,p.x,p.y+.425,p.z+dz,1.5,.07,.17,wood);for(const dx of [-.58,.58]){for(const dz of [-.19,.19])box(id,p.x+dx,p.y+.2,p.z+dz,.065,.4,.065,iron);box(id,p.x+dx,p.y+.63,p.z-.53,.055,.55,.055,iron);}for(const y of [.65,.82])box(id,p.x,p.y+y,p.z-.56,1.5,.13,.055,wood);}
 if(centers[1]){const p=centers[1],id=register('rock',p,.95,.65,.44,['sit']);const g=new THREE.DodecahedronGeometry(1,1);g.scale(.56,.28,.43);mesh(g,stone,p.x,p.y+.19,p.z);box(id,p.x,p.y+.39,p.z,.9,.10,.62,stone);colliders.push({id,min:{x:p.x-.55,y:p.y,z:p.z-.42},max:{x:p.x+.55,y:p.y+.38,z:p.z+.42}});}
 if(centers[2]){const p=centers[2],id=register('trunk',p,1.65,.32,.29,['step-over']);const o=mesh(new THREE.CylinderGeometry(.145,.17,1.65,12),bark,p.x,p.y+.145,p.z);o.rotation.z=Math.PI/2;for(const side of [-1,1]){const cap=mesh(new THREE.CircleGeometry(.133,16),cut,p.x+side*.828,p.y+.145,p.z);cap.rotation.y=side*Math.PI/2;for(const r of [.05,.09]){const ring=mesh(new THREE.TorusGeometry(r,.003,3,20),wood,p.x+side*.831,p.y+.145,p.z);ring.rotation.y=side*Math.PI/2;}}colliders.push({id,min:{x:p.x-.825,y:p.y,z:p.z-.16},max:{x:p.x+.825,y:p.y+.29,z:p.z+.16}});}
 function bodyAt(p,heading,sit=0,jump=0){const sn=Math.sin(heading),cs=Math.cos(heading),at=(x,y,z,r)=>({x:p.x+cs*x+sn*z,y:p.y+y+jump,z:p.z-sn*x+cs*z,r}),out=[at(0,1.64-.32*sit,0,.12),at(0,1.3-.32*sit,0,.20),at(0,1.2-.32*sit,-.23,.18)];
 function chain(a,b,r){const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/.06);for(let i=0;i<=n;i++){const t=i/n;out.push(at(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,r));}}
 out.push(at(0,.87-.32*sit,0,.08));chain([0,1.0-.32*sit,0],[0,1.4-.32*sit,0],.12);for(const side of [-1,1]){chain([side*.105,.87-.32*sit,0],[side*.105,.44+.11*sit,.52*sit],.074);chain([side*.105,.44+.11*sit,.52*sit],[side*.105,.07,.55*sit],.055);chain([side*.27,1.34-.32*sit,0],[side*.29,.76+.10*sit,.20*sit],.06);}return out;
 }
 function clearPose(p,heading,sit=0,jump=0){return bodyAt(p,heading,sit,jump).every(v=>colliders.every(b=>!intersect(v,v.r,b)));}
 function sweepBody(from,to,options={}){metrics.sweeps++;const d=Math.hypot(to.x-from.x,to.z-from.z),n=Math.max(30,Math.ceil(d/.035));for(let i=0;i<=n;i++){const t=i/n,progress=options.kind==='step-over'?t:smooth(t),seat=options.kind==='seat'?smooth(t):0,p={x:from.x+(to.x-from.x)*progress,z:from.z+(to.z-from.z)*progress};const q=world.query(p.x,p.z);if(!q.ok||Math.abs(q.height-from.y)>.15||!clearPose({...p,y:q.height},options.heading??0,seat,options.kind==='step-over'?Math.sin(Math.PI*t)*.56:0)){metrics.rejected++;metrics.last={ok:false,kind:options.kind,t};return false;}}metrics.last={ok:true,kind:options.kind};return true;}
 function walkingClear(p){return clearPose(p,0);}
 world.sweepBody=sweepBody;metrics.objects=items.length;metrics.colliders=colliders.length;
 return {metrics,walkingClear,clearPose,inventory:()=>items.map(({validate,...s})=>s),dispose(){for(const s of items)world.interactions.remove(s.id);group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
