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

  var template = HtmlService.createTemplateFromFile('Index');
  template.deployUrl = DEPLOY_URL;
  template.modulesParam = (e && e.parameter && e.parameter.modules) ? e.parameter.modules : '';
  template.nameParam = (e && e.parameter && e.parameter.name) ? e.parameter.name : '';

  return template.evaluate()
    .setTitle('Speech Delivery Skills Series')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
