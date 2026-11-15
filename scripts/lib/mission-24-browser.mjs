import {launch,openWalker,settle} from './mission-15c-browser.mjs';
export {launch,settle};
export const out='docs/mission-24-evidence';
export const inspection=`
window.m24={
 summary(){return {game:window.c15.snapshot(),snow:scene.userData.snow,signs:signs.metrics,water:{policy:'blocked: unknown bathymetry; no aquatic admission added'},contacts:walkerModel.motion.footContacts.map(c=>({side:c.side,position:c.position.toArray()}))}},
 forest(){let result;scene.traverse(o=>{if(o.userData.forest)result=o.userData.forest});return result},
 tree(kind){const f=this.forest(),items=f.items.filter(t=>t.l.id===kind&&Math.hypot(t.p.x,t.p.z)<850).sort((a,b)=>Math.hypot(a.p.x+430,a.p.z-340)-Math.hypot(b.p.x+430,b.p.z-340));return items[0]},
 station(kind='spreading',below=false){const t=this.tree(kind);if(!t)return null;const b=t.model.tree.branches.find(b=>b.order===1),raw=b.points[2].clone().applyMatrix4(t.worldMatrix),d=Math.max(1.3,b.points[0].distanceTo(b.points.at(-1))*t.l.scale[1]*.6);camera.position.copy(raw).add(new THREE.Vector3(d*.45,below?-d*.45:d*.4,d*.75));camera.lookAt(raw);camera.updateMatrixWorld();return {id:t.id,family:t.l.id,position:t.p,target:raw.toArray(),camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},below}},
 snow(cover){dispatchEvent(new CustomEvent('snow-test-cover',{detail:{cover}}));updateAtmosphere(0,false,0);updateForestLife(scene,camera)},
 render(){return window.c15.render()},
 advance(dt=.25){updateAtmosphere(dt,quality==='low',dt);updateForestLife(scene,camera);window.c15.tick()},
 wind(value){dispatchEvent(new CustomEvent('nature-test-wind',{detail:value}));for(let i=0;i<90;i++){updateAtmosphere(.25,quality==='low',.25);updateForestLife(scene,camera)}},
};`;
export async function open24(b,port=5360,options={}){return openWalker(b,port,{...options,append:inspection+(options.append??'')});}

