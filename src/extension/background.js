const booster = {
  height: 420,
  width: 300
}

// 消したらService Checker使えない
console.log("Chrome Addon is Loaded!")


// MARK: onInstall
chrome.runtime.onInstalled.addListener(async () => {
  // 読み込み 通知
  console.log("Init Call")

  // MARK: > contextMenu
  chrome.contextMenus.removeAll()
  chrome.contextMenus.create({
    id: 'master',
    title: 'atomuの道具箱',
    contexts: ["all"]
  })

  // MARK: > storage
  // いろんなやつの初期値
  let config = await chrome.storage.local.get(null)
  if (Object.keys(config).length === 0) {
    config = {
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
    chrome.storage.local.set(config)
  }

  /** @type {chrome.contextMenus.CreateProperties[]} */
  const menuList = [
    // 常時表示
    { parentId: "master", id: 'copy_link', title: 'Copy URL', contexts: ["all"] },
    { parentId: "master", id: 'view_creeper', title: 'View Creeper', type: 'checkbox', contexts: ["all"], checked: config.enableCreeper },
    { parentId: "master", id: 'volume_booster', title: 'Volume Booster', contexts: ["all"] },
    { parentId: "master", id: 'open_sidepanel', title: 'Open Sidepanel', contexts: ["all"] },
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

// MARK: menu onClick
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context Menu Click:")
  console.log("  Info:", info)
  console.log("  Tab:", tab)
  switch (info.menuItemId) {
    case "jump_extension":
      chrome.tabs.create({
        active: true,
        url: 'chrome://extensions/'
      }, null)
      return
    case "copy_link":
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
      chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("src/extension/booster/index.html") + `?id=${tab.id}`,
        width: booster.width,
        height: booster.height
      })
      return

    case "open_sidepanel":
      chrome.sidePanel.open({
        windowId: tab.windowId
      })
      return

    case "short2movie":
      // shortのページ以外で実行しない
      if (!tab.url.includes("youtube.com/shorts/")) {
        return
      }

      // 開く
      chrome.tabs.create({
        url: tab.url.replace("shorts/", "watch?v="),
        index: tab.index + 1
      })
      return

    case "append_h":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`h${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "amazon":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://www.amazon.co.jp/s?k=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "yahoo_auction":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://auctions.yahoo.co.jp/search/search?p=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "yahoo_shop":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://shopping.yahoo.co.jp/search?p=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "kakaku":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://kakaku.com/search_results/${window.getSelection().toString()}/`, "_blank") }
      })
      return
    case "youtube":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://www.youtube.com/results?search_query=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "osu":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://osu.ppy.sh/beatmapsets?q=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "googleJP":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://www.google.com/search?q=${window.getSelection().toString()}&gl=jp&hl=ja&pws=0`, "_blank") }
      })
      return
    case "googleEN":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://www.google.com/search?q=${window.getSelection().toString()}&gl=us&hl=en&pws=0`, "_blank") }
      })
      return
    case "deepL_ja":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://www.deepl.com/translator#ja/en/${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "deepL_en":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { window.open(`https://www.deepl.com/translator#en/ja/${window.getSelection().toString()}`, "_blank") }
      })
      return
  }
})

// MARK: shortcut onCommand
chrome.commands.onCommand.addListener((command, tab) => {
  console.log(`Command: ${command}`);
  switch (command) {
    case "volume_booster":
      chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("src/extension/booster/index.html") + `?id=${tab.id}`,
        width: booster.width,
        height: booster.height
      })
      return
  }
});

// MARK: runtime onMessage
chrome.runtime.onMessage.addListener(onMessage);

/**
 * @param {{command:string, arg: any}} message
 * @param {chrome.runtime.MessageSender} sender - 送信元の情報（タブなど）
 * @param {function(*): void} sendResponse - 応答を返す関数
 */
async function onMessage(message, sender, sendResponse) {
  console.log(`Message:`, message);
  switch (message.command) {
  }
}