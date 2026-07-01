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
    return probePage(e.parameter);
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
function probePage(params) {
  var which = params.probe;
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

  if (which === 'appnourl') {
    // The full app, but with the 3 https URLs in the app block neutralized.
    // If THIS renders the "Choose Your Modules" screen, then one of those URL
    // strings is what breaks Google's sandbox serializer, and we fix the source.
    var h = HtmlService.createHtmlOutputFromFile('Index').getContent();
    h = h
      .replace('"<?= deployUrl ?>"', function () { return JSON.stringify(DEPLOY_URL); })
      .replace('"<?= modulesParam ?>"', function () { return '""'; })
      .replace('"<?= nameParam ?>"', function () { return '""'; });
    h = h.split('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=JetBrains+Mono:wght@400;500;600&display=swap').join('about:blank');
    h = h.split('https://www.youtube.com/embed/').join('https-x-//www.youtube.com/embed/');
    h = h.split('https://www.youtube.com/watch?v=').join('https-x-//www.youtube.com/watch?v=');
    return HtmlService.createHtmlOutput(h).setTitle('probe appnourl')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (which === 'sizetest') {
    // Deliver blocks 0+1+2 PLUS a duplicate of the 132 KB ReactDOM block, so the
    // total inline script (~275 KB) EXCEEDS the full app, but with ZERO app
    // content -- only known-good library code. If this is blank, the failure is
    // purely the SIZE of inline script (fix: load React from a CDN to shrink it).
    // If it renders "React=...", size is fine and the app block's content is the
    // real cause (then use ?probe=slice to bisect it).
    var big = scripts[0] + scripts[1] + scripts[2] + scripts[2];
    var check2 = '<script>try{document.getElementById("o").textContent='
      + '"delivered OK; React="+(typeof React!=="undefined"?React.version:"MISSING");}'
      + 'catch(err){document.getElementById("o").textContent="ERR "+err;}<\/script>';
    return HtmlService.createHtmlOutput(
      head + '<h1>Probe: sizetest (~275 KB of pure library script)</h1>'
      + '<div id="o" style="font-weight:bold">running...</div>' + big + check2 + tail
    ).setTitle('probe sizetest');
  }

  if (which === 'slice') {
    // Deliver blocks 0+1+2 + a byte-slice [from%,to%] of the app block's inner
    // JS (wrapped in its own <script>). Blank => the culprit bytes are in this
    // slice. Rendered (#o shows the byte count) => this slice delivers fine.
    // Binary-search using ?probe=slice&from=<pct>&to=<pct>.
    var libs2 = scripts[0] + scripts[1] + scripts[2];
    var appInner = scripts[scripts.length - 1]
      .replace(/^<script>/, '').replace(/<\/script>\s*$/, '');
    var from = params.from ? parseInt(params.from, 10) : 0;
    var to = params.to ? parseInt(params.to, 10) : 100;
    var a = Math.floor(appInner.length * from / 100);
    var b = Math.floor(appInner.length * to / 100);
    var slice = appInner.substring(a, b);
    return HtmlService.createHtmlOutput(
      head + '<h1>Probe: slice ' + from + '%-' + to + '% (' + (b - a) + ' bytes)</h1>'
      + '<div id="o" style="font-weight:bold">running...</div>'
      + libs2
      + '<script>' + slice + '<\/script>'
      + '<script>document.getElementById("o").textContent="slice delivered OK ('
      + (b - a) + ' bytes)";<\/script>'
      + tail
    ).setTitle('probe slice ' + from + '-' + to);
  }

  if (which === 'b64') {
    // Cause-agnostic fix test: replace the app <script> block with a base64
    // payload (pure A-Za-z0-9+/=, none of the sequences that break Google's
    // sandbox serializer) plus a tiny loader that decodes it and injects a real
    // <script> at runtime. If this renders "Choose Your Modules", we make it
    // permanent. Library blocks (0,1,2) stay as normal inline scripts.
    var full = HtmlService.createHtmlOutputFromFile('Index').getContent();
    full = full
      .replace('"<?= deployUrl ?>"', function () { return JSON.stringify(DEPLOY_URL); })
      .replace('"<?= modulesParam ?>"', function () { return '""'; })
      .replace('"<?= nameParam ?>"', function () { return '""'; });
    var appBlock = full.match(/<script>[\s\S]*?<\/script>/g).pop();
    var appInner = appBlock.replace(/^<script>/, '').replace(/<\/script>\s*$/, '');
    var b64 = Utilities.base64Encode(appInner, Utilities.Charset.UTF_8);
    var loader = '<script id="__appsrc" type="text/plain">' + b64 + '<\/script>'
      + '<script>(function(){try{var b=document.getElementById("__appsrc").textContent;'
      + 'var code=decodeURIComponent(escape(atob(b)));'
      + 'var s=document.createElement("script");s.text=code;'
      + 'document.body.appendChild(s);}catch(err){'
      + 'document.body.insertAdjacentHTML("beforeend","<pre>loader error: "+err+"</pre>");}})();<\/script>';
    var page = full.replace(appBlock, loader);
    return HtmlService.createHtmlOutput(page)
      .setTitle('Speech Delivery Skills Series')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return HtmlService.createHtmlOutput(head + '<p>unknown probe: ' + which + '</p>' + tail)
    .setTitle('probe');
}
