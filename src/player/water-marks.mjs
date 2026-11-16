import * as THREE from 'three';
/** One pooled draw for local paddle ripples/spray and two restrained hull
 * wakes. Events are the same observed contacts consumed by spatial audio. */
export function createWaterMarks(scene){
 const capacity=48,geometry=new THREE.InstancedBufferGeometry(),plane=new THREE.PlaneGeometry(1,1);
 geometry.setAttribute('position',plane.attributes.position);geometry.setAttribute('uv',plane.attributes.uv);geometry.setIndex(plane.index);
 const origins=new Float32Array(capacity*3),births=new Float32Array(capacity).fill(-100),styles=new Float32Array(capacity*4);
 geometry.setAttribute('origin',new THREE.InstancedBufferAttribute(origins,3));geometry.setAttribute('birth',new THREE.InstancedBufferAttribute(births,1));geometry.setAttribute('style',new THREE.InstancedBufferAttribute(styles,4));geometry.instanceCount=0;
 const uniforms={time:{value:0},light:{value:1}},material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,
  vertexShader:`attribute vec3 origin;attribute float birth;attribute vec4 style;uniform float time;varying vec2 q;varying float age,kind,strength;
   void main(){age=time-birth;q=uv-.5;kind=style.x;strength=style.w;float wake=step(.5,kind)*step(kind,1.5),spray=step(1.5,kind);float radius=mix(.20+age*.66,.32+age*.18,wake);
   vec2 local=vec2(position.x*radius,position.y*radius*mix(1.,2.4,wake));float c=cos(style.y),s=sin(style.y);vec2 offset=vec2(c*local.x+s*local.y,-s*local.x+c*local.y);
   float deformation=(1.-spray)*(1.-wake)*sin(length(q)*22.-age*14.)*.007*max(0.,1.-age/.7);
   vec3 p=origin+vec3(offset.x,deformation+spray*(.03+max(0.,age)*.38-.8*age*age),offset.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying vec2 q;varying float age,kind,strength;uniform float light;
   void main(){float wake=step(.5,kind)*step(kind,1.5),spray=step(1.5,kind);float ring=1.-smoothstep(.012,.04,abs(length(q)-.35));
   float line=exp(-pow((q.x-.10*sin(q.y*8.))*18.,2.))*(1.-smoothstep(.2,.5,abs(q.y)));
   float drops=pow(max(0.,sin(q.x*66.+q.y*47.)),16.)*(1.-smoothstep(.1,.45,length(q)));
   float shape=mix(mix(ring,line,wake),drops,spray),life=mix(1.7,.5,spray);
   float alpha=shape*max(0.,1.-age/life)*step(0.,age)*strength*.24;
   gl_FragColor=vec4(vec3(.65,.79,.78)*light,alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }
  `});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='player-water-rings';mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);let cursor=0;const metrics={capacity,emitted:0,paddleContacts:0,wakePairs:0,drawCalls:0};
 function put(p,t,profile,kind,heading=0,strength=1){const cap=profile==='eco'?12:profile==='quality'?48:32,i=cursor++%cap;origins.set([p.x,p.y+.009,p.z],i*3);births[i]=t;styles.set([kind,heading,0,strength],i*4);geometry.attributes.origin.needsUpdate=geometry.attributes.birth.needsUpdate=geometry.attributes.style.needsUpdate=true;geometry.instanceCount=cap;metrics.emitted++;}
 function emit(p,t,profile,event={}){if(event.kind==='breath')return;if(event.kind==='wake'){put(p,t,profile,1,event.heading??0,Math.min(1,event.speed??.8));if(event.side===1)metrics.wakePairs++;return;}put(p,t,profile,0);if(event.kind==='paddle'){metrics.paddleContacts++;put(p,t,profile,2,0,.6);}}
 return {metrics,emit,update(climate,_player,_motion,_aquatic,profile){const t=climate?.elapsedSeconds??0;uniforms.time.value=t;uniforms.light.value=Math.max(.2,Math.sin(climate?.solar?.altitude??1));const cap=profile==='eco'?12:profile==='quality'?48:32;geometry.instanceCount=Math.min(geometry.instanceCount,cap);mesh.visible=births.subarray(0,cap).some(b=>t-b>=0&&t-b<1.7);metrics.drawCalls=Number(mesh.visible);},dispose(){scene.remove(mesh);geometry.dispose();plane.dispose();material.dispose();}};
}
