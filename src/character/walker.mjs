import * as THREE from 'three';
import {lightingReceiver} from '../lighting/state.mjs';
import {DistanceGait,legIK} from './gait.mjs';
export const WALKER_VERSION='poitou-walker-rig-v2';
/** Original lofted silhouette, one skinned mesh and vertex-colour material. */
export function createWalker(){
 const avatar=new THREE.Group(),bones=[],at=[],position=[],color=[],skinIndex=[],skinWeight=[],index=[];
 const bone=(name,parent,x,y,z=0)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);if(parent)parent.add(b);bones.push(b);return b};
 const hips=bone('hips',null,0,.87),spine=bone('spine',hips,0,.25),chest=bone('chest',spine,0,.20),head=bone('head',chest,0,.23);
 const legs=[],arms=[];for(const side of [-1,1]){const thigh=bone('thigh'+side,hips,side*.105,0),shin=bone('shin'+side,thigh,0,-.43),foot=bone('foot'+side,shin,0,-.43);thigh.rotation.order='ZXY';legs.push({thigh,shin,foot,side,anchor:new THREE.Vector3(),target:new THREE.Vector3(),previous:new THREE.Vector3(),stance:true,cycle:0});const upper=bone('arm'+side,chest,side*.235,.015),lower=bone('forearm'+side,upper,0,-.29),hand=bone('hand'+side,lower,0,-.255);arms.push({upper,lower,hand,side})}
 const rig=new THREE.Skeleton(bones);avatar.add(hips);avatar.updateMatrixWorld(true);for(const b of bones)at.push(b.getWorldPosition(new THREE.Vector3()));
 const palette={coat:0x687b68,pants:0x63594c,skin:0xc99b7b,hair:0x453c33,boots:0x383c38,trim:0xaaa28b,eye:0x38352e};
 function vertex(x,y,z,c,weights){const i=position.length/3;position.push(x,y,z);const col=new THREE.Color(c);color.push(col.r,col.g,col.b);const ids=[0,0,0,0],ws=[0,0,0,0];weights.forEach(([b,w],j)=>{ids[j]=bones.indexOf(b);ws[j]=w});skinIndex.push(...ids);skinWeight.push(...ws);return i}
 const fixed=b=>()=>[[b,1]],mix=(a,b,t)=>[[a,1-t],[b,t]];
 function loft(rings,c,weights,sides=12){const start=position.length/3;for(const r of rings)for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2;vertex((r[3]??0)+Math.cos(angle)*r[1],r[0],(r[4]??0)+Math.sin(angle)*r[2],c,weights(r[0]))}for(let k=0;k<rings.length-1;k++)for(let j=0;j<sides;j++){const a=start+k*(sides+1)+j,b=a+sides+1;index.push(a,a+1,b,b,a+1,b+1)}for(const k of [0,rings.length-1]){const r=rings[k],mid=vertex(r[3]??0,r[0],r[4]??0,c,weights(r[0]));for(let j=0;j<sides;j++){const a=start+k*(sides+1)+j;index.push(...(k?[mid,a,a+1]:[mid,a+1,a]))}}}
 loft([[.83,.14,.105],[.94,.155,.115],[1.08,.175,.125],[1.29,.213,.13],[1.37,.22,.11],[1.42,.14,.09],[1.44,.075,.07]],palette.coat,y=>y<1.06?mix(hips,spine,Math.max(0,(y-.86)/.20)):mix(spine,chest,Math.min(1,(y-1.06)/.23)),16);
 loft([[1.41,.061,.057],[1.48,.059,.055],[1.50,.066,.061]],palette.skin,fixed(head));
 loft([[1.47,.065,.064,0,.008],[1.51,.094,.086,0,.012],[1.59,.12,.102,0,.008],[1.68,.115,.101],[1.74,.085,.079,0,-.008],[1.77,.025,.029,0,-.012]],palette.skin,fixed(head),16);
 loft([[1.65,.114,.094,0,-.025],[1.72,.104,.087,0,-.018],[1.775,.055,.052,0,-.02],[1.785,.012,.015,0,-.02]],palette.hair,fixed(head),16);
 // A small canvas daypack, collar and straps share the existing chest skin.
 loft([[1.02,.10,.035,0,-.16],[1.08,.13,.065,0,-.18],[1.27,.135,.069,0,-.18],[1.35,.095,.035,0,-.15]],0x8b7d61,fixed(chest),12);
 loft([[1.395,.084,.073],[1.43,.09,.078],[1.455,.07,.065]],palette.trim,fixed(chest),12);
 for(const side of [-1,1])loft([[1.04,.012,.008,side*.125,.127],[1.22,.015,.01,side*.15,.131],[1.37,.018,.012,side*.13,.105]],0x9f9275,fixed(chest),8);
 loft([[1.549,.025,.003,0,.093],[1.555,.031,.004,0,.095],[1.558,.024,.003,0,.094]],0x986e5a,fixed(head),8);
 // Small nose, ears, brows and eyes stay part of the same draw.
 loft([[1.568,.016,.015,0,.106],[1.59,.021,.029,0,.115],[1.63,.012,.014,0,.106]],palette.skin,fixed(head),8);
 for(const s of [-1,1]){loft([[1.575,.016,.018,s*.119,0],[1.624,.019,.021,s*.12,0],[1.646,.01,.012,s*.115,0]],palette.skin,fixed(head),8);loft([[1.626,.009,.005,s*.044,.099],[1.637,.011,.006,s*.044,.10],[1.645,.008,.005,s*.044,.098]],palette.eye,fixed(head),8)}
 for(let i=0;i<2;i++){const l=legs[i],a=arms[i],s=l.side,x=s*.105;const lw=y=>y>.53?fixed(l.thigh)():y<.36?fixed(l.shin)():mix(l.thigh,l.shin,(.53-y)/.17);
  loft([[.07,.055,.058,x],[.16,.059,.067,x],[.35,.075,.078,x],[.47,.081,.084,x,.008],[.63,.087,.085,x],[.82,.091,.096,x],[.90,.087,.099,x]],palette.pants,lw);
  loft([[-.045,.063,.135,x,.045],[.005,.066,.143,x,.047],[.045,.055,.095,x,.018],[.07,.052,.062,x,-.005]],palette.boots,fixed(l.foot),12);
  const ax=s*.235,aw=y=>y>1.11?fixed(a.upper)():y<.99?fixed(a.lower)():mix(a.upper,a.lower,(1.11-y)/.12);
  loft([[.79,.046,.045,ax+s*.035],[.91,.052,.052,ax+s*.025],[1.04,.061,.06,ax+s*.016],[1.20,.072,.071,ax+s*.008],[1.34,.073,.074,ax],[1.39,.055,.06,ax]],palette.coat,aw);
  loft([[.785,.047,.048,ax+s*.035],[.805,.05,.049,ax+s*.035],[.82,.047,.048,ax+s*.035]],palette.trim,fixed(a.lower));
  loft([[.68,.028,.035,ax+s*.037,.01],[.72,.038,.04,ax+s*.037,.014],[.79,.035,.035,ax+s*.035]],palette.skin,fixed(a.hand),10);
 }
 for(let i=0;i<index.length;i+=3){const swap=index[i+1];index[i+1]=index[i+2];index[i+2]=swap}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0});lightingReceiver(material);const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='promeneur-articule';mesh.add(hips);mesh.bind(rig);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;avatar.add(mesh);avatar.name='promeneur';
 const motion=new DistanceGait(),last=new THREE.Vector3(Infinity,0,0),local=new THREE.Vector3(),world=new THREE.Vector3(),metrics=avatar.userData.walker={version:WALKER_VERSION,bones:bones.length,triangles:index.length/3,drawCalls:1,imageTextures:0,boneTextureBytes:bones.length*64,phase:0,speed:0,contacts:0,soleError:0,plantError:0,mode:'idle'};let initialized=false;
 function point(side,z,out){out.set(side*.105,0,z).applyAxisAngle(THREE.Object3D.DEFAULT_UP,avatar.rotation.y).add(avatar.position);return out}
 function reset(){for(let i=0;i<legs.length;i++){const f=legs[i];f.cycle=Math.floor(motion.phase*.5+i*.5);point(f.side,0,f.anchor);f.target.copy(f.anchor);f.stance=true}initialized=true}
 return {avatar,motion,metrics,feet:legs,hips,update(distance,dt,height){if(motion.idleTime>.3&&distance>0){local.copy(legs[0].target).sub(legs[1].target).applyAxisAngle(THREE.Object3D.DEFAULT_UP,-avatar.rotation.y);motion.restartOffset=local.z<0?1.6:.6}motion.update(distance,dt);if(!initialized||last.distanceTo(avatar.position)>3)reset();last.copy(avatar.position);let hip=.87+Math.sin(motion.phase*Math.PI*2)*.012*motion.blend;metrics.soleError=0;metrics.plantError=0;
  for(let i=0;i<2;i++){const f=legs[i],cycle=Math.floor(motion.phase*.5+i*.5),q=(motion.phase*.5+i*.5)%1,duty=.52-motion.run*.08,stance=q<duty;
   // Actual travel already eases with physics; damping swing progress again retracts the foot at a stop.
   if(motion.speed>.025){if(stance){if(!f.stance||f.cycle!==cycle)point(f.side,motion.stride*(.52-q*2),f.anchor);f.target.copy(f.anchor)}else{const t=(q-duty)/(1-duty),s=t*t*(3-2*t);point(f.side,motion.stride*(.52+2*(1-q)),world);f.target.lerpVectors(f.anchor,world,s);f.target.y=avatar.position.y+Math.sin(t*Math.PI)*(.075+motion.run*.07)}f.stance=stance;f.cycle=cycle}
   const h=height(f.target.x,f.target.z)??avatar.position.y;if(motion.speed<.025){f.target.y=THREE.MathUtils.lerp(f.target.y,h,1-Math.exp(-dt*14));if(Math.abs(f.target.y-h)<.002){f.target.y=h;f.stance=true;f.anchor.copy(f.target)}}else if(f.stance)f.target.y=h;else f.target.y=Math.max(h,f.target.y);local.copy(f.target).sub(avatar.position).applyAxisAngle(THREE.Object3D.DEFAULT_UP,-avatar.rotation.y);const available=Math.sqrt(Math.max(.05,.855*.855-local.z*local.z-(local.x-f.side*.105)**2));hip=Math.min(hip,available+local.y+.06);
  }
  hips.position.y=hip;spine.rotation.x=.018*motion.blend+.025*motion.run;head.rotation.x=-.012*motion.blend;spine.rotation.z=Math.sin(motion.phase*Math.PI)*.018*motion.blend;chest.rotation.y=-Math.sin(motion.phase*Math.PI)*.035*motion.blend;spine.scale.y=1+Math.sin(motion.time*1.3)*.003*(1-motion.blend);
  for(const f of legs){local.copy(f.target).sub(avatar.position).applyAxisAngle(THREE.Object3D.DEFAULT_UP,-avatar.rotation.y);const dy=local.y+.06-hip,dx=local.x-f.side*.105,roll=Math.atan2(dx,-dy),ik=legIK(-Math.hypot(dy,dx),local.z);f.thigh.rotation.z=roll;f.thigh.rotation.x=ik.hip;f.shin.rotation.x=ik.knee;point(f.side,local.z+.12,world);const front=height(world.x,world.z);point(f.side,local.z-.12,world);const back=height(world.x,world.z);const slope=front!==null&&back!==null?THREE.MathUtils.clamp(-Math.atan((front-back)/.24),-.5,.5):0;f.foot.rotation.x=slope-ik.hip-ik.knee;f.foot.rotation.z=-roll;}
  for(let i=0;i<2;i++){const a=arms[i],v=Math.sin(motion.phase*Math.PI+i*Math.PI+.17);a.upper.rotation.x=.04-v*(.26+motion.run*.18)*motion.blend;a.upper.rotation.z=a.side*.065;a.lower.rotation.x=-.13-motion.run*.82+Math.sin(motion.phase*Math.PI+i*Math.PI+.65)*.08*motion.blend;a.hand.rotation.z=a.side*.035}
  head.rotation.y=Math.sin(motion.time*.37)*.025*(1-motion.blend);mesh.updateMatrixWorld(true);rig.update();for(const f of legs){if(!f.stance)continue;f.foot.getWorldPosition(world);metrics.plantError=Math.max(metrics.plantError,Math.hypot(world.x-f.target.x,world.z-f.target.z));const h=height(world.x,world.z);if(h!==null)metrics.soleError=Math.max(metrics.soleError,Math.abs(world.y-.06-h))}Object.assign(metrics,{phase:motion.phase,speed:motion.speed,contacts:motion.contacts,mode:motion.blend<.02?'idle':motion.run>.5?'run':'walk'});return motion;
 },dispose(){geometry.dispose();material.dispose();rig.dispose()}};
}
