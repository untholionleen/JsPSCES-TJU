/* Cubic-EOS vapor-liquid coexistence (equal fugacity / Maxwell plateau) regression. */
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const matches=[...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)];
if(!matches.length)throw new Error('Inline site script was not found.');
const document={addEventListener(){},getElementById(){return null},querySelectorAll(){return []}};
const window={document};
const context={window,document,console,Math,Number,Array,Object,JSON,Date,Map,Set,Error,RangeError,Infinity,NaN};
vm.runInNewContext(matches[0][1],context,{timeout:5000});
const api=window.TJUCubicEOS;
if(!api||typeof api.coexistence!=='function')throw new Error('Cubic EOS coexistence API not exposed.');
const Tc=190.56,Pc=4.599,w=.011,T=.8*Tc;
const r=api.coexistence('pr',T,Tc,Pc,w);
if(!(r.P>0&&r.P<Pc))throw new Error('Saturation pressure out of bounds: '+r.P);
if(!(r.liquid.V<r.vapor.V))throw new Error('Liquid root must have smaller molar volume than vapor root.');
const fugacityResidual=Math.abs(r.liquid.lnphi-r.vapor.lnphi);
if(fugacityResidual>1e-7)throw new Error('Liquid-vapor fugacity equality residual too high: '+fugacityResidual);
process.stdout.write('PASS PR methane coexistence at Tr=0.8: Psat='+r.P.toFixed(8)+' MPa; ln(phiL/phiV) residual='+fugacityResidual.toExponential(3)+'\\n');
