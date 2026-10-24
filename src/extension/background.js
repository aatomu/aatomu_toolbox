const booster = {
  height: 420,
  width: 300
}

const DefaultExtensionConfig = {
  enableCreeper: true,
  youtube: {
    isLiveAcceleration: false,
    liveAccelerationRate: 5
  },
  amazon: {
    greeting: "おはー",
    enableSecret: true,
    showBuyButton: false
  },
  secret: {
    name: "Atomu",
    postCode: "minecraft:over_world",
    address: "Minecraft",
  },
}

/** @type {Map<string, (text: string) => string>} */
const SearchUrlBuilders = new Map([
  ["amazon", (text) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(text)}`],
  ["yahoo_auction", (text) => `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(text)}`],
  ["yahoo_shop", (text) => `https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(text)}`],
  ["kakaku", (text) => `https://kakaku.com/search_results/${encodeURIComponent(text)}/`],
  ["youtube", (text) => `https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`],
  ["osu", (text) => `https://osu.ppy.sh/beatmapsets?q=${encodeURIComponent(text)}`],
  ["googleJP", (text) => `https://www.google.com/search?q=${encodeURIComponent(text)}&gl=jp&hl=ja&pws=0`],
  ["googleEN", (text) => `https://www.google.com/search?q=${encodeURIComponent(text)}&gl=us&hl=en&pws=0`],
  ["deepL_jp", (text) => `https://www.deepl.com/translator#ja/en/${encodeURIComponent(text)}`],
  ["deepL_en", (text) => `https://www.deepl.com/translator#en/ja/${encodeURIComponent(text)}`],
])

// 消したらService Checker使えない
console.log("Chrome Addon is Loaded!")


