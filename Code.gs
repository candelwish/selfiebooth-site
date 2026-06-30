/**
 * Speech Delivery Skills Series — Apps Script web app entry point.
 * Serves Index.html when the web app URL is requested.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Speech Delivery Skills Series')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
