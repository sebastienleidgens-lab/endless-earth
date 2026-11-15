import {evidencePlugin} from './mission-25-2-diagnostic.mjs';
const extension=`
if(new URLSearchParams(location.search).has('evidence')){
 const traces=[];const before=scene.onAfterRender;
 scene.onAfterRender=function(...args){before.apply(this,args);if(!window.__missionRecording)return;
  const joints=[];avatar.traverse(o=>{if(o.isBone){joints.push({name:o.name,local:o.position.toArray(),rotation:o.quaternion.toArray(),world:o.getWorldPosition(new THREE.Vector3()).toArray(),worldRotation:o.getWorldQuaternion(new THREE.Quaternion()).toArray()})}});
  const birds=scene.getObjectByName('living-birds');const matrices=birds?Array.from(birds.instanceMatrix.array.slice(0,birds.count*16)):[];
  traces.push({t:performance.now(),time:scene.userData.climate?.elapsedSeconds,root:avatar.position.toArray(),phase:walkerModel.motion.phase,speed:walkerModel.motion.speed,activity:activity.state,joints,birdMatrices:matrices,birds:structuredClone(scene.userData.birdMetrics),shadow:structuredClone({...scene.userData.landscapeLighting,character:undefined}),feet:walkerModel.feet.map(f=>({side:f.side,stance:f.stance,cycle:f.cycle,anchor:f.anchor.toArray(),contact:f.contact.toArray()}))});
 };
 window.q26={start(){traces.length=0;window.p252.record()},async stop(){const media=await window.p252.stop({base64:true});return {...media,transforms:traces}},follow(){return boat.toggleFollow?.(scene.userData.aquaticProvider,playerWaterClear)},
 async regionPlace(position,mode='foot',profile='eco'){if(typeof planet==='undefined'||!planet)throw Error('Department runtime unavailable in this reference');window.__missionHold=false;const p=await planet.prepareLocation(position,mode);if(!p)throw Error('No admitted source road near this diagnostic location');window.p252.setup({profile});planet.car.active=false;activity.reset();avatar.position.set(p.x,p.y,p.z);avatar.rotation.y=p.heading;yaw=p.heading+Math.PI;pitch=.08;zoom=smoothZoom=thirdZoom=6;boomLength=6;eyeHeight=p.y+1.65;transitionElapsed=1;window.__missionHold=false;return p;},
 carPlace(p){planet.car.place({x:p.x,y:p.y,z:p.z},p.heading);planet.car.placed=true;planet.car.active=false;const side={x:p.x+Math.cos(p.heading)*1.65,z:p.z-Math.sin(p.heading)*1.65};const h=planet.height(side.x,side.z);if(h===null)throw Error('Unknown door support');avatar.position.set(side.x,h,side.z);return {clear:planet.car.clearAt(p.x,p.z,p.heading,(x,z)=>planet.admission(x,z,'car')),car:planet.car};},
 support(){if(typeof planet==='undefined'||!planet)return null;const meshes=[];scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('planet-terrain-'))meshes.push(o)});const ray=new THREE.Raycaster(new THREE.Vector3(avatar.position.x,avatar.position.y+1000,avatar.position.z),new THREE.Vector3(0,-1,0),0,2000),hit=ray.intersectObjects(meshes,false)[0],physical=planet.height(avatar.position.x,avatar.position.z);return {physical,rendered:hit?.point.y??null,error:hit&&physical!==null?hit.point.y-physical:null,mesh:hit?.object.name??null};},
 world(){return {position:avatar.position.toArray(),heading:avatar.rotation.y,birds:scene.userData.birdMetrics,shadow:scene.userData.landscapeLighting,boat:{active:boat.active,heading:boat.heading,following:boat.following,metrics:boat.followMetrics},planet:typeof planet==='undefined'?null:planet?.metrics}},
 };
}
`;
export function mission26EvidencePlugin(){const prior=evidencePlugin();return {...prior,name:'mission-26-native-evidence',transform(code,id){const result=prior.transform(code,id);return result?result+extension:undefined;}}}
