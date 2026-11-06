export const R = 8.31446261815324;

// Initial reference values compiled from the supplied textbook appendix and
// public thermophysical references. These are marked provisional until the
// source row, phase convention and precision are checked individually.
export const SUBSTANCES = [
  {cas:'7727-37-9', zh:'氮气', en:'Nitrogen', formula:'N₂', mw:28.0134, tc:126.192, pc:3.3958, omega:0.0372, source:'CoolProp / NIST reference cross-check pending'},
  {cas:'7782-44-7', zh:'氧气', en:'Oxygen', formula:'O₂', mw:31.9988, tc:154.581, pc:5.0430, omega:0.0222, source:'CoolProp / NIST reference cross-check pending'},
  {cas:'1333-74-0', zh:'氢气（正常氢参考）', en:'Hydrogen (normal)', formula:'H₂', mw:2.01588, tc:33.145, pc:1.2964, omega:-0.2190, source:'Hydrogen spin-isomer convention must be verified'},
  {cas:'124-38-9', zh:'二氧化碳', en:'Carbon dioxide', formula:'CO₂', mw:44.0095, tc:304.1282, pc:7.3773, omega:0.22394, source:'CoolProp / NIST reference cross-check pending'},
  {cas:'74-82-8', zh:'甲烷', en:'Methane', formula:'CH₄', mw:16.0425, tc:190.56, pc:4.5990, omega:0.011, source:'教材附录3；国际值复核待完成'},
  {cas:'74-84-0', zh:'乙烷', en:'Ethane', formula:'C₂H₆', mw:30.0690, tc:305.32, pc:4.872, omega:0.099, source:'教材附录3；国际值复核待完成'},
  {cas:'74-98-6', zh:'丙烷', en:'Propane', formula:'C₃H₈', mw:44.0956, tc:369.83, pc:4.248, omega:0.152, source:'教材附录3；国际值复核待完成'},
  {cas:'106-97-8', zh:'正丁烷', en:'n-Butane', formula:'C₄H₁₀', mw:58.1222, tc:425.12, pc:3.796, omega:0.199, source:'教材附录3；国际值复核待完成'},
  {cas:'109-66-0', zh:'正戊烷', en:'n-Pentane', formula:'C₅H₁₂', mw:72.1488, tc:469.70, pc:3.370, omega:0.249, source:'教材附录3；国际值复核待完成'},
  {cas:'110-54-3', zh:'正己烷', en:'n-Hexane', formula:'C₆H₁₄', mw:86.1754, tc:507.60, pc:3.025, omega:0.305, source:'教材附录3；国际值复核待完成'},
  {cas:'74-85-1', zh:'乙烯', en:'Ethylene', formula:'C₂H₄', mw:28.0532, tc:282.34, pc:5.041, omega:0.085, source:'教材附录3；国际值复核待完成'},
  {cas:'115-07-1', zh:'丙烯', en:'Propylene', formula:'C₃H₆', mw:42.0797, tc:364.90, pc:4.600, omega:0.142, source:'教材附录3；国际值复核待完成'},
  {cas:'74-86-2', zh:'乙炔', en:'Acetylene', formula:'C₂H₂', mw:26.0373, tc:308.30, pc:6.138, omega:0.187, source:'教材附录3；国际值复核待完成'},
  {cas:'71-43-2', zh:'苯', en:'Benzene', formula:'C₆H₆', mw:78.1118, tc:562.05, pc:4.895, omega:0.211, source:'教材附录3；国际值复核待完成'},
  {cas:'108-88-3', zh:'甲苯', en:'Toluene', formula:'C₇H₈', mw:92.1405, tc:591.75, pc:4.108, omega:0.264, source:'教材附录3；国际值复核待完成'},
  {cas:'7732-18-5', zh:'水', en:'Water', formula:'H₂O', mw:18.01528, tc:647.096, pc:22.064, omega:0.344, source:'水蒸气性质首选 IAPWS-IF97；此处临界参数仅用于教学比较'}
];

