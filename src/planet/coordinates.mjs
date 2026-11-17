const RAD=Math.PI/180,EARTH=6378137,E=.0818191910428158,N=.725607765053267,C=11754255.426096,XS=700000,YS=12655612.049876;
const finite=(...v)=>v.every(Number.isFinite);
export function validateGeo(p){if(!p||!finite(p.lat,p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)throw Error('Invalid WGS84 position');return p;}
/** EPSG:2154, GRS80, IGN published Lambert-93 constants. Height is NOT converted. */
export function lambert93(p){validateGeo(p);const phi=p.lat*RAD,s=E*Math.sin(phi),iso=Math.log(Math.tan(Math.PI/4+phi/2))-.5*E*Math.log((1+s)/(1-s)),r=C*Math.exp(-N*iso),theta=N*(p.lon-3)*RAD;return {x:XS+r*Math.sin(theta),y:YS-r*Math.cos(theta)};}
export function inverseLambert93(p){if(!p||!finite(p.x,p.y))throw Error('Invalid projected position');const r=Math.hypot(p.x-XS,YS-p.y),iso=-Math.log(r/C)/N,lon=3+Math.atan2(p.x-XS,YS-p.y)/N/RAD;let lat=2*Math.atan(Math.exp(iso))-Math.PI/2;for(let i=0;i<10;i++){const s=E*Math.sin(lat);lat=2*Math.atan(Math.exp(iso)*((1+s)/(1-s))**(E/2))-Math.PI/2;}return {lon,lat:lat/RAD};}
export function createProjection(config){
 if(config?.type==='ecef-tangent')return createECEFTangent(config);
 if(config?.type==='lambert93')return {code:'EPSG:2154',project:lambert93,unproject:inverseLambert93};
 if(config?.type==='local-tangent'){
  const o=validateGeo(config.origin),cos=Math.cos(o.lat*RAD);if(Math.abs(cos)<.01)throw Error('Local tangent projection excludes polar singularity');
  return {code:'local-tangent',project(p){validateGeo(p);if(Math.abs(p.lat-o.lat)>2||Math.abs(p.lon-o.lon)>2)throw Error('Outside the declared local projection range');return {x:(p.lon-o.lon)*RAD*EARTH*cos,y:(p.lat-o.lat)*RAD*EARTH};},unproject(p){if(!finite(p.x,p.y))throw Error('Invalid local tangent point');return {lon:o.lon+p.x/(RAD*EARTH*cos),lat:o.lat+p.y/(RAD*EARTH)};}};
 }throw Error('Projection provider unavailable');
}

// WGS84 geodetic coordinates and Earth-centred Earth-fixed coordinates.
// This provider is deliberately separate from the historical IGN69/Lambert
// adapter: no geoid or national-height conversion is implied by these methods.
const WGS84_F=1/298.257223563,WGS84_E2=WGS84_F*(2-WGS84_F),WGS84_B=EARTH*(1-WGS84_F);
const ELLIPSOID='WGS84-ellipsoid';
export function normalizeLongitude(lon){
 if(!Number.isFinite(lon))throw Error('Invalid longitude');
 const value=((lon+180)%360+360)%360-180;
 return Object.is(value,-0)?0:value;
}
function ellipsoidal(p){
 validateGeo(p);
 if(!Number.isFinite(p.height)||p.datum!==ELLIPSOID)throw Error('Explicit WGS84 ellipsoidal height required');
 return p;
}
export function toECEF(p){
 ellipsoidal(p);
 const lat=p.lat*RAD,lon=p.lon*RAD,s=Math.sin(lat),c=Math.cos(lat),n=EARTH/Math.sqrt(1-WGS84_E2*s*s);
 return {x:(n+p.height)*c*Math.cos(lon),y:(n+p.height)*c*Math.sin(lon),z:(n*(1-WGS84_E2)+p.height)*s};
}
export function fromECEF(p){
 if(!p||!finite(p.x,p.y,p.z))throw Error('Invalid ECEF position');
 const rho=Math.hypot(p.x,p.y);
 if(Math.hypot(rho,p.z)<1)throw Error('ECEF point is outside the supported terrestrial shell');
 if(rho<1e-8)return {lat:p.z>=0?90:-90,lon:0,height:Math.abs(p.z)-WGS84_B,datum:ELLIPSOID};
 let lat=Math.atan2(p.z,rho*(1-WGS84_E2));
 for(let i=0;i<12;i++){
  const s=Math.sin(lat),n=EARTH/Math.sqrt(1-WGS84_E2*s*s),next=Math.atan2(p.z+WGS84_E2*n*s,rho);
  if(Math.abs(next-lat)<1e-15){lat=next;break;}lat=next;
 }
 const s=Math.sin(lat),c=Math.cos(lat),n=EARTH/Math.sqrt(1-WGS84_E2*s*s),height=Math.abs(c)>.1?rho/c-n:p.z/s-n*(1-WGS84_E2);
 return {lat:lat/RAD,lon:normalizeLongitude(Math.atan2(p.y,p.x)/RAD),height,datum:ELLIPSOID};
}
/** Full 3D ENU tangent frame, including the ellipsoid-curvature up component.
 * x=east, y=north, up=ellipsoid normal at the declared origin. The frame is
 * valid across the antimeridian and at either pole; it is not a global flat
 * terrain projection. Preserve `up` for an exact inverse. maxDistanceM bounds
 * a local patch explicitly instead of claiming one tangent plane fits Earth.
 */
export function createECEFTangent(config){
 const origin=ellipsoidal({...config.origin}),anchor=toECEF(origin),lat=origin.lat*RAD,lon=origin.lon*RAD;
 const sl=Math.sin(lon),cl=Math.cos(lon),sp=Math.sin(lat),cp=Math.cos(lat),limit=config.maxDistanceM??250000;
 if(!Number.isFinite(limit)||limit<=0||limit>1000000)throw Error('Invalid ENU patch distance limit');
 function check(x,y,up){if(!finite(x,y,up)||Math.hypot(x,y,up)>limit)throw Error('Outside the declared ENU patch');}
 return {code:'WGS84-ENU-v1',datum:ELLIPSOID,origin,maxDistanceM:limit,
  project(p){const q=toECEF(p),dx=q.x-anchor.x,dy=q.y-anchor.y,dz=q.z-anchor.z,x=-sl*dx+cl*dy,y=-sp*cl*dx-sp*sl*dy+cp*dz,up=cp*cl*dx+cp*sl*dy+sp*dz;check(x,y,up);return {x:x||0,y:y||0,up:up||0,datum:ELLIPSOID};},
  unproject(p){if(p?.datum!==ELLIPSOID)throw Error('Explicit ENU datum required');check(p.x,p.y,p.up);return fromECEF({x:anchor.x-sl*p.x-sp*cl*p.y+cp*cl*p.up,y:anchor.y+cl*p.x-sp*sl*p.y+cp*sl*p.up,z:anchor.z+cp*p.y+sp*p.up});}
 };
}
/** Global administrative-boundary-independent address. A level L has 2^L
 * latitude bands and 2^(L+1) longitude columns. Cells are angular, not equal
 * area or metric; the exact poles have one canonical longitude owner. */
export function globalCellId(position,level=16){
 validateGeo(position);
 if(!Number.isInteger(level)||level<0||level>24)throw Error('Invalid global cell level');
 const rows=2**level,columns=rows*2,lon=Math.abs(position.lat)===90?-180:normalizeLongitude(position.lon),x=Math.min(columns-1,Math.floor((lon+180)/360*columns)),y=Math.min(rows-1,Math.floor((position.lat+90)/180*rows));
 return `earth-angular-v1/${level}/${x}/${y}`;
}
export function globalCellBounds(id){
 const match=/^earth-angular-v1\/(0|[1-9]\d*)\/(0|[1-9]\d*)\/(0|[1-9]\d*)$/.exec(id??'');
 if(!match)throw Error('Invalid global cell ID');
 const [level,x,y]=match.slice(1).map(Number),rows=2**level,columns=rows*2;
 if(level>24||x>=columns||y>=rows)throw Error('Invalid global cell ID');
 return {id,level,x,y,west:x/columns*360-180,south:y/rows*180-90,east:(x+1)/columns*360-180,north:(y+1)/rows*180-90};
}
export function globalCellParent(id){
 const {level,x,y}=globalCellBounds(id);
 return level?`earth-angular-v1/${level-1}/${Math.floor(x/2)}/${Math.floor(y/2)}`:null;
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
