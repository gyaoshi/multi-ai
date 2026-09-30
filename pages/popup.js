/* Multi AI 弹窗 */
(function () {
  "use strict";
  function t(key) {
    return MAI18N ? MAI18N.t(key) : key;
  }
  /* 静态文案本地化 */
  (function () {
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute("data-i18n"));
    try { document.documentElement.lang = (navigator.language || "zh-CN"); } catch (e) { /* 忽略 */ }
  })();
  document.getElementById("open").addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/app.html") });
  });
})();
