import folium
import pandas as pd

print("[*] Initializing Spatial Mapping Engine...")

# 1. DEFINE GEOGRAPHIC SECTORS (Coordinates for the 5 capitals)
capitals_data = {
    "City": ["Karachi", "Lahore", "Peshawar", "Quetta", "Gilgit"],
    "Latitude": [24.8607, 31.5204, 34.0151, 30.1798, 35.9208],
    "Longitude": [67.0011, 74.3587, 71.5249, 66.9750, 74.3089],
    # Simulating the AI's forecasted metrics for each sector at a specific flight hour
    "Forecasted_Wind_m_s": [4.2, 11.5, 3.8, 5.1, 12.1], 
    "Forecasted_Temp_C": [31.6, 33.8, 32.1, 24.5, 18.2]
}

df_map = pd.DataFrame(capitals_data)

# 2. INITIALIZE BASE MAP (Centered over Pakistan)
pakistan_map = folium.Map(
    location=[30.3753, 69.3451], 
    zoom_start=5, 
    tiles="CartoDB dark_matter"  # Clean industrial dark theme
)

# 3. DYNAMICALLY PLOT SECTORS AND APPLY AI HAZARD METRICS
WIND_THRESHOLD = 10.0  # m/s tactical threshold

for _, row in df_map.iterrows():
    # Evaluate status
    is_hazard = row["Forecasted_Wind_m_s"] >= WIND_THRESHOLD
    marker_color = "red" if is_hazard else "green"
    status_text = "⚠️ HAZARD BREACH" if is_hazard else "✅ OPERATIONAL CLEAR"
    
    # Create detailed dashboard popup content using HTML formatting
    popup_html = f"""
    <div style='font-family: Arial, sans-serif; width: 200px;'>
        <h4 style='margin:0 0 5px 0; color:{marker_color};'>{row['City']} Sector</h4>
        <hr style='margin:5px 0;'>
        <b>Status:</b> {status_text}<br>
        <b>AI Temp Forecast:</b> {row['Forecasted_Temp_C']}°C<br>
        <b>AI Wind Forecast:</b> {row['Forecasted_Wind_m_s']} m/s
    </div>
    """
    
    # Draw interactive circle markers
    folium.CircleMarker(
        location=[row["Latitude"], row["Longitude"]],
        radius=10 if is_hazard else 7,
        popup=folium.Popup(popup_html, max_width=250),
        color=marker_color,
        fill=True,
        fill_color=marker_color,
        fill_opacity=0.6,
        weight=2
    ).add_to(pakistan_map)

# 4. EXPORT MAP AS AN OPERATIONAL ASSET
output_filename = "tactical_weather_dashboard.html"
pakistan_map.save(output_filename)
print(f"[✓] Interactive dashboard successfully generated and saved to: {output_filename}")