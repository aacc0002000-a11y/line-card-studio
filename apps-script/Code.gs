/**
 * Web App 的 GET 入口。
 * `action=admin` 會回傳管理頁，其他 action 一律回傳 JSON。
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'health';

  if (action === 'admin') {
    return renderAdminPage_();
  }

  return handleApiRequest_(action, getRequestParams_(e));
}

/**
 * Web App 的 POST 入口。
 * 用於處理儲存、初始化等會改動資料的請求。
 */
function doPost(e) {
  var params = getRequestParams_(e);
  var action = params.action || 'health';

  return handleApiRequest_(action, params);
}

/**
 * 統一分派 API action，方便後續繼續擴充。
 */
function handleApiRequest_(action, params) {
  try {
    var cardId = params.cardId || CMS_CONFIG.DEFAULT_CARD_ID;

    if (action === 'health') {
      return createJsonOutput_({
        ok: true,
        service: CMS_CONFIG.SERVICE_NAME,
        time: new Date().toISOString()
      });
    }

    if (action === 'init') {
      return createJsonOutput_(initializeSheetSchema());
    }

    if (action === 'seed') {
      return createJsonOutput_(seedDefaultCardData());
    }

    if (action === 'getPublicCardJson') {
      return createJsonOutput_(getPublicCardJson(cardId));
    }

    if (action === 'getCardJson') {
      return createJsonOutput_(getCardJson(cardId));
    }

    if (action === 'getAdminCardJson') {
      return createJsonOutput_(getAdminCardJson(cardId));
    }

    if (action === 'saveCardConfig') {
      return createJsonOutput_(saveCardConfig(params.payload || params));
    }

    return createJsonOutput_({
      ok: false,
      message: 'Unknown action',
      action: action
    });
  } catch (error) {
    return createJsonOutput_({
      ok: false,
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : ''
    });
  }
}

/**
 * 解析 GET / POST 送進來的參數。
 * 若 POST body 是 JSON，也會自動轉成物件。
 */
function getRequestParams_(e) {
  var params = (e && e.parameter) || {};

  if (!e || !e.postData || !e.postData.contents) {
    return params;
  }

  try {
    var parsed = JSON.parse(e.postData.contents);
    return mergeObjects_(params, parsed);
  } catch (error) {
    return mergeObjects_(params, {
      rawBody: e.postData.contents
    });
  }
}

/**
 * 建立標準 JSON 輸出。
 */
function createJsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data, null, 2)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * 簡單合併兩個物件。
 */
function mergeObjects_(baseObject, extraObject) {
  var merged = {};
  var key;

  for (key in baseObject) {
    if (baseObject.hasOwnProperty(key)) {
      merged[key] = baseObject[key];
    }
  }

  for (key in extraObject) {
    if (extraObject.hasOwnProperty(key)) {
      merged[key] = extraObject[key];
    }
  }

  return merged;
}
