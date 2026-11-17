import * as THREE from 'three';
import {lightingReceiver} from '../lighting/state.mjs';
import {snowReceiver} from '../nature/snow-state.mjs';
import {DistanceGait,legIK} from './gait.mjs';
import {sampleLocomotion} from './clips.mjs';
import {travelerDetails} from './traveler-details.mjs';
import {sampleJointPose,sampleStepOver} from './joint-clips.mjs';
import {softMinimum} from './cyclic-curve.mjs';
export const WALKER_VERSION='original-traveler-rig-v10-contact-start-clearance-before-ik';
/** Original lofted silhouette, one skinned mesh and vertex-colour material. */
export function createWalker(){
 const avatar=new THREE.Group(),bones=[],at=[],position=[],color=[],skinIndex=[],skinWeight=[],index=[],lowIndex=[];
 const bone=(name,parent,x,y,z=0)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);if(parent)parent.add(b);bones.push(b);return b};
 const hips=bone('hips',null,0,.87),spine=bone('spine',hips,0,.25),chest=bone('chest',spine,0,.20),neck=bone('neck',chest,0,.14),head=bone('head',neck,0,.09);
 const legs=[],arms=[];for(const side of [-1,1]){const thigh=bone('thigh'+side,hips,side*.105,0),shin=bone('shin'+side,thigh,0,-.43),foot=bone('foot'+side,shin,0,-.43),toe=bone('toe'+side,foot,0,-.035,.075);thigh.rotation.order='ZXY';legs.push({thigh,shin,foot,toe,side,anchor:new THREE.Vector3(),target:new THREE.Vector3(),previous:new THREE.Vector3(),stance:true,cycle:0,clip:{},scratch:{},joints:{},jointScratch:{},ankle:new THREE.Vector3(),contact:new THREE.Vector3(),measured:false,plantHeading:0,stopAge:0});const clavicle=bone('clavicle'+side,chest,side*.12,.015),upper=bone('arm'+side,clavicle,side*.115,0),lower=bone('forearm'+side,upper,0,-.29),hand=bone('hand'+side,lower,0,-.255),fingers=bone('fingers'+side,hand,0,-.04,.014),tips=bone('fingertips'+side,fingers,0,-.035,0),thumb=bone('thumb'+side,hand,-side*.027,-.015,.035),thumbTip=bone('thumb-tip'+side,thumb,0,-.025,.007);arms.push({clavicle,upper,lower,hand,fingers,tips,thumb,thumbTip,side})}
 const pack=bone('travel-pack',chest,0,.03,-.15),packLid=bone('pack-lid',pack,0,.13,-.08);
 const rig=new THREE.Skeleton(bones);avatar.add(hips);avatar.updateMatrixWorld(true);for(const b of bones)at.push(b.getWorldPosition(new THREE.Vector3()));
 const palette={coat:0x436c73,pants:0x6c5b46,skin:0xd0a183,hair:0x403129,boots:0x443d34,trim:0xaaa28b,eye:0x38352e};
 function vertex(x,y,z,c,weights){const i=position.length/3;position.push(x,y,z);const col=new THREE.Color(c);color.push(col.r,col.g,col.b);const ids=[0,0,0,0],ws=[0,0,0,0];weights.forEach(([b,w],j)=>{ids[j]=bones.indexOf(b);ws[j]=w});skinIndex.push(...ids);skinWeight.push(...ws);return i}
 const fixed=b=>()=>[[b,1]],mix=(a,b,t)=>[[a,1-t],[b,t]];
 function loft(rings,c,weights,sides=12){const start=position.length/3;for(const r of rings)for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2;vertex((r[3]??0)+Math.cos(angle)*r[1],r[0],(r[4]??0)+Math.sin(angle)*r[2],c,weights(r[0]))}for(let k=0;k<rings.length-1;k++)for(let j=0;j<sides;j++){const a=start+k*(sides+1)+j,b=a+sides+1;index.push(a,a+1,b,b,a+1,b+1);if(j%2===0){const n=Math.min(2,sides-j);lowIndex.push(a,a+n,b,b,a+n,b+n)}}for(const k of [0,rings.length-1]){const r=rings[k],mid=vertex(r[3]??0,r[0],r[4]??0,c,weights(r[0]));for(let j=0;j<sides;j++){const a=start+k*(sides+1)+j;index.push(...(k?[mid,a,a+1]:[mid,a+1,a]));if(j%2===0){const n=Math.min(2,sides-j);lowIndex.push(...(k?[mid,a,a+n]:[mid,a+n,a]))}}}}
 loft([[.83,.14,.105],[.94,.155,.115],[1.08,.175,.125],[1.29,.213,.13],[1.37,.22,.11],[1.42,.14,.09],[1.44,.075,.07]],palette.coat,y=>y<1.06?mix(hips,spine,Math.max(0,(y-.86)/.20)):mix(spine,chest,Math.min(1,(y-1.06)/.23)),16);
 loft([[1.41,.061,.057],[1.48,.059,.055],[1.50,.066,.061]],palette.skin,y=>mix(neck,head,THREE.MathUtils.clamp((y-1.44)/.06,0,1)));
 loft([[1.47,.065,.064,0,.008],[1.51,.094,.086,0,.012],[1.59,.12,.102,0,.008],[1.68,.115,.101],[1.74,.085,.079,0,-.008],[1.77,.025,.029,0,-.012]],palette.skin,fixed(head),16);
 loft([[1.67,.109,.086,0,-.028],[1.735,.093,.076,0,-.025],[1.78,.04,.042,0,-.02]],palette.hair,fixed(head),16);
 // Original full-size travel pack. One restrained secondary bone, still one draw.
 const packStart=index.length;
 loft([[.86,.14,.075,0,-.25],[.94,.185,.13,0,-.30],[1.26,.19,.145,0,-.31],[1.45,.165,.12,0,-.28],[1.50,.11,.075,0,-.24]],0x716c51,fixed(pack),10);
 loft([[1.44,.18,.125,0,-.29],[1.49,.19,.135,0,-.29],[1.535,.13,.09,0,-.26]],0x8a8260,fixed(packLid),8);
 loft([[.93,.115,.035,0,-.435],[1.03,.135,.052,0,-.45],[1.22,.13,.042,0,-.46]],0x918970,fixed(pack),8);
 for(const side of [-1,1]){
  loft([[.98,.042,.052,side*.17,-.32],[1.10,.056,.064,side*.18,-.33],[1.24,.035,.05,side*.17,-.33]],0x565f4e,fixed(pack),6);
  loft([[.94,.014,.01,side*.115,-.476],[1.28,.014,.01,side*.115,-.46],[1.46,.012,.009,side*.11,-.415]],0xb8a789,fixed(pack),4);
 }
 loft([[.82,.19,.065,0,-.32],[.87,.23,.09,0,-.32],[.93,.19,.065,0,-.32]],0x647276,fixed(pack),8);
 travelerDetails('pack',{loft,fixed,mix,palette,head,chest,spine,hips,pack,packLid,arms,legs});
 const packEnd=index.length;
 // Bring the padded panel against the back. The rear shoulder straps below
 // join that panel instead of leaving an unconnected silhouette in profile.
 for(const i of new Set(index.slice(packStart,packEnd)))position[i*3+2]+=.06;
 loft([[1.395,.084,.073],[1.43,.09,.078],[1.455,.07,.065]],palette.trim,fixed(chest),12);
 for(const side of [-1,1])loft([[.95,.021,.012,side*.135,.11],[1.21,.026,.015,side*.16,.133],[1.39,.028,.017,side*.15,.09],[1.445,.02,.014,side*.13,-.04],[1.36,.02,.015,side*.13,-.16],[1.10,.018,.012,side*.13,-.155]],0xa09473,fixed(chest),6);
 loft([[1.21,.145,.012,0,.13],[1.235,.15,.012,0,.13]],0x8e876d,fixed(chest),8);
 
 loft([[1.549,.025,.003,0,.093],[1.555,.031,.004,0,.095],[1.558,.024,.003,0,.094]],0x986e5a,fixed(head),8);
 // Small nose, ears, brows and eyes stay part of the same draw.
 loft([[1.568,.016,.015,0,.106],[1.59,.021,.029,0,.115],[1.63,.012,.014,0,.106]],palette.skin,fixed(head),8);
 for(const s of [-1,1]){loft([[1.575,.016,.018,s*.119,0],[1.624,.019,.021,s*.12,0],[1.646,.01,.012,s*.115,0]],palette.skin,fixed(head),8);loft([[1.626,.009,.005,s*.044,.099],[1.637,.011,.006,s*.044,.10],[1.645,.008,.005,s*.044,.098]],palette.skin,fixed(head),8)}
 travelerDetails('head',{loft,fixed,mix,palette,head,chest,spine,hips,pack,packLid,arms,legs});
 for(let i=0;i<2;i++){const l=legs[i],a=arms[i],s=l.side,x=s*.105;const lw=y=>y>.53?fixed(l.thigh)():y<.36?fixed(l.shin)():mix(l.thigh,l.shin,(.53-y)/.17);
  loft([[.07,.055,.058,x],[.16,.059,.067,x],[.28,.068,.073,x,-.008],[.38,.073,.075,x],[.46,.075,.079,x,.016],[.53,.08,.081,x],[.68,.09,.092,x,-.006],[.82,.091,.096,x],[.90,.087,.099,x]],palette.pants,lw);
  loft([[-.045,.065,.137,x,.045],[.005,.066,.143,x,.047],[.045,.055,.095,x,.018],[.07,.052,.062,x,-.005]],palette.boots,fixed(l.foot),12);
  loft([[-.048,.067,.139,x,.045],[-.022,.067,.139,x,.045]],0x252d2b,fixed(l.foot),12);
  loft([[.02,.044,.075,x,.055],[.035,.044,.075,x,.055]],0x746b57,fixed(l.foot),8);
  for(const z of [.055,.09])loft([[.036,.042,.005,x,z],[.043,.042,.005,x,z]],0xb2a88b,fixed(l.foot),4);
  const ax=s*.235,aw=y=>y>1.11?fixed(a.upper)():y<.99?fixed(a.lower)():mix(a.upper,a.lower,(1.11-y)/.12);
  loft([[.79,.046,.045,ax+s*.035],[.91,.048,.05,ax+s*.025],[1.02,.054,.058,ax+s*.016],[1.10,.058,.06,ax+s*.012],[1.24,.071,.073,ax+s*.004],[1.34,.073,.074,ax],[1.39,.055,.06,ax]],palette.coat,aw);
  loft([[.785,.047,.048,ax+s*.035],[.805,.05,.049,ax+s*.035],[.82,.047,.048,ax+s*.035]],palette.trim,fixed(a.lower));
  loft([[.73,.032,.035,ax+s*.037,.014],[.76,.036,.037,ax+s*.036,.012],[.79,.033,.033,ax+s*.035]],palette.skin,fixed(a.hand),10);
  loft([[.724,.011,.014,ax+s*.008,.05],[.748,.014,.018,ax+s*.008,.046],[.775,.017,.021,ax+s*.006,.042]],palette.skin,y=>y<.745?fixed(a.thumbTip)():fixed(a.thumb)(),6);
 }
 travelerDetails('clothes',{loft,fixed,mix,palette,head,chest,spine,hips,pack,packLid,arms,legs});
 for(let i=0;i<lowIndex.length;i+=3){const v=lowIndex[i+1];lowIndex[i+1]=lowIndex[i+2];lowIndex[i+2]=v}
 for(let i=0;i<index.length;i+=3){const swap=index[i+1];index[i+1]=index[i+2];index[i+2]=swap}
 for(let i=0;i<position.length/3;i++)if(position[i*3+1]<.035&&position[i*3+2]>.08){const foot=bones[skinIndex[i*4]],leg=legs.find(l=>l.foot===foot);if(leg){const weight=THREE.MathUtils.clamp((position[i*3+2]-.08)*6,0,.7);skinIndex[i*4+1]=bones.indexOf(leg.toe);skinWeight[i*4]=1-weight;skinWeight[i*4+1]=weight;}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const coarse=new THREE.BufferGeometry();for(const [name,attribute]of Object.entries(geometry.attributes))coarse.setAttribute(name,attribute);coarse.setIndex(lowIndex);coarse.boundingSphere=geometry.boundingSphere;
 const wetUniform={value:0};
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0});material.userData.excludeWalkerShadow=true;lightingReceiver(material);snowReceiver(material);const priorCompile=material.onBeforeCompile,priorKey=material.customProgramCacheKey();material.onBeforeCompile=(shader,r)=>{priorCompile.call(material,shader,r);shader.uniforms.travelerWet=wetUniform;shader.vertexShader='varying float travelerCloth;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntravelerCloth=step(.08,position.y)*step(position.y,1.46);');shader.fragmentShader='uniform float travelerWet;varying float travelerCloth;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.-travelerWet*.24*travelerCloth;');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.56,travelerWet*travelerCloth);');};material.customProgramCacheKey=()=>priorKey+'-traveler-exposure-v1';const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='promeneur-articule';mesh.add(hips);mesh.bind(rig);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;avatar.add(mesh);avatar.name='promeneur';
 const motion=new DistanceGait(),last=new THREE.Vector3(Infinity,0,0),local=new THREE.Vector3(),world=new THREE.Vector3(),metrics=avatar.userData.walker={version:WALKER_VERSION,bones:bones.length,triangles:index.length/3,drawCalls:1,imageTextures:0,boneTextureBytes:bones.length*64,lod:0,lodTriangles:[index.length/3,lowIndex.length/3],phase:0,speed:0,contacts:0,soleError:0,plantError:0,mode:'idle'};let initialized=false,lastFacing=0,turn=0,contactSequence=0,poseBlend=0,packPitch=0,packRoll=0,packVX=0,packVZ=0,previousSpeed=0,aquaticLean=0;const inversePelvis=new THREE.Quaternion(),footOrientation=new THREE.Quaternion(),parentOrientation=new THREE.Quaternion(),pitchOrientation=new THREE.Quaternion();const upAxis=new THREE.Vector3(0,1,0),sideAxis=new THREE.Vector3(1,0,0),ball=new THREE.Vector3(0,-.06,.12),heel=new THREE.Vector3(0,-.06,-.04),offsetFoot=new THREE.Vector3();
 const poseTargetRotation=new THREE.Quaternion();const posePositions=bones.map(b=>b.position.clone()),poseRotations=bones.map(b=>b.quaternion.clone());let poseKind='walking',poseAge=1;
 const waterContacts=[{side:-1,position:new THREE.Vector3()},{side:1,position:new THREE.Vector3()}];
 function secondary(swim,boat,time,blend=1){
  neck.rotation.set(-spine.rotation.x*.16,head.rotation.y*.3,0);
  packLid.rotation.x=boat?0:Math.sin(time*3.1)*.012*blend;
  for(const a of arms){a.clavicle.rotation.set(0,a.side*chest.rotation.y*.25,a.side*(swim?.12:boat?.05:.015)*blend);a.hand.rotation.x=boat?-.18:swim?.12:-.05;a.fingers.rotation.x=boat?-1.05:swim?-.12:-.2;a.tips.rotation.x=boat?-1.2:-.16;a.thumb.rotation.z=a.side*(boat?.55:.22);a.thumbTip.rotation.x=boat?-.7:-.2;}
 }
 function blendPose(kind,dt){if(kind!==poseKind){poseKind=kind;poseAge=0;}poseAge=Math.min(.4,poseAge+dt);const a=1-Math.exp(-Math.max(0,dt)*12);for(let i=0;i<bones.length;i++){const b=bones[i];if(poseAge<.4){b.position.lerpVectors(posePositions[i],b.position,a);b.quaternion.slerpQuaternions(poseRotations[i],poseTargetRotation.copy(b.quaternion),a);}posePositions[i].copy(b.position);poseRotations[i].copy(b.quaternion);}}

 function point(side,z,out){out.set(side*.105,0,z).applyAxisAngle(THREE.Object3D.DEFAULT_UP,avatar.rotation.y).add(avatar.position);return out}
 const seatedHands=[new THREE.Vector3(),new THREE.Vector3()];const armV=new THREE.Vector3(),armDir=new THREE.Vector3(),armBend=new THREE.Vector3(),elbow=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0),armQ=new THREE.Quaternion();
 function grip(targets){chest.updateWorldMatrix(true,true);for(let i=0;i<2;i++){const a=arms[i];armV.copy(targets[i]);a.clavicle.worldToLocal(armV).sub(a.upper.position);const d=THREE.MathUtils.clamp(armV.length(),.05,.54);armDir.copy(armV).normalize();armBend.set(a.side*.65,-.15,-.6).addScaledVector(armDir,-armBend.dot(armDir)).normalize();const along=(.29*.29+d*d-.255*.255)/(2*d),height=Math.sqrt(Math.max(0,.29*.29-along*along));elbow.copy(armDir).multiplyScalar(along).addScaledVector(armBend,height);a.upper.quaternion.setFromUnitVectors(down,armDir.copy(elbow).normalize());armV.sub(elbow).applyQuaternion(armQ.copy(a.upper.quaternion).invert()).normalize();a.lower.quaternion.setFromUnitVectors(down,armV);}}
 function reset(){for(let i=0;i<legs.length;i++){const f=legs[i];f.cycle=Math.floor(motion.phase*.5+i*.5);point(f.side,0,f.anchor);f.target.copy(f.anchor);f.stance=true;f.swingFrom=null;f.duty=null;f.settle=null;f.liftedCycle=null;f.startingStance=false;f.startDuty=null;}initialized=true}
 return {avatar,motion,metrics,feet:legs,hips,waterContacts,
  packGeometry(){const g=new THREE.BufferGeometry();for(const key of ['position','normal','color'])g.setAttribute(key,geometry.attributes[key].clone());g.setIndex(Array.from(geometry.index.array.slice(packStart,packEnd)));return g},
  update(distance,dt,height,activity={kind:'walking'}){
  wetUniform.value=activity.wetness??wetUniform.value;const lod=activity.profile==='eco'||activity.cameraDistance>18?1:0;mesh.geometry=lod?coarse:geometry;metrics.lod=lod;metrics.triangles=metrics.lodTriangles[lod];
  if(['camping','swimming','boating','sitting','jumping'].includes(activity.kind)){
   motion.update(0,dt);const swim=activity.kind==='swimming',boat=activity.kind==='boating',seated=activity.kind==='sitting'||activity.kind==='camping',jump=activity.kind==='jumping',seat=boat?(activity.boatPose??1):seated?(activity.kind==='camping'?1:activity.sit??1):0;
   motion.footContacts.length=0;motion.contacts=0;pack.scale.setScalar(activity.kind==='camping'||boat&&seat>.55?.001:1);pack.position.set(0,swim?-.34:.03,swim?-.06:-.15);pack.rotation.set(swim?-.25:0,0,0);hips.rotation.set(0,0,0);spine.rotation.set(.08,0,Math.sin(motion.time*.7)*.008);chest.rotation.set(0,0,0);head.rotation.set(-.04,Math.sin(motion.time*.23)*.04,0);spine.scale.y=1;
   // Root in swimming is surface-.85. Horizontal body at surface-.12,
   // with face above water and separate alternating recovery/catch/kick phases.
   hips.position.y=swim?.73:jump?(activity.stepOver?.92:.82):.87-seat*(activity.kind==='sitting'?.78-(activity.seatHeight??0):.66);hips.rotation.x=swim?Math.PI*.40:0;
   const stroke=boat?(activity.stroke??0):motion.time*2.5,stepPose=jump&&activity.stepOver?sampleStepOver(activity.stepPhase??0):null;
   for(let i=0;i<2;i++){const f=legs[i],a=arms[i],phase=stroke+i*Math.PI,ik=legIK(activity.kind==='sitting'?.06-hips.position.y:-.13,activity.kind==='sitting'?(activity.seatHeight>0?.53:.48)*seat:.48);
    f.thigh.rotation.set(swim?Math.sin(motion.time*5.2+i*Math.PI)*.18:jump?-.38:activity.kind==='sitting'?ik.hip:ik.hip*seat,0,0);f.shin.rotation.x=swim?.12:jump?.75:activity.kind==='sitting'?ik.knee:ik.knee*seat;f.foot.rotation.x=swim?-.22:jump?-.3:activity.kind==='sitting'?-ik.hip-ik.knee:(-ik.hip-ik.knee)*seat;f.toe.rotation.x=0;if(stepPose){f.thigh.rotation.x=stepPose.legs[i].thigh;f.shin.rotation.x=stepPose.legs[i].shin;f.foot.rotation.x=-f.thigh.rotation.x-f.shin.rotation.x;}
    a.upper.rotation.set(swim?-1.45+Math.sin(phase)*1.2:boat?(-.95+Math.cos(stroke)*.18)*seat:jump?-.5:-.9*seat,swim?Math.cos(phase)*.23:boat?Math.sin(stroke)*.16:0,a.side*(swim?.30:boat?.32*seat:.08));a.lower.rotation.x=swim?-.35-Math.max(0,Math.cos(phase))*.8:boat?-1.0:jump?-.9:.4*seat;a.hand.rotation.z=a.side*.05;
   }
   secondary(swim,boat,motion.time);if(activity.kind==='sitting'&&seat>.8&&activity.seatHeight>0){hips.updateWorldMatrix(true,true);for(let i=0;i<2;i++){legs[i].shin.getWorldPosition(seatedHands[i]);seatedHands[i].y+=.08;}grip(seatedHands);}if(swim){const breath=Math.pow(Math.max(0,Math.sin(stroke*.5)),6);hips.rotation.z=Math.sin(stroke)*.055;chest.rotation.z=Math.sin(stroke)*.10;head.rotation.y=-breath*.65;head.rotation.x=-.12-breath*.12;metrics.breath=breath;waterContacts.breath=breath;}if(boat){chest.rotation.y=Math.sin(stroke)*.13;spine.rotation.z=Math.sin(stroke)*.025;head.rotation.y=-chest.rotation.y*.7;if(seat>.85&&activity.handTargets)grip(activity.handTargets);}
   blendPose(activity.kind,dt);aquaticLean=swim?hips.rotation.x:0;avatar.updateWorldMatrix(true,true);rig.update();for(let i=0;i<2;i++)arms[i].hand.getWorldPosition(waterContacts[i].position);waterContacts.head??=new THREE.Vector3();head.getWorldPosition(waterContacts.head);last.copy(avatar.position);initialized=false;lastFacing=avatar.rotation.y;Object.assign(metrics,{mode:activity.kind,contacts:0,speed:0,soleError:0,plantError:0});return motion;
  }
  poseKind='walking';poseAge=1;pack.scale.setScalar(1);pack.position.set(0,.03,-.15);
  const jumped=initialized&&last.distanceTo(avatar.position)>3;
  if(!jumped&&initialized&&dt>.08){const end=avatar.position.clone(),start=last.clone(),facing=avatar.rotation.y,from=lastFacing,steps=Math.ceil(dt/.08),contacts=[];for(let i=1;i<=steps;i++){avatar.position.lerpVectors(start,end,i/steps);avatar.rotation.y=from+Math.atan2(Math.sin(facing-from),Math.cos(facing-from))*i/steps;const m=this.update(distance/steps,dt/steps,height,activity);contacts.push(...m.footContacts);}avatar.position.copy(end);avatar.rotation.y=facing;motion.footContacts.splice(0,motion.footContacts.length,...contacts);motion.contacts=contacts.length;metrics.contacts=contacts.length;return motion;}
  if(!initialized||jumped)reset();
  if(distance>0&&(motion.idleTime>.3||motion.blend<.01)){
   // Begin the swing at toe-off, from the actual settled contact. The old
   // restart began one foot halfway through flight and replanted its partner
   // ahead in a single frame. Neither physical root nor planted foot is moved.
   local.copy(legs[0].target).sub(legs[1].target).applyAxisAngle(upAxis,-avatar.rotation.y);
   motion.phase=Math.ceil(motion.phase/2)*2+2*sampleLocomotion(0,motion.run).duty+(local.z<0?1:0);
   for(let i=0;i<legs.length;i++){const f=legs[i];f.cycle=Math.floor(motion.phase*.5+i*.5);f.stance=true;f.liftedCycle=null;f.swingFrom=null;f.settle=null;f.startingStance=true;f.startDuty=null;}
  }
  motion.update(jumped?0:distance,dt);last.copy(avatar.position);const wave=motion.phase*Math.PI,turnRate=dt>0?Math.atan2(Math.sin(avatar.rotation.y-lastFacing),Math.cos(avatar.rotation.y-lastFacing))/dt:0;lastFacing=avatar.rotation.y;turn+=(THREE.MathUtils.clamp(turnRate,-2,2)-turn)*(1-Math.exp(-dt*5));
  let hip=.87+motion.run*.025*Math.sin(wave*2-.3)*motion.blend;
  metrics.soleError=metrics.plantError=metrics.plantSlideM=0;metrics.swingIK=0;
  for(let i=0;i<2;i++){
   const f=legs[i],q=(motion.phase*.5+i*.5)%1,cycle=Math.floor(motion.phase*.5+i*.5),clip=sampleLocomotion(q,motion.run,f.clip,f.scratch);
   sampleJointPose(q,motion.run,f.joints,f.jointScratch);
   const wasStance=f.stance;
   if(motion.speed>.025){
    // A contact interval belongs to one cycle. Blending walk/run must not
    // repeatedly replant the same foot as the duty factor crosses its phase.
    f.duty=clip.duty;
    f.stopAge=0;f.stance=q<f.duty&&f.liftedCycle!==cycle;
    if(f.startingStance&&f.stance&&f.cycle===cycle){local.copy(f.anchor).sub(avatar.position).applyAxisAngle(upAxis,-avatar.rotation.y);if(local.z<-.28){f.stance=false;f.startDuty=q;f.liftedCycle=cycle;}}
    if(f.stance&&(!wasStance||f.cycle!==cycle)){
     // Account for the fraction of the frame after touchdown. This keeps the
     // world contact independent of 30/60/120 Hz sampling.
     point(f.side,motion.stride*(.44-.16*motion.run)+.10-q*2*motion.stride,f.anchor);f.plantHeading=avatar.rotation.y;f.measured=false;f.startingStance=false;f.startDuty=null;
     motion.footContacts.push({side:f.side,position:f.anchor.clone(),run:motion.run,energy:.65+motion.run*.55});
    }
    if(!f.stance){
     if(wasStance||!f.swingFrom){f.swingFrom=f.anchor.clone();f.swingPitch=f.pitch??0;f.swingDuty=f.startDuty??f.duty;f.liftedCycle=cycle;f.swingLocal=f.anchor.clone().sub(avatar.position).applyAxisAngle(upAxis,-avatar.rotation.y);f.swingLocal.z+=Math.max(0,q-f.swingDuty)*2*motion.stride;}
     const phase=THREE.MathUtils.clamp((q-f.swingDuty)/(1-f.swingDuty),0,1),u=phase*phase*phase*(10+phase*(-15+phase*6));
     const p2=phase*phase,p3=p2*phase,travel=2*motion.stride*(1-f.swingDuty),front=motion.stride*(.44-.16*motion.run)+.10;
     // Hermite tangents cancel root travel at both endpoints. The old
     // world-space lerp overreached the leg before landing and collapsed the
     // pelvis every stride, even on a mathematically flat floor.
     const reach=(2*p3-3*p2+1)*f.swingLocal.z+(p3-2*p2+phase)*(-travel)+(-2*p3+3*p2)*front+(p3-p2)*(-travel);
     point(f.side,reach,f.target);const endHeight=height(f.target.x,f.target.z);
     f.target.y=f.swingFrom.y+((Number.isFinite(endHeight)?endHeight:avatar.position.y)-f.swingFrom.y)*u;
     // The original clip supplies clearance; quintic endpoint correction
     // joins toe-off and touchdown without replacing the rig with a filter.
     f.target.y+=Math.sin(Math.PI*phase)**2*(.10+.18*motion.run);
     f.pitch=(f.swingPitch??0)*(1-u)+f.joints.footPitch*Math.sin(Math.PI*phase)**2;
     offsetFoot.copy(ball).applyAxisAngle(sideAxis,f.pitch).applyAxisAngle(upAxis,avatar.rotation.y);f.ankle.copy(f.target).sub(offsetFoot);
    }
   }else{
    f.stopAge+=dt;
    local.copy(f.anchor).sub(avatar.position).applyAxisAngle(upAxis,-avatar.rotation.y);const needsStep=Math.hypot(local.x-f.side*.105,.74-local.y-.06,local.z-.12)>.855;point(f.side,0,world);if(!f.settle&&(f.anchor.distanceTo(world)>.12||Math.abs(Math.atan2(Math.sin(avatar.rotation.y-f.plantHeading),Math.cos(avatar.rotation.y-f.plantHeading)))>.4||!f.stance)&&(needsStep||f.stopAge>.3+(f.side>0?.2:0))){f.settle={from:f.contact.clone(),age:0};f.measured=false;}if(f.settle){f.stance=false;f.settle.age+=dt;const t=Math.min(1,f.settle.age/.32),u=t*t*(3-2*t);f.target.lerpVectors(f.settle.from,world,u);const h=height(f.target.x,f.target.z);f.target.y=(Number.isFinite(h)?h:avatar.position.y)+Math.sin(Math.PI*t)*.065;f.pitch=0;offsetFoot.copy(ball).applyAxisAngle(upAxis,avatar.rotation.y);f.ankle.copy(f.target).sub(offsetFoot);if(t===1){f.anchor.copy(f.target);f.stance=true;f.plantHeading=avatar.rotation.y;f.settle=null;}}
   }
   f.cycle=cycle;
   if(f.stance){
    const qn=clip.phase/(f.duty??clip.duty),t=THREE.MathUtils.smoothstep(qn,.55,1);f.pitch=t*(.90-motion.run*.08);
    if(motion.speed<.025)f.pitch*=Math.exp(-f.stopAge*12);
    let h=height(f.anchor.x,f.anchor.z);
    if(!Number.isFinite(h)||Math.abs(h-avatar.position.y)>.32||Math.hypot(f.anchor.x-avatar.position.x,f.anchor.z-avatar.position.z)>.7){point(f.side,.12,f.anchor);h=height(f.anchor.x,f.anchor.z);f.plantHeading=avatar.rotation.y;f.measured=false;}
    f.anchor.y=Number.isFinite(h)?h:avatar.position.y;
    f.target.copy(f.anchor);
    offsetFoot.copy(ball).applyAxisAngle(sideAxis,f.pitch).applyAxisAngle(upAxis,f.plantHeading);f.ankle.copy(f.anchor).sub(offsetFoot);
   }
   if(!f.stance&&!f.settle){
    // Solve sole clearance BEFORE pelvis/reach and IK. The old second solve
    // used another target and introduced a3mm step at toe-off/touchdown.
    const phase=THREE.MathUtils.clamp((q-(f.swingDuty??clip.duty))/(1-(f.swingDuty??clip.duty)),0,1),margin=.003*Math.sin(Math.PI*phase)**2;
    offsetFoot.copy(ball).applyAxisAngle(sideAxis,f.pitch??0).applyAxisAngle(upAxis,avatar.rotation.y).add(f.ankle);
    const hb=height(offsetFoot.x,offsetFoot.z),ballGap=Number.isFinite(hb)?hb+margin-offsetFoot.y:0;
    offsetFoot.copy(heel).applyAxisAngle(sideAxis,f.pitch??0).applyAxisAngle(upAxis,avatar.rotation.y).add(f.ankle);
    const hh=height(offsetFoot.x,offsetFoot.z),heelGap=Number.isFinite(hh)?hh+margin-offsetFoot.y:0,correction=Math.max(0,ballGap,heelGap);
    if(correction>0){f.ankle.y+=correction;metrics.swingIK++;}
   }
   // The same reach envelope applies on BOTH sides of toe-off/touchdown.
   // Dropping it during flight used to snap the pelvis up once per footfall.
   local.copy(f.ankle).sub(avatar.position).applyAxisAngle(upAxis,-avatar.rotation.y);
   const available=Math.sqrt(Math.max(.05,.855*.855-local.z*local.z-(local.x-f.side*.105)**2));
   // A hard minimum switched the controlling leg with a velocity kink twice
   // per stride. This spatial envelope preserves planted feet exactly; it
   // does not filter or delay the input/root or the contact anchor.
   hip=softMinimum(hip,available+local.y);
  }
  hip=THREE.MathUtils.clamp(hip,.74,.94);hips.position.y=hip;
  aquaticLean*=Math.exp(-dt*8);hips.rotation.set(aquaticLean,Math.sin(wave)*(.025+.018*motion.run)*motion.blend,-Math.sin(wave)*.014*motion.blend-turn*.018*motion.blend);
  inversePelvis.copy(hips.quaternion).invert();
  const front=point(0,.35,world),hf=height(front.x,front.z),back=point(0,-.35,local),hb=height(back.x,back.z),slope=Number.isFinite(hf)&&Number.isFinite(hb)?THREE.MathUtils.clamp((hf-hb)/.7,-.5,.5):0;
  const acceleration=dt>0?THREE.MathUtils.clamp((motion.speed-previousSpeed)/dt,-5,5):0;previousSpeed=motion.speed;
  spine.rotation.set((legs[0].clip.pitch+slope*.24+acceleration*.012)*motion.blend,-Math.sin(wave+.15)*.035*motion.blend,Math.sin(wave+.35)*.012*motion.blend+turn*.045*motion.blend);
  chest.rotation.set(0,-legs[0].clip.twist*motion.blend-turn*.055*motion.blend,0);
  const targetPitch=Math.sin(wave+.7)*.025*motion.blend-acceleration*.01,targetRoll=-Math.sin(wave)*.022*motion.blend-turn*.02;
  for(let t=0;t<dt;){const h=Math.min(.016,dt-t);packVX+=((targetPitch-packPitch)*95-packVX*18)*h;packVZ+=((targetRoll-packRoll)*95-packVZ*18)*h;packPitch+=packVX*h;packRoll+=packVZ*h;t+=h;}pack.rotation.set(packPitch,0,packRoll);
  spine.scale.y=1+Math.sin(motion.time*1.3)*.003*(1-motion.blend);head.rotation.set(-spine.rotation.x*.65,Math.sin(motion.time*.37)*.018*(1-motion.blend)+turn*.045,-spine.rotation.z*.7);
  function solveLeg(f,target){local.copy(target).sub(avatar.position).applyAxisAngle(upAxis,-avatar.rotation.y);local.y-=hip;local.applyQuaternion(inversePelvis);const dy=local.y,dx=local.x-f.side*.105,roll=Math.atan2(dx,-dy),ik=legIK(-Math.hypot(dy,dx),local.z);f.thigh.rotation.set(ik.hip,0,roll);f.shin.rotation.set(ik.knee,0,0);}
  function orientFoot(f,pitch,heading){f.shin.updateWorldMatrix(true,false);f.shin.getWorldQuaternion(parentOrientation);footOrientation.setFromAxisAngle(upAxis,heading).multiply(pitchOrientation.setFromAxisAngle(sideAxis,pitch));f.foot.quaternion.copy(parentOrientation).invert().multiply(footOrientation);f.toe.rotation.x=-Math.max(0,pitch)*.22;}
  for(const f of legs){
   solveLeg(f,f.ankle);
   orientFoot(f,f.pitch??0,f.stance?f.plantHeading:avatar.rotation.y);
  }
  for(let i=0;i<2;i++){const a=arms[i],clip=legs[i].clip;a.upper.rotation.set(.055+clip.arm*motion.blend+turn*a.side*.025,0,a.side*(.065+motion.run*.025)+clip.roll*motion.blend);a.lower.rotation.set(-.13+(clip.elbow+.13)*motion.blend,0,0);a.hand.rotation.z=a.side*.035;}
  secondary(false,false,motion.time,motion.blend);
  for(let i=0;i<bones.length;i++){posePositions[i].copy(bones[i].position);poseRotations[i].copy(bones[i].quaternion);}
  head.rotation.y=Math.sin(motion.time*.37)*.018*(1-motion.blend)+turn*.035;avatar.updateWorldMatrix(true,true);rig.update();
  // Actual ball-of-foot world positions, not an error against a moving target.
  for(const f of legs){f.foot.localToWorld(f.contact.copy(ball));if(f.stance){const h=height(f.contact.x,f.contact.z);if(Number.isFinite(h))metrics.soleError=Math.max(metrics.soleError,Math.abs(f.contact.y-h));metrics.plantError=Math.max(metrics.plantError,Math.hypot(f.contact.x-f.anchor.x,f.contact.z-f.anchor.z));if(f.measured)metrics.plantSlideM=Math.max(metrics.plantSlideM,Math.hypot(f.contact.x-f.previous.x,f.contact.z-f.previous.z));f.measured=true;}else f.measured=false;f.previous.copy(f.contact);}
  for(const contact of motion.footContacts){const f=legs.find(f=>f.side===contact.side);contact.position.copy(f.contact);const h=height(contact.position.x,contact.position.z);contact.position.y=h??avatar.position.y;contact.heading=f.plantHeading;contact.id=++contactSequence;contact.confirmed=f.stance&&Number.isFinite(h)&&Math.abs(f.contact.y-h)<.035;}
  motion.contacts=motion.footContacts.length;Object.assign(metrics,{phase:motion.phase,speed:motion.speed,contacts:motion.contacts,pelvisY:hip,mode:motion.blend<.02?'idle':motion.run>.5?'run':'walk'});return motion;
 },dispose(){coarse.dispose();geometry.dispose();material.dispose();rig.dispose()}};
}
