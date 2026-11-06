"""Optional IF97 property API for TJU-ThermoHub.

Run from the project root:
  python -m pip install -r api/requirements.txt
  uvicorn main:app --app-dir api --host 0.0.0.0 --port 8000

This service uses CoolProp's dedicated IF97::Water backend. It does not silently
fall back to a generic water EOS. Validity is enforced by CoolProp itself.
"""
from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

try:
    import CoolProp
    from CoolProp.CoolProp import PropsSI, PhaseSI
except Exception as exc:  # clear startup error instead of pretending the backend exists
    CoolProp = None  # type: ignore[assignment]
    PropsSI = None  # type: ignore[assignment]
    PhaseSI = None  # type: ignore[assignment]
    _COOLPROP_IMPORT_ERROR = str(exc)
else:
    _COOLPROP_IMPORT_ERROR = ""

app = FastAPI(
    title="TJU-ThermoHub IF97 API",
    version="1.0.0",
    description="Dedicated IAPWS-IF97 water/steam properties via CoolProp IF97::Water backend.",
)

_default_origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://untholionleen.github.io",
]
_origins = [x.strip() for x in os.getenv("CORS_ORIGINS", ",".join(_default_origins)).split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)

WATER = "IF97::Water"


def _ensure_backend() -> None:
    if PropsSI is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "CoolProp is not installed in this API environment. Install dependencies "
                "from api/requirements.txt. Import error: " + _COOLPROP_IMPORT_ERROR
            ),
        )


def _prop(output: str, key1: str, value1: float, key2: str, value2: float) -> float:
    assert PropsSI is not None
    try:
        return float(PropsSI(output, key1, value1, key2, value2, WATER))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"IF97 calculation rejected this state: {exc}") from exc


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "TJU-ThermoHub IF97 API",
        "coolprop_installed": PropsSI is not None,
        "coolprop_version": getattr(CoolProp, "__version__", None) if CoolProp else None,
        "backend": WATER,
        "cors_origins": _origins,
        "note": "This health check does not imply that a specific input state is valid.",
    }


@app.get("/api/steam/if97")
def steam_if97(
    T: float = Query(..., gt=0, description="Temperature in kelvin"),
    P_MPa: float = Query(..., gt=0, description="Pressure in MPa"),
) -> dict[str, Any]:
    """Return single-phase IF97 properties for the requested T/P state.

    Saturated two-phase states require a separate quality input and should use
    the saturation/quality endpoint in a later module; this endpoint rejects
    states that CoolProp's IF97 backend cannot uniquely evaluate from T and P.
    """
    _ensure_backend()
    P = P_MPa * 1_000_000.0
    try:
        phase = str(PhaseSI("T", T, "P", P, WATER)) if PhaseSI else "unknown"
    except Exception:
        phase = "unknown / backend classification unavailable"

    specs = [
        ("比体积 v", "Dmass", "m³/kg", lambda x: 1.0 / x),
        ("比焓 h", "Hmass", "kJ/kg", lambda x: x / 1000.0),
        ("比熵 s", "Smass", "kJ/(kg·K)", lambda x: x / 1000.0),
        ("比内能 u", "Umass", "kJ/kg", lambda x: x / 1000.0),
        ("定压比热容 cp", "Cpmass", "kJ/(kg·K)", lambda x: x / 1000.0),
        ("定容比热容 cv", "Cvmass", "kJ/(kg·K)", lambda x: x / 1000.0),
    ]
    properties: dict[str, dict[str, Any]] = {}
    for label, key, unit, transform in specs:
        raw = _prop(key, "T", T, "P", P)
        value = transform(raw)
        properties[label] = {"value": value, "unit": unit}

    return {
        "ok": True,
        "backend": WATER,
        "version": getattr(CoolProp, "__version__", "unknown") if CoolProp else "unknown",
        "inputs": {"T_K": T, "P_MPa": P_MPa},
        "phase": phase,
        "properties": properties,
        "source": "CoolProp IF97::Water (IAPWS-IF97 backend)",
        "warning": "T/P single-phase calculation. For saturated two-phase water/steam, provide quality x and use a dedicated saturation endpoint.",
    }


@app.get("/api/steam/saturation")
def steam_saturation(
    T: float = Query(..., gt=0, description="Saturation temperature in kelvin"),
) -> dict[str, Any]:
    """Return saturated liquid/vapor endpoints for a saturation temperature."""
    _ensure_backend()
    assert PropsSI is not None
    try:
        P = float(PropsSI("P", "T", T, "Q", 0, WATER))
        sides: dict[str, dict[str, Any]] = {}
        for label, quality in (("saturated_liquid", 0), ("saturated_vapor", 1)):
            vals = {
                "v_m3_kg": 1.0 / float(PropsSI("Dmass", "T", T, "Q", quality, WATER)),
                "h_kJ_kg": float(PropsSI("Hmass", "T", T, "Q", quality, WATER)) / 1000.0,
                "s_kJ_kgK": float(PropsSI("Smass", "T", T, "Q", quality, WATER)) / 1000.0,
                "u_kJ_kg": float(PropsSI("Umass", "T", T, "Q", quality, WATER)) / 1000.0,
            }
            sides[label] = vals
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"IF97 saturation calculation rejected this state: {exc}") from exc
    return {
        "ok": True,
        "backend": WATER,
        "version": getattr(CoolProp, "__version__", "unknown") if CoolProp else "unknown",
        "T_K": T,
        "P_MPa": P / 1_000_000.0,
        **sides,
        "source": "CoolProp IF97::Water (IAPWS-IF97 backend)",
    }
