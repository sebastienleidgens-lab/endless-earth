import * as THREE from 'three';
import { ANGLES, toLocal } from './geo';
import { renderGeoFeatures } from './geodata';
// The runtime modules are shared with Node.js tests and intentionally remain ESM.
// @ts-ignore JS module has no TypeScript declaration yet.
import { TileLoader } from './tile-loader.mjs';
// @ts-ignore JS module has no TypeScript declaration yet.
import { TileStream } from './tile-stream.mjs';

type TilePayload={features:Array<{type?:string;geometry?:{type:string;coordinates:unknown};properties?:Record<string,unknown>}>};
export function startTilePreview(scene:THREE.Scene, avatar:THREE.Object3D, onStatus:(status:string)=>void){
  const world=new THREE.Group();
  scene.add(world);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(2200,2200),new THREE.MeshLambertMaterial({color:0x91aa84}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;world.add(ground);
  const loader=new TileLoader({baseUrl:`${import.meta.env.BASE_URL}tiles`,maxEntries:20});
  let rendered=0;
  const stream=new TileStream({
    loader,zoom:14,radius:1,maxVisible:9,
    create:(data:TilePayload)=>{
      const group=new THREE.Group();
      const count=renderGeoFeatures(group,data.features);
      rendered+=count;
      world.add(group);
      onStatus(`Tuiles réelles : ${stream.visible.size+1} · objets : ${rendered}`);
      return {group,count};
    },
    dispose:(item:{group:THREE.Group;count:number})=>{
      world.remove(item.group);
      item.group.traverse(object=>{
        if(object instanceof THREE.Mesh){
          object.geometry.dispose();
          const materials=Array.isArray(object.material)?object.material:[object.material];
          for(const material of materials)material.dispose();
        }
      });
      rendered=Math.max(0,rendered-item.count);
    }
  });
  let lastX=Infinity,lastZ=Infinity;
  async function update(){
    if(Math.hypot(avatar.position.x-lastX,avatar.position.z-lastZ)<25)return;
    lastX=avatar.position.x;lastZ=avatar.position.z;
    const lat=ANGLES.lat-avatar.position.z/111320;
    const lon=ANGLES.lon+avatar.position.x/(111320*Math.cos(ANGLES.lat*Math.PI/180));
    await stream.update(lat,lon);
    if(!stream.visible.size)onStatus('Mode tuiles : aucune donnée publiée · sol provisoire');
  }
  void update();
  return {update,dispose:()=>{stream.destroy();scene.remove(world);ground.geometry.dispose();(ground.material as THREE.Material).dispose();}};
}
