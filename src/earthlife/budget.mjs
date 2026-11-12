// One allowance for the whole visible world, never one allowance per tile.
export const LIFE_PROFILES=Object.freeze({
 eco:Object.freeze({vegetation:.55,fine:0,water:.5,clouds:.7,shadows:0,birds:2,particles:4,events:1,cpuHz:5}),
 balanced:Object.freeze({vegetation:1,fine:.45,water:.8,clouds:1,shadows:.10,birds:6,particles:8,events:2,cpuHz:10}),
 quality:Object.freeze({vegetation:1,fine:1,water:1,clouds:1,shadows:.15,birds:9,particles:16,events:3,cpuHz:10})
});
export function lifeProfile(name,custom={}){const p=LIFE_PROFILES[name]??LIFE_PROFILES.balanced;return {...p,...Object.fromEntries(Object.entries(custom).filter(([k,v])=>Object.hasOwn(p,k)&&Number.isFinite(v)).map(([k,v])=>[k,Math.max(0,Math.min(k==='birds'?9:k==='particles'?16:k==='events'?3:k==='cpuHz'?10:1,v))]))};}
export class WorldLifeBudget{
 constructor(profile=lifeProfile('balanced')){this.revision=0;this.profile=profile;this.cells=new Map();this.allocated={birds:0,particles:0,events:0};}
 setProfile(profile){this.revision++;this.clear();this.profile=profile;}
 claim(cell,kind,count=1){if(!(kind in this.allocated)||count<0||!Number.isInteger(count))return false;if(this.allocated[kind]+count>this.profile[kind])return false;let c=this.cells.get(cell);if(!c){c={birds:0,particles:0,events:0};this.cells.set(cell,c)}c[kind]+=count;this.allocated[kind]+=count;return true;}
 release(cell){const c=this.cells.get(cell);if(c){for(const k of Object.keys(c))this.allocated[k]-=c[k];this.cells.delete(cell)}}
 clear(){this.cells.clear();for(const k of Object.keys(this.allocated))this.allocated[k]=0;}
}
