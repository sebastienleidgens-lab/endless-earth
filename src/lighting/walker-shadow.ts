import * as THREE from 'three';
// @ts-ignore Same receiving shader and solar direction as landscape shadows.
import {lightingUniforms as u} from './state.mjs';
const bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
/** One small depth map of the actual rig; no duplicated geometry or skeleton.
 * Its cadence never forces the expensive static/forest pass to render again. */
export function createWalkerShadow(renderer:THREE.WebGLRenderer,playerProvider:()=>THREE.Object3D){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,40),material=new THREE.MeshDepthMaterial({side:THREE.DoubleSide});
 const metrics={updates:0,size:0,bytes:0,proxies:0,extraPasses:0,poseAgeMs:0,lastCpuMs:0,maxCpuMs:0,receiver:'landscape only; actor receives landscape map'};
 let target:THREE.WebGLRenderTarget|null=null,source:THREE.Object3D|null=null,lastTime=-Infinity;
 const proxies:{from:THREE.SkinnedMesh;mesh:THREE.SkinnedMesh}[]=[],lastSun=new THREE.Vector3(),lastPosition=new THREE.Vector3(Infinity,0,0),lastPose:number[]=[];const lastRotation=new THREE.Quaternion();
 return {metrics,update(enabled:boolean,profile:string,sun:THREE.Vector3,fade:number){
  metrics.extraPasses=0;
  if(!enabled){u.m18WalkerActive.value=0;if(profile==='eco'&&target){target.dispose();target=null;metrics.size=metrics.bytes=0}return}
  const player=playerProvider();player.updateWorldMatrix(true,true);
  if(source!==player){for(const p of proxies)scene.remove(p.mesh);proxies.length=0;player.traverse(o=>{if(!(o instanceof THREE.SkinnedMesh))return;const mesh=o.clone(false);mesh.material=material;mesh.skeleton=o.skeleton;mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;scene.add(mesh);proxies.push({from:o,mesh})});source=player;metrics.proxies=proxies.length;lastPosition.set(Infinity,0,0)}
  if(!proxies.length){u.m18WalkerActive.value=0;return}
  const now=performance.now(),size=profile==='quality'?256:128,pose=proxies.flatMap(p=>p.from.skeleton.bones.flatMap(b=>[b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w,b.position.x,b.position.y,b.position.z,b.scale.x,b.scale.y,b.scale.z]));
  const moved=lastPosition.distanceToSquared(player.position)>1e-10,angle=lastSun.dot(sun)<.99999999,changed=pose.some((v,i)=>Math.abs(v-(lastPose[i]??Infinity))>1e-6)||1-Math.abs(lastRotation.dot(player.quaternion))>1e-10;
  if(!target||target.width!==size||moved||angle||changed){
   if(!target||target.width!==size){target?.dispose();target=new THREE.WebGLRenderTarget(size,size,{format:THREE.RedFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});target.depthTexture=new THREE.DepthTexture(size,size,THREE.UnsignedIntType);target.depthTexture.minFilter=target.depthTexture.magFilter=THREE.NearestFilter;u.m18WalkerShadow.value=target.depthTexture;u.m18WalkerSize.value.set(1/size,1/size);metrics.size=size;metrics.bytes=size*size*5}
   camera.position.copy(player.position).addScaledVector(sun,18);camera.lookAt(player.position);camera.updateMatrixWorld();camera.updateProjectionMatrix();
   const plane=player.position.clone().applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(camera.quaternion).invert()),texel=8/size;
   camera.projectionMatrix.elements[12]-=(Math.round(plane.x/texel)*texel-plane.x)/4;camera.projectionMatrix.elements[13]-=(Math.round(plane.y/texel)*texel-plane.y)/4;
   u.m18WalkerMatrix.value.copy(bias).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
   for(const p of proxies){p.mesh.matrix.copy(p.from.matrixWorld);p.mesh.bindMatrix.copy(p.from.bindMatrix);p.mesh.bindMatrixInverse.copy(p.from.bindMatrixInverse)}
   const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),auto=renderer.autoClear;
   try{renderer.setRenderTarget(target);renderer.setClearColor(0xffffff,1);renderer.autoClear=true;renderer.render(scene,camera)}finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);renderer.autoClear=auto}
   lastPosition.copy(player.position);lastRotation.copy(player.quaternion);lastSun.copy(sun);lastPose.splice(0,lastPose.length,...pose);lastTime=now;metrics.updates++;metrics.extraPasses=1;metrics.lastCpuMs=performance.now()-now;metrics.maxCpuMs=Math.max(metrics.maxCpuMs,metrics.lastCpuMs);
  }
  metrics.poseAgeMs=(moved||changed)?performance.now()-lastTime:0;
  u.m18WalkerActive.value=fade*THREE.MathUtils.smoothstep(sun.y,.10,.25);
 },dispose(){target?.dispose();material.dispose();scene.clear();proxies.length=0;u.m18WalkerActive.value=0;metrics.size=metrics.bytes=metrics.proxies=0}};
}
