/** Exact radius-zero membership used by estimated water. Unlike a swept
 * walking capsule this never needs an edge distance/projection. Keep the
 * identical ray parity, including concave rings and boundary convention. */
export function waterContainsPoint(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}
