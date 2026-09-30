/* Multi AI 站点清单（主页面与后台共用） */
/* 注意：本文件同时被 Service Worker（importScripts）与页面（<script>）加载，只能用 var 声明全局，勿用 window.xxx */

var SITES_AI = [
  { name: "豆包",      home: "https://www.doubao.com/chat",            cat: "AI" },
  { name: "DeepSeek",  home: "https://chat.deepseek.com/",             cat: "AI" },
  { name: "通义千问",   home: "https://www.tongyi.com/qianwen/",         cat: "AI" },
  { name: "腾讯元宝",   home: "https://yuanbao.tencent.com/",           cat: "AI" },
  { name: "Kimi",      home: "https://www.kimi.com/",                  cat: "AI" },
  { name: "ChatGPT",   home: "https://chatgpt.com/",                   cat: "AI" },
  { name: "Claude",    home: "https://claude.ai/",                     cat: "AI" },
  { name: "Gemini",    home: "https://gemini.google.com/",             cat: "AI" },
  { name: "Copilot",   home: "https://copilot.microsoft.com/",         cat: "AI" },
  { name: "Poe",       home: "https://poe.com/",                       cat: "AI" },
  { name: "Mistral",   home: "https://chat.mistral.ai/",               cat: "AI" },
  { name: "You",       home: "https://you.com/?chatMode=default",      cat: "AI" },
  { name: "Yep",       home: "https://yep.com/chat/",                  cat: "AI" },
  { name: "Blackbox AI", home: "https://app.blackbox.ai/",             cat: "AI" },
  { name: "thinkany.ai", home: "https://thinkany.ai/",                 cat: "AI" },
  { name: "Brave Leo", home: "https://search.brave.com/chat",          cat: "AI" }
];

