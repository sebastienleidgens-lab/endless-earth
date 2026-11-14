import {launch,open22} from './mission-22-browser.mjs';
export {launch};
export const out='docs/mission-22-1-evidence';
export const inspection=`
window.m221={
 height(x,z){return walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(x,z)},
 support(x,z){const g=activeTerrain.grid,h=this.height(x,z);return {x,z,physical:h,terrain:activeTerrain.relativeHeight(x,z),clear:canWalk(x,z),cell:[Math.floor((x-g.origin_x_m)/g.step_m),Math.floor((z-g.origin_z_m)/g.step_m)],provenance:activeTerrain.relief,collision:inspect221Collision(x,z),last:lastMovementDiagnostic()}},
 pose(position,target){camera.position.fromArray(position);camera.lookAt(...target);camera.updateMatrixWorld();window.c15.tick()},
 light(){return {sun:sun.intensity,hemisphere:hemisphere.intensity,sky:hemisphere.color.toArray(),ground:hemisphere.groundColor.toArray(),moon:scene.userData.climate.moon}},
 diagnostics(){return {terrain:activeTerrain.metrics,manifest:activeTerrain.singleSurface.manifest.walkCorrection,life:window.m22.state(),light:this.light()}},
};`;
export async function open221(b,options={}){const game=await open22(b,{port:Number(process.env.M221_PORT??5363),...options,append:`import {inspectCollision as inspect221Collision} from '/endless-earth/src/world/collisions.ts';`+inspection+(options.append??'')});await game.page.waitForFunction(()=>window.endlessDiagnostics?.villageLife?.ready);return game;}
export const stations=[
 ['pont-entree',-165,125,2.57,.12,5,'third'],
 ['pont-tablier',-184,160,2.57,.06,5,'third'],
 ['pont-sortie',-201,183,-.57,.1,5,'third'],
 ['rue',-55,70,.85,-.05,0,'first'],
 ['foret',-426.723088216,346.512916,.785,.12,5,'third'],
 ['rive',-307.7,94.3,-1.515,-.05,5,'third'],
 ['pente',-520,440,.65,-.12,5,'third'],
 ['vallee',-100,155,.5,.5,210,'aerial']
];
