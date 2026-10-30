import os
import sys
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Same-directory imports (python main.py from backend/, or elsewhere)
_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

try:
    from routing_engine import TridentRouter

    router_engine = TridentRouter()
except Exception as e:
    print(f"[WARN] Routing engine initialization issue: {e}")
    router_engine = None

app = FastAPI(title="Trident-AI Operations Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# YOLO/ultralytics/torch/pyyaml are unused by default (Python 3.15 has no pyyaml
# wheel; Windows App Control may also block torch.dll). Vision counts stay mock.
vision_model = None
if os.environ.get("TRIDENT_ENABLE_YOLO", "").strip().lower() in {"1", "true", "yes"}:
    try:
        from ultralytics import YOLO

        try:
            vision_model = YOLO("yolov8n.pt")
        except Exception as e:
            print(f"[WARN] YOLO model load failed; vision remains optional: {e}")
            vision_model = None
    except Exception as e:
        print(
            "[WARN] ultralytics/torch import failed; vision_model disabled: "
            f"{e}"
        )
        vision_model = None


class TelemetryData(BaseModel):
    distance_to_obstacle: float
    v_ego: float
    v_lead: float
    hazard_detected: bool
    yield_required: bool


class RoutePayload(BaseModel):
    start_lng: float
    start_lat: float
    end_lng: float
    end_lat: float


class HazardPenaltyPayload(BaseModel):
    lng: float
    lat: float
    severity: str


@app.get("/")
async def root():
    return {
        "service": "Trident-AI Operations Engine",
        "status": "ok",
        "routing_engine": router_engine is not None,
        "vision_model": vision_model is not None,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "routing_engine": router_engine is not None,
        "vision_model": vision_model is not None,
    }


@app.post("/api/v1/route/calculate")
async def calculate_optimized_route(payload: RoutePayload):
    """Computes a standard path vs an AI hazard-avoidance route"""
    if not router_engine:
        raise HTTPException(status_code=503, detail="Routing engine offline")

    start_tuple = (payload.start_lng, payload.start_lat)
    end_tuple = (payload.end_lng, payload.end_lat)

    result = router_engine.calculate_safe_path(start_tuple, end_tuple)
    if result.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=result.get("message"))

    return result


@app.post("/api/v1/route/inject-hazard")
async def inject_live_hazard_penalty(payload: HazardPenaltyPayload):
    """Dynamically updates the graph weight matrix"""
    if not router_engine:
        raise HTTPException(status_code=503, detail="Routing engine offline")

    success = router_engine.inject_hazard_penalty(payload.lng, payload.lat, payload.severity)
    if not success:
        return {"status": "FALLBACK", "message": "Simulated matrix update processed"}

    return {"status": "SUCCESS", "message": "Graph weight modified accurately"}


@app.post("/api/v1/telemetry/process")
async def process_driving_telemetry(data: TelemetryData):
    v_rel = data.v_ego - data.v_lead
    ttc = float("inf") if v_rel <= 0 else data.distance_to_obstacle / v_rel

    if ttc < 1.5:
        driving_state = "EMERGENCY_BRAKE"
    elif data.hazard_detected and data.distance_to_obstacle < 15.0:
        driving_state = "AVOID"
    elif data.yield_required:
        driving_state = "YIELD"
    elif ttc < 3.0:
        driving_state = "FOLLOW"
    else:
        driving_state = "CRUISE"

    return {
        "time_to_collision": "inf" if ttc == float("inf") else round(ttc, 2),
        "driving_state": driving_state,
        "recommended_action": "APPLY_MAXIMUM_BRAKES"
        if driving_state == "EMERGENCY_BRAKE"
        else "MAINTAIN_PATH",
    }


@app.get("/api/v1/vision/counts")
async def get_live_vision_counts():
    return {
        "active_nodes": 1,
        "detections": {
            "cars": int(np.random.randint(5, 12)),
            "bikes": int(np.random.randint(2, 6)),
            "trucks": int(np.random.randint(0, 3)),
            "pedestrians": int(np.random.randint(0, 4)),
        },
        "congestion_status": "HIGH",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
