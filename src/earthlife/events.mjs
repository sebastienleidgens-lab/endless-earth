export function random(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453123;return n-Math.floor(n)}
// A counter-based schedule, with gaps of 35–200 seconds; no ticking interval.
export function eventAt(time,cell,seed=9,out={}){const epoch=Math.floor(time/240);if(out.epoch!==epoch||out.cell!==cell||out.seed!==seed){out.epoch=epoch;out.cell=cell;out.seed=seed;out.id=`${cell}:${epoch}`;out.start=epoch*240+35+random(cell*31+epoch*71+seed)*165;out.duration=10+random(cell+epoch+seed)*12;out.kind=random(cell*7+epoch*19+seed)>.46?'leaves':'calm'}out.age=time-out.start;out.active=out.age>=0&&out.age<out.duration;out.envelope=out.active?Math.sin(Math.PI*out.age/out.duration)**2:0;return out;}
const LEAF_HABITATS=new Set(['wood','forest','riparian']);
export function eligibleLeaves(month,latitude,habitat){const autumn=latitude>=0?month>=9&&month<=11:month>=3&&month<=5;return autumn&&LEAF_HABITATS.has(habitat)}
