export const R = 8.31446261815324;
const SQRT2 = Math.sqrt(2);

export function cubicRoots(a2,a1,a0){
  const p=a1-a2*a2/3, q=2*a2**3/27-a2*a1/3+a0;
  const d=q*q/4+p*p*p/27;
  if(d>1e-18){const u=Math.cbrt(-q/2+Math.sqrt(d)),v=Math.cbrt(-q/2-Math.sqrt(d));return [u+v-a2/3];}
  if(Math.abs(d)<=1e-18){const u=Math.cbrt(-q/2);return [...new Set([2*u-a2/3,-u-a2/3])].sort((a,b)=>a-b);}
  const r=2*Math.sqrt(-p/3), theta=Math.acos(Math.max(-1,Math.min(1,(3*q/(2*p))*Math.sqrt(-3/p))));
  return [0,1,2].map(k=>r*Math.cos((theta-2*Math.PI*k)/3)-a2/3).sort((a,b)=>a-b);
}

export function eosParameters(model, substance, T){
  const {Tc,Pc,omega}=substance, pc=Pc*1e6, tr=T/Tc;
  if(!(Tc>0&&pc>0&&T>0)) throw new Error('Critical constants and temperature must be positive.');
  let a,b,daDT=0;
  if(model==='vdw'){
    a=27*R*R*Tc*Tc/(64*pc); b=R*Tc/(8*pc);
  }else if(model==='rk'){
    const ac=0.42748*R*R*Math.pow(Tc,2.5)/pc;
    a=ac/Math.sqrt(T); daDT=-0.5*a/T; b=0.08664*R*Tc/pc;
  }else if(model==='srk'){
    const m=0.48085+1.574*omega-0.176*omega*omega;
    const f=1+m*(1-Math.sqrt(tr));
    const alpha=f*f, dalpha=-f*m/(Tc*Math.sqrt(tr));
    const ac=0.42747*R*R*Tc*Tc/pc;
    a=ac*alpha; daDT=ac*dalpha; b=0.08664*R*Tc/pc;
  }else{
    const m=0.37464+1.54226*omega-0.26992*omega*omega;
    const f=1+m*(1-Math.sqrt(tr));
    const alpha=f*f, dalpha=-f*m/(Tc*Math.sqrt(tr));
    const ac=0.45724*R*R*Tc*Tc/pc;
    a=ac*alpha; daDT=ac*dalpha; b=0.07780*R*Tc/pc;
  }
  return {a,b,daDT};
}

export function pureEOS(model, substance, T, Pmpa){
  if(!Number.isFinite(T)||!Number.isFinite(Pmpa)||T<=0||Pmpa<=0) throw new Error('T and P must be positive finite values.');
  const P=Pmpa*1e6, {a,b,daDT}=eosParameters(model,substance,T), A=a*P/(R*R*T*T), B=b*P/(R*T);
  let coeff;
  if(model==='vdw') coeff=[-(1+B),A,-A*B];
  else if(model==='pr') coeff=[-(1-B),A-3*B*B-2*B,-(A*B-B*B-B**3)];
  else coeff=[-1,A-B-B*B,-A*B];
  const roots=cubicRoots(...coeff).filter(z=>z>B+1e-10);
  if(!roots.length) throw new Error('No physically admissible real compressibility root was found.');
  const rootResults=roots.map(Z=>{
    let lnPhi;
    if(model==='pr') lnPhi=Z-1-Math.log(Z-B)-A/(2*SQRT2*B)*Math.log((Z+(1+SQRT2)*B)/(Z+(1-SQRT2)*B));
    else if(model==='vdw') lnPhi=Z-1-Math.log(Z-B)-A/Z;
    else lnPhi=Z-1-Math.log(Z-B)-A/B*Math.log(1+B/Z);
    let hR;
    if(model==='pr') hR=R*T*(Z-1)+(T*daDT-a)/(2*SQRT2*b)*Math.log((Z+(1+SQRT2)*B)/(Z+(1-SQRT2)*B));
    else if(model==='vdw') hR=R*T*(Z-1)-a/(Z*R*T/P);
    else hR=R*T*(Z-1)+(T*daDT-a)/b*Math.log(1+B/Z);
    const sR=hR/T-R*lnPhi;
    return {Z,Vm:Z*R*T/P,phi:Math.exp(lnPhi),lnPhi,hResidual:hR/1000,sResidual:sR/1000};
  });
  return {model,T,Pmpa,Tr:T/substance.Tc,Pr:Pmpa/substance.Pc,A,B,roots:rootResults,liquid:rootResults[0],vapor:rootResults[rootResults.length-1],rootCount:rootResults.length,warning:substance.status==='provisional'?'Substance constants are provisional; verify against a primary source before engineering use.':''};
}

