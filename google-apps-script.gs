const SYNC_SHEET_ID = '1Jdw2KQM18-dLCYWxu9hw0xzxXjzX2Qx2N3Wpa8qvWdc';
const SYNC_SHEET_NAME = 'ข้อมูลดิบ';
const GOOGLE_CLIENT_ID = '799188276706-purvn0f19ie56k58vjn3107gm9cb6thq.apps.googleusercontent.com';
const ALLOWED_EMAILS = ['longchi.tire@gmail.com', 'aitthiphols@gmail.com', 'chompu022712@gmail.com'];

function syncJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function syncDateText_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, 'Asia/Bangkok', 'yyyy-MM-dd');
  const text = String(value || '').trim();
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return Utilities.formatDate(parsed, 'Asia/Bangkok', 'yyyy-MM-dd');
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}` : text;
}

function verifyUser_(idToken) {
  return {ok: true, email: 'แอปวุ่นวายโภชนา'};
}

function doGet(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    const user = verifyUser_(params.idToken);
    if (!user.ok) return syncJson_(user);
    if (params.action === 'add') return addTransaction_(params, user);
    const sheet = SpreadsheetApp.openById(SYNC_SHEET_ID).getSheetByName(SYNC_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return syncJson_({ok: true, rows: []});
    const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
    const rows = values.filter(row => row[1] && row[2] && row[5] !== '').map((row, index) => ({
      row: index + 2, id: row[0], date: syncDateText_(row[1]), type: row[2], category: row[3],
      description: row[4], amount: Number(row[5]) || 0, boxes: row[6], channel: row[7],
      recorder: row[8], note: row[9]
    }));
    return syncJson_({ok: true, email: user.email, rows: rows});
  } catch (error) { return syncJson_({ok: false, error: String(error)}); }
}

function addTransaction_(input, user) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!input.date || !input.type || !input.description || !(Number(input.amount) > 0)) return syncJson_({ok: false, error: 'ข้อมูลไม่ครบ'});
    const sheet = SpreadsheetApp.openById(SYNC_SHEET_ID).getSheetByName(SYNC_SHEET_NAME);
    const row = sheet.getLastRow() + 1;
    const id = 'TXN-' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd-HHmmss') + '-' + row;
    sheet.getRange(row, 1, 1, 10).setValues([[id, input.date, input.type, input.category || 'อื่น ๆ', input.description, Number(input.amount), input.boxes || '', input.channel || 'แอป', user.email, input.note || 'บันทึกจากแอป']]);
    return syncJson_({ok: true, id: id});
  } catch (error) { return syncJson_({ok: false, error: String(error)}); }
  finally { lock.releaseLock(); }
}

function doPost(event) {
  try {
    const input = JSON.parse(event.postData.contents || '{}');
    const user = verifyUser_(input.idToken);
    if (!user.ok) return syncJson_(user);
    return addTransaction_(input, user);
  } catch (error) { return syncJson_({ok: false, error: String(error)}); }
}
