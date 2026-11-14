import {proximityIndex} from '../audio/context.mjs';
import {roadWidth} from '../world/road-style.mjs';
import {circleHitsPolygon} from '../controls/walking.mjs';
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
export const CAMP_RULES=Object.freeze({maxSlope:.14,bankMargin:10,treeMargin:2.4,roadMargin:2.2,siteRadius:3.1});
export function localPoint(origin,heading,x,z){const c=Math.cos(heading),s=Math.sin(heading);return {x:origin.x+c*x+s*z,z:origin.z-s*x+c*z};}
/** One read-only access adapter for player interactions. Providers own geography. */
export function createPlayerWorld({support,clear,collision,roads=[],banks=[],trees=[],restricted=[]}){
 const roadIndex=proximityIndex(roads.map(r=>Object.assign([...r.points],{width:roadWidth(r.tags??{}).metres,tags:r.tags}))),bankIndex=proximityIndex(banks),treeIndex=proximityIndex(trees.map(p=>[p,p]));
 function query(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))return {ok:false,reason:'unknown-support'};
  const s=support(x,z),hit=collision?.(x,z);
  if(!s||!Number.isFinite(s.height)||!s.visible)return {ok:false,reason:'unknown-support'};
  const restriction=hit?.obstacle??s.restriction;
  if(s.category==='water'||restriction==='mapped-water'||restriction==='rendered-water')return {...s,ok:false,reason:'water'};
  if(restriction||!clear(x,z)||!s.walkable)return {...s,ok:false,reason:restriction??'obstacle'};
  if(restricted.some(r=>circleHitsPolygon(x,z,r,.3)))return {...s,ok:false,reason:'restricted'};
  return {...s,ok:true,reason:null};
 }
 function footprint(contact,climate){
  if(!finite(contact?.position)||!Number.isFinite(contact.heading)||![-1,1].includes(contact.side)||!contact.confirmed)return {ok:false,reason:'no-contact'};
  const p=contact.position,s=query(p.x,p.z);if(!s.ok||!['terrain','road'].includes(s.category))return {ok:false,reason:s.reason??'support-owner'};
  if(s.slope>.6||Math.abs(s.height-p.y)>.055)return {ok:false,reason:'sole-support'};
  const snow=climate?.groundSnowAt?.({x:p.x,y:s.height,z:p.z,normalY:s.normal?.y??1});
  if(!snow||snow.cover<.58||!Number.isFinite(snow.depthM)||snow.depthM<.006)return {ok:false,reason:'thin-or-bare-snow'};
  // Project a small grid onto the actual visible support. Reject discontinuities
  // and boundaries instead of allowing a decal to float over a hole or water.
  const points=[];for(let j=0;j<5;j++)for(let i=0;i<3;i++){
   const q=localPoint(p,contact.heading,(i-1)*.076,(j-2)*.083),ground=query(q.x,q.z);
   if(!ground.ok||ground.category!==s.category||Math.abs(ground.height-s.height)>.16)return {ok:false,reason:'support-boundary'};
   const coat=climate.groundSnowAt({x:q.x,y:ground.height,z:q.z,normalY:ground.normal?.y??1});if(coat.cover<.48)return {ok:false,reason:'snow-boundary'};
   points.push({x:q.x,y:ground.height,z:q.z});
  }
  return {ok:true,points,support:s,snow,depth:Math.min(.014,snow.depthM*.32)*(contact.run>.5?1.15:1),contrast:snow.temperature>0?.18:.27};
 }
 function camp(origin,heading){
  if(!finite(origin)||!Number.isFinite(heading))return {ok:false,reason:'unknown-support'};
  const center=query(origin.x,origin.z);if(!center.ok)return {ok:false,reason:center.reason};
  const layout={origin:{x:origin.x,y:center.height,z:origin.z},heading,tent:localPoint(origin,heading,-1.8,.15),fire:localPoint(origin,heading,.85,1.25),bag:localPoint(origin,heading,-.6,-.6)};
  const checks=[];for(let z=-2;z<=2.01;z+=.5)for(let x=-2.8;x<=1.71;x+=.5)checks.push(localPoint(origin,heading,x,z));
  for(const p of checks){const s=query(p.x,p.z);if(!s.ok)return {ok:false,reason:s.reason};if(s.category!=='terrain')return {ok:false,reason:'road'};if(s.slope>CAMP_RULES.maxSlope||Math.abs(s.height-center.height)>.35)return {ok:false,reason:'slope'};
   const r=roadIndex.query(p,15);if(r.distance<(r.width??0)/2+CAMP_RULES.roadMargin)return {ok:false,reason:'road'};
   if(bankIndex.query(p,CAMP_RULES.bankMargin).point)return {ok:false,reason:'bank'};
   if(treeIndex.query(p,CAMP_RULES.treeMargin).point)return {ok:false,reason:'tree'};
  }
  for(const key of ['tent','fire','bag']){const p=layout[key],s=query(p.x,p.z);if(!s.ok)return {ok:false,reason:s.reason};p.y=s.height;p.normal=s.normal;}
  // Anchor each tent peg, rather than putting all legs on one inferred plane.
  layout.pegs=[];for(const [x,z]of [[-.85,-1.05],[.85,-1.05],[-.85,1.05],[.85,1.05]]){const p=localPoint(layout.tent,heading,x,z),s=query(p.x,p.z);if(!s.ok||s.category!=='terrain'||s.slope>CAMP_RULES.maxSlope||Math.abs(s.height-center.height)>.35)return {ok:false,reason:s.reason??'slope'};layout.pegs.push({...p,y:s.height,normal:s.normal});}
  return {ok:true,layout,support:center};
 }
 return {query,footprint,camp,rules:CAMP_RULES};
}
