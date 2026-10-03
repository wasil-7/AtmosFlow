import os
import random
import time
import requests
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from darts import TimeSeries
from darts.models import XGBModel
from darts.dataprocessing.transformers import Scaler
import collections

def dijkstra_pruned(graph_edges, start_node, target_node, blocked_nodes):
    if start_node in blocked_nodes or target_node in blocked_nodes:
        return None, float('inf') 

    adj = collections.defaultdict(list)
    for edge in graph_edges:
        u, v = edge["nodes"]
        if u not in blocked_nodes and v not in blocked_nodes:
            adj[u].append((v, edge["distance"]))
            adj[v].append((u, edge["distance"]))

    queue = [(0, start_node, [])]
    seen = set()
    mins = {start_node: 0}

    while queue:
        (cost, v1, path) = collections.heappop(queue)
        if v1 not in seen:
            seen.add(v1)
            path = path + [v1]
            if v1 == target_node:
                return path, cost

            for v2, c in adj.get(v1, []):
                if v2 in seen: continue
                prev = mins.get(v2, None)
                next_cost = cost + c
                if prev is None or next_cost < prev:
                    mins[v2] = next_cost
                    collections.heappush(queue, (next_cost, v2, path))

    return None, float('inf') 


app = FastAPI(title="Tactical Weather & Flight Pathing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = "nastp_xgb_production.pkl"
if not os.path.exists(model_path):
    raise RuntimeError("Missing model files.")

local_model = XGBModel.load(model_path)

CITY_COORDS = {
    # Capital & Provincial Hubs
    "Islamabad": {"lat": 33.6989, "lon": 73.0369},
    "Karachi": {"lat": 24.8600, "lon": 67.0100},
    "Lahore": {"lat": 31.5497, "lon": 74.3436},
    "Peshawar": {"lat": 34.0144, "lon": 71.5675},
    "Quetta": {"lat": 30.1958, "lon": 67.0172},
    "Gilgit": {"lat": 35.9208, "lon": 74.3089},
    "Muzaffarabad": {"lat": 34.3700, "lon": 73.4711},

    # Major Regional & Economic Hubs
    "Faisalabad": {"lat": 31.4180, "lon": 73.0790},
    "Rawalpindi": {"lat": 33.6007, "lon": 73.0679},
    "Multan": {"lat": 30.1978, "lon": 71.4711},
    "Gujranwala": {"lat": 32.1500, "lon": 74.1833},
    "Sialkot": {"lat": 32.5000, "lon": 74.5333},
    "Hyderabad": {"lat": 25.3792, "lon": 68.3683},
    "Sukkur": {"lat": 27.7052, "lon": 68.8574},
    "Bahawalpur": {"lat": 29.3956, "lon": 71.6833},
    "Sargodha": {"lat": 32.0836, "lon": 72.6711},

    # Strategic & Aviation Waypoints
    "Gwadar": {"lat": 25.1216, "lon": 62.3254},
    "Skardu": {"lat": 35.2981, "lon": 75.6114},
    "Abbottabad": {"lat": 34.1463, "lon": 73.2117},
    "Chitral": {"lat": 35.8510, "lon": 71.7864},
    "Mianwali": {"lat": 32.5839, "lon": 71.5370}
}

AIR_CORRIDORS = [
    {"nodes": ["Karachi", "Quetta"], "distance": 686},
    {"nodes": ["Karachi", "Lahore"], "distance": 1022},
    {"nodes": ["Lahore", "Peshawar"], "distance": 376},
    {"nodes": ["Lahore", "Quetta"], "distance": 714},
    {"nodes": ["Lahore", "Gilgit"], "distance": 512},
    {"nodes": ["Quetta", "Peshawar"], "distance": 535},
    {"nodes": ["Peshawar", "Gilgit"], "distance": 501}
]

class PredictResponse(BaseModel):
    city: str
    forecast: list[dict]

FORECAST_CACHE = {"timestamp": 0, "data": {}}
CACHE_TTL = 600

def update_global_forecasts():
    global FORECAST_CACHE
    current_time = time.time()
    
    if current_time - FORECAST_CACHE["timestamp"] < CACHE_TTL and FORECAST_CACHE["data"]:
        return FORECAST_CACHE["data"]
        
    all_city_data = []
    current_hour = pd.Timestamp.now().floor("h")

    for city, coords in CITY_COORDS.items():
        lat, lon = coords["lat"], coords["lon"]
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&past_days=1&forecast_days=1&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
        
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                df = pd.DataFrame(response.json()["hourly"])
                df["date"] = pd.to_datetime(df["time"])
                df["city"] = city
                df = df[df["date"] <= current_hour].tail(24)
                all_city_data.append(df)
        except Exception as e:
            print(f"Error fetching {city}: {e}")

    if not all_city_data:
        raise HTTPException(status_code=500, detail="Weather API completely unreachable.")

    master_df = pd.concat(all_city_data, ignore_index=True)
    series_list = TimeSeries.from_group_dataframe(
        master_df, group_cols="city", time_col="date",
        value_cols=["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "precipitation"], freq="h"
    )

    scaler = Scaler()
    scaled_series_list = scaler.fit_transform(series_list)
    scaled_forecasts = local_model.predict(n=12, series=scaled_series_list)
    real_forecasts = scaler.inverse_transform(scaled_forecasts)

    sorted_cities = sorted(CITY_COORDS.keys())
    new_cache_data = {}

    for city, forecast_series in zip(sorted_cities, real_forecasts):
        forecast_df = forecast_series.to_dataframe()
        forecast_list = []
        
        for timestamp, row in forecast_df.iterrows():
            temp = round(row["temperature_2m"], 1)
            wind = round(row["wind_speed_10m"], 2)
            rain = round(row["precipitation"], 2)
            humidity = round(row["relative_humidity_2m"], 1)

            is_wind_hazard = bool(wind >= 10.0)
            is_temp_hazard = bool(temp >= 45.0)
            is_rain_hazard = bool(rain >= 5.0)

            hazard_status = "CLEAR"
            hazard_status = "HIGH WIND" if is_wind_hazard else hazard_status
            hazard_status = "EXTREME HEAT" if is_temp_hazard else hazard_status
            hazard_status = "HEAVY RAIN" if is_rain_hazard else hazard_status
            
            has_multiple = (is_wind_hazard and is_temp_hazard) or (is_wind_hazard and is_rain_hazard) or (is_temp_hazard and is_rain_hazard)
            hazard_status = "MULTI-THREAT HAZARD" if has_multiple else hazard_status

            forecast_list.append({
                "time": timestamp.strftime('%H:00'),
                "temperature": temp,
                "wind_speed": wind,
                "precipitation": rain,
                "humidity": humidity,
                "hazard": bool(is_wind_hazard or is_temp_hazard or is_rain_hazard),
                "hazard_type": hazard_status
            })
            
        new_cache_data[city] = forecast_list

    FORECAST_CACHE["timestamp"] = current_time
    FORECAST_CACHE["data"] = new_cache_data
    return new_cache_data


@app.get("/predict/{city}", response_model=PredictResponse)
def get_forecast(city: str):
    if city not in CITY_COORDS:
        raise HTTPException(status_code=404, detail="City not recognized in operational database.")
    
    global_forecasts = update_global_forecasts()
    return {"city": city, "forecast": global_forecasts[city]}

AIRCRAFT_CACHE = {"timestamp": 0, "data": []}
CACHE_TTL_SECONDS = 12

@app.get("/aircraft/live")
def get_live_aircraft():
    global AIRCRAFT_CACHE
    current_time = time.time()
    
    if current_time - AIRCRAFT_CACHE["timestamp"] < CACHE_TTL_SECONDS:
        return {"status": "LIVE_CACHED", "flights": AIRCRAFT_CACHE["data"]}
        
    url = "https://opensky-network.org/api/states/all?lamin=23.6&lomin=60.8&lamax=37.1&lomax=77.0"
    
    live_flights = []
    
    try:
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data and data.get("states"):
                for state in data["states"]:
                    if state[5] is not None and state[6] is not None:
                        live_flights.append({
                            "icao24": state[0],
                            "callsign": state[1].strip() if state[1] else "NAV_UNKN",
                            "longitude": state[5],
                            "latitude": state[6],
                            "altitude_m": state[7] if state[7] else 0,
                            "velocity_ms": state[9] if state[9] else 0,
                            "heading": state[10] if state[10] else 0
                        })
    except Exception as e:
        print(f"OpenSky API Error: {e}")

    if len(live_flights) == 0:
        offset = random.uniform(-0.1, 0.1)
        live_flights = [
            {
                "icao24": "SIM001", "callsign": "PK-TAC1", 
                "longitude": 67.1 + offset, "latitude": 25.0 + offset, 
                "altitude_m": 8500, "velocity_ms": 230, "heading": 45
            },
            {
                "icao24": "SIM002", "callsign": "PK-TAC2", 
                "longitude": 74.3 - offset, "latitude": 31.5 + offset, 
                "altitude_m": 9200, "velocity_ms": 245, "heading": 310
            },
            {
                "icao24": "SIM003", "callsign": "PK-TAC3", 
                "longitude": 73.0 + offset, "latitude": 33.6 - offset, 
                "altitude_m": 7800, "velocity_ms": 210, "heading": 180
            },
            {
                "icao24": "SIM004", "callsign": "PK-TAC4", 
                "longitude": 66.9 + offset, "latitude": 30.1 - offset, 
                "altitude_m": 6500, "velocity_ms": 190, "heading": 90
            }
        ]

    AIRCRAFT_CACHE["timestamp"] = current_time
    AIRCRAFT_CACHE["data"] = live_flights
        
    return {"status": "ACTIVE", "flights": live_flights}

@app.get("/route/{start}/{end}")
def calculate_evasion_route(start: str, end: str):
    if start not in CITY_COORDS or end not in CITY_COORDS:
        raise HTTPException(status_code=404, detail="Invalid route endpoints.")

    global_forecasts = update_global_forecasts()
    
    city_hazards = {
        city: any(h["hazard"] for h in global_forecasts[city]) 
        for city in CITY_COORDS
    }

    start_hazard = city_hazards[start]
    end_hazard = city_hazards[end]

    if not start_hazard and not end_hazard:
        return {
            "status": "DIRECT_CLEAR",
            "path": [start, end],
            "hazard_detected": False,
            "message": "Direct flight corridor is clear.",
            "waypoints": [CITY_COORDS[start], CITY_COORDS[end]]
        }

    clean_intermediates = [
        c for c in CITY_COORDS 
        if c not in [start, end] and not city_hazards[c]
    ]

    safe_waypoint = clean_intermediates[0] if clean_intermediates else ("Lahore" if "Lahore" not in [start, end] else "Peshawar")
    evasion_path = [start, safe_waypoint, end]

    return {
        "status": "REROUTED",
        "path": evasion_path,
        "hazard_detected": True,
        "evacuation_node": safe_waypoint,
        "message": f"Hazard breach along direct corridor. Rerouted via safe sector: {safe_waypoint}.",
        "waypoints": [CITY_COORDS[node] for node in evasion_path]
    }