import {readFile} from 'node:fs/promises';
import {launch,open24,settle} from './mission-24-browser.mjs';
export {launch,settle};
const source=await readFile('scripts/validate-mission-25-runtime.mjs','utf8');
const previous=source.split('append:`')[1].split('`});')[0];
export async function open251(browser,port=5360,options={}){
  return open24(browser,port,{...options,append:previous+`
    window.p251={
      sky(){setViewMode('first');pitch=-.6;},
      begin(){window.c15.native(true);const after=scene.onAfterRender;scene.onAfterRender=(...args)=>{after.apply(scene,args);const f=window.cFrames.at(-1);if(f)Object.assign(f,window.p251.sense());};window.c15.record();},
      sense(){const s=sound.stats();return {wind:{...scene.userData.climate.wind},birds:structuredClone(scene.userData.birdMetrics),habitat:scene.userData.earthLife?.habitat,audio:{voices:s.voices,hrtf:s.hrtf,activeSources:s.activeSources,recentEvents:structuredClone(s.recentEvents),layers:s.layers,waterContacts:s.waterContacts},water:{depth:aquatic.last?.depth,hands:walkerModel.waterContacts?.map(h=>({side:h.side,position:h.position.toArray()})),events:typeof waterContacts==='undefined'?[]:structuredClone(waterContacts.events),rings:{...waterMarks.metrics}}};},
      attachment(site){const n=scene.userData.aquaticProvider.network.attach(site.water);return n?{x:n.x,z:n.z,component:n.component}:null;},
      network(){prepareWorldSenses();const p=scene.userData.aquaticProvider;return {metrics:p.network.metrics,nodes:p.network.snapshot(),accesses:p.accesses.filter(a=>boat.site(a.dry,p,playerWaterClear))};},
      state(){return {...window.p25.state(),reason:boat.reason,speed:boat.speed,yawRate:boat.yawRate,network:scene.userData.aquaticProvider.network.metrics,wind:{...scene.userData.climate.wind},stream:scene.userData.decorationStream?.metrics,render:{...renderer.info.render},memory:{...renderer.info.memory},audio:sound.stats(),time:scene.userData.climate.elapsedSeconds};},
      height(x,z){return walkingHeight((a,b)=>activeTerrain.relativeHeight(a,b))(x,z)},
      clear(x,z){return playerWaterClear(x,z)},
      restore(){activity.reset();boat.reset();aquatic.provider=null;groundActions.sit=0;groundActions.flight=null;camp.clear();},
      profile(p){setLifeProfile(p)},
      sources(){return scene.userData.lifeSoundSources},
      route(points){let cursor=0;const normal=input.getVector.bind(input);window.p251.driver={cursor,done:false};input.getVector=()=>{
        const d=window.p251.driver;if(!d)return normal();
        while(cursor<points.length-1&&Math.hypot(points[cursor].x-avatar.position.x,points[cursor].z-avatar.position.z)<1.3)cursor++;
        const q=points[cursor],distance=Math.hypot(q.x-avatar.position.x,q.z-avatar.position.z);
        d.cursor=cursor;d.remaining=distance;d.done=cursor===points.length-1&&distance<1.5;
        if(d.done)return {forward:0,strafe:0};
        const target=Math.atan2(q.x-avatar.position.x,q.z-avatar.position.z),angle=Math.atan2(Math.sin(target-boat.heading),Math.cos(target-boat.heading));
        return {forward:Math.abs(angle)<.65?1:0,strafe:Math.max(-1,Math.min(1,angle*1.6-boat.yawRate*.9))};
      };},
      stopDriver(){window.p251.driver=null;},
    };`+(options.append??'')});
}
