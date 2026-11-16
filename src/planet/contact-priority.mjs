/** Prioritize displayed contact needed by the actor or an explicit prepare /
 * restore target. This changes scheduling only, never geographic admission. */
export function contactPriority(bounds,focus,goal){
 const contains=p=>p&&p.x>=bounds[0]-1&&p.x<=bounds[2]+1&&p.z>=bounds[1]-1&&p.z<=bounds[3]+1;
 if(goal&&[goal,...(goal.extra??[])].some(contains))return -2;
 return contains(focus)?-1:20;
}
export function bankLandSupport(admission,terrain){
 const support=admission?.ok?(Number.isFinite(admission.height)?admission:null):terrain;
 return support?{...support,category:'terrain',walkable:!!admission?.ok}:null;
}
