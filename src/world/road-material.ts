import {worldMaterialPrelude} from '../materials/world';
import * as THREE from 'three';
// @ts-ignore Deterministic CPU atlas, shared with Node tests.
import {createRoadAtlas} from './road-texture.mjs';
const atlas=createRoadAtlas(undefined,2);
export const roadTexture=new THREE.DataTexture(atlas.data,atlas.width,atlas.height,THREE.RGFormat);
roadTexture.name='Original mineral materials · Mission 07.3';
roadTexture.wrapS=roadTexture.wrapT=THREE.ClampToEdgeWrapping;
roadTexture.minFilter=THREE.LinearMipmapLinearFilter;roadTexture.magFilter=THREE.LinearFilter;
roadTexture.generateMipmaps=true;roadTexture.needsUpdate=true;
// Dry, diffuse mineral surfaces. The numbers are artistic interpretations,
// never source evidence. Lambert needs no invented wet/specular response.
const palette=[0x898986,0xb2aa97,0xa89a7b,0xb8b09a,0xa5a293,0xa69c80].map(c=>new THREE.Color(c));
export const roadUniforms={roadAtlas:{value:roadTexture},roadColors:{value:palette}};
export const roadShaderPrelude=worldMaterialPrelude+`
uniform sampler2D roadAtlas;
uniform vec3 roadColors[6];
// Gradient uses unwrapped metre UVs: fract must not inflate derivatives at seams.
vec4 mineralSample(vec2 uv, vec2 quadrant){
 vec2 scale=vec2(256./576.);
 return textureGrad(roadAtlas,quadrant*.5+(fract(uv)*256.+16.)/576.,dFdx(uv)*scale,dFdy(uv)*scale);
}
vec3 mineralNormal(vec3 n, vec3 eye, float height){
 vec3 dx=dFdx(eye),dy=dFdy(eye);
 vec3 r1=cross(dy,n),r2=cross(n,dx);
 float det=dot(dx,r1);
 vec3 gradient=sign(det)*(dFdx(height)*r1+dFdy(height)*r2);
 return normalize(abs(det)*n-gradient);
}
`;
export const roadColorShader=`
float mineralHeight=0.;
float mineralDetail=0.;
float roadBoundaryDistance=3.;
#ifdef ROAD_EDGES
 vec2 edgeUV=(p-roadEdgeOrigin)/roadEdgeExtent;
 roadBoundaryDistance=abs(texture2D(roadEdges,edgeUV).r*2.-1.)*roadEdgeRange;
#endif
vec3 roadDust=vec3(.42,.385,.30)*(1.+groundPatch*.15);
if(earthRoadType>.5){
 int roadClass=int(earthRoadType+.5)-1;
 vec3 base=roadColors[roadClass];
 float rural=step(2.5,earthRoadType)*(1.-step(4.5,earthRoadType))+step(5.5,earthRoadType);
 float sett=step(1.5,earthRoadType)*(1.-step(2.5,earthRoadType));
 float gravel=step(3.5,earthRoadType)*(1.-step(4.5,earthRoadType));
 float unknown=step(4.5,earthRoadType)*(1.-step(5.5,earthRoadType));
 vec2 quadrant=sett>0.?vec2(1.,0.):gravel>0.?vec2(0.,1.):rural>0.?vec2(1.,1.):vec2(0.);
 float metres=earthRoadType<1.5||unknown>0.?2.:4.;
 float detailFade=1.-smoothstep(15.,90.,length(vViewPosition));
 mineralDetail=detailFade;
 float mineralTone=0.;
 if(detailFade>.001){
  vec4 grain;
  if(m13Mode>.5&&rural>.5&&gravel<.5){vec2 g=m13Grain(p/1.3,6.);grain=vec4(g,0.,1.);}else grain=mineralSample(p/metres,quadrant);
  // Reuse the independent R channels of the two existing world-noise reads.
  // They vary in world space, independently of the repeated mineral tile.
  // Courses remain coherent; a second scale only varies their tone, not joints.
  mineralTone=(grain.r-.5)*(sett>.5?.66:gravel>.5?.60:.40)+groundMineral*.05;
  float relief=sett>.5?.010:gravel>.5?.008:rural>.5?.004:.0018;
  mineralHeight=(grain.g-.5)*relief*detailFade;
  if(unknown>.5){mineralTone*=.55;mineralHeight*=.5;}
 }
 // Existing low-frequency world noise is shared with surrounding ground.
 // No high-contrast aerial blotches and no tiled cracks or invented markings.
 base*=1.+groundPatch*.20+mineralTone*detailFade;
 float edgeDust=1.-smoothstep(.12,(rural>.5?1.10:.65)*(1.+groundPatch*.35),roadBoundaryDistance);
 // A restrained mineral shoulder, not grass painted onto sealed roads.
 base=mix(base,roadDust,edgeDust*(rural>.5?.55:.30));
 mineralHeight*=1.-edgeDust*.55;
 diffuseColor.rgb=base;
}else{
 // Same partition, natural side: a faint mineral/soil transition, no overlay.
 float soilEdge=1.-smoothstep(.12,.80,roadBoundaryDistance);
 diffuseColor.rgb=mix(diffuseColor.rgb,roadDust,soilEdge*.24);
}
`;
export const roadNormalShader=`
if(earthRoadType>.5&&mineralDetail>.001)normal=mineralNormal(normal,-vViewPosition,mineralHeight);
`;
export type RoadEdges={texture:THREE.DataTexture;manifest:any};
export function configureRoadFiltering(renderer:THREE.WebGLRenderer,edges:RoadEdges|null){
 const maximum=renderer.capabilities.getMaxAnisotropy(),anisotropy=Math.min(4,maximum),edgeAnisotropy=Math.min(8,maximum);
 if(roadTexture.anisotropy!==anisotropy){roadTexture.anisotropy=anisotropy;roadTexture.needsUpdate=true;}
 if(edges&&edges.texture.anisotropy!==edgeAnisotropy){edges.texture.anisotropy=edgeAnisotropy;edges.texture.needsUpdate=true;}
}
