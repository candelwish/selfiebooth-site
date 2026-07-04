/**
 * Iron Session — Workout Tracker
 * GAS Web App entry point
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=no')
    .setTitle('Iron Session')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Phase 2 hook (optional): call from client via google.script.run.saveSession(payload)
 * to persist workout history to a Google Sheet instead of localStorage only.
 * Create a Sheet, paste its ID below, then uncomment the client call.
 */
function saveSession(payload) {
  var SHEET_ID = ''; // paste Sheet ID to enable
  if (!SHEET_ID) return { ok: false, reason: 'no sheet configured' };
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('Sessions') || ss.insertSheet('Sessions');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Date', 'Day', 'Minutes', 'Sets', 'Volume (lbs)', 'Detail JSON']);
  }
  sh.appendRow([
    new Date(), payload.day, payload.minutes,
    payload.sets.length, payload.volume, JSON.stringify(payload.sets)
  ]);
  return { ok: true };
}
