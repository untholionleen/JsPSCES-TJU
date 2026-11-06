import { R, SATURATION_ROWS } from './data.js';

export function cubicRoots(a, b, c) {
  // x^3 + a x^2 + b x + c = 0, sorted real roots.
  const p = b - a * a / 3;
  const q = 2 * a ** 3 / 27 - a * b / 3 + c;
  const disc = q * q / 4 + p ** 3 / 27;
  const shift = a / 3;
  const eps = 1e-13;
  if (disc > eps) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(disc));
    const v = Math.cbrt(-q / 2 - Math.sqrt(disc));
    return [u + v - shift];
  }
  if (Math.abs(disc) <= eps) {
    const u = Math.cbrt(-q / 2);
    return [...new Set([2 * u - shift, -u - shift])].sort((x, y) => x - y);
  }
  const radius = 2 * Math.sqrt(-p / 3);
  const arg = Math.max(-1, Math.min(1, (3 * q / (2 * p)) * Math.sqrt(-3 / p)));
  const theta = Math.acos(arg) / 3;
  return [0, 1, 2].map(k => radius * Math.cos(theta - 2 * Math.PI * k / 3) - shift).sort((x, y) => x - y);
}

function pureParameters(kind, T, c) {
  const Tc = Number(c.tc), Pc = Number(c.pc) * 1e6, w = Number(c.omega);
  if (!(T > 0 && Tc > 0 && Pc > 0) || ![T,Tc,Pc,w].every(Number.isFinite)) throw new Error('T、Tc、Pc、ω 输入无效。');
  const Tr = T / Tc;
  if (kind === 'VDW') return { a: 27 / 64 * R ** 2 * Tc ** 2 / Pc, b: R * Tc / (8 * Pc), dadT: 0 };
  if (kind === 'RK') {
    const a = 0.42748 * R ** 2 * Tc ** 2.5 / (Pc * Math.sqrt(T));
    return { a, b: 0.08664 * R * Tc / Pc, dadT: -0.5 * a / T };
  }
  const isSRK = kind === 'SRK';
  const m = isSRK ? 0.480 + 1.574 * w - 0.176 * w ** 2 : 0.37464 + 1.54226 * w - 0.26992 * w ** 2;
  const ac = (isSRK ? 0.42747 : 0.45724) * R ** 2 * Tc ** 2 / Pc;
  const b = (isSRK ? 0.08664 : 0.07780) * R * Tc / Pc;
  const term = 1 + m * (1 - Math.sqrt(Tr));
  const alpha = term ** 2;
  const a = ac * alpha;
  const dadT = -ac * m * term / (Math.sqrt(Tr) * Tc);
  return { a, b, dadT };
}

function pureCubicCoefficients(kind, A, B) {
  if (kind === 'VDW') return [-(1 + B), A, -A * B];
  if (kind === 'RK' || kind === 'SRK') return [-1, A - B - B * B, -A * B];
  return [-(1 - B), A - 3 * B * B - 2 * B, -(A * B - B * B - B ** 3)];
}

export function pureEOS(kind, T, Pbar, c) {
  if (!['VDW','RK','SRK','PR'].includes(kind)) throw new Error('该 EOS 暂未启用；PRG 必须在独立公式和参数复核后再开放。');
  const P = Number(Pbar) * 1e5;
  if (!(P > 0 && T > 0)) throw new Error('温度和压力必须大于 0。');
  const par = pureParameters(kind, T, c);
  const A = par.a * P / (R ** 2 * T ** 2);
  const B = par.b * P / (R * T);
  const roots = cubicRoots(...pureCubicCoefficients(kind, A, B)).filter(z => z > B + 1e-10 && Number.isFinite(z));
  if (!roots.length) throw new Error('没有找到满足 Z>B 的物理解；请检查状态点和模型适用范围。');
  const lnphi = z => {
    if (kind === 'VDW') return z - 1 - Math.log(z - B) - A / z;
    if (kind === 'RK' || kind === 'SRK') return z - 1 - Math.log(z - B) - (A / B) * Math.log(1 + B / z);
    const s2 = Math.sqrt(2);
    return z - 1 - Math.log(z - B) - A / (2 * s2 * B) * Math.log((z + (1 + s2) * B) / (z + (1 - s2) * B));
  };
  const selected = roots.length === 1 ? roots[0] : roots[roots.length - 1];
  const phi = Math.exp(lnphi(selected));
  const out = {
    model: kind, temperature_k: T, pressure_bar: Pbar,
    roots, z_vapor_root: roots[roots.length - 1], z_liquid_root: roots[0],
    z_selected: selected, molar_volume_m3_mol: selected * R * T / P,
    fugacity_coefficient: phi, ln_fugacity_coefficient: lnphi(selected),
    fugacity_bar: phi * Pbar,
    A, B, parameters: par,
    root_note: roots.length > 1 ? '存在多个可接受实根；此处默认展示最大根（气相根），小根保留供检查。' : '当前状态点只有一个可接受实根。'
  };
  if (kind === 'PR' || kind === 'SRK' || kind === 'RK') {
    const logTerm = kind === 'PR'
      ? Math.log((selected + (1 + Math.sqrt(2)) * B) / (selected + (1 - Math.sqrt(2)) * B))
      : Math.log(1 + B / selected);
    const coeff = kind === 'PR' ? 1 / (2 * Math.sqrt(2) * par.b) : 1 / par.b;
    const hres = R * T * (selected - 1) + (T * par.dadT - par.a) * coeff * logTerm;
    out.residual_enthalpy_j_mol = hres;
    out.residual_entropy_j_mol_k = hres / T - R * lnphi(selected);
  }
  return out;
}

