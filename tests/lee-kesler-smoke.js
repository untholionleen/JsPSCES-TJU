/* Lee-Kesler pure-fluid BWR regression tests.
 * Public reference: UBC Open Education Resources, Example 3.5:
 * Tr=1.5, Pr=3.0, simple-fluid Z reported to three decimals as 0.789.
 */
global.window=global;
require('../assets/js/eos/lee-kesler.js');
const lk=global.TJULeeKesler;
function assert(x,m){if(!x)throw new Error(m);}
function near(x,y,t,m){if(!Number.isFinite(x)||Math.abs(x-y)>t)throw new Error(m+': '+x+' != '+y);}
const simple=lk.calculate(1.5,3,0,'vapor');
near(simple.Z0,.78867402835,2e-7,'Lee-Kesler simple-fluid Z');
near(simple.Z,.78867402835,2e-7,'omega=0 interpolation identity');
assert(Number.isFinite(simple.lnphi)&&Number.isFinite(simple.HR_kJ_mol)&&Number.isFinite(simple.SR_J_molK),'Residual properties should be finite');
assert(Math.abs(simple.phi-Math.exp(simple.lnphi))<1e-12,'phi and lnphi consistency');
const methaneLike=lk.calculate(1.5,3,.011,'vapor');
near(methaneLike.Z, simple.Z0 + .011/.3978*(simple.Zr-simple.Z0),1e-12,'acentric interpolation identity');
const low=lk.calculate(1.5,.01,.011,'vapor');
assert(Math.abs(low.Z-1)<.02,'Low-pressure Z should approach ideal-gas limit');
const curve=lk.curve(1.5,.011,'vapor',10,25);
assert(curve.length===25&&curve.every(r=>Number.isFinite(r.Pr)),'Curve output length and reduced pressure');
const liquid=lk.calculate(.85,1,.2,'liquid');
assert(liquid.VrSimple>0&&liquid.Z>0,'Liquid branch should return a positive volume and Z');
process.stdout.write('PASS Lee-Kesler Tr=1.5 Pr=3 simple-fluid Z='+simple.Z.toFixed(8)+'; reference-fluid Z='+simple.Zr.toFixed(8)+'\n');
process.stdout.write('PASS Lee-Kesler acentric interpolation, low-pressure limit, residual properties, curve and liquid branch\n');
