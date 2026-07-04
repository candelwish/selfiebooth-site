// ============================================================================
// Building a Fluid Speaker — Course Portal (Apps Script web app)
// ============================================================================
// doGet serves Index.html and injects instructor content-overrides (video
// swaps/toggles, resource-link edits) stored in Script Properties, so content
// changes publish instantly WITHOUT a redeploy.
//
// MAINTENANCE NOTES:
// - Keep Index.html's inline script free of BACKTICKS/template literals: the
//   Apps Script IFRAME sandbox silently fails to deliver large inline scripts
//   containing them (blank page). Use string concatenation only.
// - Never put a raw apostrophe inside a single-quoted JS string.
// - The instructor save code is validated SERVER-SIDE below. To change it,
//   set Script Property INSTRUCTOR_CODE in Project Settings (falls back to
//   the default below if unset).
// ============================================================================

var DEFAULT_INSTRUCTOR_CODE = 'speak2026';
var OVERRIDES_CHUNK = 8000; // Script Properties values are capped at ~9KB

function doGet(e) {
  var html = HtmlService.createHtmlOutputFromFile('Index').getContent();
  var ovr = readOverrides_();
  // <-escape so no '</script' sequence can break the page
  ovr = ovr.replace(/</g, '\\u003c');
  html = html.replace('var OVERRIDES = {};', function () { return 'var OVERRIDES = ' + ovr + ';'; });
  return HtmlService.createHtmlOutput(html)
    .setTitle('Building a Fluid Speaker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Reassemble the overrides JSON from chunked Script Properties.
function readOverrides_() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty('OVR_COUNT') || 0);
  if (!n) { return '{}'; }
  var out = '';
  for (var i = 0; i < n; i++) { out += props.getProperty('OVR_' + i) || ''; }
  if (!out) { return '{}'; }
  try { JSON.parse(out); } catch (err) { return '{}'; }
  return out;
}

// Called from the page via google.script.run. Validates the instructor code
// server-side (students never see this file), then persists the overrides.
function saveOverrides(payload, code) {
  var props = PropertiesService.getScriptProperties();
  var expected = props.getProperty('INSTRUCTOR_CODE') || DEFAULT_INSTRUCTOR_CODE;
  if (String(code) !== expected) { return { ok: false, err: 'Incorrect instructor code.' }; }

  var obj;
  try { obj = JSON.parse(payload); } catch (err) { return { ok: false, err: 'Invalid data.' }; }
  var clean = JSON.stringify(obj);
  if (clean.length > 300000) { return { ok: false, err: 'Overrides too large.' }; }

  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) { return { ok: false, err: 'Busy — try again.' }; }
  try {
    var old = Number(props.getProperty('OVR_COUNT') || 0);
    for (var i = 0; i < old; i++) { props.deleteProperty('OVR_' + i); }
    var count = 0;
    for (var j = 0; j < clean.length; j += OVERRIDES_CHUNK) {
      props.setProperty('OVR_' + count, clean.slice(j, j + OVERRIDES_CHUNK));
      count++;
    }
    props.setProperty('OVR_COUNT', String(count));
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}
