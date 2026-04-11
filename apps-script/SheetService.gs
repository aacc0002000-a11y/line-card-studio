/**
 * 取得 Script Properties，集中保管系統設定值。
 */
function getScriptProperties_() {
  return PropertiesService.getScriptProperties();
}

/**
 * 取得目前可用的 Spreadsheet ID。
 * 若 Config.gs 尚未填正式值，會改讀 Script Properties。
 */
function getSpreadsheetId_() {
  return CMS_CONFIG.SHEET_ID || getScriptProperties_().getProperty(CMS_CONFIG.PROPERTY_KEYS.SPREADSHEET_ID) || '';
}

/**
 * 將 Spreadsheet ID 存回 Script Properties。
 * 這樣 standalone Apps Script 第一次初始化後，就能記住資料表位置。
 */
function setSpreadsheetId_(spreadsheetId) {
  if (!spreadsheetId) {
    return;
  }

  getScriptProperties_().setProperty(
    CMS_CONFIG.PROPERTY_KEYS.SPREADSHEET_ID,
    spreadsheetId
  );
}

/**
 * 開啟既有 Spreadsheet。
 * 若尚未建立資料表，先回傳 null，讓初始化流程自行建立。
 */
function openSpreadsheet_() {
  var spreadsheetId = getSpreadsheetId_();

  if (!spreadsheetId) {
    return null;
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * 確保系統一定有可用的 Spreadsheet。
 * 若還沒有，就自動建立一份新的資料表。
 */
function ensureSpreadsheet_() {
  var spreadsheet = openSpreadsheet_();

  if (spreadsheet) {
    return spreadsheet;
  }

  spreadsheet = SpreadsheetApp.create('LINE Card CMS Data');
  setSpreadsheetId_(spreadsheet.getId());

  var sheets = spreadsheet.getSheets();

  if (sheets.length === 1) {
    sheets[0].setName(CMS_CONFIG.SHEETS.CARD_SETTINGS);
  }

  return spreadsheet;
}

/**
 * 取得指定工作表，若不存在就建立。
 * 同時會補上標題列，避免欄位順序失真。
 */
function getOrCreateSheet_(sheetName, headers) {
  var spreadsheet = ensureSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  ensureHeaderRow_(sheet, headers || []);

  return sheet;
}

/**
 * 確保工作表第一列就是系統定義的欄位名稱。
 */
function ensureHeaderRow_(sheet, headers) {
  if (!headers || !headers.length) {
    return;
  }

  var currentHeader = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var shouldWriteHeader = sheet.getLastRow() === 0;

  if (!shouldWriteHeader) {
    shouldWriteHeader = currentHeader.join('|') !== headers.join('|');
  }

  if (shouldWriteHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

/**
 * 初始化全部 schema。
 * 會建立 card_settings、card_buttons、card_assets、sys_config 四張表。
 */
function initializeSheetSchema() {
  var spreadsheet = ensureSpreadsheet_();

  getOrCreateSheet_(
    CMS_CONFIG.SHEETS.CARD_SETTINGS,
    CMS_CONFIG.HEADERS.CARD_SETTINGS
  );
  getOrCreateSheet_(
    CMS_CONFIG.SHEETS.CARD_BUTTONS,
    CMS_CONFIG.HEADERS.CARD_BUTTONS
  );
  getOrCreateSheet_(
    CMS_CONFIG.SHEETS.CARD_ASSETS,
    CMS_CONFIG.HEADERS.CARD_ASSETS
  );
  getOrCreateSheet_(CMS_CONFIG.SHEETS.SYS_CONFIG, CMS_CONFIG.HEADERS.SYS_CONFIG);

  setSystemConfig_('spreadsheet_id', spreadsheet.getId());
  setSystemConfig_('schema_initialized_at', new Date().toISOString());

  return {
    ok: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    sheetNames: [
      CMS_CONFIG.SHEETS.CARD_SETTINGS,
      CMS_CONFIG.SHEETS.CARD_BUTTONS,
      CMS_CONFIG.SHEETS.CARD_ASSETS,
      CMS_CONFIG.SHEETS.SYS_CONFIG
    ]
  };
}

/**
 * 將工作表資料轉成物件陣列，讓後續 API 更容易處理。
 */
function getSheetRecords_(sheetName) {
  var headers = getSheetHeaders_(sheetName);
  var sheet = getOrCreateSheet_(sheetName, headers);
  var lastRow = sheet.getLastRow();
  var lastColumn = headers.length;
  var records = [];

  if (lastRow <= 1) {
    return records;
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  var rowIndex;
  var columnIndex;

  for (rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
    var record = {};

    for (columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      record[headers[columnIndex]] = values[rowIndex][columnIndex];
    }

    records.push(record);
  }

  return records;
}

/**
 * 將 default / default-card 視為同一張卡，避免舊資料殘留成兩份。
 */
function getCardIdCandidates_(cardId) {
  var targetCardId = String(cardId || CMS_CONFIG.DEFAULT_CARD_ID);
  var candidates = [targetCardId];

  if (
    CMS_CONFIG.LEGACY_DEFAULT_CARD_ID &&
    targetCardId === CMS_CONFIG.DEFAULT_CARD_ID &&
    CMS_CONFIG.LEGACY_DEFAULT_CARD_ID !== targetCardId
  ) {
    candidates.push(CMS_CONFIG.LEGACY_DEFAULT_CARD_ID);
  }

  if (
    CMS_CONFIG.LEGACY_DEFAULT_CARD_ID &&
    targetCardId === CMS_CONFIG.LEGACY_DEFAULT_CARD_ID &&
    CMS_CONFIG.DEFAULT_CARD_ID !== targetCardId
  ) {
    candidates.push(CMS_CONFIG.DEFAULT_CARD_ID);
  }

  return candidates;
}

/**
 * 依照卡片 ID 更新或新增單筆設定資料。
 */
function upsertCardSettings_(record) {
  var headers = CMS_CONFIG.HEADERS.CARD_SETTINGS;
  var sheet = getOrCreateSheet_(
    CMS_CONFIG.SHEETS.CARD_SETTINGS,
    CMS_CONFIG.HEADERS.CARD_SETTINGS
  );
  var records = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_SETTINGS);
  var targetRow = findRecordRowNumberByCandidates_(
    records,
    'card_id',
    getCardIdCandidates_(record.card_id)
  );
  var rowValues = buildRowValues_(headers, record);

  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * 以整批覆蓋方式更新按鈕資料。
 * 同一卡片只保留最新的一組按鈕，避免殘留舊資料。
 */
function replaceCardButtons_(cardId, buttons) {
  var headers = CMS_CONFIG.HEADERS.CARD_BUTTONS;
  var sheet = getOrCreateSheet_(
    CMS_CONFIG.SHEETS.CARD_BUTTONS,
    CMS_CONFIG.HEADERS.CARD_BUTTONS
  );
  var allRecords = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_BUTTONS);
  var cardIdCandidates = getCardIdCandidates_(cardId);
  var rowsToKeep = [];
  var index;

  for (index = 0; index < allRecords.length; index += 1) {
    if (!includesValue_(cardIdCandidates, allRecords[index].cardId)) {
      rowsToKeep.push(allRecords[index]);
    }
  }

  clearSheetBody_(sheet, headers.length);

  var rowsToWrite = rowsToKeep.concat(buttons || []);

  if (rowsToWrite.length) {
    writeRecordsToSheet_(sheet, headers, rowsToWrite);
  }
}

/**
 * 以整批覆蓋方式更新資產資料。
 * 第一版只先保存 photo_url 對應資料。
 */
function replaceCardAssets_(cardId, assets) {
  var headers = CMS_CONFIG.HEADERS.CARD_ASSETS;
  var sheet = getOrCreateSheet_(
    CMS_CONFIG.SHEETS.CARD_ASSETS,
    CMS_CONFIG.HEADERS.CARD_ASSETS
  );
  var allRecords = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_ASSETS);
  var cardIdCandidates = getCardIdCandidates_(cardId);
  var rowsToKeep = [];
  var index;

  for (index = 0; index < allRecords.length; index += 1) {
    if (!includesValue_(cardIdCandidates, allRecords[index].card_id)) {
      rowsToKeep.push(allRecords[index]);
    }
  }

  clearSheetBody_(sheet, headers.length);

  var rowsToWrite = rowsToKeep.concat(assets || []);

  if (rowsToWrite.length) {
    writeRecordsToSheet_(sheet, headers, rowsToWrite);
  }
}

/**
 * 寫入系統設定資訊到 sys_config。
 */
function setSystemConfig_(configKey, configValue) {
  var headers = CMS_CONFIG.HEADERS.SYS_CONFIG;
  var sheet = getOrCreateSheet_(
    CMS_CONFIG.SHEETS.SYS_CONFIG,
    CMS_CONFIG.HEADERS.SYS_CONFIG
  );
  var records = getSheetRecords_(CMS_CONFIG.SHEETS.SYS_CONFIG);
  var targetRow = findRecordRowNumber_(records, 'config_key', configKey);
  var rowValues = buildRowValues_(headers, {
    config_key: configKey,
    config_value: String(configValue || ''),
    updated_at: new Date().toISOString()
  });

  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * 取得指定工作表的欄位名稱定義。
 */
function getSheetHeaders_(sheetName) {
  if (sheetName === CMS_CONFIG.SHEETS.CARD_SETTINGS) {
    return CMS_CONFIG.HEADERS.CARD_SETTINGS;
  }

  if (sheetName === CMS_CONFIG.SHEETS.CARD_BUTTONS) {
    return CMS_CONFIG.HEADERS.CARD_BUTTONS;
  }

  if (sheetName === CMS_CONFIG.SHEETS.CARD_ASSETS) {
    return CMS_CONFIG.HEADERS.CARD_ASSETS;
  }

  if (sheetName === CMS_CONFIG.SHEETS.SYS_CONFIG) {
    return CMS_CONFIG.HEADERS.SYS_CONFIG;
  }

  return [];
}

/**
 * 依欄位順序將物件轉成列資料。
 */
function buildRowValues_(headers, record) {
  var rowValues = [];
  var index;

  for (index = 0; index < headers.length; index += 1) {
    rowValues.push(record[headers[index]] !== undefined ? record[headers[index]] : '');
  }

  return rowValues;
}

/**
 * 找出資料列號碼。
 * 回傳的是 Spreadsheet 的實際列號，所以要加上標題列偏移。
 */
function findRecordRowNumber_(records, keyName, keyValue) {
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (String(records[index][keyName]) === String(keyValue)) {
      return index + 2;
    }
  }

  return 0;
}

/**
 * 找出第一筆符合任一候選值的列號。
 */
function findRecordRowNumberByCandidates_(records, keyName, keyValues) {
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (includesValue_(keyValues, records[index][keyName])) {
      return index + 2;
    }
  }

  return 0;
}

/**
 * 檢查某值是否存在候選清單內。
 */
function includesValue_(candidates, value) {
  var normalizedValue = String(value);
  var index;

  for (index = 0; index < candidates.length; index += 1) {
    if (String(candidates[index]) === normalizedValue) {
      return true;
    }
  }

  return false;
}

/**
 * 清空工作表標題列以下的所有內容。
 */
function clearSheetBody_(sheet, columnCount) {
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return;
  }

  sheet.getRange(2, 1, lastRow - 1, columnCount).clearContent();
}

/**
 * 依照欄位順序把多筆物件資料寫回工作表。
 */
function writeRecordsToSheet_(sheet, headers, records) {
  var values = [];
  var index;

  for (index = 0; index < records.length; index += 1) {
    values.push(buildRowValues_(headers, records[index]));
  }

  sheet
    .getRange(2, 1, values.length, headers.length)
    .setValues(values);
}
