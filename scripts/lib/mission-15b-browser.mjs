import {launch,openGame,settle} from './mission-15-browser.mjs';export {launch,settle};
export const views=[
 ['rue',-55,70,.85,-.05,0,'first'],['pont',-187,160,-1.6,-.28,0,'first',null,1.65,73.9],
 ['foret',-430,340,1,-.12,0,'first'],['falaise',-80,210,-.75,-.28,0,'first'],
 ['toitures',-100,155,.5,.5,110,'aerial'],['vallee',-100,155,.5,.5,210,'aerial'],
 ['sous-pont',-202,160,-1.1,-.12,0,'first',null,1.65,67.8],
 ['persistants',521,269,1.4,-.12,0,'first']
];
export async function openSnowGame(browser,port=5173,options={}){
 return openGame(browser,port,{...options,append:`
 window.m15b={
  setup(v,profile='balanced',date='2026-01-21',weather='overcast',pose){window.m15.setup(v,profile,date,weather,pose);const previous=avatar.position.y,h=walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(v[1],v[2]);if(h!==null){avatar.position.y=h;if(!pose)camera.position.y+=h-previous}if(!pose&&v[9]!==undefined)camera.position.y=v[9]-activeTerrain.sample(0,0);camera.updateMatrixWorld();updateAtmosphere(0,quality==='low')},
  cover(value,locked=true){dispatchEvent(new CustomEvent('snow-test-cover',{detail:{cover:value,locked}}));updateAtmosphere(0,quality==='low')},
  weather(value){const s=document.querySelector('select[aria-label="Météo simulée"]');s.value=value;s.dispatchEvent(new Event('change'))},
  conditions(values){Object.assign(scene.userData.climate.weather,values);updateAtmosphere(0,quality==='low')},
  step(dt,wall=dt){updateAtmosphere(dt,quality==='low',wall)},
  state(){return {...window.m15.state(),snow:scene.userData.snow,shadow:scene.userData.landscapeLighting,audio:sound.stats()}},
  setPose(position,target){camera.position.fromArray(position);camera.lookAt(...target);camera.updateMatrixWorld()},
  flakes(value){scene.getObjectByName('weather-snow').visible=value},
  pixels(){renderer.render(scene,camera);const gl=renderer.getContext(),data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.finish();gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return {width:gl.drawingBufferWidth,height:gl.drawingBufferHeight,data:Array.from(data)}},
  counts(){let meshes=0,materials=new Set(),active=0;scene.traverse(o=>{if(o.isMesh||o.isPoints){meshes++;if(o.visible)active++;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});return {meshes,materials:materials.size,active,gpu:renderer.info.memory,programs:renderer.info.programs.length}}
 };`+(options.append??'')});
}
export async function snowReady(page){await page.waitForFunction(()=>window.m15b.state().snow?.exposure==='ready');for(let i=0;i<3;i++)await page.evaluate(()=>window.m15b.step(0,.5));}
