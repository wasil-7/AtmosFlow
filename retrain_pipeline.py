import os
import requests
import pandas as pd
from darts import TimeSeries
from darts.models import RNNModel
from darts.dataprocessing.transformers import Scaler

def run_mlops_retrain():
    print("[*] Initiating Automated MLOps Pipeline...")

    CITY_COORDS = {
        "Karachi": {"lat": 24.8607, "lon": 67.0011},
        "Lahore": {"lat": 31.5204, "lon": 74.3587},
        "Peshawar": {"lat": 34.0151, "lon": 71.5249},
        "Quetta": {"lat": 30.1798, "lon": 66.9750},
        "Gilgit": {"lat": 35.9208, "lon": 74.3089}
    }

    df_list = []

    # 1. EXTRACT: Fetch recent telemetry
    for city, coords in CITY_COORDS.items():
        print(f"[*] Extracting latest telemetry for {city}...")
        url = f"https://api.open-meteo.com/v1/forecast?latitude={coords['lat']}&longitude={coords['lon']}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&past_days=14&forecast_days=0"
        response = requests.get(url).json()
        
        df = pd.DataFrame({
            "date": pd.to_datetime(response["hourly"]["time"]),
            "city": city,
            "temperature_2m": response["hourly"]["temperature_2m"],
            "relative_humidity_2m": response["hourly"]["relative_humidity_2m"],
            "precipitation": response["hourly"]["precipitation"],
            "wind_speed_10m": response["hourly"]["wind_speed_10m"]
        }).dropna()
        df_list.append(df)

    master_df = pd.concat(df_list).reset_index(drop=True)

    # 2. SAVE LOCAL DATASET
    csv_save_path = "latest_telemetry_dataset.csv"
    master_df.to_csv(csv_save_path, index=False)
    print(f"[OK] Local dataset updated and saved to: {csv_save_path}")

    # 3. TRANSFORM
    series_list = TimeSeries.from_group_dataframe(
        master_df, group_cols="city", time_col="date",
        value_cols=["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "precipitation"], freq="h"
    )

    scaler = Scaler()
    scaled_series = scaler.fit_transform(series_list)

    # 4. LOAD & RETRAIN WEIGHTS
    model_path = "nastp_xgb_production.pkl"
    if os.path.exists(model_path):
        print("[*] Loading local XGBoost model weights for fine-tuning...")
        from darts.models import XGBModel
        model = XGBModel.load(model_path)
        model.fit(scaled_series)
        model.save(model_path)
        print(f"[OK] Model weights updated and saved to: {model_path}")
    else:
        print("[!] Base model file not found in root directory.")

if __name__ == "__main__":
    run_mlops_retrain()