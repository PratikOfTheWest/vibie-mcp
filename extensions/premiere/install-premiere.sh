#!/bin/bash
echo "===================================================="
echo "     Installing Vibie MCP Bridge for Premiere Pro   "
echo "===================================================="

TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.vibie.mcp.bridge"

echo "[1/3] Enabling PlayerDebugMode in macOS defaults..."
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1

echo "[2/3] Creating CEP directory..."
mkdir -p "$TARGET_DIR"

echo "[3/3] Copying extension files..."
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$DIR/CSXS" "$TARGET_DIR/"
cp -R "$DIR/client" "$TARGET_DIR/"
cp -R "$DIR/host" "$TARGET_DIR/"

echo ""
echo "===================================================="
echo "[SUCCESS] Installed Vibie Bridge for Premiere Pro!"
echo "Open Premiere Pro > Window > Extensions > Vibie MCP Bridge"
echo "===================================================="
