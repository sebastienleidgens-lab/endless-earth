import {gzipSync} from 'node:zlib';import {mkdir,writeFile} from 'node:fs/promises';
import {launch,open18,settle18} from './lib/mission-18-browser.mjs';
const out='docs/mission-19-evidence';await mkdir(out,{recursive:true});
const browser=await launch();
try{
const g=await open18(browser,{port:5319,viewport:{width:640,height:420},append:`
import {lightingUniforms as u19} from '/endless-earth/src/lighting/state.mjs';
window.a19={forest(){let rows=[];scene.traverse(o=>{if(o.userData.forest)rows=o.userData.forest.items.map((t,i)=>({i,anchor:[t.p.x,t.p.z],family:t.l.id,lod:t.lod,desired:t.desired,next:t.next,visible:t.visible,distance:t.cameraDistance,pixels:t.pixels,radius:t.radius}))});return rows},
rotate(a){const p=avatar.position.clone().add(new THREE.Vector3(0,1.65,0));camera.position.copy(p);camera.lookAt(p.x-Math.sin(1+a*Math.PI/180),p.y,p.z-Math.cos(1+a*Math.PI/180));camera.updateMatrixWorld();window.c15.tick()},
noSelf(){this.saved=scene.onBeforeRender;scene.onBeforeRender=()=>{};u19.m18WalkerActive.value=0;window.c15.render();return this.pixels()},
pose(step){avatar.position.x+=step;walkerModel.update(Math.abs(step),1/60,walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z)));},
shadow(mode){u19.m18WalkerActive.value=mode===0?0:1;},
pixels(){window.c15.render();const gl=renderer.getContext(),a=new Uint8Array(innerWidth*innerHeight*4);gl.readPixels(0,0,innerWidth,innerHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return Array.from(a)},
};`});const p=g.page,rotations=[];
await p.evaluate(()=>window.c15.setup(['forest',-430,340,1,.12,0,'first'],'balanced'));await settle18(p);
for(const angle of [0,45,90,180,360]){await p.evaluate(a=>window.a19.rotate(a),angle);rotations.push({angle,forest:await p.evaluate(()=>window.a19.forest()),render:await p.evaluate(()=>window.c15.render())});await p.screenshot({path:out+'/before-rotation-'+angle+'.jpg',type:'jpeg',quality:84});}
await p.evaluate(()=>window.c15.setup(['walker',-55,70,.85,.22,4,'third'],'quality'));await settle18(p);
const shadow=[];for(let i=0;i<14;i++){await p.evaluate(()=>window.a19.pose(.025));const r=await p.evaluate(()=>window.c15.render());shadow.push({frame:i,render:r,state:await p.evaluate(()=>window.c15.snapshot())});if(i===0||i===13)await p.screenshot({path:out+'/before-walker-'+i+'.jpg',type:'jpeg',quality:90})}
const ablations=[];await p.evaluate(()=>window.c15.render());const original=await p.evaluate(()=>window.a19.pixels());const hook=await p.evaluate(()=>window.a19.noSelf());const diff=original.reduce((s,v,i)=>s+Math.abs(v-hook[i]),0)/original.length;ablations.push({mode:'same frozen pose, only walker depth map reception disabled',meanPixelDifference:diff});await p.screenshot({path:out+'/before-walker-without-self-map.jpg',type:'jpeg',quality:90});
await writeFile(out+'/initial-audit.json.gz',gzipSync(JSON.stringify({baseline:'2866c86',environment:g.environment,rotations,shadow,ablations,errors:g.errors,warnings:g.warnings}),{level:9}));console.log('AUDIT',g.errors,rotations.map(r=>[r.angle,r.forest.filter(t=>t.visible).length]),'walker updates',shadow.map(r=>r.state.lighting.character.updates),'ablation diff',diff);
}finally{await browser.close()}
