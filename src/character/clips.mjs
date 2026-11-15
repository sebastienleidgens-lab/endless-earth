/** Original authored cyclic poses, metres/radians, no external animation.
 * Contact, compression, propulsion, recovery and flight are separate keys.
 * Physics owns speed and position; these clips only describe the body.
 */
const smooth=t=>t*t*(3-2*t);
const channels=['back','lift','arm','elbow','pitch','twist','roll','ankle'];
const blendChannels=[...channels,'duty'];
function frame(t,back,lift,arm,elbow,pitch,twist,roll,ankle){return [t,back,lift,arm,elbow,pitch,twist,roll,ankle];}
export const LOCOMOTION_CLIPS=Object.freeze({
  walk:{duty:.61,keys:[
    frame(0,.57,0,-.32,-.18,.025,.04,-.015,-.12),
    frame(.18,.23,0,-.12,-.26,.035,.015,0,0),
    frame(.43,-.27,0,.22,-.20,.025,-.035,.015,.05),
    frame(.61,-.57,0,.34,-.16,.015,-.04,.01,.22),
    frame(.77,-.13,.09,.02,-.30,.035,-.01,0,-.2),
    frame(.92,.44,.04,-.29,-.23,.03,.03,-.01,-.12),
    frame(1,.57,0,-.32,-.18,.025,.04,-.015,-.12)]},
  jog:{duty:.43,keys:[
    frame(0,.64,0,-.58,-.9,.09,.065,-.025,-.04),
    frame(.13,.25,0,-.22,-.98,.12,.02,-.01,0),
    frame(.30,-.30,0,.46,-.84,.10,-.06,.02,.09),
    frame(.43,-.62,.025,.62,-.78,.08,-.065,.025,.27),
    frame(.62,-.39,.21,.20,-1.04,.10,-.025,0,-.35),
    frame(.82,.39,.17,-.48,-1.02,.12,.045,-.02,-.22),
    frame(1,.64,0,-.58,-.9,.09,.065,-.025,-.04)]},
  run:{duty:.34,keys:[
    frame(0,.66,0,-.76,-1.03,.14,.09,-.032,-.02),
    frame(.12,.18,0,-.15,-1.16,.19,.02,-.012,.03),
    frame(.25,-.40,0,.62,-.93,.17,-.075,.025,.16),
    frame(.34,-.68,.025,.77,-.90,.13,-.09,.032,.34),
    frame(.52,-.53,.29,.37,-1.18,.16,-.04,.01,-.46),
    frame(.73,.24,.30,-.52,-1.20,.19,.05,-.018,-.3),
    frame(.9,.66,.11,-.80,-1.09,.16,.09,-.03,-.08),
    frame(1,.66,0,-.76,-1.03,.14,.09,-.032,-.02)]}
});
function sample(clip,q,out){
  q=((q%1)+1)%1;const keys=clip.keys;let i=1;while(i<keys.length-1&&q>keys[i][0])i++;
  const a=keys[i-1],b=keys[i],t=smooth((q-a[0])/(b[0]-a[0]));
  for(let j=0;j<channels.length;j++)out[channels[j]]=a[j+1]+(b[j+1]-a[j+1])*t;
  out.duty=clip.duty;out.phase=q;return out;
}
export function sampleLocomotion(phase,run,out={},scratch={}){
  const blend=Math.max(0,Math.min(1,run))*2;
  const a=blend<1?LOCOMOTION_CLIPS.walk:LOCOMOTION_CLIPS.jog,b=blend<1?LOCOMOTION_CLIPS.jog:LOCOMOTION_CLIPS.run;
  sample(a,phase,out);sample(b,phase,scratch);const t=Math.min(1,blend<1?blend:blend-1);
  for(const k of blendChannels)out[k]+=(scratch[k]-out[k])*t;
  out.stance=out.phase<out.duty;return out;
}
