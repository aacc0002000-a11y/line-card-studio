/**
 * 建立預設卡片資料。
 * 這份資料會作為第一次 seed 與沒有資料時的後備值。
 */
function getDefaultCardSettings_() {
  return {
    card_id: CMS_CONFIG.DEFAULT_CARD_ID,
    brandEn: 'SHUANG MU LIN',
    heroTitle: '讓LINE變會賺錢好員工',
    displayName: '老闆營運的好夥伴－晏珊',
    intro:
      '我是晏珊，專門協助老闆把 LINE 官方帳號與營運流程，變成會帶客、會回流的營運助手。',
    bullet_1: '看懂自己的客群與賣點',
    bullet_2: '設計好用又會成交的 LINE 版面',
    bullet_3: '搭建預約、通知、回流、自動化流程',
    themeColor: '#172033',
    accentColor: '#0F766E',
    buttonBgColor: '#0F766E',
    buttonTextColor: '#FFFFFF',
    photoUrl: '/card-photo-placeholder.svg',
    updatedAt: new Date().toISOString(),
    isActive: true
  };
}

/**
 * 建立預設按鈕資料。
 * 與目前前台成功版本一致，先保留四顆常用聯絡按鈕。
 */
function getDefaultButtons_() {
  var now = new Date().toISOString();

  return [
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 1,
      label: '前往 LINE 官方一探究竟',
      url: 'https://line.me/ti/p/REPLACE_ME',
      isEnabled: true,
      updatedAt: now
    },
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 2,
      label: 'Wechat',
      url: 'https://wechat.com/REPLACE_ME',
      isEnabled: true,
      updatedAt: now
    },
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 3,
      label: 'Facebook',
      url: 'https://facebook.com/REPLACE_ME',
      isEnabled: true,
      updatedAt: now
    },
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 4,
      label: 'Phone',
      url: 'tel:0912345678',
      isEnabled: true,
      updatedAt: now
    }
  ];
}

/**
 * 初始化預設卡片資料。
 * 執行後就能立刻拿到可供前台測試的 card 與 buttons。
 */
function seedDefaultCardData() {
  initializeSheetSchema();

  var settings = getDefaultCardSettings_();
  var buttons = getDefaultButtons_();
  var assets = [
    {
      card_id: settings.card_id,
      asset_type: 'photo',
      file_name: 'card-photo-placeholder.svg',
      file_url: settings.photoUrl,
      updated_at: new Date().toISOString()
    }
  ];

  upsertCardSettings_(settings);
  replaceCardButtons_(settings.card_id, buttons);
  replaceCardAssets_(settings.card_id, assets);
  setSystemConfig_('default_card_seeded_at', new Date().toISOString());

  return {
    ok: true,
    message: '預設資料已建立。',
    card: getAdminCardJson(settings.card_id)
  };
}

/**
 * 取得卡片設定原始資料。
 * 若指定卡片不存在，會回傳預設結構，方便管理頁直接編輯。
 */
function getCardConfig(cardId) {
  var targetCardId = cardId || CMS_CONFIG.DEFAULT_CARD_ID;
  var cardIdCandidates = getCardIdCandidates_(targetCardId);
  var records = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_SETTINGS);
  var defaults = getDefaultCardSettings_();
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (includesValue_(cardIdCandidates, records[index].card_id)) {
      return normalizeCardSettingsRecord_(records[index]);
    }
  }

  defaults.card_id = targetCardId;
  return defaults;
}

/**
 * 取得按鈕資料。
 * 預設只回傳啟用中的按鈕，且最多取前四顆。
 */
function getButtons(cardId, options) {
  var targetCardId = cardId || CMS_CONFIG.DEFAULT_CARD_ID;
  var cardIdCandidates = getCardIdCandidates_(targetCardId);
  var settings = options || {};
  var includeDisabled = Boolean(settings.includeDisabled);
  var records = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_BUTTONS);
  var buttons = [];
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (!includesValue_(cardIdCandidates, records[index].cardId)) {
      continue;
    }

    var button = normalizeButtonRecord_(records[index]);

    if (!includeDisabled && !button.isEnabled) {
      continue;
    }

    buttons.push(button);
  }

  buttons.sort(function (left, right) {
    return Number(left.sort_order) - Number(right.sort_order);
  });

  return buttons.slice(0, CMS_CONFIG.MAX_BUTTONS);
}

/**
 * 取得前台使用的公開卡片 JSON。
 * 結構刻意整理成前台好用格式。
 */