// This workshop isolates a REAL production branch and material. Its explicit
// flat exposure field is synthetic, solely to test orientation without shelter.
// It is not an Angles scene, a production snow acquisition or a world screenshot.
export async function openBranch24(browser,port=5360,viewport={width:640,height:480}){
 const page=await browser.newPage({viewport}),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>window.forest17Hold=true);
 await page.route('**/src/fixtures/forest.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body+`
 import {snowUniforms as branchSnow,setSnowAppearance as branchSnowEnabled} from '/endless-earth/src/nature/snow-state.mjs';
 const branchTop=new THREE.DataTexture(new Uint8Array([64,0]),1,1,THREE.RGFormat);branchTop.needsUpdate=true;
 let branchCover=0,branchIsolated=false,branchLast=0;const branchFrames=[];
 function branchCoat(){branchSnow.earthSnowCover.value=branchCover;branchSnow.earthSnowReady.value=1;branchSnow.earthSnowTop.value=branchTop;branchSnow.earthSnowField.value.set(-1000,-1000,2000,2000);branchSnowEnabled(branchCover>0)}
 const branchBefore=scene.onBeforeRender;scene.onBeforeRender=function(...a){branchBefore.apply(this,a);branchCoat()};
 const branchAfter=scene.onAfterRender;scene.onAfterRender=function(...a){branchAfter.apply(this,a);if(branchLast){const now=performance.now();branchFrames.push({t:now,ms:now-branchLast,windTime:life.field.metrics.lastTime,wind:scene.userData.climate.wind,profile:lifeSettings.name,cover:branchCover,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});branchLast=now}};
 window.b24={
 setup(id='spreading',cover=1,below=false,level=0,profile='balanced',wind=.0,isolate=true){
  window.forest17.warm(id,'2026-01-21','clear',profile);dispatchEvent(new CustomEvent('nature-test-wind',{detail:wind}));for(let i=0;i<100;i++){sky(.25,false,.25);life.update(scene.userData.climate.date)}life.uniforms.forestSeasonBlend.value=1;
  branchCover=cover;lod.value=String(level);choice.value=id;show();walker.avatar.visible=false;ground.visible=false;const group=groups.get(id),model=models.get(id),levelGroup=group.children[level],mesh=levelGroup.children[0];for(const [kind,g]of groups)g.children.forEach((o,i)=>o.visible=kind===id&&i===level);levelGroup.children[1].visible=!isolate;
  const b=model.tree.branches.find(b=>b.order===1),g=mesh.geometry;
  if(isolate){const trunk=model.tree.branches[0],sides=level===0?10:level===1?6:4,steps=level===0?9:3,at=sides*steps*6,count=level===0?6*4*6:level===1?3*6:6;g.setDrawRange(at,count)}else g.setDrawRange(0,g.index.count);
  const raw=b.points[Math.floor(b.points.length/2)].clone(),p=g.attributes.position,form=g.attributes.forestForm.array,traits=g.attributes.natureTraits.array,h=model.tree.height;
  raw.y+=form[0]*h*THREE.MathUtils.smoothstep(raw.y,.8,h*.45)*(1-THREE.MathUtils.smoothstep(raw.y,h*.65,h));const gain=THREE.MathUtils.clamp(raw.y/3,0,1),height=THREE.MathUtils.clamp(raw.y/h,0,1),girth=THREE.MathUtils.lerp(form[1],1,THREE.MathUtils.smoothstep(raw.x*raw.x+raw.z*raw.z,.36,4));raw.x*=girth;raw.z*=girth;const turn=form[2]*height,x=raw.x;raw.x-=turn*raw.z;raw.z+=turn*x;raw.x+=(traits[1]-.5)*.7*height*height*gain;raw.z+=(traits[0]-.5)*.6*height*(1.2-height)*gain;raw.x+=group.position.x;
  const d=Math.max(1.5,b.points[0].distanceTo(b.points.at(-1))*.68),tangent=b.points.at(-1).clone().sub(b.points[0]).normalize(),up=new THREE.Vector3(0,1,0).addScaledVector(tangent,-tangent.y).normalize(),side=new THREE.Vector3().crossVectors(tangent,up).normalize();camera.fov=40;camera.position.copy(raw).addScaledVector(up,d*(below?-1:1)).addScaledVector(side,d*.3);camera.lookAt(raw);camera.updateProjectionMatrix();camera.updateMatrixWorld();controls.target.copy(raw);branchCoat();renderer.render(scene,camera);renderer.getContext().finish();return {id,cover,below,level,profile,wind,isolate,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},branchRadius:b.radius,syntheticExposure:true,climate:scene.userData.climate,render:{...renderer.info.render},memory:{...renderer.info.memory},glError:renderer.getContext().getError()};
 },
 render(){const start=performance.now();renderer.render(scene,camera);renderer.getContext().finish();return {ms:performance.now()-start,...renderer.info.render,...renderer.info.memory,glError:renderer.getContext().getError()}},
 pixels(){renderer.render(scene,camera);const gl=renderer.getContext(),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return Array.from(pixels)},
 raster(){
  const gl=renderer.getContext(),read=()=>{const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p};
  const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push({o,visible:o.visible})});const group=groups.get(choice.value),mesh=group.children[+lod.value].children[0],material=mesh.material,bg=scene.background,maskMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),saved=branchCover;
  const capture=c=>{branchCover=c;renderer.render(scene,camera);return read()};const bare=capture(0),snow=capture(1);for(const row of meshes)row.o.visible=row.o===mesh;mesh.material=maskMaterial;scene.background=new THREE.Color(0);renderer.render(scene,camera);const mask=read();let count=0,changed=0,bright=0,delta=0;
  for(let i=0;i<mask.length;i+=4)if(mask[i]>250&&mask[i+1]>250&&mask[i+2]>250){const a=(bare[i]+bare[i+1]+bare[i+2])/3,b=(snow[i]+snow[i+1]+snow[i+2])/3;count++;changed+=Number(b-a>12);bright+=Number(b>155);delta+=b-a}
  for(const row of meshes)row.o.visible=row.visible;mesh.material=material;maskMaterial.dispose();scene.background=bg;branchCover=saved;renderer.render(scene,camera);return {branchPixels:count,whitenedPixels:changed,whitenedFraction:count?changed/count:0,brightPixels:bright,meanLuminanceIncrease:count?delta/count:0,glError:gl.getError()};
 },
 native(on){if(on){branchFrames.length=0;branchLast=performance.now();clock.getDelta();window.forest17Hold=false}else{window.forest17Hold=true;branchLast=0;return branchFrames}},
 record(){window.forest17.record()},stop(){return window.forest17.stop()}
 };`});});
 await page.goto('http://localhost:'+port+'/endless-earth/fixtures/forest-life.html?perf=1');await page.waitForFunction(()=>window.b24);
 await page.addStyleTag({content:'header,.nature-controls,footer,#title,#diagnostic-date{display:none!important}'});
 const environment=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:gl.getParameter(e.UNMASKED_RENDERER_WEBGL),ua:navigator.userAgent,viewport:[innerWidth,innerHeight]}});
 return {page,errors,environment};
}
