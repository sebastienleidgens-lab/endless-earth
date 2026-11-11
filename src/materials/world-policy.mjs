// Appearance only. These rules never change a mapped class or physical geometry.
export function worldMaterialMode(value){return value==='mission12'?'mission12':value==='photographic'?'photographic':'hybrid'}
export const WORLD_MATERIAL_BINDINGS=Object.freeze({
 stone:{slot:0,metres:[2,2],reliefM:.009,status:'regional interpretation'},
 plaster:{slot:3,metres:[2.3,2.3],reliefM:.003,status:'restrained regional wear, not a house survey'},
 roof:{slot:4,metres:[1.5,1.5],reliefM:.014,status:'regional clay interpretation; documented other roofs retain priority'},
 earth:{slot:6,metres:[1.3,1.3],reliefM:.006,status:'generic grain; geographic class remains unchanged'},
 bank:{slot:7,metres:[1.3,1.3],reliefM:.006,status:'only compatible bare bank shading; grass/wood retained'},
 rock:{slot:9,metres:[2.7,2.7],reliefM:.025,status:'existing source, corrected provider scale; not local geology'},
});
export function authenticRoadPolicy(kind){return kind===3?'documented-rural':kind===6?'unknown-neutral-grain':'retain-mission12'}
