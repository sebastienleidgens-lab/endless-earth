// Only structural decisions change programs. Continuous amplitudes stay uniforms.
// Per material: shadow 2 states; foliage <= 6 combinations; water <= 6.
const live=new Map();
let profile={vegetation:1,fine:.45,water:.8,clouds:1,shadows:.1};
function modes(role){return {LIFE_SHADOWS:Number(profile.shadows>0&&profile.clouds>0),...(role?.foliage?{LIFE_WIND_MODE:!profile.vegetation||((role.stationary||role.trunk)&&!profile.fine)?0:!role.stationary&&profile.fine?2:1}:{}),...(role?.water?{LIFE_WATER_MODE:profile.water<=0?0:profile.water<=.5?1:2}:{})}}
function refresh(material,role){const next=modes(role);let changed=false;material.defines??={};for(const [k,v] of Object.entries(next))if(material.defines[k]!==v){material.defines[k]=v;changed=true}if(changed)material.needsUpdate=true;}
export function registerLifeMaterial(material,role={}){const old=live.get(material);if(old){Object.assign(old,role);refresh(material,old);return}live.set(material,{...role});material.addEventListener('dispose',()=>live.delete(material));refresh(material,role);}
export function setLifeCapabilities(next){profile=next;for(const [m,role] of live)refresh(m,role)}
export function capabilityStats(){return {materials:live.size}}
