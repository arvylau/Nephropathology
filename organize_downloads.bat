@echo off
echo ========================================
echo Image Management - Auto Organizer
echo ========================================
echo.

REM Set paths
set "DOWNLOADS=%USERPROFILE%\Downloads"
set "PROJECT=%~dp0"
set "IMAGES=%PROJECT%question_images"

echo Looking for exported files in Downloads...
echo.

REM Find the most recent exported JSON
for /f "delims=" %%i in ('dir /b /od "%DOWNLOADS%\nephro_questions_image_updated_*.json" 2^>nul') do set "LATEST_JSON=%%i"

if not defined LATEST_JSON (
    echo [ERROR] No exported JSON found in Downloads folder
    echo Please use Manual Export first!
    pause
    exit /b 1
)

echo Found: %LATEST_JSON%
echo.

REM Count image files
set /a COUNT=0
for %%f in ("%DOWNLOADS%\question_*.jpg" "%DOWNLOADS%\question_*.png" "%DOWNLOADS%\question_*.jpeg") do set /a COUNT+=1

echo Found %COUNT% image files
echo.

REM Ask for confirmation
echo Ready to organize files:
echo   JSON: %LATEST_JSON%
echo   Images: %COUNT% files
echo   Destination: %PROJECT%
echo.
choice /C YN /M "Proceed"
if errorlevel 2 exit /b 0

echo.
echo Moving files...

REM Move images
if exist "%DOWNLOADS%\question_*.jpg" move /Y "%DOWNLOADS%\question_*.jpg" "%IMAGES%\" >nul 2>&1
if exist "%DOWNLOADS%\question_*.png" move /Y "%DOWNLOADS%\question_*.png" "%IMAGES%\" >nul 2>&1
if exist "%DOWNLOADS%\question_*.jpeg" move /Y "%DOWNLOADS%\question_*.jpeg" "%IMAGES%\" >nul 2>&1

echo [OK] Images moved to question_images\

REM Backup current JSON
if exist "%PROJECT%nephro_questions_enhanced.json" (
    copy /Y "%PROJECT%nephro_questions_enhanced.json" "%PROJECT%nephro_questions_enhanced_backup_%date:~-4%%date:~3,2%%date:~0,2%.json" >nul
    echo [OK] Backed up current JSON
)

REM Move and rename JSON
move /Y "%DOWNLOADS%\%LATEST_JSON%" "%PROJECT%nephro_questions_enhanced.json" >nul
echo [OK] Updated nephro_questions_enhanced.json

REM Clean up instructions file
del "%DOWNLOADS%\image_replacement_instructions_*.txt" 2>nul

echo.
echo ========================================
echo SUCCESS! Files organized automatically
echo ========================================
echo.
echo Next steps:
echo 1. Test portals: http://localhost:8080/
echo 2. Commit to Git: git add . ^&^& git commit -m "Update images"
echo 3. Push to GitHub: git push
echo.
pause
