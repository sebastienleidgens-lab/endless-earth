import * as THREE from 'three';
// @ts-ignore Shared exposure shader and bounded particle policies.
import {snowUniforms,snowExposureGLSL} from './snow-state.mjs';
// @ts-ignore Original deterministic snow simulation policy.
import {SNOW_PROFILES} from './snow-model.mjs';
export function createSnowfall(scene:THREE.Scene){
 const positions=new Float32Array(1100*3),seeds=new Float32Array(1100*3);
 const random=(n:number)=>{const v=Math.sin(n*127.1+13.4)*43758.5453;return v-Math.floor(v)};
 for(let i=0;i<1100;i++)for(let j=0;j<3;j++){positions[i*3+j]=random(i*7+j);seeds[i*3+j]=random(i*11+j+9)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('snowSeed',new THREE.BufferAttribute(seeds,3));
 const uniforms={...snowUniforms,snowCamera:{value:new THREE.Vector3()},snowPlayer:{value:new THREE.Vector3()},snowDrift:{value:new THREE.Vector3()},snowTime:{value:0},snowDay:{value:1},snowAmount:{value:0},snowRange:{value:30},snowViewport:{value:600}};
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`attribute vec3 snowSeed;uniform vec3 snowCamera,snowPlayer,snowDrift;uniform float snowTime,snowAmount,snowRange,snowViewport;varying float snowFade;${snowExposureGLSL}
 void main(){
  vec3 p;vec2 flutter=vec2(sin(snowTime*(.37+snowSeed.x*.2)+snowSeed.y*31.),cos(snowTime*.43+snowSeed.z*21.))*.38;
  p.xz=snowCamera.xz+mod(position.xz*snowRange+snowDrift.xz+flutter-snowCamera.xz+snowRange*.5,snowRange)-snowRange*.5;
  p.y=snowCamera.y+mod(position.y*28.+snowDrift.y*(.55+snowSeed.y*.85)-snowCamera.y+14.,28.)-14.;
  float top=snowTopAt(p.xz),land=top < -9999.?1.:smoothstep(top+.03,top+.35,p.y);
  float body=1.-(1.-smoothstep(.38,.65,length(p.xz-snowPlayer.xz)))*(1.-smoothstep(1.7,2.05,p.y-snowPlayer.y))*step(snowPlayer.y-.1,p.y);
  snowFade=land*body*smoothstep(.75,1.5,distance(p,snowCamera))*(1.-smoothstep(snowRange*.32,snowRange*.5,distance(p.xz,snowCamera.xz)));
  snowFade*=.55+.45*sin(p.x*.13+p.z*.09+snowSeed.x*4.5)*sin(p.z*.11-p.x*.07);
  vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;
  gl_PointSize=clamp((.025+snowSeed.z*.05)*projectionMatrix[1][1]*snowViewport/max(1.,-view.z)*.5,.8,10.);
 }`,fragmentShader:`uniform float snowDay,snowAmount;varying float snowFade;void main(){
 vec2 p=gl_PointCoord-.5;float r=length(p),crossShape=1.-smoothstep(.035,.11,min(abs(p.x),abs(p.y)));
 float flake=max(exp(-r*r*15.)*.6,crossShape*.7)*(1.-smoothstep(.32,.5,r));
 float alpha=flake*snowFade*min(1.,snowAmount*3.);if(alpha<.012)discard;
 gl_FragColor=vec4(mix(vec3(.16,.21,.28),vec3(.88,.93,.97),snowDay),alpha);
 #include <colorspace_fragment>
 }`});
 const points=new THREE.Points(geometry,material);points.name='weather-snow';points.frustumCulled=false;points.renderOrder=5;points.visible=false;scene.add(points);
 return {update(camera:THREE.Vector3,player:THREE.Vector3,dt:number,time:number,amount:number,wind:THREE.Vector2,day:number,profile:string,ready:boolean){
  const policy=SNOW_PROFILES[profile]??SNOW_PROFILES.balanced;points.visible=ready&&amount>.005;geometry.setDrawRange(0,Math.ceil(policy.flakes*Math.sqrt(Math.max(0,amount))));uniforms.snowRange.value=policy.range;uniforms.snowCamera.value.copy(camera);uniforms.snowPlayer.value.copy(player);uniforms.snowTime.value=time;uniforms.snowAmount.value=amount;uniforms.snowDay.value=day;uniforms.snowViewport.value=innerHeight*Math.min(devicePixelRatio,profile==='eco'?1:1.6);
  uniforms.snowDrift.value.x+=wind.x*dt*1.8;uniforms.snowDrift.value.z+=wind.y*dt*1.8;uniforms.snowDrift.value.y-=dt;
 },get count(){return points.visible?geometry.drawRange.count:0},dispose(){scene.remove(points);geometry.dispose();material.dispose()}};
}