export function pressureFromVolume(model, substance, T, Vm){
  const {a,b}=eosParameters(model,substance,T);
  if(Vm<=b) return NaN;
  if(model==='vdw') return (R*T/(Vm-b)-a/(Vm*Vm))/1e6;
  if(model==='rk') return (R*T/(Vm-b)-a/(Vm*(Vm+b)))/1e6;
  if(model==='srk') return (R*T/(Vm-b)-a/(Vm*(Vm+b)))/1e6;
  return (R*T/(Vm-b)-a/(Vm*(Vm+b)+b*(Vm-b)))/1e6;
}

export function wilsonVLE({mode,T,P,z1,sub1,sub2,k12=0}){
  if(k12>=1) throw new Error('k12 must be less than 1 for this Wilson estimate.');
  const z=[z1,1-z1], comps=[sub1,sub2];
  const psat=c=>c.Pc*Math.exp(5.373*(1+c.omega)*(1-c.Tc/T));
  const ps=comps.map(psat);
  const solve=(fn,lo,hi)=>{let fl=fn(lo),fh=fn(hi);if(fl*fh>0)throw new Error('Could not bracket the requested VLE root; revise the input range.');for(let i=0;i<100;i++){const m=(lo+hi)/2,fm=fn(m);if(Math.abs(fm)<1e-10||hi-lo<1e-8)return m;if(fl*fm<=0){hi=m;fh=fm;}else{lo=m;fl=fm;}}return (lo+hi)/2;};
  let p=P,t=T;
  if(mode==='bubbleP') p=z[0]*ps[0]+z[1]*ps[1];
  if(mode==='dewP') p=1/(z[0]/ps[0]+z[1]/ps[1]);
  if(mode==='bubbleT'){
    const fn=tt=>comps.reduce((s,c,i)=>s+z[i]*c.Pc*Math.exp(5.373*(1+c.omega)*(1-c.Tc/tt))/P,0)-1;
    t=solve(fn,Math.max(80,Math.min(...comps.map(c=>c.Tc))*0.65),Math.max(...comps.map(c=>c.Tc))*4);
  }
  if(mode==='dewT'){
    const fn=tt=>comps.reduce((s,c,i)=>s+z[i]*P/(c.Pc*Math.exp(5.373*(1+c.omega)*(1-c.Tc/tt))),0)-1;
    t=solve(fn,Math.max(80,Math.min(...comps.map(c=>c.Tc))*0.65),Math.max(...comps.map(c=>c.Tc))*4);
  }
  const K=comps.map(c=>c.Pc/P*Math.exp(5.373*(1+c.omega)*(1-c.Tc/t))*(1-k12));
  let beta=0.5;
  if(mode==='flash'){
    const rr=b=>z.reduce((s,zi,i)=>s+zi*(K[i]-1)/(1+b*(K[i]-1)),0);
    const f0=rr(0),f1=rr(1);
    if(f0<=0) beta=0; else if(f1>=0) beta=1; else beta=solve(rr,0,1);
  }else if(mode==='bubbleP'||mode==='bubbleT') beta=1;
  else if(mode==='dewP'||mode==='dewT') beta=0;
  const x=z.map((zi,i)=>zi/(1+beta*(K[i]-1))); const sx=x[0]+x[1]; x[0]/=sx;x[1]/=sx;
  const y=x.map((xi,i)=>xi*K[i]); const sy=y[0]+y[1]; y[0]/=sy;y[1]/=sy;
  return {mode,T:t,P:p,K,beta,x,y,method:'Wilson K-value correlation + Rachford–Rice material balance',warning:'This is an initial engineering estimate, not a rigorous φ–φ EOS flash. Binary interaction parameter is an adjustable assumption, not experimental data.'};
}
