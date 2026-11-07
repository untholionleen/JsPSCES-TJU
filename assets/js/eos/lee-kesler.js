/* Pure-fluid Lee-Kesler three-parameter corresponding-states correlation.
 * BWR reduced-volume form; simple-fluid and reference-fluid interpolation.
 * References: Lee & Kesler, AIChE J. 21 (1975) 510-527;
 * DWSIM User Guide, Thermodynamic Properties / Lee-Kesler;
 * UBC Open Education Resources, Example 3.5 (Tr=1.5, Pr=3, Z0=0.789).
 */
(function(g){
  'use strict';
  const R=8.31446261815324, OMEGA_REF=.3978;
  const CONSTANTS={
    simple:{b1:.1181193,b2:.265728,b3:.154790,b4:.030323,c1:.0236744,c2:.0186984,c3:0,c4:.042724,d1:.155488e-4,d2:.623689e-4,beta:.65392,gamma:.060167},
    reference:{b1:.2026579,b2:.331511,b3:.027655,b4:.203488,c1:.0313385,c2:.0503618,c3:.016901,c4:.041577,d1:.48736e-4,d2:.0740336e-4,beta:1.226,gamma:.03754}
  };
  function coefficients(Tr,c){
    const B=c.b1-c.b2/Tr-c.b3/(Tr*Tr)-c.b4/(Tr*Tr*Tr);
    const C=c.c1-c.c2/Tr+c.c3/(Tr*Tr*Tr);
    const D=c.d1+c.d2/Tr;
    const EBase=c.c4/(2*Tr*Tr*Tr*c.gamma);
    return {B,C,D,EBase};
  }
  function zAtVolume(Tr,Vr,c){
    const k=coefficients(Tr,c),v2=Vr*Vr,exp=Math.exp(-c.gamma/v2);
    const z=1+k.B/Vr+k.C/v2+k.D/(v2*v2*Vr)+
      c.c4/(Tr*Tr*Tr*v2)*(c.beta+c.gamma/v2)*exp;
    return {z,...k,E:k.EBase*(c.beta+1-(c.beta+1+c.gamma/v2)*exp)};
  }
  function solveRoots(Tr,Pr,c){
    if(!(Tr>0)||!(Pr>0)||!Number.isFinite(Tr)||!Number.isFinite(Pr))throw new RangeError('Tr 和 Pr 必须是有限正数。');
    const f=Vr=>zAtVolume(Tr,Vr,c).z*Tr/Vr-Pr;
    const roots=[];
    const n=1400,loExp=-2.5,hiExp=3.2;
    let x0=Math.pow(10,loExp),f0=f(x0);
    for(let i=1;i<=n;i++){
      const x1=Math.pow(10,loExp+(hiExp-loExp)*i/n),f1=f(x1);
      if(Number.isFinite(f0)&&Number.isFinite(f1)&&f0*f1<=0){
        let lo=x0,hi=x1,flo=f0;
        for(let j=0;j<80;j++){
          const mid=(lo+hi)/2,fm=f(mid);
          if(!Number.isFinite(fm))break;
          if(Math.abs(fm)<2e-14||hi-lo<1e-13*Math.max(1,mid)){lo=hi=mid;break;}
          if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}
        }
        const root=(lo+hi)/2;
        if(!roots.some(v=>Math.abs(v-root)<1e-8*Math.max(1,root)))roots.push(root);
      }
      x0=x1;f0=f1;
    }
    return roots.sort((a,b)=>a-b);
  }
  function fluidState(Tr,Pr,c,phase){
    const roots=solveRoots(Tr,Pr,c);
    if(!roots.length)throw new Error('Lee–Kesler BWR 方程在当前 Tr/Pr 范围内未找到体积根。请检查状态或避开求根区间外状态。');
    const Vr=phase==='liquid'?roots[0]:roots[roots.length-1];
    const v=zAtVolume(Tr,Vr,c),Z=v.z;
    if(!(Z>0))throw new Error('计算得到非正压缩因子，无法继续计算逸度与剩余性质。');
    const lnphi=Z-1-Math.log(Z)+v.B/Vr+v.C/(2*Vr*Vr)+v.D/(5*Math.pow(Vr,5))+v.E;
    const hdepRTc=Tr*(Z-1-
      (c.b2+2*c.b3/Tr+3*c.b4/(Tr*Tr))/(Tr*Vr)-
      (c.c2-3*c.c3/(Tr*Tr))/(2*Tr*Vr*Vr)+
      c.d2/(5*Math.pow(Vr,5))+3*v.E);
    const hdepRT=hdepRTc/Tr;
    const sdepR=hdepRT-lnphi;
    return {Vr,Z,lnphi,phi:Math.exp(lnphi),hdepRTc,hdepRT,sdepR,roots};
  }
  function calculate(Tr,Pr,omega,phase='vapor'){
    if(!Number.isFinite(omega)||omega<-.5||omega>1.5)throw new RangeError('偏心因子 ω 需在 -0.5 到 1.5 范围内。');
    if(phase!=='vapor'&&phase!=='liquid')throw new Error('相态选择应为 vapor 或 liquid。');
    const simple=fluidState(Tr,Pr,CONSTANTS.simple,phase);
    const reference=fluidState(Tr,Pr,CONSTANTS.reference,phase);
    const weight=omega/OMEGA_REF;
    const Z=simple.Z+weight*(reference.Z-simple.Z);
    const lnphi=simple.lnphi+weight*(reference.lnphi-simple.lnphi);
    const hdepRTc=simple.hdepRTc+weight*(reference.hdepRTc-simple.hdepRTc);
    const hdepRT=hdepRTc/Tr;
    const sdepR=hdepRT-lnphi;
    return {Tr,Pr,omega,phase,Z,lnphi,phi:Math.exp(lnphi),fugacityReduced:Math.exp(lnphi)*Pr,
      hdepRTc,hdepRT,sdepR,HR_kJ_mol:hdepRTc*R*1e-3,
      SR_J_molK:sdepR*R,VrSimple:simple.Vr,VrReference:reference.Vr,
      Z0:simple.Z,Zr:reference.Z,lnphi0:simple.lnphi,lnphir:reference.lnphi,
      simple,reference,omegaReference:OMEGA_REF};
  }
  function curve(Tr,omega,phase='vapor',maxPr=10,n=140){
    const rows=[];
    for(let i=0;i<n;i++){
      const Pr=Math.exp(Math.log(.01)+(Math.log(maxPr)-Math.log(.01))*i/(n-1));
      try{const r=calculate(Tr,Pr,omega,phase);rows.push({Pr,Z:r.Z,Z0:r.Z0,Zr:r.Zr,phi:r.phi,HR_kJ_mol:r.HR_kJ_mol,SR_J_molK:r.SR_J_molK})}
      catch(e){rows.push({Pr,Z:null,Z0:null,Zr:null,phi:null,HR_kJ_mol:null,SR_J_molK:null,error:e.message})}
    }
    return rows;
  }
  g.TJULeeKesler=Object.freeze({calculate,curve,solveRoots,fluidState,constants:CONSTANTS,omegaReference:OMEGA_REF});
})(typeof window!=='undefined'?window:globalThis);