// Selected, legible saturation rows transcribed from the user's uploaded
// Chemistry Thermodynamics (3rd ed.) Appendix 8. They are a teaching subset,
// not a full steam-table database and not a substitute for IAPWS-IF97.
export const SATURATION_ROWS = [
  {t:0.01,p:0.0006117, vf:0.00100021, vg:206.012, hf:0, hg:2500.53, sf:0, sg:9.1541},
  {t:10,p:0.0012279,vf:0.00100034,vg:106.341,hf:42.00,hg:2518.90,sf:0.1510,sg:8.8988},
  {t:20,p:0.0023385,vf:0.00100185,vg:57.786,hf:83.86,hg:2537.20,sf:0.2963,sg:8.6652},
  {t:30,p:0.0042451,vf:0.00100442,vg:32.899,hf:125.68,hg:2555.35,sf:0.4366,sg:8.4514},
  {t:40,p:0.0073811,vf:0.00100789,vg:19.529,hf:167.50,hg:2573.36,sf:0.5723,sg:8.2551},
  {t:50,p:0.0123446,vf:0.00101216,vg:12.0365,hf:209.33,hg:2591.19,sf:0.7038,sg:8.0745},
  {t:60,p:0.019933,vf:0.00101713,vg:7.674,hf:251.15,hg:2608.79,sf:0.8312,sg:7.9080},
  {t:70,p:0.031178,vf:0.00102276,vg:5.0443,hf:293.01,hg:2626.10,sf:0.9550,sg:7.7540},
  {t:80,p:0.047376,vf:0.00102903,vg:3.4086,hf:334.93,hg:2643.06,sf:1.0753,sg:7.6112},
  {t:90,p:0.070121,vf:0.00103593,vg:2.3616,hf:376.94,hg:2659.63,sf:1.1926,sg:7.4783},
  {t:100,p:0.101325,vf:0.00104344,vg:1.6736,hf:419.06,hg:2675.71,sf:1.3069,sg:7.3545},
  {t:120,p:0.198483,vf:0.00106031,vg:0.89219,hf:503.76,hg:2706.18,sf:1.5277,sg:7.1297},
  {t:140,p:0.36119,vf:0.00107972,vg:0.509,hf:589.21,hg:2733.81,sf:1.7393,sg:6.9302},
  {t:160,p:0.61766,vf:0.00110193,vg:0.30709,hf:675.62,hg:2757.92,sf:1.9429,sg:6.7502},
  {t:180,p:1.00193,vf:0.00112732,vg:0.19403,hf:763.22,hg:2777.74,sf:2.1396,sg:6.5852},
  {t:200,p:1.55366,vf:0.00115641,vg:0.12732,hf:852.34,hg:2792.47,sf:2.3307,sg:6.4312},
  {t:220,p:2.31783,vf:0.00119000,vg:0.086157,hf:943.46,hg:2801.20,sf:2.5175,sg:6.2846},
  {t:260,p:4.68923,vf:0.00127579,vg:0.042195,hf:1134.30,hg:2796.14,sf:2.8837,sg:6.0007},
  {t:280,p:6.41273,vf:0.00133242,vg:0.030165,hf:1236.00,hg:2779.08,sf:3.0668,sg:5.8564},
  {t:300,p:8.58308,vf:0.00140369,vg:0.021669,hf:1344.00,hg:2748.71,sf:3.2533,sg:5.7042},
  {t:320,p:11.278,vf:0.00149844,vg:0.015479,hf:1461.20,hg:2699.72,sf:3.4475,sg:5.5356},
  {t:340,p:14.593,vf:0.00163728,vg:0.010790,hf:1593.70,hg:2621.32,sf:3.6586,sg:5.3345},
  {t:350,p:16.521,vf:0.00174008,vg:0.008812,hf:1670.30,hg:2563.39,sf:3.7773,sg:5.2104},
  {t:360,p:18.657,vf:0.00189423,vg:0.006958,hf:1761.10,hg:2481.68,sf:3.9155,sg:5.0536},
  {t:370,p:21.033,vf:0.00221480,vg:0.004982,hf:1891.70,hg:2338.79,sf:4.1125,sg:4.8076},
  {t:373,p:21.802,vf:0.00249600,vg:0.004087,hf:1968.80,hg:2237.98,sf:4.2292,sg:4.6458},
  {t:373.99,p:22.064,vf:0.00310600,vg:0.003106,hf:2085.90,hg:2085.90,sf:4.4092,sg:4.4092}
];

