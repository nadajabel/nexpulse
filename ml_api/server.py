# server.py
#python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
from __future__ import annotations

from typing import Optional, Dict, Any, List
from collections import deque
from datetime import datetime, timezone

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

# --------- CONFIG: chemins des modèles ---------
MODEL_DIR = "."
LABEL_MODEL_PATH = f"{MODEL_DIR}/label_model.pkl"
NEED_MODEL_PATH = f"{MODEL_DIR}/need_remeasure_model.pkl"
REMEASURE_MODEL_PATH = f"{MODEL_DIR}/remeasure_in_min_model.pkl"
ADVICE_MODEL_PATH = f"{MODEL_DIR}/advice_code_model.pkl"

# --------- Chargement des modèles ---------
label_model = joblib.load(LABEL_MODEL_PATH)
need_model = joblib.load(NEED_MODEL_PATH)
remeasure_model = joblib.load(REMEASURE_MODEL_PATH)
advice_model = joblib.load(ADVICE_MODEL_PATH)

# Pour connaître l'ordre des classes (probas)
LABEL_CLASSES = list(getattr(label_model, "classes_", []))

# --------- Etat en mémoire par patient ---------
class PatientState:
    def __init__(self):
        self.prev_bpm: Optional[float] = None
        self.prev_spo2: Optional[float] = None
        self.prev_temp: Optional[float] = None
        self.prev_ts: Optional[datetime] = None
        self.recent_labels: deque[str] = deque(maxlen=10)

STATE: Dict[str, PatientState] = {}

def parse_ts(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    # accepter "2026-01-01T10:00:00" ou "...Z"
    s = ts.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None

def trend(delta: float, eps: float) -> str:
    if delta > eps:
        return "up"
    if delta < -eps:
        return "down"
    return "stable"

# --------- Schémas API ---------
class PredictIn(BaseModel):
    # identifiant patient (ou device)
    patient_id: str = Field(default="P001")

    # timestamp ISO; si absent -> maintenant
    ts: Optional[str] = None

    # mesures instantanées
    bpm: float
    spo2: float
    temp: Optional[float] = None

    # contexte optionnel
    risk_profile: str = Field(default="low")  # low/mid/high
    symptom: Optional[str] = Field(default="none")  # optionnel

class PredictOut(BaseModel):
    patient_id: str
    ts: str

    label: str
    label_proba: Dict[str, float]

    need_remeasure: int
    remeasure_in_min: int
    advice_code: str

    features_used: Dict[str, Any]

app = FastAPI(title="NexPulse ML API", version="1.0.0")

@app.get("/health")
def health():
    return {"ok": True, "models_loaded": True, "label_classes": LABEL_CLASSES}

@app.post("/predict", response_model=PredictOut)
def predict(inp: PredictIn):
    pid = inp.patient_id
    st = STATE.get(pid)
    if st is None:
        st = PatientState()
        STATE[pid] = st

    now = parse_ts(inp.ts) or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    symptom = inp.symptom or "none"
    temp = float(inp.temp) if inp.temp is not None else 36.8  # fallback

    # previous defaults si première mesure
    bpm_prev = st.prev_bpm if st.prev_bpm is not None else inp.bpm
    spo2_prev = st.prev_spo2 if st.prev_spo2 is not None else inp.spo2
    temp_prev = st.prev_temp if st.prev_temp is not None else temp

    # time gap
    if st.prev_ts is None:
        time_gap_min = 30
    else:
        dt = (now - st.prev_ts).total_seconds() / 60.0
        time_gap_min = int(max(1, round(dt)))

    delta_bpm = float(inp.bpm - bpm_prev)
    delta_spo2 = float(inp.spo2 - spo2_prev)
    delta_temp = float(temp - temp_prev)

    trend_bpm = trend(delta_bpm, eps=2.0)
    trend_spo2 = trend(delta_spo2, eps=0.7)
    trend_temp = trend(delta_temp, eps=0.2)

    recent_abnormal_count_10 = sum(1 for x in st.recent_labels if x != "NORMAL")

    # Construire exactement les colonnes attendues par le pipeline
    # (mêmes noms que le dataset d'entraînement)
    row = {
        "risk_profile": inp.risk_profile,
        "bpm": float(inp.bpm),
        "spo2": float(inp.spo2),
        "temp": float(temp),

        "bpm_prev": float(bpm_prev),
        "spo2_prev": float(spo2_prev),
        "temp_prev": float(temp_prev),

        "delta_bpm": float(delta_bpm),
        "delta_spo2": float(delta_spo2),
        "delta_temp": float(delta_temp),

        "trend_bpm": trend_bpm,
        "trend_spo2": trend_spo2,
        "trend_temp": trend_temp,

        "time_gap_min": int(time_gap_min),
        "recent_abnormal_count_10": int(recent_abnormal_count_10),
        "symptom": symptom,
    }

    X = pd.DataFrame([row])

    # Prédire label + proba
    label = str(label_model.predict(X)[0])
    proba_vec = label_model.predict_proba(X)[0]
    label_proba = {LABEL_CLASSES[i]: float(proba_vec[i]) for i in range(len(LABEL_CLASSES))}

    # Autres prédictions
    need_remeasure = int(need_model.predict(X)[0])
    remeasure_in_min = int(remeasure_model.predict(X)[0])
    advice_code = str(advice_model.predict(X)[0])

    # Update state
    st.prev_bpm = float(inp.bpm)
    st.prev_spo2 = float(inp.spo2)
    st.prev_temp = float(temp)
    st.prev_ts = now
    st.recent_labels.append(label)

    return PredictOut(
        patient_id=pid,
        ts=now.isoformat(),
        label=label,
        label_proba=label_proba,
        need_remeasure=need_remeasure,
        remeasure_in_min=remeasure_in_min,
        advice_code=advice_code,
        features_used=row
    )