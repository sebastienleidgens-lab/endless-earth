/** Original hand-authored sculpt layers. All dimensions are metres; no scans,
 * borrowed character, downloaded model or image texture. One merged skin. */
export function travelerDetails(kind,{loft,fixed,mix,palette,head,chest,spine,hips,pack,packLid,arms,legs}){
 const ellipsoid=(x,y,z,rx,ry,rz,c,bone,sides=12)=>{
  const rings=[];for(let i=0;i<=6;i++){const a=-Math.PI/2+i/6*Math.PI,s=Math.max(.008,Math.cos(a));rings.push([y+Math.sin(a)*ry,rx*s,rz*s,x,z]);}loft(rings,c,fixed(bone),sides);
 };
 if(kind==='head'){
  // Warm orbital planes, off-white sclera, irises, pupils and small highlights.
  for(const side of [-1,1]){
   ellipsoid(side*.046,1.628,.102,.024,.018,.009,0xbc8e72,head);
   ellipsoid(side*.046,1.627,.111,.0165,.0085,.006,0xe1dbca,head);
   ellipsoid(side*.046,1.627,.116,.007,.007,.0025,0x60705a,head,10);
   ellipsoid(side*.046,1.627,.118,.0035,.0045,.0018,0x252c29,head,8);
   ellipsoid(side*.043,1.630,.119,.0016,.0017,.001,0xf0e6cf,head,6);
   loft([[1.645,.025,.005,side*.046,.109],[1.651,.027,.006,side*.046,.106]],0x554135,fixed(head),8);
   ellipsoid(side*.015,1.587,.137,.004,.003,.0025,0x8a5e49,head,6);
  }
  // Separated hair locks follow the skull rather than a single cap.
  for(let i=0;i<15;i++){
   const a=i/15*Math.PI*2,x=Math.cos(a)*.083,z=Math.sin(a)*.065-.019;
   loft([[1.68,.019,.023,x,z],[1.733,.025,.025,x*.91,z*.86],[1.778+Math.sin(i*2.2)*.009,.018,.025,x*.43-.013,z*.38],[1.787,.005,.009,-.018,-.022]],i%3?palette.hair:0x5d4738,fixed(head),6);
  }
  // Beard is confined to chin/jaw; lips and cheeks remain readable.
  for(let i=-4;i<=4;i++){
   const x=i*.019,z=.09-Math.abs(i)*.006;
   loft([[1.49+Math.abs(i)*.005,.012,.011,x,z],[1.522,.015,.017,x,z+.008],[1.551,.012,.011,x,z+.008]],i%2?0x6e5544:0x795e4a,fixed(head),6);
  }
  loft([[1.549,.027,.004,0,.103],[1.555,.030,.005,0,.105],[1.559,.023,.003,0,.103]],0xa47460,fixed(head),10);
 }
 if(kind==='clothes'){
  // Jacket opening, metal zip, two chest pockets and articulated elbow folds.
  loft([[.96,.012,.008,0,.117],[1.16,.012,.008,0,.135],[1.37,.011,.007,0,.108]],0xc1ab86,fixed(chest),6);
  for(const s of [-1,1]){
   loft([[1.13,.060,.014,s*.096,.128],[1.245,.065,.022,s*.103,.132],[1.259,.060,.016,s*.103,.13]],0x41636a,fixed(chest),10);
   loft([[1.245,.063,.009,s*.103,.15],[1.262,.064,.010,s*.103,.146]],0x8e9b8a,fixed(chest),8);
   loft([[.94,.014,.012,s*.13,.117],[1.12,.014,.011,s*.17,.134]],0x263e42,fixed(chest),6);
   const a=arms.find(a=>a.side===s),l=legs.find(l=>l.side===s);
   for(let i=0;i<3;i++)loft([[1.022+i*.022,.057,.060,s*.25,0],[1.030+i*.022,.061,.063,s*.25,-.003]],i%2?0x526f72:0x2e525a,y=>mix(a.upper,a.lower,.5),8);
   loft([[.42,.075,.016,s*.105,.074],[.49,.078,.021,s*.105,.081],[.55,.074,.014,s*.105,.073]],0x796956,fixed(l.thigh),10);
   loft([[.12,.007,.072,s*.158,.002],[.30,.008,.077,s*.174,-.005],[.40,.007,.078,s*.178,0]],0xa49376,fixed(l.shin),6);
   // Four fingers plus thumb; shared phalanx controls are sufficient for grip.
   for(const offset of [-.027,-.009,.009,.027])loft([[.674,.007,.011,s*.272+offset,.014],[.708,.008,.014,s*.272+offset,.014],[.744,.009,.015,s*.272+offset,.014]],palette.skin,y=>y<.71?fixed(a.tips)():mix(a.tips,a.fingers,Math.min(1,(y-.71)/.03)),6);
  }
  loft([[.857,.151,.111],[.89,.157,.117],[.905,.151,.111]],0x49453b,fixed(hips),16);
  ellipsoid(0,.89,.119,.027,.020,.007,0xa99f86,hips,8);
 }
 if(kind==='pack'){
  for(const s of [-1,1]){
   loft([[1.03,.025,.015,s*.13,-.44],[1.06,.026,.016,s*.13,-.445]],0x303f38,fixed(pack),6);
   loft([[1.29,.024,.013,s*.13,-.414],[1.32,.027,.014,s*.13,-.416]],0xbeb08c,fixed(pack),6);
   loft([[1.22,.038,.045,s*.21,-.32],[1.39,.040,.047,s*.21,-.32],[1.42,.029,.034,s*.21,-.32]],s<0?0x6f8d83:0x8d795c,fixed(pack),10);
  }
  // Stitched lid edge and rolled sleeping pad are part of the same pack range.
  loft([[1.48,.189,.135,0,-.286],[1.492,.189,.135,0,-.286]],0xb9a887,fixed(packLid),12);
  for(let i=-3;i<=3;i++)ellipsoid(i*.058,.872,-.32,.043,.075,.079,i%2?0x556f70:0x708481,pack,8);
 }
}
