import os
import glob
import PyPDF2

def extract_pdf_text(filepath):
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        text += f"[Error reading PDF: {e}]\n"
    return text

def extract_text(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"[Error reading file: {e}]\n"

def main():
    docs = []
    
    # Specific PDFs
    pdf_files = ["MID REPORT.pdf", "Weather Alert System.pdf", "Weather Alerts.pdf"]
    for p in pdf_files:
        if os.path.exists(p):
            docs.append(f"--- CONTENT OF {p} ---\n" + extract_pdf_text(p) + "\n\n")

    # Other docs
    for ext in ['*.md', '*.txt']:
        for file in glob.glob(ext):
            if "final_report_draft.txt" in file or "requirements.txt" in file:
                continue
            docs.append(f"--- CONTENT OF {file} ---\n" + extract_text(file) + "\n\n")
            
    # Combine everything
    combined_docs = "".join(docs)

    thread_synthesis = """
====================================================================
               TECHNICAL IMPLEMENTATION SYNTHESIS
====================================================================

1. Macro Engine (Thread 1)
--------------------------
- Upgraded predictive infrastructure from baseline LSTM models to high-performance XGBoost Regressors.
- Achieved superior error reduction across 12-hour predictive horizons (MAE comparison: XGBoost baseline 5.78 vs LSTM 10.13 vs TFT 7.02).
- Enabled high-velocity inference on CPU architectures.

2. Micro Nowcasting (Thread 2)
------------------------------
- Implemented high-frequency 15-minute active radar capabilities.
- Leveraged mathematical momentum derivatives (ΔTemp, ΔWind, ΔHumidity) combined with cyclical sine/cosine time encodings.
- Eliminated autoregressive lag, dropping MAE from 7.02 to 2.88 for short-term prediction windows.

3. Geospatial Expansion (Thread 3)
----------------------------------
- Successfully scaled the inference topology from 5 initial provincial capitals to a comprehensive 21 strategic sector network (including Gilgit, Skardu, Gwadar).
- Updated the Dijkstra airspace routing algorithms (`AIR_CORRIDORS`) to account for extended dynamic graphs.

4. Enterprise UI Revamp (Thread 4)
----------------------------------
- Architected and rebuilt a React-based multi-tab tactical dashboard.
- Implemented a 'Light Glassmorphism' design system utilizing Tailwind CSS.
- Deployed interactive telemetry controls, including 12-hour time scrubbers, FL100-FL400 altitude constraints, and active radar range adjustments.
- Integrated `react-leaflet` with CartoDB Positron mapping for fluid waypoint visualization and threat boundary rendering.

5. MLOps Pipeline & Automation (Thread 5 & 6)
---------------------------------------------
- Stabilized data ingestion via Parquet-backed delta fetching methodologies (`get_or_update_historical_data`).
- Developed a fully autonomous 12-hour batch retraining scheduler (`run_mlops.bat`).
- Standardized the computational environment via robust Conda specifications (`environment.yml` and pinned `requirements.txt`), ensuring exact reproducibility for production deployment.

"""

    final_draft = "====================================================================\n"
    final_draft += "                  MASTER PROJECT REPORT DRAFT\n"
    final_draft += "====================================================================\n\n"
    
    final_draft += "PART 1: EXTRACTED DOCUMENTATION\n"
    final_draft += "===============================\n\n"
    final_draft += combined_docs
    
    final_draft += "PART 2: RECENT TECHNICAL WORK\n"
    final_draft += "=============================\n"
    final_draft += thread_synthesis

    with open("final_report_draft.txt", "w", encoding="utf-8") as f:
        f.write(final_draft)
    
    print("Draft generated successfully.")

if __name__ == "__main__":
    main()
