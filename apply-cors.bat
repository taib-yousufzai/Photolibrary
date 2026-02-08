@echo off
echo ========================================
echo Firebase Storage CORS Configuration
echo ========================================
echo.
echo This script will apply CORS rules to your Firebase Storage bucket.
echo.
echo Prerequisites:
echo 1. Google Cloud SDK (gcloud) must be installed
echo 2. You must be authenticated with gcloud
echo.
echo To install gcloud: https://cloud.google.com/sdk/docs/install
echo.
pause
echo.
echo Applying CORS configuration...
gsutil cors set cors.json gs://brass-libs.firebasestorage.app
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ CORS configuration applied successfully!
    echo.
    echo Your Firebase Storage now allows:
    echo - localhost:5173 (Vite dev server)
    echo - localhost:3000 (alternative port)
    echo - Your production domains
    echo.
) else (
    echo ❌ Failed to apply CORS configuration.
    echo.
    echo Please make sure:
    echo 1. Google Cloud SDK is installed
    echo 2. You're authenticated: gcloud auth login
    echo 3. You have permissions for the Firebase project
    echo.
)
pause
