import {launch,open19,settle18} from './mission-19-browser.mjs';export {launch,settle18};
export const inspection=`
window.m20={
 prepare(){prepareWorldSenses();},
 step(dt=.1){window.m18.step(dt);traffic.update(dt,scene.userData.climate,avatar.position,lifeSettings.name);sensitiveWorld.update(dt,scene.userData.climate,avatar.position,camera,lifeSettings.name)},
 state(){return {traffic:JSON.parse(JSON.stringify(traffic.metrics)),sensitive:scene.userData.climate.sensitive,world:{...sensitiveWorld.stats},adaptive:scene.userData.adaptiveResolution,routes:traffic.routes.map(r=>({id:r.id,length:r.length,width:r.width,tags:r.tags,start:r.points[0],end:r.points.at(-1)}))}},
 car(id){return traffic.inspect(id)},carPose(s){const v=traffic.vehicle;if(v)v.s=s},routes(){return traffic.routes},vehicle(){const v=traffic.vehicle;return v?{s:v.s,speed:v.speed,length:v.route.length}:null},
 observer(p){avatar.position.fromArray(p)},camera(p,target){camera.position.fromArray(p);camera.lookAt(...target);camera.updateMatrixWorld()},
 render(){return window.c15.render()},
 audio(){const v=traffic.vehicle,p=traffic.metrics.position;sound.vehicle(v&&p?{id:v.id,position:{x:p[0],y:p[1]+.7,z:p[2]},speed:traffic.metrics.speed,rain:scene.userData.climate.weather.rain}:null)},
 quality(scale){adaptiveResolution.scale=scale;renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)*scale);renderer.setSize(innerWidth,innerHeight)}
};`;
export async function open20(browser,options={}){const g=await open19(browser,{port:5340,...options,append:inspection+(options.append??'')});await g.page.evaluate(()=>window.m20.prepare());return g}
