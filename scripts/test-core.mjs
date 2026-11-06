import { runCoreTests, pureEOS, modifiedRaoultDew, prMixtureFugacity } from '../assets/core.js';
import { SUBSTANCES } from '../assets/data.js';

const checks = runCoreTests();
let failed = checks.filter(x => !x.pass);
console.log(`Core tests: ${checks.length - failed.length}/${checks.length} passed`);
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.error ? `: ${item.error}` : ''}`);

const methane = SUBSTANCES.find(x => x.cas === '74-82-8');
const ethane = SUBSTANCES.find(x => x.cas === '74-84-0');
try {
  const pure = pureEOS('PR', 350, 20, { tc: ethane.tc, pc: ethane.pc, omega: ethane.omega });
  if (!(pure.z_selected > 0 && pure.fugacity_coefficient > 0)) throw new Error('invalid PR outputs');
  console.log('PASS integration: pure PR calculation');
} catch (e) { failed.push({name:'integration pure PR',error:e.message}); console.error('FAIL integration: pure PR',e); }
try {
  const dew = modifiedRaoultDew(0.4, 1.2, 0.8, 1.1, 1.0);
  if (!(dew.P_bar > 0 && dew.x1 >= 0 && dew.x1 <= 1)) throw new Error('invalid dew result');
  console.log('PASS integration: modified-Raoult dew point');
} catch (e) { failed.push({name:'integration dew',error:e.message}); console.error('FAIL integration: dew',e); }
try {
  const mix = prMixtureFugacity(313.15, 15, [methane,ethane], [0.5,0.5], 0, 'vapor');
  if (!(mix.Z > 0 && mix.phi.every(v => v > 0))) throw new Error('invalid mixture outputs');
  console.log('PASS integration: PR binary fugacity');
} catch (e) { failed.push({name:'integration mix',error:e.message}); console.error('FAIL integration: mixture',e); }

if (failed.length) process.exitCode = 1;
