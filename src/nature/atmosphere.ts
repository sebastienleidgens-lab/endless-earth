import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';

/** Three.js' MIT-licensed Preetham sky, with an explicit night and diffuse
 * weather layer. No external textures, ray marching or postprocessing pass. */
export function createAtmosphere(scene:THREE.Scene){
 const sky=new Sky();sky.name='atmosphere-preetham';sky.scale.setScalar(1400);sky.frustumCulled=false;sky.renderOrder=10;
 // Opaque terrain writes depth first: scattering only shades exposed sky.
 const u=sky.material.uniforms;
 Object.assign(u,{daylight:{value:1},cover:{value:0},horizonTint:{value:new THREE.Color()},zenithTint:{value:new THREE.Color()}});
 sky.material.fragmentShader='uniform float daylight,cover;uniform vec3 horizonTint,zenithTint;\n'+sky.material.fragmentShader;
 sky.material.fragmentShader=sky.material.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );',`
  // Compress the analytic sky's HDR range without a scene-wide tone mapper.
  vec3 atmosphere=vec3(1.)-exp(-retColor*.72);
  vec3 night=mix(horizonTint,zenithTint,smoothstep(-.03,.65,direction.y));
  vec2 cell=vec2(atan(direction.z,direction.x)*420.,asin(direction.y)*420.);
  vec2 id=floor(cell);vec2 q=fract(cell)-.5;
  float hash=fract(sin(dot(id,vec2(127.1,311.7)))*43758.5453);
  float star=step(.996,hash)*(1.-smoothstep(.015,.095,length(q)));
  night+=vec3(.55,.62,.72)*star*(1.-daylight)*(1.-smoothstep(.35,.8,cover))*smoothstep(0.,.2,direction.y);
  vec3 cloudy=mix(horizonTint,zenithTint,smoothstep(0.,.8,direction.y));
  vec3 color=mix(night,atmosphere,daylight);
  color=mix(color,cloudy,smoothstep(.48,1.,cover)*.88);
  // Match the distance fog at the skyline; avoid a pale artificial seam.
  color=mix(horizonTint,color,smoothstep(-.04,.20,direction.y));
  gl_FragColor=vec4(color,1.);
 `);
 scene.add(sky);
 return {update(p:THREE.Vector3,sun:THREE.Vector3,day:number,cloud:number,mist:number,horizon:THREE.Color,zenith:THREE.Color){
  sky.position.copy(p);u.sunPosition.value.copy(sun).multiplyScalar(450000);u.turbidity.value=2.2+cloud*3+mist*2;u.rayleigh.value=1.8;u.mieCoefficient.value=.004+mist*.008;
  u.daylight.value=day;u.cover.value=cloud;u.horizonTint.value.copy(horizon);u.zenithTint.value.copy(zenith);
 },dispose(){scene.remove(sky);sky.geometry.dispose();sky.material.dispose()}};
}
