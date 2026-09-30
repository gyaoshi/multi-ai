/* Multi AI 主页面逻辑
 * 功能：面板网格渲染、面板数量/站点自定义、底部统一输入栏、
 *       搜索引擎 URL 分发、AI 站点消息分发与状态回执、工作区、自定义引擎、主题
 */
(function () {
  "use strict";

  var STORAGE_DEFAULTS = {
    theme: "dark",
    panels: DEFAULT_PANELS.slice(),
    workspaces: DEFAULT_WORKSPACES.slice(),
    activeWorkspace: "",
    customEngines: []
  };

  var state = null;                 // 当前设置（内存副本）
  var panelStates = [];             // 每个面板的 {status, text}
  var pending = {};                 // requestId -> {index, timer}
  var pickerCallback = null;        // 站点选择回调
  var pickerReplaceIndex = -1;      // -1 表示追加

  var MAX_PANELS = 12;
  var panelCache = {};          // 被移除面板的缓存（name -> element），恢复时复用 iframe 避免重载
  var CACHE_MAX = 8;

  /* 扩展环境探测：作为扩展页面运行时 chrome.* 可用；直接浏览器打开时降级 localStorage（便于预览调试） */
  var hasExt = !!(typeof chrome !== "undefined" && chrome.storage && chrome.runtime && chrome.runtime.id);
  var LS_KEY = "multi-ai-settings-v1";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 存储 ---------- */

  function loadSettings() {
    return new Promise(function (resolve) {
      var defaults = {};
      Object.keys(STORAGE_DEFAULTS).forEach(function (k) { defaults[k] = STORAGE_DEFAULTS[k]; });
      if (!hasExt) {
        try {
          var saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
          if (saved) Object.keys(saved).forEach(function (k) { defaults[k] = saved[k]; });
        } catch (e) { /* 忽略 */ }
        resolve(defaults);
        return;
      }
      chrome.storage.sync.get(null, function (raw) {
        Object.keys(raw).forEach(function (k) {
          if (defaults[k] !== undefined) defaults[k] = raw[k];
        });
        if (!Array.isArray(defaults.panels) || defaults.panels.length === 0) defaults.panels = STORAGE_DEFAULTS.panels.slice();
        if (!Array.isArray(defaults.workspaces)) defaults.workspaces = [];
        if (!Array.isArray(defaults.customEngines)) defaults.customEngines = [];
        resolve(defaults);
      });
    });
  }

  function saveSettings() {
    var data = {
      theme: state.theme,
      panels: state.panels,
      workspaces: state.workspaces,
      activeWorkspace: state.activeWorkspace,
      customEngines: state.customEngines
    };
    if (hasExt) {
      chrome.storage.sync.set(data);
    } else {
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* 忽略 */ }
    }
  }

  /* ---------- 站点工具 ---------- */

  function engineOf(name) {
    var i;
    for (i = 0; i < state.customEngines.length; i++) {
      if (state.customEngines[i].name === name) return { type: "search", url: state.customEngines[i].url };
    }
    for (i = 0; i < SITES_AI.length; i++) if (SITES_AI[i].name === name) return { type: "ai", url: SITES_AI[i].home };
    for (i = 0; i < SITES_SEARCH.length; i++) {
      if (SITES_SEARCH[i].name === name) return { type: "search", url: SITES_SEARCH[i].home, searchUrl: SITES_SEARCH[i].searchUrl };
    }
    return null;
  }

  function buildSearchUrl(name, q) {
    var i;
    for (i = 0; i < state.customEngines.length; i++) {
      if (state.customEngines[i].name === name) {
        return state.customEngines[i].url.replace(/%s/g, encodeURIComponent(q));
      }
    }
    for (i = 0; i < SITES_SEARCH.length; i++) {
      if (SITES_SEARCH[i].name === name) {
        return SITES_SEARCH[i].searchUrl.replace(/%s/g, encodeURIComponent(q));
      }
    }
    return null;
  }

  /* ---------- 渲染 ---------- */

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
  }

  function renderWorkspaces() {
    var wrap = $("workspaceChips");
    wrap.innerHTML = "";
    var chips = [{ id: "", name: "自定义" }];
    state.workspaces.forEach(function (w) { chips.push(w); });
    chips.forEach(function (c) {
      var el = document.createElement("span");
      el.className = "chip" + (state.activeWorkspace === c.id ? " active" : "");
      el.textContent = c.name;
      el.title = "应用工作区：" + c.name;
      el.addEventListener("click", function () {
        if (c.id) {
          state.panels = c.engines.slice();
          state.activeWorkspace = c.id;
        } else {
          state.activeWorkspace = "";
        }
        saveSettings();
        render();
      });
      wrap.appendChild(el);
    });
  }

  function setPanelStatus(index, status, text) {
    panelStates[index] = { status: status, text: text };
    var el = $("panel-status-" + index);
    if (!el) return;
    var dot = el.querySelector(".dot");
    var hot = (status === "ok") ? " ok" : (status === "sending" || status === "search") ? " sending" : (status === "err") ? " err" : "";
    dot.className = "dot" + hot;
    var label = el.querySelector(".st-text");
    label.textContent = text || "";
  }

  function buildPanel(name, index) {
    var def = engineOf(name);
    var card = document.createElement("section");
    card.className = "panel";
    card.dataset.name = name;
    card.dataset.index = String(index);

    var head = document.createElement("div");
    head.className = "panel-head";

    var nameEl = document.createElement("span");
    nameEl.className = "panel-name";
    nameEl.textContent = name;
    nameEl.title = "点击更换站点";
    nameEl.addEventListener("click", function () {
      var idx = parseInt(card.dataset.index, 10);
      openPicker("替换 “" + name + "” 为…", idx);
    });

    var typeEl = document.createElement("span");
    typeEl.className = "panel-type";
    typeEl.textContent = def && def.type === "ai" ? "AI 对话" : "搜索引擎";

    var statusEl = document.createElement("span");
    statusEl.className = "panel-status";
    statusEl.innerHTML = '<span class="dot"></span><span class="st-text">就绪</span>';

    var ops = document.createElement("span");
    ops.className = "panel-ops";
    ops.appendChild(iconBtn("↻", "刷新面板", function () {
      var idx = parseInt(card.dataset.index, 10);
      var frame = card.querySelector("iframe");
      if (frame) frame.src = frame.src;
      setPanelStatus(idx, "", "刷新中…");
      setTimeout(function () { setPanelStatus(idx, "", "就绪"); }, 400);
    }));
    ops.appendChild(iconBtn("↗", "在新标签页打开", function () {
      var frame = card.querySelector("iframe");
      if (frame && frame.src) window.open(frame.src, "_blank");
    }));
    ops.appendChild(iconBtn("✕", "移除面板", function () {
      var idx = parseInt(card.dataset.index, 10);
      state.panels.splice(idx, 1);
      state.activeWorkspace = "";
      saveSettings();
      render();
    }));

    head.appendChild(nameEl);
    head.appendChild(typeEl);
    head.appendChild(statusEl);
    head.appendChild(ops);

    var frame = document.createElement("iframe");
    frame.setAttribute("allow", "clipboard-write; clipboard-read");
    frame.setAttribute("loading", "lazy");
    var home = def ? def.url : "about:blank";
    setTimeout(function () { frame.src = home; }, index * 180);
    frame.addEventListener("load", function () {
      var idx = parseInt(card.dataset.index, 10);
      var st = panelStates[idx] && panelStates[idx].status;
      if (st === "sending" || st === "ok") return;
      setPanelStatus(idx, "", "就绪");
    });

    card.appendChild(head);
    card.appendChild(frame);
    panelStates[index] = { status: "", text: "就绪" };
    return card;
  }

  function iconBtn(symbol, title, onClick) {
    var b = document.createElement("button");
    b.className = "btn small ghost";
    b.textContent = symbol;
    b.title = title;
    b.addEventListener("click", function (e) { e.stopPropagation(); onClick(); });
    return b;
  }

  /* 增量渲染：只增删/重排面板，复用已有 iframe，避免调整面板时所有页面重载 */
  function renderPanels() {
    var grid = $("grid");
    var n = state.panels.length;
    grid.style.gridTemplateColumns = "repeat(" + Math.max(1, n) + ", minmax(0, 1fr))";

    if (n === 0) {
      if (!grid.querySelector(".empty-hint")) {
        var empty = document.createElement("div");
        empty.className = "empty-hint";
        empty.textContent = "暂无面板 —— 点右上角「＋ 面板」添加，或在顶栏选择一个工作区";
        grid.appendChild(empty);
      }
    } else {
      var eh = grid.querySelector(".empty-hint");
      if (eh) eh.parentNode.removeChild(eh);
    }

    /* 移除不在清单里的面板（先入缓存，恢复时不重载） */
    Array.prototype.slice.call(grid.querySelectorAll(".panel")).forEach(function (el) {
      if (state.panels.indexOf(el.dataset.name) < 0) {
        panelCache[el.dataset.name] = el;
        el.parentNode.removeChild(el);
        var keys = Object.keys(panelCache);
        if (keys.length > CACHE_MAX) {
          var old = panelCache[keys[0]];
          var of = old.querySelector("iframe");
          if (of) of.src = "about:blank";
          delete panelCache[keys[0]];
        }
      }
    });

    /* 复用 / 新建 / 重排 */
    state.panels.forEach(function (name, i) {
      var def = engineOf(name);
      if (!def) return;
      var el = null;
      var kids = grid.children;
      for (var c = 0; c < kids.length; c++) {
        if (kids[c].dataset && kids[c].dataset.name === name) { el = kids[c]; break; }
      }
      if (!el) {
        el = panelCache[name];
        if (el) {
          delete panelCache[name];
          grid.appendChild(el);          /* 复用缓存面板，iframe 不重载 */
        } else {
          el = buildPanel(name, i);
          grid.appendChild(el);
        }
      }
      el.dataset.index = String(i);
      var fr = el.querySelector("iframe");
      if (fr) fr.id = "iframe-" + i;
      var ty = el.querySelector(".panel-type");
      if (ty) ty.id = "panel-type-" + i;
      var st = el.querySelector(".panel-status");
      if (st) st.id = "panel-status-" + i;
      if (!panelStates[i]) panelStates[i] = { status: "", text: "就绪" };
      if (grid.children[i] !== el) grid.appendChild(el);   /* appendChild 移动不重载 iframe */
    });
  }

  function render() {
    applyTheme();
    renderWorkspaces();
    renderPanels();
    if ($("panelCount")) $("panelCount").textContent = state.panels.length;
    $("btnAddPanel").style.visibility = state.panels.length >= MAX_PANELS ? "hidden" : "visible";
    var radios = document.querySelectorAll('input[name="theme"]');
    for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === state.theme;
    renderPanelList();
    renderWsList();
    renderCustomList();
  }

  /* ---------- 输入与分发 ---------- */

  function sendToAiPanel(index, name, q) {
    if (!hasExt) {
      /* 预览模式：没有内容脚本，AI 对话不会发生，给出明确提示 */
      setPanelStatus(index, "err", "预览模式：需加载扩展后才能真正对话");
      return;
    }
    var frame = $("iframe-" + index);
    if (!frame || !frame.contentWindow) {
      setPanelStatus(index, "err", "面板未就绪，请刷新后重试");
      return;
    }
    var requestId = name + "-" + Date.now() + "-" + index;
    setPanelStatus(index, "sending", "发送中…");
    pending[requestId] = {
      index: index,
      timer: setTimeout(function () {
        if (pending[requestId]) {
          delete pending[requestId];
          setPanelStatus(index, "err", "超时未确认");
        }
      }, 15000)
    };
    /* 直接向本面板 iframe 分发（postMessage），内容脚本回执后更新状态 */
    try {
      frame.contentWindow.postMessage({ __multiAi: true, action: "handle-" + name, value: q, requestId: requestId }, "*");
    } catch (e) {
      clearTimeout(pending[requestId] && pending[requestId].timer);
      delete pending[requestId];
      setPanelStatus(index, "err", "发送失败");
    }
  }

  function dispatch(q) {
    if (!q || !q.trim()) return;
    q = q.trim();
    state.panels.forEach(function (name, i) {
      var def = engineOf(name);
      if (!def) return;
      if (def.type === "search") {
        var url = buildSearchUrl(name, q);
        if (!url) return;
        var frame = $("iframe-" + i);
        if (frame) {
          setPanelStatus(i, "search", "搜索中…");
          frame.src = url;
        }
      } else if (def.type === "ai") {
        sendToAiPanel(i, name, q);
      }
    });
  }

  var lastSend = { q: "", t: 0 };

  function triggerSend() {
    var input = $("query");
    var q = input.value.trim();
    if (!q) return;
    /* 防抖：同一内容 1.2 秒内重复触发（如双击发送）只分发一次 */
    var now = Date.now();
    if (q === lastSend.q && now - lastSend.t < 1200) return;
    lastSend.q = q;
    lastSend.t = now;
    dispatch(q);
  }

  /* ---------- 设置弹窗 ---------- */

  function renderPanelList() {
    var ul = $("panelList");
    ul.innerHTML = "";
    state.panels.forEach(function (name, i) {
      var li = document.createElement("li");
      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = name;
      var def = engineOf(name);
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = def && def.type === "ai" ? "AI" : "搜索";
      var ops = document.createElement("span");
      ops.className = "row";
      ops.appendChild(iconBtn("↑", "上移", function () {
        if (i === 0) return;
        var t = state.panels[i]; state.panels[i] = state.panels[i - 1]; state.panels[i - 1] = t;
        saveSettings(); render();
      }));
      ops.appendChild(iconBtn("↓", "下移", function () {
        if (i >= state.panels.length - 1) return;
        var t = state.panels[i]; state.panels[i] = state.panels[i + 1]; state.panels[i + 1] = t;
        saveSettings(); render();
      }));
      ops.appendChild(iconBtn("✕", "移除", function () {
        state.panels.splice(i, 1);
        saveSettings(); render();
      }));
      li.appendChild(nm);
      li.appendChild(tag);
      li.appendChild(ops);
      ul.appendChild(li);
    });
  }

  function renderWsList() {
    var ul = $("wsList");
    ul.innerHTML = "";
    state.workspaces.forEach(function (w) {
      var li = document.createElement("li");
      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = w.name + "（" + w.engines.join(" · ") + "）";
      nm.title = w.engines.join("、");
      var ops = document.createElement("span");
      ops.className = "row";
      ops.appendChild(iconBtn("应用", "应用此工作区", function () {
        state.panels = w.engines.slice();
        state.activeWorkspace = w.id;
        saveSettings(); render(); closeModal();
      }));
      ops.appendChild(iconBtn("✕", "删除", function () {
        state.workspaces = state.workspaces.filter(function (x) { return x.id !== w.id; });
        if (state.activeWorkspace === w.id) state.activeWorkspace = "";
        saveSettings(); render();
      }));
      li.appendChild(nm);
      li.appendChild(ops);
      ul.appendChild(li);
    });
  }

  function renderCustomList() {
    var ul = $("customList");
    ul.innerHTML = "";
    state.customEngines.forEach(function (c) {
      var li = document.createElement("li");
      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = c.name;
      nm.title = c.url;
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "自定义";
      var ops = document.createElement("span");
      ops.className = "row";
      ops.appendChild(iconBtn("✕", "删除", function () {
        state.customEngines = state.customEngines.filter(function (x) { return x.name !== c.name; });
        state.panels = state.panels.filter(function (p) { return p !== c.name; });
        saveSettings(); render();
      }));
      li.appendChild(nm);
      li.appendChild(tag);
      li.appendChild(ops);
      ul.appendChild(li);
    });
  }

  function openModal() { $("modal").classList.remove("hidden"); }
  function closeModal() { $("modal").classList.add("hidden"); }

  /* ---------- 站点选择器 ---------- */

  function openPicker(title, replaceIndex) {
    pickerReplaceIndex = typeof replaceIndex === "number" ? replaceIndex : -1;
    $("pickerTitle").textContent = title;
    $("pickerSearch").value = "";
    $("picker").classList.remove("hidden");
    renderPicker("全部");
  }

  function renderPicker(tab) {
    var list = [];
    var filter = ($("pickerSearch").value || "").trim().toLowerCase();

    function push(name, tag, cat) {
      if (tab !== "全部" && cat !== tab) return;
      if (filter && name.toLowerCase().indexOf(filter) < 0) return;
      list.push({ name: name, tag: tag });
    }

    SITES_AI.forEach(function (s) { push(s.name, "AI", "AI"); });
    SITES_SEARCH.forEach(function (s) { push(s.name, "搜索 · " + s.cat, "搜索"); });
    state.customEngines.forEach(function (c) { push(c.name, "自定义", "自定义"); });

    var ul = $("pickerList");
    ul.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "没有匹配的站点";
      ul.appendChild(empty);
      return;
    }
    list.forEach(function (item) {
      var li = document.createElement("li");
      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = item.name;
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = item.tag;
      li.appendChild(nm);
      li.appendChild(tag);
      li.addEventListener("click", function () {
        if (pickerReplaceIndex >= 0) {
          state.panels[pickerReplaceIndex] = item.name;
        } else {
          if (state.panels.length >= MAX_PANELS) return;
          state.panels.push(item.name);
        }
        state.activeWorkspace = "";
        saveSettings();
        render();
        $("picker").classList.add("hidden");
      });
      ul.appendChild(li);
    });
  }

  function setupPickerTabs() {
    var tabs = ["全部", "AI", "搜索", "自定义"];
    var wrap = $("pickerTabs");
    wrap.innerHTML = "";
    tabs.forEach(function (t) {
      var b = document.createElement("button");
      b.className = "tab" + (t === "全部" ? " active" : "");
      b.textContent = t;
      b.addEventListener("click", function () {
        var all = wrap.querySelectorAll(".tab");
        for (var i = 0; i < all.length; i++) all[i].classList.remove("active");
        b.classList.add("active");
        renderPicker(t);
      });
      wrap.appendChild(b);
    });
  }

  /* ---------- URL 参数（右键菜单入口） ---------- */

  function handleUrlParams() {
    var params = new URLSearchParams(location.search);
    var wid = params.get("wid");
    var q = params.get("q");
    if (wid) {
      var ws = state.workspaces.find(function (w) { return w.id === wid; });
      if (ws) {
        state.panels = ws.engines.slice();
        state.activeWorkspace = wid;
      }
    }
    if (q) {
      render();
      /* 等 AI 面板 iframe 加载完成后再自动分发，保证首次发送成功率 */
      var aiIndexes = [];
      state.panels.forEach(function (name, i) {
        var def = engineOf(name);
        if (def && def.type === "ai") aiIndexes.push(i);
      });
      var frames = aiIndexes.map(function (i) { return $("iframe-" + i); }).filter(Boolean);
      var deadline = Date.now() + 12000;
      var check = setInterval(function () {
        var ready = frames.every(function (f) { return f && f.contentWindow && f.src && f.src.indexOf("about:blank") < 0; });
        if (ready || Date.now() > deadline) {
          clearInterval(check);
          setTimeout(function () { dispatch(q); }, 300);
        }
      }, 400);
    } else {
      render();
    }
  }

  /* ---------- 事件绑定 ---------- */

  function bindEvents() {
    /* 接收内容脚本回执（postMessage 通道） */
    window.addEventListener("message", function (e) {
      var d = e.data;
      if (!d || !d.__multiAi || !d.requestId) return;
      var p = pending[d.requestId];
      if (!p) return;
      clearTimeout(p.timer);
      delete pending[d.requestId];
      var index = p.index;
      if (d.status === "ok") {
        var detail = (d.detail || "").slice(0, 24);
        setPanelStatus(index, "ok", detail || "已发送，等待回复…");
      } else if (d.status === "logged_out") {
        setPanelStatus(index, "err", "未登录或需登录");
      } else if (d.status === "not_found") {
        setPanelStatus(index, "err", "未找到输入框（站点已改版）");
      } else {
        setPanelStatus(index, "err", "发送失败");
      }
    });

    $("btnSend").addEventListener("click", triggerSend);
    $("query").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); triggerSend(); }
    });
    $("btnSettings").addEventListener("click", openModal);
    $("btnCloseModal").addEventListener("click", closeModal);
    $("modal").addEventListener("click", function (e) {
      if (e.target === $("modal")) closeModal();
    });
    $("btnAddPanel").addEventListener("click", function () { openPicker("选择要添加的站点", -1); });
    $("btnAddPanel2").addEventListener("click", function () { openPicker("选择要添加的站点", -1); });
    $("btnClosePicker").addEventListener("click", function () { $("picker").classList.add("hidden"); });
    $("picker").addEventListener("click", function (e) {
      if (e.target === $("picker")) $("picker").classList.add("hidden");
    });
    $("pickerSearch").addEventListener("input", function () {
      var active = $("pickerTabs").querySelector(".tab.active");
      renderPicker(active ? active.textContent : "全部");
    });

    var radios = document.querySelectorAll('input[name="theme"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener("change", function () {
        state.theme = this.value;
        saveSettings();
        applyTheme();
      });
    }

    $("btnSaveWs").addEventListener("click", function () {
      if (!state.panels.length) return;
      var n = 1;
      while (state.workspaces.some(function (w) { return w.name === "工作区 " + n; })) n++;
      state.workspaces.push({ id: "ws-" + Date.now(), name: "工作区 " + n, engines: state.panels.slice() });
      saveSettings();
      render();
    });

    $("btnAddCe").addEventListener("click", function () {
      var name = $("ceName").value.trim();
      var url = $("ceUrl").value.trim();
      if (!name || !url) return;
      if (url.indexOf("%s") < 0) { alert("URL 模板必须包含 %s 占位符"); return; }
      if (!/^https?:\/\//.test(url)) { alert("URL 必须以 http(s):// 开头"); return; }
      if (state.customEngines.some(function (c) { return c.name === name; })) { alert("同名引擎已存在"); return; }
      state.customEngines.push({ name: name, url: url });
      $("ceName").value = "";
      $("ceUrl").value = "";
      saveSettings();
      render();
    });

    setupPickerTabs();
  }

  /* ---------- 启动 ---------- */

  loadSettings().then(function (s) {
    state = s;
    bindEvents();
    handleUrlParams();
    /* 预览模式（未加载扩展）时显示提示横幅，用户点「知道了」后本次会话隐藏；?nb=1 直接隐藏（用于截图/嵌入） */
    if (!hasExt) {
      var nb = new URLSearchParams(location.search).get("nb") === "1";
      if (!nb) {
        try {
          if (localStorage.getItem("multi-ai-preview-dismissed") !== "1") $("previewBanner").classList.remove("hidden");
        } catch (e) { /* 忽略 */ }
      }
      $("btnCloseBanner").addEventListener("click", function () {
        $("previewBanner").classList.add("hidden");
        try { localStorage.setItem("multi-ai-preview-dismissed", "1"); } catch (e) { /* 忽略 */ }
      });
    }
  });
})();
