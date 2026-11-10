import * as THREE from 'three';
// @ts-ignore Shared shader module.
import {lifeUniforms,lifePrelude} from './state.mjs';
export function createCloudLayer(scene:THREE.Scene){
 const geometry=new THREE.PlaneGeometry(2600,2600);geometry.rotateX(-Math.PI/2);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{...lifeUniforms,lifeCloudEnabled:{value:1},lifeDay:{value:1}},vertexShader:'varying vec3 cloudWorld;void main(){cloudWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(cloudWorld,1.);}',fragmentShader:lifePrelude+`uniform float lifeCloudEnabled,lifeDay;varying vec3 cloudWorld;
 void main(){float density=lifeCloud(cloudWorld.xz,lifeTime,lifeCloudCover);
 float distanceFade=1.-smoothstep(650.,1250.,distance(cameraPosition.xz,cloudWorld.xz));
 vec3 color=mix(vec3(.11,.14,.20),vec3(.86,.88,.85),lifeDay)*(1.-density*.075);
 gl_FragColor=vec4(color,density*distanceFade*lifeCloudEnabled*.89);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='earthlife-cloud-layer';mesh.position.y=230;mesh.frustumCulled=false;scene.add(mesh);
 return {update(p:THREE.Vector3,day:number,enabled:number){mesh.position.x=p.x;mesh.position.z=p.z;material.uniforms.lifeDay.value=day;material.uniforms.lifeCloudEnabled.value=enabled},dispose(){scene.remove(mesh);geometry.dispose();material.dispose()}};
}
