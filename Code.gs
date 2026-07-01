// ============================================================================
// Speech Delivery Skills Series — Apps Script Web App
// ============================================================================
//
// SETUP (one-time):
//   1. Deploy ▸ New deployment ▸ select type "Web app".
//      - Execute as: Me
//      - Who has access: Anyone within [your school domain]  (or "Anyone" if
//        you want it usable outside school accounts too — your call)
//      Click Deploy, then authorize when prompted.
//   2. Copy the Web app URL Google shows you (it ends in /exec).
//   3. Paste that URL into DEPLOY_URL below, replacing the placeholder text.
//   4. Save this file (Ctrl/Cmd+S).
//   5. Deploy ▸ Manage deployments ▸ click the pencil (edit) icon on your
//      deployment ▸ Version: "New version" ▸ Deploy.
//      (This updates the live app's code WITHOUT changing its URL — students'
//      saved links keep working.)
//
// After that, open the Web app URL — you'll land on the "Choose Your
// Modules" screen. Anytime you change the lesson content and re-bundle the
// app, just repeat step 5 to push the update live.
// ============================================================================

var DEPLOY_URL = "https://script.google.com/macros/s/AKfycbx-OQozJRFZy_L_H9nf2hSegyjmdk4gIdy2kBFhdCxwp6av6qKfUDJA3JfkPTYcK6EMlQ/exec";

function doGet(e) {
  // Diagnostic route: open the web app URL with ?test=1 to serve a trivial
  // static page (no template, no React). If THIS is blank too, the problem is
  // the environment (browser extensions, account/domain policy), not the app.
  if (e && e.parameter && e.parameter.test) {
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><base target="_top">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
      '<body style="font-family:sans-serif;padding:40px;line-height:1.5">' +
      '<h1>✅ Hello — Apps Script is working</h1>' +
      '<p>If you can read this, the deployment, your browser, and your account ' +
      'can all run this web app. The blank page on the main app would then be ' +
      'inside the app rendering, not the environment.</p>' +
      '<p>If this page is <b>also blank</b>, the problem is your browser ' +
      '(extensions) or your Google Workspace domain policy — not the code.</p>' +
      '</body></html>'
    ).setTitle('Apps Script test');
  }

  // Diagnostic probes: ?probe=bigplain | libs  — isolate what breaks the sandbox.
  if (e && e.parameter && e.parameter.probe) {
    return probePage(e.parameter.probe);
  }

  var modules = (e && e.parameter && e.parameter.modules) ? e.parameter.modules : '';
  var name = (e && e.parameter && e.parameter.name) ? e.parameter.name : '';

  // IMPORTANT: We deliberately do NOT use createTemplateFromFile(...).evaluate().
  // Apps Script's template engine mangles this large file (with inlined React)
  // during evaluation and emits broken JS -> blank page with a syntax error.
  // Instead we read Index.html as static content and do safe string replacement
  // for the three injected values, then serve it via createHtmlOutput (the same
  // path the ?test=1 page uses successfully). JSON.stringify provides correct
  // JS-string quoting/escaping; the function form avoids '$' being treated as a
  // replacement pattern.
  var html = HtmlService.createHtmlOutputFromFile('Index').getContent();
  html = html
    .replace('"<?= deployUrl ?>"', function () { return JSON.stringify(DEPLOY_URL); })
    .replace('"<?= modulesParam ?>"', function () { return JSON.stringify(modules); })
    .replace('"<?= nameParam ?>"', function () { return JSON.stringify(name); });

  return HtmlService.createHtmlOutput(html)
    .setTitle('Speech Delivery Skills Series')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Diagnostic probe pages to isolate what breaks Google's sandbox content writer.
function probePage(which) {
  var head = '<!DOCTYPE html><html><head><base target="_top">'
           + '<meta name="viewport" content="width=device-width, initial-scale=1"></head>'
           + '<body style="font-family:sans-serif;padding:24px;line-height:1.5">';
  var tail = '</body></html>';

  if (which === 'bigplain') {
    // ~250 KB of plain HTML: no scripts, no https URLs, no long lines.
    // If this renders, large static payloads are fine and size is not the cause.
    var s = '';
    for (var i = 0; i < 5000; i++) {
      s += '<p>Line ' + i + ' - filler text to reach a large payload size.</p>';
    }
    return HtmlService.createHtmlOutput(
      head + '<h1>Probe: bigplain</h1><p>If you can see many numbered lines below, '
      + 'large static payloads work fine.</p>' + s + tail
    ).setTitle('probe bigplain');
  }

  var content = HtmlService.createHtmlOutputFromFile('Index').getContent();
  var scripts = content.match(/<script>[\s\S]*?<\/script>/g) || [];

  if (which === 'libs') {
    // Everything EXCEPT the final (app) script block: globals + React + ReactDOM,
    // then a status check. If this renders "React=... ReactDOM=ok", the inlined
    // libraries deliver fine and the app block is the culprit. If it is blank,
    // the library blocks (huge minified lines) break the sandbox writer.
    var libs = '';
    for (var j = 0; j < scripts.length - 1; j++) { libs += scripts[j] + '\n'; }
    var check = '<script>try{document.getElementById("o").textContent='
      + '"React="+(typeof React!=="undefined"?React.version:"MISSING")+'
      + '" ReactDOM="+(typeof ReactDOM!=="undefined"?"ok":"MISSING");}'
      + 'catch(err){document.getElementById("o").textContent="ERR "+err;}<\/script>';
    return HtmlService.createHtmlOutput(
      head + '<h1>Probe: libs (' + scripts.length + ' script blocks found)</h1>'
      + '<div id="o" style="font-weight:bold">running...</div>' + libs + check + tail
    ).setTitle('probe libs');
  }

  return HtmlService.createHtmlOutput(head + '<p>unknown probe: ' + which + '</p>' + tail)
    .setTitle('probe');
}
