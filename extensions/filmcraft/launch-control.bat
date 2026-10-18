@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo     Launching FilmCraft in MCP AI Control Mode
echo ====================================================

set FILMCRAFT_BIN=

:: 1. Check Standard Installer Location (C:\Program Files\FilmCraft)
if exist "%ProgramFiles%\FilmCraft\filmcraft.exe" (
    set "FILMCRAFT_BIN=%ProgramFiles%\FilmCraft\filmcraft.exe"
    goto found
)

:: 2. Check 64-bit Program Files if on 64-bit Windows
if defined ProgramW6432 (
    if exist "%ProgramW6432%\FilmCraft\filmcraft.exe" (
        set "FILMCRAFT_BIN=%ProgramW6432%\FilmCraft\filmcraft.exe"
        goto found
    )
)

:: 3. Check Local AppData Programs
if exist "%LOCALAPPDATA%\Programs\FilmCraft\filmcraft.exe" (
    set "FILMCRAFT_BIN=%LOCALAPPDATA%\Programs\FilmCraft\filmcraft.exe"
    goto found
)

:: 4. Check 32-bit Program Files
if exist "%ProgramFiles(x86)%\FilmCraft\filmcraft.exe" (
    set "FILMCRAFT_BIN=%ProgramFiles(x86)%\FilmCraft\filmcraft.exe"
    goto found
)

:: 5. Check System PATH
where filmcraft >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "delims=" %%i in ('where filmcraft') do (
        set "FILMCRAFT_BIN=%%i"
        goto found
    )
)

:: 6. Check Local Cargo Builds
if exist "target\release\filmcraft.exe" (
    set "FILMCRAFT_BIN=target\release\filmcraft.exe"
    goto found
)

echo [ERROR] Could not automatically locate filmcraft.exe!
echo Checked locations:
echo   - %ProgramFiles%\FilmCraft\filmcraft.exe
echo   - %LOCALAPPDATA%\Programs\FilmCraft\filmcraft.exe
echo   - System PATH
echo.
echo Please run FilmCraft manually with:
echo   "path\to\filmcraft.exe" --control 9876
pause
exit /b 1

:found
echo [FOUND] FilmCraft executable at: "!FILMCRAFT_BIN!"
echo [STARTING] Opening FilmCraft with '--control 9876'...
start "" "!FILMCRAFT_BIN!" --control 9876

echo.
echo ====================================================
echo [SUCCESS] FilmCraft launched in AI Control Mode!
echo Control socket listening on 127.0.0.1:9876
echo Vibie MCP can now connect and automate your timeline.
echo ====================================================
timeout /t 3 >nul
