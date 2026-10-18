@echo off
echo ====================================================
echo     Launching FilmCraft in MCP AI Control Mode
echo ====================================================

where filmcraft >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [NOTICE] 'filmcraft' command not found in PATH.
    echo Looking for cargo build or installed binary...
    if exist "target\release\filmcraft.exe" (
        start "" "target\release\filmcraft.exe" --control 9876
        goto started
    )
    echo Please make sure FilmCraft is installed or run:
    echo   cargo run --release -p filmcraft -- --control 9876
    pause
    exit /b 1
)

start "" filmcraft --control 9876

:started
echo [SUCCESS] FilmCraft launched with control server on 127.0.0.1:9876
echo Vibie MCP can now connect and automate your timeline!
timeout /t 3 >nul
