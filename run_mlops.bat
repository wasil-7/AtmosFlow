@echo off
echo ===================================================
echo Starting Tactical Weather MLOps Pipeline
echo ===================================================

REM 1. Activate the Conda environment (MUST use "call")
echo Activating Conda environment: nastp_env...
call conda activate nastp_env

REM 2. Run the retraining script
echo Running XGBoost retraining pipeline...
python retrain_pipeline.py
REM (If your script is named train_xgboost.py, use that instead)

echo ===================================================
echo Pipeline Execution Complete.
echo ===================================================

REM 3. Keep the window open so you can read the output
pause