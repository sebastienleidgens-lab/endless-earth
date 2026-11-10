import * as THREE from 'three';
const constructors={f32:Float32Array,i16:Int16Array,u8:Uint8Array,u16:Uint16Array,u32:Uint32Array};
export function decodeSurface(manifest,buffer){
 if(manifest.schema!=='endless-earth-single-surface-v1'||buffer.byteLength!==manifest.binaryBytes||!Array.isArray(manifest.tiles)||manifest.tiles.length>256)throw new Error('Invalid surface manifest');
 const array=descriptor=>{
  const Type=constructors[descriptor?.type];if(!Type||!Number.isInteger(descriptor.offset)||!Number.isInteger(descriptor.length)||descriptor.offset<0||descriptor.length<0||descriptor.offset%Type.BYTES_PER_ELEMENT||descriptor.offset+descriptor.length*Type.BYTES_PER_ELEMENT>buffer.byteLength)throw new Error('Invalid surface buffer');
  return new Type(buffer,descriptor.offset,descriptor.length);
 };
 return {manifest,tiles:manifest.tiles.map(t=>{
  const position=array(t.position),normal=array(t.normal),color=array(t.color),road=array(t.earthRoad),water=t.earthWater?array(t.earthWater):null,fine=array(t.fine),far=array(t.far),count=position.length/3;
  if(!Number.isInteger(count)||normal.length!==position.length||color.length!==position.length||road.length!==count||fine.length%3||far.length%3||!position.every(Number.isFinite)||!road.every(v=>v<=6)||!fine.every(v=>v<count)||!far.every(v=>v<count))throw new Error('Invalid surface topology');
  if(water&&(water.length!==count||!water.every((v,i)=>v<=1&&!(v&&road[i]))))throw new Error('Invalid water classes');
  if(manifest.water?.mode==='mapped-outline-dem-drape-v1'&&!water)throw new Error('Missing water classes');
  for(const ids of [fine,far])for(let i=0;water&&i<ids.length;i+=3)if(water[ids[i]]!==water[ids[i+1]]||water[ids[i]]!==water[ids[i+2]])throw new Error('Mixed water triangle');
  return {descriptor:t,attributes:{position:new THREE.BufferAttribute(position,3),normal:new THREE.BufferAttribute(normal,3,true),color:new THREE.BufferAttribute(color,3,true),earthRoad:new THREE.BufferAttribute(road,1),...(water?{earthWater:new THREE.BufferAttribute(water,1)}:{})},fine:new THREE.BufferAttribute(fine,1),far:new THREE.BufferAttribute(far,1)};
 })};
}
