import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {CANOPY_LOBES} from './canopy.mjs';
const rand=n=>{let v=n+19;v=Math.imul(v^(v>>>16),0x7feb352d);v=Math.imul(v^(v>>>15),0x846ca68b);return ((v^(v>>>16))>>>0)/4294967296};
function finish(g,name,clusters){const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const shade=.72+THREE.MathUtils.smoothstep(p.getY(i),-2.4,2.7)*.28;c.set([shade,shade,shade],i*3)}g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setAttribute('natureCluster',new THREE.Float32BufferAttribute(clusters??Array.from({length:p.count},(_,i)=>rand(Math.floor(i/3))),1));g.name=name;g.computeBoundingSphere();return g;}
function volume(detail){const parts=[],lobes=detail?[[0,-.15,0,2.35,2.05,2.2],[-1.5,-.05,.45,1.6,1.75,1.65],[1.4,.2,-.6,1.75,1.8,1.55],[-.25,1.3,-.25,1.8,1.5,1.7],[.1,.15,1.45,1.7,1.5,1.5],[-.55,.2,-1.45,1.65,1.6,1.45]]:[[0,0,0,2.5,2.5,2.45],[-1.35,-.3,.3,1.9,1.9,1.9],[1.1,.35,-.5,1.8,2,1.8]];for(const [x,y,z,sx,sy,sz] of lobes){const g=new THREE.IcosahedronGeometry(1,0);g.scale(sx,sy,sz);g.translate(x,y,z);parts.push(g)}const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return finish(g,'nature-volume-comparison');}
function sprays(){const positions=[],uv=[],cluster=[],centers=[[0,1.45,0,.9],[-.8,.8,-.7,1.1],[.9,.8,.6,1.1],[-1.6,.1,.6,1.1],[1.5,.2,-.6,1.1],[0,.2,1.65,1.05],[-.3,0,-1.6,1.1],[-1.1,-.9,-.4,1.0],[1.1,-.9,.4,1],[0,-.4,0,1.5],[1.1,.4,1.2,1.0],[-1.2,.5,-1.1,1.0],[-.8,-.6,1.1,1.1],[.8,-.6,-1.2,1.1]];
 for(let i=0;i<centers.length;i++){const [x,y,z,r]=centers[i];for(let j=0;j<3;j++){const angle=j*Math.PI/3+rand(i)*2,tilt=(rand(i*3+j+18)-.5)*1.8,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt,angle,.15*(rand(i+2)-.5))),points=[[-r,-r*.8,0],[r,-r*.8,0],[r,r*.8,0],[-r,r*.8,0]].map(p=>new THREE.Vector3(...p).applyQuaternion(q).add(new THREE.Vector3(x,y,z)));for(const k of [0,1,2,0,2,3]){positions.push(...points[k].toArray());uv.push(...[[0,0],[1,0],[1,1],[0,1]][k]);cluster.push(rand(i*3+j+121))}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return finish(g,'nature-leaf-sprays-near',cluster);
}
function conifer(sides){const parts=[];for(const [radius,height,y] of [[2.1,3.4,-.6],[1.65,3.2,.65],[1.1,2.6,1.75]]){const g=new THREE.ConeGeometry(radius,height,sides,1,true);g.translate(0,y,0);parts.push(g)}const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return finish(g,'nature-needle-crown');}
function trunk(){
 const pieces=[new THREE.CylinderGeometry(.15,.32,4.5,4)],up=new THREE.Vector3(0,1,0);
 const limb=(a,b,r)=>{const d=b.clone().sub(a),g=new THREE.ConeGeometry(r,d.length(),3,1,true);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());pieces.push(g)};
 for(let i=0;i<4;i++){const angle=i*Math.PI*.5+.2,length=2.6+(i%2)*.55,a=new THREE.Vector3(0,.5+i*.35,0),d=new THREE.Vector3(-Math.cos(angle)*.56,.83,Math.sin(angle)*.56),b=a.clone().addScaledVector(d,length);limb(a,b,.105);const fork=a.clone().lerp(b,.65),end=b.clone().add(new THREE.Vector3(Math.sin(angle)*.55,.65,Math.cos(angle)*.55));limb(fork,end,.04)}
 const g=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());return g;
}
function generous(detail,fringe,trim=false){
 const parts=[],clusters=[];
 for(let i=0;i<CANOPY_LOBES.length;i++){
  const [x,y,z,sx,sy,sz]=CANOPY_LOBES[i];let g=new THREE.IcosahedronGeometry(1,detail);const p=g.attributes.position,n=g.attributes.normal;
  for(let j=0;j<p.count;j++){
   const a=p.getX(j),b=p.getY(j),c=p.getZ(j),r=1+.07*Math.sin(a*6+b*3+i)*Math.cos(c*5-i);
   p.setXYZ(j,x+a*sx*r,y+b*sy*r,z+c*sz*r);
   const normal=new THREE.Vector3(a/sx,b/sy,c/sz).normalize();n.setXYZ(j,normal.x,normal.y,normal.z);
  }
  // Continuous radial normals keep the volumes soft, while the silhouette
  // remains lobed. Leaf groups disappear separately in autumn/winter.
  if(trim){
   // Leaf volumes need no sealed interior. Remove deeply overlapping faces
   // once at zone creation, retaining lobed outlines and a few natural gaps.
   const kept=[];for(let j=0;j<p.count;j+=3){const cx=(p.getX(j)+p.getX(j+1)+p.getX(j+2))/3,cy=(p.getY(j)+p.getY(j+1)+p.getY(j+2))/3,cz=(p.getZ(j)+p.getZ(j+1)+p.getZ(j+2))/3;
    if(CANOPY_LOBES.some(([a,b,c,rx,ry,rz],k)=>k!==i&&((cx-a)/rx)**2+((cy-b)/ry)**2+((cz-c)/rz)**2<.86))continue;
    kept.push(j,j+1,j+2);
   }
   const shell=new THREE.BufferGeometry();for(const [name,attribute]of Object.entries(g.attributes)){const values=[];for(const j of kept)for(let k=0;k<attribute.itemSize;k++)values.push(attribute.array[j*attribute.itemSize+k]);shell.setAttribute(name,new THREE.Float32BufferAttribute(values,attribute.itemSize))}g.dispose();g=shell;
  }
  const count=g.attributes.position.count;
  g.setAttribute('natureFringe',new THREE.Float32BufferAttribute(new Float32Array(count),1));
  clusters.push(...Array(count).fill(.04+rand(i+91)*.62));parts.push(g);
 }
 if(fringe)for(let i=0;i<36;i++){
  const a=i*2.39996,y=-1.9+rand(i+2)*5.3,r=Math.sqrt(Math.max(.08,1-((y-.6)/4.2)**2)),x=Math.cos(a)*r*4.2,z=Math.sin(a)*r*4.1;
  const g=new THREE.PlaneGeometry(1.6+rand(i+3)*.8,1.4+rand(i+4)*.8);
  g.rotateX((rand(i+5)-.5)*1.9);g.rotateY(a);g.translate(x,y,z);
  g.setAttribute('natureFringe',new THREE.Float32BufferAttribute(Array(g.attributes.position.count).fill(1),1));
  clusters.push(...Array(6).fill(.06+rand(i+111)*.9));parts.push(g.toNonIndexed());g.dispose();
 }
 // Icosahedra are nonindexed; fringe planes are converted above.
 const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());
 return finish(g,`generous-canopy-${detail}-${fringe?'hybrid':'volume'}`,clusters);
}
export function createTreeArt(approach='hybrid'){
 if(approach==='sprays')return {crown:sprays(),farCrown:volume(0),needle:conifer(7),farNeedle:conifer(4),trunk:trunk(),approach};
 const crown=generous(1,['hybrid','perforated'].includes(approach),approach==='hybrid'),farCrown=generous(0,false,approach==='hybrid');
 return {crown,farCrown,needle:conifer(9),farNeedle:conifer(6),trunk:trunk(),approach};
}
