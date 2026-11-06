import test from 'node:test';
import assert from 'node:assert/strict';
import {propertiesPT,saturationPressure,saturationProps,propertiesPH,interpolateLinear,interpolateBilinear} from '../assets/js/core/if97.js';
import {pureEOS,wilsonVLE} from '../assets/js/core/eos.js';

test('IF97 Region 1 verification point: 3 MPa, 300 K',()=>{
 const r=propertiesPT(3,300);
 assert.equal(r.region,1);
 assert.ok(Math.abs(r.v-0.00100215168)<2e-10);
 assert.ok(Math.abs(r.h-115.331273)<2e-4);
 assert.ok(Math.abs(r.s-0.3922947928)<2e-7);
});

test('IF97 Region 2 verification point: 0.0035 MPa, 300 K',()=>{
 const r=propertiesPT(0.0035,300);
 assert.equal(r.region,2);
 assert.ok(Math.abs(r.v-39.4913866)<1e-6);
 assert.ok(Math.abs(r.h-2549.91145)<1e-4);
 assert.ok(Math.abs(r.s-8.52238967)<1e-7);
});

test('IF97 Region 3 verification point: rho=500 kg/m3, 650 K pressure inversion',()=>{
 const r=propertiesPT(25.5837018101,650);
 assert.equal(r.region,3);
 assert.ok(Math.abs(r.rho-500)<0.02);
 assert.ok(Math.abs(r.h-1863.43019)<0.05);
});

test('IF97 Region 5 verification point: 0.5 MPa, 1500 K',()=>{
 const r=propertiesPT(0.5,1500);
 assert.equal(r.region,5);
 assert.ok(Math.abs(r.v-1.38455090)<1e-7);
 assert.ok(Math.abs(r.h-5219.76855)<1e-4);
 assert.ok(Math.abs(r.s-9.65408875)<1e-7);
});

test('IF97 saturation pressure at 373.15 K',()=>{
 assert.ok(Math.abs(saturationPressure(373.15)-0.1014179779)<1e-9);
 const s=saturationProps(373.15);
 assert.ok(Math.abs(s.liquid.h-419.099)<1); // reference-state check, broad teaching tolerance
 assert.ok(s.vapor.h>s.liquid.h);
});

test('IF97 critical-point P-h input does not produce an undefined quality',()=>{
 const s=saturationProps(647.096);
 const r=propertiesPH(s.P,s.liquid.h);
 assert.equal(r.phase,'critical-point');
 assert.equal(r.quality,null);
});

test('IF97 P-T saturation boundary requests vapor quality',()=>{
 const p=saturationPressure(373.15);
 const r=propertiesPT(p,373.15);
 assert.equal(r.region,4);
 assert.equal(r.requiresQuality,true);
});

test('IF97 P-h subcooled liquid reverse calculation',()=>{
 const r=propertiesPH(3,500);
 assert.ok(r.T<507.0);
 assert.equal(r.region,1);
});

test('IF97 P-h superheated Region 5 reverse calculation',()=>{
 const r=propertiesPH(0.5,5219.768551);
 assert.equal(r.region,5);
 assert.ok(Math.abs(r.T-1500)<1e-4);
});

test('IF97 P-h wet steam reverse calculation',()=>{
 const r=propertiesPH(3,2800);
 assert.equal(r.phase,'two-phase');
 assert.ok(r.quality>0&&r.quality<1);
});

test('interpolation utilities',()=>{
 assert.equal(interpolateLinear(1,10,3,30,2),20);
 assert.equal(interpolateBilinear(1,3,1,3,10,20,30,40,2,2),25);
});

test('Peng-Robinson pure-fluid root',()=>{
 const r=pureEOS('pr',{Tc:304.1282,Pc:7.3773,omega:.22394},300,1);
 assert.ok(r.vapor.Z>0.9&&r.vapor.Z<1.0);
 assert.ok(r.vapor.phi>0&&r.vapor.phi<1.1);
});

test('binary Wilson VLE estimate returns normalized phase compositions',()=>{
 const s1={Tc:190.56,Pc:4.599,omega:.011},s2={Tc:304.1282,Pc:7.3773,omega:.22394};
 const r=wilsonVLE({mode:'bubbleP',T:250,P:1,z1:.4,sub1:s1,sub2:s2,k12:0});
 assert.ok(r.P>0);
 assert.ok(Math.abs(r.x[0]+r.x[1]-1)<1e-10);
 assert.ok(Math.abs(r.y[0]+r.y[1]-1)<1e-10);
});
