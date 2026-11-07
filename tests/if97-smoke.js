/* IF97 smoke regression checks using publicly documented upstream reference values. */
global.window = global;
require('../assets/vendor/iapws97-browser.js');

const { PT, PH, PS, HS } = global.ThermoIF97;
function near(actual, expected, tolerance, label) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
    throw new Error(label + ': got ' + actual + ', expected ' + expected + ' ± ' + tolerance);
  }
}
let count = 0;
function check(label, fn) { fn(); count++; process.stdout.write('PASS ' + label + '\n'); }

check('bundle exposes PT/PH/PS/HS', () => {
  for (const name of ['PT','PH','PS','HS']) if (!global.ThermoIF97[name]) throw new Error('Missing ' + name);
});
check('Region 1 PT reference', () => {
  const r = PT.solve(3, 300);
  near(r.v, 0.00100215168, 5e-12, 'v');
  near(r.h, 115.331273, 5e-6, 'h');
  near(r.s, 0.392294792, 5e-10, 's');
  near(r.cp, 4.17301218, 5e-8, 'cp');
});
check('Region 2 PT reference', () => {
  const r = PT.solve(0.0035, 300);
  near(r.v, 39.4913866, 5e-7, 'v');
  near(r.h, 2549.91145, 5e-5, 'h');
  near(r.s, 8.52238967, 5e-8, 's');
});
check('Region 3 PT reference', () => {
  const r = PT.solve(50, 630);
  near(r.v, 0.001470853100, 5e-13, 'v');
});
check('Region 5 PT reference', () => {
  const r = PT.solve(0.5, 1500);
  near(r.v, 1.3845509, 5e-7, 'v');
});
check('Region 4 saturation pressure reference', () => {
  near(PT.r4_T_Psat(300), 0.00353658941, 5e-12, 'Psat(300K)');
  near(PT.r4_T_Psat(500), 2.63889776, 5e-8, 'Psat(500K)');
  near(PT.r4_T_Psat(600), 12.3443146, 5e-7, 'Psat(600K)');
});
check('Region 4 saturation temperature reference', () => {
  near(PT.r4_P_Tsat(0.1), 372.755919, 5e-7, 'Tsat(0.1MPa)');
  near(PT.r4_P_Tsat(1), 453.035632, 5e-7, 'Tsat(1MPa)');
  near(PT.r4_P_Tsat(10), 584.149488, 5e-7, 'Tsat(10MPa)');
});
check('P-h backward equation reference', () => {
  near(PH.solve(3, 500).t, 391.798509, 5e-7, 'T(P=3MPa,h=500)');
});
check('P-s backward equation reference', () => {
  near(PS.solve(3, 0.5).t, 307.842258, 5e-7, 'T(P=3MPa,s=0.5)');
});
check('h-s backward equation reference', () => {
  near(HS.solve(2800, 6.5).p, 1371012.767, 5e-3, 'P(h=2800,s=6.5)');
});
process.stdout.write('IF97 smoke checks passed: ' + count + '\n');
