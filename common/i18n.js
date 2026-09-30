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

    "app.subtitle": "多引擎同搜 · 多 AI 同问",
    "app.addPanel": "＋ 面板",
    "app.addPanelTitle": "添加面板",
    "app.settings": "⚙ 设置",
    "app.settingsTitle": "设置",
    "app.previewBanner": "预览模式（未加载扩展）：AI 面板对话不会真正发生。完整功能请在 <b>chrome://extensions</b> 开启「开发者模式」→「加载已解压的扩展程序」，选择 <b>multi-ai</b> 目录。",
    "app.previewOk": "知道了",
    "app.queryPlaceholder": "输入内容，回车或点发送 —— 所有面板同时搜索 / 同时开始对话",
    "app.send": "发送",
    "app.closeTitle": "关闭",
    "app.themeSection": "主题",
    "app.themeDark": "深色",
    "app.themeLight": "浅色",
    "app.panelsSection": "面板（数量可自定义，自动平分整行宽度）",
    "app.addPanel2": "＋ 添加面板",
    "app.wsSection": "工作区",
    "app.saveWs": "把当前面板存为工作区",
    "app.ceSection": "自定义搜索引擎",
    "app.ceNamePlaceholder": "名称（如：我的引擎）",
    "app.ceUrlPlaceholder": "URL 模板，含 %s（如 https://x.com/search?q=%s）",
    "app.addBtn": "添加",
    "app.pickerTitle": "选择站点",
    "app.pickerSearchPlaceholder": "搜索站点…",
    "app.pickerTabAll": "全部",
    "app.pickerTabAi": "AI",
    "app.pickerTabSearch": "搜索",
    "app.pickerTabCustom": "自定义",
    "app.customChip": "自定义",
    "app.applyWsTitle": "应用工作区：$1",
    "app.panelNameTitle": "点击更换站点",
    "app.aiPanelType": "AI 对话",
    "app.searchPanelType": "搜索引擎",
    "app.statusReady": "就绪",
    "app.refreshTitle": "刷新面板",
    "app.refreshStatus": "刷新中…",
    "app.openNewTabTitle": "在新标签页打开",
    "app.removeTitle": "移除面板",
    "app.removeShort": "移除",
    "app.moveUp": "上移",
    "app.moveDown": "下移",
    "app.applyWs": "应用",
    "app.applyWsTitle2": "应用此工作区",
    "app.deleteTitle": "删除",
    "app.customTag": "自定义",
    "app.emptyPanels": "暂无面板 —— 点右上角「＋ 面板」添加，或在顶栏选择一个工作区",
    "app.statusPreview": "预览模式：需加载扩展后才能真正对话",
    "app.statusNotReady": "面板未就绪，请刷新后重试",
    "app.statusSending": "发送中…",
    "app.statusTimeout": "超时未确认",
    "app.statusSendFailed": "发送失败",
    "app.statusSearching": "搜索中…",
    "app.statusSentWaiting": "已发送，等待回复…",
    "app.statusLoggedOut": "未登录或需登录",
    "app.statusNotFound": "未找到输入框（站点已改版）",
    "app.pickerNoMatch": "没有匹配的站点",
    "app.pickerReplaceTitle": "替换 “$1” 为…",
    "app.pickerAddTitle": "选择要添加的站点",
    "app.ceAlertPercent": "URL 模板必须包含 %s 占位符",
    "app.ceAlertScheme": "URL 必须以 http(s):// 开头",
    "app.ceAlertDuplicate": "同名引擎已存在",
    "app.wsAutoName": "工作区 $1",
    "app.searchTag": "搜索 · $1",

    "ws.aiFamily": "AI 全家桶",
    "ws.globalSearch": "全球搜索",
    "ws.chineseSearch": "中文搜索",

    "cat.general": "综合",
    "cat.chinese": "中文",
    "cat.academic": "学术",
    "cat.community": "社区",
    "cat.dev": "开发",
    "cat.video": "视频",
    "cat.finance": "财经",
    "cat.news": "新闻",
    "cat.entertainment": "娱乐",
    "cat.dictionary": "词典",
    "cat.design": "设计",
    "cat.shopping": "购物",

    "popup.brand2": "多引擎搜索",
    "popup.desc": "一个页面同时打开多个搜索引擎与 AI 对话，底部输入一次，全部面板同时搜索、同时开始对话。",
    "popup.open": "打开 Multi AI 页面",
    "popup.hint": "提示：首次使用请先在各个 AI 站点登录；面板右上角「↗」可在新标签页打开站点登录。",

    "ctx.main": "Multi AI 搜索",
    "ctx.current": "用当前工作区搜索“%s”",
    "ctx.wsItem": "$1：“%s”",

    "ad.noAdapter": "无适配器",
    "ad.looksLoggedOut": "疑似未登录或处于登录页",
    "ad.inputNotFound": "未找到输入框（站点结构可能已变化）",
    "ad.sentCleared": "已发送（$1，输入框已清空）",
    "ad.notConfirmed": "文字已填入，但发送未确认（按钮可能未点亮或站点改版）"
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
    return t("cat." + (CATS[cat] || "general"));
  }

  global.MAI18N = { t: t, catName: catName, FALLBACK: FALLBACK };
})(typeof window !== "undefined" ? window : self);
