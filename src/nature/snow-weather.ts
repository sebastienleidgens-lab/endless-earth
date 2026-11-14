import * as THREE from 'three';
// @ts-ignore Pure, tested snow state and source-bound exposure validation.
import {snowStep,snowTemperature,validateSnowExposure,exposureHeight,SNOW_VERSION} from './snow-model.mjs';
// @ts-ignore Shared appearance and lifecycle.
import {snowUniforms,setSnowAppearance,resetSnowAppearance} from './snow-state.mjs';
import {createSnowfall} from './snowfall';
const hash=async(bytes:BufferSource)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
export function createSnowWeather(scene:THREE.Scene,latitude=46){
 const params=new URLSearchParams(location.search),controller=new AbortController(),particles=createSnowfall(scene),state={cover:0,temperature:2,falling:0,phase:'bare'};
 const requestedCover=params.has('perf')&&params.has('snowCover')?Number(params.get('snowCover')):NaN;
 let fixed=Number.isFinite(requestedCover)?THREE.MathUtils.clamp(requestedCover,0,1):null;
 let exposureBytes:Uint8Array|null=null,exposureManifest:any=null;
 let texture:THREE.DataTexture|null=null,disposed=false,fade=0,source:any=null,request:AbortController|null=null;
 const metrics=scene.userData.snow={version:SNOW_VERSION,...state,exposure:'idle',bytes:0,textureBytes:0,flakes:0,diagnosticCover:fixed!==null,provenance:'Artistic simulated snow, not measured weather, depth or ice; thin surface appearance, unchanged collision geometry'};
 if(params.has('perf'))addEventListener('snow-test-cover',((event:CustomEvent)=>{const cover=event.detail?.cover;if(!Number.isFinite(cover))return;state.cover=Math.max(0,Math.min(1,cover));fixed=event.detail.locked===false?null:state.cover;metrics.diagnosticCover=fixed!==null}) as EventListener,{signal:controller.signal});
 async function load(){const assets=scene.userData.snowExposureSource;if(!assets){metrics.exposure='unavailable';return}if(source===assets||disposed)return;source=assets;metrics.exposure='loading';request?.abort();const pending=new AbortController();request=pending;
  try{const response=await fetch(assets.manifestUrl,{signal:pending.signal});if(!response.ok)throw Error('Snow exposure unavailable');const m=await response.json();if(!Number.isInteger(m.rawBytes)||m.rawBytes>2097152||m.rawBytes<32768)throw Error('Snow exposure allocation limit');const r=await fetch(assets.packUrl,{signal:pending.signal});if(!r.ok)throw Error('Snow exposure pack unavailable');const packed=await r.arrayBuffer();if(packed.byteLength>4194304||await hash(packed)!==m.packedSha256)throw Error('Snow exposure checksum mismatch');let decoded=0;const bounded=new TransformStream<Uint8Array,Uint8Array>({transform(chunk,control){decoded+=chunk.byteLength;if(decoded>m.rawBytes)throw Error('Snow exposure decompression limit');control.enqueue(chunk)}});const raw=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip')).pipeThrough(bounded)).arrayBuffer();validateSnowExposure(m,raw,assets.bindings);if(await hash(raw)!==m.sha256)throw Error('Snow exposure raw checksum mismatch');if(disposed||source!==assets)return;
   exposureBytes=new Uint8Array(raw);exposureManifest=m;texture?.dispose();texture=new THREE.DataTexture(new Uint8Array(raw),m.size,m.size,THREE.RGFormat);texture.name='Source-bound snow upper envelope';texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.needsUpdate=true;snowUniforms.earthSnowTop.value=texture;snowUniforms.earthSnowField.value.set(...m.origin,...m.extent);metrics.exposure='ready';fade=0;metrics.bytes=packed.byteLength;metrics.textureBytes=raw.byteLength;
  }catch(error){if(disposed||pending.signal.aborted||source!==assets)return;metrics.exposure='fallback';console.warn('Snow exposure unavailable; coating and flakes withheld, existing weather retained',error)}
 }
 const sample=(p:{x:number;y:number;z:number})=>{
  if(metrics.exposure!=='ready'||!exposureBytes||!exposureManifest)return {cover:0,temperature:state.temperature,phase:state.phase};
  const top=exposureHeight(exposureBytes,exposureManifest,p.x,p.z);if(top===null)return {cover:0,temperature:state.temperature,phase:state.phase};
  const grain=snowUniforms.earthSnowGrain.value.image.data as Uint8Array,u=(p.x*.014+p.y*.001)*64-.5,v=(p.z*.014+p.y*.001)*64-.5,ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz,at=(x:number,z:number)=>grain[((z%64+64)%64)*64+(x%64+64)%64]/255;
  const pattern=THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix,iz),at(ix+1,iz),fx),THREE.MathUtils.lerp(at(ix,iz+1),at(ix+1,iz+1),fx),fz);
  const exposed=THREE.MathUtils.smoothstep(p.y,top-2.2,top-.7),coat=THREE.MathUtils.smoothstep(state.cover*1.8-(1-pattern)*.35,.025,.48)*exposed*snowUniforms.earthSnowReady.value;
  return {cover:coat,temperature:state.temperature,phase:state.phase,basis:'same loaded exposure, coating and grain as rendered ground'};
 };
 return {sample,update(camera:THREE.Vector3,player:THREE.Vector3,dt:number,wallDt:number,time:number,date:Date,weather:any,wind:THREE.Vector2,day:number,profile:string){
  if(disposed)return state;
  const snow=weather.snow??0,temperature=Number.isFinite(weather.temperatureC)?weather.temperatureC:snowTemperature(date,day,snow,latitude);snowStep(state,wallDt,{snow,rain:weather.rain,temperature,day});if(fixed!==null&&Number.isFinite(fixed))state.cover=Math.max(0,Math.min(1,fixed));
  if(snow>.005||state.cover>.0005)void load();const ready=metrics.exposure==='ready';fade=Math.min(1,fade+Math.max(0,wallDt)/1.2);snowUniforms.earthSnowCover.value=state.cover;snowUniforms.earthSnowReady.value=ready?fade:0;snowUniforms.earthSnowDetail.value=profile==='eco'?0:1;setSnowAppearance(ready&&state.cover>.0005);
  particles.update(camera,player,dt,time,snow,wind,day,profile,ready);Object.assign(metrics,state,{flakes:particles.count});return state;
 },dispose(){disposed=true;controller.abort();request?.abort();particles.dispose();texture?.dispose();texture=null;source=null;metrics.textureBytes=0;resetSnowAppearance();if(scene.userData.snow===metrics)delete scene.userData.snow}};
}
