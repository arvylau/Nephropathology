@echo off
echo ========================================
echo Sync Working Folder to Git Repository
echo ========================================
echo.

set "WORKING=C:\Users\lauar\Documents\nephro_work\question_images"
set "WORKING_OLD=C:\Users\lauar\Documents\NEFRO\nephro_images\question_images"
set "GIT_REPO=%~dp0"
set "GIT_IMAGES=%GIT_REPO%question_images"

echo Primary Source: %WORKING%
echo Backup Source: %WORKING_OLD%
echo Target: %GIT_IMAGES%
echo.

REM Count files in working folder
dir /b "%WORKING%\question_*.jpg" 2>nul | find /c /v "" > temp_count.txt
set /p COUNT=<temp_count.txt
del temp_count.txt

echo Found %COUNT% images in working folder
echo.

choice /C YN /M "Sync to Git repository"
if errorlevel 2 exit /b 0

echo.
echo Syncing...

REM Copy images
xcopy "%WORKING%\question_*.jpg" "%GIT_IMAGES%\" /Y /Q >nul 2>&1
xcopy "%WORKING%\question_*.png" "%GIT_IMAGES%\" /Y /Q >nul 2>&1
xcopy "%WORKING%\question_*.jpeg" "%GIT_IMAGES%\" /Y /Q >nul 2>&1

echo [OK] Images synced

REM Copy JSON if it exists (check multiple locations, nephro_work is primary)
if exist "%WORKING%\nephro_questions_auto_updated.json" (
    copy /Y "%WORKING%\nephro_questions_auto_updated.json" "%GIT_REPO%nephro_questions_enhanced.json" >nul
    echo [OK] Database synced from nephro_work/question_images
) else if exist "C:\Users\lauar\Documents\nephro_work\nephro_questions_auto_updated.json" (
    copy /Y "C:\Users\lauar\Documents\nephro_work\nephro_questions_auto_updated.json" "%GIT_REPO%nephro_questions_enhanced.json" >nul
    echo [OK] Database synced from nephro_work
) else if exist "%WORKING_OLD%\nephro_questions_auto_updated.json" (
    copy /Y "%WORKING_OLD%\nephro_questions_auto_updated.json" "%GIT_REPO%nephro_questions_enhanced.json" >nul
    echo [OK] Database synced from NEFRO/question_images (backup)
) else if exist "%WORKING_OLD%\..\nephro_questions_auto_updated.json" (
    copy /Y "%WORKING_OLD%\..\nephro_questions_auto_updated.json" "%GIT_REPO%nephro_questions_enhanced.json" >nul
    echo [OK] Database synced from NEFRO/nephro_images (backup)
)

echo.
echo ========================================
echo SYNC COMPLETE
echo ========================================
echo.
echo Next steps:
echo   cd "%GIT_REPO%"
echo   git status
echo   git add question_images/
echo   git add nephro_questions_enhanced.json
echo   git commit -m "Update images"
echo   git push
echo.
pause
