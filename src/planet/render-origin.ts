import * as THREE from 'three';
// @ts-ignore Shared presentation origin; all physical coordinates remain Float64 canonical.
import {presentationOrigin,onOriginChange,setPresentationOrigin} from './origin-state.mjs';
/** Reconstruct canonical coordinates only for explicit owner shader code.
 * Three's native #include shadow/view code stays in the local render frame. */
export function canonicalShader(source:string,fragment=false){
 let prelude='uniform vec3 eeRenderOrigin;\n';
 const model=/\bmodelMatrix\b/.test(source),view=/\bviewMatrix\b/.test(source),camera=/\bcameraPosition\b/.test(source);
 source=source.replace(/\bmodelMatrix\b/g,'eeCanonicalModel()').replace(/\bviewMatrix\b/g,'eeCanonicalView()').replace(/\bcameraPosition\b/g,'eeCanonicalCamera()');
 if(model)prelude+=(fragment?'uniform mat4 modelMatrix;\n':'')+'mat4 eeCanonicalModel(){mat4 m=modelMatrix;m[3].xyz+=eeRenderOrigin;return m;}\n';
 if(view)prelude+='mat4 eeCanonicalView(){mat4 m=viewMatrix;m[3]-=m*vec4(eeRenderOrigin,0.);return m;}\n';
 if(camera)prelude+='vec3 eeCanonicalCamera(){return cameraPosition+eeRenderOrigin;}\n';
 return prelude+source;
}
export function floatingRenderOrigin(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera,position:()=>THREE.Vector3){
 const uniform={value:new THREE.Vector3()},materials=new WeakSet<THREE.Material>(),observed=new WeakSet<THREE.Object3D>(),skeletons=new Set<THREE.Skeleton>(),hemispheres=new Map<THREE.HemisphereLight,THREE.Vector3>(),stop=onOriginChange((p:any)=>uniform.value.set(p.x,p.y,p.z));
 let automatic=true,drawing=false;const original=renderer.render.bind(renderer),savedScene=new THREE.Vector3(),savedCamera=new THREE.Vector3();
 const metrics={rebases:0,frames:0,maxLocalCameraM:0,canonicalPhysics:true};
 function material(m:THREE.Material){if(materials.has(m))return;materials.add(m);const prior=m.onBeforeCompile,key=m.customProgramCacheKey();m.onBeforeCompile=function(s,r){prior.call(this,s,r);s.uniforms.eeRenderOrigin=uniform;s.vertexShader=canonicalShader(s.vertexShader);s.fragmentShader=canonicalShader(s.fragmentShader,true);};m.customProgramCacheKey=()=>key+'-floating-presentation-v1';m.needsUpdate=true;}
 function observe(o:THREE.Object3D){if(observed.has(o))return;observed.add(o);if((o as THREE.HemisphereLight).isHemisphereLight)hemispheres.set(o as THREE.HemisphereLight,new THREE.Vector3());const mesh=o as THREE.Mesh;if(mesh.isMesh){const prior=o.onBeforeRender;o.onBeforeRender=function(...args){prior.apply(this,args);material(args[4]);};const shadow=o.onBeforeShadow;o.onBeforeShadow=function(...args){shadow.apply(this,args);material(args[5]);};if((o as THREE.SkinnedMesh).isSkinnedMesh)skeletons.add((o as THREE.SkinnedMesh).skeleton);}
  o.addEventListener('childadded',(e:any)=>observe(e.child));for(const child of o.children)observe(child);
 }
 observe(scene);
 renderer.render=function(s,c){if(s!==scene||c!==camera||drawing){original(s,c);return;}
  const p=position();if(automatic&&Math.hypot(p.x-presentationOrigin.x,p.z-presentationOrigin.z)>2048){if(setPresentationOrigin({x:Math.round(p.x/256)*256,y:0,z:Math.round(p.z/256)*256}))metrics.rebases++;}
  const before=scene.onBeforeRender;(before as any).call(scene,renderer,scene,camera,renderer.getRenderTarget());scene.onBeforeRender=()=>{};savedScene.copy(scene.position);savedCamera.copy(camera.position);drawing=true;for(const [light,saved]of hemispheres){saved.copy(light.position);light.position.add(uniform.value);}
  try{scene.position.sub(uniform.value);camera.position.sub(uniform.value);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);metrics.maxLocalCameraM=Math.max(metrics.maxLocalCameraM,Math.hypot(camera.position.x,camera.position.z));original(scene,camera);metrics.frames++;}
  finally{scene.onBeforeRender=before;for(const [light,saved]of hemispheres)light.position.copy(saved);scene.position.copy(savedScene);camera.position.copy(savedCamera);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();drawing=false;}
 };
 scene.userData.renderOrigin={origin:presentationOrigin,metrics};
 return {metrics,origin:presentationOrigin,force(p:{x:number;y:number;z:number}){automatic=false;if(setPresentationOrigin(p))metrics.rebases++;},automatic(on=true){automatic=on;},dispose(){stop();renderer.render=original;setPresentationOrigin({x:0,y:0,z:0});}};
}
