// Original, generic temperate canopy art; no surveyed tree/species is implied.
// Binds the baked ambient attenuation to the actual crown representation.
export const CANOPY_VERSION='branch-attached-forest-v2';
export const CANOPY_LOBES=[
 [0,.1,0,2.9,2.8,2.6],[-2.25,-.25,.5,2.45,2.15,2.3],
 [2.05,.15,-.85,2.6,2.5,2.15],[-.65,2.15,-.2,2.5,2.05,2.35],
 [.5,.15,2.25,2.55,2.1,2.3],[-.65,-.25,-2.2,2.4,2.3,2.25],
 [-1.9,1.25,-1.1,2.25,2.15,2.2],
];
// The same position and wind functions are used by colour and solar casters.
export const canopyGLSL=`
vec3 canopyShape(vec3 p,vec4 traits){
 float form=traits.x*3.;
 p.x*=.87+.13*abs(sin(form*2.1));p.z*=.87+.13*abs(cos(form*2.1));
 p.x+=sin(p.y*.7+form)*.16*clamp(p.y+3.,0.,1.);
 return p;
}
vec2 canopySway(vec3 p,vec4 basis,vec2 anchor,float cluster,float fine){
 vec2 wind=lifeLocalWind;float phase=anchor.x*.17+anchor.y*.13;
 float sway=.25+sin(lifeTime*.65+phase)*.75;
 #if LIFE_WIND_MODE == 2
 wind=lifeWind(anchor,lifeTime,lifeMeanWind);
 sway=.25+sin(lifeTime*.65+phase)*.5+sin(lifeTime*.37+phase*.73)*.25;
 sway+=sin(lifeTime*2.4+phase+cluster*19.)*lifeFine*fine*.12;
 #endif
 wind=vec2(dot(basis.xy,wind),dot(basis.zw,wind));
 float bend=.12+clamp((p.y+3.)/7.4,0.,1.)*.26;
 #if LIFE_WIND_MODE == 0
 return vec2(0.);
 #else
 return wind*bend*sway*lifeVegetation;
 #endif
}
`;

export function canopyLayout(p,clearance=Infinity){
 const n=Math.sin(p.x*127.1+p.z*311.7+2*74.7)*43758.5453,f=n-Math.floor(n);
 const riparian=p.kind==='riparian',needle=p.leaf==='needle'&&!riparian;
 const height=riparian?1.3:1;
 // Radius includes deformation and the maximum shared wind displacement.
 // Keep foliage away from masonry, without moving any persistent anchor.
 const width=needle?.95:riparian?.78:1.02+f*.17;
 const limit=Math.max(.25,Math.min(1,(clearance-.65)/(5.8*p.scale*Math.max(width,1.03))));
 return {yaw:f*Math.PI*2,trunkScale:[p.scale*.86,p.scale*height,p.scale*.86],
  trunkY:p.y+2.25*p.scale*height,crownY:p.y+6.05*p.scale*height,
  crownScale:[p.scale*width*limit,p.scale*height,p.scale*(riparian?.82:1.03)*limit],limit};
}
