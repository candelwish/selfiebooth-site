// ============================================================================
// Speech Delivery Skills Series — Apps Script Web App
// ============================================================================
//
// DEPLOY_URL is this web app's own /exec URL. It is injected into the page so
// the in-app "share selected modules" links point back at the live app.
// If you ever create a NEW deployment (new URL), update this value and redeploy.
var DEPLOY_URL = "https://script.google.com/macros/s/AKfycbw2xJF-4sgkY6GwLZiCocM-f2vRCJ2Slst_qHeCed76KVS5rnkaUZv_Ci1rqRY8th5x6Q/exec";

function doGet(e) {
  var modules = (e && e.parameter && e.parameter.modules) ? e.parameter.modules : '';
  var name = (e && e.parameter && e.parameter.name) ? e.parameter.name : '';

  // Serve Index.html as static content and inject the three values via a plain
  // string replace. We do NOT use createTemplateFromFile(...).evaluate(): its
  // template engine mangles this large inlined-React file.
  //
  // IMPORTANT (do not reintroduce): the Apps Script IFRAME sandbox silently
  // fails to deliver the app's <script> block if it contains template literals
  // (backticks). Index.html's app code MUST stay transpiled to plain string
  // concatenation (no backticks). If the app is ever re-bundled, run it through
  // @babel/plugin-transform-template-literals before deploying.
  var html = HtmlService.createHtmlOutputFromFile('Index').getContent();
  html = html
    .replace('"<?= deployUrl ?>"', function () { return JSON.stringify(DEPLOY_URL); })
    .replace('"<?= modulesParam ?>"', function () { return JSON.stringify(modules); })
    .replace('"<?= nameParam ?>"', function () { return JSON.stringify(name); });

  return HtmlService.createHtmlOutput(html)
    .setTitle('Speech Delivery Skills Series')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
