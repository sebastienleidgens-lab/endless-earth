export const injection=`
window.earthTest={
 setup(v){const [name,x,z,y,p,k,mode]=v;walker.stop();qualityAuto=false;applyQuality(['eco','mobile'].includes(name)?'low':'high');viewMode=mode;avatar.visible=mode!=='first';avatar.position.set(x,activeTerrain.relativeHeight(x,z),z);yaw=y;pitch=p;zoom=k;const eye=avatar.position.clone();eye.y+=1.65;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 if(mode==='first'){camera.position.copy(eye);camera.lookAt(eye.x-Math.sin(y)*Math.cos(p),eye.y-Math.sin(p),eye.z-Math.cos(y)*Math.cos(p))}
 else {camera.position.copy(eye).add(mode==='aerial'?new THREE.Vector3(Math.sin(y)*k,k*.78,Math.cos(y)*k):new THREE.Vector3(Math.sin(y)*Math.cos(p)*k,Math.sin(p)*k+.5,Math.cos(y)*Math.cos(p)*k));camera.lookAt(eye)}
 updateAtmosphere(0,quality==='low');camera.updateMatrixWorld();walkStatus.textContent='Station de comparaison · simulation en pause';viewButton.textContent='◉ '+viewNames[mode]+' · changer (V)';
 },
 lod(){const t=performance.now();updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low');if(typeof updateTerrainLOD==='function')updateTerrainLOD(scene,camera.position,avatar.position,quality==='low');return performance.now()-t},
 render(){renderer.render(scene,camera);const gl=renderer.getContext(),n=gl.drawingBufferWidth*gl.drawingBufferHeight*4;window.earthReadback??=new Uint8Array(n);if(window.earthReadback.length!==n)window.earthReadback=new Uint8Array(n);gl.finish();gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,window.earthReadback);return {...renderer.info.render,textures:renderer.info.memory.textures}},
 memory(){const seen=new Set(),arrays=new Set(),textures=new Set();let geometryBytes=0,textureBytes=0;
 const account=g=>{if(seen.has(g))return;seen.add(g);for(const a of [...Object.values(g.attributes),...(g.index?[g.index]:[])])if(!arrays.has(a.array)){arrays.add(a.array);geometryBytes+=a.array.byteLength}};
 scene.traverse(o=>{for(const g of [...(o.userData.terrainResources?.geometries??[]),...(o.userData.natureResources?.geometries??[])])account(g);if(o.geometry)account(o.geometry);const tex=o.userData.terrainTexture;if(tex)textures.add(tex)});for(const tex of textures){const i=tex.image;textureBytes+=i.width*i.height*4*4/3}return {geometryBytes,terrainTextureBytesWithMipmaps:textureBytes,geometries:seen.size}},
 terrainCpu(){const samples=[];for(let i=0;i<3;i++){const start=performance.now(),g=activeTerrain.createMesh();samples.push(performance.now()-start);const geom=new Set(),mat=new Set();g.traverse(o=>{for(const a of o.userData.terrainResources?.geometries??[])geom.add(a);if(o.geometry){geom.add(o.geometry);mat.add(o.material)}});geom.forEach(g=>g.dispose());mat.forEach(m=>m.dispose())}return samples},
 terrain(){return activeTerrain.metrics??null}
};`;
