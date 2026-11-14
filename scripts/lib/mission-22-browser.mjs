import {launch,open21} from './mission-21-browser.mjs';export {launch};
export const inspection=`
window.m22={
 director:villageLife.director,renderer:villageLife.renderer,
 state(){return {life:JSON.parse(JSON.stringify(villageLife.metrics)),groups:villageLife.director.groups.map(g=>({id:g.id,kind:g.kind,state:g.state,age:g.age,progress:g.progress,length:g.route.length,activity:g.activity,returning:g.returning,members:g.members.map(m=>({id:m.person.id,age:m.person.age,outfit:m.outfit,s:m.s,position:m.position,speed:m.speed,phase:m.phase,blocked:m.blocked})),animal:g.animal})),events:[...villageLife.director.events],render:window.c15.snapshot(),audio:sound.stats()}},
 step(dt=.1){villageLife.update(dt,scene.userData.climate,avatar.position,lifeSettings.name,traffic.metrics.position?{position:{x:traffic.metrics.position[0],y:traffic.metrics.position[1],z:traffic.metrics.position[2]}}:null);traffic.update(dt,scene.userData.climate,avatar.position,lifeSettings.name,villageLife.director.groups.flatMap(g=>g.members.map(m=>m.position)));sound.village(villageLife.drainAudio())},
 reset(){villageLife.director.groups.length=0;villageLife.director.events.length=0;villageLife.director.nextAttempt=Infinity},
 inspect(kind='family'){const d=villageLife.director,graph=d.graph;for(let n=0;n<graph.nodes.length;n++){const p=graph.nodes[n].point;if(Math.hypot(p.x-avatar.position.x,p.z-avatar.position.z)>160)continue;const g=d.create({hour:12,month:5,weekday:6,temperatureC:18},{kind,origin:n,inspection:true,min:80,max:350});if(g){this.step(.01);return g.id}}return null},
 follow(id){const g=villageLife.director.groups.find(g=>g.id===id);if(!g)return;const p=g.members[0].position;avatar.position.set(p.x-5,p.y,p.z-5);camera.position.set(p.x+6,p.y+3.8,p.z+6);camera.lookAt(p.x,p.y+1,p.z);camera.updateMatrixWorld()},
 draw(id){const groups=id?villageLife.director.groups.filter(g=>g.id===id):villageLife.director.groups;villageLife.renderer.draw(groups,villageLife.director.clock,walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z)));window.c15.render()},
 pose(id){const g=villageLife.director.groups.find(g=>g.id===id);return g?.members[0].position},
 enable(on){villageLife.renderer.batch.visible=on},
 graph(){return villageLife.director.graph},
};`;
export async function open22(browser,options={}){return open21(browser,{port:Number(process.env.MISSION22_PORT??5352),...options,append:inspection+(options.append??'')})}
