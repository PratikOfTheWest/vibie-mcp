@echo off
echo ====================================================
echo      Installing Vibie MCP Bridge for Premiere Pro
echo ====================================================

set TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.vibie.mcp.bridge

echo [1/3] Enabling Developer Mode in Windows Registry...
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo [2/3] Creating CEP extensions folder...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [3/3] Copying Vibie extension files...
xcopy /E /I /Y "%~dp0CSXS" "%TARGET_DIR%\CSXS"
xcopy /E /I /Y "%~dp0client" "%TARGET_DIR%\client"
xcopy /E /I /Y "%~dp0host" "%TARGET_DIR%\host"

echo.
echo ====================================================
echo [SUCCESS] Vibie MCP Bridge installed successfully!
echo To open in Adobe Premiere Pro:
echo   1. Launch Premiere Pro
echo   2. Go to: Window ^> Extensions ^> Vibie MCP Bridge
echo ====================================================
pause
