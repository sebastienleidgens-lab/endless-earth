import {POITOU as architecture} from '../architecture/style.mjs';
import {POITOU as nature} from '../nature/ecology.mjs';
import {regionalStyle} from '../art/regions.mjs';
import {resolveFrenchFamily,frenchRegion} from './france-model.mjs';
// New material demonstrations freeze all geometric/ecological rules to Poitou.
// Regional defaults affect palette and material family only, never roof pitch.
export function frenchMaterialStyle(region='poitou'){
 frenchRegion(region);const appearance=regionalStyle(region);
 const style={...appearance,architecture:structuredClone(architecture),nature:structuredClone(nature)};
 for(const k of ['walls','roofs','shutters'])style.architecture[k]=appearance.architecture[k];
 style.architecture.id='french-material-'+region;
 style.architecture.roof.defaultMaterial=resolveFrenchFamily('roof',null,region).family;
 style.architecture.facade.regionalGranite=region==='atlantic';
 style.nature.palette=appearance.nature.palette;style.nature.needleColor=appearance.nature.needleColor;
 style.label=region==='atlantic'?'Atlantique · granite et ardoise':region==='mediterranean'?'Méridional · enduit, pierre claire et tuile':'Poitou · témoin';
 return style;
}
