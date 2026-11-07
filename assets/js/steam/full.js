/* TJU-ThermoHub steam module: IAPWS-IF97 regions 1-5 with PT/PH/PS/HS and saturation quality. */
(function (g) {
  'use strict';
  const $ = id => document.getElementById(id);
  const IF97 = () => {
    if (!g.ThermoIF97) throw new Error('IAPWS-IF97 本地计算核心未加载，请刷新页面或检查 vendor 文件。');
    return g.ThermoIF97;
  };
  const PC = 22.064, TC = 647.096, T23 = 623.15, P_TRIPLE = 0.000611657;
  let lastState = null, lastSatRows = [];
  const num = id => { const v = Number($(id).value); if (!Number.isFinite(v)) throw new Error('输入值必须是有限数字。'); return v; };
  function satAtT(T) {
    const api = IF97();
    if (!Number.isFinite(T) || T < 273.15 || T > TC) throw new RangeError('饱和温度范围为 273.15–647.096 K。');
    const P = api.PT.r4_T_Psat(T);
    let liquid, vapor;
    if (T <= T23) {
      liquid = api.PT.r1(P, T);
      vapor = api.PT.r2(P, T);
    } else if (TC - T < 1e-5) {
      liquid = vapor = api.PT.r3(P, T, 322);
    } else {
      const residual = rho => api.PT.r3(P, T, rho).p / 1e6 - P;
      function findBracket(lo, hi, count) {
        let x0 = lo, f0 = residual(x0);
        for (let i = 1; i <= count; i++) {
          const x1 = lo + (hi - lo) * i / count, f1 = residual(x1);
          if (Number.isFinite(f0) && Number.isFinite(f1) && f0 * f1 <= 0) return [x0, x1];
          x0 = x1; f0 = f1;
        }
        return null;
      }
      function root(bounds) {
        if (!bounds) throw new Error('Region 3 饱和密度求解未形成有效根区间；请避开极临界点并检查输入。');
        let lo = bounds[0], hi = bounds[1], flo = residual(lo);
        for (let i = 0; i < 90; i++) {
          const mid = (lo + hi) / 2, fm = residual(mid);
          if (Math.abs(fm) < 2e-11 || hi - lo < 1e-10) return api.PT.r3(P, T, mid);
          if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; }
        }
        return api.PT.r3(P, T, (lo + hi) / 2);
      }
      vapor = root(findBracket(1, 321.999, 320));
      liquid = root(findBracket(322.001, 1200, 440));
    }
    return { P, T, liquid, vapor, hf: liquid.h, hg: vapor.h, hfg: vapor.h - liquid.h,
      sf: liquid.s, sg: vapor.s, sfg: vapor.s - liquid.s, vf: liquid.v, vg: vapor.v,
      uf: liquid.u, ug: vapor.u };
  }
  function satAtP(P) {
    if (!Number.isFinite(P) || P < P_TRIPLE || P >= PC) throw new RangeError('饱和压力应满足 0.000611657 MPa ≤ P < 22.064 MPa。');
    return satAtT(IF97().PT.r4_P_Tsat(P));
  }
  function mixSat(sat, x) {
    if (!Number.isFinite(x) || x < 0 || x > 1) throw new RangeError('干度 x 必须在 0 到 1 之间。');
    const L = sat.liquid, V = sat.vapor, v = L.v + x * (V.v - L.v);
    return { p: sat.P * 1e6, t: sat.T, v, h: L.h + x * (V.h - L.h),
      u: L.u + x * (V.u - L.u), s: L.s + x * (V.s - L.s), rho: 1 / v,
      x, region: 4, state: x === 0 ? '饱和液体' : x === 1 ? '饱和蒸汽' : '湿蒸汽',
      cp: null, cv: null, w: null, mu: null, k: null, saturation: sat };
  }
  function regionOf(P, T) {
    if (T > 1073.15) return 5;
    if (T > T23 && P > IF97().PT.b23_T_P(T)) return 3;
    if (T <= T23 && T < TC && P < IF97().PT.r4_T_Psat(T)) return 2;
    return 1;
  }
  function classify(st, source) {
    const P = st.p / 1e6, T = st.t;
    if (st.region === 4 || Number.isFinite(st.x)) return st.state || '湿蒸汽';
    st.region = regionOf(P, T);
    if (T > TC && P > PC) st.state = '超临界流体';
    else if (T > TC) st.state = '高温蒸汽';
    else if (T <= T23 && P < IF97().PT.r4_T_Psat(T)) st.state = '过热蒸汽';
    else if (T <= T23 && P > IF97().PT.r4_T_Psat(T)) st.state = '压缩（过冷）液体';
    else if (T > T23 && st.region === 3) st.state = T < TC ? '高密度/临界附近流体' : '超临界流体';
    else st.state = '单相流体';
    st.sourceMode = source;
    return st;
  }
  function nearSaturation(P, T) {
    if (T >= 273.15 && T <= TC && P < PC) return Math.abs(IF97().PT.r4_T_Psat(T) - P) <= Math.max(1e-8, P * 2e-7);
    return false;
  }
  function calculate(mode, a, b) {
    const api = IF97();
    let st, source, sat;
    if (mode === 'PT') {
      st = api.PT.solve(a, b); source = 'IAPWS-IF97 基本方程（P,T）';
      if (nearSaturation(a, b) && b < TC) {
        sat = satAtP(a);
        st.state = '位于饱和边界；输入未指定干度';
        st.saturation = sat;
        st.note = '当前 P-T 点不能唯一决定湿蒸汽混合物性质；请使用 P-x 查询。结果保留 P-T 方程边界解。';
      } else classify(st, source);
    } else if (mode === 'PH') {
      if (a < PC) {
        sat = satAtP(a);
        if (b >= sat.hf - 2e-7 && b <= sat.hg + 2e-7) {
          st = mixSat(sat, Math.min(1, Math.max(0, (b - sat.hf) / sat.hfg)));
          st.state += '（P-h 两相反算）'; st.sourceMode = 'IF97 饱和端点 + 湿蒸汽关系'; return st;
        }
      }
      st = api.PH.solve(a, b); source = 'IAPWS-IF97 后向方程（P,h）'; classify(st, source);
    } else if (mode === 'PS') {
      if (a < PC) {
        sat = satAtP(a);
        if (b >= sat.sf - 2e-8 && b <= sat.sg + 2e-8) {
          st = mixSat(sat, Math.min(1, Math.max(0, (b - sat.sf) / sat.sfg)));
          st.state += '（P-s 两相反算）'; st.sourceMode = 'IF97 饱和端点 + 湿蒸汽关系'; return st;
        }
      }
      st = api.PS.solve(a, b); source = 'IAPWS-IF97 后向方程（P,s）'; classify(st, source);
    } else if (mode === 'HS') {
      st = api.HS.solve(a, b); source = 'IAPWS-IF97 后向方程（h,s）';
      const P = st.p / 1e6;
      if (P < PC) {
        sat = satAtP(P);
        if (a >= sat.hf - 2e-6 && a <= sat.hg + 2e-6) {
          const xh = (a - sat.hf) / sat.hfg, xs = (b - sat.sf) / sat.sfg;
          if (xh >= -2e-5 && xh <= 1.00002 && Math.abs(xh - xs) < 1.5e-3) {
            st = mixSat(sat, Math.min(1, Math.max(0, (xh + xs) / 2)));
            st.state += '（h-s 两相反算）'; st.sourceMode = 'IF97 后向方程 + 饱和混合关系'; return st;
          }
        }
      }
      classify(st, source);
    } else if (mode === 'PX') {
      st = mixSat(satAtP(a), b); st.sourceMode = 'IAPWS-IF97 Region 4 + 饱和混合关系'; return st;
    } else throw new Error('未知状态输入模式。');
    st.sourceMode = source;
    return st;
  }
  function fmt(v, n) { return Number.isFinite(v) ? v.toFixed(n === undefined ? 6 : n) : '—'; }
  function showResult(st) {
    lastState = st;
    const rows = [
      ['压力 P', fmt(st.p / 1e6, 8), 'MPa'], ['温度 T', fmt(st.t, 6), 'K'],
      ['IF97 区域', st.region === 4 ? 'Region 4（饱和两相）' : 'Region ' + (st.region || '—'), '—'],
      ['状态判定', st.state || '—', '—'], ['比体积 v', fmt(st.v, 9), 'm³/kg'],
      ['密度 ρ', fmt(st.rho, 6), 'kg/m³'], ['比焓 h', fmt(st.h, 6), 'kJ/kg'],
      ['比内能 u', fmt(st.u, 6), 'kJ/kg'], ['比熵 s', fmt(st.s, 8), 'kJ/(kg·K)'],
      ['定压比热 cp', fmt(st.cp, 7), 'kJ/(kg·K)'], ['定容比热 cv', fmt(st.cv, 7), 'kJ/(kg·K)'],
      ['声速 w', fmt(st.w, 5), 'm/s'], ['干度 x', Number.isFinite(st.x) ? fmt(st.x, 7) : '—', '—']
    ];
    $('steamStateOut').innerHTML = '<table><thead><tr><th>性质</th><th>数值</th><th>单位</th></tr></thead><tbody>' +
      rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') +
      '</tbody></table>';
    $('steamStateNote').textContent = (st.sourceMode || 'IAPWS-IF97') + '。计算结果使用 IAPWS-IF97 国际单位约定；焓、熵参考态以该标准定义为准。' + (st.note ? ' ' + st.note : '');
    $('steamStateNote').className = 'result ' + (st.note ? '' : 'ok');
  }
  function runState() {
    try {
      const mode = $('steamMode').value, a = num('steamA'), b = num('steamB');
      if (['PT','PH','PS','PX'].includes(mode) && a <= 0) throw new RangeError('压力必须大于零。');
      if (mode === 'PX' && (b < 0 || b > 1)) throw new RangeError('干度 x 必须在 0–1。');
      showResult(calculate(mode, a, b));
    } catch (e) {
      $('steamStateOut').innerHTML = ''; $('steamStateNote').textContent = e.message || String(e);
      $('steamStateNote').className = 'result err'; lastState = null;
    }
  }
  function updateModeLabels() {
    const map = {
      PT: ['压力 P / MPa','温度 T / K','0.1','373.15'],
      PH: ['压力 P / MPa','比焓 h / kJ·kg⁻¹','1','2800'],
      PS: ['压力 P / MPa','比熵 s / kJ·kg⁻¹·K⁻¹','1','6.5'],
      HS: ['比焓 h / kJ·kg⁻¹','比熵 s / kJ·kg⁻¹·K⁻¹','2800','6.5'],
      PX: ['压力 P / MPa','干度 x / —','0.1','0.5']
    }[$('steamMode').value];
    $('steamALabel').textContent = map[0]; $('steamBLabel').textContent = map[1];
    $('steamA').value = map[2]; $('steamB').value = map[3];
    $('steamModeHint').textContent = $('steamMode').value === 'PT' ? '单相区采用两个独立变量；饱和边界需再给干度。' :
      $('steamMode').value === 'PX' ? '两相区由压力和干度确定湿蒸汽性质；干度仅用于饱和两相状态。' :
      '使用 IAPWS-IF97 对应后向方程；两相区按饱和端点和干度关系进行判断。';
  }
  function downloadCsv(name, rows) {
    const csv = '\ufeff' + rows.map(r => r.map(v => '"' + String(v === undefined || v === null ? '' : v).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function exportState() {
    if (!lastState) return;
    const st = lastState;
    downloadCsv('TJU-ThermoHub-IF97-state.csv', [
      ['property','value','unit'], ['P',st.p / 1e6,'MPa'], ['T',st.t,'K'],
      ['region',st.region,'—'], ['state',st.state,'—'], ['v',st.v,'m3/kg'],
      ['rho',st.rho,'kg/m3'], ['h',st.h,'kJ/kg'], ['u',st.u,'kJ/kg'], ['s',st.s,'kJ/(kg K)'],
      ['cp',st.cp,'kJ/(kg K)'], ['cv',st.cv,'kJ/(kg K)'], ['w',st.w,'m/s'], ['x',st.x,'—'],
      ['source',st.sourceMode,'—']
    ]);
  }
  function satRow(s) {
    return [s.T,s.P,s.liquid.v,s.vapor.v,s.liquid.h,s.vapor.h,s.hfg,s.liquid.u,s.vapor.u,
      s.liquid.s,s.vapor.s,s.liquid.cp,s.vapor.cp];
  }
  function generateSatTable() {
    try {
      const mode = $('satTableMode').value, step = num('satTableStep');
      if (step <= 0) throw new RangeError('步长必须大于零。');
      const values = [];
      if (mode === 'T') {
        for (let T = 273.15; T < TC; T += step) values.push(T);
        values.push(TC);
      } else {
        const lo = Math.log(P_TRIPLE), hi = Math.log(PC);
        const count = Math.min(120, Math.max(2, Math.ceil((hi - lo) / step)));
        for (let i = 0; i <= count; i++) values.push(Math.exp(lo + (hi - lo) * i / count));
      }
      lastSatRows = values.map(v => satRow(mode === 'T' ? satAtT(v) : satAtP(v)));
      $('satTableOut').innerHTML = '<div class="scroll"><table><thead><tr><th>T / K</th><th>Ps / MPa</th><th>vf / m³·kg⁻¹</th><th>vg / m³·kg⁻¹</th><th>hf / kJ·kg⁻¹</th><th>hg / kJ·kg⁻¹</th><th>hfg / kJ·kg⁻¹</th><th>uf</th><th>ug</th><th>sf</th><th>sg</th><th>cpf</th><th>cpg</th></tr></thead><tbody>' +
        lastSatRows.map(r => '<tr>' + r.map(v => '<td>' + fmt(v, 6) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
      $('satTableNote').textContent = '已生成 ' + lastSatRows.length + ' 行饱和性质数据。来自 IAPWS-IF97 Region 4 与对应单相区域端点公式，不是手工录入教材扫描表。';
      $('satTableNote').className = 'result ok';
    } catch (e) {
      $('satTableOut').innerHTML = ''; $('satTableNote').textContent = e.message; $('satTableNote').className = 'result err';
    }
  }
  function exportSatTable() {
    if (!lastSatRows.length) return;
    downloadCsv('TJU-ThermoHub-IF97-saturation-table.csv', [
      ['T_K','Ps_MPa','vf_m3_kg','vg_m3_kg','hf_kJ_kg','hg_kJ_kg','hfg_kJ_kg','uf_kJ_kg','ug_kJ_kg','sf_kJ_kgK','sg_kJ_kgK','cpf_kJ_kgK','cpg_kJ_kgK'],
      ...lastSatRows
    ]);
  }
  function lagrange() {
    try {
      const x = num('lagX'), xs = [num('lagX0'),num('lagX1'),num('lagX2')], ys = [num('lagY0'),num('lagY1'),num('lagY2')];
      if (new Set(xs).size !== 3) throw new Error('三个节点横坐标必须互不相同。');
      const terms = xs.map((xi,i) => ys[i] * xs.reduce((prod,xj,j) => i === j ? prod : prod * (x - xj) / (xi - xj), 1));
      $('lagResult').textContent = '三点拉格朗日插值结果 = ' + terms.reduce((a,b) => a + b, 0) +
        '\n基函数加权项：' + terms.map(v => v.toPrecision(8)).join(' + ');
      $('lagResult').className = 'result ok';
    } catch (e) { $('lagResult').textContent = e.message; $('lagResult').className = 'result err'; }
  }
  function init() {
    if (!$('steamMode') || !g.ThermoIF97) return;
    $('steamMode').addEventListener('change', updateModeLabels);
    $('steamCalc').addEventListener('click', runState);
    $('steamExport').addEventListener('click', exportState);
    $('satTableGenerate').addEventListener('click', generateSatTable);
    $('satTableExport').addEventListener('click', exportSatTable);
    $('lagCalc').addEventListener('click', lagrange);
    updateModeLabels(); generateSatTable(); runState();
  }
  g.TJUSteam = Object.freeze({ satAtT, satAtP, calculate, runState });
  document.addEventListener('DOMContentLoaded', init);
})(window);
