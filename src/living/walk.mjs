// Local metres only; geographic source coordinates remain in the GeoJSON.
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function allowed(tags){
  return ['footway','path','pedestrian','residential','living_street','service','unclassified','track'].includes(tags.highway)
    && !['no','private','use_sidepath'].includes(tags.foot??tags.access)
    && !tags.construction && (!tags.bridge||tags.bridge==='no') && (!tags.tunnel||tags.tunnel==='no') && (!tags.ford||tags.ford==='no')
    && !tags['access:conditional'] && !tags['foot:conditional'];
}
export function clearSegment(a,b,valid){
  const n=Math.max(1,Math.ceil(distance(a,b)/.25));
  for(let i=0;i<=n;i++)if(!valid({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n}))return false;
  return true;
}
export function planRoute(lines,position,valid){
  let best=null;
  for(const line of lines)for(let i=1;i<line.points.length;i++){
    const a=line.points[i-1],b=line.points[i],dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
    if(!den)continue;
    const t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/den));
    const p={x:a.x+dx*t,z:a.z+dz*t};
    if(distance(position,p)>.8||!clearSegment(position,p,valid))continue;
    for(const tail of [line.points.slice(i),line.points.slice(0,i).reverse()]){
      const points=[position,p];let length=0;
      for(const q of tail){if(!clearSegment(points.at(-1),q,valid))break;length+=distance(points.at(-1),q);points.push(q);}
      if(length>3&&(!best||length>best.length))best={points,length,surface:line.surface,name:line.name};
    }
  }
  return best;
}
export class AutoWalk {
  active=false; speed=0; index=1; message='Prêt · rejoindre une voie OSM'; route=null;
  start(route){this.route=route;this.index=1;this.speed=0;this.remaining=route?route.points.map(()=>0):[];if(route)for(let i=route.points.length-2;i>=0;i--)this.remaining[i]=this.remaining[i+1]+distance(route.points[i],route.points[i+1]);this.active=!!route;this.message=route?`${route.name} · ${Math.round(route.length)} m validés`:'Aucun trajet sûr ici · rejoignez une voie OSM';}
  stop(message='Promenade interrompue'){this.active=false;this.speed=0;this.message=message;}
  update(position,dt,valid){
    if(!this.active)return {x:0,z:0};
    while(this.index<this.route.points.length&&distance(position,this.route.points[this.index])<.000001)this.index++;
    if(this.index>=this.route.points.length){this.stop('Fin du parcours OSM validé');return {x:0,z:0};}
    const target=this.route.points[this.index],d=distance(position,target);
    const remaining=d+this.remaining[this.index];
    let limit=1.35;
    const after=this.route.points[this.index+1];
    if(after&&d<3){const ax=target.x-position.x,az=target.z-position.z,bx=after.x-target.x,bz=after.z-target.z;const cosine=(ax*bx+az*bz)/(d*distance(target,after)||1);limit=.45+.9*Math.max(0,cosine);limit+=(1.35-limit)*Math.min(1,d/3);}
    this.speed=Math.min(this.speed+dt*.7,limit,Math.sqrt(1.4*remaining));
    const step=Math.min(d,this.speed*dt),next={x:position.x+(target.x-position.x)/d*step,z:position.z+(target.z-position.z)/d*step};
    if(!clearSegment(position,next,valid)){this.stop('Chemin bloqué · promenade arrêtée');return {x:0,z:0};}
    return {x:next.x-position.x,z:next.z-position.z};
  }
}
export function windAt(t){return .45+.18*Math.sin(t*.21)+.1*Math.sin(t*.63);}
export function surfaceKind(surface){return ['grass','grass_paver'].includes(surface)?'herbe':['ground','earth','dirt','mud'].includes(surface)?'terre':['gravel','fine_gravel','pebblestone'].includes(surface)?'gravier':'route';}
