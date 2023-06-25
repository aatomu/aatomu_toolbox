// Global
//// 待機
function sleep(waitSec, callbackFunc) {
  let spanedSec = 0;
  // 1秒間隔で無名関数を実行
  let id = setInterval(function () {
    spanedSec++;
    // 経過時間 >= 待機時間の場合、待機終了。
    if (spanedSec >= waitSec) {
      clearInterval(id);
      if (callbackFunc) callbackFunc();
    }
  }, 1000);
}
//// 文字列を変換
function str2HTML(html) {
  const dummyElement = document.createElement('div');
  dummyElement.innerHTML = html;
  return dummyElement.firstElementChild;
}

//// いろんなサイトのクリーパー
if (/https?/.test(location.protocol)) {
  let creeperElement = document.createElement("img")
  creeperElement.classList.add("creeper")
  creeperElement.id = "creeper"
  creeperElement.src = chrome.runtime.getURL("images/creeper.webp")
  document.getElementsByTagName("body")[0].appendChild(creeperElement)
  document.getElementById("creeper").addEventListener("mouseover", function (e) {
    document.getElementById("creeper").classList.add("creeper_fade")
  })
}

//// 変数チェック
let s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/contents_insert.js');
s.onload = function () {
  this.remove();
};
document.getElementsByTagName("body")[0].appendChild(s);


// Youtube関連
//// 変数
let shortNumber = -1
let isLiveSpeedupMode = false
let isLiveSpeedup = false
let LiveSpeeduped = 3
//// Speedup
chrome.storage.sync.get(["isLiveSpeedupMode"]).then((result) => {
  isLiveSpeedupMode = result.isLiveSpeedupMode
  console.log("Load Live Speedup Mode:", isLiveSpeedupMode)
});
//// クロック
setInterval(function () {
  // 登録チャンネルのあれ
  if (window.location.href == "https://www.youtube.com/feed/subscriptions") {
    if (!document.getElementById("searchVideoKey")) {
      let search = str2HTML(`<input type"text" id="searchVideoKey" value="">`)
      document.querySelector("#masthead-container #container #center").appendChild(search)
      search.addEventListener("input", function () {
        let searchKey = document.getElementById("searchVideoKey").value.toUpperCase()
        videos = document.querySelectorAll("ytd-grid-video-renderer")
        for (i = 0; i < videos.length; i++) {
          let video = videos[i]
          video.removeAttribute("style")
          if (video.querySelector("#video-title").getAttribute("aria-label").toUpperCase().includes(searchKey)) continue
          video.style.display = "none"
        }
      })
    }
  } else {
    try {
      document.getElementById("searchVideoKey").remove()
    } catch { }
  }
  // ショート
  if (window.location.href.startsWith("https://www.youtube.com/shorts/")) {
    try {
      // shortIDスキャン
      for (let short of document.getElementsByTagName("ytd-reel-video-renderer")) {
        // 変わったか確認
        if (!short.hasAttribute("is-active") || shortNumber == short.id) {
          continue
        }
        shortNumber = short.id
        setTimeout(UpdateShortButton, 200)
        break
      }
    } catch (e) {
      console.log(e)
    }
  }
  // 動画
  if (window.location.href.startsWith("https://www.youtube.com/watch")) {
    let button = document.querySelector("button.ytp-live-badge.ytp-button")
    let live = document.querySelector("video")
    let timeLineWidth = document.querySelector("span.ytp-time-duration").offsetWidth
    // isLive?
    if (timeLineWidth == 0) {
      // isDelay && !isSpeedup
      if (!button.disabled && !isLiveSpeedup && isLiveSpeedupMode) {
        live.playbackRate = LiveSpeeduped
        button.innerText += `(SPEEDUP x${LiveSpeeduped})`
        isLiveSpeedup = true
        console.log(`Live Is Delay(Change Speed To x${LiveSpeeduped})`)
        return
      }
      // !isDelay && isSpeedup
      if (button.disabled && isLiveSpeedup) {
        live.playbackRate = 1
        button.innerText = button.innerText.replace("(SPEEDUP)", "")
        isLiveSpeedup = false
        console.log("Live is NoDelay(Change Speed To x1)")
        return
      }
      // isSpeedup && !isLiveSpeedupMode
      if (isLiveSpeedup && !isLiveSpeedupMode) {
        live.playbackRate = 1
        button.innerText = button.innerText.replace("(SPEEDUP)", "")
        isLiveSpeedup = false
        console.log("Live Speedup Mode Is False(Change Speed To x1)")
      }
    }
  }
}, 500)

