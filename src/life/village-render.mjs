import * as THREE from 'three';
/** One bounded instanced draw, shared metric rounded primitive and material.
 * No textures, skinning, shadow-map pass or per-frame geometry allocation. */
export function createVillageRender(scene,capacity=1200){
 const profile=[[0,0],[0,.55],[.045,.85],[.16,.98],[.84,.98],[.955,.85],[1,.55],[1,0]],points=profile.map(([y,r])=>new THREE.Vector2(r*.5,y-.5));
 const geometry=new THREE.LatheGeometry(points,10),material=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,depthWrite:true});
 const fades=new Float32Array(capacity);geometry.setAttribute('lifeFade',new THREE.InstancedBufferAttribute(fades,1));material.onBeforeCompile=shader=>{shader.vertexShader='attribute float lifeFade;varying float vLifeFade;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLifeFade=lifeFade;');shader.fragmentShader='varying float vLifeFade;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a*=vLifeFade;\n#include <opaque_fragment>');};
 const batch=new THREE.InstancedMesh(geometry,material,capacity);batch.name='village-life-silhouettes';batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batch.frustumCulled=false;batch.count=0;batch.castShadow=false;batch.receiveShadow=false;scene.add(batch);
 const object=new THREE.Object3D(),col=new THREE.Color(),a=new THREE.Vector3(),b=new THREE.Vector3(),v=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),yAxis=new THREE.Vector3(0,1,0);let count=0,monochrome=false,currentFade=1;const admissions=new Map();
 const feet=new Map();const stats={instances:0,triangles:0,drawCalls:0,capacity,poseMs:0,maxPoseMs:0,footSupportError:0};
 function add(x,y,z,w,h,d,color,rotation=null){if(count>=capacity)return;object.position.set(x,y,z);object.scale.set(w,h,d);object.quaternion.copy(rotation??q.identity());object.updateMatrix();batch.setMatrixAt(count,object.matrix);col.setHex(color);if(monochrome){const l=col.r*.2126+col.g*.7152+col.b*.0722;col.setRGB(l,l,l)}batch.setColorAt(count,col);fades[count]=currentFade;count++}
 function person(m,g,time,height,near=true){const p=m.person,o=m.outfit,H=p.height,W=.39*p.build*p.shoulders,HIP=H*p.legRatio,head=H*p.headRatio,headY=H-head*.55,shoulderY=H-head*1.75,torso=shoulderY-HIP,phase=m.phase+p.phase,walk=m.speed>.025&&g.state==='walk',yaw=m.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw),pos=m.position,gesture=g.state==='activity'||g.state==='pause',lean=p.posture+(g.kind==='cycle'?.17:walk?.015:0),breath=Math.sin(time*1.5+p.phase)*.002;
 const world=(x,y,z,out)=>out.set(pos.x+c*x+s*z,pos.y+y,pos.z-s*x+c*z);
 function part(x,y,z,w,h,d,color,rx=0,rz=0){world(x,y,z,a);object.rotation.set(rx,yaw,rz);q.copy(object.quaternion);add(a.x,a.y,a.z,w,h,d,color,q)}
 function segment(x1,y1,z1,x2,y2,z2,w,d,color){world(x1,y1,z1,a);world(x2,y2,z2,b);v.subVectors(b,a);q.setFromUnitVectors(up,v.clone().normalize());const len=v.length();v.addVectors(a,b).multiplyScalar(.5);add(v.x,v.y,v.z,w,len,d,color,q)}
 const coat=['coat','raincoat'].includes(o.style),skirt=['dress','skirt'].includes(o.style),shorts=o.shorts;
 part(0,HIP+torso*.45+breath,lean,W,torso*1.08,.24*p.build,o.top);
 part(0,HIP,.0,W*.78,.22,.235*p.build,o.bottom);
 if(coat||skirt)part(0,HIP-.13,0,W*(skirt?1.27:1.09),skirt?H*.30:.41,.26*p.build,skirt&&o.style==='skirt'?o.bottom:o.top);
 part(0,(shoulderY+headY-head*.45)/2,lean,head*.40,headY-head*.45-shoulderY+.07,head*.37,p.skin);
 part(0,headY,lean,head*p.face,head,head*.91,p.skin);
 part(0,headY+head*.31,-head*.07+lean,head*p.face*1.04,head*.48,head*.96,p.hair);
 if(p.hairStyle===1||p.hairStyle===3){part(0,headY-head*.15,-head*.31,head*1.06,head*(p.hairStyle===3?1.50:.84),head*.72,p.hair);if(p.hairStyle===3)part(head*.38,headY-head*.75,-head*.45,head*.40,head*.68,head*.43,p.hair)}
 if(p.hairStyle===2)for(const side of [-1,1])part(side*head*.42,headY+head*.25,0,head*.42,head*.65,head*.98,p.hair);
 if(near){part(0,headY-head*.02,head*.49+lean,head*.17,head*.25,head*.20,p.skin);for(const side of [-1,1]){part(side*head*.52,headY,lean,head*.14,head*.28,head*.22,p.skin);part(side*head*.21,headY+head*.06,head*.43+lean,head*.07,head*.055,head*.03,0x35342d);if(p.glasses)part(side*head*.23,headY+head*.055,head*.45+lean,head*.34,head*.17,head*.042,0x575955)}if(p.beard)part(0,headY-head*.31,head*.20,head*.80,head*.26,head*.65,p.hair)}
 if(o.hat){part(0,H-head*.02,0,head*1.18,head*.34,head*1.14,o.top);if(!coat)part(0,H-head*.14,.02,head*1.65,head*.07,head*1.58,o.top)}
 if(o.scarf)part(0,shoulderY+.045,0,W*.55,.10,.29,0x9d886e);
 if(o.pack)part(0,HIP+torso*.55,-.18,.27,torso*.75,.15,0x8b8067);
 let state=feet.get(p.id);if(!state){state={feet:[{anchor:null,stance:false},{anchor:null,stance:false}],last:pos};feet.set(p.id,state)}
 for(let j=0;j<2;j++){const side=j?-1:1,xx=side*W*.21,F=state.feet[j],ph=((m.phase/Math.PI/2+j*.5)%1+1)%1,duty=.57,stance=!walk||ph<duty,stride=p.height*p.stride;
  let target=world(xx,.035,stride*.35,b).clone();if(!F.anchor||Math.hypot(F.anchor.x-pos.x,F.anchor.z-pos.z)>1.5)F.anchor=world(xx,.035,0,b).clone();
  if(stance){if(!F.stance&&walk)F.anchor.copy(target);target.copy(F.anchor)}else{const t=(ph-duty)/(1-duty),f=t*t*(3-2*t);target.lerpVectors(F.anchor,target,f);target.y=pos.y+.035+Math.sin(Math.PI*t)*.075*H/1.7;}
  if(g.kind==='cycle')target=world(xx,.43+Math.sin(m.distance*4+j*Math.PI)*.15,.10+Math.cos(m.distance*4+j*Math.PI)*.15,b).clone();
  const ground=g.kind==='cycle'?null:height(target.x,target.z);if(ground!==null&&Number.isFinite(ground))target.y=stance?ground+.035:Math.max(ground+.035,target.y);F.stance=stance;if(stance&&ground!==null&&Number.isFinite(ground)){for(const dz of [-.06,.06]){const h=height(target.x+s*dz,target.z+c*dz);if(h!==null&&Number.isFinite(h))stats.footSupportError=Math.max(stats.footSupportError,Math.abs(target.y-.035-h));}}
  // Transform a world planted foot into this person's proportional leg frame.
  const dx=target.x-pos.x,dz=target.z-pos.z,fx=dx*c-dz*s,fz=dx*s+dz*c,fy=target.y-pos.y,leg=HIP-.065,L=(leg-.035)*.50,M=(leg-.035)*.50,dy=leg-fy,d=Math.min(L+M-.0001,Math.hypot(dy,fz)),alpha=Math.acos(THREE.MathUtils.clamp((L*L+d*d-M*M)/(2*L*d),-1,1)),angle=Math.atan2(fz,dy),kneeY=leg-L*Math.cos(angle+alpha),kneeZ=L*Math.sin(angle+alpha);
  segment(xx,leg,0,fx,kneeY,kneeZ,W*.22,.12*p.build,o.bottom);segment(fx,kneeY,kneeZ,fx,fy+.045,fz,W*.18,.105*p.build,shorts?p.skin:o.bottom);part(fx,fy,fz+.035,W*.23,.07,.19*H/1.7,0x343732);
  const armX=side*W*.50,handY=HIP+.03,armZ=walk?-Math.sin(phase+j*Math.PI)*p.armSwing*.36:gesture?Math.sin(time*.8+p.phase+j)*.045:.015,elbowY=shoulderY-torso*.50,handZ=g.kind==='cycle'?.48:g.kind==='stroller'?.42:gesture&&g.activity==='photo'?.27:armZ;
  const handTop=g.kind==='cycle'?HIP+.13:gesture&&g.activity==='photo'?headY-.05:handY,elbowZ=handZ*.55;
  segment(armX,shoulderY,lean,armX*1.06,elbowY,elbowZ,W*.22,.12,o.top);segment(armX*1.06,elbowY,elbowZ,armX*1.04,handTop,handZ,W*.17,.095,['tee','shorts'].includes(o.style)?p.skin:o.top);part(armX*1.04,handTop-.035,handZ,.065,.105,.065,p.skin);
 }
 if(gesture&&g.activity==='photo')part(0,headY-.08,.29,.15,.085,.045,0x393f3c);
 if(o.umbrella){segment(W*.50,HIP+.1,.05,W*.50,H+.36,.05,.018,.018,0x6b6559);part(W*.50,H+.37,.05,.93,.19,.93,o.top)}
 if(g.kind==='cycle'){
  const wheel=(zz)=>{const phase=m.distance/.34;for(let k=0;k<16;k++){const a=k/16*Math.PI*2,b=(k+1)/16*Math.PI*2;segment(0,.34+Math.sin(a)*.34,zz+Math.cos(a)*.34,0,.34+Math.sin(b)*.34,zz+Math.cos(b)*.34,.032,.032,0x343b37)}for(let k=0;k<4;k++){const a=phase+k*Math.PI/2;segment(0,.34,zz,0,.34+Math.sin(a)*.31,zz+Math.cos(a)*.31,.012,.012,0x9b9c8f)}};
  wheel(-.55);wheel(.65);for(const [a,b]of [[[-0,.34,-.55],[0,.80,-.10]],[[0,.80,-.10],[0,.37,.12]],[[0,.37,.12],[0,.34,-.55]],[[0,.80,-.10],[0,.83,.47]],[[0,.83,.47],[0,.37,.12]],[[0,.34,.65],[0,.98,.43]]])segment(...a,...b,.035,.035,o.top);
  part(0,.87,-.11,.16,.055,.25,0x3d433c);segment(-.24,.99,.47,.24,.99,.47,.03,.03,0x727c72);
 }
 if(g.kind==='stroller'&&p.age!=='baby'){part(0,.55,.72,.58,.26,.65,o.top);part(0,.79,.76,.60,.20,.44,o.top);part(0,.63,.66,.20,.24,.30,0xb3a991);part(0,.73,.61,.16,.17,.17,g.members.find(m=>m.person.age==='baby')?.person.skin??p.skin);for(const side of [-1,1])for(const z of [.50,.98])part(side*.28,.15,z,.095,.26,.26,0x3f4440);segment(-.28,.55,.60,-.25,.95,.40,.025,.025,0x7a7d72);segment(.28,.55,.60,.25,.95,.40,.025,.025,0x7a7d72)}
 }
 function animal(a,g,time){const p=a.position,H=a.size??.28,s=Math.sin(a.yaw??0),c=Math.cos(a.yaw??0),color=[0x896d4c,0xccc0a8,0x4e4c45][a.seed%3];const put=(x,y,z,w,h,d,col)=>{const px=p.x+x*c+z*s,pz=p.z-x*s+z*c;object.rotation.set(0,a.yaw??0,0);q.copy(object.quaternion);add(px,p.y+y,pz,w,h,d,col,q)};
 put(0,H*.75,0,H*.48,H*.55,H*1.30,color);put(0,g.state==='pause'?H*.62:H*1.09,H*.65,H*.42,H*.44,H*.49,color);for(const side of [-1,1]){put(side*H*.20,H*1.29,H*.60,H*.15,H*.33,H*.19,color);for(const z of [-.40,.43]){const phase=a.distance/H*4+side+z*3;put(side*H*.20,H*.30,z*H+Math.sin(phase)*H*.05,H*.13,H*.59,H*.13,color)}}put(0,H*1.10,-H*.77,H*(a.kind==='squirrel'?.40:.12),H*(a.kind==='squirrel'?1.35:.65),H*.18,color);
 }
 return {batch,stats,set monochrome(v){monochrome=v},begin(){count=0;stats.footSupportError=0},person,animal,finish(){batch.count=count;batch.instanceMatrix.needsUpdate=true;geometry.attributes.lifeFade.needsUpdate=true;if(batch.instanceColor)batch.instanceColor.needsUpdate=true;stats.instances=count;stats.triangles=count*geometry.index.count/3;stats.drawCalls=count?1:0},draw(groups,time,height,near=()=>true){const start=performance.now();this.begin();const ids=new Set();for(const g of groups){if(!admissions.has(g.id))admissions.set(g.id,time);currentFade=Math.min(1,Math.max(0,(time-admissions.get(g.id))/2.5));for(const m of g.members){ids.add(m.person.id);if(m.person.age!=='baby')person(m,g,time,height,near(m));}if(g.animal)animal(g.animal,g,time)}for(const id of feet.keys())if(!ids.has(id))feet.delete(id);this.finish();stats.poseMs=performance.now()-start;stats.maxPoseMs=Math.max(stats.maxPoseMs,stats.poseMs)},dispose(){scene.remove(batch);geometry.dispose();material.dispose();feet.clear();admissions.clear()}};
}
