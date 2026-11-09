import * as THREE from 'three';
import {windUniform,seasonUniform} from '../living/atmosphere';
import {nature} from '../living/geography';
// @ts-ignore Pure shared solar and weather model.
import {solar,weatherStep,WEATHER,birdState} from './climate.mjs';
import {environmentalTime,environmentalWind} from './surfaces';
export function naturalSky(scene:THREE.Scene,sun:THREE.DirectionalLight,height:(x:number,z:number)=>number|null,site:{lat:number;lon:number},hemisphere:THREE.HemisphereLight,player:THREE.Object3D){
 const params=new URLSearchParams(location.search),mode=params.get('time')==='demo'?'demo':'real';
 let fixed=params.get('date')?new Date(params.get('date')!):null;if(fixed&&!Number.isFinite(+fixed))fixed=null;
 if(params.has('perf'))addEventListener('nature-test-date',((event:CustomEvent)=>{const date=new Date(event.detail);if(Number.isFinite(+date))fixed=date}) as EventListener);
 let elapsed=0,state={...WEATHER.clear},target=WEATHER[params.get('weather') as keyof typeof WEATHER]??WEATHER.clear;
 const status=document.createElement('small');status.className='nature-status';status.style.cssText='display:block;color:#e6eddf;background:#283c34bb;border-radius:5px;padding:4px 8px;font:11px system-ui;pointer-events:none';document.querySelector('#app')!.append(status);
 const controls=document.createElement('details');controls.className='nature-controls';controls.style.cssText='position:fixed;right:14px;top:224px;background:#283c34df;color:#eef0e6;padding:8px;border-radius:6px;font:12px system-ui;z-index:20';controls.innerHTML='<summary>Temps et atmosphère</summary><label>Horloge <select aria-label="Horloge"><option value="real">Heure réelle du lieu</option><option value="demo">Démonstration · ×72</option></select></label><br><label>Météo simulée <select aria-label="Météo simulée"><option value="clear">Clair</option><option value="overcast">Couvert</option><option value="mist">Brume</option><option value="rain">Pluie · ambiance couverte</option></select></label>';document.querySelector('#app')!.append(controls);controls.append(status);let clockMode=mode;const selects=controls.querySelectorAll('select');selects[0].value=mode;selects[0].onchange=()=>{clockMode=selects[0].value as typeof mode};selects[1].value=params.get('weather')??'clear';selects[1].onchange=()=>{target=WEATHER[selects[1].value as keyof typeof WEATHER]};
 const skyGeo=new THREE.SphereGeometry(1400,24,12),skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()}},vertexShader:'varying float elevation; void main(){elevation=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 zenith; uniform vec3 horizon; varying float elevation; void main(){gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-.08,.75,elevation)),1.0);\n#include <colorspace_fragment>\n}'});
 const dome=new THREE.Mesh(skyGeo,skyMaterial);dome.frustumCulled=false;dome.renderOrder=-10;scene.add(dome);
 const cloudMaterial=new THREE.MeshLambertMaterial({color:0xe6e8e0}),clouds=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),cloudMaterial,60);clouds.frustumCulled=false;scene.add(clouds);const dummy=new THREE.Object3D();
 const birds=new THREE.Group(),birdGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.5,0,0),new THREE.Vector3(0,-.07,.1),new THREE.Vector3(.5,0,0)]),birdMaterial=new THREE.LineBasicMaterial({color:0x424740});for(let i=0;i<4;i++)birds.add(new THREE.Line(birdGeometry,birdMaterial));scene.add(birds);
 let stamp=-1;const base=Date.now();
 return (dt:number,eco:boolean)=>{elapsed+=dt;environmentalTime.value+=dt;state=weatherStep(state,target,dt);environmentalWind.value=state.wind;windUniform.value+=dt*(.5+state.wind);
  const date=fixed??new Date(clockMode==='demo'?base+elapsed*72000:Date.now()),s=solar(date,site.lat,site.lon),day=THREE.MathUtils.smoothstep(s.altitude,-.13,.35),warm=Math.max(0,1-Math.abs(s.altitude-.05)/.32)*day;
  seasonUniform.value=s.month>=9&&s.month<=11?.7:s.month<=2?.4:0;
  const horizon=new THREE.Color(0x1b293e).lerp(new THREE.Color(0xcbd7d6),day).lerp(new THREE.Color(0xe4bd93),warm*.55).lerp(new THREE.Color(0x99a9b0),state.cloud*.35),zenith=new THREE.Color(0x101b30).lerp(new THREE.Color(0x7cabc7),day).lerp(new THREE.Color(0x9faeb7),state.cloud*.55);
  skyMaterial.uniforms.zenith.value.copy(zenith);skyMaterial.uniforms.horizon.value.copy(horizon);dome.position.copy(player.position);(scene.background as THREE.Color).copy(horizon);const fog=scene.fog as THREE.Fog;fog.color.copy(horizon);fog.near=320-state.mist*160-warm*25;fog.far=1450-state.mist*550-warm*80;
  sun.intensity=Math.max(0,Math.sin(s.altitude))*2.0*(1-state.cloud*.65);sun.color.set(0xfff3dc).lerp(new THREE.Color(0xf1b17d),warm*.65);hemisphere.intensity=.18+day*1.45;hemisphere.color.copy(zenith).lerp(new THREE.Color(0xffffff),.65);hemisphere.groundColor.set(0x707961);
  sun.position.set(player.position.x+Math.sin(s.azimuth)*Math.cos(s.altitude)*150,player.position.y+Math.sin(s.altitude)*150,player.position.z-Math.cos(s.azimuth)*Math.cos(s.altitude)*150);sun.target.position.copy(player.position);sun.target.updateMatrixWorld();
  clouds.count=eco?30:60;cloudMaterial.color.set(0x5c6879).lerp(new THREE.Color(0xe9ebe3),day*(1-state.cloud*.2));
  for(let i=0;i<clouds.count;i++){const cluster=Math.floor(i/5),part=i%5,drift=elapsed*(.4+cluster*.017)*(.5+state.wind);dummy.position.set(((cluster*173+drift)%1800)-900+part*16,155+(cluster%3)*24+Math.sin(part*2+cluster)*4,Math.sin(cluster*7)*650+Math.cos(part*5)*17);dummy.scale.set(26+Math.sin(cluster+part)*8,8+noiseCloud(i)*6+state.cloud*9,20+Math.cos(i)*8);dummy.rotation.y=cluster;dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix)}clouds.instanceMatrix.needsUpdate=true;
  birds.children.forEach((bird,i)=>{
   const a=nature[(i*177)%nature.length],b=birdState(elapsed,i);if(!a){bird.visible=false;return}
   if(b.perched&&Math.hypot(player.position.x-a.x,player.position.z-a.z)<7&&bird.userData.fleeStart===undefined)bird.userData.fleeStart=elapsed;
   if(bird.userData.fleeStart!==undefined&&elapsed-bird.userData.fleeStart>=20)delete bird.userData.fleeStart;
   const fleeing=bird.userData.fleeStart!==undefined&&elapsed-bird.userData.fleeStart<20,perched=b.perched&&!fleeing,t=fleeing?(elapsed-bird.userData.fleeStart)/20:b.progress;
   bird.visible=(b.visible||fleeing)&&day>.2&&state.rain<.2&&(!eco||i<2);
   const perch=a.perchY??(height(a.x,a.z)??0)+8;
   bird.position.set(a.x+(perched?0:t*110),perch+(perched?0:Math.sin(t*Math.PI*.5)*13),a.z+(perched?0:Math.sin(t*2)*17));bird.scale.setScalar(perched?.38:1);bird.rotation.y=-Math.PI/2;bird.rotation.z=perched?0:Math.sin(elapsed*(4+i*.3))*.14;
  });
  if(Math.floor(elapsed)!==stamp){stamp=Math.floor(elapsed);status.textContent=`${fixed?'Date de référence':clockMode==='real'?'Heure locale':'Démo ×72'} · ${new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}).format(date)} · météo simulée`;scene.userData.climate={mode:clockMode,date:date.toISOString(),solar:s,weather:{...state},simulation:true}}
 };
}
function noiseCloud(i:number){return Math.sin(i*17.3)*.5+.5}
