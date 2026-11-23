/**
 * "Ask BIRC" activity log: appends one row per chatbot question to this Google Sheet.
 *
 * Setup (see _chatbot/README.md, "Activity log"):
 *   1. In the Sheet: Extensions -> Apps Script, replace the code with this file, save.
 *   2. Project Settings -> Script Properties -> add LOG_TOKEN = <a long random string>.
 *   3. Deploy -> New deployment -> Web app; Execute as: Me; Who has access: Anyone.
 *   4. Put the web-app URL and the same token in Render as LOG_WEBHOOK_URL and LOG_TOKEN.
 *
 * "Anyone" only means anyone can call the URL; rows are written only when the
 * request carries the right LOG_TOKEN. The Sheet itself stays private to you.
 */

var SHEET_NAME = "Log";
var COLUMNS = [
  "time", "conversation", "turn", "visitor", "page", "question", "answer", "status",
  "model", "seconds", "input_tokens", "cache_read_tokens", "cache_write_tokens", "output_tokens",
];
var MAX_CELL = 49000; // Google Sheets limit is 50,000 characters per cell

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad json" });
  }
  var token = PropertiesService.getScriptProperties().getProperty("LOG_TOKEN");
  if (!token || data.token !== token) return reply({ ok: false, error: "unauthorized" });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    var row = COLUMNS.map(function (c) {
      var v = data[c] === undefined || data[c] === null ? "" : data[c];
      if (c === "time" && v) return new Date(v); // shown in the Sheet's time zone
      if (typeof v === "string") {
        if (/^[=+\-@]/.test(v)) v = "'" + v; // never let visitor text become a formula
        if (v.length > MAX_CELL) v = v.slice(0, MAX_CELL) + " …";
      }
      return v;
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm:ss");
    sheet.getRange("F:G").setWrap(true);
    sheet.setColumnWidth(6, 300);
    sheet.setColumnWidth(7, 450);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
