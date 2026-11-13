import {open16,launch,settle} from './mission-16-browser.mjs';
export {launch,settle};
export const forestInspection=`window.f17={
 summary(){let forest,art;scene.traverse(o=>{if(o.userData.forest){const f=o.userData.forest;forest={version:f.version,total:f.total,original:f.original,added:f.added,visible:f.visible,levels:f.levels,triangles:f.submittedTriangles,families:f.families,unsupported:f.unsupported,source:f.source,selectionUpdates:f.selectionUpdates,maxSelectionCpuMs:f.maxSelectionCpuMs}}if(o.userData.natureArt)art=o.userData.natureArt});return {forest,art,nature:natureMemory(scene),camera:camera.position.toArray(),climate:scene.userData.climate,lighting:scene.userData.landscapeLighting}},
 churn(){return (async()=>{const {addNature,updateNatureLOD,disposeNatureZone}=await import('/endless-earth/src/nature/render.ts'),rows=[];for(let i=0;i<6;i++){const g=new THREE.Group();g.position.set(camera.position.x,camera.position.y-3,camera.position.z-45);scene.add(g);const f=[{tags:{natural:'wood'},rings:[[{x:-40,z:-40},{x:40,z:-40},{x:40,z:40},{x:-40,z:40}]]}];addNature(g,f,()=>0);scene.updateMatrixWorld(true);updateNatureLOD(g,camera);renderer.render(scene,camera);const during={...renderer.info.memory};disposeNatureZone(g);scene.remove(g);renderer.render(scene,camera);renderer.getContext().finish();rows.push({during,after:{...renderer.info.memory},alloc:window.gpuAllocation.snapshot()})}return rows})()},
 inventory(){let rows=[];scene.traverse(o=>{if(o.userData.forest)rows=o.userData.forest.items.map(t=>({p:t.p,layout:t.l,center:t.center.toArray(),radius:t.radius,visible:t.visible,lod:t.lod}))});return rows},
 camera(p,target,fov=55){camera.position.fromArray(p);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();scene.traverse(o=>o.userData.updateForest?.(camera,lifeSettings.name,true))},
 export(){scene.updateMatrixWorld(true);const meshes=[],trees=[];scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const tile=o.userData.earthTile;if(tile||o.name.startsWith('architecture-')&&o.name!=='architecture-detail'||o.name.startsWith('landmark-')||o.name==='mapped-linear-features'){const g=tile?.fineGeometry??o.geometry,p=g.attributes.position,n=g.attributes.normal;meshes.push({name:o.name,position:Array.from(p.array),normal:Array.from({length:p.count},(_,i)=>[n.getX(i),n.getY(i),n.getZ(i)]).flat(),index:g.index?Array.from(g.index.array):null,matrix:o.matrixWorld.toArray(),water:g.attributes.earthWater?Array.from(g.attributes.earthWater.array):null})}});scene.traverse(o=>{const f=o.userData.forest;if(!f)return;for(const p of f.items){const model=p.model,box=model.crownBox.clone().applyMatrix4(p.worldMatrix);trees.push({center:box.getCenter(new THREE.Vector3()).toArray(),radius:box.getSize(new THREE.Vector3()).multiplyScalar(.5).toArray(),evergreen:p.l.evergreen})}});let anchors=[];scene.traverse(o=>{if(o.userData.forest)anchors=o.userData.forest.trees});return {meshes,trees,anchors,baseline:activeTerrain.sample(0,0)}},
 };`;
export async function openForest(browser,port=5317,options={}){return open16(browser,port,{...options,append:forestInspection+(options.append??'')})}
export const forestViews=[
 ['bois',-430,340,1,-.12,0,'first'],
 ['sous-bois',-426.72308821603656,346.51291632745415,.7853981633974483,.12,0,'first'],
 ['lisiere',-300,340,1.4,.02,0,'first'],
 ['aerienne',-430,340,.5,.5,110,'aerial'],
 ['vallee',-100,155,.5,.5,210,'aerial'],
 ['berge',-307.7,94.3,1.5,-.06,0,'first'],
 ['village',-55,70,.85,-.05,0,'first'],
 ['pente',-520,440,.65,-.12,0,'first'],
];