// MARK: onInstall
chrome.runtime.onInstalled.addListener(async () => {
  // 読み込み 通知
  console.log("Init Call")

  // MARK: > contextMenu
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({
    id: 'master',
    title: 'atomuの道具箱',
    contexts: ["all"]
  })

  // MARK: > storage
  // 既存の設定を壊さず、足りない初期値を補完する
  const storedConfig = await chrome.storage.local.get(null)
  const config = {
    ...DefaultExtensionConfig,
    ...storedConfig,
    youtube: { ...DefaultExtensionConfig.youtube, ...storedConfig.youtube },
    amazon: { ...DefaultExtensionConfig.amazon, ...storedConfig.amazon },
    secret: { ...DefaultExtensionConfig.secret, ...storedConfig.secret },
  }
  await chrome.storage.local.set(config)

  /** @type {chrome.contextMenus.CreateProperties[]} */
  const menuList = [
    // 常時表示
    { parentId: "master", id: 'jump_extension', title: 'Jump to extension', contexts: ["all"] },
    { parentId: "master", id: 'copy_link', title: 'Copy URL', contexts: ["all"] },
    { parentId: "master", id: 'view_creeper', title: 'View Creeper', type: 'checkbox', contexts: ["all"], checked: config.enableCreeper },
    { parentId: "master", id: 'volume_booster', title: 'Volume Booster', contexts: ["all"] },
    { parentId: "master", id: 'insert_function', title: '関数の挿入', contexts: ["all"] },
    { parentId: "insert_function", id: 'insert_check_variable', title: 'Check Variable', contexts: ["all"] },
    { parentId: "insert_function", id: 'insert_cloudflare_domain', title: 'CloudFlare Domain', contexts: ["all"] },
    // Shortのページのみ
    { parentId: "master", id: 'separator_short', type: 'separator', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/shorts/*"] },
    { parentId: "master", id: 'short2movie', title: 'Short To Movie', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/shorts/*"] },
    // 選択時のみ
    { parentId: "master", id: 'separator_select', type: 'separator', contexts: ["selection"] },
    { parentId: "master", id: 'append_h', title: 'Append Prefix h', contexts: ["selection"] },
    { parentId: "master", id: 'amazon', title: '検索: amazon', contexts: ["selection"] },
    { parentId: "master", id: 'yahoo_auction', title: '検索: ヤフオク', contexts: ["selection"] },
    { parentId: "master", id: 'yahoo_shop', title: '検索: ヤフーshop', contexts: ["selection"] },
    { parentId: "master", id: 'kakaku', title: '検索: 価格.com', contexts: ["selection"] },
    { parentId: "master", id: 'youtube', title: '検索: youtube', contexts: ["selection"] },
    { parentId: "master", id: 'osu', title: '検索: osu!', contexts: ["selection"] },
    { parentId: "master", id: 'googleJP', title: '検索: googleJP', contexts: ["selection"] },
    { parentId: "master", id: 'googleEN', title: '検索: googleEN', contexts: ["selection"] },
    { parentId: "master", id: 'deepL_jp', title: '翻訳: DeepL(jp-en)', contexts: ["selection"] },
    { parentId: "master", id: 'deepL_en', title: '翻訳: DeepL(en-ja)', contexts: ["selection"] }
  ]
  menuList.forEach(menu => {
    try {
      chrome.contextMenus.create(menu)
    } catch (e) {
      console.error("contextMenus.create", e)
    }
  })
})

// MARK: storage onChanged
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.enableCreeper) return
  chrome.contextMenus.update("view_creeper", {
    checked: Boolean(changes.enableCreeper.newValue)
  }).catch((error) => {
    console.warn("Failed to update creeper context menu:", error)
  })
})

// MARK: OpenInNewTab()
/**
 * @param {string} url
 * @param {chrome.tabs.Tab | undefined} tab
 */
function openInNewTab(url, tab) {
  if (!tab) {
    chrome.tabs.create({ url })
    return
  }
  chrome.tabs.create({ url, index: tab.index + 1 })
}

// MARK: InjectInsertFunctions()
/**
 * @param {number} tabId
 */
function injectInsertFunctions(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    files: ["src/extension/content/insert.js"],
  })
}

// MARK: menu onClick
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context Menu Click:")
  console.log("  Info:", info)
  console.log("  Tab:", tab)

  const selectionText = info.selectionText ?? ""
  const searchUrlBuilder = SearchUrlBuilders.get(String(info.menuItemId))
  if (searchUrlBuilder) {
    if (selectionText === "") return
    openInNewTab(searchUrlBuilder(selectionText), tab)
    return
  }

  switch (info.menuItemId) {
    case "jump_extension":
      openInNewTab('chrome://extensions/', tab)
      return
    case "copy_link":
      if (typeof tab?.id !== "number") return
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
          // url
          let url = window.location.href
          // Amazonのトラックを削除
          if (window.location.hostname.includes("amazon")) {
            url = window.location.origin + window.location.pathname.replace(/.*(\/dp\/.+?\/).*/, "$1")
          }
          // コピー
          const el = document.createElement('textarea')
          el.value = url
          el.setAttribute('readonly', '')
          el.style.position = 'absolute'
          el.style.left = '-9999px'
          document.body.appendChild(el)
          el.select()
          document.execCommand('copy')
          document.body.removeChild(el)
        }
      })
      return
    case "view_creeper":
      chrome.storage.local.set({ enableCreeper: info.checked })
      return

    case "volume_booster":
      if (typeof tab?.id !== "number") return
      chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("src/extension/booster/index.html") + `?id=${tab.id}`,
        width: booster.width,
        height: booster.height
      })
      return

    case "short2movie":
      // shortのページ以外で実行しない
      if (!tab?.url?.includes("youtube.com/shorts/")) {
        return
      }

      // 開く
      chrome.tabs.create({
        url: tab.url.replace("shorts/", "watch?v="),
        index: tab.index + 1
      })
      return

    case "append_h":
      if (typeof tab?.id !== "number" || selectionText === "") return
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function (text) { window.open(`h${text}`, "_blank") },
        args: [selectionText]
      })
      return

    case "insert_check_variable":
      if (typeof tab?.id !== "number") return
      injectInsertFunctions(tab.id)
        .then(() => chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: function () {
            const toolboxWindow = /** @type {any} */ (window)
            toolboxWindow.CheckVariable?.()
          }
        }))
        .catch((error) => console.error("Failed to run CheckVariable:", error))
      return

    case "insert_cloudflare_domain":
      if (typeof tab?.id !== "number") return
      injectInsertFunctions(tab.id)
        .then(() => chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: function () {
            const name = window.prompt("Domain name")
            if (!name) return
            const toolboxWindow = /** @type {any} */ (window)
            toolboxWindow.CloudFlareDomain?.(name)
          }
        }))
        .catch((error) => console.error("Failed to run CloudFlareDomain:", error))
      return
  }
})

// MARK: shortcut onCommand
chrome.commands.onCommand.addListener((command, tab) => {
  console.log(`Command: ${command}`);
  switch (command) {
    case "volume_booster":
      if (typeof tab?.id !== "number") return
      chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("src/extension/booster/index.html") + `?id=${tab.id}`,
        width: booster.width,
        height: booster.height
      })
      return
  }
});
