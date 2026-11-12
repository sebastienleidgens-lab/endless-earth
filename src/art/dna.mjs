// Shared artistic contract. It changes appearance, never measured geography.
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o)};
export const ART_DNA=freeze({
 version:'endless-earth-art-dna-v1',
 intent:'Quiet, tactile, moderately stylized landscapes; silhouettes first, detail only nearby.',
 metrics:{unit:'metre',sourceGeometry:'authoritative',regionalAppearance:'interpreted',stableIdentity:'source id or metric anchor'},
 lighting:{owner:'Mission 11 solar/weather environment',night:'deterministic interpreted warm glazing; no observed occupancy',leafTransmission:.025},
 architecture:{toneFloor:.70,toneRange:.36,meanTone:.88,detailM:[24,110],stoneRelief:.009,plasterRelief:.0016,tileRelief:.014,slateRelief:.006,woodRelief:.0015},
 surfaces:{id:'quiet-mineral-v1',grainContrast:.50,rockContrast:.78,rockMix:.76,patchContrast:.12,normalGain:.75,rockTone:[.42,.395,.335],detailM:[18,100]},
 vegetation:{palette:[0x5c704e,0x66794f,0x6d7b55,0x586e57,0x74805a],needle:0x566c58,bark:0x726955,ground:{grass:0x7f895f,fern:0x657b57,leaf:0x97815d,flower:0xc6ba91,stone:0xa09b85,branch:0x75694f,shrub:0x66784f,reed:0x78865d},lod:{eco:0,balanced:75,quality:110,hysteresis:18}},
 animation:{owner:'Mission 11 continuous wind',roots:'fixed',near:'independent canopy phases and leaf flutter',far:'coarse shared carrier',calm:'immobility is allowed',newClimate:false},
 water:{sunGlint:.28,interpretation:'analytic sky reflection; no measured flow or bathymetry'},
 budgets:{trees:2500,detailCandidates:3200,hiddenNatureCells:4,hiddenArchitectureCells:12,extraPasses:0,postprocessing:false},
 regional:['architecture palette/material defaults/roof pitch','vegetation families and habitat-constrained density','interpreted mineral tones','calendar response; existing environment remains the clock'],
 local:['building footprints','roads and access','water outlines','DEM','land cover','documented monuments'],
 unknown:'Keep unknown observations unknown. Two synthetic fixtures do not validate all French regions.',
});
export const glsl=n=>Number(n).toFixed(6);
export const glslVec=v=>'vec3('+v.map(glsl).join(',')+')';
