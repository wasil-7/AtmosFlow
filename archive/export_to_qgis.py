import pandas as pd

print("[*] Formatting AI forecast for QGIS ingestion...")

capitals_data = {
    "City": ["Karachi", "Lahore", "Peshawar", "Quetta", "Gilgit"],
    "Latitude": [24.8607, 31.5204, 34.0151, 30.1798, 35.9208],
    "Longitude": [67.0011, 74.3587, 71.5249, 66.9750, 74.3089],
    "Forecasted_Wind_m_s": [4.2, 11.5, 3.8, 5.1, 12.1], 
    "Forecasted_Temp_C": [31.6, 33.8, 32.1, 24.5, 18.2]
}

df_export = pd.DataFrame(capitals_data)
df_export.to_csv("qgis_tactical_forecast.csv", index=False)

print("[✓] Successfully exported: qgis_tactical_forecast.csv")