export const DERIVATIONS = [
  {id:'D1',title:'范德华方程常数 a、b 的推导',steps:[['(∂P/∂V)T,c = 0；(∂²P/∂V²)T,c = 0','临界点处等温线具有水平拐点。'],['P = RT/(V−b) − a/V²','由范德华状态方程出发，分别对 V 求一阶和二阶偏导。'],['Vc = 3b；Pc = a/(27b²)','将临界条件与状态方程联立。'],['a = 27R²Tc²/(64Pc)，b = RTc/(8Pc)，Zc = 3/8','得到 vdW 参数与临界性质之间的关系。']]},
  {id:'D2',title:'RK、SRK、PR 参数结构',steps:[['a(T)=ac α(T)，b=Ωb RTc/Pc','以临界常数建立尺度参数。'],['α(T)=[1+m(1−√Tr)]²','Soave 类温度函数修正分子间吸引项。'],['m=m(ω)，Ωa、Ωb 由各模型定义','不同模型常数不可混用；PRG/PRSV 应单独给出定义和参数。']]},
  {id:'D3',title:'立方型状态方程化为 Z 三次方程',steps:[['Z=PV/(RT)，A=aP/(R²T²)，B=bP/(RT)','定义压缩因子与无量纲参数。'],['将状态方程代入并整理为三次多项式','三次方程系数随 vdW、RK/SRK、PR 模型而变化。'],['求全部实根并检查 Z>B','真实根还需结合相态选择和稳定性判断。']]},
  {id:'D4',title:'Maxwell 关系式',steps:[['dU=T dS−P dV','内能的基本热力学关系。'],['U=U(S,V)，dU=(∂U/∂S)VdS+(∂U/∂V)SdV','比较全微分系数。'],['(∂T/∂V)S=−(∂P/∂S)V','利用状态函数混合二阶偏导相等得到 Maxwell 关系。']]},
  {id:'D5',title:'剩余性质与理想气体基准',steps:[['Gᴿ = G − Gig','剩余性质定义为真实流体与同温同压理想气体性质之差。'],['Gᴿ/(RT)=∫₀ᴾ(Z−1)dP/P','以压力积分表达剩余 Gibbs 能。'],['Hᴿ=−RT²[∂(Gᴿ/RT)/∂T]P；Sᴿ=(Hᴿ−Gᴿ)/T','由热力学偏导关系和 G=H−TS 得到剩余焓、熵。']]},
  {id:'D6',title:'逸度系数的压力积分定义',steps:[['d ln f = dP/(ρRT)','以化学势微分关系定义逸度。'],['ln φ = ∫₀ᴾ(Z−1)dP/P','气相逸度系数可由压缩因子积分求取。'],['不同 EOS 代入后得到不同解析式','计算时检查对数定义域、物理根及低压极限 φ→1。']]},
  {id:'D7',title:'Maxwell 等面积与相平衡等逸度',steps:[['μL=μV','纯物质汽液平衡要求两相化学势相等。'],['fL=fV','等温下等逸度是数值求饱和压力的热力学判据。'],['∫(P−Psat)dV=0','Maxwell 等面积法是指定 EOS 下与等逸度相联系的构造。']]},
  {id:'D8',title:'第二维里系数与 Pitzer 关联',steps:[['Z=1+B P/(RT)+C(P/RT)²+…','维里展开描述低密度流体偏离理想气体的程度。'],['B* = B⁰ + ωB¹','Pitzer 对应态关联引入偏心因子。'],['B⁰=0.083−0.422/Tr¹·⁶；B¹=0.139−0.172/Tr⁴·²','该简化关联有适用范围，不能无条件外推到高压区。']]},
  {id:'D9',title:'Clapeyron 与 Clausius–Clapeyron 方程',steps:[['dP/dT=Δs/Δv','沿两相平衡线微分化学势相等条件。'],['Δs=Δh/T','相变潜热与熵变的关系。'],['d ln P/dT≈Δh/(RT²)','在蒸汽近似理想气体、液体体积可忽略等条件下得到近似式。']]},
  {id:'D10',title:'Joule–Thomson 系数',steps:[['μJT=(∂T/∂P)H','定义为等焓过程温度对压力的响应。'],['dH=Cp dT+[V−T(∂V/∂T)P]dP','由焓的全微分展开。'],['μJT=[T(∂V/∂T)P−V]/Cp','由等焓条件 dH=0 得到。']]},
  {id:'D11',title:'Gibbs–Duhem 方程与活度系数',steps:[['Σ xi dμi = −S dT+V dP','混合物化学势之间存在约束。'],['定温定压下 Σ xi d ln γi=0','活度系数必须满足 Gibbs–Duhem 关系。'],['模型参数须来自实验回归或明确来源','Margules、van Laar、Wilson、NRTL 等参数不可凭空生成。']]}
];

export const GLOSSARY = [
 ['逸度','Fugacity'],['逸度系数','Fugacity coefficient'],['压缩因子','Compressibility factor'],['偏心因子','Acentric factor'],['剩余焓','Residual enthalpy'],['剩余熵','Residual entropy'],['泡点','Bubble point'],['露点','Dew point'],['干度','Vapour quality'],['过热蒸汽','Superheated steam'],['压缩水','Compressed liquid'],['临界点','Critical point'],['等熵过程','Isentropic process'],['节流过程','Throttling process'],['活度系数','Activity coefficient'],['二元交互参数','Binary interaction parameter'],['热力学一致性','Thermodynamic consistency']
];
