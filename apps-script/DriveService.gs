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

  try {
    return DriveApp.getFolderById(folderId);
  } catch (error) {
    return null;
  }
}

/**
 * 確保有可用的圖片資料夾。
 * 若尚未設定就自動建立並寫回 Script Properties。
 */
function ensureAssetFolder_() {
  var folder = getDriveFolder_();

  if (folder) {
    return folder;
  }

  folder = DriveApp.createFolder(CMS_CONFIG.DRIVE.ASSET_FOLDER_NAME);
  getScriptProperties_().setProperty(
    CMS_CONFIG.PROPERTY_KEYS.DRIVE_FOLDER_ID,
    folder.getId()
  );

  return folder;
}

/**
 * 資產上傳介面。
 * 給後台圖片上傳流程共用。
 */
function uploadAsset(fileName, contentType, bytes) {
  return uploadAsset_(fileName, contentType, bytes);
}

/**
 * 資產上傳的內部實作。
 */
function uploadAsset_(fileName, contentType, bytes) {
  var folder = ensureAssetFolder_();
  var uploadedAt = new Date().toISOString();

  var blob = Utilities.newBlob(
    bytes || '',
    contentType || 'application/octet-stream',
    fileName || 'asset.bin'
  );
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    mimeType: file.getMimeType(),
    uploadedAt: uploadedAt,
    url: buildDriveDirectImageUrl_(file.getId()),
    driveUrl: file.getUrl(),
    folderId: folder.getId(),
    folderName: folder.getName()
  };
}

/**
 * 建立可直接顯示圖片的公開網址。
 */
function buildDriveDirectImageUrl_(fileId) {
  return (
    'https://drive.google.com/thumbnail?id=' +
    encodeURIComponent(fileId) +
    '&sz=w1600'
  );
}
