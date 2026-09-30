/* Multi AI 内容脚本（all_frames 注入）
 * 监听主页面发来的 {action:"handle-<站点名>", value, requestId} 消息，
 * 由对应站点的 iframe 执行「定位输入框 → 注入文本 → 触发 input → 点击发送/Enter」，
 * 并异步回执 {requestId, status}。
 * 站点 DOM 改版时优先维护本文件顶部的 ADAPTERS 注册表（选择器多级回退）。
 */
(function () {
  "use strict";

  /* ---------- 通用回退选择器 ---------- */
  var GENERIC_INPUTS = [
    'textarea[placeholder]',
    '[contenteditable="true"]',
    'div[role="textbox"]',
    'textarea'
  ];
  var GENERIC_SUBMITS = [
    'button[type="submit"]',
    'button[aria-label*="send" i]',
    'button[aria-label*="Send" i]',
    '[aria-label*="发送"]',
    'button[class*="send" i]',
    'button[class*="Send" i]',
    '.send-button'
  ];

  /* ---------- 站点适配器注册表 ----------
   * inputSelectors  输入框候选（按顺序尝试，找不到再用通用回退）
   * submitSelectors 发送按钮候选（同上）
   * preSubmitDelay  注入后等待（ms）
   * postSubmitWait  发送后等待（ms），用于判断输入框是否清空
   */
  var ADAPTERS = {
    "豆包": {
      inputSelectors: [
        'textarea[class*="chat"]',
        'textarea[placeholder*="问我"]',
        'textarea[placeholder*="输入"]',
        'div[class*="chat-input"] textarea',
        '[contenteditable="true"][class*="input"]'
      ],
      submitSelectors: [
        'button[aria-label*="发送"]',
        'button[class*="发送"]',
        'button[type="submit"]'
      ]
    },
    "DeepSeek": {
      inputSelectors: [
        'textarea[placeholder*="DeepSeek"]',
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="输入"]',
        '#chat-input',
        'textarea'
      ],
      submitSelectors: [
        'div[role="button"]._7436101',
        'button[aria-label*="Send"]',
        'button[type="submit"]'
      ]
    },
    "通义千问": {
      inputSelectors: [
        '.message-input-textarea',
        '#chat-input',
        'textarea[placeholder]',
        '[contenteditable="true"]'
      ],
      submitSelectors: [
        '.send-button',
        '#send-message-button',
        'button[aria-label*="发送"]',
        '[aria-label*="发送消息"]',
        'button[type="submit"]'
      ],
      preSubmitDelay: 1200,   /* 千问页面较重，留足时间等发送按钮被 React 点亮 */
      enableWait: 6000
    },
    "腾讯元宝": {
      inputSelectors: [
        'textarea[placeholder]',
        '[contenteditable="true"]',
        '.ql-editor',
        'div[class*="input"] textarea'
      ],
      submitSelectors: [
        'button[aria-label*="发送"]',
        'button[class*="发送"]',
        'button[type="submit"]'
      ]
    },
    "Kimi": {
      inputSelectors: [
        '.chat-input-editor',
        '[contenteditable="true"]',
        'div[class*="editor"][contenteditable]'
      ],
      submitSelectors: [
        '.send-button-container',
        'button[aria-label*="发送"]',
        'button[type="submit"]'
      ]
    },
    "ChatGPT": {
      inputSelectors: [
        '#prompt-textarea [contenteditable="true"]',
        '#prompt-textarea',
        'div[contenteditable="true"]'
      ],
      submitSelectors: [
        'button[aria-label="Send prompt"]',
        'button[aria-label*="Send"]',
        'button[data-testid="send-button"]'
      ]
    },
    "Claude": {
      inputSelectors: ['.ProseMirror', '[contenteditable="true"]'],
      submitSelectors: [
        'button[aria-label="Send Message"]',
        'button[aria-label="Send message"]',
        'button[aria-label*="Send"]'
      ]
    },
    "Gemini": {
      inputSelectors: ['.ql-editor', '[contenteditable="true"]'],
      submitSelectors: [
        'button[aria-label="Send message"]',
        'button[aria-label*="Send"]'
      ]
    },
    "Copilot": {
      inputSelectors: ['#userInput', 'textarea[placeholder]'],
      submitSelectors: [
        'button[aria-label="Submit message"]',
        'button[aria-label*="Submit"]',
        'button[type="submit"]'
      ]
    },
    "Poe": {
      inputSelectors: [
        'textarea[class*="GrowingTextArea"]',
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="Message"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label="Send message"]',
        '[data-button-send="true"]',
        'button[aria-label*="Send"]'
      ]
    },
    "Mistral": {
      inputSelectors: [
        '.ProseMirror',
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="message"]',
        'textarea'
      ],
      submitSelectors: [
        'button[aria-label="Send question"]',
        'button[aria-label="Send message"]',
        'button[type="submit"]'
      ]
    },
    "You": {
      inputSelectors: [
        '#search-input-textarea',
        'textarea[placeholder]',
        '[contenteditable="true"]'
      ],
      submitSelectors: [
        'button[type="submit"]',
        'button[aria-label*="Send"]'
      ]
    },
    "Yep": {
      inputSelectors: ['textarea[type="search"]', 'textarea[placeholder]'],
      submitSelectors: [
        'button[type="submit"]',
        'button[aria-label*="Send"]'
      ]
    },
    "Blackbox AI": {
      inputSelectors: [
        '#chat-input-box',
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="message"]',
        'textarea'
      ],
      submitSelectors: [
        'button[type="submit"]',
        'button[aria-label="Send"]',
        'button[aria-label*="Send"]'
      ]
    },
    "thinkany.ai": {
      inputSelectors: ['textarea[placeholder]', 'textarea'],
      submitSelectors: [
        'button[type="submit"]',
        '.send-button',
        'button[aria-label*="Send"]'
      ]
    },
    "Brave Leo": {
      inputSelectors: [
        'textarea[placeholder*="Leo"]',
        'textarea[placeholder*="Ask"]',
        'textarea'
      ],
      submitSelectors: [
        'button[type="submit"]',
        'button[aria-label*="Submit"]',
        'button[aria-label*="Send"]'
      ]
    }
  };

  /* ---------- 工具函数 ---------- */

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function isInputLike(el) {
    if (!el || !el.isConnected) return false;
    var tag = el.tagName;
    return tag === "TEXTAREA" || tag === "INPUT" || el.isContentEditable || el.getAttribute("contenteditable") === "true";
  }

  /* 定位输入框：先站点专属选择器，再通用回退；动态出现的输入框会轮询等待（最长 9s） */
  async function findInput(adapter) {
    var deadline = Date.now() + 9000;
    var selectors = adapter.inputSelectors.concat(GENERIC_INPUTS);
    while (Date.now() < deadline) {
      for (var i = 0; i < selectors.length; i++) {
        try {
          var el = document.querySelector(selectors[i]);
          if (isInputLike(el)) return el;
        } catch (e) { /* 忽略非法选择器 */ }
      }
      await wait(400);
    }
    return null;
  }

  /* 对 React 受控组件更可靠的赋值：走原生 value setter，避免被框架覆盖 */
  function setNativeValue(el, value) {
    var proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) {
      desc.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function currentText(el) {
    if (!el || !el.isConnected) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    return el.textContent || "";
  }

  function setValue(el, text) {
    try { el.focus(); } catch (e) {}
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      setNativeValue(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      /* contenteditable 富文本（ProseMirror / Slate / Lexical / 自定义编辑器）：
       * 1) 先派发带 data 的 beforeinput —— 这类编辑器监听 beforeinput 自行插入并更新内部状态
       *    （是否 preventDefault 不重要，以 DOM 是否出现文本为准）；
       * 2) DOM 无变化时再用 execCommand 兜底；
       * 3) 最后补一个不带 data 的 input 事件点亮发送按钮。
       * 严禁补发带 inputType/data 的 input 事件，避免框架二次插入造成文字重复。 */
      var before = null;
      try {
        before = new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true });
      } catch (e) { /* 忽略 */ }
      if (before) {
        try { el.dispatchEvent(before); } catch (e) { /* 忽略 */ }
      }
      if (currentText(el).indexOf(text) < 0) {
        var ok = false;
        if (document.execCommand && typeof document.execCommand === "function") {
          ok = document.execCommand("insertText", false, text);
        }
        if (!ok && currentText(el).indexOf(text) < 0) {
          el.textContent = text;
        }
      }
      try {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (e) { /* 忽略 */ }
    }
  }

  function visible(el) {
    if (!el || !el.isConnected) return false;
    if (el.offsetParent === null && el.getBoundingClientRect().height === 0) return false;
    var cs = window.getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }

  function findSubmit(adapter) {
    var selectors = adapter.submitSelectors.concat(GENERIC_SUBMITS);
    for (var i = 0; i < selectors.length; i++) {
      try {
        var list = document.querySelectorAll(selectors[i]);
        for (var j = 0; j < list.length; j++) {
          if (visible(list[j])) return list[j];
        }
      } catch (e) { /* 忽略非法选择器 */ }
    }
    return null;
  }

  /* 等待发送按钮从 disabled 变为可点（多数 AI 站输入后按钮才点亮），超时返回 null */
  async function waitEnabled(el, timeout) {
    var deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (!el.isConnected) return null;
      var dis = el.disabled || el.getAttribute("aria-disabled") === "true";
      if (!dis) return el;
      await wait(300);
    }
    return el;
  }

  function pressEnter(el) {
    var opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent("keydown", opts));
    el.dispatchEvent(new KeyboardEvent("keyup", opts));
  }

  function inputEmpty(el) {
    if (!el || !el.isConnected) return true;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      return !el.value || el.value.trim() === "";
    }
    return !el.textContent || el.textContent.trim() === "";
  }

  /* ---------- 国际化 ---------- */
  function t(key, args) {
    try { return MAI18N ? MAI18N.t(key, args) : key; } catch (e) { return key; }
  }

  /* 粗略判断当前页面是否处于登录页/未登录态（多语言登录词库） */
  function looksLoggedOut() {
    var hints = [
      "登录", "登入", "注册", "Log in", "Sign in", "Login", "Sign up",
      "ログイン", "로그인", "Se connecter", "Connexion", "Anmelden", "Einloggen",
      "Iniciar sesión", "Acceder", "Entrar", "Fazer login", "Войти", "Вход", "تسجيل الدخول"
    ];
    var els = document.querySelectorAll("button, a, [role='button']");
    var n = Math.min(els.length, 120);
    for (var i = 0; i < n; i++) {
      var t = (els[i].textContent || "").trim();
      if (t && t.length < 24) {
        for (var k = 0; k < hints.length; k++) {
          if (t === hints[k] || t.indexOf(hints[k]) === 0) return true;
        }
      }
    }
    return false;
  }

  async function perform(siteName, value, requestId) {
    var adapter = ADAPTERS[siteName];
    if (!adapter) return { requestId: requestId, status: "not_found", detail: t("ad.noAdapter") };

    var input = await findInput(adapter);
    if (!input) {
      var loggedOut = looksLoggedOut();
      return {
        requestId: requestId,
        status: loggedOut ? "logged_out" : "not_found",
        detail: loggedOut ? t("ad.looksLoggedOut") : t("ad.inputNotFound")
      };
    }

    /* 幂等保护：若输入框里已恰好是本条文本（例如重复消息/双击），不再插入，避免文字重复 */
    var cur = currentText(input);
    if (cur.trim() !== value.trim()) {
      setValue(input, value);
    }
    await wait(adapter.preSubmitDelay || 250);

    var btn = findSubmit(adapter);
    var method = "enter";
    if (btn) {
      btn = await waitEnabled(btn, adapter.enableWait || 4000);
      if (btn) {
        try { btn.click(); method = "click"; } catch (e) { method = "enter"; }
      }
    }
    if (method === "enter") pressEnter(input);

    await wait(adapter.postSubmitWait || 900);
    var cleared = inputEmpty(input);
    if (!cleared && method === "click") {
      /* 点击疑似未生效（按钮刚点亮/点击被吞）：补一次回车；回车后输入框清空说明发送成功 */
      pressEnter(input);
      await wait(adapter.postSubmitWait || 900);
      cleared = inputEmpty(input);
      method = cleared ? "click+enter" : method;
    }
    var detail = cleared ? t("ad.sentCleared", [method]) : t("ad.notConfirmed");
    return {
      requestId: requestId,
      status: "ok",
      detail: detail
    };
  }

  /* ---------- 消息监听 ---------- */

  /* 通道 A：主页面直接向本 iframe 发送 postMessage（精准、仅作用于本面板） */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || !d.__multiAi) return;
    var action = d.action || "";
    if (action.indexOf("handle-") !== 0) return;
    var siteName = action.slice("handle-".length);
    if (!ADAPTERS[siteName]) return;
    perform(siteName, d.value || "", d.requestId || "").then(function (resp) {
      resp.__multiAi = true;
      if (e.source) {
        try { e.source.postMessage(resp, "*"); } catch (err) { /* 忽略 */ }
      }
    });
  });

  /* 通道 B：chrome.runtime 消息（兼容旧路径，例如标签页级广播） */
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg || typeof msg.action !== "string" || msg.action.indexOf("handle-") !== 0) return false;
    var siteName = msg.action.slice("handle-".length);
    if (!ADAPTERS[siteName]) return false;
    perform(siteName, msg.value || "", msg.requestId || "").then(sendResponse);
    return true; /* 异步回执，保持消息通道打开 */
  });
})();
