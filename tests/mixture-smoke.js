/* PR phi-phi flash mass-balance and fugacity-equality regression tests. */
global.window = global;
require('../assets/js/eos/mixture.js');
const api = global.ThermoMixture;
function assert(condition, message) { if (!condition) throw new Error(message); }
function near(a,b,tol,label){ if(!Number.isFinite(a)||Math.abs(a-b)>tol) throw new Error(label+': '+a+' vs '+b); }
const all=api.components;
const list=[all.find(c=>c[0]==='methane'),all.find(c=>c[0]==='ethane')];
const z=[0.5,0.5];
const r=api.flash(250,5e6,list,z,0);
assert(r.phase==='气液两相','Expected a two-phase CH4/C2H6 flash, got '+r.phase);
assert(r.beta>0&&r.beta<1,'Vapor fraction must be between zero and one');
near(r.x.reduce((a,b)=>a+b,0),1,1e-10,'liquid normalization');
near(r.y.reduce((a,b)=>a+b,0),1,1e-10,'vapor normalization');
for(let i=0;i<2;i++) near((1-r.beta)*r.x[i]+r.beta*r.y[i],r.z[i],1e-8,'component material balance '+i);
assert(r.fugacityResidual<1e-7,'Fugacity equality residual too high: '+r.fugacityResidual);
assert(r.residual<1e-8,'K iteration residual too high: '+r.residual);
process.stdout.write('PASS PR flash CH4/C2H6: beta='+r.beta.toFixed(8)+', max fugacity residual='+r.fugacityResidual.toExponential(3)+'\n');
