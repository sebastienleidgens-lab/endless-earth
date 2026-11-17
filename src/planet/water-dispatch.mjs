/** One activity-facing provider. Delegate by canonical position; no pilot/departure teleport. */
export function combineWater(pilot,department,current){
 const owner=(x,z)=>Math.abs(x)<=1000&&Math.abs(z)<=1000?pilot:department();
 const delegate=name=>(x,z,...rest)=>owner(x,z)?.[name]?.(x,z,...rest)??null;
 return {at:owner,contains:delegate('contains'),sample:delegate('sample'),routeToExit:delegate('routeToExit'),routeToBank:delegate('routeToBank'),returnRouteVerified:delegate('returnRouteVerified'),exitWalkable:delegate('exitWalkable'),nearby:(p,max)=>owner(p.x,p.z)?.nearby(p,max),get accesses(){return [...pilot.accesses,...department()?.accesses??[]]},get metrics(){return {pilot:pilot.metrics,department:department()?.metrics??null}},network:{get metrics(){const p=current();return owner(p.x,p.z)?.network?.metrics??{ready:false}},follow:(p,...args)=>owner(p.x,p.z)?.network.follow(p,...args),snapshot(){const p=current();return owner(p.x,p.z)?.network.snapshot()},attach:(p,...args)=>owner(p.x,p.z)?.network.attach(p,...args)},dispose(){pilot.dispose()}};
}
