import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {lightingReceiver} from '../lighting/state.mjs';
import {createPlumes} from '../life/plume.mjs';
const V=p=>new THREE.Vector3(p.x,p.y,p.z);
function color(g,hex){const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)a.set([c.r,c.g,c.b],i);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
function pole(a,b,r=.012,hex=0xa7ada4){const d=b.clone().sub(a),g=new THREE.CylinderGeometry(r,r,d.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return color(g,hex);}
function panels(quads,hex){const p=[];for(const q of quads)for(const i of [0,1,2,0,2,3])p.push(...q[i].toArray());const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return color(g,hex);}
export function createCamp(scene,packGeometry){
 const root=new THREE.Group();root.name='player-camp';root.visible=false;scene.add(root);const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});lightingReceiver(material);
 const props=new THREE.Mesh(new THREE.BufferGeometry(),material);props.name='camp-tent-poles-hearth';root.add(props);
 const bagMaterial=new THREE.MeshLambertMaterial({vertexColors:true});lightingReceiver(bagMaterial);const bagGeo=packGeometry();bagGeo.translate(0,-.82,.32);const bag=new THREE.Mesh(bagGeo,bagMaterial);bag.name='traveler-pack-at-camp';root.add(bag);
 const fireGeometry=new THREE.BufferGeometry(),fp=[],uv=[];for(let k=0;k<2;k++){const angle=k*Math.PI*.5,c=Math.cos(angle),s=Math.sin(angle);for(const i of [0,1,2,0,2,3]){const [x,y]=[[-.27,0],[.27,0],[.27,.63],[-.27,.63]][i];fp.push(x*c,y,x*s);uv.push(...[[0,0],[1,0],[1,1],[0,1]][i]);}}fireGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fireGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const uniforms={time:{value:0},wind:{value:new THREE.Vector2()},day:{value:1}},fireMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms,vertexShader:'uniform float time;uniform vec2 wind;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.xz+=wind*p.y*p.y*.24;p.y*=.91+.09*sin(time*5.+position.x*8.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:`uniform float time;varying vec2 vUv;void main(){vec2 p=vUv;float width=(1.-p.y)*(.36+.06*sin(time*5.+p.y*16.));float tongue=abs(p.x-.5+.06*sin(time*4.-p.y*9.));float a=(1.-smoothstep(width*.55,width,tongue))*smoothstep(0.,.08,p.y)*(1.-smoothstep(.73,1.,p.y));if(a<.015)discard;vec3 c=mix(vec3(1.,.19,.018),vec3(1.,.83,.28),(1.-p.y)*.8);gl_FragColor=vec4(c,a*.92);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const fire=new THREE.Mesh(fireGeometry,fireMaterial);fire.name='camp-flame';root.add(fire);const smoke=createPlumes(1);smoke.mesh.name='camp-smoke';smoke.mesh.visible=false;root.add(smoke.mesh);const glow=new THREE.PointLight(0xffa24d,0,4,2);glow.name='camp-warm-light';glow.visible=false;scene.add(glow);let layout=null,disposed=false,smokeBudget=null,smokeRevision=-1,smokeOwned=false;
 const metrics={active:false,installations:0,removals:0,objects:0,lights:0,triangles:0,wind:{x:0,z:0},resources:8};
 return {root,metrics,
  install(site,query){if(disposed)return;layout=site;const parts=[],[a,b,c,d]=site.pegs.map(p=>V(p).add(new THREE.Vector3(0,.025,0))),front=a.clone().lerp(b,.5).add(new THREE.Vector3(0,1.16,0)),back=c.clone().lerp(d,.5).add(new THREE.Vector3(0,1.16,0));
   parts.push(panels([[a,front,back,c],[front,b,d,back]],0x9e895c));
   const left=a.clone().lerp(b,.34),right=a.clone().lerp(b,.66),doorTop=front.clone().add(new THREE.Vector3(0,-.18,0));parts.push(panels([[a,left,doorTop,front],[right,b,front,doorTop],[c,d,back,back]],0x7d7651));
   for(const [p,q]of [[a,front],[b,front],[c,back],[d,back],[front,back]])parts.push(pole(p,q));
   for(const p of [a,b,c,d])parts.push(pole(p.clone().add(new THREE.Vector3(0,-.1,0)),p.clone().add(new THREE.Vector3(0,.08,0)),.014,0x807e6f));
   const f=site.fire;for(let i=0;i<10;i++){const angle=i*Math.PI/5,x=f.x+Math.cos(angle)*.39,z=f.z+Math.sin(angle)*.39,s=query(x,z),g=new THREE.IcosahedronGeometry(.09,0);g.scale(1,.65,1);g.rotateY(i*1.7);g.translate(x,s.height+.052,z);parts.push(color(g,i%2?0x7e7a69:0x93907d));}
   for(let i=0;i<3;i++){const angle=i*Math.PI/3,p=new THREE.Vector3(f.x+Math.cos(angle)*.24,f.y+.10,f.z+Math.sin(angle)*.24),q=new THREE.Vector3(f.x-Math.cos(angle)*.24,f.y+.10,f.z-Math.sin(angle)*.24);parts.push(pole(p,q,.047,0x53412d));}
   const coal=new THREE.CircleGeometry(.32,12);coal.rotateX(-Math.PI/2);coal.translate(f.x,f.y+.012,f.z);parts.push(color(coal,0x47281b));
   const ready=parts.map(p=>{const g=p.index?p.toNonIndexed():p;g.deleteAttribute('uv');return g}),g=mergeGeometries(ready);new Set([...parts,...ready]).forEach(p=>p.dispose());props.geometry.dispose();props.geometry=g;fire.position.set(f.x,f.y+.12,f.z);bag.position.set(site.bag.x,site.bag.y,site.bag.z);bag.rotation.y=site.heading;glow.position.set(f.x,f.y+.45,f.z);root.visible=true;metrics.active=true;metrics.installations++;metrics.objects=3;metrics.triangles=g.attributes.position.count/3+fireGeometry.attributes.position.count/3+bagGeo.index.count/3;
  },
  clear(){if(!metrics.active)return;root.visible=false;glow.visible=false;glow.intensity=0;smokeBudget?.release('camp:smoke');smokeOwned=false;metrics.active=false;metrics.removals++;metrics.objects=metrics.lights=0;layout=null;},
  cameraClear(x,z){if(!layout)return true;const dx=x-layout.tent.x,dz=z-layout.tent.z,c=Math.cos(layout.heading),s=Math.sin(layout.heading),u=dx*c-dz*s,v=dx*s+dz*c;return Math.abs(u)>1.15||Math.abs(v)>1.35;},
  update(climate,profile){if(!metrics.active)return;const t=climate?.elapsedSeconds??0,w=climate?.wind??{x:0,z:0};uniforms.time.value=t;uniforms.wind.value.set(w.x,w.z);metrics.wind.x=w.x;metrics.wind.z=w.z;glow.visible=profile!=='eco';glow.intensity=profile==='eco'?0:2.5+Math.sin(t*7.)*.16;metrics.lights=Number(glow.intensity>0);
   const b=scene.userData.lifeBudget;if(b!==smokeBudget||b?.revision!==smokeRevision){smokeOwned=false;smokeBudget=b;smokeRevision=b?.revision;}if(!smokeOwned)smokeOwned=!!b?.claim('camp:smoke','particles');smoke.set(0,{x:layout.fire.x,y:layout.fire.y+.25,z:layout.fire.z},1.8,.8,.10,.31);smoke.update(smokeOwned?1:0,t,w,Math.max(.15,Math.sin(climate?.solar?.altitude??1)));
  },
  dispose(){if(disposed)return;disposed=true;smokeBudget?.release('camp:smoke');scene.remove(root,glow);props.geometry.dispose();material.dispose();bagGeo.dispose();bagMaterial.dispose();fireGeometry.dispose();fireMaterial.dispose();smoke.geometry.dispose();smoke.material.dispose();}
 };
}
