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
    photoFileId: '',
    photoMimeType: '',
    photoUpdatedAt: '',
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
      buttonBgColor: '#0F766E',
      buttonTextColor: '#FFFFFF',
      isEnabled: true,
      updatedAt: now
    },
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 2,
      label: 'Wechat',
      url: 'https://wechat.com/REPLACE_ME',
      buttonBgColor: '#EFF5F2',
      buttonTextColor: '#172033',
      isEnabled: true,
      updatedAt: now
    },
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 3,
      label: 'Facebook',
      url: 'https://facebook.com/REPLACE_ME',
      buttonBgColor: '#EFF5F2',
      buttonTextColor: '#172033',
      isEnabled: true,
      updatedAt: now
    },
    {
      cardId: CMS_CONFIG.DEFAULT_CARD_ID,
      sort_order: 4,
      label: '分享好友',
      url: '',
      buttonBgColor: '#0F766E',
      buttonTextColor: '#FFFFFF',
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
      file_id: '',
      file_name: 'card-photo-placeholder.svg',
      mime_type: 'image/svg+xml',
      file_url: settings.photoUrl,
      uploaded_at: new Date().toISOString(),
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
      photo_url: card.photoUrl,
      photoFileId: card.photoFileId,
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
      photo_url: card.photoUrl,
      photoFileId: card.photoFileId,
      photoMimeType: card.photoMimeType,
      photoUpdatedAt: card.photoUpdatedAt,
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
    photoFileId: normalized.photoFileId,
    photoMimeType: normalized.photoMimeType,
    photoUpdatedAt: normalized.photoUpdatedAt,
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
            file_id: normalized.photoFileId,
            file_name: extractFileName_(normalized.photoUrl),
            mime_type: normalized.photoMimeType,
            file_url: normalized.photoUrl,
            uploaded_at: normalized.photoUpdatedAt || now,
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
 * 接收後台 base64 圖片，上傳到 Drive，並把 photoUrl 寫回卡片設定。
 */
function uploadPhotoAsset(payload) {
  initializeSheetSchema();

  var normalized = normalizePhotoUploadPayload_(payload || {});
  var upload = uploadAsset_(
    buildPhotoAssetFileName_(normalized.cardId, normalized.fileName),
    normalized.mimeType,
    decodeBase64Data_(normalized.base64Data)
  );

  savePhotoUrlToCard_(
    normalized.cardId,
    upload.url,
    upload.fileId,
    upload.mimeType,
    upload.uploadedAt
  );
  replaceCardAssets_(normalized.cardId, [
    {
      card_id: normalized.cardId,
      asset_type: 'photo',
      file_id: upload.fileId,
      file_name: upload.fileName,
      mime_type: upload.mimeType,
      file_url: upload.url,
      uploaded_at: upload.uploadedAt,
      updated_at: upload.uploadedAt
    }
  ]);
  setSystemConfig_('last_uploaded_photo_card_id', normalized.cardId);
  setSystemConfig_('last_uploaded_photo_at', upload.uploadedAt);

  return {
    ok: true,
    cardId: normalized.cardId,
    message: '圖片已上傳到 Drive，並寫回 photoUrl',
    photoUrl: upload.url,
    fileId: upload.fileId,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    uploadedAt: upload.uploadedAt,
    driveUrl: upload.driveUrl,
    folderId: upload.folderId,
    folderName: upload.folderName,
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

  normalized.photoFileId =
    normalized.photoFileId ||
    extractDriveFileId_(normalized.photoUrl) ||
    '';
  normalized.photoUrl = normalizeResolvedPhotoUrl_(
    normalized.photoUrl || normalized.photo_url || '',
    normalized.photoFileId
  );
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
    buttonBgColor: record.buttonBgColor || '',
    buttonTextColor: record.buttonTextColor || '',
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
      url: buttons[index].url,
      buttonBgColor: buttons[index].buttonBgColor,
      buttonTextColor: buttons[index].buttonTextColor
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
        buttonBgColor: index === 0 || index === 3 ? '#0F766E' : '#EFF5F2',
        buttonTextColor: index === 0 || index === 3 ? '#FFFFFF' : '#172033',
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
  var resolvedPhotoFileId =
    payload.photoFileId ||
    extractDriveFileId_(payload.photoUrl || payload.photo_url || '') ||
    '';
  var resolvedPhotoUrl = normalizeResolvedPhotoUrl_(
    payload.photoUrl || payload.photo_url || '',
    resolvedPhotoFileId
  );

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
    photoUrl: resolvedPhotoUrl,
    photoFileId: resolvedPhotoFileId,
    photoMimeType: payload.photoMimeType || '',
    photoUpdatedAt: payload.photoUpdatedAt || '',
    isActive: payload.isActive !== false,
    buttons: normalizeSaveButtons_(payload.buttons || [])
  };
}

/**
 * 驗證圖片上傳 payload。
 */
function normalizePhotoUploadPayload_(payload) {
  var fileName = String(payload.fileName || '').trim();
  var mimeType = String(payload.mimeType || '').trim().toLowerCase();
  var base64Data = String(payload.base64Data || '').trim();
  var allowedMimeTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true
  };

  if (!fileName) {
    throw new Error('缺少 fileName');
  }

  if (!allowedMimeTypes[mimeType]) {
    throw new Error('不支援的圖片格式，僅支援 jpg、jpeg、png、webp');
  }

  if (!base64Data) {
    throw new Error('缺少 base64Data');
  }

  return {
    cardId: payload.cardId || CMS_CONFIG.DEFAULT_CARD_ID,
    fileName: sanitizeFileName_(fileName),
    mimeType: mimeType,
    base64Data: stripDataUrlPrefix_(base64Data)
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
  var sortOrder;
  var buttonBgColor;
  var buttonTextColor;

  for (index = 0; index < buttons.length && normalized.length < CMS_CONFIG.MAX_BUTTONS; index += 1) {
    sortOrder = Number(buttons[index].sortOrder || index + 1);
    label = buttons[index].label || '';
    url = buttons[index].url || '';
    buttonBgColor = normalizeHexColorForStorage_(
      buttons[index].buttonBgColor,
      sortOrder === 1 || sortOrder === 4 ? '#0F766E' : '#EFF5F2'
    );
    buttonTextColor = normalizeHexColorForStorage_(
      buttons[index].buttonTextColor,
      sortOrder === 1 || sortOrder === 4 ? '#FFFFFF' : '#172033'
    );

    if (sortOrder === 4) {
      normalized.push({
        sortOrder: 4,
        label: '分享好友',
        url: '',
        buttonBgColor: buttonBgColor,
        buttonTextColor: buttonTextColor,
        isEnabled: true
      });
      continue;
    }

    if (!label || !url) {
      continue;
    }

    normalized.push({
      sortOrder: sortOrder,
      label: label,
      url: url,
      buttonBgColor: buttonBgColor,
      buttonTextColor: buttonTextColor,
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
      buttonBgColor: buttons[index].buttonBgColor,
      buttonTextColor: buttons[index].buttonTextColor,
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

/**
 * 將 base64 字串轉回位元組陣列。
 */
function decodeBase64Data_(base64Data) {
  try {
    return Utilities.base64Decode(base64Data);
  } catch (error) {
    return Utilities.base64DecodeWebSafe(base64Data);
  }
}

/**
 * 拿掉 data URL 前綴。
 */
function stripDataUrlPrefix_(value) {
  return String(value).replace(/^data:[^;]+;base64,/, '');
}

/**
 * 將上傳結果寫回 card_settings。
 */
function savePhotoUrlToCard_(cardId, photoUrl, fileId, mimeType, uploadedAt) {
  var existing = getCardConfig(cardId);
  var resolvedPhotoFileId = fileId || extractDriveFileId_(photoUrl) || '';
  var resolvedPhotoUrl = normalizeResolvedPhotoUrl_(photoUrl, resolvedPhotoFileId);

  upsertCardSettings_({
    card_id: existing.card_id || cardId,
    brandEn: existing.brandEn,
    heroTitle: existing.heroTitle,
    displayName: existing.displayName,
    intro: existing.intro,
    bullet_1: existing.bullet_1,
    bullet_2: existing.bullet_2,
    bullet_3: existing.bullet_3,
    themeColor: existing.themeColor,
    accentColor: existing.accentColor,
    buttonBgColor: existing.buttonBgColor,
    buttonTextColor: existing.buttonTextColor,
    photoUrl: resolvedPhotoUrl,
    photoFileId: resolvedPhotoFileId,
    photoMimeType: mimeType,
    photoUpdatedAt: uploadedAt,
    updatedAt: uploadedAt,
    isActive: existing.isActive
  });
}

function normalizeHexColorForStorage_(value, fallback) {
  var normalized = String(value || '').trim().toUpperCase();

  if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(normalized)) {
    return fallback;
  }

  if (normalized.length === 4) {
    return (
      '#' +
      normalized.charAt(1) + normalized.charAt(1) +
      normalized.charAt(2) + normalized.charAt(2) +
      normalized.charAt(3) + normalized.charAt(3)
    );
  }

  return normalized;
}

/**
 * 將 photoUrl 統一轉成前台 / LIFF / Admin API 可直接共用的圖片網址。
 */
function normalizeResolvedPhotoUrl_(photoUrl, fileId) {
  var normalizedPhotoUrl = String(photoUrl || '').trim();
  var resolvedFileId = fileId || extractDriveFileId_(normalizedPhotoUrl);

  if (resolvedFileId) {
    return buildDriveDirectImageUrl_(resolvedFileId);
  }

  return normalizedPhotoUrl;
}

/**
 * 從各種 Google Drive 連結格式中抽出 fileId。
 */
function extractDriveFileId_(photoUrl) {
  var value = String(photoUrl || '').trim();
  var match;

  if (!value) {
    return '';
  }

  match = value.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  match = value.match(/\/d\/([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  match = value.match(/googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return '';
}

/**
 * 產生穩定的 Drive 檔名。
 */
function buildPhotoAssetFileName_(cardId, fileName) {
  return (
    sanitizeFileName_(cardId || CMS_CONFIG.DEFAULT_CARD_ID) +
    '-' +
    Utilities.formatDate(new Date(), 'UTC', 'yyyyMMdd-HHmmss') +
    '-' +
    sanitizeFileName_(fileName || 'photo')
  );
}

/**
 * 移除檔名中的危險字元。
 */
function sanitizeFileName_(fileName) {
  return String(fileName || 'file')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
