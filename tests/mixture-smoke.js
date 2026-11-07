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


function equilibriumResidual(T,P,list,x,y,kij) {
  const l=api.fugacity(T,P,list,x,kij,'L');
  const v=api.fugacity(T,P,list,y,kij,'V');
  return Math.max(...x.map((xi,i)=>Math.abs(Math.log(xi*l.phi[i]/(y[i]*v.phi[i])))));
}
const bubble=api.bubblePoint(180,list,z,0);
assert(bubble.P>0&&bubble.P<100e6,'Bubble pressure outside scan range');
near(bubble.x.reduce((a,b)=>a+b,0),1,1e-10,'bubble liquid composition');
near(bubble.y.reduce((a,b)=>a+b,0),1,1e-10,'bubble vapor composition');
assert(Math.abs(bubble.residual)<1e-8,'Bubble pressure residual too high');
assert(equilibriumResidual(180,bubble.P,list,bubble.x,bubble.y,0)<1e-7,'Bubble fugacity equality failed');
process.stdout.write('PASS CH4/C2H6 bubble point: P='+(bubble.P/1e6).toFixed(7)+' MPa\\n');

const dew=api.dewPoint(180,list,z,0);
assert(dew.P>0&&dew.P<100e6,'Dew pressure outside scan range');
near(dew.x.reduce((a,b)=>a+b,0),1,1e-10,'dew liquid composition');
near(dew.y.reduce((a,b)=>a+b,0),1,1e-10,'dew vapor composition');
assert(Math.abs(dew.residual)<1e-8,'Dew pressure residual too high');
assert(equilibriumResidual(180,dew.P,list,dew.x,dew.y,0)<1e-7,'Dew fugacity equality failed');
process.stdout.write('PASS CH4/C2H6 dew point: P='+(dew.P/1e6).toFixed(7)+' MPa\\n');
