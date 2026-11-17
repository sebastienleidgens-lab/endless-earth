import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Keep the exact near trunk silhouette without promoting every tiny branch
 * to near LOD in the shadow pass. Foliage remains a real alpha-tested caster. */
export function stableForestCaster(model,excluded=[]){
 function subset(source,keep){const ids=source.index.array,chosen=[],map=new Map(),order=[];for(let i=0;i<ids.length;i+=3)if(keep(ids[i]))for(let j=0;j<3;j++){const old=ids[i+j];if(!map.has(old)){map.set(old,order.length);order.push(old);}chosen.push(map.get(old));}const g=new THREE.BufferGeometry();for(const [name,a]of Object.entries(source.attributes)){if(excluded.includes(name))continue;const values=new a.array.constructor(order.length*a.itemSize);for(let i=0;i<order.length;i++)for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.array[order[i]*a.itemSize+k];g.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}g.setIndex(chosen);return g;}
 const near=model.levels[0].wood,mid=model.levels[1].wood,leaf=model.levels[1].leaves,trunk=subset(near,i=>near.attributes.forestPrimary.getW(i)===0),branches=subset(mid,i=>mid.attributes.forestPrimary.getW(i)!==0),leaves=subset(leaf,()=>true),parts=[trunk,branches,leaves],g=mergeGeometries(parts);g.userData.woodCount=trunk.index.count+branches.index.count;for(const p of parts)p.dispose();g.name='forest-'+model.id+'-stable-trunk-caster';g.computeBoundingBox();g.computeBoundingSphere();return g;
}
