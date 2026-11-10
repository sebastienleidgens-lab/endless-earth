import * as THREE from 'three';
// @ts-ignore One advected macro field also feeds the existing terrain shadows.
import {lifeUniforms,lifePrelude} from './state.mjs';

/** Two altitude layers projected onto a curved sky, with lit edges and darker
 * bases. World coordinates prevent a camera-following ceiling or tile seams. */
export function createCloudLayer(scene:THREE.Scene){
 const geometry=new THREE.SphereGeometry(1380,24,12);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,uniforms:{...lifeUniforms,lifeCloudEnabled:{value:1},cloudBase:{value:new THREE.Vector3(.48,.53,.57)},cloudLit:{value:new THREE.Vector3(.94,.94,.91)},cloudShape:{value:new THREE.Vector3(.6592,0,.21)},cloudEco:{value:0},cloudOrigin:{value:new THREE.Vector3()}},vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',fragmentShader:lifePrelude+`
 uniform float lifeCloudEnabled,cloudEco;uniform vec3 cloudOrigin,cloudBase,cloudLit,cloudShape;varying vec3 ray;
 // Arithmetic lattice hash avoids dozens of sine evaluations per sky pixel.
 float hash(vec2 p){p=fract(p*vec2(.1031,.0973));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x*p.y);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float detail(vec2 p){float n=noise(p)*.6+noise(p*2.07+17.3)*.28;return n+(cloudEco<.5?noise(p*4.13-11.4)*.12:.06);}
 void main(){
  vec3 d=normalize(ray);if(d.y<.015)discard;
  float h=max(65.,280.-cloudOrigin.y);vec2 p=cloudOrigin.xz+d.xz*h/sqrt(d.y*d.y+.014);
  vec2 flow=lifeCloudDrift;
  float macro=lifeCloudField(p,lifeTime);
  vec2 uv=(p-flow)*.007;
  uv+=vec2(noise(uv*.7+4.),noise(uv*.7-7.))*1.8;
  float n=detail(uv);
  float field=macro*.35+n*.65;
  float edge=cloudShape.x;
  float density=smoothstep(edge-.015,edge+.085,field);
  float upper=0.;if(cloudEco<.5){vec2 p2=cloudOrigin.xz+d.xz*max(140.,540.-cloudOrigin.y)/sqrt(d.y*d.y+.018);upper=smoothstep(.72-lifeCloudCover*.3,.94-lifeCloudCover*.3,detail((p2-flow*.65)*.0043));}
  float alpha=max(density+upper*.35*(1.-density),cloudShape.y)*smoothstep(.015,.12,d.y)*lifeCloudEnabled;
  float rim=pow(max(0.,dot(d,lifeSun)),12.)*cloudShape.z;
  float thickness=smoothstep(edge,edge+.27,field);
  float shading=thickness*.7;if(cloudEco<.5)shading=clamp(shading+(n-detail(uv+lifeSun.xz*.7))*.9,0.,1.);
  vec3 color=mix(cloudLit,cloudBase,shading)+rim;
  gl_FragColor=vec4(color,alpha*.96);
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='earthlife-cloud-layer';mesh.frustumCulled=false;mesh.renderOrder=-10;scene.add(mesh);
 const warmTint=new THREE.Vector3(.84,.68,.53);
 return {update(p:THREE.Vector3,day:number,enabled:number,eco=false,warm=0,rain=0){
  mesh.visible=enabled>.001;mesh.position.copy(p);const u=material.uniforms,attenuation=1-rain*.38,cover=lifeUniforms.lifeCloudCover.value;
  u.cloudOrigin.value.copy(p);u.lifeCloudEnabled.value=Math.min(1,enabled/.7);u.cloudEco.value=Number(eco);
  // Uniform-only color/coverage work once per frame; all noise, layers,
  // lighting detail and opacity remain at the original full resolution.
  u.cloudBase.value.set(.025+day*.455,.035+day*.495,.055+day*.515).multiplyScalar(attenuation);
  u.cloudLit.value.set(.05+day*.89,.065+day*.875,.095+day*.815).lerp(warmTint,warm*.45*day).multiplyScalar(attenuation);
  u.cloudShape.value.set(.72-cover*.38,THREE.MathUtils.smoothstep(cover,.78,1)*.8,(1-cover)*.25*day*attenuation);
 },dispose(){scene.remove(mesh);geometry.dispose();material.dispose()}};
}
