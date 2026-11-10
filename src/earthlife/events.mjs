export function random(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453123;return n-Math.floor(n)}
// A counter-based schedule, with gaps of 35–200 seconds; no ticking interval.
export function eventAt(time,cell,seed=9){const epoch=Math.floor(time/240),r=random(cell*31+epoch*71+seed),start=epoch*240+35+r*165,age=time-start,duration=10+random(cell+epoch+seed)*12;return {id:`${cell}:${epoch}`,active:age>=0&&age<duration,age,duration,kind:random(cell*7+epoch*19+seed)>.46?'leaves':'calm',envelope:age>=0&&age<duration?Math.sin(Math.PI*age/duration)**2:0};}
export function eligibleLeaves(month,latitude,habitat){const autumn=latitude>=0?month>=9&&month<=11:month>=3&&month<=5;return autumn&&['wood','forest','riparian'].includes(habitat)}