export function pressureFromVolume(kind, T, V, c) {
  const p = pureParameters(kind, T, c);
  if (!(V > p.b)) return NaN;
  if (kind === 'VDW') return R * T / (V - p.b) - p.a / V ** 2;
  if (kind === 'RK') return R * T / (V - p.b) - p.a / (Math.sqrt(T) * V * (V + p.b));
  if (kind === 'SRK') return R * T / (V - p.b) - p.a / (V * (V + p.b));
  if (kind === 'PR') return R * T / (V - p.b) - p.a / (V * V + 2 * p.b * V - p.b * p.b);
  throw new Error('不支持该状态方程。');
}

export function prMixtureFugacity(T, Pbar, components, composition, kij = 0, phase = 'vapor') {
  if (components.length !== 2 || composition.length !== 2) throw new Error('当前教学计算器为二元体系。');
  const rawComposition = composition.map(Number);
  const xsum = rawComposition.reduce((a,b)=>a+b,0);
  const T_K = Number(T), P = Number(Pbar) * 1e5, kijValue = Number(kij);
  if (!(T_K > 0 && P > 0) || ![T_K,P,kijValue,xsum].every(Number.isFinite)) throw new Error('温度、压力和二元交互参数必须为有限有效数值，且温度与压力大于 0。');
  if (!(xsum > 0) || rawComposition.some(x => !(x >= 0) || !Number.isFinite(x))) throw new Error('组成必须为有限非负数且总和大于 0。');
  if (components.some(c => !(c.tc > 0 && c.pc > 0) || ![c.tc,c.pc,c.omega].every(Number.isFinite))) throw new Error('组分临界参数或偏心因子无效。');
  const x = rawComposition.map(v => v / xsum);
  const ai = components.map(c => {
    const Tc = c.tc, Pc = c.pc * 1e6, w = c.omega;
    const m = 0.37464 + 1.54226*w - 0.26992*w*w;
    const al = (1 + m*(1-Math.sqrt(T_K/Tc)))**2;
    return 0.45724*R*R*Tc*Tc/Pc*al;
  });
  const bi = components.map(c => 0.07780*R*c.tc/(c.pc*1e6));
  const aij = [[0,0],[0,0]];
  for (let i=0;i<2;i++) for (let j=0;j<2;j++) aij[i][j]=Math.sqrt(ai[i]*ai[j])*(i===j?1:(1-kijValue));
  let am=0,bm=0;
  for (let i=0;i<2;i++) { bm+=x[i]*bi[i]; for(let j=0;j<2;j++) am+=x[i]*x[j]*aij[i][j]; }
  const A=am*P/(R*R*T_K*T_K), B=bm*P/(R*T_K);
  const roots=cubicRoots(-(1-B), A-3*B*B-2*B, -(A*B-B*B-B**3)).filter(z=>z>B+1e-10);
  if(!roots.length) throw new Error('当前混合物状态点没有满足 Z>B 的 PR 实根。');
  const Z=phase==='liquid'?roots[0]:roots[roots.length-1];
  const s2=Math.sqrt(2), logTerm=Math.log((Z+(1+s2)*B)/(Z+(1-s2)*B));
  const lnPhi = [0,1].map(i=>{
    const sumA=x.reduce((acc,xj,j)=>acc+xj*aij[i][j],0);
    return bi[i]/bm*(Z-1)-Math.log(Z-B)-A/(2*s2*B)*(2*sumA/am-bi[i]/bm)*logTerm;
  });
  return {Z, roots, x, ln_phi:lnPhi, phi:lnPhi.map(Math.exp), fugacity_bar:lnPhi.map(v=>Math.exp(v)*Pbar), phase, A, B};
}

export function modifiedRaoultBubble(x1, psat1, psat2, gamma1=1, gamma2=1) {
  const vals=[x1,psat1,psat2,gamma1,gamma2].map(Number);
  if(vals.some(v=>!Number.isFinite(v)) || x1<0 || x1>1 || psat1<=0 || psat2<=0 || gamma1<=0 || gamma2<=0) throw new Error('组成须在 0–1，饱和蒸气压和活度系数须为正数。');
  const x2=1-x1, q1=x1*gamma1*psat1, q2=x2*gamma2*psat2, P=q1+q2;
  return {P_bar:P, y1:q1/P, y2:q2/P, x1, x2, model:'modified Raoult law', assumptions:'低压、气相近似理想；输入的 γ 为给定值，非模型自动回归参数。'};
}

