// Offline-only, deterministic triangle acceleration. No local coordinates.
export function triangleBVH(triangles){
 const n=triangles.length/9,order=Uint32Array.from({length:n},(_,i)=>i),centers=new Float32Array(n*3);
 for(let i=0;i<n;i++)for(let a=0;a<3;a++)centers[i*3+a]=(triangles[i*9+a]+triangles[i*9+3+a]+triangles[i*9+6+a])/3;
 function build(lo,hi){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let j=lo;j<hi;j++){const k=order[j]*9;for(let v=0;v<3;v++)for(let a=0;a<3;a++){const p=triangles[k+v*3+a];min[a]=Math.min(min[a],p);max[a]=Math.max(max[a],p)}}const node={min,max,lo,hi};if(hi-lo>12){const span=max.map((v,i)=>v-min[i]),axis=span.indexOf(Math.max(...span));order.subarray(lo,hi).sort((a,b)=>centers[a*3+axis]-centers[b*3+axis]||a-b);const mid=(lo+hi)>>>1;node.left=build(lo,mid);node.right=build(mid,hi)}return node}
 const root=build(0,n);
 function nearest(origin,direction,limit=4){let distance=limit;const inv=direction.map(d=>1/d),stack=[root];
  while(stack.length){const node=stack.pop();let near=0,far=distance;for(let a=0;a<3;a++){const p=(node.min[a]-origin[a])*inv[a],q=(node.max[a]-origin[a])*inv[a];near=Math.max(near,Math.min(p,q));far=Math.min(far,Math.max(p,q))}if(far<near)continue;if(node.left){stack.push(node.left,node.right);continue}
   for(let j=node.lo;j<node.hi;j++){const k=order[j]*9,a=triangles.subarray(k,k+3),e1=[triangles[k+3]-a[0],triangles[k+4]-a[1],triangles[k+5]-a[2]],e2=[triangles[k+6]-a[0],triangles[k+7]-a[1],triangles[k+8]-a[2]],h=[direction[1]*e2[2]-direction[2]*e2[1],direction[2]*e2[0]-direction[0]*e2[2],direction[0]*e2[1]-direction[1]*e2[0]],det=e1[0]*h[0]+e1[1]*h[1]+e1[2]*h[2];if(Math.abs(det)<1e-10)continue;const s=origin.map((v,i)=>v-a[i]),u=(s[0]*h[0]+s[1]*h[1]+s[2]*h[2])/det;if(u<0||u>1)continue;const q=[s[1]*e1[2]-s[2]*e1[1],s[2]*e1[0]-s[0]*e1[2],s[0]*e1[1]-s[1]*e1[0]],v=(direction[0]*q[0]+direction[1]*q[1]+direction[2]*q[2])/det;if(v<0||u+v>1)continue;const t=(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2])/det;if(t>.015&&t<distance)distance=t;
   }
  }return distance;
 }
 return {nearest,triangles:n};
}
export function contactVisibility(bvh,position,normal,samples=8,range=4){
 let length=Math.hypot(...normal);if(length<1e-8)return 1;const n=normal.map(v=>v/(length||1)),u=Math.abs(n[1])<.9?[n[2],0,-n[0]]:[0,-n[2],n[1]];length=Math.hypot(...u);for(let a=0;a<3;a++)u[a]/=length;const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],origin=position.map((p,i)=>p+n[i]*.055);let occlusion=0;
 for(let i=0;i<samples;i++){const r=Math.sqrt((i+.5)/samples),angle=i*2.399963229728653,d=n.map((p,a)=>p*Math.sqrt(1-r*r)+u[a]*r*Math.cos(angle)+v[a]*r*Math.sin(angle)),hit=bvh.nearest(origin,d,range);occlusion+=Math.pow(1-hit/range,2)}
 return Math.max(.55,1-occlusion/samples*.65);
}
