import * as THREE from 'three';
// One bounded line draw in every profile; Eco still displays real rain.
export function createPrecipitation(scene:THREE.Scene){
 const geometry=new THREE.BufferGeometry(),points=new Float32Array(900*6),seeds=new Float32Array(900*2);
 for(let i=0;i<900;i++){for(let j=0;j<2;j++){const n=i*6+j*3;points[n]=(Math.sin(i*127.1)*43758.5453%1+.5)*32;points[n+1]=(i*.61803398875%1)*30;points[n+2]=(Math.sin(i*311.7)*17371.1%1+.5)*32;seeds[i*2+j]=j;}}
 geometry.setAttribute('position',new THREE.BufferAttribute(points,3));geometry.setAttribute('tip',new THREE.BufferAttribute(seeds,1));
 let previousTime:number|null=null;
 const uniforms={drift:{value:new THREE.Vector3()},rain:{value:0},wind:{value:new THREE.Vector2()},day:{value:1},floorY:{value:0}};
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`attribute float tip;uniform float rain,floorY;uniform vec2 wind;uniform vec3 drift;varying float fade;void main(){vec3 p=position;p.xz=mod(p.xz+drift.xz+16.,32.)-16.;p.y=mod(p.y+drift.y,30.)-9.;p.y-=tip*(.45+rain*.5);p.xz-=wind*tip*.18;vec4 w=modelMatrix*vec4(p,1.);fade=smoothstep(floorY-1.,floorY+1.,w.y)*(1.-smoothstep(10.,22.,length(p.xz)));gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`uniform float rain,day;varying float fade;void main(){gl_FragColor=vec4(mix(vec3(.24,.31,.40),vec3(.68,.76,.79),day),fade*rain*.52);\n#include <colorspace_fragment>\n}`});
 const mesh=new THREE.LineSegments(geometry,material);mesh.name='weather-rain';mesh.frustumCulled=false;mesh.renderOrder=4;scene.add(mesh);
 return {update(camera:THREE.Vector3,ground:number,t:number,rain:number,wind:THREE.Vector2,day:number,profile:string){mesh.position.copy(camera);mesh.visible=rain>.005;geometry.setDrawRange(0,(profile==='eco'?260:profile==='quality'?900:520)*2);const dt=previousTime===null?0:Math.max(0,t-previousTime);if(previousTime!==null&&t<previousTime)uniforms.drift.value.set(0,0,0);previousTime=t;uniforms.drift.value.x=(uniforms.drift.value.x+wind.x*3*dt)%32;uniforms.drift.value.z=(uniforms.drift.value.z+wind.y*3*dt)%32;uniforms.drift.value.y=(uniforms.drift.value.y-(17+rain*8)*dt)%30;uniforms.rain.value=rain;uniforms.wind.value.copy(wind);uniforms.day.value=day;uniforms.floorY.value=ground;},dispose(){scene.remove(mesh);geometry.dispose();material.dispose()}};
}
