/* Multi AI 后台 Service Worker
 * 职责：1) 初始化默认配置 2) declarativeNetRequest 规则（去 CSP/Frame 头、移动 UA）
 *       3) 右键菜单 4) 安装/更新引导
 */
"use strict";

importScripts("common/sites.js");

const STORAGE = {
  theme: "dark",
  columns: 3,
  panels: DEFAULT_PANELS,
  workspaces: DEFAULT_WORKSPACES,
  activeWorkspace: "",
  customEngines: []
};

async function getSettings() {
  try {
    const raw = await chrome.storage.sync.get(null);
    const out = Object.assign({}, STORAGE);
    Object.keys(raw).forEach((k) => {
      if (raw[k] !== undefined) out[k] = raw[k];
    });
    return out;
  } catch (e) {
    return Object.assign({}, STORAGE);
  }
}

/* ---------- DNR 规则 ---------- */

function getExtensionId() {
  return chrome.runtime.id;
}

/* 规则 1000：对扩展页面发起的子框架请求，移除阻止 iframe 嵌入的响应头 */
function ruleRemoveHeaders() {
  return {
    id: 1000,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        { header: "X-Frame-Options", operation: "remove" },
        { header: "Frame-Options", operation: "remove" },
        { header: "Content-Security-Policy", operation: "remove" }
      ]
    },
    condition: {
      urlFilter: "*",
      resourceTypes: ["sub_frame"],
      initiatorDomains: [getExtensionId()]
    }
  };
}

/* 规则 1001：对搜索引擎子框架使用移动 UA，规避验证/同意页 */
function ruleMobileUA() {
  return {
    id: 1001,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        {
          header: "User-Agent",
          operation: "set",
          value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
        }
      ]
    },
    condition: {
      urlFilter: "*",
      resourceTypes: ["sub_frame"],
      initiatorDomains: [getExtensionId()],
      requestDomains: [
        "google.com", "www.google.com", "bing.com", "www.bing.com", "cn.bing.com",
        "search.yahoo.com", "duckduckgo.com", "www.duckduckgo.com",
        "baidu.com", "www.baidu.com", "sogou.com", "www.sogou.com"
      ]
    }
  };
}

async function installDnrRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1000, 1001],
      addRules: [ruleRemoveHeaders(), ruleMobileUA()]
    });
  } catch (e) {
    console.error("DNR install failed:", e);
  }
}

/* ---------- 右键菜单 ---------- */

async function rebuildMenus() {
  try {
    await new Promise((resolve) => {
      chrome.contextMenus.removeAll(() => {
        chrome.runtime.lastError;
        resolve();
      });
    });
    chrome.contextMenus.create({
      id: "msa-root",
      title: "Multi AI 搜索",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "msa-current",
      parentId: "msa-root",
      title: "用当前工作区搜索“%s”",
      contexts: ["selection"]
    });
    const s = await getSettings();
    if (s.workspaces && s.workspaces.length) {
      chrome.contextMenus.create({
        id: "msa-sep",
        parentId: "msa-root",
        type: "separator",
        contexts: ["selection"]
      });
      s.workspaces.forEach((w) => {
        chrome.contextMenus.create({
          id: "msa-ws-" + w.id,
          parentId: "msa-root",
          title: w.name + "：“%s”",
          contexts: ["selection"]
        });
      });
    }
  } catch (e) {
    console.error("menu rebuild failed:", e);
  }
}

function openAppPage(q, workspaceId) {
  let url = chrome.runtime.getURL("pages/app.html");
  const params = [];
  if (q) params.push("q=" + encodeURIComponent(q));
  if (workspaceId) params.push("wid=" + encodeURIComponent(workspaceId));
  if (params.length) url += "?" + params.join("&");
  chrome.tabs.create({ url });
}

/* ---------- 事件 ---------- */

chrome.runtime.onInstalled.addListener(async (details) => {
  const s = await getSettings();
  const need = {};
  Object.keys(STORAGE).forEach((k) => {
    if (s[k] === undefined) need[k] = STORAGE[k];
  });
  if (Object.keys(need).length) await chrome.storage.sync.set(need);
  await installDnrRules();
  await rebuildMenus();
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/app.html") });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await installDnrRules();
  await rebuildMenus();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.workspaces) rebuildMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  const q = info.selectionText;
  if (info.menuItemId === "msa-root" || info.menuItemId === "msa-current") {
    openAppPage(q, "");
  } else if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("msa-ws-")) {
    openAppPage(q, info.menuItemId.replace("msa-ws-", ""));
  }
});
