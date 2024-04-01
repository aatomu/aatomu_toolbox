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
    { parentId: "master", id: 'volume_booster', title: 'Volume Booster', contexts: ["all"] },
    // Shortのページのみ
    { parentId: "master", id: 'separator_short', type: 'separator', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/shorts/*"] },
    { parentId: "master", id: 'short2movie', title: 'Short To Movie', contexts: ["all"], documentUrlPatterns: ["*://www.youtube.com/shorts/*"] },
    // 選択時のみ
    { parentId: "master", id: 'separator_select', type: 'separator', contexts: ["selection"] },
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
      chrome.contextMenus.create(menu);
    } catch (e) {
      console.log(e)
    }
  })
  // いろんなやつの初期値
  chrome.storage.sync.get(["Setting"]).then((result) => {
    let setting = result.Setting
    if (setting == undefined) {
      setting = {
        LiveAcceleration: false,
        LiveAccelerationRate: 5,
        User: "Atomu",
        Address: "Minecraft",
        PostCode: "minecraft:over_world",
        Greeting: "おはー",
        SecretAmazonMode:true,
        ShowAmazonBuyButton:false,
      }
      chrome.storage.sync.set({ Setting: setting })
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

    case "volume_booster":
      chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("popup/booster.html") + `?id=${tab.id}&title=${tab.title}`,
        width: 300,
        height: 100
      })

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
    case "deepL_ja":
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function () { window.open(`https://www.deepl.com/translator#ja/en/${window.getSelection().toString()}`, "_blank") }
      })
      return
    case "deepL_en":
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
