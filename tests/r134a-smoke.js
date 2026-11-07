global.window=global;
require('../assets/js/r134a/helmholtz.js');
const api=global.TJUR134a;
function near(x,y,t,l){if(!Number.isFinite(x)||Math.abs(x-y)>t)throw new Error(l+': '+x+' not within '+t+' of '+y);}
function assert(x,m){if(!x)throw new Error(m);}
const p1=api.satAtT(233.15);
near(p1.p,.05121,.00008,'R134a Psat at -40C');
near(p1.liquid.rho,1417.7,1.5,'R134a liquid density -40C');
near(p1.vapor.v,.36108,.004,'R134a vapor specific volume -40C');
near(p1.hf,148.14,0.08,'R134a hf -40C');
near(p1.hg,374.00,0.08,'R134a hg -40C');
const p2=api.satAtT(273.15);
near(p2.p,.29280,.0001,'R134a Psat at 0C');
near(p2.liquid.rho,1294.8,1.5,'R134a liquid density 0C');
near(p2.hf,200.00,.05,'R134a hf 0C');
near(p2.hg,398.60,.08,'R134a hg 0C');
const p3=api.satAtT(313.15);
near(p3.p,1.0166,.001,'R134a Psat at 40C');
near(p3.hf,256.41,.12,'R134a hf 40C');
near(p3.hg,419.43,.12,'R134a hg 40C');
const back=api.satAtP(p2.P);
near(back.T,273.15,.001,'R134a inverse saturation temperature');
const wet=api.statePX(p2.P,.5);
near(wet.h,(p2.hf+p2.hg)/2,1e-9,'R134a wet mixture enthalpy');
const one=api.statePT(300,1e6,'vapor');
assert(one.h>300&&one.h<500&&one.cp>0,'R134a vapor PT state physical checks');
process.stdout.write('PASS R134a Helmholtz EOS: -40C, 0C and 40C saturation states; P-T reverse; vapor quality and single-phase PT.\n');