export function modifiedRaoultDew(y1, psat1, psat2, gamma1=1, gamma2=1) {
  const vals=[y1,psat1,psat2,gamma1,gamma2].map(Number);
  if(vals.some(v=>!Number.isFinite(v)) || y1<0 || y1>1 || psat1<=0 || psat2<=0 || gamma1<=0 || gamma2<=0) throw new Error('组成须在 0–1，饱和蒸气压和活度系数须为正数。');
  const y2=1-y1, den=y1/(gamma1*psat1)+y2/(gamma2*psat2);
  const P=1/den, x1=y1*P/(gamma1*psat1);
  return {P_bar:P, x1, x2:1-x1, y1, y2, model:'modified Raoult law', assumptions:'低压、气相近似理想；输入的 γ 为给定值，非模型自动回归参数。'};
}

export function generalizedVirial(T, Pbar, component) {
  const Tr=Number(T)/component.tc, Pr=Number(Pbar)*0.1/component.pc; // Pc MPa to bar
  if(!(Tr>0 && Pr>=0)) throw new Error('对比温度必须大于 0，压力不得为负。');
  const B0=0.083-0.422/Tr**1.6;
  const B1=0.139-0.172/Tr**4.2;
  const Bstar=B0+component.omega*B1;
  const Z=1+Bstar*Pr/Tr;
  return {Tr,Pr,B0,B1,Bstar,Z,secondVirial_m3_mol:Bstar*R*component.tc/(component.pc*1e6), warning:'Pitzer 第二维里截断式主要用于低密度/较低压力；请勿当作全压力范围的高精度 EOS。'};
}

export function interpolateSaturationByT(T) {
  const v=Number(T);
  if(!Number.isFinite(v)||v<SATURATION_ROWS[0].t||v>SATURATION_ROWS.at(-1).t) throw new Error(`仅覆盖 ${SATURATION_ROWS[0].t}–${SATURATION_ROWS.at(-1).t} °C 的教材附录样本节点。`);
  let hi=SATURATION_ROWS.findIndex(r=>r.t>=v);
  if(hi===0) return {...SATURATION_ROWS[0], method:'table node'};
  if(SATURATION_ROWS[hi].t===v) return {...SATURATION_ROWS[hi], method:'table node'};
  const a=SATURATION_ROWS[hi-1], b=SATURATION_ROWS[hi], f=(v-a.t)/(b.t-a.t);
  const out={t:v,method:'linear interpolation',from_t:a.t,to_t:b.t};
  for(const k of ['p','vf','vg','hf','hg','sf','sg']) out[k]=a[k]+f*(b[k]-a[k]);
  return out;
}

export function wetSteamFromQuality(sat, quality) {
  const x=Number(quality);
  if(!(x>=0&&x<=1)) throw new Error('干度 x 必须处于 0–1。');
  return {
    quality:x,
    v:sat.vf+x*(sat.vg-sat.vf),
    h:sat.hf+x*(sat.hg-sat.hf),
    s:sat.sf+x*(sat.sg-sat.sf),
    model:'saturated-mixture quality relation'
  };
}

export function runCoreTests() {
  const checks=[];
  const check=(name,fn)=>{try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}};
  check('cubic roots x³−6x²+11x−6',()=>{const r=cubicRoots(-6,11,-6);if(r.length!==3||r.some((v,i)=>Math.abs(v-(i+1))>1e-8))throw Error(JSON.stringify(r));});
  check('vdW critical Zc',()=>{const c={tc:300,pc:5,omega:0.1}; const p=pureParameters('VDW',300,c); const z=(5e6*3*p.b)/(R*300); if(Math.abs(z-0.375)>1e-10)throw Error(String(z));});
  check('PR ethane physical root',()=>{const c={tc:305.32,pc:4.872,omega:.099};const r=pureEOS('PR',350,20,c);if(!(r.z_selected>r.B&&r.molar_volume_m3_mol>0))throw Error('invalid PR root');});
  check('modified Raoult bubble total',()=>{const r=modifiedRaoultBubble(.4,1.2,.8,1.1,1);if(Math.abs(r.y1+r.y2-1)>1e-12)throw Error('composition sum');});
  check('saturation interpolation at 100 °C',()=>{const r=interpolateSaturationByT(100);if(Math.abs(r.p-.101325)>1e-8)throw Error('table point mismatch');});
  check('wet steam quality',()=>{const s=interpolateSaturationByT(100);const r=wetSteamFromQuality(s,.5);if(!(r.h>s.hf&&r.h<s.hg))throw Error('quality relation');});
  check('Pitzer virial low pressure limit',()=>{const r=generalizedVirial(300,0,{tc:190.56,pc:4.599,omega:.011});if(Math.abs(r.Z-1)>1e-12)throw Error('Z not unity at zero P');});
  return checks;
}
