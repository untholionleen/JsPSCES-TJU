/* Peng–Robinson phi–phi mixture equilibrium and isothermal flash.
 * Mixing rule: classical one-fluid quadratic a rule and linear b rule.
 * One user-specified uniform kij is applied to all unlike pairs in this release.
 */
(function (g) {
  'use strict';
  const R = 8.31446261815324;
  const components = [
    ['nitrogen','氮气','Nitrogen',126.2,3.394,.0372,'待复核'],
    ['oxygen','氧气','Oxygen',154.58,5.043,.0222,'待复核'],
    ['hydrogen','氢气','Hydrogen',33.145,1.2964,-.219,'待复核'],
    ['carbon-dioxide','二氧化碳','Carbon dioxide',304.1282,7.3773,.2239,'待复核'],
    ['methane','甲烷','Methane',190.56,4.599,.011,'教材附录3'],
    ['ethane','乙烷','Ethane',305.32,4.872,.099,'教材附录3'],
    ['propane','丙烷','Propane',369.83,4.248,.152,'教材附录3'],
    ['n-butane','正丁烷','n-Butane',425.12,3.796,.199,'教材附录3'],
    ['n-pentane','正戊烷','n-Pentane',469.7,3.370,.249,'教材附录3'],
    ['n-hexane','正己烷','n-Hexane',507.6,3.025,.305,'教材附录3'],
    ['ethylene','乙烯','Ethylene',282.34,5.041,.085,'教材附录3'],
    ['propylene','丙烯','Propylene',364.9,4.60,.142,'教材附录3'],
    ['acetylene','乙炔','Acetylene',308.3,6.138,.187,'教材附录3'],
    ['benzene','苯','Benzene',562.05,4.895,.211,'教材附录3'],
    ['toluene','甲苯','Toluene',591.75,4.108,.264,'教材附录3'],
    ['water','水','Water',647.096,22.064,.344,'IAPWS 临界点参考']
  ];
  function cbrt(x) { return Math.sign(x) * Math.pow(Math.abs(x), 1/3); }
  function cubicRoots(a,b,c) {
    const p = b - a*a/3, q = 2*a*a*a/27 - a*b/3 + c;
    const d = q*q/4 + p*p*p/27, eps = 1e-14;
    if (d > eps) { const s=Math.sqrt(d); return [cbrt(-q/2+s)+cbrt(-q/2-s)-a/3]; }
    if (Math.abs(d) <= eps) { const u=cbrt(-q/2); return [...new Set([2*u-a/3,-u-a/3])].sort((x,y)=>x-y); }
    const rr=2*Math.sqrt(-p/3), ph=Math.acos(Math.max(-1,Math.min(1,3*q/(2*p)*Math.sqrt(-3/p))));
    return [rr*Math.cos(ph/3)-a/3,rr*Math.cos((ph+2*Math.PI)/3)-a/3,rr*Math.cos((ph+4*Math.PI)/3)-a/3].sort((x,y)=>x-y);
  }
  function normalize(v) {
    const sum=v.reduce((a,b)=>a+b,0);
    if (!Number.isFinite(sum) || sum<=0 || v.some(x=>!Number.isFinite(x)||x<0)) throw new Error('组成必须是非负有限数，且总和大于零。');
    return v.map(x=>x/sum);
  }
  function pureParams(T, list) {
    if (!(T>0) || !Number.isFinite(T)) throw new Error('温度必须大于零。');
    return list.map(c=>{
      const [id,label,en,Tc,PcMPa,w]=c;
      const m=.37464+1.54226*w-.26992*w*w;
      const alpha=Math.pow(1+m*(1-Math.sqrt(T/Tc)),2);
      return {id,label,en,Tc,Pc:PcMPa*1e6,w,a:.45724*R*R*Tc*Tc/(PcMPa*1e6)*alpha,b:.07780*R*Tc/(PcMPa*1e6)};
    });
  }
  function mixtureParams(T, P, list, x, kij) {
    if (!(P>0) || !Number.isFinite(P)) throw new Error('压力必须大于零。');
    const p=pureParams(T,list), n=p.length;
    if (x.length!==n) throw new Error('组分数组长度错误。');
    const aij=Array.from({length:n},()=>Array(n).fill(0));
    let am=0,bm=0;
    for(let i=0;i<n;i++){
      bm+=x[i]*p[i].b;
      for(let j=0;j<n;j++){
        aij[i][j]=Math.sqrt(p[i].a*p[j].a)*(i===j?1:1-kij);
        am+=x[i]*x[j]*aij[i][j];
      }
    }
    const A=am*P/(R*R*T*T), B=bm*P/(R*T);
    const coeff=[(A-3*B*B-2*B), -(A*B-B*B-B*B*B)];
    const zRoots=cubicRoots(-(1-B),coeff[0],coeff[1]).filter(z=>z>B&&z>0);
    if(!zRoots.length) throw new Error('PR 三次方程未找到有效正实根，请检查 T/P/组成。');
    return {p,aij,am,bm,A,B,zRoots,temperature:T,pressure:P};
  }
  function fugacity(T,P,list,x,kij,phase) {
    const m=mixtureParams(T,P,list,x,kij);
    const Z=phase==='L'?m.zRoots[0]:m.zRoots[m.zRoots.length-1];
    const {A,B,am,bm,aij,p}=m, n=x.length, sq=Math.sqrt(2);
    if (Z<=B) throw new Error('PR 根不满足 Z > B。');
    const L=Math.log((Z+(1+sq)*B)/(Z+(1-sq)*B));
    const lnphi=[];
    for(let i=0;i<n;i++){
      let sum=0;
      for(let j=0;j<n;j++) sum+=x[j]*aij[i][j];
      const bi=p[i].b/bm;
      const value=bi*(Z-1)-Math.log(Z-B)-A/(2*sq*B)*(2*sum/am-bi)*L;
      if(!Number.isFinite(value)) throw new Error('逸度系数计算出现非有限数。');
      lnphi.push(value);
    }
    return {Z,lnphi,phi:lnphi.map(Math.exp),roots:m.zRoots,A,B,a:am,b:bm};
  }
  function wilsonK(T,P,list) {
    return list.map(c=>Math.exp(Math.log(c[4]/P)+5.373*(1+c[5])*(1-c[3]/T)));
  }
  function rr(z,K) {
    const f0=z.reduce((s,zi,i)=>s+zi*(K[i]-1),0);
    const f1=z.reduce((s,zi,i)=>s+zi*(K[i]-1)/K[i],0);
    if(f0<=0) return {beta:0,phase:'液相',f0,f1};
    if(f1>=0) return {beta:1,phase:'气相',f0,f1};
    let lo=0,hi=1;
    for(let k=0;k<100;k++){
      const mid=(lo+hi)/2;
      const fm=z.reduce((s,zi,i)=>s+zi*(K[i]-1)/(1+mid*(K[i]-1)),0);
      if(Math.abs(fm)<1e-13) return {beta:mid,phase:'气液两相',f0,f1};
      if(fm>0) lo=mid; else hi=mid;
    }
    return {beta:(lo+hi)/2,phase:'气液两相',f0,f1};
  }
  function split(z,K,beta) {
    const x=normalize(z.map((zi,i)=>zi/(1+beta*(K[i]-1))));
    const y=normalize(z.map((zi,i)=>K[i]*x[i]));
    return {x,y};
  }
  function flash(T,P, list, composition, kij=0) {
    const z=normalize(composition);
    if(list.length<2) throw new Error('混合物至少需要两个组分。');
    if(list.length!==z.length) throw new Error('组分与组成数目不一致。');
    if(!Number.isFinite(kij)||Math.abs(kij)>0.5) throw new Error('kij 需为有限数，当前版本限制在 -0.5 至 0.5。');
    let K=wilsonK(T,P,list).map(v=>Math.max(1e-12,Math.min(1e12,v))), beta=0, splitNow, phiL,phiV;
    let phase='未判定', residual=Infinity, iter=0;
    for(iter=1;iter<=300;iter++){
      const rr0=rr(z,K); beta=rr0.beta; phase=rr0.phase;
      splitNow=split(z,K,beta);
      const xEval=phase==='气相'?z:splitNow.x;
      const yEval=phase==='液相'?z:splitNow.y;
      phiL=fugacity(T,P,list,xEval,kij,'L');
      phiV=fugacity(T,P,list,yEval,kij,'V');
      const next=phiL.lnphi.map((v,i)=>Math.max(-30,Math.min(30,v-phiV.lnphi[i])));
      residual=Math.max(...next.map((v,i)=>Math.abs(v-Math.log(K[i]))));
      if(residual<1e-9){K=next.map(Math.exp); break;}
      K=next.map((v,i)=>Math.exp(.55*v+.45*Math.log(K[i])));
    }
    if(iter>300) throw new Error('PR φ-φ 闪蒸迭代未收敛；请调整初值、kij 或状态点。最终 max |ΔlnK|='+residual.toExponential(3));
    const rrFinal=rr(z,K); beta=rrFinal.beta; phase=rrFinal.phase; splitNow=split(z,K,beta);
    const xEval=phase==='气相'?z:splitNow.x, yEval=phase==='液相'?z:splitNow.y;
    phiL=fugacity(T,P,list,xEval,kij,'L'); phiV=fugacity(T,P,list,yEval,kij,'V');
    const fugacityResidual=Math.max(...z.map((_,i)=>phase==='气液两相'?Math.abs(Math.log(xEval[i]*phiL.phi[i]/(yEval[i]*phiV.phi[i]))):0));
    return {T,P,kij,z,K,x:phase==='气相'?null:xEval,y:phase==='液相'?null:yEval,beta,phase,
      iterations:iter,residual,fugacityResidual,liquidRoots:phiL.roots,vaporRoots:phiV.roots};
  }
  function equilibriumAtPressure(T,P,list,composition,kij,kind) {
    const feed=normalize(composition), n=feed.length;
    let K=wilsonK(T,P,list).map(v=>Math.max(1e-12,Math.min(1e12,v)));
    let liquid=kind==='bubble'?feed:null, vapor=kind==='dew'?feed:null, phiL,phiV,err=Infinity;
    for(let it=1;it<=300;it++){
      if(kind==='bubble') vapor=normalize(feed.map((v,i)=>v*K[i]));
      else liquid=normalize(feed.map((v,i)=>v/K[i]));
      phiL=fugacity(T,P,list,liquid,kij,'L');
      phiV=fugacity(T,P,list,vapor,kij,'V');
      const next=phiL.lnphi.map((v,i)=>v-phiV.lnphi[i]);
      err=Math.max(...next.map((v,i)=>Math.abs(v-Math.log(K[i]))));
      if(err<1e-9){K=next.map(Math.exp);break;}
      K=next.map((v,i)=>Math.exp(.55*v+.45*Math.log(K[i])));
    }
    if(err>=1e-9) throw new Error('等温相平衡内迭代未收敛。');
    if(kind==='bubble') {
      vapor=normalize(feed.map((v,i)=>v*K[i]));
      liquid=feed;
      return {residual:feed.reduce((s,v,i)=>s+v*K[i],0)-1,K,x:liquid,y:vapor,phiL,phiV,innerResidual:err};
    }
    liquid=normalize(feed.map((v,i)=>v/K[i]));
    vapor=feed;
    return {residual:feed.reduce((s,v,i)=>s+v/K[i],0)-1,K,x:liquid,y:vapor,phiL,phiV,innerResidual:err};
  }
  function envelope(T,list,composition,kij,kind) {
    const pressures=[];
    for(let i=0;i<=120;i++) pressures.push(Math.exp(Math.log(.002e6)+(Math.log(100e6)-Math.log(.002e6))*i/120));
    let bracket=null, prev=null;
    for(const P of pressures){
      try{
        const r=equilibriumAtPressure(T,P,list,composition,kij,kind);
        if(prev && prev.f*r.residual<=0){bracket=[prev.P,P];break;}
        prev={P,f:r.residual};
      }catch(e){}
    }
    if(!bracket) throw new Error('在 0.002–100 MPa 扫描范围内没有找到相平衡压力根；可能是温度超出包络范围或模型数据不足。');
    let lo=bracket[0],hi=bracket[1],flo=equilibriumAtPressure(T,lo,list,composition,kij,kind).residual, midResult=null;
    for(let it=0;it<70;it++){
      const mid=Math.sqrt(lo*hi);
      midResult=equilibriumAtPressure(T,mid,list,composition,kij,kind);
      if(Math.abs(midResult.residual)<1e-9) return {P:mid,...midResult,outerIterations:it+1};
      if(flo*midResult.residual<=0) hi=mid; else {lo=mid;flo=midResult.residual;}
    }
    const P=Math.sqrt(lo*hi);
    return {P,...equilibriumAtPressure(T,P,list,composition,kij,kind),outerIterations:70};
  }
  function selectedRows() {
    const rows=[...document.querySelectorAll('[data-mix-row]')];
    const list=[],z=[];
    for(const row of rows){
      if(!row.querySelector('[data-mix-active]').checked) continue;
      const c=components.find(x=>x[0]===row.querySelector('[data-mix-species]').value);
      if(!c) continue;
      list.push(c); z.push(Number(row.querySelector('[data-mix-z]').value));
    }
    if(list.length<2) throw new Error('请至少勾选两种组分。');
    return {list,z};
  }
  function renderRows() {
    const host=document.getElementById('mixRows'); if(!host)return;
    host.innerHTML='';
    for(let i=0;i<5;i++){
      const c=components[i+4];
      const row=document.createElement('div'); row.className='row three'; row.dataset.mixRow='1';
      row.innerHTML='<div><label><input type="checkbox" data-mix-active '+(i<2?'checked':'')+'> 纳入计算</label><select data-mix-species>'+components.map(v=>'<option value="'+v[0]+'" '+(v[0]===c[0]?'selected':'')+'>'+v[1]+' / '+v[2]+'</option>').join('')+'</select></div><div><label>进料/液相摩尔分率 zᵢ 或 xᵢ</label><input data-mix-z type="number" min="0" max="1" step="any" value="'+(i===0?'.5':i===1?'.5':'0')+'"></div><div><label>临界参数来源</label><span class="note">'+c[6]+'</span><p class="note">Tc '+c[3]+' K · Pc '+c[4]+' MPa · ω '+c[5]+'</p></div>';
      host.append(row);
    }
  }
  function showResult(r, kind) {
    const html = '<p><b>计算类型：</b>'+kind+'；<b>状态：</b>'+r.phase+'；<b>气相分率 β：</b>'+r.beta.toFixed(8)+'</p>'+
      '<p>压力：'+(r.P/1e6).toFixed(7)+' MPa；迭代：'+(r.iterations||r.outerIterations||'—')+'；残差：'+r.residual.toExponential(3)+'；逸度残差：'+r.fugacityResidual.toExponential(3)+'</p>'+
      '<div class="scroll"><table><thead><tr><th>组分</th><th>zᵢ</th><th>Kᵢ</th><th>xᵢ</th><th>yᵢ</th></tr></thead><tbody>'+
      r.z.map((v,i)=>'<tr><td>'+components.find(c=>c[0]===selected.list[i][0])?.[1]+'</td><td>'+v.toFixed(7)+'</td><td>'+r.K[i].toFixed(7)+'</td><td>'+(r.x?r.x[i].toFixed(7):'—')+'</td><td>'+(r.y?r.y[i].toFixed(7):'—')+'</td></tr>').join('')+
      '</tbody></table></div>';
    document.getElementById('mixResult').innerHTML=html;
    document.getElementById('mixNote').textContent='PR 状态方程；经典 van der Waals one-fluid mixing rule；所有非对角 kij 使用同一个用户输入值。结果为模型计算值，必须结合组分参数来源和模型适用范围核验。';
    document.getElementById('mixResult').classList.add('ok');
  }
  let selected=null,last=null;
  function calculateUI(){
    try{
      selected=selectedRows();
      const T=Number(document.getElementById('mixT').value),P=Number(document.getElementById('mixP').value),kij=Number(document.getElementById('mixKij').value),mode=document.getElementById('mixMode').value;
      if(!(T>0)||!Number.isFinite(T)) throw new Error('温度必须为正数。');
      if(!Number.isFinite(kij)||Math.abs(kij)>.5) throw new Error('kij 需在 -0.5 到 0.5 之间。');
      let r;
      if(mode==='flash') r=flash(T,P*1e6,selected.list,selected.z,kij);
      else r=envelope(T,selected.list,selected.z,kij,mode);
      r.z=normalize(selected.z); r.list=selected.list;
      if(mode!=='flash') {
        const beta=mode==='bubble'?0:1;
        r.beta=beta;r.phase=mode==='bubble'?'泡点液相':'露点气相';
        r.z=normalize(selected.z);
        r.fugacityResidual=Math.max(...r.x.map((xi,i)=>Math.abs(Math.log(xi*r.phiL.phi[i]/(r.y[i]*r.phiV.phi[i])))));
      }
      last=r; showResult(r,mode==='flash'?'等温闪蒸':mode==='bubble'?'泡点压力':'露点压力');
      document.getElementById('mixNote').textContent+='\n泡/露点压力：'+(r.P/1e6).toFixed(7)+' MPa；液相 Z='+r.phiL.Z.toFixed(7)+'；气相 Z='+r.phiV.Z.toFixed(7)+'。';
    }catch(e){
      document.getElementById('mixResult').innerHTML='';
      document.getElementById('mixNote').textContent=e.message||String(e);
      document.getElementById('mixNote').className='result err';
    }
  }
  function exportCsv(){
    if(!last)return;
    const rows=[['component','z','K','x','y'],...last.list.map((c,i)=>[c[2],last.z[i],last.K[i],last.x?last.x[i]:'',last.y?last.y[i]:''])];
    const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='TJU-ThermoHub-PR-VLE.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function init(){
    if(!g.document || !document.getElementById('mixRows'))return;
    renderRows();
    document.getElementById('mixCalc').addEventListener('click',calculateUI);
    document.getElementById('mixExport').addEventListener('click',exportCsv);
  }
  g.ThermoMixture=Object.freeze({components,flash,fugacity,bubblePoint:(T,list,x,kij=0)=>envelope(T,list,x,kij,'bubble'),dewPoint:(T,list,y,kij=0)=>envelope(T,list,y,kij,'dew'),normalize});
  if(g.document) document.addEventListener('DOMContentLoaded',init);
})(typeof window!=='undefined'?window:globalThis);
