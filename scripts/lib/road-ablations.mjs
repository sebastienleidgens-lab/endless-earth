// Browser-test-only ablations of the served frozen Mission 07.2 module.
// These intentionally disable features to measure cost; they are not presets.
export const ABLATIONS=['full','no-normal','no-secondary','no-detail','no-edges','implicit-grad','aniso-one','edges-road-only','no-soil-blend','073-no-mask'];
export function ablateRoadModule(source,variant){
 if(!ABLATIONS.includes(variant))throw new Error('Unknown road ablation: '+variant);
 const replace=(old,next)=>{if(!source.includes(old))throw new Error('Ablation marker absent: '+variant);source=source.replace(old,next)};
 if(variant==='073-no-mask')replace('if(earthShoulderRegion>.001)roadBoundaryDistance','roadBoundaryDistance');
 if(variant==='no-normal')replace('if(earthRoadType>.5)normal=mineralNormal(normal,-vViewPosition,mineralHeight);','');
 if(variant==='no-secondary')replace('vec4 variation=mineralSample(mat2(.8,.6,-.6,.8)*p/(metres*3.71)+vec2(.137,.397),quadrant);','vec4 variation=vec4(.5);');
 if(variant==='no-detail')replace('if(detailFade>.001){','if(false){');
 if(variant==='no-edges')replace('roadBoundaryDistance=abs(texture2D(roadEdges,edgeUV).r*2.-1.)*roadEdgeRange;','roadBoundaryDistance=3.;');
 if(variant==='implicit-grad')replace('return textureGrad(roadAtlas,quadrant*.5+(fract(uv)*256.+16.)/576.,dFdx(uv)*scale,dFdy(uv)*scale);','return texture2D(roadAtlas,quadrant*.5+(fract(uv)*256.+16.)/576.);');
 if(variant==='aniso-one')replace('const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());','const anisotropy = 1;');
 if(variant==='edges-road-only')replace('roadBoundaryDistance=abs(texture2D(roadEdges,edgeUV).r*2.-1.)*roadEdgeRange;','if(earthRoadType>.5)roadBoundaryDistance=abs(texture2D(roadEdges,edgeUV).r*2.-1.)*roadEdgeRange;');
 if(variant==='no-soil-blend')replace('diffuseColor.rgb=mix(diffuseColor.rgb,roadDust,soilEdge*.24);','');
 return source;
}
