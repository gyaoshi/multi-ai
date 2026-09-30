/* Multi AI 国际化辅助
 * 用法：
 *   MAI18N.t("key")                    -> 当前语言文案
 *   MAI18N.t("key", [arg1, arg2])      -> 替换 $1 $2 占位符
 *   MAI18N.catName("通用")              -> 搜索站点分类的翻译（sites.js 中文 cat -> i18n key）
 *
 * 优先级：chrome.i18n（扩展环境，按浏览器语言自动选 _locales/<locale>/messages.json）
 *         → 本文件内置 FALLBACK（简体中文，供 file:// 预览 / 内容脚本降级使用）
 * 注意：修改文案时请同时更新 _locales/zh_CN/messages.json（两者需保持一致）。
 */
(function (global) {
  "use strict";

  var FALLBACK = {
    "extension_name": "Multi AI 多引擎搜索",
    "extension_description": "一个页面同时打开多个搜索引擎与多个 AI 对话，底部输入一次，所有面板同时搜索、同时开始对话。",
    "actionTitle": "打开 Multi AI",

    "app_subtitle": "多引擎同搜 · 多 AI 同问",
    "app_addPanel": "＋ 面板",
    "app_addPanelTitle": "添加面板",
    "app_settings": "⚙ 设置",
    "app_settingsTitle": "设置",
    "app_previewBanner": "预览模式（未加载扩展）：AI 面板对话不会真正发生。完整功能请在 <b>chrome://extensions</b> 开启「开发者模式」→「加载已解压的扩展程序」，选择 <b>multi-ai</b> 目录。",
    "app_previewOk": "知道了",
    "app_queryPlaceholder": "输入内容，回车或点发送 —— 所有面板同时搜索 / 同时开始对话",
    "app_send": "发送",
    "app_closeTitle": "关闭",
    "app_themeSection": "主题",
    "app_themeDark": "深色",
    "app_themeLight": "浅色",
    "app_panelsSection": "面板（数量可自定义，自动平分整行宽度）",
    "app_addPanel2": "＋ 添加面板",
    "app_wsSection": "工作区",
    "app_saveWs": "把当前面板存为工作区",
    "app_ceSection": "自定义搜索引擎",
    "app_ceNamePlaceholder": "名称（如：我的引擎）",
    "app_ceUrlPlaceholder": "URL 模板，含 %s（如 https://x.com/search?q=%s）",
    "app_addBtn": "添加",
    "app_pickerTitle": "选择站点",
    "app_pickerSearchPlaceholder": "搜索站点…",
    "app_pickerTabAll": "全部",
    "app_pickerTabAi": "AI",
    "app_pickerTabSearch": "搜索",
    "app_pickerTabCustom": "自定义",
    "app_customChip": "自定义",
    "app_applyWsTitle": "应用工作区：$1",
    "app_panelNameTitle": "点击更换站点",
    "app_aiPanelType": "AI 对话",
    "app_searchPanelType": "搜索引擎",
    "app_statusReady": "就绪",
    "app_refreshTitle": "刷新面板",
    "app_refreshStatus": "刷新中…",
    "app_openNewTabTitle": "在新标签页打开",
    "app_removeTitle": "移除面板",
    "app_removeShort": "移除",
    "app_moveUp": "上移",
    "app_moveDown": "下移",
    "app_applyWs": "应用",
    "app_applyWsTitle2": "应用此工作区",
    "app_deleteTitle": "删除",
    "app_customTag": "自定义",
    "app_emptyPanels": "暂无面板 —— 点右上角「＋ 面板」添加，或在顶栏选择一个工作区",
    "app_statusPreview": "预览模式：需加载扩展后才能真正对话",
    "app_statusNotReady": "面板未就绪，请刷新后重试",
    "app_statusSending": "发送中…",
    "app_statusTimeout": "超时未确认",
    "app_statusSendFailed": "发送失败",
    "app_statusSearching": "搜索中…",
    "app_statusSentWaiting": "已发送，等待回复…",
    "app_statusLoggedOut": "未登录或需登录",
    "app_statusNotFound": "未找到输入框（站点已改版）",
    "app_pickerNoMatch": "没有匹配的站点",
    "app_pickerReplaceTitle": "替换 “$1” 为…",
    "app_pickerAddTitle": "选择要添加的站点",
    "app_ceAlertPercent": "URL 模板必须包含 %s 占位符",
    "app_ceAlertScheme": "URL 必须以 http(s):// 开头",
    "app_ceAlertDuplicate": "同名引擎已存在",
    "app_wsAutoName": "工作区 $1",
    "app_searchTag": "搜索 · $1",

    "ws_aiFamily": "AI 全家桶",
    "ws_globalSearch": "全球搜索",
    "ws_chineseSearch": "中文搜索",

    "cat_general": "综合",
    "cat_chinese": "中文",
    "cat_academic": "学术",
    "cat_community": "社区",
    "cat_dev": "开发",
    "cat_video": "视频",
    "cat_finance": "财经",
    "cat_news": "新闻",
    "cat_entertainment": "娱乐",
    "cat_dictionary": "词典",
    "cat_design": "设计",
    "cat_shopping": "购物",

    "popup_brand2": "多引擎搜索",
    "popup_desc": "一个页面同时打开多个搜索引擎与 AI 对话，底部输入一次，全部面板同时搜索、同时开始对话。",
    "popup_open": "打开 Multi AI 页面",
    "popup_hint": "提示：首次使用请先在各个 AI 站点登录；面板右上角「↗」可在新标签页打开站点登录。",

    "ctx_main": "Multi AI 搜索",
    "ctx_current": "用当前工作区搜索“%s”",
    "ctx_wsItem": "$1：“%s”",

    "ad_noAdapter": "无适配器",
    "ad_looksLoggedOut": "疑似未登录或处于登录页",
    "ad_inputNotFound": "未找到输入框（站点结构可能已变化）",
    "ad_sentCleared": "已发送（$1，输入框已清空）",
    "ad_notConfirmed": "文字已填入，但发送未确认（按钮可能未点亮或站点改版）"
  };

  var CATS = {
    "通用": "general", "中文": "chinese", "学术": "academic", "社区": "community",
    "开发": "dev", "视频": "video", "财经": "finance", "新闻": "news",
    "娱乐": "entertainment", "词典": "dictionary", "设计": "design", "购物": "shopping"
  };

  function sub(s, args) {
    if (!args || !args.length) return s;
    return s.replace(/\$(\d)/g, function (m, i) {
      var idx = parseInt(i, 10) - 1;
      return idx >= 0 && idx < args.length ? args[idx] : m;
    });
  }

  function t(key, args) {
    var s = "";
    try {
      if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
        s = chrome.i18n.getMessage(key, args) || "";
      }
    } catch (e) { /* 忽略 */ }
    if (!s) s = sub(FALLBACK[key] || key, args);
    return s;
  }

  function catName(cat) {
    return t("cat_" + (CATS[cat] || "general"));
  }

  global.MAI18N = { t: t, catName: catName, FALLBACK: FALLBACK };
})(typeof window !== "undefined" ? window : self);
