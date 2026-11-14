const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export function socialPose(person,speed,time,phase,state='walk',activity='observe',stateTime=0,duration=60){
 const moving=Math.max(0,Math.min(1,speed/1.15)),idle=1-moving;
 const seated=['sit','picnic'].includes(activity)&&state==='activity';
 const seat=seated?Math.min(smooth(stateTime/3.5),smooth((duration-stateTime)/3.5)):0;
 return {moving,seat,bob:Math.cos(phase*2)*.009*moving,
  sway:Math.sin(phase)*.018*moving+Math.sin(time*.67+person.phase)*.008*idle,
  headTurn:Math.sin(time*.31+person.phase)*.055*idle,
  breath:Math.sin(time*1.7+person.phase)*.003*idle,
  gesture:(activity==='conversation'?Math.sin(time*1.1+person.phase)*.09:Math.sin(time*.63+person.phase)*.025)*idle,
  packing:seated&&(stateTime<4||duration-stateTime<5)?1:0};
}
