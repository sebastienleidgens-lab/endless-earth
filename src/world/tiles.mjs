// World tile addressing in Web Mercator (EPSG:3857).
// Tiles are stable across countries and independent of the rendering engine.
const MAX_LAT = 85.0511287798066;
export function normalizeLongitude(lon) {
  if(!Number.isFinite(lon)) throw new RangeError('Invalid longitude');
  return ((lon+180)%360+360)%360-180;
}
export function tileForLocation(lat,lon,zoom) {
  if(!Number.isFinite(lat)||!Number.isInteger(zoom)||zoom<0||zoom>22)
    throw new RangeError('Invalid latitude or zoom');
  const n=2**zoom, clamped=Math.max(-MAX_LAT,Math.min(MAX_LAT,lat));
  const x=Math.min(n-1,Math.floor((normalizeLongitude(lon)+180)/360*n));
  const phi=clamped*Math.PI/180;
  const y=Math.min(n-1,Math.max(0,Math.floor((1-Math.asinh(Math.tan(phi))/Math.PI)/2*n)));
  return {z:zoom,x,y};
}
export function tileKey({z,x,y}) {
  if(!Number.isInteger(z)||z<0||z>22||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=2**z||y>=2**z)
    throw new RangeError('Invalid tile');
  return `${z}/${x}/${y}`;
}
export function tileBounds({z,x,y}) {
  tileKey({z,x,y});
  const n=2**z;
  const latitude=v=>Math.atan(Math.sinh(Math.PI*(1-2*v/n)))*180/Math.PI;
  return {west:x/n*360-180,east:(x+1)/n*360-180,north:latitude(y),south:latitude(y+1)};
}
export function surroundingTiles(lat,lon,zoom,radius=1) {
  if(!Number.isInteger(radius)||radius<0||radius>8)throw new RangeError('Invalid radius');
  const center=tileForLocation(lat,lon,zoom),n=2**zoom,results=[];
  const seen=new Set();
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    const y=center.y+dy;if(y<0||y>=n)continue;
    const x=((center.x+dx)%n+n)%n,key=tileKey({z:zoom,x,y});
    if(!seen.has(key)){seen.add(key);results.push({z:zoom,x,y});}
  }
  return results;
}
