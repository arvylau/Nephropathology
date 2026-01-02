@echo off
echo ========================================
echo Sync nephro_work to Git Repository
echo ========================================
echo.

set "WORKING=C:\Users\lauar\Documents\nephro_work"
set "GIT_REPO=%~dp0"

echo Source: %WORKING%
echo Target: %GIT_REPO%
echo.

REM Count files in working folder
dir /b "%WORKING%\question_images\question_*.jpg" 2>nul | find /c /v "" > temp_count.txt
set /p COUNT=<temp_count.txt
del temp_count.txt

echo Found %COUNT% images in working folder
echo.

choice /C YN /M "Sync to Git repository"
if errorlevel 2 exit /b 0

echo.
echo Syncing...
echo.

REM Copy images
xcopy "%WORKING%\question_images\question_*.jpg" "%GIT_REPO%question_images\" /Y /Q >nul 2>&1
xcopy "%WORKING%\question_images\question_*.png" "%GIT_REPO%question_images\" /Y /Q >nul 2>&1
xcopy "%WORKING%\question_images\question_*.jpeg" "%GIT_REPO%question_images\" /Y /Q >nul 2>&1
echo [OK] Images synced

REM Copy main JSON database
if exist "%WORKING%\nephro_questions_enhanced.json" (
    copy /Y "%WORKING%\nephro_questions_enhanced.json" "%GIT_REPO%nephro_questions_enhanced.json" >nul
    echo [OK] Main database synced (nephro_questions_enhanced.json)
) else (
    echo [WARNING] Main database not found in nephro_work
)

REM Copy portal files (HTML and JS)
if exist "%WORKING%\instructor_portal_editable.html" (
    copy /Y "%WORKING%\instructor_portal_editable.html" "%GIT_REPO%instructor_portal_editable.html" >nul
    copy /Y "%WORKING%\instructor_portal_editable.js" "%GIT_REPO%instructor_portal_editable.js" >nul
    echo [OK] Instructor portal files synced
)

if exist "%WORKING%\image_management_portal.html" (
    copy /Y "%WORKING%\image_management_portal.html" "%GIT_REPO%image_management_portal.html" >nul
    copy /Y "%WORKING%\image_management_portal.js" "%GIT_REPO%image_management_portal.js" >nul
    echo [OK] Image portal files synced
)

if exist "%WORKING%\student_portal_bilingual.html" (
    copy /Y "%WORKING%\student_portal_bilingual.html" "%GIT_REPO%student_portal_bilingual.html" >nul
    copy /Y "%WORKING%\student_portal_bilingual.js" "%GIT_REPO%student_portal_bilingual.js" >nul
    echo [OK] Student portal files synced
)

echo.
echo ========================================
echo SYNC COMPLETE
echo ========================================
echo.
echo Files synced:
echo   - Images (question_images/*.jpg/png/jpeg)
echo   - Database (nephro_questions_enhanced.json with question_settings)
echo   - Instructor portal (instructor_portal_editable.html/js)
echo   - Image portal (image_management_portal.html/js)
echo   - Student portal (student_portal_bilingual.html/js)
echo.
echo Next steps to commit to Git:
echo   cd "%GIT_REPO%"
echo   git status
echo   git add .
echo   git commit -m "Update portals with modality filters and persistent settings"
echo   git push
echo.
pause
