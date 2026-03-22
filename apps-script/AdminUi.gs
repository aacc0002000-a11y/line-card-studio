/**
 * 載入後台管理頁面。
 * 之後若要加登入驗證或初始資料，也可集中在這裡處理。
 */
function renderAdminPage_() {
  var template = HtmlService.createTemplateFromFile('Admin');
  template.pageTitle = 'LINE Card CMS 後台';

  return template
    .evaluate()
    .setTitle('LINE Card CMS 後台')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 讓 HTML 頁面可以載入共用 partial，例如 Styles 與 Scripts。
 */
function include_(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}
