import os
import requests
import pandas as pd
from darts import TimeSeries
from darts.models import XGBModel
from darts.dataprocessing.transformers import Scaler

def train_baseline_xgboost():
    print("[*] Initiating Baseline XGBoost Training Pipeline...")

    CITY_COORDS = {
        "Islamabad": {"lat": 33.6989, "lon": 73.0369},
        "Karachi": {"lat": 24.8600, "lon": 67.0100},
        "Lahore": {"lat": 31.5497, "lon": 74.3436},
        "Peshawar": {"lat": 34.0144, "lon": 71.5675},
        "Quetta": {"lat": 30.1958, "lon": 67.0172},
        "Gilgit": {"lat": 35.9208, "lon": 74.3089},
        "Muzaffarabad": {"lat": 34.3700, "lon": 73.4711},
        "Faisalabad": {"lat": 31.4180, "lon": 73.0790},
        "Rawalpindi": {"lat": 33.6007, "lon": 73.0679},
        "Multan": {"lat": 30.1978, "lon": 71.4711},
        "Gujranwala": {"lat": 32.1500, "lon": 74.1833},
        "Sialkot": {"lat": 32.5000, "lon": 74.5333},
        "Hyderabad": {"lat": 25.3792, "lon": 68.3683},
        "Sukkur": {"lat": 27.7052, "lon": 68.8574},
        "Bahawalpur": {"lat": 29.3956, "lon": 71.6833},
        "Sargodha": {"lat": 32.0836, "lon": 72.6711},
        "Gwadar": {"lat": 25.1216, "lon": 62.3254},
        "Skardu": {"lat": 35.2981, "lon": 75.6114},
        "Abbottabad": {"lat": 34.1463, "lon": 73.2117},
        "Chitral": {"lat": 35.8510, "lon": 71.7864},
        "Mianwali": {"lat": 32.5839, "lon": 71.5370}
    }

    df_list = []

    # 1. EXTRACT: Fetch 30 days of historical telemetry for all 21 cities
    for city, coords in CITY_COORDS.items():
        print(f"[*] Extracting 30-day historical telemetry for {city}...")
        url = f"https://api.open-meteo.com/v1/forecast?latitude={coords['lat']}&longitude={coords['lon']}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&past_days=30&forecast_days=0"
        try:
            response = requests.get(url).json()
            if "hourly" in response:
                df = pd.DataFrame({
                    "date": pd.to_datetime(response["hourly"]["time"]),
                    "city": city,
                    "temperature_2m": response["hourly"]["temperature_2m"],
                    "relative_humidity_2m": response["hourly"]["relative_humidity_2m"],
                    "precipitation": response["hourly"]["precipitation"],
                    "wind_speed_10m": response["hourly"]["wind_speed_10m"]
                }).dropna()
                df_list.append(df)
        except Exception as e:
            print(f"Error fetching data for {city}: {e}")

    if not df_list:
        print("[!] Failed to fetch any data.")
        return

    master_df = pd.concat(df_list).reset_index(drop=True)

    # 2. TRANSFORM
    print("[*] Transforming data into TimeSeries...")
    series_list = TimeSeries.from_group_dataframe(
        master_df, group_cols="city", time_col="date",
        value_cols=["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "precipitation"], freq="h"
    )

    scaler = Scaler()
    scaled_series = scaler.fit_transform(series_list)

    # 3. INITIALIZE & TRAIN XGBOOST
    print("[*] Initializing XGBoost Model (lags=24, output_chunk_length=12)...")
    model = XGBModel(lags=24, output_chunk_length=12, use_static_covariates=False)
    
    print("[*] Training model across all sectors...")
    model.fit(scaled_series)

    # 4. SAVE MODEL
    model_path = "nastp_xgb_production.pkl"
    model.save(model_path)
    print(f"[✓] XGBoost model trained and saved to: {model_path}")

if __name__ == "__main__":
    train_baseline_xgboost()
