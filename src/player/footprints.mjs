import * as THREE from 'three';
const LIMITS=Object.freeze({eco:96,balanced:256,quality:384,custom:256});
/** Session-local, bounded projected impressions. No terrain displacement. */
export function createFootprints(scene){
 const capacity=384,vertices=15,indices=[];for(let z=0;z<4;z++)for(let x=0;x<2;x++){const a=z*3+x;indices.push(a,a+3,a+1,a+1,a+3,a+4)}
 const geometry=new THREE.BufferGeometry(),position=new Float32Array(capacity*vertices*3),uv=new Float32Array(capacity*vertices*2),stamp=new Float32Array(capacity*vertices*4),index=[];
 for(let slot=0;slot<capacity;slot++){for(let j=0;j<5;j++)for(let i=0;i<3;i++)uv.set([i/2,j/4],(slot*vertices+j*3+i)*2);for(const i of indices)index.push(slot*vertices+i);}
 geometry.setAttribute('position',new THREE.BufferAttribute(position,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setAttribute('stamp',new THREE.BufferAttribute(stamp,4).setUsage(THREE.DynamicDrawUsage));geometry.setIndex(index);geometry.setDrawRange(0,0);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,uniforms:{now:{value:0},deposit:{value:0},day:{value:1}},vertexShader:'attribute vec4 stamp;varying vec2 vUv;varying vec4 vStamp;void main(){vUv=uv;vStamp=stamp;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float now,deposit,day;varying vec2 vUv;varying vec4 vStamp;
 void main(){
  vec2 p=(vUv-.5)*vec2(2.,2.);float side=vStamp.z;float heel=length((p-vec2(-side*.05,-.53))/vec2(.65,.40)),toe=length((p-vec2(side*.08,.25))/vec2(.78,.69));
  float sole=min(heel,toe),edge=sin(p.y*38.+p.x*17.)*.025;sole+=edge;
  float interior=1.-smoothstep(.74,.99,sole),rim=smoothstep(.80,.93,sole)*(1.-smoothstep(.98,1.16,sole));
  float tread=(.5+.5*sin(p.y*55.))*smoothstep(.15,.3,abs(p.x))*.12;
  float snowFade=(1.-smoothstep(vStamp.y+.035,vStamp.y+.18,deposit))*smoothstep(.05,.5,deposit),ageFade=1.-smoothstep(240.,330.,now-vStamp.x);
  float alpha=(interior*.45+rim*.20)*snowFade*ageFade*vStamp.w;if(alpha<.003)discard;
  vec3 compressed=mix(vec3(.21,.29,.35),vec3(.32,.42,.49),day)*(1.-tread);vec3 c=mix(compressed,vec3(.93,.96,.98),rim*.85);gl_FragColor=vec4(c,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='contact-snow-impressions';mesh.frustumCulled=false;mesh.renderOrder=3;mesh.visible=false;scene.add(mesh);
 const slots=Array.from({length:capacity},()=>({alive:false,time:0,x:0,z:0,cover:0,fade:0}));let clock=0,cursor=0,total=0,last=null,seen=new Set(),cleared=false;
 const metrics={capacity,active:0,total:0,rejected:0,bytes:position.byteLength+uv.byteLength+stamp.byteLength+geometry.index.array.byteLength,drawCalls:0,cpuMs:0,contacts:[],technique:'Projected 15-point boot grids, compression/rim/tread shading; no geometric ground deformation'};
 function remove(i){slots[i].alive=false;for(let j=0;j<vertices;j++)stamp[(i*vertices+j)*4]=clock-1000;}
 return {metrics,mesh,update(dt,player,climate,contacts,world,profile='balanced',enabled=true){
  const started=performance.now();clock+=Math.max(0,Math.min(1,dt));const cap=LIMITS[profile]??256,cover=climate?.snow?.cover??0;
  if(last&&Math.hypot(player.x-last.x,player.z-last.z)>3){seen.clear();contacts=[];}last={x:player.x,z:player.z};
  if(!enabled)contacts=[];const coat=cover>.04;material.uniforms.now.value=clock;material.uniforms.deposit.value=cover;material.uniforms.day.value=Math.max(.12,Math.sin(climate?.solar?.altitude??1));
  let dirty=false,active=0,highest=-1;
  for(let i=0;i<capacity;i++){const s=slots[i];if(!s.alive)continue;if(i>=cap||!coat||clock-s.time>330||Math.hypot(s.x-player.x,s.z-player.z)>85){remove(i);dirty=true;continue;}active++;highest=i;}
  for(const c of contacts??[]){if(seen.has(c.id))continue;seen.add(c.id);if(seen.size>512)seen.delete(seen.values().next().value);const result=world.footprint(c,climate);if(!result.ok){metrics.rejected++;continue;}
   let slot=slots.findIndex((s,i)=>i<cap&&!s.alive);if(slot<0){slot=cursor++%cap;}const s=slots[slot];Object.assign(s,{alive:true,time:clock,x:c.position.x,z:c.position.z,cover});
   const pressure=Math.min(1,result.snow.depthM/.025)*(.76+.24*c.run)*(result.snow.temperature>0?.72:1);
   for(let j=0;j<vertices;j++){const p=result.points[j],at=(slot*vertices+j)*3;position.set([p.x,p.y+.0015,p.z],at);stamp.set([clock,cover,c.side,pressure],(slot*vertices+j)*4);}
   highest=Math.max(highest,slot);dirty=true;total++;metrics.contacts.push({id:c.id,side:c.side,position:{...c.position},heading:c.heading,support:result.support.id,depthM:result.depth,vertices:result.points});if(metrics.contacts.length>64)metrics.contacts.shift();
  }
  metrics.active=slots.filter((s,i)=>s.alive&&i<cap).length;metrics.total=total;mesh.visible=coat&&metrics.active>0;metrics.drawCalls=Number(mesh.visible);geometry.setDrawRange(0,(highest+1)*indices.length);
  if(dirty){geometry.attributes.position.needsUpdate=true;geometry.attributes.stamp.needsUpdate=true;}metrics.cpuMs=performance.now()-started;
 },clear(){slots.forEach((s,i)=>remove(i));seen.clear();mesh.visible=false;geometry.setDrawRange(0,0);metrics.active=0},dispose(){scene.remove(mesh);geometry.dispose();material.dispose();seen.clear();}};
}
