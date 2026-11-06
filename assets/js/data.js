// Critical constants are seeded from the current thermo_substances table.
// The database currently marks these rows as provisional; the UI preserves that status.
export const substances = [
 {id:'7727-37-9',key:'nitrogen',zh:'氮气',en:'Nitrogen',formula:'N₂',M:28.0134,Tc:126.192,Pc:3.3958,omega:0.0372,status:'provisional'},
 {id:'7782-44-7',key:'oxygen',zh:'氧气',en:'Oxygen',formula:'O₂',M:31.9988,Tc:154.581,Pc:5.043,omega:0.0222,status:'provisional'},
 {id:'1333-74-0',key:'hydrogen',zh:'氢气（正常氢）',en:'Hydrogen (normal)',formula:'H₂',M:2.01588,Tc:33.145,Pc:1.2964,omega:-0.219,status:'provisional'},
 {id:'124-38-9',key:'carbon-dioxide',zh:'二氧化碳',en:'Carbon dioxide',formula:'CO₂',M:44.0095,Tc:304.1282,Pc:7.3773,omega:0.22394,status:'provisional'},
 {id:'74-82-8',key:'methane',zh:'甲烷',en:'Methane',formula:'CH₄',M:16.0425,Tc:190.56,Pc:4.599,omega:0.011,status:'provisional'},
 {id:'74-84-0',key:'ethane',zh:'乙烷',en:'Ethane',formula:'C₂H₆',M:30.069,Tc:305.32,Pc:4.872,omega:0.099,status:'provisional'},
 {id:'74-98-6',key:'propane',zh:'丙烷',en:'Propane',formula:'C₃H₈',M:44.0956,Tc:369.83,Pc:4.248,omega:0.152,status:'provisional'},
 {id:'106-97-8',key:'n-butane',zh:'正丁烷',en:'n-Butane',formula:'C₄H₁₀',M:58.1222,Tc:425.12,Pc:3.796,omega:0.199,status:'provisional'},
 {id:'109-66-0',key:'n-pentane',zh:'正戊烷',en:'n-Pentane',formula:'C₅H₁₂',M:72.1488,Tc:469.7,Pc:3.37,omega:0.249,status:'provisional'},
 {id:'110-54-3',key:'n-hexane',zh:'正己烷',en:'n-Hexane',formula:'C₆H₁₄',M:86.1754,Tc:507.6,Pc:3.025,omega:0.305,status:'provisional'},
 {id:'74-85-1',key:'ethylene',zh:'乙烯',en:'Ethylene',formula:'C₂H₄',M:28.0532,Tc:282.34,Pc:5.041,omega:0.085,status:'provisional'},
 {id:'115-07-1',key:'propylene',zh:'丙烯',en:'Propylene',formula:'C₃H₆',M:42.0797,Tc:364.9,Pc:4.6,omega:0.142,status:'provisional'},
 {id:'74-86-2',key:'acetylene',zh:'乙炔',en:'Acetylene',formula:'C₂H₂',M:26.0373,Tc:308.3,Pc:6.138,omega:0.187,status:'provisional'},
 {id:'71-43-2',key:'benzene',zh:'苯',en:'Benzene',formula:'C₆H₆',M:78.1118,Tc:562.05,Pc:4.895,omega:0.211,status:'provisional'},
 {id:'108-88-3',key:'toluene',zh:'甲苯',en:'Toluene',formula:'C₇H₈',M:92.1405,Tc:591.75,Pc:4.108,omega:0.264,status:'provisional'},
 {id:'7732-18-5',key:'water',zh:'水',en:'Water',formula:'H₂O',M:18.01528,Tc:647.096,Pc:22.064,omega:0.344,status:'provisional'}
];
export const refrigerants = [
 {key:'R134a',zh:'R-134a（暂定物性参数）',en:'R-134a (provisional constants)',formula:'CH₂FCF₃',Tc:374.21,Pc:4.059,omega:0.326,status:'provisional'}
];
export const dataSources = [
 {name:'IAPWS IF97 R7-97(2012)',url:'https://iapws.org/technical-guidance/release/IF97-Rev',kind:'industrial standard',scope:'Water and steam properties; IF97 regions 1–5.'},
 {name:'NIST Chemistry WebBook SRD 69',url:'https://webbook.nist.gov/chemistry/',kind:'reference database',scope:'Critical constants and thermophysical data; check individual substance records.'},
 {name:'CoolProp Documentation',url:'https://coolprop.org/',kind:'open-source property library',scope:'Independent cross-checks; respect model and reference-state differences.'},
 {name:'Tianjin University Chemical Engineering Thermodynamics, 3rd ed.',url:'',kind:'textbook',scope:'Teaching structure, notation and example comparisons; not a machine-readable standard database.'},
 {name:'P. J. Barrie, J. Chem. Educ. 82 (2005), 958–959',url:'https://doi.org/10.1021/ed082p958',kind:'algorithm reference',scope:'Cubic equations of state educational program reference.'},
 {name:'Online Thermodynamics Calculators (user-provided reference site)',url:'https://pjb10.user.srcf.net/thermo/index.html',kind:'educational reference',scope:'Reference for pure-fluid and mixture EOS/VLE learning workflow; not used as the current property-data authority.'}
];
