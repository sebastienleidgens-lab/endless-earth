/** Look-ahead target only. The controller exclusively owns vehicle position. */
export function carRouteInput(points,position,heading,speed,cursor,width=4.8,lane=1){
 const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
 while(cursor<points.length-1){const a=points[Math.max(0,cursor-1)],b=points[cursor],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,projection=l2?((position.x-a.x)*dx+(position.z-a.z)*dz)/l2:1;const passed=projection>=1&&Math.abs((position.x-b.x)*dz-(position.z-b.z)*dx)/Math.sqrt(l2||1)<Math.max(2,width/2);if(Math.hypot(b.x-position.x,b.z-position.z)>=2.2&&!passed)break;cursor++;}
 // Progress follows the closest forward source segment, not a tiny vertex
 // capsule: a physically valid rounded turn need not hit its exact OSM node.
 // Bound forward arc from the actual projection to segment STARTS: charging
 // the next edge in full hides a valid long road just beyond a short connector.
 const firstA=points[Math.max(0,cursor-1)],firstB=points[cursor],firstX=firstB.x-firstA.x,firstZ=firstB.z-firstA.z,firstLength=Math.hypot(firstX,firstZ),advanced=firstLength?Math.max(0,Math.min(firstLength,((position.x-firstA.x)*firstX+(position.z-firstA.z)*firstZ)/firstLength)):0;
 let bestIndex=cursor,bestScore=Infinity,arc=-advanced,previousLength=0;
 for(let j=cursor;j<Math.min(points.length,cursor+9);j++){
  const a=points[j-1]??points[0],b=points[j],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  if(!l2)continue;const length=Math.sqrt(l2);arc+=previousLength;if(arc>35)break;previousLength=length;
  const t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/l2)),d=Math.hypot(position.x-a.x-t*dx,position.z-a.z-t*dz),alignment=Math.abs(angle(Math.atan2(dx,dz)-heading));
  const score=d+.08*(j-cursor);if(alignment<1.5&&d<Math.max(3,width/2)&&score<bestScore){bestScore=score;bestIndex=j;}
 }
 cursor=bestIndex;
 const a=points[Math.max(0,cursor-1)],b=points[cursor],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1;
 const fraction=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(length*length)));
 let remaining=Math.max(6,Math.min(16,5+Math.abs(speed)*.6)),i=cursor,target={x:a.x+dx*fraction,z:a.z+dz*fraction};
 while(i<points.length){const q=points[i],d=Math.hypot(q.x-target.x,q.z-target.z);if(d>=remaining){target={x:target.x+(q.x-target.x)*remaining/d,z:target.z+(q.z-target.z)*remaining/d};break;}remaining-=d;target={...q};i++;}
 const centerTarget={...target};
 const ta=points[Math.max(0,Math.min(points.length-2,i-1))],tb=points[Math.min(points.length-1,i)],sx=tb.x-ta.x,sz=tb.z-ta.z,segmentLength=Math.hypot(sx,sz)||1,offset=width>=4.4&&Math.abs(angle(Math.atan2(dx,dz)-heading))<.25&&!(cursor<points.length-1&&Math.abs(angle(Math.atan2(points[cursor+1].x-b.x,points[cursor+1].z-b.z)-Math.atan2(dx,dz)))>.3&&Math.hypot(b.x-position.x,b.z-position.z)<25)&&!(cursor>1&&Math.abs(angle(Math.atan2(dx,dz)-Math.atan2(a.x-points[cursor-2].x,a.z-points[cursor-2].z)))>.3&&Math.hypot(a.x-position.x,a.z-position.z)<15)?Math.min(1.2,Math.max(0,width/2-1.35)):0;target.x-=sz/segmentLength*offset*lane;target.z+=sx/segmentLength*offset*lane;
 const tx=target.x-position.x,tz=target.z-position.z,d=Math.max(1,Math.hypot(tx,tz)),error=angle(Math.atan2(tx,tz)-heading);
 const steering=Math.atan2(2*2.45*Math.sin(error),d),maximum=.48/(1+Math.abs(speed)*.055);
 let limit=14;
 if(cursor<points.length-1){const next=points[cursor+1],turn=Math.abs(angle(Math.atan2(next.x-b.x,next.z-b.z)-Math.atan2(dx,dz))),approach=Math.hypot(b.x-position.x,b.z-position.z);if(turn>.3&&approach<speed*speed/15+25)limit=Math.min(limit,turn>.75?1.5:2.5);}
 limit=Math.min(limit,Math.max(1.5,3/(Math.abs(error)+.25)));
 return {cursor,target,centerTarget,lane,laneHeading:Math.atan2(sx,sz),forward:speed>limit?0:1,strafe:Math.max(-1,Math.min(1,-steering/maximum)),brake:speed>limit+.15,limit};
}
