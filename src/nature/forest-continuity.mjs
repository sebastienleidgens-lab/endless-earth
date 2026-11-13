import * as THREE from 'three';
// Fit each far secondary shoot to the actual fine leaves on that SAME branch.
// This changes rendering derivatives only; canonical models/anchors stay intact.
export function coherentForestModels(models){
 for(const m of models.values()){
  const near=m.levels[0].leaves,groups=new Map(),key=(a,i)=>[0,1,2].map(k=>a.array[i*a.itemSize+k]).join(',');
  for(let i=0;i<near.attributes.position.count;i++){
   const k=key(near.attributes.forestSecondary,i);if(!groups.has(k))groups.set(k,[]);
   groups.get(k).push(new THREE.Vector3().fromBufferAttribute(near.attributes.position,i));
  }
  const source=m.levels[2].leaves,far=source.clone(),p=far.attributes.position;
  for(let base=0;base<p.count;base+=4){const cloud=groups.get(key(far.attributes.forestSecondary,base));if(!cloud?.length)continue;
   const root=new THREE.Vector3().fromBufferAttribute(p,base),along=new THREE.Vector3().fromBufferAttribute(p,base+2).sub(root).normalize(),across=new THREE.Vector3().fromBufferAttribute(p,base+3).sub(new THREE.Vector3().fromBufferAttribute(p,base+1)).normalize();
   let lo=Infinity,hi=-Infinity,left=Infinity,right=-Infinity;for(const v of cloud){const q=v.clone().sub(root),a=q.dot(along),b=q.dot(across);lo=Math.min(lo,a);hi=Math.max(hi,a);left=Math.min(left,b);right=Math.max(right,b)}
   const mid=(lo+hi)*.5,centre=(left+right)*.5;
   for(const [j,a,b]of [[0,lo,centre],[1,mid,left],[2,hi,centre],[3,mid,right]]){const v=root.clone().addScaledVector(along,a).addScaledVector(across,b);p.setXYZ(base+j,v.x,v.y,v.z)}
  }
  far.computeBoundingBox();far.computeBoundingSphere();m.renderBox=m.box.clone().union(far.boundingBox);
  // Identical far foliage in both tiers: the last transition only reduces wood.
  // Two planes preserve the crown when it is viewed from the opposite side.
  const ultraWood=m.levels[3].wood.clone(),ids=ultraWood.index.array,keep=[];
  for(let i=0;i<ids.length;i+=6)for(let j=0;j<3;j++)keep.push(ids[i+j]);ultraWood.setIndex(keep);
  m.levels[2]={...m.levels[2],leaves:far};m.levels[3]={...m.levels[3],wood:ultraWood,leaves:far};
  // Union includes animated padding later. Fine crown and all branch roots keep
  // their original metric positions; no terrain, collision or layout changes.
  m.continuity={source:'fine leaves grouped by original secondary root',farPlanes:2};
 }
 return models;
}
export const forestTransitionPriority=p=>(p.visible?1e6:0)+p.pixels*Math.abs(p.desired-p.lod)+(p.waitAge??0)*3;
export function forestStableId(p){return `tree:${p.x.toFixed(6)}:${p.z.toFixed(6)}`}

// A common, world-fixed sampling plane gives both LODs the same coverage for a
// camera ray, even when their surfaces have different depths.
export function forestCoveragePoint(camera,fragment,anchor){const dx=fragment.x-camera.x,dy=fragment.y-camera.y,dz=fragment.z-camera.z,useX=Math.abs(anchor.x-camera.x)>Math.abs(anchor.z-camera.z),den=useX?dx:dz,t=((useX?anchor.x:anchor.z)-(useX?camera.x:camera.z))/(Math.abs(den)>1e-8?den:1e-8);return [camera.y+dy*t,useX?camera.z+dz*t:camera.x+dx*t]}