function UpdateShortButton() {
  // info表示
  console.log(`shortID:${shortNumber}`)

  // 過去の追加した要素削除
  let oldShortButtons = document.getElementById("aatomuShortButtons")
  if (oldShortButtons != undefined) {
    oldShortButtons.remove()
  }

  // 再生中の動画
  let shortVideo = document.querySelector(`ytd-reel-video-renderer#${CSS.escape(shortNumber)} video`)
  if (shortVideo == undefined) {
    setTimeout(UpdateShortButton, 200)
    return
  }
  if (isNaN(shortVideo.currentTime) || isNaN(shortVideo.duration)) {
    setTimeout(UpdateShortButton, 200)
    return
  }

  let shortSidebar = document.querySelector(`ytd-reel-video-renderer#${CSS.escape(shortNumber)} #actions`)

  shortSidebar.appendChild(str2HTML(`<br>`))

  // 親生成
  let shortButtons = str2HTML(`<div id="aatomuShortButtons"></div>`)
  shortSidebar.appendChild(shortButtons)

  // timebar(現在時刻) 設置
  let shortTimeNow = str2HTML(`<input type"text" class="timebar" value="00.00">`)
  shortButtons.appendChild(shortTimeNow)
  shortTimeNow.addEventListener("keydown", function (e) {
    if (e.key != "Enter") return
    let time = parseFloat(shortTimeNow.value)
    if (time < shortTimeMax.value) {
      shortVideo.currentTime = time
    }
  })
  shortTimeNow.addEventListener("click", function () {
    shortVideo.pause()
  })
  shortVideo.addEventListener("timeupdate", function () {
    shortTimeNow.value = ('00' + (Math.floor(shortVideo.currentTime * 100) / 100).toFixed(2)).slice(-5)
  })

  shortButtons.appendChild(str2HTML(`<br>`))

  // timebar(終了時刻)を設置
  let shortTimeMax = str2HTML(`<input type"text" class="timebar" value="00.00" disabled>`)
  shortTimeMax.value = ('00' + (Math.floor(shortVideo.duration * 100) / 100).toFixed(2)).slice(-5);
  shortButtons.appendChild(shortTimeMax)

  // 再生速度(表示)
  shortButtons.appendChild(str2HTML(`<span id="aatomuShortSpeed">Speed: x1.00<span>`))

  // 再生速度(変更)
  let shortSpeed = str2HTML(`<input type="range" class="play_speed" id="aatomuShortSpeedChanger" min="0.1" max="2" step="0.1" value="1">`)
  shortButtons.appendChild(shortSpeed)
  shortSpeed.addEventListener("input", function () {
    shortVideo.playbackRate = parseFloat(shortSpeed.value)
    document.getElementById("aatomuShortSpeed").innerText = `Speed: x${(Math.floor(parseFloat(shortSpeed.value) * 100) / 100).toFixed(2)}`
  })
}

if (window.location.host == "www.amazon.co.jp") {
  chrome.storage.sync.get(["disableAddon"]).then((result) => {
    if (!result.disableAddon) {
      document.querySelector(`head`).insertAdjacentHTML('beforeend', `<link href="` + chrome.runtime.getURL('css/amazon.js') + `" rel="stylesheet">`);
    }
  });
}