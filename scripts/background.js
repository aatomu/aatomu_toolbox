// 消したらService Checker使えない
console.log("Chrome Addon is Loaded!");
// 読み込み
chrome.runtime.onInstalled.addListener(init());
function init() {
  // 読み込み 通知
  console.log("Init Call")
  // Context Menu 全削除
  chrome.contextMenus.removeAll()
  // Context Menu 生成
  chrome.contextMenus.create({
    id: 'master',
    title: 'atomuの道具箱',
    contexts: ["all"]
  });

  const menuList = [
    // 常時表示
    { parentId: "master", id: 'jump_extension', title: 'Jump To Chrome Extension', contexts: ["all"] },
    { parentId: "master", id: 'copy_link', title: 'Copy URL', contexts: ["all"] },
    { parentId: "master", id: 'view_creeper', title: 'View Creeper', type: 'checkbox', contexts: ["all"] },
    // Shortのページのみ
    { parentId: "master", id: 'separator_short', type: 'separator', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/shorts/*"] },
    { parentId: "master", id: 'short2movie', title: 'Short To Movie', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/shorts/*"] },
    // Live 自動更新
    { parentId: "master", id: 'separator_live', type: 'separator', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/watch?v=*"] },
    { parentId: "master", id: 'live_no_delay', type: 'checkbox', title: 'Live No Delay Mode', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/watch?v=*"] },
    // Amazon
    { parentId: "master", id: 'separator_amazon', type: 'separator', contexts: ["all"], documentUrlPatterns: ["*://www.amazon.co.jp/*"] },
    { parentId: "master", id: 'disable_secret_amazon', type: 'checkbox', title: 'Disable Secret Amazon Mode', contexts: ["all"], documentUrlPatterns: ["*://www.amazon.co.jp/*"] },
    { parentId: "master", id: 'show_amazon_buy_button', type: 'checkbox', title: '[Warning] Show Amazon Buy Button', contexts: ["all"], documentUrlPatterns: ["*://www.amazon.co.jp/*"] },
    // 選択時のみ
    { parentId: "master", id: 'separator_select', type: 'separator', contexts: ["selection"] },
    { parentId: "master", id: 'amazon', title: '検索: amazon', contexts: ["selection"] },
    { parentId: "master", id: 'yahoo_auction', title: '検索: ヤフオク', contexts: ["selection"] },
    { parentId: "master", id: 'yahoo_shop', title: '検索: ヤフーshop', contexts: ["selection"] },
    { parentId: "master", id: 'kakaku', title: '検索: 価格.com', contexts: ["selection"] },
    { parentId: "master", id: 'youtube', title: '検索: youtube', contexts: ["selection"] },
    { parentId: "master", id: 'osu', title: '検索: osu!', contexts: ["selection"] },
    { parentId: "master", id: 'googleJP', title: '翻訳: googleJP', contexts: ["selection"] },
    { parentId: "master", id: 'googleEN', title: '翻訳: googleEN', contexts: ["selection"] },
    { parentId: "master", id: 'deepL', title: '翻訳: DeepL', contexts: ["selection"] }
  ]
  menuList.forEach(menu => {
    try {
      chrome.contextMenus.create(menu);
    } catch (e) {
      console.log(e)
    }
  })
  // いろんなやつの初期値
  //// secret設定
  chrome.storage.sync.get(["liveSpeed"]).then((result) => {
    if (result.liveSpeed == undefined) {
      chrome.storage.sync.set({ liveSpeed: 2 })
    }
  })
  //// secret設定
  chrome.storage.sync.get(["secretSettings"]).then((result) => {
    let setting = result.secretSettings
    if (setting == undefined) {
      setting = {
        User: "Atomu",
        Address: "Minecraft",
        PostCode: "minecraft:over_world",
        Greeting: "おはー"
      }
      chrome.storage.sync.set({ secretSettings: setting })
    }
  })
}

// 右クリメニュー 呼び出し
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context Menu Click:")
  console.log("  Info:", info)
  console.log("  Tab:", tab)
  switch (info.menuItemId) {
    case "jump_extension":
      chrome.tabs.create({
        active: true,
        url: 'chrome://extensions/'
      }, null);
      return
    case "copy_link":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () {
          // url
          let url = window.location.href;
          // Amazonのトラックを削除
          if (window.location.hostname.includes("amazon")) {
            url = window.location.origin + window.location.pathname.replace(/.*(\/dp\/.+?\/).*/, "$1")
          }
          // コピー
          const el = document.createElement('textarea');
          el.value = url;
          el.setAttribute('readonly', '');
          el.style.position = 'absolute';
          el.style.left = '-9999px';
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
      })
      return;
    case "view_creeper":
      chrome.storage.sync.set({ isViewCreeper: info.checked })
      return

    case "short2movie":
      // shortのページ以外で実行しない
      if (!tab.url.includes("youtube.com/shorts/")) {
        return;
      }

      // 開く
      chrome.tabs.create({
        url: tab.url.replace("shorts/", "watch?v="),
        index: tab.index + 1
      });
      return

    case "live_no_delay":
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab, index) => {
          console.log(tab)
          if (tab.url == undefined) return
          if (!tab.url.startsWith("http")) return
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: function (checked) {
              console.log("Change To Live Speedup Mode", checked)
              isLiveSpeedupMode = checked
            },
            args: [info.checked]
          })
        })
      })
      chrome.storage.sync.set({ isLiveSpeedupMode: info.checked })
      return

    case "disable_secret_amazon":
      chrome.storage.sync.set({ isDisableSecretAmazonMode: info.checked })
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.location.reload() }
      })
      return

    case "show_amazon_buy_button":
      chrome.storage.sync.set({ isShowAmazonBuyButton: info.checked })
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.location.reload() }
      })
      return

      case "amazon":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://www.amazon.co.jp/s?k=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "yahoo_auction":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://auctions.yahoo.co.jp/search/search?p=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "yahoo_shop":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://shopping.yahoo.co.jp/search?p=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "kakaku":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://kakaku.com/search_results/${window.getSelection().toString()}/`, "_blank") }
      })
      return
    case "youtube":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://www.youtube.com/results?search_query=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "osu":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://osu.ppy.sh/beatmapsets?q=${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "googleJP":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://www.google.com/search?q=${window.getSelection().toString()}&gl=jp&hl=ja&pws=0`, "_blank") }
      })
      return
    case "googleEN":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://www.google.com/search?q=${window.getSelection().toString()}&gl=us&hl=en&pws=0`, "_blank") }
      })
      return
    case "deepL":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://www.deepl.com/translator#en/ja/${window.getSelection().toString()}`, "_blank") }
      })
      return
  }
});

// 待機
function sleep(waitSec, callbackFunc) {
  var spanedSec = 0;
  // 1秒間隔で無名関数を実行
  var id = setInterval(function () {
    spanedSec++;
    // 経過時間 >= 待機時間の場合、待機終了。
    if (spanedSec >= waitSec) {
      clearInterval(id);
      if (callbackFunc) callbackFunc();
    }
  }, 1000);
}
