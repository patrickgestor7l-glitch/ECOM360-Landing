/* ==========================================================================
   ECOM360 — Backend Google Sheets (Google Apps Script)
   Cole TODO este arquivo em Extensões → Apps Script da planilha.
   Publique como App da Web (ver README §15.1).
   ========================================================================== */

const SHEET_ID   = '1hJtuGJyA5dcaVHlWf2jG-fM6HGHF6I-mpc0353xDIZk';
const SHEET_NAME = 'Leads';
const TOKEN      = 'ecom360_2026_troque_isto'; // troque por uma string aleatória sua (igual à do config.js)

const COLS = [
  'timestamp','nome','whatsapp','whatsapp_e164','event_id',
  'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
  'fbclid','gclid','referrer','page','device','user_agent'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = (e && e.parameter) || {};

    if (p.token !== TOKEN) return json({ ok: false, error: 'unauthorized' });
    if (!p.nome || !p.whatsapp_e164) return json({ ok: false, error: 'missing_fields' });

    const sheet = getSheet_();

    // Deduplicação por telefone: atualiza em vez de duplicar
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const phones = sheet.getRange(2, 4, lastRow - 1, 1).getValues().flat();
      if (phones.indexOf(p.whatsapp_e164) !== -1) return json({ ok: true, dedupe: true });
    }

    const tz  = 'America/Sao_Paulo';
    const now = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm:ss');

    sheet.appendRow([
      now, p.nome, p.whatsapp, p.whatsapp_e164, p.event_id || '',
      p.utm_source || '', p.utm_medium || '', p.utm_campaign || '',
      p.utm_content || '', p.utm_term || '',
      p.fbclid || '', p.gclid || '', p.referrer || '', p.page || '',
      p.device || '', p.user_agent || ''
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet() { return json({ ok: true, ping: 'alive' }); }

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);
    sh.getRange(1, 1, 1, COLS.length)
      .setFontWeight('bold').setBackground('#241C37').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
