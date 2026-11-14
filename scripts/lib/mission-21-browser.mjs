import {launch,open20,settle18} from './mission-20-browser.mjs';export {launch,settle18};
export const inspection=`
window.m21={
 state(){return {climate:JSON.parse(JSON.stringify(scene.userData.climate)),lighting:scene.userData.landscapeLighting,rain:scene.userData.rainShelter,gpu:{...renderer.info.memory,programs:renderer.info.programs.length},position:avatar.position.toArray(),camera:camera.position.toArray(),lanterns:scene.userData.lanterns}},
 step(dt=.1){window.m20.step(dt);if(activeTerrain)lanterns.update(scene.userData.climate,avatar.position,(x,z)=>activeTerrain.relativeHeight(x,z),lifeSettings.name)},
 settle(seconds=90){for(let i=0;i<Math.ceil(seconds/.25);i++)this.step(.25)},
 weather(key){window.m18.choose('Météo simulée',key)},
 moment(key){window.m18.choose('Moment de la journée',key)},
 date(key){window.m18.absolute(key)},
 comfort(value){const e=document.querySelector('input[aria-label="Éclairs atténués"]');e.checked=value;e.dispatchEvent(new Event('change'))},
 evolution(value){const e=document.querySelector('input[aria-label="Évolution naturelle"]');e.checked=value;e.dispatchEvent(new Event('change'))},
 pixels(){window.c15.render();const gl=renderer.getContext(),p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);let mean=0,white=0;for(let i=0;i<p.length;i+=4){const y=(p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722)/255;mean+=y;white+=Number(y>.94)}return {mean:mean/(p.length/4),white:white/(p.length/4),glError:gl.getError()}},
 resume(){clock.getDelta();window.cHold=false},pause(){window.cHold=true},
 route(){const r=routeAt(avatar.position,activeTerrain);if(r)walker.start(r);return r},
 nativeSettings(a){const p=avatar.position.toArray();for(const [l,v]of [['Profil graphique',a.profile],['Vue du personnage',a.view],['Météo simulée',a.weather],['Moment de la journée',a.moment]])if(v)window.m18.choose(l,v);if(a.month)window.m18.month(a.month);return {before:p,after:avatar.position.toArray()}},
 heading(){const p=walker.route?.points[walker.index];if(p)yaw=Math.atan2(avatar.position.x-p.x,avatar.position.z-p.z)},
 rotate(a){yaw+=a;lastCameraInteraction=performance.now()},
 audio(){const v=new THREE.Vector3();camera.getWorldDirection(v);sound.listener(camera.position,v,new THREE.Vector3(0,1,0));sound.update(avatar.position,0,0,yaw,scene.userData.climate,scene.userData.earthLife,scene.userData.lifeHabitat,lifeSettings.name,(x,z)=>activeTerrain.sample(x,z));return sound.stats()},
 lanternPositions(){const r=scene.getObjectByName('interpreted-entry-lanterns');return r.children.map(o=>({position:o.position.toArray(),angle:o.rotation.y,visible:o.visible}))},
 adaptive(){return scene.userData.adaptiveResolution},
 disposeAudio(){return sound.dispose().then(()=>({state:sound.context.state,stats:sound.stats()}))}
};`;
export async function open21(b,options={}){return open20(b,{port:Number(process.env.MISSION21_PORT??5343),...options,append:inspection+(options.append??'')})}
