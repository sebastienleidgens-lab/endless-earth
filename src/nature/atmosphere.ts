import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';

/** Three.js' MIT-licensed Preetham sky, with an explicit night and diffuse
 * weather layer. No external textures, ray marching or postprocessing pass. */
export function createAtmosphere(scene:THREE.Scene){
 const sky=new Sky();sky.name='atmosphere-preetham';sky.scale.setScalar(1400);sky.frustumCulled=false;sky.renderOrder=10;
 // Opaque terrain writes depth first: scattering only shades exposed sky.
 const u=sky.material.uniforms;
 Object.assign(u,{starVisibility:{value:0},daylight:{value:1},cover:{value:0},horizonTint:{value:new THREE.Color()},zenithTint:{value:new THREE.Color()},moonDirection:{value:new THREE.Vector3(0,-1,0)},moonSun:{value:new THREE.Vector3(0,1,0)},moonRadius:{value:.0045},moonCosRadius:{value:Math.cos(.0045*1.06)},moonVisibility:{value:0}});
 sky.material.fragmentShader='uniform float daylight,cover,starVisibility,moonRadius,moonCosRadius,moonVisibility;uniform vec3 horizonTint,zenithTint,moonDirection,moonSun;\n'+sky.material.fragmentShader;
 // Night contributes no analytic daylight. Keep the identical daytime model,
 // but avoid its transcendental work when its final multiplier is zero.
 sky.material.fragmentShader=sky.material.fragmentShader
 .replace('float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );','float cosZenith = max(0.0, dot(up, direction)); float zenithAngle = acos(cosZenith);')
 .replace('cos( zenithAngle )','cosZenith')
 .replace('// optical length\n','vec3 atmosphere=vec3(0.); if(daylight>0.) {\n// optical length\n')
 .replace('gl_FragColor = vec4( retColor, 1.0 );',`
  // Compress the analytic sky's HDR range without a scene-wide tone mapper.
  atmosphere=vec3(1.)-exp(-retColor*.72);
  }
  vec3 night=mix(horizonTint,zenithTint,smoothstep(-.03,.65,direction.y));
  if(starVisibility>0.){
  vec2 cell=vec2(atan(direction.z,direction.x)*420.,asin(direction.y)*420.);
  vec2 id=floor(cell);vec2 q=fract(cell)-.5;
  float hash=fract(sin(dot(id,vec2(127.1,311.7)))*43758.5453);
  float star=step(.996,hash)*(1.-smoothstep(.015,.095,length(q)));
  night+=vec3(.55,.62,.72)*star*starVisibility*smoothstep(0.,.2,direction.y);
  }
  vec3 cloudy=mix(horizonTint,zenithTint,smoothstep(0.,.8,direction.y));
  vec3 color=mix(night,atmosphere,daylight);
  color=mix(color,cloudy,smoothstep(.48,1.,cover)*.88);
  // Match the distance fog at the skyline; avoid a pale artificial seam.
  color=mix(horizonTint,color,smoothstep(-.04,.20,direction.y));
  if(moonVisibility>.001){
   vec3 ray=direction;float alignment=dot(ray,moonDirection);
   if(alignment>moonCosRadius){
    vec3 tangent=(ray-moonDirection*alignment)/sin(moonRadius);
    float rr=dot(tangent,tangent),edge=1.-smoothstep(.92,1.04,sqrt(rr));
    vec3 normal=tangent-moonDirection*sqrt(max(0.,1.-rr));
    float lit=smoothstep(-.035,.06,dot(normal,moonSun));
    // Low contrast original albedo, no glow sprite or extra sky pass.
    float maria=.88+.065*sin(normal.x*17.+normal.y*13.)*sin(normal.z*23.-normal.y*8.);
    color=mix(color,vec3(.82,.83,.80)*maria,edge*lit*moonVisibility);
   }
  }
  gl_FragColor=vec4(color,1.);
 `);
 scene.add(sky);
 return {get starVisibility(){return u.starVisibility.value},moon(state:any,visibility:number,sun:THREE.Vector3){u.moonDirection.value.fromArray(state.direction);u.moonRadius.value=state.angularRadius;u.moonCosRadius.value=Math.cos(state.angularRadius*1.06);u.moonVisibility.value=visibility;u.moonSun.value.copy(sun)},update(p:THREE.Vector3,sun:THREE.Vector3,day:number,cloud:number,mist:number,horizon:THREE.Color,zenith:THREE.Color){
  sky.position.copy(p);u.sunPosition.value.copy(sun).multiplyScalar(450000);u.turbidity.value=2.2+cloud*3+mist*2;u.rayleigh.value=1.8;u.mieCoefficient.value=.004+mist*.008;
  u.starVisibility.value=(1-day)*(1-THREE.MathUtils.smoothstep(cloud,.35,.8));u.daylight.value=day;u.cover.value=cloud;u.horizonTint.value.copy(horizon);u.zenithTint.value.copy(zenith);
 },dispose(){scene.remove(sky);sky.geometry.dispose();sky.material.dispose()}};
}
