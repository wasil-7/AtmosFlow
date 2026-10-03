import os
import requests
import pandas as pd
from darts import TimeSeries
from darts.models import XGBModel
from darts.dataprocessing.transformers import Scaler

print("[*] Initializing Local Tactical AI Environment...")

# 1. LOAD COMPRESSED BRAIN
model_path = "nastp_xgb_production.pkl"
if not os.path.exists(model_path):
    raise FileNotFoundError("Missing model files! Ensure the .pkl file is in the directory.")

print("[*] Loading XGBoost model into CPU memory...")
local_model = XGBModel.load(model_path)

# 2. FETCH REAL LIVE WEATHER DATA FOR ALL SECTORS
CITY_COORDS = {
    'Karachi': (24.8607, 67.0011),
    'Lahore': (31.5204, 74.3587),
    'Peshawar': (34.0151, 71.5249),
    'Quetta': (30.1798, 66.9750),
    'Gilgit': (35.9208, 74.3089)
}

print("[*] Fetching real 24-hour telemetry streams from Open-Meteo...")
all_city_data = []
current_hour = pd.Timestamp.now().floor("h")

for city, (lat, lon) in CITY_COORDS.items():
    # Fetch yesterday and today's data to ensure we have a full 24-hour lookback
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&past_days=3&forecast_days=1&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
    response = requests.get(url).json()
    
    df = pd.DataFrame(response["hourly"])
    df["date"] = pd.to_datetime(df["time"])
    df["city"] = city
    
    # Slice the exact 24 hours immediately preceding right now
    df = df[df["date"] <= current_hour].tail(24)
    all_city_data.append(df)

# Stack all 5 cities into one master dataframe
real_data_master = pd.concat(all_city_data, ignore_index=True)
print(f"[OK] Successfully ingested {len(real_data_master)} rows of live multi-sector telemetry.")

# Convert real data into a list of scaled Darts series objects
# Darts will automatically group them by the 'city' column
series_list = TimeSeries.from_group_dataframe(
    real_data_master, group_cols="city", time_col="date",
    value_cols=["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "precipitation"], freq="h"
)

scaler = Scaler()
scaled_series_list = scaler.fit_transform(series_list)

# ==========================================
# RETRAINING MOVED TO retrain_pipeline.py
# ==========================================

# 3. COMPUTE FLIGHT METRICS
print("[*] Computing zero-latency 12-hour predictive forecasts...")
# The model takes the list of 5 scaled series and returns a list of 5 scaled forecasts
scaled_forecasts = local_model.predict(n=12, series=scaled_series_list)
real_forecasts = scaler.inverse_transform(scaled_forecasts)

# 4. TACTICAL READOUT
WIND_THRESHOLD = 10.0  # m/s

# Darts sorts groups alphabetically (Gilgit, Karachi, Lahore, Peshawar, Quetta)
sorted_cities = sorted(CITY_COORDS.keys())

for city, forecast_series in zip(sorted_cities, real_forecasts):
    print(f"\n[OK] 12-Hour Operational Forecast Readout: {city.upper()}")
    print("-" * 55)
    
    forecast_df = forecast_series.to_dataframe()
    for timestamp, row in forecast_df.iterrows():
        wind = row["wind_speed_10m"]
        temp = row["temperature_2m"]
        status = "[!] HAZARD" if wind >= WIND_THRESHOLD else "[OK] CLEAR"
        print(f"Time: {timestamp.strftime('%H:00')} | Temp: {temp:5.1f}C | Wind: {wind:5.2f} m/s | Status: {status}")