function getPublicCardJson(cardId) {
  var card = getCardConfig(cardId);
  var buttons = getButtons(card.card_id);

  return {
    ok: true,
    card: {
      cardId: card.card_id,
      brandEn: card.brandEn,
      heroTitle: card.heroTitle,
      displayName: card.displayName,
      brandName: card.brandEn,
      headline: card.heroTitle,
      subheadline: card.displayName,
      intro: card.intro,
      photoUrl: card.photoUrl,
      themeColor: card.themeColor,
      accentColor: card.accentColor,
      buttonBgColor: card.buttonBgColor,
      buttonTextColor: card.buttonTextColor,
      bullets: [card.bullet_1, card.bullet_2, card.bullet_3].filter(Boolean),
      buttons: mapButtonsForPublicApi_(buttons),
      updatedAt: card.updatedAt,
      isActive: parseBoolean_(card.isActive)
    }
  };
}

/**
 * 相容既有對外 action 名稱。
 */
function getCardJson(cardId) {
  return getPublicCardJson(cardId);
}

/**
 * 取得管理頁使用的卡片 JSON。
 * 會保留完整可編輯欄位，並補滿四個按鈕欄位。
 */
function getAdminCardJson(cardId) {
  var card = getCardConfig(cardId);
  var buttons = padButtonsForAdmin_(getButtons(card.card_id, { includeDisabled: true }));

  return {
    ok: true,
    card: {
      cardId: card.card_id,
      brandEn: card.brandEn,
      heroTitle: card.heroTitle,
      displayName: card.displayName,
      brandName: card.brandEn,
      headline: card.heroTitle,
      subheadline: card.displayName,
      intro: card.intro,
      bullet1: card.bullet_1,
      bullet2: card.bullet_2,
      bullet3: card.bullet_3,
      themeColor: card.themeColor,
      accentColor: card.accentColor,
      buttonBgColor: card.buttonBgColor,
      buttonTextColor: card.buttonTextColor,
      photoUrl: card.photoUrl,
      isActive: parseBoolean_(card.isActive),
      updatedAt: card.updatedAt,
      buttons: buttons
    }
  };
}

/**
 * 儲存管理頁送來的卡片資料。
 * 會同步更新 card_settings、card_buttons、card_assets。
 */
function saveCardConfig(payload) {
  initializeSheetSchema();

  var normalized = normalizeSavePayload_(payload || {});
  var now = new Date().toISOString();

  upsertCardSettings_({
    card_id: normalized.cardId,
    brandEn: normalized.brandEn,
    heroTitle: normalized.heroTitle,
    displayName: normalized.displayName,
    intro: normalized.intro,
    bullet_1: normalized.bullet1,
    bullet_2: normalized.bullet2,
    bullet_3: normalized.bullet3,
    themeColor: normalized.themeColor,
    accentColor: normalized.accentColor,
    buttonBgColor: normalized.buttonBgColor,
    buttonTextColor: normalized.buttonTextColor,
    photoUrl: normalized.photoUrl,
    updatedAt: now,
    isActive: normalized.isActive
  });

  saveButtons(normalized.cardId, normalized.buttons, now);
  replaceCardAssets_(
    normalized.cardId,
    normalized.photoUrl
      ? [
          {
            card_id: normalized.cardId,
            asset_type: 'photo',
            file_name: extractFileName_(normalized.photoUrl),
            file_url: normalized.photoUrl,
            updated_at: now
          }
        ]
      : []
  );
  setSystemConfig_('last_saved_card_id', normalized.cardId);
  setSystemConfig_('last_saved_at', now);

  return {
    ok: true,
    savedCardId: normalized.cardId,
    savedAt: now,
    message: '已成功寫入 Spreadsheet',
    card: getAdminCardJson(normalized.cardId).card
  };
}

/**
 * 真正寫入按鈕資料到 card_buttons。
 * 會先清掉同 cardId 舊資料，再覆蓋最新四顆以內的有效按鈕。
 */
function saveButtons(cardId, buttons, updatedAt) {
  var now = updatedAt || new Date().toISOString();
  var normalizedButtons = normalizeSaveButtons_(buttons || []);

  replaceCardButtons_(cardId, buildButtonRowsForSave_(cardId, normalizedButtons, now));

  return {
    ok: true,
    savedCardId: cardId,
    savedAt: now,
    buttonCount: normalizedButtons.length
  };
}

/**
 * 將原始 card_settings 資料正規化。
 */