var SITES_SEARCH = [
  { name: "Google",          home: "https://www.google.com/",        searchUrl: "https://www.google.com/search?q=%s",          cat: "通用" },
  { name: "百度",             home: "https://www.baidu.com/",         searchUrl: "https://www.baidu.com/s?wd=%s",               cat: "中文" },
  { name: "Bing",            home: "https://www.bing.com/",          searchUrl: "https://www.bing.com/search?q=%s",            cat: "通用" },
  { name: "必应中国",         home: "https://cn.bing.com/",           searchUrl: "https://cn.bing.com/search?q=%s",             cat: "中文" },
  { name: "搜狗",             home: "https://www.sogou.com/",         searchUrl: "https://www.sogou.com/web?query=%s",          cat: "中文" },
  { name: "知乎",             home: "https://www.zhihu.com/",         searchUrl: "https://www.zhihu.com/search?type=content&q=%s", cat: "中文" },
  { name: "DuckDuckGo",     home: "https://duckduckgo.com/",        searchUrl: "https://duckduckgo.com/?q=%s",                cat: "通用" },
  { name: "Brave Search",   home: "https://search.brave.com/",      searchUrl: "https://search.brave.com/search?q=%s",         cat: "通用" },
  { name: "Yahoo",          home: "https://search.yahoo.com/",      searchUrl: "https://search.yahoo.com/search?q=%s",         cat: "通用" },
  { name: "Yandex",         home: "https://yandex.com/",            searchUrl: "https://yandex.com/search/?text=%s",           cat: "通用" },
  { name: "Startpage",      home: "https://www.startpage.com/",     searchUrl: "https://www.startpage.com/sp/search?query=%s", cat: "通用" },
  { name: "Mojeek",         home: "https://www.mojeek.com/",        searchUrl: "https://www.mojeek.com/search?q=%s",           cat: "通用" },
  { name: "Ecosia",         home: "https://www.ecosia.org/",        searchUrl: "https://www.ecosia.org/search?q=%s",           cat: "通用" },
  { name: "Google Scholar", home: "https://scholar.google.com/",    searchUrl: "https://scholar.google.com/scholar?q=%s",      cat: "学术" },
  { name: "arXiv",          home: "https://arxiv.org/",             searchUrl: "https://arxiv.org/search/?query=%s&searchtype=all", cat: "学术" },
  { name: "Wikipedia",      home: "https://en.wikipedia.org/",      searchUrl: "https://en.wikipedia.org/w/index.php?search=%s", cat: "通用" },
  { name: "Reddit",         home: "https://www.reddit.com/",        searchUrl: "https://www.reddit.com/search/?q=%s",          cat: "社区" },
  { name: "GitHub",         home: "https://github.com/",            searchUrl: "https://github.com/search?q=%s&type=repositories", cat: "开发" },
  { name: "Stack Overflow", home: "https://stackoverflow.com/",     searchUrl: "https://stackoverflow.com/search?q=%s",        cat: "开发" },
  { name: "MDN",            home: "https://developer.mozilla.org/", searchUrl: "https://developer.mozilla.org/en-US/search?q=%s", cat: "开发" },
  { name: "NPM",            home: "https://www.npmjs.com/",         searchUrl: "https://www.npmjs.com/search?q=%s",            cat: "开发" },
  { name: "PyPI",           home: "https://pypi.org/",              searchUrl: "https://pypi.org/search/?q=%s",               cat: "开发" },
  { name: "Docker Hub",     home: "https://hub.docker.com/",        searchUrl: "https://hub.docker.com/search?q=%s",           cat: "开发" },
  { name: "Hugging Face",   home: "https://huggingface.co/",        searchUrl: "https://huggingface.co/models?search=%s",      cat: "开发" },
  { name: "Hacker News",    home: "https://news.ycombinator.com/",  searchUrl: "https://hn.algolia.com/?q=%s",                 cat: "社区" },
  { name: "YouTube",        home: "https://www.youtube.com/",       searchUrl: "https://www.youtube.com/results?search_query=%s", cat: "视频" },
  { name: "哔哩哔哩",        home: "https://www.bilibili.com/",      searchUrl: "https://search.bilibili.com/all?keyword=%s",   cat: "视频" },
  { name: "微博",            home: "https://weibo.com/",             searchUrl: "https://s.weibo.com/weibo?q=%s",              cat: "中文" },
  { name: "Yahoo Finance",  home: "https://finance.yahoo.com/",     searchUrl: "https://finance.yahoo.com/quote/%s",           cat: "财经" },
  { name: "Google News",    home: "https://news.google.com/",       searchUrl: "https://news.google.com/search?q=%s",          cat: "新闻" },
  { name: "Reuters",        home: "https://www.reuters.com/",       searchUrl: "https://www.reuters.com/site-search/?query=%s", cat: "新闻" },
  { name: "BBC",            home: "https://www.bbc.co.uk/",         searchUrl: "https://www.bbc.co.uk/search?q=%s",            cat: "新闻" },
  { name: "IMDb",           home: "https://www.imdb.com/",          searchUrl: "https://www.imdb.com/find?q=%s",               cat: "娱乐" },
  { name: "Dictionary.com", home: "https://www.dictionary.com/",    searchUrl: "https://www.dictionary.com/browse/%s",         cat: "词典" },
  { name: "Merriam-Webster", home: "https://www.merriam-webster.com/", searchUrl: "https://www.merriam-webster.com/dictionary/%s", cat: "词典" },
  { name: "Unsplash",       home: "https://unsplash.com/",          searchUrl: "https://unsplash.com/s/photos/%s",             cat: "设计" },
  { name: "Product Hunt",   home: "https://www.producthunt.com/",   searchUrl: "https://www.producthunt.com/search?q=%s",      cat: "社区" },
  { name: "京东",            home: "https://www.jd.com/",            searchUrl: "https://search.jd.com/Search?keyword=%s",      cat: "购物" },
  { name: "淘宝",            home: "https://www.taobao.com/",        searchUrl: "https://s.taobao.com/search?q=%s",             cat: "购物" }
];

/* 默认面板（Q1 确认：AI×5 + 搜索×1） */
var DEFAULT_PANELS = ["豆包", "DeepSeek", "通义千问", "腾讯元宝", "Kimi", "Google"];

/* 默认工作区 */
var DEFAULT_WORKSPACES = [
  { id: "ws-ai",     name: "AI 全家桶", engines: ["豆包", "DeepSeek", "通义千问", "腾讯元宝", "Kimi", "ChatGPT"] },
  { id: "ws-global", name: "全球搜索",  engines: ["Google", "Bing", "DuckDuckGo", "Brave Search"] },
  { id: "ws-cn",     name: "中文搜索",  engines: ["百度", "搜狗", "必应中国", "知乎"] }
];

/* 查找站点定义 */
function findSite(name) {
  var i;
  for (i = 0; i < SITES_AI.length; i++) if (SITES_AI[i].name === name) return { site: SITES_AI[i], type: "ai" };
  for (i = 0; i < SITES_SEARCH.length; i++) if (SITES_SEARCH[i].name === name) return { site: SITES_SEARCH[i], type: "search" };
  return null;
}
