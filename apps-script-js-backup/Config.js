/**
 * 系統設定常數。
 * 第一版先把固定值集中在這裡，後續擴充比較好維護。
 */
var CMS_CONFIG = {
  SERVICE_NAME: 'line-card-cms',
  DEFAULT_CARD_ID: 'default',
  MAX_BUTTONS: 4,
  SHEET_ID: '',
  DRIVE_FOLDER_ID: '',
  PROPERTY_KEYS: {
    SPREADSHEET_ID: 'LINE_CARD_CMS_SPREADSHEET_ID',
    DRIVE_FOLDER_ID: 'LINE_CARD_CMS_DRIVE_FOLDER_ID'
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
      'brand_name',
      'headline',
      'subheadline',
      'intro',
      'bullet_1',
      'bullet_2',
      'bullet_3',
      'theme_color',
      'accent_color',
      'button_bg_color',
      'button_text_color',
      'photo_url',
      'updated_at',
      'is_active'
    ],
    CARD_BUTTONS: [
      'card_id',
      'sort_order',
      'label',
      'url',
      'is_enabled',
      'updated_at'
    ],
    CARD_ASSETS: ['card_id', 'asset_type', 'file_name', 'file_url', 'updated_at'],
    SYS_CONFIG: ['config_key', 'config_value', 'updated_at']
  }
};
