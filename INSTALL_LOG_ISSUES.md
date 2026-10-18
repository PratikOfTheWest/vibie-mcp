# Installation & Setup Log: Vibie MCP
**Environment:** Windows 10
**Target NLE:** FilmCraft (Installed via Installer)

## Summary of Issues Encountered

### 1. Package Name Ambiguity
During the initial discovery phase, multiple MCP servers named `vibie-mcp` were found (e.g., one by `shdomi8599` and one by `PratikOfTheWest`). This led to an initial incorrect installation. Clearer naming or a more prominent official registry entry would help users avoid installing the wrong bridge.

### 2. `launch-control.bat` Path Limitations
The provided `launch-control.bat` failed to detect the FilmCraft installation. 

**Current Logic in `launch-control.bat`:**
- Checks if `filmcraft` is in the system `PATH`.
- Checks for `target\release\filmcraft.exe` (assuming a local Cargo build).

**The Gap:**
The user had installed FilmCraft via the official installer, placing the binary in `C:\Program Files\FilmCraft\filmcraft.exe`. The batch script does not check common installation directories, resulting in a "command not found" error even though the app was installed.

### 3. "Running vs. Controlled" State
The user had FilmCraft open, but the MCP server could not connect. This is because the app was launched normally without the `--control 9876` flag. 

**Observation:**
There is currently no mechanism within the MCP server (or the bridge) to notify the user that *"FilmCraft is running, but not in Control Mode."* The connection simply fails, which can be confusing for users who believe "having the app open" is sufficient.

## Resolution Path Taken
1. Manually located the executable at `C:\Program Files\FilmCraft\filmcraft.exe`.
2. Manually executed the command: `"C:\Program Files\FilmCraft\filmcraft.exe" --control 9876`.
3. Verified connectivity via `netstat -ano | grep 9876`.

## Suggestions for Improvement
- **Update `launch-control.bat`**: Add checks for `C:\Program Files\FilmCraft\filmcraft.exe` and `%LocalAppData%\Programs\FilmCraft\filmcraft.exe`.
- **Enhanced Error Messaging**: If a connection to `127.0.0.1:9876` fails, the MCP server could check if the `filmcraft.exe` process is running at all. If it is, the error message should explicitly state: *"FilmCraft is running, but you must restart it with the `--control 9876` flag to enable AI automation."*
