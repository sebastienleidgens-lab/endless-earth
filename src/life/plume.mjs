import * as THREE from 'three';
/** Shared instanced light smoke: one continuous soft plume per budgeted slot. */
export function createPlumes(capacity=16){
 const base=new THREE.PlaneGeometry(1,1),geometry=new THREE.InstancedBufferGeometry();geometry.index=base.index;geometry.attributes.position=base.attributes.position;geometry.attributes.uv=base.attributes.uv;
 const origins=new Float32Array(capacity*3),data=new Float32Array(capacity*4);geometry.setAttribute('plumeOrigin',new THREE.InstancedBufferAttribute(origins,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('plumeData',new THREE.InstancedBufferAttribute(data,4).setUsage(THREE.DynamicDrawUsage));geometry.instanceCount=0;
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},wind:{value:new THREE.Vector2()},day:{value:1}},vertexShader:`attribute vec3 plumeOrigin;attribute vec4 plumeData;uniform float time;uniform vec2 wind;varying vec2 vUv;varying vec2 vPlume;
 void main(){vUv=uv;vPlume=plumeData.zw;float h=uv.y,phase=time*.38+plumeData.w*37.;vec3 p=plumeOrigin;p.y+=h*plumeData.x;p.xz+=wind*h*h*plumeData.x*1.15;vec4 view=modelViewMatrix*vec4(p,1.);view.x+=(position.x*plumeData.y*(.30+h)+sin(phase+h*5.)*h*.10);gl_Position=projectionMatrix*view;}`,fragmentShader:`uniform float time,day;varying vec2 vUv;varying vec2 vPlume;
 void main(){float h=vUv.y,x=(vUv.x-.5)*2.;float turbulence=.82+.18*sin(x*9.+h*18.-time*.65+vPlume.y*49.)*sin(x*17.-h*9.+time*.36);float edge=1.-smoothstep(.25,.95,abs(x));float fade=smoothstep(0.,.08,h)*(1.-smoothstep(.35,1.,h));float a=edge*fade*turbulence*vPlume.x;if(a<.002)discard;gl_FragColor=vec4(mix(vec3(.30,.33,.35),vec3(.88,.89,.90),day),a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
 return {mesh,geometry,material,origins,data,set(i,p,height,width,opacity,seed){origins.set([p.x,p.y,p.z],i*3);data.set([height,width,opacity,seed],i*4)},update(count,time,wind,day){geometry.instanceCount=count;geometry.attributes.plumeOrigin.needsUpdate=true;geometry.attributes.plumeData.needsUpdate=true;material.uniforms.time.value=time;material.uniforms.wind.value.set(wind.x,wind.z);material.uniforms.day.value=day;mesh.visible=count>0;}};
}
