import * as THREE from 'three';
// @ts-ignore Same frame clock as the weather, no independent animation loop.
import {lifeUniforms} from '../earthlife/state.mjs';
/** Opaque world-anchored coverage. No alpha blend, added texture or time noise.
 * Fine and fallback panels use the same coverage with opposite discard tests. */
export function coverageReceiver(material:THREE.Material,range=new THREE.Vector2(65,110),born=-1000,incoming=true){
 const state={range:{value:range},born:{value:born},incoming};
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(s,r){previous.call(this,s,r);Object.assign(s.uniforms,{m19Range:state.range,m19Born:state.born,m19Time:lifeUniforms.lifeTime});
  s.vertexShader='varying vec3 v19World;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`vec4 c19=vec4(transformed,1.);
   #ifdef USE_INSTANCING
   c19=instanceMatrix*c19;
   #endif
   v19World=(modelMatrix*c19).xyz;
   #include <project_vertex>`);
  s.fragmentShader='varying vec3 v19World;uniform vec2 m19Range;uniform float m19Born,m19Time;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
   float c19Range=1.-smoothstep(m19Range.x,m19Range.y,length(v19World-cameraPosition));
   float c19=c19Range*smoothstep(0.,.65,m19Time-m19Born);
   if(c19<.0001){${incoming?'discard;':''}}
   else if(c19>.9999){${incoming?'':'discard;'}}
   else {float n19=fract(sin(dot(floor(v19World*32.),vec3(12.9898,78.233,37.719)))*43758.5453);if(${incoming?'n19>=c19':'n19<c19'})discard;}`);
 };
 material.customProgramCacheKey=()=>key+'-world-coverage19-'+incoming;material.userData.coverage19=state;material.needsUpdate=true;return state;
}
export function coverageClone(source:THREE.Material,range:THREE.Vector2,born:number,incoming=true){
 const m=source.clone();(m as any).defines={...(source as any).defines};m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=source.customProgramCacheKey;m.userData.architectureShared=false;
 coverageReceiver(m,range,born,incoming);
 m.onBeforeRender=()=>{const desired=(source as any).defines??{},current=(m as any).defines;for(const k of Object.keys(desired))if(current[k]!==desired[k]){current[k]=desired[k];m.needsUpdate=true}};return m;
}

/** Reuse original attribute buffers; submit only spatial buckets that can
 * contribute to the distance fade. The 8 m margin covers motion between ticks. */
export function selectDetailIndices(mesh:THREE.Mesh,camera:THREE.Camera,range:number){
 const g=mesh.geometry,start=performance.now();let state=g.userData.detailSelection19;
 if(!state){const p=g.attributes.position,source=g.index?.array??Uint32Array.from({length:p.count},(_,i)=>i),groups=new Map<string,any>();
  for(let i=0;i<source.length;i+=3){const ids=[source[i],source[i+1],source[i+2]],x=ids.reduce((s,j)=>s+p.getX(j)/3,0),z=ids.reduce((s,j)=>s+p.getZ(j)/3,0),key=Math.floor(x/16)+':'+Math.floor(z/16);let b=groups.get(key);if(!b){b={key,ids:[],minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,minY:Infinity,maxY:-Infinity};groups.set(key,b)}for(const j of ids){b.ids.push(j);b.minX=Math.min(b.minX,p.getX(j));b.maxX=Math.max(b.maxX,p.getX(j));b.minY=Math.min(b.minY,p.getY(j));b.maxY=Math.max(b.maxY,p.getY(j));b.minZ=Math.min(b.minZ,p.getZ(j));b.maxZ=Math.max(b.maxZ,p.getZ(j))}}
  const ArrayType=p.count>65535?Uint32Array:Uint16Array,buckets=[...groups.values()].map(b=>({...b,ids:new ArrayType(b.ids)}));g.setIndex(new THREE.BufferAttribute(new ArrayType(source.length),1).setUsage(THREE.DynamicDrawUsage));g.computeBoundingSphere();g.boundingSphere!.radius+=1.2;
  state=g.userData.detailSelection19={buckets,key:null,x:Infinity,y:Infinity,z:Infinity,range:-1,sourceTriangles:source.length/3,submittedTriangles:0,updates:0,maxCpuMs:0};
 }
 mesh.updateWorldMatrix(true,false);const local=mesh.worldToLocal(camera.position.clone());if(state.range===range&&Math.hypot(local.x-state.x,local.y-state.y,local.z-state.z)<2)return;
 const chosen=state.buckets.filter((b:any)=>Math.hypot(Math.max(0,b.minX-local.x,local.x-b.maxX),Math.max(0,b.minZ-local.z,local.z-b.maxZ),Math.max(0,b.minY-local.y,local.y-b.maxY))<range+8),key=chosen.map((b:any)=>b.key).join('|');
 if(key!==state.key){let n=0;for(const b of chosen){g.index!.array.set(b.ids,n);n+=b.ids.length}g.setDrawRange(0,n);g.index!.clearUpdateRanges();g.index!.addUpdateRange(0,n);g.index!.needsUpdate=true;state.submittedTriangles=n/3;state.updates++;state.key=key}
 state.x=local.x;state.y=local.y;state.z=local.z;state.range=range;state.maxCpuMs=Math.max(state.maxCpuMs,performance.now()-start);
}
