const RAD=Math.PI/180,EARTH=6378137,E=.0818191910428158,N=.725607765053267,C=11754255.426096,XS=700000,YS=12655612.049876;
const finite=(...v)=>v.every(Number.isFinite);
export function validateGeo(p){if(!p||!finite(p.lat,p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)throw Error('Invalid WGS84 position');return p;}
/** EPSG:2154, GRS80, IGN published Lambert-93 constants. Height is NOT converted. */
export function lambert93(p){validateGeo(p);const phi=p.lat*RAD,s=E*Math.sin(phi),iso=Math.log(Math.tan(Math.PI/4+phi/2))-.5*E*Math.log((1+s)/(1-s)),r=C*Math.exp(-N*iso),theta=N*(p.lon-3)*RAD;return {x:XS+r*Math.sin(theta),y:YS-r*Math.cos(theta)};}
export function inverseLambert93(p){if(!p||!finite(p.x,p.y))throw Error('Invalid projected position');const r=Math.hypot(p.x-XS,YS-p.y),iso=-Math.log(r/C)/N,lon=3+Math.atan2(p.x-XS,YS-p.y)/N/RAD;let lat=2*Math.atan(Math.exp(iso))-Math.PI/2;for(let i=0;i<10;i++){const s=E*Math.sin(lat);lat=2*Math.atan(Math.exp(iso)*((1+s)/(1-s))**(E/2))-Math.PI/2;}return {lon,lat:lat/RAD};}
export function createProjection(config){
 if(config?.type==='lambert93')return {code:'EPSG:2154',project:lambert93,unproject:inverseLambert93};
 if(config?.type==='local-tangent'){
  const o=validateGeo(config.origin),cos=Math.cos(o.lat*RAD);if(Math.abs(cos)<.01)throw Error('Local tangent projection excludes polar singularity');
  return {code:'local-tangent',project(p){validateGeo(p);if(Math.abs(p.lat-o.lat)>2||Math.abs(p.lon-o.lon)>2)throw Error('Outside the declared local projection range');return {x:(p.lon-o.lon)*RAD*EARTH*cos,y:(p.lat-o.lat)*RAD*EARTH};},unproject(p){if(!finite(p.x,p.y))throw Error('Invalid local tangent point');return {lon:o.lon+p.x/(RAD*EARTH*cos),lat:o.lat+p.y/(RAD*EARTH)};}};
 }throw Error('Projection provider unavailable');
}
export function requireSameDatum(a,b){if(!a||a==='unknown'||a!==b)throw Error('Explicit vertical datum conversion required');}
/** The legacy pilot keeps its original 111320 m/degree X-east/Z-south frame. */
export function legacyAdapter(origin){validateGeo(origin);const cos=Math.cos(origin.lat*RAD);return {toGeo(p){return {lat:origin.lat-p.z/111320,lon:origin.lon+p.x/(111320*cos)};},fromGeo(p){validateGeo(p);return {x:(p.lon-origin.lon)*111320*cos,z:-(p.lat-origin.lat)*111320};}};}
/** Atomic rebasing. Canonical geographic/Float64 physics positions never change.
 * Consumers register render, collider, sound and camera shifts together. */
export class FloatingOrigin {
 constructor(origin={x:0,y:0,height:0},threshold=2048){if(!finite(origin.x,origin.y,origin.height)||threshold<=0)throw Error('Invalid origin');this.origin={...origin};this.threshold=threshold;this.listeners=new Set();this.revision=0;}
 local(p){return {x:p.x-this.origin.x,y:(p.height??0)-this.origin.height,z:this.origin.y-p.y};}
 canonical(p){return {x:p.x+this.origin.x,y:this.origin.y-p.z,height:p.y+this.origin.height};}
 subscribe(shift){this.listeners.add(shift);return ()=>this.listeners.delete(shift);}
 update(p){if(Math.hypot(p.x-this.origin.x,p.y-this.origin.y)<this.threshold)return false;const next={x:Math.round(p.x/256)*256,y:Math.round(p.y/256)*256,height:this.origin.height},delta={x:this.origin.x-next.x,y:0,z:next.y-this.origin.y},done=[];
  try{for(const listener of this.listeners){listener(delta);done.push(listener)}}catch(error){for(const listener of done.reverse())listener({x:-delta.x,y:0,z:-delta.z});throw error;}
  this.origin=next;this.revision++;return true;
 }
}
