import {writeFile,mkdir} from 'node:fs/promises';import {gzipSync} from 'node:zlib';import assert from 'node:assert/strict';import {launch,open18,settle18} from './lib/mission-18-browser.mjs';import {indexNativeWebM} from './lib/native-webm.mjs';
const b=await launch(),out='docs/mission-19-evidence',movies=[];await mkdir(out+'/motion',{recursive:true});
const inspection=`
window.motion19={
anchor:null,frame:0,rows:[],after:null,
forest(){let f;scene.traverse(o=>{if(o.userData.forest)f=o.userData.forest});return f},
start(kind){this.kind=kind;this.rows=[];this.startTime=performance.now();this.after=scene.onAfterRender;const f=this.forest();this.anchor=f.items.find(t=>t.visible&&t.l.height>10).p;this.position=camera.position.clone();this.quaternion=camera.quaternion.clone();this.heading=yaw;this.before=scene.onBeforeRender;scene.onBeforeRender=(...a)=>{if(this.kind==='approach'){const t=(performance.now()-this.startTime)/1000,d=150-145*Math.min(1,t/20),p=this.anchor;camera.position.set(p.x+d,p.y+2,p.z);camera.lookAt(p.x,p.y+7,p.z);camera.updateMatrixWorld();updateAtmosphere(0,quality==='low',0);scene.traverse(o=>o.userData.updateForest?.(camera,lifeSettings.name,true))}this.before.apply(scene,a)};this.afterFrame=(...a)=>{this.after.apply(scene,a);const t=(performance.now()-this.startTime)/1000;
 if(this.kind==='rotation'){yaw=this.heading+(t<5?0:t<9?(t-5)/4*Math.PI:t<14?Math.PI+(t-9)/5*Math.PI:2*Math.PI);}
 
 this.rows.push({t,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()},anchor:this.anchor,position:avatar.position.toArray(),gait:{...walkerModel.metrics},shadow:scene.userData.landscapeLighting?.character,forest:{visible:f.visible,levels:[...f.levels],pending:f.pendingTransitions,active:f.transitioning,selection:f.selectionCpuMs},audio:sound.stats().steps??0});};scene.onAfterRender=this.afterFrame;clock.getDelta();window.cHold=false;
},
end(){window.cHold=true;scene.onAfterRender=this.after;scene.onBeforeRender=this.before;return this.rows},
route(){return routeAt(avatar.position,activeTerrain)},play(route){walker.start(route)},
};`;
try{let commonRoute;
for(const [name,port]of [['before',5319],['after',5330]]){const g=await open18(b,{port,viewport:{width:640,height:420},append:inspection}),p=g.page;
for(const kind of ['rotation','approach','walker']){
 const view=kind==='walker'?['walker',-12.2773926827,-32.4163839999,0,.25,4,'third']:['forest',-430,340,1,.12,0,'first'];await p.evaluate(view=>window.c15.setup(view,'balanced'),view);await settle18(p);
 if(kind==='walker'){if(!commonRoute)commonRoute=await p.evaluate(()=>window.motion19.route());assert.ok(commonRoute?.length>40);await p.evaluate(r=>window.motion19.play(r),commonRoute);await p.locator('#walk-menu-toggle').click();await p.locator('#sound').click();await p.keyboard.press('Escape');}
 await p.evaluate(()=>window.c15.render());await p.screenshot({path:`${out}/motion/${name}-${kind}.jpg`,type:'jpeg',quality:87});await p.evaluate(kind=>{window.c15.record();window.motion19.start(kind)},kind);
 for(let i=0;i<5;i++){await p.waitForTimeout(4000);if(kind==='walker'&&i===1)await p.evaluate(()=>{const s=document.querySelector('select[aria-label="Vue du personnage"]');s.value='first';s.dispatchEvent(new Event('change'))});if(kind==='walker'&&i===2)await p.evaluate(()=>{const s=document.querySelector('select[aria-label="Vue du personnage"]');s.value='third';s.dispatchEvent(new Event('change'))});}
 const trace=await p.evaluate(()=>window.motion19.end()),bytes=Buffer.from(await p.evaluate(()=>window.c15.stop()));const path=`${out}/motion/${name}-${kind}.webm`;await writeFile(path,bytes);const media=await indexNativeWebM(path,`work/mission-19/${name}-${kind}-raw.webm`);await writeFile(`${out}/motion/${name}-${kind}.json.gz`,gzipSync(JSON.stringify(trace),{level:9}));movies.push({name,kind,media,frames:trace.length,nativeSeconds:trace.at(-1).t-trace[0].t,metres:trace.slice(1).reduce((s,r,i)=>s+Math.hypot(r.position[0]-trace[i].position[0],r.position[2]-trace[i].position[2]),0),errors:[...g.errors]});console.log('MOVIE',name,kind,trace.length);assert.deepEqual(g.errors,[]);
}
await p.close();}
await writeFile(out+'/movies.json',JSON.stringify({protocol:'Real engine MediaRecorder streams, native wall clock, no time scaling, frame reconstruction, retouching or replacement soundtrack. Rotation uses camera controls; approach is explicitly a camera inspection (player stationary), not a walk. Walker plays the same original admitted OSM route on both versions; timestamps/codec packets preserved by remux. Software frame times affect travelled distance.',movies},null,2)+'\n');}finally{await b.close()}
