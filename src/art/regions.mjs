import {ART_DNA} from './dna.mjs';
import {POITOU as architecture} from '../architecture/style.mjs';
import {POITOU as nature} from '../nature/ecology.mjs';
// Validation configurations, not surveys or exhaustive regional taxonomies.
export function regionalStyle(id='poitou'){
 const style={id,label:'Poitou · référence',interpretation:'Generic regional art; synthetic fixture, not a real village',architecture:structuredClone(architecture),nature:structuredClone(nature),ground:structuredClone(ART_DNA.surfaces)};
 style.ground.colors={meadow:0x929b70,wood:0x767b5d,rock:0xb3ad9a};
 if(id==='atlantic'){
  style.label='Atlantique · pierre et ardoise';style.architecture.id='atlantic-fixture-v1';style.architecture.pitches=[38,42,46];style.architecture.walls=[0xc1c2b5,0xd0cfbf,0xabb4ac,0xc3c4b6];style.architecture.roofs=[0x637174,0x6c7879,0x5c6b70];style.architecture.roof.defaultMaterial='slate';style.architecture.shutters=[0x547477,0x586d78,0x6a7b72];
  Object.assign(style.nature,{id:'atlantic-fixture-v1',spacing:13,defaultLeaf:'mixed',needleFraction:.20,palette:[0x526f58,0x5b785d,0x678164],needleColor:0x48645d});style.ground.id='atlantic-mineral-v1';style.ground.rockTone=[.32,.34,.33];style.ground.colors={meadow:0x849e79,wood:0x687d63,rock:0x9baca5};
 }else if(id==='mediterranean'){
  style.label='Méditerranéen · calcaire et couvert ouvert';style.architecture.id='mediterranean-fixture-v1';style.architecture.pitches=[14,18,20];style.architecture.walls=[0xe0d2b7,0xe8d9be,0xc9b99a,0xddc7a4];style.architecture.roofs=[0xac7656,0xbc855e,0x9f7156];style.architecture.facade.plasterEvery=2;style.architecture.shutters=[0x718070,0x7f9384,0x9a8a71];
  Object.assign(style.nature,{id:'mediterranean-fixture-v1',spacing:18,defaultLeaf:'mixed',needleFraction:.65,palette:[0x6d7854,0x74805a,0x647249],needleColor:0x526645,latitude:43,groundColors:{...style.nature.groundColors,grass:0x9b996f,shrub:0x7b8258}});style.ground.id='mediterranean-mineral-v1';style.ground.rockTone=[.48,.43,.33];style.ground.colors={meadow:0xa4a078,wood:0x7e815f,rock:0xc5b595};
 }else if(id!=='poitou')throw new RangeError('Unknown validation region');
 return style;
}
export const REGIONAL_STYLE_IDS=Object.freeze(['poitou','atlantic','mediterranean']);
