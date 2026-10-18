/**
 * Minimal CSInterface library for Adobe CEP Panel
 */
function CSInterface() {}

CSInterface.prototype.evalScript = function(script, callback) {
  if (window.__adobe_cep__) {
    window.__adobe_cep__.evalScript(script, callback || function() {});
  } else {
    if (callback) callback("EvalScript mock: not running in Adobe CEP environment");
  }
};

CSInterface.prototype.getHostEnvironment = function() {
  if (window.__adobe_cep__) {
    return JSON.parse(window.__adobe_cep__.getHostEnvironment());
  }
  return { appName: "PPRO", appVersion: "26.0" };
};
