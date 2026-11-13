import {launch,open18,settle18} from './mission-18-browser.mjs';export {launch,settle18};
export const inspection=`
import {lightingUniforms as m19U} from '/endless-earth/src/lighting/state.mjs';
import {tourDiagnostics as m19Tour} from '/endless-earth/src/living/geography.ts';
window.m19={
 rotate(angle){const p=avatar.position.clone().add(new THREE.Vector3(0,1.65,0));camera.position.copy(p);camera.lookAt(p.x-Math.sin(angle),p.y,p.z-Math.cos(angle));camera.updateMatrixWorld();window.c15.tick();},
 forest(){let f;scene.traverse(o=>{if(o.userData.forest){const s=o.userData.forest;f={visible:s.visible,levels:s.levels,selectionUpdates:s.selectionUpdates,selectionCpuMs:s.selectionCpuMs,maxSelectionCpuMs:s.maxSelectionCpuMs,transitions:s.transitioning,pending:s.pendingTransitions,appearances:s.appearances,disappearances:s.disappearances,batchRebuilds:s.batchRebuilds,items:s.items.map((t,i)=>({id:t.id??'tree:'+t.p.x.toFixed(6)+':'+t.p.z.toFixed(6),anchor:t.p,family:t.l.id,visible:t.visible,frustum:t.inFrustum,reason:t.reason,lod:t.lod,desired:t.desired,next:t.next,pixels:t.pixels,distance:t.cameraDistance,loaded:true}))}}});return f},
 advance(dt=.1){updateAtmosphere(dt,quality==='low',dt);updateForestLife(scene);window.c15.tick()},
 camera(p,target,fov=55){camera.position.fromArray(p);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();window.c15.tick()},
 rig(distance,dt=1/60){const facing=avatar.rotation.y;avatar.position.x+=Math.sin(facing)*distance;avatar.position.z+=Math.cos(facing)*distance;avatar.position.y=walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(avatar.position.x,avatar.position.z);return walkerModel.update(distance,dt,walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z)))},
 shadow(mode){if(mode==='normal'){scene.onBeforeRender=this.before??scene.onBeforeRender;return}this.before??=scene.onBeforeRender;scene.onBeforeRender=(...a)=>{this.before.apply(scene,a);if(mode==='landscape-only')m19U.m18WalkerActive.value=0;else if(mode==='none'){m19U.m18WalkerActive.value=0;m19U.m14ShadowActive.value=0}}},
 pixels(){window.c15.render();const gl=renderer.getContext(),p=new Uint8Array(innerWidth*innerHeight*4);gl.readPixels(0,0,innerWidth,innerHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return Array.from(p)},
 tours(){return m19Tour()},route(){return routeAt(avatar.position,activeTerrain)},
 playRoute(route){walker.start(route)},
 support(x,z){return {height:walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(x,z),clear:validPoint({x,z},activeTerrain)}},
 state(){return {game:window.c15.snapshot(),forest:this.forest(),tours:m19Tour(),glError:renderer.getContext().getError()}}
};`;
export async function open19(browser,{port=Number(process.env.MISSION19_PORT??5332),...options}={}){return open18(browser,{port,...options,append:inspection+(options.append??'')})}
