/** Subtract the protected historical footprint from a polygon. Heights are
 * interpolated at cut edges; no replacement floor is created inside it. */
export function clipExterior(poly,bounds){
 let remaining=poly;const output=[];
 for(const [axis,sign,bound]of [['x',1,bounds[2]],['x',-1,bounds[0]],['z',1,bounds[3]],['z',-1,bounds[1]]]){
  if(!remaining.length)break;
  const clip=outside=>{
   const result=[];
   for(let i=0;i<remaining.length;i++){
    const a=remaining[i],b=remaining[(i+1)%remaining.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign,ia=outside?da>=0:da<=0,ib=outside?db>=0:db<=0;
    if(ia)result.push(a);
    if(ia!==ib){const t=da/(da-db);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});}
   }
   return result;
  };
  const outside=clip(true),inside=clip(false);if(outside.length>=3)output.push(outside);remaining=inside;
 }
 return output;
}

/** ShapeGeometry may triangulate a river across the entire old pilot even
 * when only its outer vertices are outside. Clip triangles, not just anchors. */
export function excludeIndexedTriangles(vertices,indices,bounds){
 const result=[],count=indices?.length??vertices.length;
 for(let i=0;i+2<count;i+=3){
  const triangle=[0,1,2].map(j=>vertices[indices?indices[i+j]:i+j]);
  for(const polygon of clipExterior(triangle,bounds))for(let j=1;j<polygon.length-1;j++)result.push(polygon[0],polygon[j],polygon[j+1]);
 }
 return result;
}
