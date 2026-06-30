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
  var template = HtmlService.createTemplateFromFile('Index');
  template.deployUrl = DEPLOY_URL;
  template.modulesParam = (e && e.parameter && e.parameter.modules) ? e.parameter.modules : '';
  template.nameParam = (e && e.parameter && e.parameter.name) ? e.parameter.name : '';

  return template.evaluate()
    .setTitle('Speech Delivery Skills Series')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}