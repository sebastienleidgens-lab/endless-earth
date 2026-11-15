import * as THREE from 'three';
/** Bounded surface rings on the provider's water level, synchronized to planted
 * wading feet or a swimming stroke. Pure visual marks, no fluid simulation. */
export function createWaterMarks(scene){
 const geometry=new THREE.InstancedBufferGeometry(),plane=new THREE.PlaneGeometry(1,1);geometry.setAttribute('position',plane.attributes.position);geometry.setAttribute('uv',plane.attributes.uv);geometry.setIndex(plane.index);
 const origins=new Float32Array(16*3),births=new Float32Array(16).fill(-100);geometry.setAttribute('origin',new THREE.InstancedBufferAttribute(origins,3));geometry.setAttribute('birth',new THREE.InstancedBufferAttribute(births,1));geometry.instanceCount=0;
 const uniforms={time:{value:0},light:{value:1}},material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`attribute vec3 origin;attribute float birth;uniform float time;varying vec2 q;varying float age;void main(){age=time-birth;q=uv-.5;float radius=.15+age*.6;vec3 p=origin+vec3(position.x*radius,0.,position.y*radius);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 q;varying float age;uniform float light;void main(){float ring=(1.-smoothstep(.012,.035,abs(length(q)-.38)))*max(0.,1.-age/1.7)*step(0.,age);gl_FragColor=vec4(vec3(.65,.79,.78)*light,ring*.27);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='player-water-rings';mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);let cursor=0,lastStroke=-1;const metrics={capacity:16,emitted:0,drawCalls:0};
 function emit(p,t,profile){const cap=profile==='eco'?4:16,i=cursor++%cap;origins.set([p.x,p.y+.008,p.z],i*3);births[i]=t;geometry.attributes.origin.needsUpdate=geometry.attributes.birth.needsUpdate=true;geometry.instanceCount=cap;metrics.emitted++;}
 return {metrics,emit,update(climate,player,motion,aquatic,profile){const t=climate?.elapsedSeconds??0;uniforms.time.value=t;uniforms.light.value=Math.max(.2,Math.sin(climate?.solar?.altitude??1));const stroke=Math.floor((motion.time??0)*2.5/(Math.PI*2)),contacts=motion.footContacts??[];
  // Emission belongs to WaterContacts: the same verified event drives sound.
  mesh.visible=births.some(b=>t-b>=0&&t-b<1.7);metrics.drawCalls=Number(mesh.visible);
 },dispose(){scene.remove(mesh);geometry.dispose();material.dispose();}};
}
