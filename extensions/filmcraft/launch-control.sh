#!/bin/bash
echo "===================================================="
echo "    Launching FilmCraft in MCP AI Control Mode      "
echo "===================================================="

if command -v filmcraft &> /dev/null; then
    filmcraft --control 9876 &
    echo "[SUCCESS] FilmCraft launched on 127.0.0.1:9876"
else
    echo "[INFO] FilmCraft not found in PATH."
    echo "Run: cargo run --release -p filmcraft -- --control 9876"
fi
