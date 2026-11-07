/* R-134a Helmholtz EOS: Tillner-Roth & Baehr (1994), parameter set from CoolProp.
 * Upstream fluid data: CoolProp/dev/fluids/R134a.json
 * CoolProp data/code distribution is MIT licensed; see licenses/MIT-CoolProp-R134a-Helmholtz.txt.
 * Saturation uses the EOS itself: equal pressure and equal chemical potential of liquid/vapor.
 */
(function(g){
 'use strict';
 const R=8.314471, M=.102032, TRED=374.18, RHOMOLAR_RED=4978.830171, TC=374.21, PC=4.05928e6;
 const A0={a1:-1.019535,a2:9.047135,alog:-1.629789,n:[-9.723916,-3.92717],t:[-.5,-.75]};
 const AR={
  n:[.05586817,.498223,.02458698,.0008570145,.0004788584,-1.800808,.2671641,-.04781652,.01423987,.3324062,-.007485907,.0001017263,-.5184567,-.08692288,.2057144,-.005000457,.0004603262,-.003497836,.006995038,-.01452184,-.0001285458],
  d:[2,1,3,6,6,1,1,2,5,2,2,4,1,4,1,2,4,1,5,3,10],
  t:[-.5,0,0,0,1.5,1.5,2,2,1,3,5,1,5,5,6,10,10,10,18,22,50],
  l:[0,0,0,0,0,0,0,0,1,1,1,2,2,2,2,2,2,3,3,3,4]
 };
 const ANC={
  p:{n:[.4331478287291047,-9.090302559074352,2.1476074125217703,-1.557687007603464,-3.5020328972698604,14.958442337201044],t:[.845,.99,1.14,2.651,4.507,17.235]},
  rhoL:{n:[18.772731940930015,-51.49939472178225,40.793536440596085,-1481.6500471538966,1600.534434298925,-67338.52423732559],t:[.673,.994,1.257,5.783,5.943,19.94]},
  rhoV:{n:[-5.147386240766544,5.34618043286371,-7.611015272838434,-28.85436432788653,-9.079306067130748,64],t:[.476,.966,1.321,8.491,13.463,13.463]}
 };
 const finite=x=>Number.isFinite(x);
 function sumTerms(T,rho){
  if(!(T>0&&rho>0))throw new RangeError('T and molar density must be positive.');
  const tau=TRED/T,delta=rho/RHOMOLAR_RED,lnTau=Math.log(tau),lnDelta=Math.log(delta);
  const a0=lnDelta+A0.a1+A0.a2*tau+A0.alog*lnTau+A0.n.reduce((s,n,i)=>s+n*Math.pow(tau,A0.t[i]),0);
  const a0t=A0.a2+A0.alog/tau+A0.n.reduce((s,n,i)=>s+n*A0.t[i]*Math.pow(tau,A0.t[i]-1),0);
  const a0tt=-A0.alog/(tau*tau)+A0.n.reduce((s,n,i)=>s+n*A0.t[i]*(A0.t[i]-1)*Math.pow(tau,A0.t[i]-2),0);
  let ar=0,ard=0,ardd=0,art=0,artt=0,ardt=0;
  for(let i=0;i<AR.n.length;i++){
   const n=AR.n[i],d=AR.d[i],t=AR.t[i],l=AR.l[i],dl=Math.pow(delta,l),term=n*Math.pow(delta,d)*Math.pow(tau,t)*Math.exp(-dl);
   const Ld=d/delta-(l?l*Math.pow(delta,l-1):0);
   const Ldd=-d/(delta*delta)-(l?l*(l-1)*Math.pow(delta,l-2):0);
   const Lt=t/tau;
   ar+=term;
   ard+=term*Ld;
   ardd+=term*(Ld*Ld+Ldd);
   art+=term*Lt;
   artt+=term*t*(t-1)/(tau*tau);
   ardt+=term*Ld*Lt;
  }
  const alpha=a0+ar,alphat=a0t+art,alphatt=a0tt+artt;
  const p=rho*R*T*(1+delta*ard);
  const umolar=R*T*tau*alphat;
  const hmolar=R*T*(1+tau*alphat+delta*ard);
  const smolar=R*(tau*alphat-alpha);
  const cvmolar=-R*tau*tau*alphatt;
  const den=1+2*delta*ard+delta*delta*ardd;
  const num=1+delta*ard-delta*tau*ardt;
  const cpmolar=cvmolar+R*num*num/den;
  const gRT=1+alpha+delta*ard;
  return {T,rhoMolar:rho,rho:rho*M,v:1/(rho*M),p,delta,tau,alpha,alphar:ar,alphar_delta:ard,alphar_deltadelta:ardd,
   alphar_tau:art,alphar_tautau:artt,alphar_deltatau:ardt,u:umolar/M/1000,h:hmolar/M/1000,s:smolar/M/1000,
   cv:cvmolar/M/1000,cp:cpmolar/M/1000,hmolar,smolar,cvmolar,cpmolar,gRT,Z:1+delta*ard};
 }
 function pOf(T,rho){return sumTerms(T,rho).p;}
 function bisect(fn,lo,hi,iterations=90){
  let flo=fn(lo),fhi=fn(hi);
  if(!finite(flo)||!finite(fhi)||flo*fhi>0)throw new Error('Root bracket is invalid.');
  for(let i=0;i<iterations;i++){
   const mid=(lo+hi)/2,fm=fn(mid);
   if(!finite(fm))throw new Error('Non-finite value during root solve.');
   if(Math.abs(fm)<1e-8||hi-lo<1e-12*Math.max(1,mid))return mid;
   if(flo*fm<=0){hi=mid;fhi=fm;}else{lo=mid;flo=fm;}
  }
  return (lo+hi)/2;
 }
 function densityRoots(T,P,scanN=320){
  if(!(T>0&&P>0))throw new RangeError('T and P must be positive.');
  const min=1e-5,max=RHOMOLAR_RED*2.4,logMin=Math.log(min),logMax=Math.log(max);
  const roots=[];
  let rho0=min,f0;
  try{f0=pOf(T,rho0)-P;}catch(e){f0=NaN;}
  for(let i=1;i<=scanN;i++){
   const rho1=Math.exp(logMin+(logMax-logMin)*i/scanN);
   let f1;try{f1=pOf(T,rho1)-P;}catch(e){f1=NaN;}
   if(finite(f0)&&finite(f1)&&f0*f1<=0){
    try{
     const root=bisect(r=>pOf(T,r)-P,rho0,rho1,70);
     if(!roots.some(v=>Math.abs(v-root)<1e-7*Math.max(1,root)))roots.push(root);
    }catch(e){}
   }
   rho0=rho1;f0=f1;
  }
  return roots.sort((a,b)=>a-b);
 }
 function ancillary(T){
  if(T<169.85||T>TC)throw new RangeError('R-134a saturation range is 169.85–374.21 K.');
  const th=1-T/TC;
  const ps=PC*Math.exp(TC/T*ANC.p.n.reduce((s,n,i)=>s+n*Math.pow(th,ANC.p.t[i]),0));
  const rhoL=5017.053*(1+ANC.rhoL.n.reduce((s,n,i)=>s+n*Math.pow(th,ANC.rhoL.t[i]),0));
  const rhoV=5017.053*Math.exp(TC/T*ANC.rhoV.n.reduce((s,n,i)=>s+n*Math.pow(th,ANC.rhoV.t[i]),0));
  return {p:ps,rhoL,rhoV};
 }
 function rootsAt(T,P){return densityRoots(T,P,500);}
 function satAtT(T){
  if(!(T>=169.85&&T<TC))throw new RangeError('Saturation T must satisfy 169.85 K ≤ T < 374.21 K.');
  const anc=ancillary(T);
  function residual(P){
   const roots=rootsAt(T,P);
   if(roots.length<2)return null;
   const liquid=sumTerms(T,roots[roots.length-1]),vapor=sumTerms(T,roots[0]);
   return {f:liquid.gRT-vapor.gRT,liquid,vapor,roots};
  }
  let bracket=null,prev=null;
  for(let i=0;i<=80;i++){
   const factor=.78+i*.44/80,P=anc.p*factor,r=residual(P);
   if(!r)continue;
   if(prev&&prev.r.f*r.f<=0){bracket=[prev.P,P];break;}
   prev={P,r};
  }
  if(!bracket)throw new Error('R-134a saturation pressure could not be bracketed near the ancillary estimate.');
  let lo=bracket[0],hi=bracket[1],rlo=residual(lo),midR=null,midP=NaN;
  for(let i=0;i<75;i++){
   midP=(lo+hi)/2;midR=residual(midP);
   if(!midR){lo=midP;continue;}
   if(Math.abs(midR.f)<2e-11)break;
   if(rlo.r.f*midR.f<=0)hi=midP;else{lo=midP;rlo={r:midR};}
  }
  if(!midR)throw new Error('R-134a saturation root did not converge.');
  return {T,P:midP,p:midP/1e6,liquid:midR.liquid,vapor:midR.vapor,
   hf:midR.liquid.h,hg:midR.vapor.h,hfg:midR.vapor.h-midR.liquid.h,
   sf:midR.liquid.s,sg:midR.vapor.s,sfg:midR.vapor.s-midR.liquid.s,
   vf:midR.liquid.v,vg:midR.vapor.v,residual:midR.f,iterations:75,ancillaryPressure:anc.p};
 }
 function satAtP(P){
  if(!(P>0&&P<PC))throw new RangeError('Saturation P must be between 0 and 4.05928 MPa.');
  const pMin=satAtT(169.85).P;
  if(P<pMin)throw new RangeError('Pressure is below the R-134a triple-point saturation pressure.');
  let lo=169.85,hi=TC-0.015;
  for(let i=0;i<45;i++){
   const mid=(lo+hi)/2,pm=satAtT(mid).P;
   if(pm>P)hi=mid;else lo=mid;
  }
  const T=(lo+hi)/2;
  return satAtT(T);
 }
 function statePT(T,P,phase,scanN=320){
  if(!(T>=169.85&&T<=455)||!(P>0&&P<=70e6))throw new RangeError('R-134a validity: T 169.85–455 K; P up to 70 MPa.');
  let chosenPhase=phase;
  if(!chosenPhase&&T<TC&&T>=169.85&&P<PC*.999){
   chosenPhase=P<ancillary(T).p?'vapor':'liquid';
  }
  const roots=densityRoots(T,P,scanN);
  if(!roots.length)throw new Error('No R-134a density root found at the requested T/P.');
  const rho=(chosenPhase==='liquid')?roots[roots.length-1]:roots[0];
  const st=sumTerms(T,rho);
  return {...st,P,P_MPa:P/1e6,phase:chosenPhase||'single-phase',roots:roots.length};
 }
 function statePX(P,x){
  if(!(x>=0&&x<=1))throw new RangeError('Vapor quality x must be between 0 and 1.');
  const sat=satAtP(P),v=sat.liquid.v+x*(sat.vapor.v-sat.liquid.v);
  return {T:sat.T,P, P_MPa:P/1e6,phase:x===0?'saturated liquid':x===1?'saturated vapor':'two-phase mixture',x,
   rho:1/v,v,h:sat.hf+x*sat.hfg,s:sat.sf+x*sat.sfg,cp:null,cv:null,
   liquid:sat.liquid,vapor:sat.vapor,saturation:sat};
 }
 function pHCurve(options={}){
  const tMin=options.tMin||175,tMax=options.tMax||370,tN=options.tN||52;
  const liquid=[],vapor=[],quality={};
  for(let q=1;q<=9;q++)quality[q/10]=[];
  const saturation=[];
  for(let i=0;i<tN;i++){
   const T=tMin+(tMax-tMin)*i/(tN-1);
   try{
    const sat=satAtT(T);
    saturation.push({T,P_MPa:sat.p,hf:sat.hf,hg:sat.hg});
    liquid.push([sat.hf,Math.log10(sat.p)]);vapor.push([sat.hg,Math.log10(sat.p)]);
    for(let q=1;q<=9;q++){const x=q/10;quality[x].push([sat.hf+x*sat.hfg,Math.log10(sat.p)]);}
   }catch(e){}
  }
  const isoT=[];
  const temperatures=options.isotherms||[180,200,220,240,260,280,300,320,340,360,380,400];
  for(const T of temperatures){
   if(T<169.85||T>455)continue;
   const points=[];
   const pHi=Math.min(10e6,options.maxPressurePa||10e6),pLo=2e3;
   for(let j=0;j<28;j++){
    const P=Math.exp(Math.log(pLo)+(Math.log(pHi)-Math.log(pLo))*j/27);
    if(T<TC && P<PC*.999){
     try{const ps=satAtT(T).P;if(Math.abs(P-ps)<Math.max(100,ps*.012))continue;}catch(e){}
    }
    try{const st=statePT(T,P,undefined,170);points.push([st.h,Math.log10(P/1e6)]);}catch(e){}
   }
   isoT.push({T,data:points});
  }
  return {liquid,vapor,quality,saturation,isotherms:isoT};
 }
 g.TJUR134a=Object.freeze({sumTerms,statePT,statePX,satAtT,satAtP,densityRoots,pHCurve,constants:{R,M,TRED,RHOMOLAR_RED,TC,PC}});
})(typeof window!=='undefined'?window:globalThis);
