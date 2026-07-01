// ============================================================================
// Course Curriculum Portal — Google Apps Script web app
// ============================================================================
// Single doGet serves Index.html as a fully client-side app (no google.script.run).
// setXFrameOptionsMode(ALLOWALL) lets the app be embedded in Google Sites, Drive
// previews, or Cowork.
//
// MAINTENANCE NOTE: the entire app lives in Index.html's inline <script>. Keep it
// free of BACKTICKS/template literals -- the Apps Script IFRAME sandbox silently
// fails to deliver a large inline <script> that contains template literals, which
// produces a blank page. Use double quotes and string concatenation instead.
// Also: never put a raw apostrophe inside a single-quoted JS string.
// ============================================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Course Curriculum Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
