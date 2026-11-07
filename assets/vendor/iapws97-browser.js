/*
 * IAPWS-IF97 browser bundle adapted from @neutrium/thermo.eos.iapws97 v2.1.0.
 * Upstream: https://github.com/neutrium/thermo.eos.iapws97
 * Author: Trevor Walker / Neutrium. License: Creative Commons Attribution 4.0 (CC BY 4.0).
 * Adaptation: CommonJS modules wrapped for static browser use; State return wrapper made plain-object compatible.
 * IAPWS formulation reference: IAPWS R7-97(2012), https://iapws.org/technical-guidance/release/IF97-Rev
 */
(function(global) {
  'use strict';
  const modules = Object.create(null);
  function __register(name, factory) {
    const module = { exports: {} };
    const require = (request) => {
      const key = request.replace(/^\\.\\//, '');
      if (!modules[key]) throw new Error('IF97 module dependency not loaded: ' + request);
      return modules[key];
    };
    factory(module, module.exports, require);
    modules[name] = module.exports;
  }
  __register("base", function(module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constants = void 0;
exports.CONST = CONST;
exports.viscosity = viscosity;
exports.thermal_conductivity = thermal_conductivity;
exports.surface_tension = surface_tension;
exports.dielectric_constant = dielectric_constant;
exports.ionization_constant = ionization_constant;
exports.constants = {
    // Critical and Gas Constants
    'R': 0.461526, // kJ/kg.K
    //'Tc' : 647.096,					// K
    'Pc': 22.064, // Mpa
    //'Rhoc' : 322,					// kg/m3
    // Temperature and Pressure region limits
    'MIN_P': 0.000611213, // MPa
    'MAX_P': 100.0, // MPa
    'MAX_T': 2273.15, // K
    'MIN_T': 273.15, // K
    'MIN_S': -0.000154549592045, // kJ/kg
    'MIN_H': -0.041587825659104, // kJ/kg.K
    'R2_MIN_T': 623.15, // K
    'R2_MAX_T': 1073.15, // K
    'R2_CRT_S': 5.85, // kJ/kg.K
    'R2_CRT_P': 4.0, // MPa
    'B23_MIN_P': 16.5292, // MPa (The region 2-3 boundary pressure at R2_MIN_T)
    'B23_MAX_T': 863.15, // K   (The region 2-3 boundary temperature at MAX_P)
    'R5_MIN_T': 1073.15, // K
    'R5_MAX_P': 50, // Mpa
    'R5_MAX_T': 2273.15, // K
    'R3_MIN_T': 623.15, // K
    'R3_CRT_S': 4.41202148223476, // kJ/kg.K
    'B23_S_MIN': 5.048096828,
    'B23_S_MAX': 5.260578707,
    'B23_H_MIN': 2563.592004,
    'B23_H_MAX': 2812.942061
};
// This function is to help in porting to typescript
function CONST(key) {
    return exports.constants[key];
}
//
// Auxiliary Equation for additional properties
//
//
//	Comments : IAPWS Viscosity of ordinary water substances 2008
//
//	@param T is the temperature in K
//	@param Rho is the density in kg/m^3
//
//	@return Viscosity in Pa.s (P)
//
function viscosity(T, ρ) {
    let T_hat = T / 647.096, ρ_hat = ρ / 322, μ0_H = [1.67752, 2.20462, 0.6366564, -0.241605], μ0 = 100 * Math.sqrt(T_hat), x = 0, y = 0;
    for (let i = 0; i < 4; i++) {
        x += μ0_H[i] / Math.pow(T_hat, i);
    }
    μ0 = μ0 / x;
    let μ1 = 0, μ1_H = [5.20094E-1, 8.50895E-2, -1.08374, -2.89555E-1, 0, 0, 2.22531E-1, 9.99115E-1, 1.88797, 1.26613, 0, 1.20573E-1, -2.81378E-1, -9.06851E-1, -7.72479E-1, -4.89837E-1, -2.5704E-1, 0, 1.61913E-1, 2.57399E-1, 0, 0, 0, 0, -3.25372E-2, 0, 0, 6.98452E-2, 0, 0, 0, 0, 0, 0, 8.72102E-3, 0, 0, 0, 0, -4.35673E-3, 0, -5.93264E-4];
    for (let j = 0; j < 6; j++) {
        x = Math.pow(1 / T_hat - 1, j);
        y = 0;
        for (let z = 0; z < 7; z++) {
            y += μ1_H[z * 6 + j] * Math.pow(ρ_hat - 1, z);
        }
        μ1 += x * y;
    }
    μ1 = Math.exp(ρ_hat * μ1);
    // No correction at the subcritical region yet
    let μ2 = 1;
    /*
    // start of critcial enhancement
    let chi = rho_hat*(zetaX(T_hat, rho_hat) - zetaR(rho_hat)*1.5/T_hat),
        xi = 0.13*Math.pow(chi/0.06, 0.63/1.239),
        psi_d = Math.acos(Math.pow(1+xi*xi/1.21, -0.5)),
        w = Math.sqrt((xi/1.9-1)/(xi/1.9+1))*Math.tan(0.5*psi_d),
        Lw = xi/1.9 > 1 ? Math.log((1+w)/(1-w)) : 2*Math.atan(Math.abs(w)),
        qcxi = xi/1.9,
        qdxi = xi/1.1;

    if(xi >  0.3817016416)
    {
        y = (1/12)*Math.sin(3*psi_d) - (1/(4*qcxi))*Math.sin(2*psi_d) + 1/(qcxi*qcxi)*(1 - 5*qcxi*qcxi/4)*Math.sin(psi_d) - 1/Math.pow(qcxi, 3)*((1 - 1.5*qcxi*qcxi)*psi_d - Math.pow(Math.abs(qcxi*qcxi-1),1.5)*Lw);
    }
    else
    {
        y = (1/5)*qcxi*Math.pow(qdxi,5)*(1 - qcxi + qcxi*qcxi - 765*qdxi*qdxi/504);
    }
    */
    return μ0 * μ1 * μ2;
}
//
//	Comments : IAPWS Thermal conductivity of ordinary water substances 2011
//
//	@param T is the temperature in K
//	@param Rho is the density in kg/m^3
//
//	@return The thermal conductivity in mW/m.K
//
function thermal_conductivity(T, ρ) {
    let T_hat = T / 647.096, ρ_hat = ρ / 322, k0_L = [2.443221E-3, 1.323095E-2, 6.770357E-3, -3.454586E-3, 4.096266E-4], k0 = 0;
    for (let i = 0; i < 5; i++) {
        k0 += k0_L[i] / Math.pow(T_hat, i);
    }
    k0 = Math.sqrt(T_hat) / k0;
    let k1 = 0, k1_L = [1.60397357, -0.646013523, 0.111443906, 0.102997357, -0.0504123634, 0.00609859258, 2.33771842, -2.78843778, 1.53616167, -0.463045512, 0.0832827019, -0.00719201245, 2.19650529, -4.54580785, 3.55777244, -1.40944978, 0.275418278, -0.0205938816, -1.21051378, 1.60812989, -0.621178141, 0.0716373224, 0, 0, -2.720337, 4.57586331, -3.18369245, 1.1168348, -0.19268305, 0.012913842], x = 0, y = 0;
    for (let j = 0; j < 5; j++) {
        x = Math.pow(1 / T_hat - 1, j);
        y = 0;
        for (let z = 0; z < 6; z++) {
            y += k1_L[j * 6 + z] * Math.pow(ρ_hat - 1, z);
        }
        k1 += x * y;
    }
    k1 = Math.exp(ρ_hat * k1);
    // The critical enhancement not implemented yet
    let k2 = 0;
    /*
    To be included once zeta(T_hat, rho_hat) function found

    let mu_hat = mu/1E-6,	// need mu
        cp_hat = cp/R,
        chi = rho_hat*(zeta(T_hat, rho_hat) - 1.5*zetaR(rho_hat)/T-hat),
        xi = 0.13*Math.pow(chi/0.06, 0.63/1.239),
        y = (xi/0.4),
        kappa = cp/cv, // get this from previous calculations
        Z = 2/(Math.PI*y)*(((1 - 1/kappa)*Math.atan(y) + y/kappa) - (1 - Math.exp(-1/(1/y + y*y/(3*rho_hat*rho_hat))))),
        k2 = 177.8514*rho_hat*cp_hat*T_hat*Z/mu_hat;

    function zetaR(rho_hat)
    {
        let a = [6.53786807199516, 6.52717759281799, 5.35500529896124, 1.55225959906681, 1.11999926419994, -5.61149954923348, -6.30816983387575, -3.96415689925446, 0.464621290821181, 0.595748562571649, 3.39624167361325, 8.08379285492595, 8.91990208918795, 8.93237374861479, 9.88952565078920, -2.27492629730878, -9.82240510197603, -12.0338729505790, -11.0321960061126, -10.3255051147040, 10.2631854662709, 12.1358413791395, 9.19494865194302, 6.16780999933360, 4.66861294457414, 1.97815050331519, -5.54349664571295, -2.16866274479712, -0.965458722086812, -0.503243546373828];
            j = 0,
            z = 0;

        if(rho_hat <= 0.310559006)
        {
            j = 0;
        }
        else if(rho_hat <= 0.776397516)
        {
            j = 1;
        }
        else if(rho_hat <= 1.242236025)
        {
            j = 2;
        }
        else if(rho_hat <= 1.863354037)
        {
            j = 3;
        }
        else
        {
            j = 4;
        }

        for(let i = 0; i < 6; i++)
        {
            z += A[i*5 + j]*Math.pow(rho_hat, i);
        }

        return 1/z;
    }
    */
    return k0 * k1 + k2;
}
//
//	Comments : IAPWS Surface Tension of ordinary water substances 2014
//
//	@param T is the temperature in K
//
//	@return The surface tension in mN/m
//
function surface_tension(T) {
    let τ = 1 - T / 647.096, σ = 235.8 * Math.pow(τ, 1.256) * (1 - 0.625 * τ);
    return σ;
}
//
//	Comments : IAPWS Static Dielectric Constant of ordinary water substances 1997
//
//	@param T is the temperature in K
//	@param ρ is the density in kg . m^-3
//
//	@return The surface tension in mN/m
//
function dielectric_constant(T, ρ) {
    let MW = 0.018015268, ρm = ρ / MW, //  Molecular density (mol . m^-3)
    ρρc = ρm / (322 / MW), α = 1.636E-40, // Mean molecular polarizability (C^2 . J^-1 . m^2)
    N_a = 6.0221367E23, // Avogadro's number (mol^-1)
    μ = 6.138E-30, // Molecular dipole moment (C . m)
    ε_0 = 1 / (4E-7 * Math.PI * Math.pow(299792458, 2)), // Permittivity of free space (C^2 . J^-1 . m^-1)
    k = 1.380658E-23, // Boltzmann's constant (J . K^-1)
    Nh = [0.978224486826, -0.957771379375, 0.237511794148, 0.714692244396, -0.298217036956, -0.108863472196, 0.0949327488264, -0.00980469816509, 0.16516763497E-4, 0.937359795772E-4, -0.12317921872E-9], 
    //Nh = [0.978224486826,-0.957771379375,0.237511794148,0.714692244396,-0.298217036956,-0.108863472196,0.0949327488264,-0.00980469816509,0.000016516763497,0.0000937359795772,-1.23179218720E-10],
    Ih = [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 10], Jh = [0.25, 1, 2.5, 1.5, 1.5, 2.5, 2, 2, 5, 0.5, 10], g = 0;
    for (let i = 0; i < 11; i++) {
        g += Nh[i] * Math.pow(ρρc, Ih[i]) * Math.pow(647.096 / T, Jh[i]);
    }
    g = 1 + g + 0.00196096504426 * (ρρc) * Math.pow(T / 228 - 1, -1.2);
    let A = N_a * μ * μ * ρm * g / (ε_0 * k * T), B = N_a * α * ρm / (3 * ε_0), ε = (1 + A + 5 * B + Math.sqrt(9 + 2 * A + 18 * B + A * A + 10 * A * B + 9 * B * B)) / (4 - 4 * B);
    return ε;
}
//
//	Comments : IAPWS Ionization Constant of H2O 2007
//
//	@param T is the temperature in K
//	@param ρ is the density in kg.m^-3
//
//	@return The ionization constant in (dimensionless)
//
function ionization_constant(T, ρ) {
    let pK_wg = 0.61415 + 48251.33 / T - 67707.93 / (T * T) + 10102100 / (T * T * T), Q = ρ * Math.exp(-0.864671 + 8659.19 / T - 22786.2 * Math.pow(ρ, 2 / 3) / (T * T)), pK_w = -12 * (log10(1 + Q) - Q / (Q + 1) * ρ * (0.642044 - 56.8534 / T - 0.375754 * ρ)) + pK_wg + 2 * log10(0.018015268);
    return pK_w;
}
// Not all browsers support log10 (IE)
function log10(x) {
    return Math.log(x) / Math.LN10;
}
//# sourceMappingURL=base.js.map
});

__register("PT", function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve = solve;
exports.b23_T_P = b23_T_P;
exports.b23_P_T = b23_P_T;
exports.r1 = r1;
exports.r2 = r2;
exports.r3 = r3;
exports.b3ab_P_T = b3ab_P_T;
exports.b3op_P_T = b3op_P_T;
exports.b3ef_P_T = b3ef_P_T;
exports.b3cd_P_T = b3cd_P_T;
exports.b3gh_P_T = b3gh_P_T;
exports.b3ij_P_T = b3ij_P_T;
exports.b3jk_P_T = b3jk_P_T;
exports.b3mn_P_T = b3mn_P_T;
exports.b3qu_P_T = b3qu_P_T;
exports.b3rx_P_T = b3rx_P_T;
exports.b3uv_P_T = b3uv_P_T;
exports.b3wx_P_T = b3wx_P_T;
exports.r4_T_Psat = r4_T_Psat;
exports.r4_P_Tsat = r4_P_Tsat;
exports.r5 = r5;
const thermo_1 = { State: class State { constructor(data) { Object.assign(this, data); } } };
const NS = __importStar(require("./base"));
let R = NS.constants['R'];
//
//	Comments : Calculate the steam properties using IAWPS for a given pressure and temperature
//
//	@param P is the pressure of the water in MPa
//	@param T is the temperature in K
//
function solve(P, T, v) {
    v = (typeof v == "undefined") ? -1 : v;
    let region = findRegion_PT(P, T), result = null;
    switch (region) {
        case 1:
            result = r1(P, T);
            break;
        case 2:
            result = r2(P, T);
            break;
        case 3:
            result = r3(P, T, v);
            break;
        case 5:
            result = r5(P, T);
            break;
        default: throw new Error('(P,T) : Inputs insufficient or out of range');
    }
    return result;
}
//
//	Comments : Determines which IAPWS-IF97 region a pressure and temperature combination lie in.
//
//	@param P is the pressure of the water in MPa
//	@param T is the temperature in K
//
function findRegion_PT(P, T) {
    if (P >= NS.CONST('MIN_P') &&
        P <= NS.CONST('MAX_P') &&
        T >= NS.CONST('MIN_T') &&
        (T <= NS.CONST('R5_MIN_T') ||
            (P <= NS.CONST('R5_MAX_P') && T <= NS.CONST('MAX_T')))) {
        if (T > NS.CONST('R5_MIN_T')) {
            if (P <= NS.CONST('R5_MAX_P')) {
                return 5;
            }
            else {
                return -1;
            }
        }
        else if (T > NS.CONST('R3_MIN_T')) {
            if (P > b23_T_P(T)) {
                return 3;
            }
            else {
                return 2;
            }
        }
        else {
            if (r4_T_Psat(T) > P) {
                return 2;
            }
            else {
                return 1;
            }
        }
    }
    return -1;
}
function generateResult(r) {
    // Calculate the density from the specific volume
    r.rho = 1 / r.v;
    // Calculate additional properties using the auxillary equations
    // Viscosity cP,
    r.mu = NS.viscosity(r.t, r.rho) / 1000;
    // Thermal Conductivity W/m.K
    r.k = NS.thermal_conductivity(r.t, r.rho) / 1000;
    // Surface Tension mN/m
    r.sigma = NS.surface_tension(r.t);
    // Dielectric constant
    r.epsilon = NS.dielectric_constant(r.t, r.rho);
    // Ionization constant
    r.ic = NS.ionization_constant(r.t, r.rho);
    // Convert properties to the default units specified in @neutrium/thermo (where required)
    r.p = r.p * 1000000; // Pressure MPa -> Pa
    return new thermo_1.State(r);
}
// Auxiliary equations for Regions 2 and 3
// Equation 5 (pp. 5) of IAPWS-97
// Returns the pressure for a given temperature along the region 2-3 boundary
function b23_T_P(T) {
    return 348.05185628969 - 1.1671859879975 * T + 0.0010192970039326 * T * T;
}
// Equation 6 (pp. 6) of IAPWS-97
// Returns the temperature for a given pressure along the region 2-3 boundary
// Exported for use in the PH module
function b23_P_T(P) {
    return 572.54459862746 + Math.pow((P - 13.91883977887) / 0.0010192970039326, 0.5);
}
// Region 1 forwards equation
function r1(P, T) {
    let R1_PT_N = [0.14632971213167, -0.84548187169114, -3.756360367204, 3.3855169168385, -0.95791963387872, 0.15772038513228, -0.016616417199501, 8.1214629983568E-4, 2.8319080123804E-4, -6.0706301565874E-4, -0.018990068218419, -0.032529748770505, -0.021841717175414, -5.283835796993E-5, -4.7184321073267E-4, -3.0001780793026E-4, 4.7661393906987E-5, -4.4141845330846E-6, -7.2694996297594E-16, -3.1679644845054E-5, -2.8270797985312E-6, -8.5205128120103E-10, -2.2425281908E-6, -6.5171222895601E-7, -1.4341729937924E-13, -4.0516996860117E-7, -1.2734301741641E-9, -1.7424871230634E-10, -6.8762131295531E-19, 1.4478307828521E-20, 2.6335781662795E-23, -1.1947622640071E-23, 1.8228094581404E-24, -9.3537087292458E-26], R1_PT_J = [-2, -1, 0, 1, 2, 3, 4, 5, -9, -7, -1, 0, 1, 3, -3, 0, 1, 3, 17, -4, 0, 6, -5, -2, 10, -8, -11, -6, -29, -31, -38, -39, -40, -41], R1_PT_I = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 8, 8, 21, 23, 29, 30, 31, 32], tau = 1386.0 / T, pi = P / 16.53, g = 0, g_p = 0, g_pp = 0, g_t = 0, g_tt = 0, g_pt = 0;
    for (let i = 0; i < 34; i++) {
        let I = R1_PT_I[i], J = R1_PT_J[i], N = R1_PT_N[i];
        g += N * Math.pow(7.1 - pi, I) * Math.pow(tau - 1.222, J);
        g_p += -N * I * Math.pow(7.1 - pi, I - 1) * Math.pow(tau - 1.222, J);
        g_pp += N * I * (I - 1) * Math.pow(7.1 - pi, I - 2) * Math.pow(tau - 1.222, J);
        g_t += N * Math.pow(7.1 - pi, I) * J * Math.pow(tau - 1.222, J - 1);
        g_tt += N * Math.pow(7.1 - pi, I) * J * (J - 1) * Math.pow(tau - 1.222, J - 2);
        g_pt += -N * I * Math.pow(7.1 - pi, I - 1) * J * Math.pow(tau - 1.222, J - 1);
    }
    return generateResult({
        p: P,
        t: T,
        v: R * T * pi * g_p / (1000 * P),
        u: R * T * (tau * g_t - pi * g_p),
        s: R * (tau * g_t - g),
        h: R * T * tau * g_t,
        cp: R * (-Math.pow(tau, 2) * g_tt),
        cv: R * (-Math.pow(tau, 2) * g_tt + Math.pow(g_p - tau * g_pt, 2) / g_pp),
        w: Math.pow(1000 * R * T * Math.pow(g_p, 2) / (Math.pow(g_p - tau * g_pt, 2) / (Math.pow(tau, 2) * g_tt) - g_pp), 0.5)
    });
}
function r2(P, T) {
    let R2I_PT_N = [-9.6927686500217, 10.086655968018, -0.005608791128302, 0.071452738081455, -0.40710498223928, 1.4240819171444, -4.383951131945, -0.28408632460772, 0.021268463753307], R2I_PT_J = [0, 1, -5, -4, -3, -2, -1, 2, 3], R2R_PT_N = [-1.7731742473213E-3, -0.017834862292358, -0.045996013696365, -0.057581259083432, -0.05032527872793, -3.3032641670203E-5, -1.8948987516315E-4, -3.9392777243355E-3, -0.043797295650573, -2.6674547914087E-5, 2.0481737692309E-8, 4.3870667284435E-7, -3.227767723857E-5, -1.5033924542148E-3, -0.040668253562649, -7.8847309559367E-10, 1.2790717852285E-8, 4.8225372718507E-7, 2.2922076337661E-6, -1.6714766451061E-11, -2.1171472321355E-3, -23.895741934104, -5.905956432427E-18, -1.2621808899101E-6, -0.038946842435739, 1.1256211360459E-11, -8.2311340897998, 1.9809712802088E-8, 1.0406965210174E-19, -1.0234747095929E-13, -1.0018179379511E-9, -8.0882908646985E-11, 0.10693031879409, -0.33662250574171, 8.9185845355421E-25, 3.0629316876232E-13, -4.2002467698208E-6, -5.9056029685639E-26, 3.7826947613457E-6, -1.2768608934681E-15, 7.3087610595061E-29, 5.5414715350778E-17, -9.436970724121E-7], R2R_PT_J = [0, 1, 2, 3, 6, 1, 2, 4, 7, 36, 0, 1, 3, 6, 35, 1, 2, 3, 7, 3, 16, 35, 0, 11, 25, 8, 36, 13, 4, 10, 14, 29, 50, 57, 20, 35, 48, 21, 53, 39, 26, 40, 58], R2R_PT_I = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10, 10, 16, 16, 18, 20, 20, 20, 21, 22, 23, 24, 24, 24], pi = P, tau = 540 / T, gi = Math.log(pi), gi_p = 1 / pi, gi_pp = -1 / (pi * pi), gi_t = 0, gi_tt = 0, gi_pt = 0, N, J, I;
    for (let i = 0; i < 9; i++) {
        N = R2I_PT_N[i];
        J = R2I_PT_J[i];
        gi += N * Math.pow(tau, J);
        gi_t += N * J * Math.pow(tau, J - 1);
        gi_tt += N * J * (J - 1) * Math.pow(tau, J - 2);
    }
    let gr = 0, gr_p = 0, gr_pp = 0, gr_t = 0, gr_tt = 0, gr_pt = 0;
    for (let j = 0; j < 43; j++) {
        N = R2R_PT_N[j];
        J = R2R_PT_J[j];
        I = R2R_PT_I[j];
        gr += N * Math.pow(pi, I) * Math.pow(tau - 0.5, J);
        gr_p += N * I * Math.pow(pi, I - 1) * Math.pow(tau - 0.5, J);
        gr_pp += N * I * (I - 1) * Math.pow(pi, I - 2) * Math.pow(tau - 0.5, J);
        gr_t += N * Math.pow(pi, I) * J * Math.pow(tau - 0.5, J - 1);
        gr_tt += N * Math.pow(pi, I) * J * (J - 1) * Math.pow(tau - 0.5, J - 2);
        gr_pt += N * I * Math.pow(pi, I - 1) * J * Math.pow(tau - 0.5, J - 1);
    }
    return generateResult({
        p: P,
        t: T,
        v: (R * T / (1000 * P)) * pi * (gi_p + gr_p),
        u: R * T * (tau * (gi_t + gr_t) - pi * (gi_p + gr_p)),
        s: R * (tau * (gi_t + gr_t) - (gi + gr)),
        h: R * T * tau * (gi_t + gr_t),
        cp: -R * tau * tau * (gi_tt + gr_tt),
        cv: R * (-tau * tau * (gi_tt + gr_tt) - Math.pow(1 + pi * gr_p - tau * pi * gr_pt, 2) / (1 - pi * pi * gr_pp)),
        w: Math.pow(1000 * R * T * (1 + 2 * pi * gr_p + pi * pi * gr_p * gr_p) / ((1 - pi * pi * gr_pp) + Math.pow(1 + pi * gr_p - tau * pi * gr_pt, 2) / (tau * tau * (gi_tt + gr_tt))), 0.5)
    });
}
//
// Region 3
//
// Use a optional argument to calculate density
function r3(P, T, rho) {
    let v = 1;
    if (rho == -1 || typeof rho == 'undefined') {
        // Density has not been set - calculate it
        v = r3_PT_v(P, T);
        rho = 1 / v;
    }
    else {
        v = 1 / rho;
    }
    let R3_PT_N = [1.0658070028513, -15.732845290239, 20.944396974307, -7.6867707878716, 2.6185947787954, -2.808078114862, 1.2053369696517, -8.4566812812502E-03, -1.2654315477714, -1.1524407806681, 0.88521043984318, -0.64207765181607, 0.38493460186671, -0.85214708824206, 4.8972281541877, -3.0502617256965, 0.039420536879154, 0.12558408424308, -0.2799932969871, 1.389979956946, -2.018991502357, -8.2147637173963E-03, -0.47596035734923, 0.0439840744735, -0.44476435428739, 0.90572070719733, 0.70522450087967, 0.10770512626332, -0.32913623258954, -0.50871062041158, -0.022175400873096, 0.094260751665092, 0.16436278447961, -0.013503372241348, -0.014834345352472, 5.7922953628084E-04, 3.2308904703711E-03, 8.0964802996215E-05, -1.6557679795037E-04, -4.4923899061815E-05], R3_PT_J = [0, 0, 1, 2, 7, 10, 12, 23, 2, 6, 15, 17, 0, 2, 6, 7, 22, 26, 0, 2, 4, 16, 26, 0, 2, 4, 26, 1, 3, 26, 0, 2, 26, 2, 26, 2, 26, 0, 1, 26], R3_PT_I = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 8, 9, 9, 10, 10, 11], g = rho / 322, tau = 647.096 / T, s = R3_PT_N[0] * Math.log(g), s_g = R3_PT_N[0] / g, s_gg = -R3_PT_N[0] / Math.pow(g, 2), s_t = 0, s_tt = 0, s_gt = 0;
    // Need to start from i = 1 because j[0] and i[0] are NA and not used
    for (let i = 1; i < 40; i++) {
        let N = R3_PT_N[i], J = R3_PT_J[i], I = R3_PT_I[i];
        s += N * Math.pow(g, I) * Math.pow(tau, J);
        s_g += N * I * Math.pow(g, I - 1.0) * Math.pow(tau, J);
        s_gg += N * I * (I - 1.0) * Math.pow(g, I - 2.0) * Math.pow(tau, J);
        s_t += N * Math.pow(g, I) * J * Math.pow(tau, J - 1.0);
        s_tt += N * Math.pow(g, I) * J * (J - 1.0) * Math.pow(tau, J - 2.0);
        s_gt += N * I * Math.pow(g, I - 1.0) * J * Math.pow(tau, J - 1.0);
    }
    return generateResult({
        p: rho * R * T * g * s_g / 1000,
        t: T,
        v: v,
        u: R * T * tau * s_t,
        s: R * (tau * s_t - s),
        h: R * T * (tau * s_t + g * s_g),
        cp: R * (-Math.pow(tau, 2) * s_tt + Math.pow(g * s_g - g * tau * s_gt, 2) / (2 * g * s_g + Math.pow(g, 2) * s_gg)),
        cv: R * (-Math.pow(tau, 2) * s_tt),
        w: Math.pow(1000 * R * T * (2 * g * s_g + Math.pow(g, 2) * s_gg - Math.pow(g * s_g - g * tau * s_gt, 2) / (Math.pow(tau, 2) * s_tt)), 0.5)
    });
}
// Selection criteria from table 2, page 10 of PT Region 3 supplementary release
function r3_PT_v(P, T) {
    let Tsat = r4_P_Tsat(P), b3cd = b3cd_P_T(P);
    if (40.0 < P && P <= 100.0) {
        if (T <= b3ab_P_T(P)) {
            return r3a_PT_v(P, T);
        }
        else {
            return r3b_PT_v(P, T);
        }
    }
    else if (25.0 < P && P <= 40.0) {
        if (T <= b3cd) {
            return r3c_PT_v(P, T);
        }
        else if (T <= b3ab_P_T(P)) {
            return r3d_PT_v(P, T);
        }
        else if (T <= b3ef_P_T(P)) {
            return r3e_PT_v(P, T);
        }
        else {
            return r3f_PT_v(P, T);
        }
    }
    else if (22.5 < P && P <= 25.0) {
        if (T <= b3cd) {
            return r3c_PT_v(P, T);
        }
        else if (T <= b3gh_P_T(P)) {
            if (P <= 23.5) {
                return r3l_PT_v(P, T);
            }
            return r3g_PT_v(P, T);
        }
        else if (T <= b3ef_P_T(P)) {
            if (P <= 23.0) {
                if (T <= b3mn_P_T(P)) {
                    return r3m_PT_v(P, T);
                }
                else {
                    return r3n_PT_v(P, T);
                }
            }
            return r3h_PT_v(P, T);
        }
        else if (T <= b3ij_P_T(P)) {
            if (P <= 23.0) {
                if (T <= b3op_P_T(P)) {
                    return r3o_PT_v(P, T);
                }
                else {
                    return r3p_PT_v(P, T);
                }
            }
            return r3i_PT_v(P, T);
        }
        else if (T <= b3jk_P_T(P)) {
            return r3j_PT_v(P, T);
        }
        else {
            return r3k_PT_v(P, T);
        }
    }
    else if (21.04336732 < P && P <= 22.5) // R4_T_Psat(643.15) < P < 22.5
     {
        if (T <= b3cd) {
            return r3c_PT_v(P, T);
        }
        else if (T <= b3qu_P_T(P)) {
            return r3q_PT_v(P, T);
        }
        else if (T <= b3rx_P_T(P)) {
            //critical region
            if (P <= 22.064) {
                //Subcritical pressure region
                if (T <= Tsat) {
                    if (P <= 21.93161551) {
                        return r3u_PT_v(P, T);
                    }
                    else {
                        if (T <= b3uv_P_T(P)) {
                            return r3u_PT_v(P, T);
                        }
                        else {
                            return r3y_PT_v(P, T);
                        }
                    }
                }
                else {
                    if (P <= 21.90096265) {
                        return r3x_PT_v(P, T);
                    }
                    else {
                        if (T <= b3wx_P_T(P)) {
                            return r3z_PT_v(P, T);
                        }
                        else {
                            return r3x_PT_v(P, T);
                        }
                    }
                }
            }
            else {
                //Supercritical pressure region
                if (T <= b3uv_P_T(P)) {
                    return r3u_PT_v(P, T);
                }
                else if (T <= b3ef_P_T(P)) {
                    if (P <= 22.11) {
                        return r3y_PT_v(P, T);
                    }
                    else {
                        return r3v_PT_v(P, T);
                    }
                }
                else if (T <= b3wx_P_T(P)) {
                    if (P <= 22.11) {
                        return r3z_PT_v(P, T);
                    }
                    else {
                        return r3w_PT_v(P, T);
                    }
                }
                else {
                    return r3x_PT_v(P, T);
                }
            }
        }
        else if (T <= b3jk_P_T(P)) {
            return r3r_PT_v(P, T);
        }
        else {
            return r3k_PT_v(P, T);
        }
    }
    else if (20.5 < P && P <= 21.04336732) {
        if (T <= b3cd) {
            return r3c_PT_v(P, T);
        }
        else if (T <= Tsat) {
            return r3s_PT_v(P, T);
        }
        else if (T <= b3jk_P_T(P)) {
            return r3r_PT_v(P, T);
        }
        else {
            return r3k_PT_v(P, T);
        }
    }
    else if (19.00881189173929 < P && P <= 20.5) {
        if (T <= b3cd) {
            return r3c_PT_v(P, T);
        }
        else if (T <= Tsat) {
            return r3s_PT_v(P, T);
        }
        else {
            return r3t_PT_v(P, T);
        }
    }
    else if (16.52916427498 < P && P <= 19.00881189173929) // R4_T_Psat(623.15) < P < P3cd
     {
        if (T <= Tsat) {
            return r3c_PT_v(P, T);
        }
        else {
            return r3t_PT_v(P, T);
        }
    }
    // Else specific volume cannot be calculated and set to -ve
    return -1.0;
}
// Subregion Boundary equations for Region 3
// From pp. 9 of Supplementary Release on Backward Equations for Specific Volume as a Function of Pressure and Temperature v(p,T)
// @internal - Exported for unit testing only
function b3ab_P_T(P) {
    let B3ab_PT_I = [0, 1, 2, -1, -2], B3ab_PT_N = [1.54793642129415E3, -1.87661219490113E2, 2.13144632222113E1, -1.91887498864292E3, 9.18419702359447E2], T = 0;
    P = Math.log(P);
    for (let i = 0; i < 5; i++) {
        T += B3ab_PT_N[i] * Math.pow(P, B3ab_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3op_P_T(P) {
    let B3op_PT_I = [0, 1, 2, -1, -2], B3op_PT_N = [9.69461372400213E2, -3.32500170441278E2, 6.4285959846667E1, 7.73845935768222E2, -1.52313732937084E3], T = 0;
    P = Math.log(P);
    for (let i = 0; i < 5; i++) {
        T += B3op_PT_N[i] * Math.pow(P, B3op_PT_I[i]);
    }
    return T;
}
// Exported for testing
function b3ef_P_T(P) {
    return 3.727888004 * (P - 22.064) + 647.096;
}
// @internal - Exported for unit testing only
function b3cd_P_T(P) {
    let B3cd_PT_I = [0, 1, 2, 3], B3cd_PT_N = [5.85276966696349E2, 2.78233532206915, -1.27283549295878E-2, 1.59090746562729E-4], T = 0;
    for (let i = 0; i < 4; i++) {
        T += B3cd_PT_N[i] * Math.pow(P, B3cd_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3gh_P_T(P) {
    let B3gh_PT_I = [0, 1, 2, 3, 4], B3gh_PT_N = [-2.49284240900418E4, 4.28143584791546E3, -2.6902917314013E2, 7.51608051114157, -7.87105249910383E-2], T = 0;
    for (let i = 0; i < 5; i++) {
        T += B3gh_PT_N[i] * Math.pow(P, B3gh_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3ij_P_T(P) {
    let B3ij_PT_I = [0, 1, 2, 3, 4], B3ij_PT_N = [5.84814781649163E2, -6.16179320924617E-1, 2.60763050899562E-1, -5.87071076864459E-3, 5.15308185433082E-5], T = 0;
    for (let i = 0; i < 5; i++) {
        T += B3ij_PT_N[i] * Math.pow(P, B3ij_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3jk_P_T(P) {
    let B3jk_PT_I = [0, 1, 2, 3, 4], B3jk_PT_N = [6.17229772068439E2, -7.70600270141675, 6.97072596851896E-1, -1.57391839848015E-2, 1.37897492684194E-4], T = 0;
    for (let i = 0; i < 5; i++) {
        T += B3jk_PT_N[i] * Math.pow(P, B3jk_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3mn_P_T(P) {
    let B3mn_PT_I = [0, 1, 2, 3], B3mn_PT_N = [5.35339483742384E2, 7.61978122720128, -1.58365725441648E-1, 1.92871054508108E-3], T = 0;
    for (let i = 0; i < 4; i++) {
        T += B3mn_PT_N[i] * Math.pow(P, B3mn_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3qu_P_T(P) {
    let B3qu_PT_I = [0, 1, 2, 3], B3qu_PT_N = [5.65603648239126E2, 5.29062258221222, -1.02020639611016E-1, 1.22240301070145E-3], T = 0;
    for (let i = 0; i < 4; i++) {
        T += B3qu_PT_N[i] * Math.pow(P, B3qu_PT_I[i]);
    }
    return T;
}
// @internal - Exported for unit testing only
function b3rx_P_T(P) {
    let B3rx_PT_I = [0, 1, 2, 3], B3rx_PT_N = [5.84561202520006E2, -1.02961025163669, 2.43293362700452E-1, -2.94905044740799E-3], T = 0;
    for (let i = 0; i < 4; i++) {
        T += B3rx_PT_N[i] * Math.pow(P, B3rx_PT_I[i]);
    }
    return T;
}
function r3a_PT_v(P, T) {
    let pi = P / 100, sig = T / 760, v = 0, R3a_PT_I = [-12, -12, -12, -10, -10, -10, -8, -8, -8, -6, -5, -5, -5, -4, -3, -3, -3, -3, -2, -2, -2, -1, -1, -1, 0, 0, 1, 1, 2, 2], R3a_PT_J = [5, 10, 12, 5, 10, 12, 5, 8, 10, 1, 1, 5, 10, 8, 0, 1, 3, 6, 0, 2, 3, 0, 1, 2, 0, 1, 0, 2, 0, 2], R3a_PT_N = [1.10879558823853E-3, 5.72616740810616E2, -7.67051948380852E4, -2.53321069529674E-2, 6.28008049345689E3, 2.34105654131876E5, 2.16867826045856E-1, -1.56237904341963E2, -2.69893956176612E4, -1.80407100085505E-4, 1.16732227668261E-3, 2.6698704085604E1, 2.82776617243286E4, -2.42431520029523E3, 4.35217323022733E-4, -1.22494831387441E-2, 1.79357604019989, 4.42729521058314E1, -5.93223489018342E-3, 4.53186261685774E-1, 1.3582570312914, 4.08748415856745E-2, 4.74686397863312E-1, 1.18646814997915, 5.46987265727549E-1, 1.95266770452643E-1, -5.02268790869663E-2, -3.69645308193377E-1, 6.3382803752842E-3, 7.97441793901017E-2];
    for (let i = 0; i < 30; i++) {
        let N = R3a_PT_N[i], I = R3a_PT_I[i], J = R3a_PT_J[i];
        v += N * Math.pow(pi - 0.085, I) * Math.pow(sig - 0.817, J);
    }
    return 0.0024 * v;
}
function r3b_PT_v(P, T) {
    let pi = P / 100, sig = T / 860, v = 0, R3b_PT_I = [-12, -12, -10, -10, -8, -6, -6, -6, -5, -5, -5, -4, -4, -4, -3, -3, -3, -3, -3, -2, -2, -2, -1, -1, 0, 0, 1, 1, 2, 3, 4, 4], R3b_PT_J = [10, 12, 8, 14, 8, 5, 6, 8, 5, 8, 10, 2, 4, 5, 0, 1, 2, 3, 5, 0, 2, 5, 0, 2, 0, 1, 0, 2, 0, 2, 0, 1], R3b_PT_N = [-8.27670470003621E-2, 4.16887126010565E1, 4.83651982197059E-2, -2.91032084950276E4, -1.11422582236948E2, -2.02300083904014E-2, 2.94002509338515E2, 1.40244997609658E2, -3.44384158811459E2, 3.61182452612149E2, -1.40699677420738E3, -2.02023902676481E-3, 1.71346792457471E2, -4.25597804058632, 6.91346085000334E-6, 1.51140509678925E-3, -4.16375290166236E-2, -4.13754957011042E1, -5.06673295721637E1, -5.72212965569023E-4, 6.08817368401785, 2.39600660256161E1, 1.22261479925384E-2, 2.16356057692938, 3.98198903368642E-1, -1.16892827834085E-1, -1.02845919373532E-1, -4.92676637589284E-1, 6.5554045640679E-2, -2.4046253507853E-1, -2.69798180310075E-2, 1.28369435967012E-1];
    for (let i = 0; i < 32; i++) {
        let N = R3b_PT_N[i], I = R3b_PT_I[i], J = R3b_PT_J[i];
        v += N * Math.pow(pi - 0.280, I) * Math.pow(sig - 0.779, J);
    }
    return 0.0041 * v;
}
function r3c_PT_v(P, T) {
    let pi = P / 40, sig = T / 690, v = 0, R3c_PT_I = [-12, -12, -12, -10, -10, -10, -8, -8, -8, -6, -5, -5, -5, -4, -4, -3, -3, -2, -2, -2, -1, -1, -1, 0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 8], R3c_PT_J = [6, 8, 10, 6, 8, 10, 5, 6, 7, 8, 1, 4, 7, 2, 8, 0, 3, 0, 4, 5, 0, 1, 2, 0, 1, 2, 0, 2, 0, 1, 3, 7, 0, 7, 1], R3c_PT_N = [3.1196778876303, 2.76713458847564E4, 3.22583103403269E7, -3.42416065095363E2, -8.99732529907377E5, -7.93892049821251E7, 9.53193003217388E1, 2.29784742345072E3, 1.75336675322499E5, 7.91214365222792E6, 3.19933345844209E-5, -6.59508863555767E1, -8.33426563212851E5, 6.45734680583292E-2, -3.82031020570813E6, 4.06398848470079E-5, 3.10327498492008E1, -8.92996718483724E-4, 2.34604891591616E2, 3.77515668966951E3, 1.58646812591361E-2, 7.07906336241843E-1, 1.2601622514657E1, 7.36143655772152E-1, 6.76544268999101E-1, -1.78100588189137E1, -1.56531975531713E-1, 1.17707430048158E1, 8.40143653860447E-2, -1.86442467471949E-1, -4.40170203949645E1, 1.23290423502494E6, -2.40650039730845E-2, -1.07077716660869E6, 4.38319858566475E-2];
    for (let i = 0; i < 35; i++) {
        let N = R3c_PT_N[i], I = R3c_PT_I[i], J = R3c_PT_J[i];
        v += N * Math.pow(pi - 0.259, I) * Math.pow(sig - 0.903, J);
    }
    return 0.0022 * v;
}
function r3d_PT_v(P, T) {
    let pi = P / 40, sig = T / 690, v = 0, R3d_PT_I = [-12, -12, -12, -12, -12, -12, -10, -10, -10, -10, -10, -10, -10, -8, -8, -8, -8, -6, -6, -5, -5, -5, -5, -4, -4, -4, -3, -3, -2, -2, -1, -1, -1, 0, 0, 1, 1, 3], R3d_PT_J = [4, 6, 7, 10, 12, 16, 0, 2, 4, 6, 8, 10, 14, 3, 7, 8, 10, 6, 8, 1, 2, 5, 7, 0, 1, 7, 2, 4, 0, 1, 0, 1, 5, 0, 2, 0, 6, 0], R3d_PT_N = [-4.52484847171645E-10, 3.15210389538801E-5, -2.14991352047545E-3, 5.08058874808345E2, -1.27123036845932E7, 1.15371133120497E12, -1.97805728776273E-16, 2.41554806033972E-11, -1.56481703640525E-6, 2.772113468366250E-3, -2.03578994462286E1, 1.44369489909053E6, -4.11254217946539E10, 6.23449786243773E-6, -2.21774281146038E1, -6.89315087933158E4, -1.95419525060713E7, 3.16373510564015E3, 2.24040754426988E6, -4.36701347922356E-6, -4.04213852833996E-4, -3.48153203414663E2, -3.85294213555289E5, 1.35203700099403E-7, 1.34648383271089E-4, 1.25031835351736E5, 9.68123678455841E-2, 2.25660517512438E2, -1.90102435341872E-4, -2.99628410819229E-2, 5.00833915372121E-3, 3.87842482998411E-1, -1.38535367777182E3, 8.70745245971773E-1, 1.71946252068742, -3.26650121426383E-2, 4.98044171727877E3, 5.51478022765087E-3];
    for (let i = 0; i < 38; i++) {
        let N = R3d_PT_N[i], I = R3d_PT_I[i], J = R3d_PT_J[i];
        v += N * Math.pow(pi - 0.559, I) * Math.pow(sig - 0.939, J);
    }
    return 0.0029 * Math.pow(v, 4);
}
function r3e_PT_v(P, T) {
    let pi = P / 40, sig = T / 710, v = 0, R3e_PT_I = [-12, -12, -10, -10, -10, -10, -10, -8, -8, -8, -6, -5, -4, -4, -3, -3, -3, -2, -2, -2, -2, -1, 0, 0, 1, 1, 1, 2, 2], R3e_PT_J = [14, 16, 3, 6, 10, 14, 16, 7, 8, 10, 6, 6, 2, 4, 2, 6, 7, 0, 1, 3, 4, 0, 0, 1, 0, 4, 6, 0, 2], R3e_PT_N = [7.15815808404721E8, -1.14328360753449E11, 3.7653100201572E-12, -9.03983668691157E-5, 6.65695908836252E5, 5.35364174960127E9, 7.94977402335603E10, 9.22230563421437E1, -1.42586073991215E5, -1.11796381424162E6, 8.9612162964076E3, -6.69989239070491E3, 4.51242538486834E-3, -3.39731325977713E1, -1.20523111552278, 4.75992667717124E4, -2.66627750390341E5, -1.53314954386524E-4, 3.05638404828265E-1, 1.23654999499486E2, -1.04390794213011E3, -1.57496516174308E-2, 6.85331118940253E-1, 1.78373462873903, -5.4467412487891E-1, 2.04529931318843E3, -2.28342359328752E4, 4.13197481515899E-1, -3.41931835910405E1];
    for (let i = 0; i < 29; i++) {
        let N = R3e_PT_N[i], I = R3e_PT_I[i], J = R3e_PT_J[i];
        v += N * Math.pow(pi - 0.587, I) * Math.pow(sig - 0.918, J);
    }
    return 0.0032 * v;
}
function r3f_PT_v(P, T) {
    let pi = P / 40, sig = T / 730, v = 0, R3f_PT_I = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 5, 5, 6, 7, 7, 10, 12, 12, 12, 14, 14, 14, 14, 14, 16, 16, 18, 18, 20, 20, 20, 22, 24, 24, 28, 32], R3f_PT_J = [-3, -2, -1, 0, 1, 2, -1, 1, 2, 3, 0, 1, -5, -2, 0, -3, -8, 1, -6, -4, 1, -6, -10, -8, -4, -12, -10, -8, -6, -4, -10, -8, -12, -10, -12, -10, -6, -12, -12, -4, -12, -12], R3f_PT_N = [-2.51756547792325E-8, 6.01307193668763E-6, -1.00615977450049E-3, 9.99969140252192E-1, 2.14107759236486, -1.65175571959086E1, -1.41987303638727E-3, 2.69251915156554, 3.49741815858722E1, -3.00208695771783E1, -1.31546288252539, -8.39091277286169, 1.81545608337015E-10, -5.91099206478909E-4, 1.52115067087106, 2.52956470663225E-5, 1.00726265203786E-15, -1.4977453386065, -7.93940970562969E-10, -1.50290891264717E-4, 1.51205531275133, 4.70942606221652E-6, 1.95049710391712E-13, -9.11627886266077E-9, 6.04374640201265E-4, -2.25132933900136E-16, 6.10916973582981E-12, -3.03063908043404E-7, -1.37796070798409E-5, -9.19296736666106E-4, 6.39288223132545E-10, 7.53259479898699E-7, -4.00321478682929E-13, 7.56140294351614E-9, -9.12082054034891E-12, -2.37612381140539E-08, 2.69586010591874E-5, -7.32828135157839E-11, 2.4199557830666E-10, -4.05735532730322E-4, 1.89424143498011E-10, -4.86632965074563E-10];
    for (let i = 0; i < 42; i++) {
        let N = R3f_PT_N[i], I = R3f_PT_I[i], J = R3f_PT_J[i];
        v += N * Math.pow(pi - 0.587, 0.5 * I) * Math.pow(sig - 0.891, J);
    }
    return 0.0064 * Math.pow(v, 4);
}
function r3g_PT_v(P, T) {
    let pi = P / 25, sig = T / 660, v = 0, R3g_PT_I = [-12, -12, -12, -12, -12, -12, -10, -10, -10, -8, -8, -8, -8, -6, -6, -5, -5, -4, -3, -2, -2, -2, -2, -1, -1, -1, 0, 0, 0, 1, 1, 1, 3, 5, 6, 8, 10, 10], R3g_PT_J = [7, 12, 14, 18, 22, 24, 14, 20, 24, 7, 8, 10, 12, 8, 22, 7, 20, 22, 7, 3, 5, 14, 24, 2, 8, 18, 0, 1, 2, 0, 1, 3, 24, 22, 12, 3, 0, 6], R3g_PT_N = [4.12209020652996E-5, -1.14987238280587E6, 9.4818088503208E9, -1.95788865718971E17, 4.962507048713E24, -1.05549884548496E28, -7.58642165988278E11, -9.22172769596101E22, 7.25379072059348E29, -6.17718249205859E1, 1.07555033344858E4, -3.79545802336487E7, 2.28646846221831E11, -4.99741093010619E6, -2.80214310054101E30, 1.04915406769586E6, 6.13754229168619E27, 8.02056715528378E31, -2.98617819828065E7, -9.10782540134681E1, 1.35033227281565E5, -7.12949383408211E18, -1.04578785289542E36, 3.04331584444093E1, 5.93250797959445E9, -3.64174062110798E27, 9.21791403532461E-1, -3.37693609657471E-1, -7.24644143758508E1, -1.10480239272601E-1, 5.36516031875059, -2.91441872156205E3, 6.16338176535305E39, -1.2088917586118E38, 8.18396024524612E22, 9.40781944835829E8, -3.67279669545448E4, -8.37513931798655E15];
    for (let i = 0; i < 38; i++) {
        let N = R3g_PT_N[i], I = R3g_PT_I[i], J = R3g_PT_J[i];
        v += N * Math.pow(pi - 0.872, I) * Math.pow(sig - 0.971, J);
    }
    return 0.0027 * Math.pow(v, 4);
}
function r3h_PT_v(P, T) {
    let pi = P / 25, sig = T / 660, v = 0, R3h_PT_I = [-12, -12, -10, -10, -10, -10, -10, -10, -8, -8, -8, -8, -8, -6, -6, -6, -5, -5, -5, -4, -4, -3, -3, -2, -1, -1, 0, 1, 1], R3h_PT_J = [8, 12, 4, 6, 8, 10, 14, 16, 0, 1, 6, 7, 8, 4, 6, 8, 2, 3, 4, 2, 4, 1, 2, 0, 0, 2, 0, 0, 2], R3h_PT_N = [5.61379678887577E-2, 7.74135421587083E9, 1.11482975877938E-9, -1.43987128208183E-3, 1.9369655876492E3, -6.05971823585005E8, 1.71951568124337E13, -1.85461154985145E16, 3.8785116807801E-17, -3.95464327846105E-14, -1.70875935679023E2, -2.1201062070122E3, 1.77683337348191E7, 1.10177443629575E1, -2.34396091693313E5, -6.56174421999594E6, 1.56362212977396E-5, -2.129462570214, 1.35249306374858E1, 1.77189164145813E-1, 1.39499167345464E3, -7.03670932036388E-3, -1.52011044389648E-1, 9.81916922991113E-5, 1.47199658618076E-3, 2.02618487025578E1, 8.9934551894424E-1, -2.11346402240858E-1, 2.49971752957491E1];
    for (let i = 0; i < 29; i++) {
        let N = R3h_PT_N[i], I = R3h_PT_I[i], J = R3h_PT_J[i];
        v += N * Math.pow(pi - 0.898, I) * Math.pow(sig - 0.983, J);
    }
    return 0.0032 * Math.pow(v, 4);
}
function r3i_PT_v(P, T) {
    let pi = P / 25, sig = T / 660, v = 0, R3i_PT_I = [0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 4, 4, 4, 5, 5, 5, 7, 7, 8, 8, 10, 12, 12, 12, 14, 14, 14, 14, 18, 18, 18, 18, 18, 20, 20, 22, 24, 24, 32, 32, 36, 36], R3i_PT_J = [0, 1, 10, -4, -2, -1, 0, 0, -5, 0, -3, -2, -1, -6, -1, 12, -4, -3, -6, 10, -8, -12, -6, -4, -10, -8, -4, 5, -12, -10, -8, -6, 2, -12, -10, -12, -12, -8, -10, -5, -10, -8], R3i_PT_N = [1.06905684359136, -1.48620857922333, 2.59862256980408E14, -4.46352055678749E-12, -5.66620757170032E-7, -2.35302885736849E-3, -2.69226321968839E-1, 9.22024992944392, 3.57633505503772E-12, -1.73942565562222E1, 7.00681785556229E-6, -2.67050351075768E-4, -2.31779669675624, -7.53533046979752E-13, 4.81337131452891, -2.23286270422356E21, -1.18746004987383E-5, 6.46412934136496E-3, -4.10588536330937E-10, 4.22739537057241E19, 3.13698180473812E-13, 1.6439533434504E-24, -3.39823323754373E-6, -1.35268639905021E-2, -7.232525142116250E-15, 1.84386437538366E-9, -4.63959533752385E-2, -9.9226310037675E13, 6.88169154439335E-17, -2.22620998452197E-11, -5.40843018624083E-8, 3.45570606200257E-3, 4.22275800304086E10, -1.26974478770487E-15, 9.27237985153679E-10, 6.126708120164890E-14, -7.22693924063497E-12, -3.83669502636822E-4, 3.74684572410204E-4, -9.31976897511086E4, -2.47690616026922E-2, 6.58110546759474E1];
    for (let i = 0; i < 42; i++) {
        let N = R3i_PT_N[i], I = R3i_PT_I[i], J = R3i_PT_J[i];
        v += N * Math.pow(pi - 0.910, 0.5 * I) * Math.pow(sig - 0.984, J);
    }
    return 0.0041 * Math.pow(v, 4);
}
function r3j_PT_v(P, T) {
    let pi = P / 25, sig = T / 670, v = 0, R3j_PT_I = [0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 4, 5, 5, 5, 6, 10, 12, 12, 14, 14, 14, 16, 18, 20, 20, 24, 24, 28, 28], R3j_PT_J = [-1, 0, 1, -2, -1, 1, -1, 1, -2, -2, 2, -3, -2, 0, 3, -6, -8, -3, -10, -8, -5, -10, -12, -12, -10, -12, -6, -12, -5], R3j_PT_N = [-1.1137131739554E-4, 1.00342892423685, 5.30615581928979, 1.79058760078792E-6, -7.28541958464774E-4, -1.87576133371704E1, 1.99060874071849E-3, 2.4357475537729E1, -1.77040785499444E-4, -2.5968038522713E-3, -1.98704578406823E2, 7.38627790224287E-5, -2.36264692844138E-3, -1.61023121314333, 6.22322971786473E3, -9.60754116701669E-9, -5.10572269720488E-11, 7.67373781404211E-3, 6.63855469485254E-15, -7.17590735526745E-10, 1.46564542926508E-5, 3.09029474277013E-12, -4.64216300971708E-16, -3.90499637961161E-14, -2.36716126781431E-10, 4.54652854268717E-12, -4.22271787482497E-3, 2.83911742354706E-11, 2.70929002720228];
    for (let i = 0; i < 29; i++) {
        let N = R3j_PT_N[i], I = R3j_PT_I[i], J = R3j_PT_J[i];
        v += N * Math.pow(pi - 0.875, 0.5 * I) * Math.pow(sig - 0.964, J);
    }
    return 0.0054 * Math.pow(v, 4);
}
function r3k_PT_v(P, T) {
    let pi = P / 25, sig = T / 680, v = 0, R3k_PT_I = [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 5, 5, 5, 6, 6, 6, 6, 8, 10, 12], R3k_PT_J = [10, 12, -5, 6, -12, -6, -2, -1, 0, 1, 2, 3, 14, -3, -2, 0, 1, 2, -8, -6, -3, -2, 0, 4, -12, -6, -3, -12, -10, -8, -5, -12, -12, -10], R3k_PT_N = [-4.01215699576099E8, 4.84501478318406E10, 3.94721471363678E-15, 3.72629967374147E4, -3.69794374168666E-30, -3.80436407012452E-15, 4.75361629970233E-7, -8.79148916140706E-4, 8.44317863844331E-1, 1.224331626566E1, -1.04529634830279E2, 5.89702771277429E2, -2.91026851164444E13, 1.7034307284185E-6, -2.77617606975748E-4, -3.44709605486686, 2.21333862447095E1, -1.94646110037079E2, 8.08354639772825E-16, -1.8084520914547E-11, -6.96664158132412E-6, -1.81057560300994E-3, 2.55830298579027, 3.28913873658481E3, -1.73270241249904E-19, -6.61876792558034E-7, -3.9568892342125E-3, 6.04203299819132E-18, -4.00879935920517E-14, 1.60751107464958E-9, 3.83719409025556E-5, -6.49565446702457E-15, -1.49095328506E-12, 5.41449377329581E-9];
    for (let i = 0; i < 34; i++) {
        let N = R3k_PT_N[i], I = R3k_PT_I[i], J = R3k_PT_J[i];
        v += N * Math.pow(pi - 0.802, I) * Math.pow(sig - 0.935, J);
    }
    return 0.0077 * v;
}
function r3l_PT_v(P, T) {
    let pi = P / 24, sig = T / 650, v = 0, R3l_PT_I = [-12, -12, -12, -12, -12, -10, -10, -8, -8, -8, -8, -8, -8, -8, -6, -5, -5, -4, -4, -3, -3, -3, -3, -2, -2, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 2, 4, 5, 5, 6, 10, 10, 14], R3l_PT_J = [14, 16, 18, 20, 22, 14, 24, 6, 10, 12, 14, 18, 24, 36, 8, 4, 5, 7, 16, 1, 3, 18, 20, 2, 3, 10, 0, 1, 3, 0, 1, 2, 12, 0, 16, 1, 0, 0, 1, 14, 4, 12, 10], R3l_PT_N = [2.60702058647537E9, -1.88277213604704E14, 5.54923870289667E18, -7.58966946387758E22, 4.13865186848908E26, -8.1503800073806E11, -3.81458260489955E32, -1.23239564600519E-2, 2.26095631437174E7, -4.9501780950672E11, 5.29482996422863E15, -4.44359478746295E22, 5.21635864527315E34, -4.87095672740742E54, -7.14430209937547E5, 1.27868634615495E-1, -1.00752127917598E1, 7.7745143796099E6, -1.08105480796471E24, -3.57578581169659E-6, -2.12857169423484, 2.70706111085238E29, -6.95953622348829E32, 1.1060902747228E-1, 7.21559163361354E1, -3.06367307532219E14, 2.6583961888553E-5, 2.53392392889754E-2, -2.14443041836579E2, 9.37846601489667E-1, 2.231840431017, 3.38401222509191E1, 4.94237237179718E20, -1.98068404154428E-1, -1.4141534988114E30, -9.93862421613651E1, 1.25070534142731E2, -9.96473529004439E2, 4.73137909872765E4, 1.16662121219322E32, -3.15874976271533E15, -4.45703369196945E32, 6.42794932373694E32];
    for (let i = 0; i < 43; i++) {
        let N = R3l_PT_N[i], I = R3l_PT_I[i], J = R3l_PT_J[i];
        v += N * Math.pow(pi - 0.908, I) * Math.pow(sig - 0.989, J);
    }
    return 0.0026 * Math.pow(v, 4);
}
function r3m_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3m_PT_I = [0, 3, 8, 20, 1, 3, 4, 5, 1, 6, 2, 4, 14, 2, 5, 3, 0, 1, 1, 1, 28, 2, 16, 0, 5, 0, 3, 4, 12, 16, 1, 8, 14, 0, 2, 3, 4, 8, 14, 24], R3m_PT_J = [0, 0, 0, 2, 5, 5, 5, 5, 6, 6, 7, 8, 8, 10, 10, 12, 14, 14, 18, 20, 20, 22, 22, 24, 24, 28, 28, 28, 28, 28, 32, 32, 32, 36, 36, 36, 36, 36, 36, 36], R3m_PT_N = [8.11384363481847E-1, -5.68199310990094E3, -1.78657198172556E10, 7.95537657613427E31, -8.14568209346872E4, -6.59774567602874E7, -1.52861148659302E10, -5.60165667510446E11, 4.58384828593949E5, -3.85754000383848E13, 4.53735800004273E7, 9.39454935735563E11, 2.66572856432938E27, -5.47578313899097E9, 2.00725701112386E14, 1.85007245563239E12, 1.85135446828337E8, -1.70451090076385E11, 1.57890366037614E14, -2.02530509748774E15, 3.6819392618357E59, 1.70215539458936E17, 6.39234909918741E41, -8.21698160721956E14, -7.95260241872306E23, 2.3341586947851E17, -6.00079934586803E22, 5.94584382273384E24, 1.89461279349492E39, -8.10093428842645E45, 1.88813911076809E21, 1.11052244098768E35, 2.91133958602503E45, -3.2942192395146E21, -1.37570282536696E25, 1.81508996303902E27, -3.46865122768353E29, -2.1196114877426E37, -1.28617899887675E48, 4.79817895699239E64];
    for (let i = 0; i < 40; i++) {
        let N = R3m_PT_N[i], I = R3m_PT_I[i], J = R3m_PT_J[i];
        v += N * Math.pow(pi - 1, I) * Math.pow(sig - 0.997, 0.25 * J);
    }
    return 0.0028 * v;
}
function r3n_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3n_PT_I = [0, 3, 4, 6, 7, 10, 12, 14, 18, 0, 3, 5, 6, 8, 12, 0, 3, 7, 12, 2, 3, 4, 2, 4, 7, 4, 3, 5, 6, 0, 0, 3, 1, 0, 1, 0, 1, 0, 1], R3n_PT_J = [-12, -12, -12, -12, -12, -12, -12, -12, -12, -10, -10, -10, -10, -10, -10, -8, -8, -8, -8, -6, -6, -6, -5, -5, -5, -4, -3, -3, -3, -2, -1, -1, 0, 1, 1, 2, 4, 5, 6], R3n_PT_N = [2.80967799943151E-39, 6.14869006573609E-31, 5.82238667048942E-28, 3.90628369238462E-23, 8.21445758255119E-21, 4.02137961842776E-15, 6.51718171878301E-13, -2.11773355803058E-8, 2.64953354380072E-3, -1.35031446451331E-32, -6.07246643970893E-24, -4.02352115234494E-19, -7.44938506925544E-17, 1.89917206526237E-13, 3.64975183508473E-6, 1.77274872361946E-26, -3.34952758812999E-19, -4.21537726098389E-9, -3.91048167929649E-2, 5.41276911564176E-14, 7.05412100773699E-12, 2.58585887897486E-9, -4.93111362030162E-11, -1.58649699894543E-6, -5.250374278861E-1, 2.20019901729615E-3, -6.43064132636925E-3, 6.29154149015048E1, 1.35147318617061E2, 2.40560808321713E-7, -8.90763306701305E-4, -4.40209599407714E3, -3.02807107747776E2, 1.59158748314599E3, 2.32534272709876E5, -7.926812071326E5, -8.69871364662769E10, 3.54542769185671E11, 4.00849240129329E14];
    for (let i = 0; i < 39; i++) {
        let N = R3n_PT_N[i], I = R3n_PT_I[i], J = R3n_PT_J[i];
        v += N * Math.pow(pi - 0.976, I) * Math.pow(sig - 0.997, J);
    }
    return 0.0031 * Math.exp(v);
}
function r3o_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3o_PT_I = [0, 0, 0, 2, 3, 4, 4, 4, 4, 4, 5, 5, 6, 7, 8, 8, 8, 10, 10, 14, 14, 20, 20, 24], R3o_PT_J = [-12, -4, -1, -1, -10, -12, -8, -5, -4, -1, -4, -3, -8, -12, -10, -8, -4, -12, -8, -12, -8, -12, -10, -12], R3o_PT_N = [1.28746023979718E-35, -7.35234770382342E-12, 2.8907869214915E-3, 2.44482731907223E-1, 1.41733492030985E-24, -3.54533853059476E-29, -5.94539202901431E-18, -5.85188401782779E-9, 2.01377325411803E-6, 1.38647388209306, -1.73959365084772E-5, 1.37680878349369E-3, 8.14897605805513E-15, 4.25596631351839E-26, -3.87449113787755E-18, 1.3981474793024E-13, -1.71849638951521E-3, 6.41890529513296E-22, 1.18960578072018E-11, -1.55282762571611E-18, 2.33907907347507E-8, -1.74093247766213E-13, 3.77682649089149E-9, -5.16720236575302E-11];
    for (let i = 0; i < 24; i++) {
        let N = R3o_PT_N[i], I = R3o_PT_I[i], J = R3o_PT_J[i];
        v += N * Math.pow(pi - 0.974, 0.5 * I) * Math.pow(sig - 0.996, J);
    }
    return 0.0034 * v;
}
function r3p_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3p_PT_I = [0, 0, 0, 0, 1, 2, 3, 3, 4, 6, 7, 7, 8, 10, 12, 12, 12, 14, 14, 14, 16, 18, 20, 22, 24, 24, 36], R3p_PT_J = [-1, 0, 1, 2, 1, -1, -3, 0, -2, -2, -5, -4, -2, -3, -12, -6, -5, -10, -8, -3, -8, -8, -10, -10, -12, -8, -12], R3p_PT_N = [-9.82825342010366E-5, 1.05145700850612, 1.16033094095084E2, 3.24664750281543E3, -1.23592348610137E3, -5.61403450013495E-2, 8.56677401640869E-8, 2.36313425393924E2, 9.72503292350109E-3, -1.03001994531927, -1.49653706199162E-9, -2.15743778861592E-5, -8.34452198291445, 5.86602660564988E-1, 3.43480022104968E-26, 8.16256095947021E-6, 2.94985697916798E-3, 7.11730466276584E-17, 4.00954763806941E-10, 1.07766027032853E1, -4.09449599138182E-7, -7.29121307758902E-6, 6.77107970938909E-9, 6.02745973022975E-8, -3.82323011855257E-11, 1.79946628317437E-3, -3.45042834640005E-4];
    for (let i = 0; i < 27; i++) {
        let N = R3p_PT_N[i], I = R3p_PT_I[i], J = R3p_PT_J[i];
        v += N * Math.pow(pi - 0.972, 0.5 * I) * Math.pow(sig - 0.997, J);
    }
    return 0.0041 * v;
}
function r3q_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3q_PT_I = [-12, -12, -10, -10, -10, -10, -8, -6, -5, -5, -4, -4, -3, -2, -2, -2, -2, -1, -1, -1, 0, 1, 1, 1], R3q_PT_J = [10, 12, 6, 7, 8, 10, 8, 6, 2, 5, 3, 4, 3, 0, 1, 2, 4, 0, 1, 2, 0, 0, 1, 3], R3q_PT_N = [-8.2043384325995E4, 4.73271518461586E10, -8.05950021005413E-2, 3.2860002543598E1, -3.5661702998249E3, -1.72985781433335E9, 3.51769232729192E7, -7.75489259985144E5, 7.10346691966018E-5, 9.93499883820274E4, -6.4209417190457E-1, -6.12842816820083E3, 2.32808472983776E2, -1.42808220416837E-5, -6.43596060678456E-3, -4.28577227475614, 2.25689939161918E3, 1.0035565172151E-3, 3.33491455143516E-1, 1.09697576888873, 9.61917379376452E-1, -8.38165632204598E-2, 2.47795908411492, -3.19114969006533E3];
    for (let i = 0; i < 24; i++) {
        let N = R3q_PT_N[i], I = R3q_PT_I[i], J = R3q_PT_J[i];
        v += N * Math.pow(pi - 0.848, I) * Math.pow(sig - 0.983, J);
    }
    return 0.0022 * Math.pow(v, 4);
}
function r3r_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3r_PT_I = [-8, -8, -3, -3, -3, -3, -3, 0, 0, 0, 0, 3, 3, 8, 8, 8, 8, 10, 10, 10, 10, 10, 10, 10, 10, 12, 14], R3r_PT_J = [6, 14, -3, 3, 4, 5, 8, -1, 0, 1, 5, -6, -2, -12, -10, -8, -5, -12, -10, -8, -6, -5, -4, -3, -2, -12, -12], R3r_PT_N = [1.44165955660863E-3, -7.01438599628258E12, -8.30946716459219E-17, 2.61975135368109E-1, 3.93097214706245E2, -1.04334030654021E4, 4.90112654154211E8, -1.47104222772069E-4, 1.03602748043408, 3.05308890065089, -3.99745276971264E6, 5.6923371959375E-12, -4.64923504407778E-2, -5.35400396512906E-18, 3.99988795693162E-13, -5.36479560201811E-07, 1.59536722411202E-2, 2.70303248860217E-15, 2.44247453858506E-8, -9.83430636716454E-6, 6.63513144224454E-2, -9.93456957845006, 5.46491323528491E2, -1.43365406393758E4, 1.50764974125511E5, -3.37209709340105E-10, 3.77501980025469E-9];
    for (let i = 0; i < 27; i++) {
        let N = R3r_PT_N[i], I = R3r_PT_I[i], J = R3r_PT_J[i];
        v += N * Math.pow(pi - 0.874, I) * Math.pow(sig - 0.982, J);
    }
    return 0.0054 * v;
}
function r3s_PT_v(P, T) {
    let pi = P / 21, sig = T / 640, v = 0, R3s_PT_I = [-12, -12, -10, -8, -6, -5, -5, -4, -4, -3, -3, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 3, 3, 3, 4, 4, 4, 5, 14], R3s_PT_J = [20, 24, 22, 14, 36, 8, 16, 6, 32, 3, 8, 4, 1, 2, 3, 0, 1, 4, 28, 0, 32, 0, 1, 2, 3, 18, 24, 4, 24], R3s_PT_N = [-5.32466612140254E22, 1.00415480000824E31, -1.91540001821367E29, 1.05618377808847E16, 2.02281884477061E58, 8.84585472596134E7, 1.66540181638363E22, -3.13563197669111E5, -1.85662327545324E53, -6.24942093918942E-2, -5.0416072413259E9, 1.87514491833092E4, 1.21399979993217E-3, 1.88317043049455, -1.6707350396206E3, 9.65961650599775E-1, 2.94885696802488, -6.53915627346115E4, 6.04012200163444E49, -1.98339358557937E-1, -1.75984090163501E57, 3.56314881403987, -5.75991255144384E2, 4.56213415338071E4, -1.09174044987829E7, 4.37796099975134E33, -6.16552611135792E45, 1.93568768917797E9, 9.50898170425042E53];
    for (let i = 0; i < 29; i++) {
        let N = R3s_PT_N[i], I = R3s_PT_I[i], J = R3s_PT_J[i];
        v += N * Math.pow(pi - 0.886, I) * Math.pow(sig - 0.990, J);
    }
    return 0.0022 * Math.pow(v, 4);
}
function r3t_PT_v(P, T) {
    let pi = P / 20, sig = T / 650, v = 0, R3t_PT_I = [0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 7, 7, 7, 7, 7, 10, 10, 10, 10, 10, 18, 20, 22, 22, 24, 28, 32, 32, 32, 36], R3t_PT_J = [0, 1, 4, 12, 0, 10, 0, 6, 14, 3, 8, 0, 10, 3, 4, 7, 20, 36, 10, 12, 14, 16, 22, 18, 32, 22, 36, 24, 28, 22, 32, 36, 36], R3t_PT_N = [1.55287249586268, 6.64235115009031, -2.8936623672721E3, -3.85923202309848E12, -2.91002915783761, -8.29088246858083E11, 1.76814899675218, -5.34686695713469E8, 1.60464608687834E17, 1.96435366560186E5, 1.56637427541729E12, -1.78154560260006, -2.29746237623692E15, 3.85659001648006E7, 1.10554446790543E9, -6.77073830687349E13, -3.27910592086523E30, -3.41552040860644E50, -5.27251339709047E20, 2.45375640937055E23, -1.68776617209269E26, 3.58958955867578E28, -6.56475280339411E35, 3.55286045512301E38, 5.6902145441327E57, -7.00584546433113E47, -7.05772623326374E64, 1.66861176200148E52, -3.00475129680486E60, -6.68481295196808E50, 4.28432338620678E68, -4.44227367758304E71, -2.81396013562745E76];
    for (let i = 0; i < 33; i++) {
        let N = R3t_PT_N[i], I = R3t_PT_I[i], J = R3t_PT_J[i];
        v += N * Math.pow(pi - 0.803, I) * Math.pow(sig - 1.02, J);
    }
    return 0.0088 * v;
}
// Auxillary Equations for the region very close to the critical point
// T3uv ( p) approximates the isochore v = 0.00264 m3 kg-1 from 2.193161551x10^1 MPa to 22.5 MPa.
// Exported for testing
function b3uv_P_T(P) {
    let B3uv_PT_I = [0, 1, 2, 3], B3uv_PT_N = [5.28199646263062E2, 8.90579602135307, -0.222814134903755, 0.286791682263697E-2], T = 0;
    for (let i = 0; i < 4; i++) {
        T += B3uv_PT_N[i] * Math.pow(P, B3uv_PT_I[i]);
    }
    return T;
}
//T3wx ( p) approximates the isochore v = 0.00385 m3 kg-1 from 2.190096265x10 MPa to 22.5 MPa
// Exported for testing
function b3wx_P_T(P) {
    let B3wx_PT_I = [0, 1, 2, -1, -2], B3wx_PT_N = [7.2805260914538, 9.73505869861952E1, 1.47370491183191E1, 0.329196213998375E3, 8.73371668682417E2], T = 0;
    P = Math.log(P);
    for (let i = 0; i < 5; i++) {
        T += B3wx_PT_N[i] * Math.pow(P, B3wx_PT_I[i]);
    }
    return T;
}
function r3u_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3u_PT_I = [-12, -10, -10, -10, -8, -8, -8, -6, -6, -5, -5, -5, -3, -1, -1, -1, -1, 0, 0, 1, 2, 2, 3, 5, 5, 5, 6, 6, 8, 8, 10, 12, 12, 12, 14, 14, 14, 14], R3u_PT_J = [14, 10, 12, 14, 10, 12, 14, 8, 12, 4, 8, 12, 2, -1, 1, 12, 14, -3, 1, -2, 5, 10, -5, -4, 2, 3, -5, 2, -8, 8, -4, -12, -4, 4, -12, -10, -6, 6], R3u_PT_N = [1.22088349258355E17, 1.04216468608488E9, -8.82666931564652E15, 2.59929510849499E19, 2.22612779142211E14, -8.78473585050085E17, -3.14432577551552E21, -2.16934916996285E12, 1.59079648196849E20, -3.39567617303423E2, 8.84387651337836E12, -8.43405926846418E20, 1.14178193518022E1, -1.22708229235641E-4, -1.06201671767107E2, 9.03443213959313E24, -6.93996270370852E27, 6.48916718965575E-9, 7.18957567127851E3, 1.05581745346187E-3, -6.51903203602581E14, -1.60116813274676E24, -5.10254294237837E-9, -1.52355388953402E-1, 6.77143292290144E11, 2.7637843837893E14, 1.16862983141686E-2, -3.01426947980171E13, 1.6971981388484E-8, 1.04674840020929E26, -1.0801690456014E4, -9.90623601934295E-13, 5.36116483602738E6, 2.26145963747881E21, -4.8873156577621E-10, 1.5100154888067E-05, -2.2770046464392E04, -7.81754507698846E27];
    for (let i = 0; i < 38; i++) {
        let N = R3u_PT_N[i], I = R3u_PT_I[i], J = R3u_PT_J[i];
        v += N * Math.pow(pi - 0.902, I) * Math.pow(sig - 0.988, J);
    }
    return 0.0026 * v;
}
function r3v_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3v_PT_I = [-10, -8, -6, -6, -6, -6, -6, -6, -5, -5, -5, -5, -5, -5, -4, -4, -4, -4, -3, -3, -3, -2, -2, -1, -1, 0, 0, 0, 1, 1, 3, 4, 4, 4, 5, 8, 10, 12, 14], R3v_PT_J = [-8, -12, -12, -3, 5, 6, 8, 10, 1, 2, 6, 8, 10, 14, -12, -10, -6, 10, -3, 10, 12, 2, 4, -2, 0, -2, 6, 10, -12, -10, 3, -6, 3, 10, 2, -12, -2, -3, 1], R3v_PT_N = [-4.15652812061591E-55, 1.77441742924043E-61, -3.57078668203377E-55, 3.59252213604114E-26, -2.59123736380269E1, 5.9461976619346E4, -6.24184007103158E10, 3.13080299915944E16, 1.05006446192036E-9, -1.92824336984852E-6, 6.54144373749937E5, 5.13117462865044E12, -6.97595750347391E18, -1.03977184454767E28, 1.19563135540666E-48, -4.36677034051655E-42, 9.26990036530639E-30, 5.87793105620748E20, 2.80375725094731E-18, -1.92359972440634E22, 7.42705723302738E26, -5.17429682450605E1, 8.20612048645469E6, -1.88214882341448E-9, 1.84587261114837E-2, -1.35830407782663E-6, -7.23681885626348E16, -2.23449194054124E26, -1.11526741826431E-35, 2.76032601145151E-29, 1.34856491567853E14, 6.5244029334586E-10, 5.1065511977436E16, -4.68138358908732E31, -7.60667491183279E15, -4.17247986986821E-19, 3.12545677756104E13, -1.00375333864186E14, 2.47761392329058E26];
    for (let i = 0; i < 39; i++) {
        let N = R3v_PT_N[i], I = R3v_PT_I[i], J = R3v_PT_J[i];
        v += N * Math.pow(pi - 0.960, I) * Math.pow(sig - 0.995, J);
    }
    return 0.0031 * v;
}
function r3w_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3w_PT_I = [-12, -12, -10, -10, -8, -8, -8, -6, -6, -6, -6, -5, -4, -4, -3, -3, -2, -2, -1, -1, -1, 0, 0, 1, 2, 2, 3, 3, 5, 5, 5, 8, 8, 10, 10], R3w_PT_J = [8, 14, -1, 8, 6, 8, 14, -4, -3, 2, 8, -10, -1, 3, -10, 3, 1, 2, -8, -4, 1, -12, 1, -1, -1, 2, -12, -5, -10, -8, -6, -12, -10, -12, -8], R3w_PT_N = [-5.86219133817016E-8, -8.94460355005526E10, 5.31168037519774E-31, 1.09892402329239E-1, -5.75368389425212E-2, 2.28276853990249E4, -1.58548609655002E18, 3.29865748576503E-28, -6.34987981190669E-25, 6.15762068640611E-9, -9.61109240985747E7, -4.06274286652625E-45, -4.71103725498077E-13, 7.25937724828145E-1, 1.87768525763682E-39, -1.03308436323771E3, -6.62552816342168E-2, 5.7951404176571E2, 2.37416732616644E-27, 2.71700235739893E-15, -9.0788621348360E1, -1.71242509570207E-37, 1.56792067854621E2, 9.2326135790147E-1, -5.97865988422577, 3.21988767636389E6, -3.99441390042203E-30, 4.93429086046981E-08, 8.12036983370565E-20, -2.07610284654137E-12, -3.40821291419719E-07, 5.42000573372233E-18, -8.56711586510214E-13, 2.66170454405981E-14, 8.58133791857099E-6];
    for (let i = 0; i < 35; i++) {
        let N = R3w_PT_N[i], I = R3w_PT_I[i], J = R3w_PT_J[i];
        v += N * Math.pow(pi - 0.959, I) * Math.pow(sig - 0.995, J);
    }
    return 0.0039 * Math.pow(v, 4);
}
function r3x_PT_v(P, T) {
    let pi = P / 23, sig = T / 650, v = 0, R3x_PT_I = [-8, -6, -5, -4, -4, -4, -3, -3, -1, 0, 0, 0, 1, 1, 2, 3, 3, 3, 4, 5, 5, 5, 6, 8, 8, 8, 8, 10, 12, 12, 12, 12, 14, 14, 14, 14], R3x_PT_J = [14, 10, 10, 1, 2, 14, -2, 12, 5, 0, 4, 10, -10, -1, 6, -12, 0, 8, 3, -6, -2, 1, 1, -6, -3, 1, 8, -8, -10, -8, -5, -4, -12, -10, -8, -6], R3x_PT_N = [3.77373741298151E18, -5.07100883722913E12, -1.0336322559886E15, 1.84790814320773E-6, -9.24729378390945E-4, -4.25999562292738E23, -4.62307771873973E-13, 1.07319065855767E21, 6.48662492280682E10, 2.44200600688281, -8.51535733484258E9, 1.69894481433592E21, 2.1578022250902E-27, -3.20850551367334E-1, -3.8264244845861E16, -2.75386077674421E-29, -5.63199253391666E5, -3.26068646279314E20, 3.97949001553184E13, 1.00824008584757E-7, 1.62234569738433E4, -4.32355225319745E10, -5.9287424559861E11, 1.33061647281106, 1.57338197797544E6, 2.58189614270853E13, 2.62413209706358E24, -9.20011937431142E-2, 2.20213765905426E-3, -1.10433759109547E1, 8.47004870612087E6, -5.92910695762536E8, -1.8302717326966E-5, 1.81339603516302E-1, -1.19228759669889E3, 4.30867658061468E6];
    for (let i = 0; i < 36; i++) {
        let N = R3x_PT_N[i], I = R3x_PT_I[i], J = R3x_PT_J[i];
        v += N * Math.pow(pi - 0.910, I) * Math.pow(sig - 0.988, J);
    }
    return 0.0049 * v;
}
function r3y_PT_v(P, T) {
    let pi = P / 22, sig = T / 650, v = 0, R3y_PT_I = [0, 0, 0, 0, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 8, 8, 10, 12], R3y_PT_J = [-3, 1, 5, 8, 8, -4, -1, 4, 5, -8, 4, 8, -6, 6, -2, 1, -8, -2, -5, -8], R3y_PT_N = [-5.25597995024633E-10, 5.83441305228407E3, -1.34778968457925E16, 1.18973500934212E25, -1.59096490904708E26, -3.15839902302021E-7, 4.96212197158239E2, 3.27777227273171E18, -5.27114657850696E21, 2.10017506281863E-17, 7.05106224399834E20, -2.66713136106469E30, -1.45370512554562E-8, 1.4933391705313E27, -1.49795620287641E7, -3.818819062711E15, 7.24660165585797E-5, -9.37808169550193E13, 5.14411468376383E9, -8.28198594040141E4];
    for (let i = 0; i < 20; i++) {
        let N = R3y_PT_N[i], I = R3y_PT_I[i], J = R3y_PT_J[i];
        v += N * Math.pow(pi - 0.996, I) * Math.pow(sig - 0.994, J);
    }
    return 0.0031 * Math.pow(v, 4);
}
function r3z_PT_v(P, T) {
    let pi = P / 22, sig = T / 650, v = 0, R3z_PT_I = [-8, -6, -5, -5, -4, -4, -4, -3, -3, -3, -2, -1, 0, 1, 2, 3, 3, 6, 6, 6, 6, 8, 8], R3z_PT_J = [3, 6, 6, 8, 5, 6, 8, -2, 5, 6, 2, -6, 3, 1, 6, -6, -2, -6, -5, -4, -1, -8, -4], R3z_PT_N = [2.4400789229065E-11, -4.63057430331242E6, 7.28803274777712E9, 3.27776302858856E15, -1.10598170118409E9, -3.23899915729957E12, 9.23814007023245E15, 8.42250080413712E-13, 6.63221436245506E11, -1.67170186672139E14, 2.53749358701391E3, -8.19731559610523E-21, 3.28380587890663E11, -6.25004791171543E7, 8.03197957462023E20, -2.04397011338353E-11, -3.78391047055938E3, 9.7287654593862E-3, 1.54355721681459E1, -3.73962862928643E3, -6.82859011374572E10, -2.48488015614543E-4, 3.94536049497068E6];
    for (let i = 0; i < 23; i++) {
        let N = R3z_PT_N[i], I = R3z_PT_I[i], J = R3z_PT_J[i];
        v += N * Math.pow(pi - 0.993, I) * Math.pow(sig - 0.994, J);
    }
    return 0.0038 * Math.pow(v, 4);
}
//
// Region 4
//
// The saturation pressure for given temperature along the vapour-liquid saturation line
// Range of validity is 273.15 K <= T <= 647.096 K
// Equation 30 (pp. 33)
function r4_T_Psat(T) {
    let Tr = T, v = Tr + -0.238558557567849 / (Tr - 650.17534844798), A = v * v + 1167.0521452767 * v + -724213.16703206, B = -17.073846940092 * v * v + 12020.82470247 * v + -3232555.0322333, C = 14.91510861353 * v * v + -4823.2657361591 * v + 405113.40542057;
    return Math.pow(2 * C / (-B + Math.pow(B * B - 4 * A * C, 0.5)), 4);
}
// The saturation temperature for given pressure along the vapour-liquid saturation line
// Range of validity is 0.000611213 MPa (611.213 Pa) <= p <= 22.064 MPa
// Equation 30 (pp. 33)
function r4_P_Tsat(P) {
    let R4_PT_N = [1167.0521452767, -724213.16703206, -17.073846940092, 12020.82470247, -3232555.0322333, 14.91510861353, -4823.2657361591, 405113.40542057, -0.238558557567849, 650.17534844798], b = Math.pow(P, 0.25), E = b * b + R4_PT_N[2] * b + R4_PT_N[5], F = R4_PT_N[0] * b * b + R4_PT_N[3] * b + R4_PT_N[6], G = R4_PT_N[1] * b * b + R4_PT_N[4] * b + R4_PT_N[7], D = 2.0 * G / (-F - Math.pow(F * F - 4.0 * E * G, 0.5));
    return (R4_PT_N[9] + D - Math.pow(Math.pow(R4_PT_N[9] + D, 2) - 4.0 * (R4_PT_N[8] + R4_PT_N[9] * D), 0.5)) / 2.0;
}
//
// Region 5
//
function r5(P, T) {
    let R5I_PT_N = [-13.179983674201, 6.8540841634434, -0.024805148933466, 0.36901534980333, -3.1161318213925, -0.32961626538917], R5I_PT_J = [0, 1, -3, -2, -1, 2], R5R_PT_N = [1.5736404855259E-3, 9.0153761673944E-4, -5.0270077677648E-3, 2.2440037409485E-6, -4.1163275453471E-6, 3.7919454822955E-8], R5R_PT_J = [1, 2, 3, 3, 9, 7], R5R_PT_I = [1, 1, 1, 2, 2, 3], pi = P, tau = 1000 / T, gi = Math.log(pi), gi_p = 1 / pi, gi_pp = -1 / (pi * pi), gi_t = 0, gi_tt = 0, gi_pt = 0, N, J, I;
    for (let i = 0; i < 6; i++) {
        N = R5I_PT_N[i];
        J = R5I_PT_J[i];
        gi += N * Math.pow(tau, J);
        gi_t += N * J * Math.pow(tau, J - 1);
        gi_tt += N * J * (J - 1) * Math.pow(tau, J - 2);
    }
    let gr = 0, gr_p = 0, gr_pp = 0, gr_t = 0, gr_tt = 0, gr_pt = 0;
    for (let j = 0; j < 6; j++) {
        N = R5R_PT_N[j];
        J = R5R_PT_J[j];
        I = R5R_PT_I[j];
        gr += N * Math.pow(pi, I) * Math.pow(tau, J);
        gr_p += N * I * Math.pow(pi, I - 1) * Math.pow(tau, J);
        gr_pp += N * I * (I - 1) * Math.pow(pi, I - 2) * Math.pow(tau, J);
        gr_t += N * Math.pow(pi, I) * J * Math.pow(tau, J - 1);
        gr_tt += N * Math.pow(pi, I) * J * (J - 1) * Math.pow(tau, J - 2);
        gr_pt += N * I * Math.pow(pi, I - 1) * J * Math.pow(tau, J - 1);
    }
    // The pressure and temperature MPa, K
    return generateResult({
        p: P,
        t: T,
        v: R * T * pi * (gi_p + gr_p) / (1000 * P),
        u: R * T * (tau * (gi_t + gr_t) - pi * (gi_p + gr_p)),
        s: R * (tau * (gi_t + gr_t) - (gi + gr)),
        h: R * T * tau * (gi_t + gr_t),
        cp: -R * tau * tau * (gi_tt + gr_tt),
        cv: R * (-tau * tau * (gi_tt + gr_tt) - Math.pow(1 + pi * gr_p - tau * pi * gr_pt, 2) / (1 - pi * pi * gr_pp)),
        w: Math.pow(1000 * R * T * ((1 + 2 * pi * gr_p + pi * pi * gr_p * gr_p) / ((1 - pi * pi * gr_pp) + Math.pow(1 + pi * gr_p - tau * pi * gr_pt, 2) / (tau * tau * (gi_tt + gr_tt)))), 0.5),
    });
}
//# sourceMappingURL=PT.js.map
});

__register("PH", function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve = solve;
exports.r1_PH_T = r1_PH_T;
exports.r2 = r2;
exports.b2bc_H_P = b2bc_H_P;
exports.b2bc_P_H = b2bc_P_H;
exports.b3ab_P_H = b3ab_P_H;
exports.r3A_PH_V = r3A_PH_V;
exports.r3B_PH_V = r3B_PH_V;
exports.r4_H_Psat = r4_H_Psat;
const NS = __importStar(require("./base"));
const PT = __importStar(require("./PT"));
//
//	Comments : Calculate the steam properties using IAWPS for a given pressure and temperature
//
//	@param P is the pressure of the water in MPa
//	@param h is the enthalpy kg/KJ.K
//
function solve(P, h) {
    let region = findRegion_PH(P, h), result = null;
    switch (region) {
        case 1:
            result = r1(P, h);
            break;
        case 2:
            result = r2(P, h);
            break;
        case 3:
            result = r3(P, h);
            break;
        default: throw new Error('(P,h) : Inputs insufficient or out of range');
    }
    return result;
}
//
//	Comments : Determines which IAPWS-97 region a temperature and pressure combination lie in.
//
//	@param P is the pressure of the water in mega Pascals
//	@param h is the enthalpy kg/KJ.K
//
function findRegion_PH(P, h) {
    let r = PT.r1(P, NS.CONST('MIN_T'));
    // Whats the region max/min for h
    if (P >= NS.CONST('MIN_P') && P <= NS.CONST('MAX_P') && h >= r.h) {
        if (P < NS.CONST('B23_MIN_P')) {
            let Ts = PT.r4_P_Tsat(P);
            r = PT.r1(P, Ts);
            if (h <= r.h) {
                return 1;
            }
            // Check region 2
            if (h < 4000) {
                return 2;
            }
            r = PT.r2(P, NS.CONST('R2_MAX_T'));
            if (h <= r.h) {
                return 2;
            }
            // Region 5
            if (P < NS.CONST('R5_MAX_P')) {
                r = PT.r5(P, NS.CONST('MAX_T'));
                if (h < r.h) {
                    return 5;
                }
            }
        }
        else // P >= B23_MIN_P
         {
            // Region 1 check
            r = PT.r1(P, NS.CONST('R3_MIN_T'));
            if (h <= r.h) {
                return 1;
            }
            // Region 3
            r = PT.r2(P, PT.b23_P_T(P));
            if (h < r.h) {
                return 3;
            }
            // Region 2
            r = PT.r2(P, NS.CONST('R2_MAX_T'));
            if (h < r.h) {
                return 2;
            }
        }
    }
    return -1;
}
//
//	Region 1
//
function r1(P, h) {
    return PT.r1(P, r1_PH_T(P, h));
}
function r1_PH_T(P, h) {
    let R1_PH_I = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 6], R1_PH_J = [0, 1, 2, 6, 22, 32, 0, 1, 2, 3, 4, 10, 32, 10, 32, 10, 32, 32, 32, 32], R1_PH_N = [-238.72489924521, 404.21188637945, 113.49746881718, -5.8457616048039, -0.0001528548241314, -1.0866707695377E-6, -13.391744872602, 43.211039183559, -54.010067170506, 30.535892203916, -6.5964749423638, 0.0093965400878363, 1.157364750534E-7, -0.000025858641282073, -4.0644363084799E-9, 6.6456186191635E-8, 8.0670734103027E-11, -9.3477771213947E-13, 5.8265442020601E-15, -1.5020185953503E-17], pi = P, m = h / 2500, T = 0;
    for (var i = 0; i < 20; i++) {
        var N = R1_PH_N[i], I = R1_PH_I[i], J = R1_PH_J[i];
        T += N * Math.pow(pi, I) * Math.pow((m + 1), J);
    }
    return T;
}
//
//	Region 2
//
function r2(P, h) {
    let T = r2_PH_T(P, h);
    return PT.r2(P, T);
}
function r2_PH_T(P, h) {
    let T;
    if (P < NS.CONST('R2_CRT_P')) {
        T = r2A_PH_T(P, h);
    }
    else {
        if (P < b2bc_H_P(h)) {
            T = r2B_PH_T(P, h);
        }
        else {
            T = r2C_PH_T(P, h);
        }
    }
    return T;
}
//
//	Equation 20 (page 21)
//	From : Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water
//		   and Steam, September 1997
//  Simple quadratic pressure-entalphy relationship for the region 2b - 2c boundary
// @internal - Exported for unit testing only
//
function b2bc_H_P(h) {
    return 0.90584278514723E3 - 0.67955786399241 * h + 0.12809002730136E-3 * h * h;
}
// @internal - Exported for unit testing only
function b2bc_P_H(P) {
    return (2652.6571908428 + Math.pow((P - 4.5257578905948) / 0.00012809002730136, 0.5));
}
// Equation 22
function r2A_PH_T(P, h) {
    let R2A_I = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7], R2A_J = [0, 1, 2, 3, 7, 20, 0, 1, 2, 3, 7, 9, 11, 18, 44, 0, 2, 7, 36, 38, 40, 42, 44, 24, 44, 12, 32, 44, 32, 36, 42, 34, 44, 28], R2A_N = [1089.8952318288, 849.51654495535, -107.81748091826, 33.153654801263, -7.4232016790248, 11.765048724356, 1.844574935579, -4.1792700549624, 6.2478196935812, -17.344563108114, -200.58176862096, 271.96065473796, -455.11318285818, 3091.9688604755, 252266.40357872, -0.0061707422868339, -0.31078046629583, 11.670873077107, 128127984.04046, -985549096.23276, 2822454697.3002, -3594897141.0703, 1722734991.3197, -13551.334240775, 12848734.66465, 1.3865724283226, 235988.32556514, -13105236.545054, 7399.9835474766, -551966.9703006, 3715408.5996233, 19127.7292396, -415351.64835634, -62.459855192507], pi = P, m = h / 2000, T = 0;
    for (let i = 0; i < 34; i++) {
        let N = R2A_N[i], I = R2A_I[i], J = R2A_J[i];
        T += N * Math.pow(pi, I) * Math.pow(m - 2.1, J);
    }
    return T;
}
function r2B_PH_T(P, h) {
    let R2B_PH_I = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6, 7, 7, 9, 9], R2B_PH_J = [0, 1, 2, 12, 18, 24, 28, 40, 0, 2, 6, 12, 18, 24, 28, 40, 2, 8, 18, 40, 1, 2, 12, 24, 2, 12, 18, 24, 28, 40, 18, 24, 40, 28, 2, 28, 1, 40], R2B_PH_N = [1489.5041079516, 743.07798314034, -97.708318797837, 2.4742464705674, -0.63281320016026, 1.1385952129658, -0.47811863648625, 0.0085208123431544, 0.93747147377932, 3.3593118604916, 3.3809355601454, 0.16844539671904, 0.73875745236695, -0.47128737436186, 0.15020273139707, -0.002176411421975, -0.021810755324761, -0.10829784403677, -0.046333324635812, 0.000071280351959551, 0.00011032831789999, 0.00018955248387902, 0.0030891541160537, 0.0013555504554949, 2.8640237477456E-7, -0.000010779857357512, -0.000076462712454814, 0.000014052392818316, -0.000031083814331434, -1.0302738212103E-6, 2.821728163504E-7, 1.2704902271945E-6, 7.3803353468292E-8, -1.1030139238909E-8, -8.1456365207833E-14, -2.5180545682962E-11, -1.7565233969407E-18, 8.6934156344163E-15], pi = P, m = h / 2000, T = 0;
    for (let i = 0; i < 38; i++) {
        var N = R2B_PH_N[i], I = R2B_PH_I[i], J = R2B_PH_J[i];
        T += N * Math.pow((pi - 2), I) * Math.pow((m - 2.6), J);
    }
    return T;
}
// Equation 24
function r2C_PH_T(P, h) {
    let R2C_PH_I = [-7, -7, -6, -6, -5, -5, -2, -2, -1, -1, 0, 0, 1, 1, 2, 6, 6, 6, 6, 6, 6, 6, 6], R2C_PH_J = [0, 4, 0, 2, 0, 2, 0, 1, 0, 2, 0, 1, 4, 8, 4, 0, 1, 4, 10, 12, 16, 20, 22], R2C_PH_N = [-3236839855524.2, 7326335090218.1, 358250899454.47, -583401318515.9, -10783068217.47, 20825544563.171, 610747.83564516, 859777.2253558, -25745.72360417, 31081.088422714, 1208.2315865936, 482.19755109255, 3.7966001272486, -10.842984880077, -0.04536417267666, 1.4559115658698E-13, 1.126159740723E-12, -1.7804982240686E-11, 1.2324579690832E-7, -1.1606921130984E-6, 0.000027846367088554, -0.00059270038474176, 0.0012918582991878], pi = P, m = h / 2000, T = 0;
    for (let i = 0; i < 23; i++) {
        let N = R2C_PH_N[i], I = R2C_PH_I[i], J = R2C_PH_J[i];
        T += N * Math.pow(pi + 25, I) * Math.pow(m - 1.8, J);
    }
    return T;
}
//
//	Region 3
//
function r3(P, h) {
    let T, rho;
    if (h < b3ab_P_H(P)) {
        T = r3A_PH_T(P, h);
        rho = r3A_PH_V(P, h);
    }
    else {
        T = r3B_PH_T(P, h);
        rho = r3B_PH_V(P, h);
    }
    return PT.r3(P, T, rho);
}
//
//	Equation 1 (page 5)
//	From : Revised Supplementary Release on Backward Equations for the Functions
//  		T(p,h), v(p,h) and T(p,s), v(p,s) for Region 3 of the IAPWS Industrial
//  		Formulation 1997 for the Thermodynamic Properties of Water and Steam
//  Polynomial to match the critical isentropic line (but does not match exactly)
// @internal - Exported for unit testing only
//
function b3ab_P_H(P) {
    return 2014.64004206875 + 3.74696550136983 * P + -0.0219921901054187 * P * P + 0.000087513168600995 * P * P * P;
}
function r3A_PH_T(P, h) {
    let R3A_PH_I = [-12, -12, -12, -12, -12, -12, -12, -12, -10, -10, -10, -8, -8, -8, -8, -5, -3, -2, -2, -2, -1, -1, 0, 0, 1, 3, 3, 4, 4, 10, 12], R3A_PH_J = [0, 1, 2, 6, 14, 16, 20, 22, 1, 5, 12, 0, 2, 4, 10, 2, 0, 1, 3, 4, 0, 2, 0, 1, 1, 0, 1, 0, 3, 4, 5], R3A_PH_N = [-1.33645667811215E-7, 4.55912656802978E-6, -1.46294640700979E-5, 0.0063934131297008, 372.783927268847, -7186.54377460447, 573494.7521034, -2675693.29111439, -3.34066283302614E-5, -0.0245479214069597, 47.8087847764996, 7.64664131818904E-6, 0.00128350627676972, 0.0171219081377331, -8.51007304583213, -0.0136513461629781, -3.84460997596657E-6, 0.00337423807911655, -0.551624873066791, 0.72920227710747, -0.00992522757376041, -0.119308831407288, 0.793929190615421, 0.454270731799386, 0.20999859125991, -0.00642109823904738, -0.023515586860454, 0.00252233108341612, -0.00764885133368119, 0.0136176427574291, -0.0133027883575669], pi = P / 100, m = h / 2300, T = 0;
    for (let i = 0; i < 31; i++) {
        let N = R3A_PH_N[i], I = R3A_PH_I[i], J = R3A_PH_J[i];
        T += N * Math.pow((pi + 0.240), I) * Math.pow((m - 0.615), J);
    }
    return 760 * T;
}
// @internal - Exported for unit testing only
function r3A_PH_V(P, h) {
    let R3A_PH_v_I = [-12, -12, -12, -12, -10, -10, -10, -8, -8, -6, -6, -6, -4, -4, -3, -2, -2, -1, -1, -1, -1, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 8], R3A_PH_v_J = [6, 8, 12, 18, 4, 7, 10, 5, 12, 3, 4, 22, 2, 3, 7, 3, 16, 0, 1, 2, 3, 0, 1, 0, 1, 2, 0, 2, 0, 2, 2, 2], R3A_PH_v_N = [0.00529944062966028, -0.170099690234461, 11.1323814312927, -2178.98123145125, -0.000506061827980875, 0.556495239685324, -9.43672726094016, -0.297856807561527, 93.9353943717186, 0.0192944939465981, 0.421740664704763, -3689141.2628233, -0.00737566847600639, -0.354753242424366, -1.99768169338727, 1.15456297059049, 5683.6687581596, 0.00808169540124668, 0.172416341519307, 1.04270175292927, -0.297691372792847, 0.560394465163593, 0.275234661176914, -0.148347894866012, -0.0651142513478515, -2.92468715386302, 0.0664876096952665, 3.52335014263844, -0.0146340792313332, -2.24503486668184, 1.10533464706142, -0.0408757344495612], pi = P / 100, m = h / 2100, v = 0;
    for (let i = 0; i < 32; i++) {
        let N = R3A_PH_v_N[i], I = R3A_PH_v_I[i], J = R3A_PH_v_J[i];
        v += N * Math.pow((pi + 0.128), I) * Math.pow((m - 0.727), J);
    }
    return 0.0028 * v;
}
function r3B_PH_T(P, h) {
    let R3B_PH_I = [-12, -12, -10, -10, -10, -10, -10, -8, -8, -8, -8, -8, -6, -6, -6, -4, -4, -3, -2, -2, -1, -1, -1, -1, -1, -1, 0, 0, 1, 3, 5, 6, 8], R3B_PH_J = [0, 1, 0, 1, 5, 10, 12, 0, 1, 2, 4, 10, 0, 1, 2, 0, 1, 5, 0, 4, 2, 4, 6, 10, 14, 16, 0, 2, 1, 1, 1, 1, 1,], R3B_PH_N = [0.000032325457364492, -0.000127575556587181, -0.000475851877356068, 0.00156183014181602, 0.105724860113781, -85.8514221132534, 724.140095480911, 0.00296475810273257, -0.00592721983365988, -0.0126305422818666, -0.115716196364853, 84.9000969739595, -0.0108602260086615, 0.0154304475328851, 0.0750455441524466, 0.0252520973612982, -0.0602507901232996, -3.07622221350501, -0.0574011959864879, 5.03471360939849, -0.925081888584834, 3.91733882917546, -77.314600713019, 9493.08762098587, -1410437.19679409, 8491662.30819026, 0.861095729446704, 0.32334644281172, 0.873281936020439, -0.436653048526683, 0.286596714529479, -0.131778331276228, 0.00676682064330275], pi = P / 100, m = h / 2800, T = 0;
    for (let i = 0; i < 33; i++) {
        let N = R3B_PH_N[i], I = R3B_PH_I[i], J = R3B_PH_J[i];
        T += N * Math.pow((pi + 0.298), I) * Math.pow((m - 0.720), J);
    }
    return 860 * T;
}
// @internal - Exported for unit testing only
function r3B_PH_V(P, h) {
    let R3B_PH_v_I = [-12, -12, -8, -8, -8, -8, -8, -8, -6, -6, -6, -6, -6, -6, -4, -4, -4, -3, -3, -2, -2, -1, -1, -1, -1, 0, 1, 1, 2, 2], R3B_PH_v_J = [0, 1, 0, 1, 3, 6, 7, 8, 0, 1, 2, 5, 6, 10, 3, 6, 10, 0, 2, 1, 2, 0, 1, 4, 5, 0, 0, 1, 2, 6], R3B_PH_v_N = [-2.25196934336318E-09, 1.40674363313486E-08, 2.3378408528056E-06, -3.31833715229001E-05, 0.00107956778514318, -0.271382067378863, 1.07202262490333, -0.853821329075382, -2.15214194340526E-05, 0.00076965608822273, -0.00431136580433864, 0.453342167309331, -0.507749535873652, -100.475154528389, -0.219201924648793, -3.21087965668917, 607.567815637771, 0.000557686450685932, 0.18749904002955, 0.00905368030448107, 0.285417173048685, 0.0329924030996098, 0.239897419685483, 4.82754995951394, -11.8035753702231, 0.169490044091791, -0.0179967222507787, 0.0371810116332674, -0.0536288335065096, 1.6069710109252], pi = P / 100, m = h / 2800, v = 0;
    for (let i = 0; i < 30; i++) {
        let N = R3B_PH_v_N[i], I = R3B_PH_v_I[i], J = R3B_PH_v_J[i];
        v += N * Math.pow(pi + 0.0661, I) * Math.pow(m - 0.720, J);
    }
    return 0.0088 * v;
}
//
// Region 4
//
// @internal - Exported for unit testing only
function r4_H_Psat(h) {
    let R4_I = [0, 1, 1, 1, 1, 5, 7, 8, 14, 20, 22, 24, 28, 36], R4_J = [0, 1, 3, 4, 36, 3, 0, 24, 16, 16, 3, 18, 8, 24], R4_N = [0.600073641753024, -9.36203654849857, 2.46590798594147E1, -1.07014222858224E2, -9.15821315805768E13, -8.62332011700662E3, -2.35837344740032E1, 2.52304969384128E17, -3.89718771997719E18, -3.33775713645296E22, 3.56499469636328E10, -1.48547544720641E26, 3.30611514838798E18, 8.13641294467829E37], mu = h / 2600, p = 0;
    for (let i = 0; i < 14; i++) {
        let N = R4_N[i], I = R4_I[i], J = R4_J[i];
        p += N * Math.pow(mu - 1.02, I) * Math.pow(mu - 0.608, J);
    }
    return 22 * p;
}
//# sourceMappingURL=PH.js.map
});

__register("PS", function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve = solve;
exports.r3A_PS_V = r3A_PS_V;
exports.r3B_PS_V = r3B_PS_V;
const NS = __importStar(require("./base"));
const PT = __importStar(require("./PT"));
//
//	Comments : Determines which IAPWS-IF97 region a pressure and entropy combination lie in.
//
//	@param P is the pressure of the water in mega Pascals
//	@param s is the entropy in kJ . K^-1 . kg^1
//
function solve(P, s) {
    let region = findRegion_PS(P, s), result = null;
    switch (region) {
        case 1:
            result = r1(P, s);
            break;
        case 2:
            result = r2(P, s);
            break;
        case 3:
            result = r3(P, s);
            break;
        //case 4  : result = R4_PS(P, s); break;
        default: throw new Error('(P,s) : Inputs insufficient or out of range');
    }
    return result;
}
//
//	Comments : Determines which IAPWS-IF97 region a pressure and entropy combination lie in.
//
//	@param P is the pressure of the water in mega Pascals
//	@param s is the entropy in kJ/kg
//
function findRegion_PS(P, s) {
    let r = PT.r5(P, NS.CONST('R5_MAX_T'));
    if (P >= NS.CONST('MIN_P') &&
        P <= NS.CONST('MAX_P') &&
        s >= NS.CONST('MIN_S') &&
        s <= r.s) {
        r = PT.r2(P, NS.CONST('R5_MIN_T'));
        if (s > r.s && P <= NS.CONST('R5_MAX_P')) {
            return 5;
        }
        if (P > NS.CONST('B23_MIN_P')) {
            r = PT.r2(P, PT.b23_P_T(P));
            if (s > r.s) {
                return 2;
            }
            r = PT.r3(P, NS.CONST('R3_MIN_T'));
            if (s > r.s) {
                return 3;
            }
        }
        r = PT.r1(P, PT.r4_P_Tsat(P));
        if (P <= NS.CONST('B23_MIN_P') && s > r.s) {
            return 2;
        }
        r = PT.r1(P, NS.CONST('MIN_T'));
        if (s >= r.s) {
            return 1;
        }
    }
    return -1;
}
//
//	Backwards equations for region 1 (P and s given)
//
function r1(P, s) {
    let T = r1_PS_T(P, s);
    return PT.r1(P, T);
}
function r1_PS_T(P, s) {
    let R1_PS_I = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 4], R1_PS_J = [0, 1, 2, 3, 11, 31, 0, 1, 2, 3, 12, 31, 0, 1, 2, 9, 31, 10, 32, 32], R1_PS_N = [174.78268058307, 34.806930892873, 6.5292584978455, 0.33039981775489, -1.9281382923196E-7, -2.4909197244573E-23, -0.26107636489332, 0.22592965981586, -0.064256463395226, 0.0078876289270526, 3.5672110607366E-10, 1.7332496994895E-24, 0.00056608900654837, -0.00032635483139717, 0.000044778286690632, -5.1322156908507E-10, -4.2522657042207E-26, 2.6400441360689E-13, 7.8124600459723E-29, -3.0732199903668E-31], pi = P, sig = s, T = 0;
    for (let i = 0; i < 20; i++) {
        var N = R1_PS_N[i], I = R1_PS_I[i], J = R1_PS_J[i];
        T += N * Math.pow(pi, I) * Math.pow(sig + 2, J);
    }
    return T;
}
//
//	Backwards equation for region 2 (P and s given)
//
function r2(P, s) {
    let T = r2_PS_T(P, s);
    return PT.r2(P, T);
}
function r2_PS_T(P, s) {
    let T;
    if (P <= NS.CONST('R2_CRT_P')) {
        T = r2A_PS_T(P, s);
    }
    else {
        if (s >= NS.CONST('R2_CRT_S')) {
            T = r2B_PS_T(P, s);
        }
        else {
            T = r2C_PS_T(P, s);
        }
    }
    return T;
}
function r2A_PS_T(P, s) {
    let R2A_PS_I = [-1.5, -1.5, -1.5, -1.5, -1.5, -1.5, -1.25, -1.25, -1.25, -1, -1, -1, -1, -1, -1, -0.75, -0.75, -0.5, -0.5, -0.5, -0.5, -0.25, -0.25, -0.25, -0.25, 0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.75, 1, 1, 1.25, 1.25, 1.5, 1.5], R2A_PS_J = [-24, -23, -19, -13, -11, -10, -19, -15, -6, -26, -21, -17, -16, -9, -8, -15, -14, -26, -13, -9, -7, -27, -25, -11, -6, 1, 4, 8, 11, 0, 1, 5, 6, 10, 14, 16, 0, 4, 9, 17, 7, 18, 3, 15, 5, 18], R2A_PS_N = [-392359.83861984, 515265.7382727, 40482.443161048, -321.93790923902, 96.961424218694, -22.867846371773, -449429.14124357, -5011.8336020166, 0.35684463560015, 44235.33584819, -13673.388811708, 421632.6027864, 22516.925837475, 474.42144865646, -149.31130797647, -197811.26320452, -23554.39947076, -19070.616302076, 55375.669883164, 3829.3691437363, -603.91860580567, 1936.3102620331, 4266.064369861, -5978.0638872718, -704.01463926862, 338.36784107553, 20.862786635187, 0.033834172656196, -0.000043124428414893, 166.53791356412, -139.86292055898, -0.78849547999872, 0.072132411753872, -0.0059754839398283, -0.000012141358953904, 2.3227096733871E-7, -10.538463566194, 2.0718925496502, -0.072193155260427, 2.074988708112E-7, -0.018340657911379, 2.9036272348696E-7, 0.21037527893619, 0.00025681239729999, -0.012799002933781, -8.2198102652018E-6], pi = P, sig = s / 2, T = 0;
    for (let i = 0; i < 46; i++) {
        let N = R2A_PS_N[i], I = R2A_PS_I[i], J = R2A_PS_J[i];
        T += N * Math.pow(pi, I) * Math.pow(sig - 2, J);
    }
    return T;
}
function r2B_PS_T(P, s) {
    let R2B_PS_I = [-6, -6, -5, -5, -4, -4, -4, -3, -3, -3, -3, -2, -2, -2, -2, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5], R2B_PS_J = [0, 11, 0, 11, 0, 1, 11, 0, 1, 11, 12, 0, 1, 6, 10, 0, 1, 5, 8, 9, 0, 1, 2, 4, 5, 6, 9, 0, 1, 2, 3, 7, 8, 0, 1, 5, 0, 1, 3, 0, 1, 0, 1, 2], R2B_PS_N = [316876.65083497, 20.864175881858, -398593.99803599, -21.816058518877, 223697.85194242, -2784.1703445817, 9.920743607148, -75197.512299157, 2970.8605951158, -3.4406878548526, 0.38815564249115, 17511.29508575, -1423.7112854449, 1.0943803364167, 0.89971619308495, -3375.9740098958, 471.62885818355, -1.9188241993679, 0.41078580492196, -0.33465378172097, 1387.0034777505, -406.63326195838, 41.72734715961, 2.1932549434532, -1.0320050009077, 0.35882943516703, 0.0052511453726066, 12.838916450705, -2.8642437219381, 0.56912683664855, -0.099962954584931, -0.0032632037778459, 0.00023320922576723, -0.1533480985745, 0.029072288239902, 0.00037534702741167, 0.0017296691702411, -0.00038556050844504, -0.000035017712292608, -0.000014566393631492, 5.6420857267269E-06, 4.1286150074605E-08, -2.0684671118824E-08, 1.6409393674725E-09], pi = P, sig = s / 0.7853, T = 0;
    for (let i = 0; i < 44; i++) {
        let N = R2B_PS_N[i], I = R2B_PS_I[i], J = R2B_PS_J[i];
        T += N * Math.pow(pi, I) * Math.pow(10.0 - sig, J);
    }
    return T;
}
function r2C_PS_T(P, s) {
    let R2C_PS_I = [-2, -2, -1, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 7], R2C_PS_J = [0, 1, 0, 0, 1, 2, 3, 0, 1, 3, 4, 0, 1, 2, 0, 1, 5, 0, 1, 4, 0, 1, 2, 0, 1, 0, 1, 3, 4, 5], R2C_PS_N = [909.68501005365, 2404.566708842, -591.6232638713, 541.45404128074, -270.98308411192, 979.76525097926, -469.66772959435, 14.399274604723, -19.104204230429, 5.3299167111971, -21.252975375934, -0.3114733441376, 0.60334840894623, -0.042764839702509, 0.0058185597255259, -0.014597008284753, 0.0056631175631027, -0.000076155864584577, 0.00022440342919332, -0.000012561095013413, 6.3323132660934E-07, -2.0541989675375E-06, 3.6405370390082E-08, -2.9759897789215E-09, 1.0136618529763E-08, 5.9925719692351E-12, -2.0677870105164E-11, -2.0874278181886E-11, 1.0162166825089E-10, -1.6429828281347E-10], pi = P, sig = s / 2.9251, T = 0;
    for (let i = 0; i < 30; i++) {
        let N = R2C_PS_N[i], I = R2C_PS_I[i], J = R2C_PS_J[i];
        T += N * Math.pow(pi, I) * Math.pow(2.0 - sig, J);
    }
    return T;
}
//
//	Backwards equation for region 3 (P and s given)
//	From : Revised Supplementary Release on Backward Equations for the Functions
//  T(p,h), v(p,h) and T(p,s), v(p,s) for Region 3 of the IAPWS Industrial
//  Formulation 1997 for the Thermodynamic Properties of Water and Steam
//
function r3(P, s) {
    let T, rho;
    if (s <= NS.CONST('R3_CRT_S')) {
        T = r3A_PS_T(P, s);
        rho = r3A_PS_V(P, s);
    }
    else {
        T = r3B_PS_T(P, s);
        rho = r3B_PS_V(P, s);
    }
    return PT.r3(P, T, rho);
}
function r3A_PS_T(P, s) {
    let R3A_I = [-12, -12, -10, -10, -10, -10, -8, -8, -8, -8, -6, -6, -6, -5, -5, -5, -4, -4, -4, -2, -2, -1, -1, 0, 0, 0, 1, 2, 2, 3, 8, 8, 10], R3A_J = [28, 32, 4, 10, 12, 14, 5, 7, 8, 28, 2, 6, 32, 0, 14, 32, 6, 10, 36, 1, 4, 1, 6, 0, 1, 4, 0, 0, 3, 2, 0, 1, 2,], R3A_N = [1500420082.63875, -159397258480.424, 5.02181140217975E-4, -67.2057767855466, 1450.58545404456, -8238.8953488889, -0.154852214233853, 11.2305046746695, -29.7000213482822, 43856513263.5495, 0.00137837838635464, -2.97478527157462, 9717779473494.13, -5.71527767052398E-5, 28830.794977842, -74442828926270.3, 12.8017324848921, -368.275545889071, 6647689047791770, 0.044935925195888, -4.22897836099655, -0.240614376434179, -4.74341365254924, 0.72409399912611, 0.923874349695897, 3.99043655281015, 0.0384066651868009, -0.00359344365571848, -0.735196448821653, 0.188367048396131, 0.000141064266818704, -0.00257418501496337, 0.00123220024851555], pi = P / 100, sig = s / 4.4, T = 0;
    for (let i = 0; i < 33; i++) {
        let N = R3A_N[i], I = R3A_I[i], J = R3A_J[i];
        T += N * Math.pow(pi + 0.24, I) * Math.pow(sig - 0.703, J);
    }
    return 760 * T;
}
function r3A_PS_V(P, s) {
    let R3A_I = [-12, -12, -12, -10, -10, -10, -10, -8, -8, -8, -8, -6, -5, -4, -3, -3, -2, -2, -1, -1, 0, 0, 0, 1, 2, 4, 5, 6], R3A_J = [10, 12, 14, 4, 8, 10, 20, 5, 6, 14, 16, 28, 1, 5, 2, 4, 3, 8, 1, 2, 0, 1, 3, 0, 0, 2, 2, 0], R3A_N = [79.5544074093975, -2382.6124298459, 17681.3100617787, -0.00110524727080379, -15.3213833655326, 297.544599376982, -35031520.6871242, 0.277513761062119, -0.523964271036888, -148011.182995403, 1600148.99374266, 1708023226634.27, 0.000246866996006494, 1.6532608479798, -0.118008384666987, 2.537986423559, 0.965127704669424, -28.2172420532826, 0.203224612353823, 1.10648186063513, 0.52612794845128, 0.277000018736321, 1.08153340501132, -0.0744127885357893, 0.0164094443541384, -0.0680468275301065, 0.025798857610164, -0.000145749861944416], pi = P / 100, sig = s / 4.4, v = 0;
    for (let i = 0; i < 28; i++) {
        let N = R3A_N[i], I = R3A_I[i], J = R3A_J[i];
        v += N * Math.pow(pi + 0.187, I) * Math.pow(sig - 0.755, J);
    }
    return 0.0028 * v;
}
function r3B_PS_T(P, s) {
    let R3B_PS_I = [-12, -12, -12, -12, -8, -8, -8, -6, -6, -6, -5, -5, -5, -5, -5, -4, -3, -3, -2, 0, 2, 3, 4, 5, 6, 8, 12, 14], R3B_PS_J = [1, 3, 4, 7, 0, 1, 3, 0, 2, 4, 0, 1, 2, 4, 6, 12, 1, 6, 2, 0, 1, 1, 0, 24, 0, 3, 1, 2], R3B_PS_N = [0.52711170160166, -40.1317830052742, 153.020073134484, -2247.99398218827, -0.193993484669048, -1.40467557893768, 42.6799878114024, 0.752810643416743, 22.6657238616417, -622.873556909932, -0.660823667935396, 0.841267087271658, -25.3717501764397, 485.708963532948, 880.531517490555, 2650155.92794626, -0.359287150025783, -656.991567673753, 2.41768149185367, 0.856873461222588, 0.655143675313458, -0.213535213206406, 0.00562974957606348, -316955725450471.0, -0.000699997000152457, 0.0119845803210767, 1.93848122022095E-05, -2.15095749182309E-05], pi = P / 100, sig = s / 5.3, T = 0;
    for (let i = 0; i < 28; i++) {
        let N = R3B_PS_N[i], I = R3B_PS_I[i], J = R3B_PS_J[i];
        T += N * Math.pow(pi + 0.76, I) * Math.pow(sig - 0.818, J);
    }
    return 860 * T;
}
function r3B_PS_V(P, s) {
    let R3B_PS_v_I = [-12, -12, -12, -12, -12, -12, -10, -10, -10, -10, -8, -5, -5, -5, -4, -4, -4, -4, -3, -2, -2, -2, -2, -2, -2, 0, 0, 0, 1, 1, 2], R3B_PS_v_J = [0, 1, 2, 3, 5, 6, 0, 1, 2, 4, 0, 1, 2, 3, 0, 1, 2, 3, 1, 0, 1, 2, 3, 4, 12, 0, 1, 2, 0, 2, 2], R3B_PS_v_N = [5.91599780322238E-5, -0.00185465997137856, 0.0104190510480013, 0.0059864730203859, -0.771391189901699, 1.72549765557036, -0.000467076079846526, 0.0134533823384439, -0.0808094336805495, 0.508139374365767, 0.00128584643361683, -1.63899353915435, 5.86938199318063, -2.92466667918613, -0.00614076301499537, 5.76199014049172, -12.1613320606788, 1.67637540957944, -7.44135838773463, 0.0378168091437659, 4.01432203027688, 16.0279837479185, 3.17848779347728, -3.58362310304853, -1159952.60446827, 0.199256573577909, -0.122270624794624, -19.1449143716586, -0.0150448002905284, 14.6407900162154, -3.2747778718823], pi = P / 100, sig = s / 5.3, v = 0;
    for (let i = 0; i < 31; i++) {
        let N = R3B_PS_v_N[i], I = R3B_PS_v_I[i], J = R3B_PS_v_J[i];
        v += N * Math.pow(pi + 0.298, I) * Math.pow(sig - 0.816, J);
    }
    return 0.0088 * v;
}
//
// Region 4
//
function r4(P, s) {
    let T = PT.r4_P_Tsat(P);
    return PT.solve(P, T);
}
function r4_S_Psat(s) {
    let R4_I = [0, 1, 1, 4, 12, 12, 16, 24, 28, 32], R4_J = [0, 1, 32, 7, 4, 14, 36, 10, 0, 18], R4_N = [0.639767553612785, -1.29727445396014E1, -2.24595125848403E16, 1.77466741801846E6, 7.17079349571538E9, -3.78829107169011E17, -9.55586736431328E34, 1.87269814676188E23, 1.19254746466473E11, 1.10649277244882E36], sig = s / 5.2, p = 0;
    for (let i = 0; i < 10; i++) {
        let I = R4_I[i], J = R4_J[i], N = R4_N[i];
        p += N * Math.pow(sig - 1.03, I) * Math.pow(sig - 0.699, J);
    }
    return 22 * p;
}
//# sourceMappingURL=PS.js.map
});

__register("HS", function(module, exports, require) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.solve = solve;
exports.b14_S_H = b14_S_H;
exports.b13_S_H = b13_S_H;
exports.b23_HS_T = b23_HS_T;
exports.b2ab_S_H = b2ab_S_H;
exports.b2ab_S_Hsat = b2ab_S_Hsat;
exports.b2c3b_S_H = b2c3b_S_H;
exports.b3A_S_H = b3A_S_H;
exports.r4_HS_Tsat = r4_HS_Tsat;
const NS = __importStar(require("./base"));
const PT = __importStar(require("./PT"));
const PH = __importStar(require("./PH"));
//
//	Comments : Determines which IAPWS-IF97 region a enthalpy and entropy combination lie in.
//
//	@param h is the enthalpy in kJ/kg
//	@param s is the entropy in kJ . K^-1 . kg^1
//
function solve(h, s) {
    let region = findRegion_HS(h, s), result = null;
    switch (region) {
        case 1:
            result = r1(h, s);
            break;
        case 2:
            result = r2(h, s);
            break;
        case 3:
            result = r3(h, s);
            break;
        case 4:
            result = r4(h, s);
            break;
        default: throw new Error('(h,s) : Inputs insufficient or out of range');
    }
    return result;
}
function findRegion_HS(h, s) {
    // Interpolate across the saturation curve to test if below P = 0.000611 MPa line
    // Refer to Figure 3 in IAPWS HS document for graphical depiction
    // dG = dH - T*dS where dG = 0 for equilibrium reactions like phase change
    let B23_S = 5.260578707, B3_S = 4.41202148223476, B13_S = 3.778281340, B23_H = 2812.942061, hcheck = 273.15 * (s - NS.CONST('MIN_S')) + NS.CONST('MIN_H');
    if ((s <= 9.155759395 && h < hcheck) || s < NS.CONST('MIN_S') || h < NS.CONST('MIN_H')) {
        return -1;
    }
    // Region 1
    if (-0.0001545495919 <= s && s <= B13_S && b14_S_H(s) <= h && h <= b13_S_H(s)) {
        return 1;
    }
    // Region 2 or 3 interface
    if (5.048096828 <= s && s <= B23_S && 2563.592004 <= h && h <= B23_H) {
        // Do check using the PB23
        let T = b23_HS_T(h, s), P = r2C_HS_P(h, s), Pcheck = PT.b23_T_P(T);
        if (Pcheck > P) {
            return 2;
        }
        else {
            return 3;
        }
    }
    // Region 2
    if ((h >= B23_H || s > B23_S) && ((s >= 5.85 && h >= b2ab_S_Hsat(s)) || (s < 5.85 && h >= b2c3b_S_H(s)))) {
        return 2;
    }
    // Region 3
    if ((s >= B3_S && h >= b2c3b_S_H(s)) || (B13_S < s && s < B3_S && h >= b3A_S_H(s)) || (s <= B13_S && h > b13_S_H(s))) {
        return 3;
    }
    return 4;
}
//
// Region Identification Equations
//
// h'_1 Equation 3 in HS Region 3 & 4 Supplementary release
// @internal - Exported for unit testing only
function b14_S_H(s) {
    let R4_HS_I = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 7, 8, 12, 12, 14, 14, 16, 20, 20, 22, 24, 28, 32, 32], R4_HS_J = [14, 36, 3, 16, 0, 5, 4, 36, 4, 16, 24, 18, 24, 1, 4, 2, 4, 1, 22, 10, 12, 28, 8, 3, 0, 6, 8], R4_HS_N = [3.32171191705237E-1, 6.112177063234960E-4, -8.82092478906822, -4.5562819254325E-1, -2.63483840850452E-5, -2.23949661148062E1, -4.28398660164013, -6.16679338856916E-1, -1.468230311044E1, 2.84523138727299E2, -1.13398503195444E2, 1.15671380760859E3, 3.95551267359325E2, -1.54891257229285, 1.94486637751291E1, -3.57915139457043, -3.35369414148819, -6.6442679633246E-1, 3.23321885383934E4, 3.31766744667084E3, -2.23501257931087E4, 5.73953875852936E6, 1.73226193407919E2, -3.63968822121321E-2, 8.34596332878346E-7, 5.03611916682674, 6.55444787064505E1], sig = s / 3.8, h = 0;
    for (let i = 0; i < 27; i++) {
        let N = R4_HS_N[i], I = R4_HS_I[i], J = R4_HS_J[i];
        h += N * Math.pow(sig - 1.09, I) * Math.pow(sig + 0.0000366, J);
    }
    return 1700 * h;
}
// @internal - Exported for unit testing only
function b13_S_H(s) {
    let B13_HS_I = [0, 1, 1, 3, 5, 6], B13_HS_J = [0, -2, 2, -12, -4, -3], B13_HS_N = [0.913965547600543, -0.0000430944856041991, 60.3235694765419, 1.17518273082168E-18, 0.220000904781292, -69.0815545851641], sig = s / 3.8, h = 0;
    for (let i = 0; i < 6; i++) {
        let N = B13_HS_N[i], I = B13_HS_I[i], J = B13_HS_J[i];
        h += N * Math.pow(sig - 0.884, I) * Math.pow(sig - 0.864, J);
    }
    return 1700 * h;
}
// Calculates the temperature on the region 2-3 boundary S-curve
// T_B23(h,s) Equation 8 in HS Region 3 & 4 in suplementry
// @internal - Exported for unit testing only
function b23_HS_T(h, s) {
    let B23_HS_I = [-12, -10, -8, -4, -3, -2, -2, -2, -2, 0, 1, 1, 1, 3, 3, 5, 6, 6, 8, 8, 8, 12, 12, 14, 14], B23_HS_J = [10, 8, 3, 4, 3, -6, 2, 3, 4, 0, -3, -2, 10, -2, -1, -5, -6, -3, -8, -2, -1, -12, -1, -12, 1], B23_HS_N = [6.2909626082981E-4, -8.23453502583165E-4, 5.15446951519474E-8, -1.17565945784945, 3.48519684726192, -5.07837382408313E-12, -2.84637670005479, -2.36092263939673, 6.01492324973779, 1.48039650824546, 3.60075182221907E-4, -1.26700045009952E-2, -1.22184332521413E6, 1.49276502463272E-1, 6.98733471798484E-1, -2.52207040114321E-2, 1.47151930985213E-2, -1.08618917681849, -9.36875039816322E-4, 8.19877897570217E1, -1.82041861521835E2, 2.61907376402688E-6, -2.91626417025961E4, 1.40660774926165E-5, 7.83237062349385E6], m = h / 3000, sig = s / 5.3, T = 0;
    for (let i = 0; i < 25; i++) {
        let N = B23_HS_N[i], I = B23_HS_I[i], J = B23_HS_J[i];
        T += N * Math.pow(m - 0.727, I) * Math.pow(sig - 0.864, J);
    }
    return 900 * T;
}
// The boundary equation for HS regions 2A and 2b (Equation 2 in supplementary release for HS)
// @internal - Exported for unit testing only
function b2ab_S_H(s) {
    return (-3498.98083432139 + 2575.60716905876 * s + -421.073558227969 * s * s + 27.6349063799944 * s * s * s);
}
// Equation 5 in the region 3 & 4 HS suplementary release
// @internal - Exported for unit testing only
function b2ab_S_Hsat(s) {
    let B2ab_I = [1, 1, 2, 2, 4, 4, 7, 8, 8, 10, 12, 12, 18, 20, 24, 28, 28, 28, 28, 28, 32, 32, 32, 32, 32, 36, 36, 36, 36, 36], B2ab_J = [8, 24, 4, 32, 1, 2, 7, 5, 12, 1, 0, 7, 10, 12, 32, 8, 12, 20, 22, 24, 2, 7, 12, 14, 24, 10, 12, 20, 22, 28], B2ab_N = [-0.524581170928788E3, -0.926947218142218E7, -0.237385107491666E3, 0.210770155812776E11, -0.239494562010986E2, 0.221802480294197E3, -0.510472533393438E7, 0.124981396109147E7, 0.200008436996201E10, -0.815158509791035E3, -0.157612685637523E3, -0.114200422332791E11, 0.662364680776872E16, -0.227622818296144E19, -0.171048081348406E32, 6.60788766938091E15, 1.66320055886021E22, -2.18003784381501E29, -7.87276140295618E29, 1.51062329700346E31, 7.95732170300541E6, 1.31957647355347E15, -3.2509706829914E23, -4.18600611419248E25, 2.97478906557467E34, -9.53588761745473E19, 1.66957699620939E24, -1.75407764869978E32, 3.47581490626396E34, -7.10971318427851E38], sig1 = s / 5.21, sig2 = s / 9.2, Hsat = 0;
    for (let i = 0; i < 30; i++) {
        let I = B2ab_I[i], J = B2ab_J[i], N = B2ab_N[i];
        Hsat += N * Math.pow(1 / sig1 - 0.513, I) * Math.pow(sig2 - 0.524, J);
    }
    return 2800 * Math.exp(Hsat);
}
// h"_2c3b(s) Equation 6 in HS region 3 and 4 supplementary release
// @internal - Exported for unit testing only
function b2c3b_S_H(s) {
    // Table 17 in in IAPWS-97 HS region 3 and 4
    let B2c3b_HS_I = [0, 0, 0, 1, 1, 5, 6, 7, 8, 8, 12, 16, 22, 22, 24, 36], B2c3b_HS_J = [0, 3, 4, 0, 12, 36, 12, 16, 2, 20, 32, 36, 2, 32, 7, 20], B2c3b_HS_N = [1.04351280732769, -2.27807912708513, 1.80535256723202, 0.420440834792042, -1.0572124483466E5, 4.36911607493884E24, -3.28032702839753E11, -6.7868676080427E15, 7.43957464645363E3, -3.56896445355761E19, 1.67590585186801E31, -3.55028625419105E37, 3.96611982166538E11, -4.14716268484468E40, 3.59080103867382E18, -1.16994334851995E40], h = 0, sigma = s / 5.9;
    for (let i = 0; i < 16; i++) {
        let I = B2c3b_HS_I[i], J = B2c3b_HS_J[i], N = B2c3b_HS_N[i];
        h += N * Math.pow(sigma - 1.02, I) * Math.pow(sigma - 0.726, J);
    }
    return 2800 * Math.pow(h, 4);
}
// h'_3a Equation 4 in HS Region 3 and 4
// Used as a boundary check between 3a and 3b when P < Pc
// Function to work out the backwards (h,s) boundry for region 3A
// @internal - Exported for unit testing only
function b3A_S_H(s) {
    // Table 10 in IAPWS-97 HS region 3 and 4
    let B3A_HS_I = [0, 0, 0, 0, 2, 3, 4, 4, 5, 5, 6, 7, 7, 7, 10, 10, 10, 32, 32], B3A_HS_J = [1, 4, 10, 16, 1, 36, 3, 16, 20, 36, 4, 2, 28, 32, 14, 32, 36, 0, 6], B3A_HS_N = [0.822673364673336, 0.181977213534479, -0.0112000260313624, -0.000746778287048033, -0.179046263257381, 0.0424220110836657, -0.341355823438768, -2.09881740853565, -8.22477343323596, -4.99684082076008, 0.191413958471069, 0.0581062241093136, -1655.05498701029, 1588.70443421201, -85.0623535172818, -31771.4386511207, -94589.0406632871, -1.3927384708869E-6, 0.63105253224098], sig = s / 3.8, hdash = 0;
    for (let i = 0; i < 19; i++) {
        let N = B3A_HS_N[i], I = B3A_HS_I[i], J = B3A_HS_J[i];
        hdash += N * Math.pow(sig - 1.09, I) * Math.pow(sig + 0.0000366, J);
    }
    return 1700 * hdash;
}
//
//	Backwards equation for region 1 (h and s given)
//	Calculates P and uses it in the forwards equations
//
function r1(h, s) {
    let P = r1_HS_P(h, s), T = PH.r1_PH_T(P, h);
    if (P >= NS.CONST('MIN_P') && P <= NS.CONST('MAX_P')) {
        return PT.r1(P, T);
    }
    throwOutOfRange("Region 1 (h,s) : ");
}
function r1_HS_P(h, s) {
    let R1_HS_I = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 4, 4, 5], R1_HS_J = [0, 1, 2, 4, 5, 6, 8, 14, 0, 1, 4, 6, 0, 1, 10, 4, 1, 4, 0], R1_HS_N = [-0.691997014660582, -18.361254878756, -9.28332409297335, 65.9639569909906, -16.2060388912024, 450.620017338667, 854.68067822417, 6075.23214001161, 32.6487682621856, -26.9408844582931, -319.9478483343, -928.35430704332, 30.3634537455249, -65.0540422444146, -4309.9131651613, -747.512324096068, 730.000345529245, 1142.84032569021, -436.407041874559], m = h / 3400, sig = s / 7.6, P = 0;
    for (let i = 0; i < 19; i++) {
        let N = R1_HS_N[i], I = R1_HS_I[i], J = R1_HS_J[i];
        P += N * Math.pow(m + 0.05, I) * Math.pow(sig + 0.05, J);
    }
    return 100 * P;
}
//
//	Backwards equation for region 2 (h and s given)
//	Calculates P and uses it in the forwards equations
//
function r2(h, s) {
    let P = r2_HS_P(h, s);
    if (P >= NS.CONST('MIN_P') && P <= NS.CONST('MAX_P')) {
        return PH.r2(P, h);
    }
    throwOutOfRange("Region 2 (h,s) : ");
}
function r2_HS_P(h, s) {
    let P;
    if (h <= b2ab_S_H(s)) {
        P = r2A_HS_P(h, s);
    }
    else {
        if (s >= 5.85) {
            P = r2B_HS_P(h, s);
        }
        else {
            P = r2C_HS_P(h, s);
        }
    }
    return P;
}
function r2A_HS_P(h, s) {
    let R2A_HS_I = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 5, 5, 6, 7], R2A_HS_J = [1, 3, 6, 16, 20, 22, 0, 1, 2, 3, 5, 6, 10, 16, 20, 22, 3, 16, 20, 0, 2, 3, 6, 16, 16, 3, 16, 3, 1], R2A_HS_N = [-0.0182575361923032, -0.125229548799536, 0.592290437320145, 6.04769706185122, 238.624965444474, -298.639090222922, 0.051225081304075, -0.437266515606486, 0.413336902999504, -5.16468254574773, -5.57014838445711, 12.8555037824478, 11.414410895329, -119.504225652714, -2847.7798596156, 4317.57846408006, 1.1289404080265, 1974.09186206319, 1516.12444706087, 0.0141324451421235, 0.585501282219601, -2.97258075863012, 5.94567314847319, -6236.56565798905, 9659.86235133332, 6.81500934948134, -6332.07286824489, -5.5891922446576, 0.0400645798472063], m = h / 4200, sig = s / 12, P = 0;
    for (let i = 0; i < 29; i++) {
        let N = R2A_HS_N[i], I = R2A_HS_I[i], J = R2A_HS_J[i];
        P += N * Math.pow(m - 0.5, I) * Math.pow(sig - 1.2, J);
    }
    return 4 * Math.pow(P, 4); // Corresponding pressure for h, s
}
function r2B_HS_P(h, s) {
    let R2B_HS_I = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 8, 12, 14], R2B_HS_J = [0, 1, 2, 4, 8, 0, 1, 2, 3, 5, 12, 1, 6, 18, 0, 1, 7, 12, 1, 16, 1, 12, 1, 8, 18, 1, 16, 1, 3, 14, 18, 10, 16], R2B_HS_N = [0.0801496989929495, -0.543862807146111, 0.337455597421283, 8.9055545115745, 313.840736431485, 0.797367065977789, -1.2161697355624, 8.72803386937477, -16.9769781757602, -186.552827328416, 95115.9274344237, -18.9168510120494, -4334.0703719484, 543212633.012715, 0.144793408386013, 128.024559637516, -67230.9534071268, 33697238.0095287, -586.63419676272, -22140322476.9889, 1716.06668708389, -570817595.806302, -3121.09693178482, -2078413.8463301, 3056059461577.86, 3221.57004314333, 326810259797.295, -1441.04158934487, 410.694867802691, 109077066873.024, -24796465425889.3, 1888019068.65134, -123651009018773], m = h / 4100, sig = s / 7.9, P = 0;
    for (let i = 0; i < 33; i++) {
        let N = R2B_HS_N[i], I = R2B_HS_I[i], J = R2B_HS_J[i];
        P += N * Math.pow(m - 0.6, I) * Math.pow(sig - 1.01, J);
    }
    return 100 * Math.pow(P, 4);
}
function r2C_HS_P(h, s) {
    let R2C_HS_I = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 5, 5, 5, 5, 6, 6, 10, 12, 16], R2C_HS_J = [0, 1, 2, 3, 4, 8, 0, 2, 5, 8, 14, 2, 3, 7, 10, 18, 0, 5, 8, 16, 18, 18, 1, 4, 6, 14, 8, 18, 7, 7, 10], R2C_HS_N = [0.112225607199012, -3.39005953606712, -32.0503911730094, -197.5973051049, -407.693861553446, 13294.3775222331, 1.70846839774007, 37.3694198142245, 3581.44365815434, 423014.446424664, -751071025.760063, 52.3446127607898, -228.351290812417, -960652.417056937, -80705929.2526074, 1626980172256.69, 0.772465073604171, 46392.9973837746, -13731788.5134128, 1704703926305.12, -25110462818730.8, 31774883083552.0, 53.8685623675312, -55308.9094625169, -1028615.22421405, 2042494187562.34, 273918446.626977, -2639631463126850.0, -1078908541.08088, -29649262098.0124, -1117549073234240.0], m = h / 3500, sig = s / 5.9, P = 0;
    for (let i = 0; i < 31; i++) {
        let N = R2C_HS_N[i], I = R2C_HS_I[i], J = R2C_HS_J[i];
        P += N * Math.pow(m - 0.7, I) * Math.pow(sig - 1.1, J);
    }
    return 100 * Math.pow(P, 4);
}
//
// Region 3
//
function r3(h, s) {
    let P = r3_HS_P(h, s);
    if (P >= NS.CONST('MIN_P') && P <= NS.CONST('MAX_P')) {
        return PH.r2(P, h);
    }
    throwOutOfRange("Region 3 (h,s) : ");
}
function r3_HS_P(h, s) {
    if (s <= NS.CONST('R3_CRT_S')) {
        return r3A_HS_P(h, s);
    }
    else {
        return r3B_HS_P(h, s);
    }
}
function r3A_HS_P(h, s) {
    let R3A_HS_I = [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 6, 7, 8, 10, 10, 14, 18, 20, 22, 22, 24, 28, 28, 32, 32], R3A_HS_J = [0, 1, 5, 0, 3, 4, 8, 14, 6, 16, 0, 2, 3, 0, 1, 4, 5, 28, 28, 24, 1, 32, 36, 22, 28, 36, 16, 28, 36, 16, 36, 10, 28,], R3A_HS_N = [7.70889828326934, -26.0835009128688, 267.416218930389, 17.2221089496844, -293.54233214597, 614.135601882478, -61056.2757725674, -65127225.1118219, 73591.9313521937, -11664650591.4191, 35.5267086434461, -596.144543825955, -475.842430145708, 69.6781965359503, 335.674250377312, 25052.6809130882, 146997.380630766, 53806931509153400000.0, 1.43619827291346E+21, 36498586616599400000.0, -2547.41561156775, 2.40120197096563E+27, -3.93847464679496E+29, 1.47073407024852E+24, -4.26391250432059E+31, 1.94509340621077E+38, 6.66212132114896E+23, 7.06777016552858E+33, 1.75563621975576E+41, 1.08408607429124E+28, 7.30872705175151E+43, 1.5914584739887E+24, 3.77121605943324E+40], m = h / 2300, sig = s / 4.4, P = 0;
    for (let i = 0; i < 33; i++) {
        let N = R3A_HS_N[i], I = R3A_HS_I[i], J = R3A_HS_J[i];
        P += N * Math.pow(m - 1.01, I) * Math.pow(sig - 0.75, J);
    }
    return 99 * P;
}
function r3B_HS_P(h, s) {
    // Table X data from IAPWS-97
    let R3B_HS_I = [-12, -12, -12, -12, -12, -10, -10, -10, -10, -8, -8, -6, -6, -6, -6, -5, -4, -4, -4, -3, -3, -3, -3, -2, -2, -1, 0, 2, 2, 5, 6, 8, 10, 14, 14], R3B_HS_J = [2, 10, 12, 14, 20, 2, 10, 14, 18, 2, 8, 2, 6, 7, 8, 10, 4, 5, 8, 1, 3, 5, 6, 0, 1, 0, 3, 0, 1, 0, 1, 1, 1, 3, 7], R3B_HS_N = [1.25244360717979E-13, -0.0126599322553713, 5.06878030140626, 31.7847171154202, -391041.161399932, -9.75733406392044E-11, -18.6312419488279, 510.973543414101, 373847.005822362, 2.99804024666572E-8, 20.0544393820342, -4.98030487662829E-6, -10.230180636003, 55.2819126990325, -206.211367510878, -7940.12232324823, 7.82248472028153, -58.6544326902468, 3550.73647696481, -0.000115303107290162, -1.75092403171802, 257.98168774816, -727.048374179467, 0.000121644822609198, 0.0393137871762692, 0.00704181005909296, -82.910820069811, -0.26517881813125, 13.7531682453991, -52.2394090753046, 2405.56298941048, -22736.1631268929, 89074.6343932567, -23923456.5822486, 5687958081.29714], m = h / 2800, sig = s / 5.3, P = 0;
    for (let i = 0; i < 35; i++) {
        let N = R3B_HS_N[i], I = R3B_HS_I[i], J = R3B_HS_J[i];
        P += N * Math.pow(m - 0.681, I) * Math.pow(sig - 0.792, J);
    }
    return 16.6 / P;
}
//
// Region 4
//
function r4(h, s) {
    let T = r4_HS_Tsat(h, s), P = PT.r4_T_Psat(T);
    return PT.solve(P, T);
}
// Tsat(h,s) Equation 9 in the HS Region 3 & 4 Supplementary release
// @internal - Exported for unit testing only
function r4_HS_Tsat(h, s) {
    let R4_I = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 6, 8, 10, 10, 12, 14, 14, 16, 16, 18, 18, 18, 20, 28], R4_J = [0, 3, 12, 0, 1, 2, 5, 0, 5, 8, 0, 2, 3, 4, 0, 1, 1, 2, 4, 16, 6, 8, 22, 1, 20, 36, 24, 1, 28, 12, 32, 14, 22, 36, 24, 36], R4_N = [0.179882673606601, -0.267507455199603, 0.11627672261266E1, 0.147545428713616, -0.512871635973248, 0.421333567697984, 0.56374952218987, 0.429274443819153, -0.33570455214214E1, 0.108890916499278E2, -0.248483390456012, 0.30415322190639, -0.494819763939905, 0.107551674933261E1, 0.733888415457688E-1, 0.140170545411085E-1, -0.106110975998808, 0.168324361811875E-1, 0.125028363714877E1, 0.101316840309509E4, -0.151791558000712E1, 0.524277865990866E2, 0.230495545563912E5, 0.249459806365456E-1, 0.210796467412137E7, 0.366836848613065E9, -0.144814105365163E9, -0.17927637300359E-2, 0.489955602100459E10, 0.471262212070518E3, -0.829294390198652E11, -0.171545662263191E4, 0.355777682973575E7, 0.586062760258436E12, -0.129887635078195E8, 0.317247449371057057E11], mu = h / 2800, sig = s / 9.2, T = 0;
    for (let i = 0; i < 36; i++) {
        let I = R4_I[i], J = R4_J[i], N = R4_N[i];
        T += N * Math.pow(mu - 0.119, I) * Math.pow(sig - 1.07, J);
    }
    return 550 * T;
}
function throwOutOfRange(prefix_msg = "") {
    throw new Error(`${prefix_msg}Input values out of range`);
}
//# sourceMappingURL=HS.js.map
});
  global.ThermoIF97 = Object.freeze({
    PT: modules.PT, PH: modules.PH, PS: modules.PS, HS: modules.HS,
    version: 'IAPWS-IF97 / Neutrium implementation 2.1.0',
    units: Object.freeze({ pressureInput: 'MPa', pressureOutput: 'Pa', temperature: 'K', specificVolume: 'm3/kg', enthalpy: 'kJ/kg', entropy: 'kJ/(kg K)', energy: 'kJ/kg', heatCapacity: 'kJ/(kg K)' })
  });
})(typeof window !== 'undefined' ? window : globalThis);
