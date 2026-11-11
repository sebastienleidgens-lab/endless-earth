import {ART_DNA} from '../art/dna.mjs';
// Regional interpretation, not a survey of individual façades. Metres throughout.
// Add another configuration to the caller later; the generator has no place names.
export const POITOU = Object.freeze({
 id:'poitou-v2', geometrySeed:'poitou-v1',
 walls:[0xd6cdb6,0xe2d9c4,0xc5bda8,0xddd4be,0xbdb49c,0xe8dfc9,0xd1c4a9,0xc9c0ab],
 roofs:[0xa36f57,0xb37b5c,0x996c58,0x8f6b5b], shutters:[0x657668,0x667e7b,0x81705c,0x52675f,0x71615c,0x68717b],
 wallMaterials:{wood:0x89745b,timber:0x89745b,brick:0xa9755d,metal:0x7e8581,concrete:0xbcb9ad},
 roofMaterials:{slate:0x637174,metal:0x7e8581,zinc:0x8b9390,copper:0x779083,wood:0x89745b,timber:0x89745b,concrete:0xaaa99f,thatch:0x96835d},
 floorHeight:2.9, pitches:[28,32,36], detailDistance:{low:65,high:125},cellSize:128,
 facade:{plasterEvery:3,metres:[4,2.4],variation:.09,basePatina:.11},
 roof:{defaultMaterial:'clay',metres:[4,4],variation:.10},
 details:{frameWidth:.075,shutterWidth:.19,frames:[0xe5ddc9,0xd8cfb9,0xeee5d1],doors:[0x5b6351,0x596d6b,0x75604a,0x5b5550,0x725a52],glass:[0x3a4e4b,0x455955,0x394d52]},
 artDNA:ART_DNA.version,
 interpretation:'Poitou material palette and inferred facade details; no individual house survey',
});
