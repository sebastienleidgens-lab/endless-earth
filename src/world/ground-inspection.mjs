import * as THREE from 'three';
// On-demand inspection only. No extra ray query in the walking frame loop.
export function inspectGround(scene,x,z,physical,collision,terrain){
 const meshes=[];scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh&&(o.userData.earthTile||o.name==='landmark-pont-road'))meshes.push(o)});
 const ray=new THREE.Raycaster(new THREE.Vector3(x,10000,z),new THREE.Vector3(0,-1,0)),hit=ray.intersectObjects(meshes,false)[0],g=terrain.grid,access=collision(x,z),normal=hit?.face?.normal?.clone().transformDirection(hit.object.matrixWorld),style=hit?.object.geometry.attributes.earthRoad?.getX(hit.face.a);
 return {x,z,visualHeight:hit?.point.y??null,physicalHeight:physical(x,z),differenceM:hit?physical(x,z)-hit.point.y:null,slope:normal?Math.hypot(normal.x,normal.z)/Math.max(.00001,Math.abs(normal.y)):null,support:access.surface,material:style??null,mesh:hit?.object.name??null,face:hit?.faceIndex??null,terrainCell:[Math.floor((x-g.origin_x_m)/g.step_m),Math.floor((z-g.origin_z_m)/g.step_m)],provenance:{terrain:terrain.sourceSha256,refinement:terrain.relief?.sha256,surface:terrain.singleSurface?.manifest.binarySha256,datum:g.vertical_datum},obstacle:access.obstacle};
}
