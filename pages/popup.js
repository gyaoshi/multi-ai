/* Multi AI 弹窗 */
(function () {
  "use strict";
  document.getElementById("open").addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/app.html") });
  });
})();
