/**
 * 系統設定常數。
 * 第一版先把固定值集中在這裡，後續擴充比較好維護。
 */
var CMS_CONFIG = {
  SERVICE_NAME: 'line-card-cms',
  DEFAULT_CARD_ID: 'default-card',
  LEGACY_DEFAULT_CARD_ID: 'default',
  MAX_BUTTONS: 4,
  SHEET_ID: '',
  DRIVE_FOLDER_ID: '',
  PROPERTY_KEYS: {
    SPREADSHEET_ID: 'LINE_CARD_CMS_SPREADSHEET_ID',
    DRIVE_FOLDER_ID: 'LINE_CARD_CMS_DRIVE_FOLDER_ID'
  },
  DRIVE: {
    ASSET_FOLDER_NAME: 'LINE Card CMS Assets'
  },
  SHEETS: {
    CARD_SETTINGS: 'card_settings',
    CARD_BUTTONS: 'card_buttons',
    CARD_ASSETS: 'card_assets',
    SYS_CONFIG: 'sys_config'
  },
  HEADERS: {
    CARD_SETTINGS: [
      'card_id',
      'brandEn',
      'heroTitle',
      'displayName',
      'intro',
      'bullet_1',
      'bullet_2',
      'bullet_3',
      'themeColor',
      'accentColor',
      'buttonBgColor',
      'buttonTextColor',
      'photoUrl',
      'photoFileId',
      'photoMimeType',
      'photoUpdatedAt',
      'updatedAt',
      'isActive'
    ],
    CARD_BUTTONS: [
      'cardId',
      'sort_order',
      'label',
      'url',
      'buttonBgColor',
      'buttonTextColor',
      'isEnabled',
      'updatedAt'
    ],
    CARD_ASSETS: [
      'card_id',
      'asset_type',
      'file_id',
      'file_name',
      'mime_type',
      'file_url',
      'uploaded_at',
      'updated_at'
    ],
    SYS_CONFIG: ['config_key', 'config_value', 'updated_at']
  }
};
