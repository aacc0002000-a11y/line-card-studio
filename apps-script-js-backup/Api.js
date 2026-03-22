/**
 * 建立預設卡片資料。
 * 這份資料會作為第一次 seed 與沒有資料時的後備值。
 */
function getDefaultCardSettings_() {
  return {
    card_id: CMS_CONFIG.DEFAULT_CARD_ID,
    brand_name: 'SHUANG MU LIN',
    headline: '讓LINE變會賺錢好員工',
    subheadline: '老闆營運的好夥伴－晏珊',
    intro:
      '我是晏珊，專門協助老闆把 LINE 官方帳號與營運流程，變成會帶客、會回流的營運助手。',
    bullet_1: '看懂自己的客群與賣點',
    bullet_2: '設計好用又會成交的 LINE 版面',
    bullet_3: '搭建預約、通知、回流、自動化流程',
    theme_color: '#172033',
    accent_color: '#0F766E',
    button_bg_color: '#0F766E',
    button_text_color: '#FFFFFF',
    photo_url: '/card-photo-placeholder.svg',
    updated_at: new Date().toISOString(),
    is_active: true
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
      card_id: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 1,
      label: '前往 LINE 官方一探究竟',
      url: 'https://line.me/ti/p/REPLACE_ME',
      is_enabled: true,
      updated_at: now
    },
    {
      card_id: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 2,
      label: 'Wechat',
      url: 'https://wechat.com/REPLACE_ME',
      is_enabled: true,
      updated_at: now
    },
    {
      card_id: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 3,
      label: 'Facebook',
      url: 'https://facebook.com/REPLACE_ME',
      is_enabled: true,
      updated_at: now
    },
    {
      card_id: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 4,
      label: 'Phone',
      url: 'tel:0912345678',
      is_enabled: true,
      updated_at: now
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
      file_url: settings.photo_url,
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
  var records = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_SETTINGS);
  var defaults = getDefaultCardSettings_();
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (String(records[index].card_id) === String(targetCardId)) {
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
  var settings = options || {};
  var includeDisabled = Boolean(settings.includeDisabled);
  var records = getSheetRecords_(CMS_CONFIG.SHEETS.CARD_BUTTONS);
  var buttons = [];
  var index;

  for (index = 0; index < records.length; index += 1) {
    if (String(records[index].card_id) !== String(targetCardId)) {
      continue;
    }

    var button = normalizeButtonRecord_(records[index]);

    if (!includeDisabled && !button.is_enabled) {
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
      brandName: card.brand_name,
      headline: card.headline,
      subheadline: card.subheadline,
      intro: card.intro,
      photoUrl: card.photo_url,
      themeColor: card.theme_color,
      accentColor: card.accent_color,
      buttonBgColor: card.button_bg_color,
      buttonTextColor: card.button_text_color,
      bullets: [card.bullet_1, card.bullet_2, card.bullet_3].filter(Boolean),
      buttons: mapButtonsForPublicApi_(buttons),
      updatedAt: card.updated_at,
      isActive: parseBoolean_(card.is_active)
    }
  };
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
      brandName: card.brand_name,
      headline: card.headline,
      subheadline: card.subheadline,
      intro: card.intro,
      bullet1: card.bullet_1,
      bullet2: card.bullet_2,
      bullet3: card.bullet_3,
      themeColor: card.theme_color,
      accentColor: card.accent_color,
      buttonBgColor: card.button_bg_color,
      buttonTextColor: card.button_text_color,
      photoUrl: card.photo_url,
      isActive: parseBoolean_(card.is_active),
      updatedAt: card.updated_at,
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
    brand_name: normalized.brandName,
    headline: normalized.headline,
    subheadline: normalized.subheadline,
    intro: normalized.intro,
    bullet_1: normalized.bullet1,
    bullet_2: normalized.bullet2,
    bullet_3: normalized.bullet3,
    theme_color: normalized.themeColor,
    accent_color: normalized.accentColor,
    button_bg_color: normalized.buttonBgColor,
    button_text_color: normalized.buttonTextColor,
    photo_url: normalized.photoUrl,
    updated_at: now,
    is_active: normalized.isActive
  });

  replaceCardButtons_(normalized.cardId, buildButtonRowsForSave_(normalized, now));
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
    message: '卡片資料已儲存到 Google Sheet。',
    card: getAdminCardJson(normalized.cardId).card
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

  normalized.is_active = parseBoolean_(normalized.is_active);

  return normalized;
}

/**
 * 將按鈕資料列正規化成固定格式。
 */
function normalizeButtonRecord_(record) {
  return {
    card_id: record.card_id || CMS_CONFIG.DEFAULT_CARD_ID,
    sort_order: Number(record.sort_order || 0),
    label: record.label || '',
    url: record.url || '',
    is_enabled: parseBoolean_(record.is_enabled),
    updated_at: record.updated_at || ''
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
        sort_order: index + 1,
        label: '',
        url: '',
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
    brandName: payload.brandName || '',
    headline: payload.headline || '',
    subheadline: payload.subheadline || '',
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

  for (index = 0; index < buttons.length && normalized.length < CMS_CONFIG.MAX_BUTTONS; index += 1) {
    normalized.push({
      sortOrder: index + 1,
      label: buttons[index].label || '',
      url: buttons[index].url || '',
      isEnabled: buttons[index].isEnabled === true
    });
  }

  return normalized;
}

/**
 * 將按鈕 payload 轉成工作表需要的列資料。
 */
function buildButtonRowsForSave_(payload, updatedAt) {
  var rows = [];
  var index;

  for (index = 0; index < payload.buttons.length; index += 1) {
    rows.push({
      card_id: payload.cardId,
      sort_order: payload.buttons[index].sortOrder,
      label: payload.buttons[index].label,
      url: payload.buttons[index].url,
      is_enabled: payload.buttons[index].isEnabled,
      updated_at: updatedAt
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
