/**
 * 取得目前設定的 Drive 資料夾。
 * 若尚未配置，就先回傳 null。
 */
function getDriveFolder_() {
  var folderId =
    CMS_CONFIG.DRIVE_FOLDER_ID ||
    getScriptProperties_().getProperty(CMS_CONFIG.PROPERTY_KEYS.DRIVE_FOLDER_ID) ||
    '';

  if (!folderId) {
    return null;
  }

  return DriveApp.getFolderById(folderId);
}

/**
 * 資產上傳介面。
 * 第一版先保留 stub，之後要接真正的圖片上傳時可直接延伸。
 */
function uploadAsset(fileName, contentType, bytes) {
  return uploadAsset_(fileName, contentType, bytes);
}

/**
 * 資產上傳的內部實作。
 * 若尚未設定資料夾，會回傳明確訊息，不會強行做壞。
 */
function uploadAsset_(fileName, contentType, bytes) {
  var folder = getDriveFolder_();

  if (!folder) {
    return {
      ok: false,
      message: '尚未設定 Drive 資料夾，第一版先保留上傳介面。'
    };
  }

  var blob = Utilities.newBlob(
    bytes || '',
    contentType || 'application/octet-stream',
    fileName || 'asset.bin'
  );
  var file = folder.createFile(blob);

  return {
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    url: file.getUrl()
  };
}
