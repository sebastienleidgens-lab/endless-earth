// Original implementation of Paul Schlyter's published low-precision orbital
// elements and lunar perturbations (stjarnhimlen.se/comp/ppcomp.html).
// Approximate topocentric position, not an ephemeris for navigation/eclipses.
const R=Math.PI/180, tau=2*Math.PI, sin=x=>Math.sin(x*R),cos=x=>Math.cos(x*R),wrap=x=>((x%360)+360)%360;
const clamp=x=>Math.max(-1,Math.min(1,x));
export function lunar(date,latitude,longitude){
 const ms=+new Date(date);if(!Number.isFinite(ms)||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude))throw new RangeError('Invalid lunar observer/date');
 const d=ms/86400000-10956,ob=(23.4393-3.563e-7*d)*R;
 const N=wrap(125.1228-.0529538083*d),i=5.1454,w=wrap(318.0634+.1643573223*d),a=60.2666,e=.054900,M=wrap(115.3654+13.0649929509*d);
 const ws=wrap(282.9404+4.70935e-5*d),Ms=wrap(356.0470+.9856002585*d),Ls=wrap(ws+Ms),es=.016709-1.151e-9*d;
 const Es=(Ms+(180/Math.PI)*es*sin(Ms)*(1+es*cos(Ms)))*R,vs=Math.atan2(Math.sqrt(1-es*es)*Math.sin(Es),Math.cos(Es)-es),slon=vs+ws*R;
 let E=(M+(180/Math.PI)*e*sin(M)*(1+e*cos(M)))*R;for(let j=0;j<4;j++)E-=(E-e*Math.sin(E)-M*R)/(1-e*Math.cos(E));
 const v=Math.atan2(Math.sqrt(1-e*e)*Math.sin(E),Math.cos(E)-e),r=a*(1-e*Math.cos(E)),u=v+w*R;
 const x=r*(cos(N)*Math.cos(u)-sin(N)*Math.sin(u)*cos(i)),y=r*(sin(N)*Math.cos(u)+cos(N)*Math.sin(u)*cos(i)),z=r*Math.sin(u)*sin(i);
 let lon=Math.atan2(y,x)/R,lat=Math.atan2(z,Math.hypot(x,y))/R;
 const Lm=wrap(N+w+M),D=wrap(Lm-Ls),F=wrap(Lm-N);
 lon+=-1.274*sin(M-2*D)+.658*sin(2*D)-.186*sin(Ms)-.059*sin(2*M-2*D)-.057*sin(M-2*D+Ms)+.053*sin(M+2*D)+.046*sin(2*D-Ms)+.041*sin(M-Ms)-.035*sin(D)-.031*sin(M+Ms)-.015*sin(2*F-2*D)+.011*sin(M-4*D);
 lat+=-.173*sin(F-2*D)-.055*sin(M-F-2*D)-.046*sin(M+F-2*D)+.033*sin(F+2*D)+.017*sin(2*M+F);
 const distanceEarthRadii=r-.58*cos(M-2*D)-.46*cos(2*D);
 const ex=cos(lon)*cos(lat),ey=sin(lon)*cos(lat)*Math.cos(ob)-sin(lat)*Math.sin(ob),ez=sin(lon)*cos(lat)*Math.sin(ob)+sin(lat)*Math.cos(ob);
 const ra=Math.atan2(ey,ex),decl=Math.asin(clamp(ez)),jd=ms/86400000+2440587.5,T=(jd-2451545)/36525,sidereal=wrap(280.46061837+360.98564736629*(jd-2451545)+.000387933*T*T-T*T*T/38710000)*R;
 const L=latitude*R,H=sidereal+longitude*R-ra;
 // Subtract the observer in Earth radii before the horizon transformation.
 const north=distanceEarthRadii*(Math.cos(L)*Math.sin(decl)-Math.sin(L)*Math.cos(decl)*Math.cos(H));
 const east=-distanceEarthRadii*Math.cos(decl)*Math.sin(H);
 const up=distanceEarthRadii*(Math.sin(L)*Math.sin(decl)+Math.cos(L)*Math.cos(decl)*Math.cos(H))-1;
 const altitude=Math.atan2(up,Math.hypot(north,east)),azimuth=((Math.atan2(east,north)%tau)+tau)%tau;
 const elongation=Math.acos(clamp(cos(lat)*Math.cos(lon*R-slon))),illumination=(1-Math.cos(elongation))/2,phase=wrap(lon-slon/R)/360;
 const sunRA=Math.atan2(Math.sin(slon)*Math.cos(ob),Math.cos(slon)),sunDecl=Math.asin(Math.sin(slon)*Math.sin(ob)),deltaRA=sunRA-ra;
 const brightLimbAngle=Math.atan2(Math.cos(sunDecl)*Math.sin(deltaRA),Math.sin(sunDecl)*Math.cos(decl)-Math.cos(sunDecl)*Math.sin(decl)*Math.cos(deltaRA));
 return {date:new Date(ms).toISOString(),altitude,azimuth,phase,illumination,brightLimbAngle,parallacticAngle:Math.atan2(Math.sin(H),Math.tan(L)*Math.cos(decl)-Math.sin(decl)*Math.cos(H)),distanceKm:distanceEarthRadii*6378.14,angularRadius:Math.asin(1737.4/(Math.hypot(north,east,up)*6378.14)),geometricallyVisible:altitude>0,direction:[Math.sin(azimuth)*Math.cos(altitude),Math.sin(altitude),-Math.cos(azimuth)*Math.cos(altitude)]};
}
export function lunarVisibility(moon,{cloud=0,mist=0,rain=0}={},day=0){
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 return smooth(-moon.angularRadius,moon.angularRadius*2,moon.altitude)*(1-smooth(.62,.88,cloud))*(1-.9*mist)*(1-.85*rain)*smooth(.003,.045,moon.illumination)*(1-day*.72);
}