function normalizeCardSettingsRecord_(record) {
  var defaults = getDefaultCardSettings_();
  var normalized = {};
  var headers = CMS_CONFIG.HEADERS.CARD_SETTINGS;
  var index;

  for (index = 0; index < headers.length; index += 1) {
    var key = headers[index];
    normalized[key] = record[key] !== '' && record[key] !== undefined ? record[key] : defaults[key];
  }

  normalized.isActive = parseBoolean_(normalized.isActive);

  return normalized;
}

/**
 * 將按鈕資料列正規化成固定格式。
 */
function normalizeButtonRecord_(record) {
  return {
    cardId: record.cardId || CMS_CONFIG.DEFAULT_CARD_ID,
    card_id: record.cardId || CMS_CONFIG.DEFAULT_CARD_ID,
    sort_order: Number(record.sort_order || 0),
    label: record.label || '',
    url: record.url || '',
    isEnabled: parseBoolean_(record.isEnabled),
    is_enabled: parseBoolean_(record.isEnabled),
    updatedAt: record.updatedAt || '',
    updated_at: record.updatedAt || ''
  };
}

/**
 * 前台公開 API 只需要按鈕文字與網址。
 */
function mapButtonsForPublicApi_(buttons) {
  var result = [];
  var index;

  for (index = 0; index < buttons.length; index += 1) {
    result.push({
      label: buttons[index].label,
      url: buttons[index].url
    });
  }

  return result;
}

/**
 * 管理頁固定補滿四顆按鈕欄位，讓表單結構穩定。
 */
function padButtonsForAdmin_(buttons) {
  var result = [];
  var index;

  for (index = 0; index < CMS_CONFIG.MAX_BUTTONS; index += 1) {
    result.push(
      buttons[index] || {
        cardId: CMS_CONFIG.DEFAULT_CARD_ID,
        sort_order: index + 1,
        label: '',
        url: '',
        isEnabled: false,
        is_enabled: false
      }
    );
  }

  return result;
}

/**
 * 將管理頁儲存資料正規化，避免空值或型別混亂。
 */
function normalizeSavePayload_(payload) {
  return {
    cardId: payload.cardId || CMS_CONFIG.DEFAULT_CARD_ID,
    brandEn: payload.brandEn || payload.brandName || '',
    heroTitle: payload.heroTitle || payload.headline || '',
    displayName: payload.displayName || payload.subheadline || '',
    intro: payload.intro || '',
    bullet1: payload.bullet1 || '',
    bullet2: payload.bullet2 || '',
    bullet3: payload.bullet3 || '',
    themeColor: payload.themeColor || '#172033',
    accentColor: payload.accentColor || '#0F766E',
    buttonBgColor: payload.buttonBgColor || '#0F766E',
    buttonTextColor: payload.buttonTextColor || '#FFFFFF',
    photoUrl: payload.photoUrl || '',
    isActive: payload.isActive !== false,
    buttons: normalizeSaveButtons_(payload.buttons || [])
  };
}

/**
 * 只保留前四顆按鈕，並整理成固定欄位。
 */
function normalizeSaveButtons_(buttons) {
  var normalized = [];
  var index;
  var label;
  var url;

  for (index = 0; index < buttons.length && normalized.length < CMS_CONFIG.MAX_BUTTONS; index += 1) {
    label = buttons[index].label || '';
    url = buttons[index].url || '';

    if (!label || !url) {
      continue;
    }

    normalized.push({
      sortOrder: index + 1,
      label: label,
      url: url,
      isEnabled: buttons[index].isEnabled === true
    });
  }

  return normalized;
}

/**
 * 將按鈕 payload 轉成工作表需要的列資料。
 */
function buildButtonRowsForSave_(cardId, buttons, updatedAt) {
  var rows = [];
  var index;

  for (index = 0; index < buttons.length; index += 1) {
    rows.push({
      cardId: cardId,
      sort_order: buttons[index].sortOrder,
      label: buttons[index].label,
      url: buttons[index].url,
      isEnabled: buttons[index].isEnabled,
      updatedAt: updatedAt
    });
  }

  return rows;
}

/**
 * 將字串、數字、布林值都安全轉成 true/false。
 */
function parseBoolean_(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }

  return false;
}

/**
 * 從網址或路徑推回檔名，方便之後接上資產資料。
 */
function extractFileName_(url) {
  if (!url) {
    return '';
  }

  var parts = String(url).split('/');
  return parts[parts.length - 1];
}
