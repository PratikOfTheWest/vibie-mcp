/**
 * Vibie Premiere Pro Embedded Bridge Server
 * Runs inside the Adobe Premiere Pro CEP Node.js runtime.
 * Listens on 127.0.0.1:9877 for MCP commands and calls ExtendScript.
 */

const http = require("http");
const PORT = 9877;
const HOST = "127.0.0.1";

const cs = new CSInterface();
let requestCount = 0;

function startBridge(onStatusUpdate) {
  const server = http.createServer((req, res) => {
    // CORS headers for local security
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === "/health" || req.url === "/ping") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "online", host: "premiere_pro", requestsHandled: requestCount }));
      return;
    }

    if (req.method === "POST" && req.url === "/execute") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const payload = JSON.parse(body);
          const command = payload.command;
          const params = payload.params || {};

          requestCount++;
          if (onStatusUpdate) onStatusUpdate(`Executing: ${command} (#${requestCount})`);

          // Call ExtendScript function inside Premiere
          const scriptCall = `$._vibie.dispatch("${command}", '${JSON.stringify(params).replace(/'/g, "\\'")}')`;

          cs.evalScript(scriptCall, (resultStr) => {
            let parsedResult;
            try {
              parsedResult = JSON.parse(resultStr);
            } catch (e) {
              parsedResult = { raw: resultStr };
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, result: parsedResult }));
          });
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  });

  server.listen(PORT, HOST, () => {
    if (onStatusUpdate) onStatusUpdate(`Bridge online: 127.0.0.1:${PORT}`);
  });

  server.on("error", (err) => {
    if (onStatusUpdate) onStatusUpdate(`Bridge Error: ${err.message}`);
  });

  return server;
}
