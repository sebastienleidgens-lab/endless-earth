const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function measureLine(points){const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));return {points,distances,length:distances.at(-1)};}
export function linePosition(line,distance){const d=clamp(distance,0,line.length);let i=1;while(i<line.distances.length-1&&line.distances[i]<d)i++;const a=line.points[i-1],b=line.points[i],t=(d-line.distances[i-1])/(line.distances[i]-line.distances[i-1]||1);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:Math.atan2(b.x-a.x,-(b.y-a.y)),distance:d};}
/** A train accelerates along admitted source nodes and brakes at the end of
 * the checked corridor. Missing junctions/crossing protection never teleport it. */
export class RailMotion {
 constructor(points){this.line=measureLine(points);this.distance=0;this.speed=0;this.stopped=false;this.reason='';}
 update(dt,limit=22.2){const h=Math.max(0,Math.min(.25,dt)),remaining=this.line.length-this.distance,clearance=12,brakeDistance=this.speed*this.speed/(2*.8)+clearance+2,target=remaining<brakeDistance?Math.sqrt(Math.max(0,2*.8*(remaining-clearance))):limit;this.speed+=clamp(target-this.speed,-.8*h,.45*h);const next=Math.min(this.line.length-clearance,this.distance+Math.max(0,this.speed)*h);this.distance=Math.max(0,next);if(remaining<clearance+.5&&this.speed<.1){this.speed=0;this.stopped=true;this.reason='end-of-verified-rail-corridor';}return linePosition(this.line,this.distance);}
}
/** Synthetic closed airport circuit. The only grounded leg follows the
 * imported runway. It is scenery, not flight planning or real movements. */
export function airportCircuit(time,start,end,groundHeight){const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy);if(length<250)return null;const ux=dx/length,uy=dy/length,nx=-uy,ny=ux,t=Math.max(0,time),run=Math.min(900,length*.65);let along=0,across=0,height=groundHeight,phase='parked',pitch=0;
 if(t<65){const u=t/65;along=run*u*u;phase='takeoff';height+=Math.max(0,u-.72)*90;pitch=Math.max(0,u-.6)*.22;}
 else if(t<480){const u=(t-65)/415,second=u>=.5,v=second?(u-.5)*2:u*2,w=1-v,points=second?[[run/2,3000],[run/2-3000,3000],[-3000,0],[0,0]]:[[run,0],[run+3000,0],[run/2+3000,3000],[run/2,3000]],weights=[w*w*w,3*w*w*v,3*w*v*v,v*v*v];along=points.reduce((sum,p,i)=>sum+p[0]*weights[i],0);across=points.reduce((sum,p,i)=>sum+p[1]*weights[i],0);height=groundHeight+Math.sin(u*Math.PI)*230+25.2*(1-u);phase=u<.22?'climb':u>.72?'approach':'cruise';pitch=u<.22?.06:u>.72?-.06:0;}
 else if(t<545){const u=(t-480)/65;along=run*(2*u-u*u);phase='landing';}
 else{along=run;phase='parked';}
 return {x:start.x+ux*along+nx*across,y:start.y+uy*along+ny*across,height,phase,pitch,synthetic:true};}
