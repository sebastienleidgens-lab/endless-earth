/** Look-ahead target only. The controller exclusively owns vehicle position. */
export function carRouteInput(points,position,heading,speed,cursor,width=4.8){
 const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
 while(cursor<points.length-1&&Math.hypot(points[cursor].x-position.x,points[cursor].z-position.z)<2.2)cursor++;
 const a=points[Math.max(0,cursor-1)],b=points[cursor],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1;
 const fraction=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(length*length)));
 let remaining=Math.max(4,Math.min(12,3+Math.abs(speed)*.55)),i=cursor,target={x:a.x+dx*fraction,z:a.z+dz*fraction};
 while(i<points.length){const q=points[i],d=Math.hypot(q.x-target.x,q.z-target.z);if(d>=remaining){target={x:target.x+(q.x-target.x)*remaining/d,z:target.z+(q.z-target.z)*remaining/d};break;}remaining-=d;target={...q};i++;}
 const centerTarget={...target};
 const ta=points[Math.max(0,Math.min(points.length-2,i-1))],tb=points[Math.min(points.length-1,i)],sx=tb.x-ta.x,sz=tb.z-ta.z,segmentLength=Math.hypot(sx,sz)||1,offset=width>=4.4?Math.min(1.4,width/4):0;target.x-=sz/segmentLength*offset;target.z+=sx/segmentLength*offset;
 const tx=target.x-position.x,tz=target.z-position.z,d=Math.max(1,Math.hypot(tx,tz)),error=angle(Math.atan2(tx,tz)-heading);
 const steering=Math.atan2(2*2.45*Math.sin(error),d),maximum=.48/(1+Math.abs(speed)*.055);
 let limit=14;
 if(cursor<points.length-1){const next=points[cursor+1],turn=Math.abs(angle(Math.atan2(next.x-b.x,next.z-b.z)-Math.atan2(dx,dz))),approach=Math.hypot(b.x-position.x,b.z-position.z);if(turn>.3&&approach<speed*speed/15+14)limit=Math.min(limit,Math.max(2,5*(1-turn/Math.PI)));}
 limit=Math.min(limit,Math.max(2,5/(Math.abs(error)+.25)));
 return {cursor,target,centerTarget,laneHeading:Math.atan2(sx,sz),forward:speed>limit?0:1,strafe:Math.max(-1,Math.min(1,-steering/maximum)),brake:speed>limit+.5,limit};
}
