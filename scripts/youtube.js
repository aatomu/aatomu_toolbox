// Variable
//// Subscriptions
let isSearchSubscription = false
//// Shorts
let shortNumber = -1
//// Live
let isLiveSpeedupMode = false
let isLiveSpeedup = false
let LiveSpeeduped = 3
//// 動画のSpeed
let beforeWatchVideoSrc = ""

// Speedup
chrome.storage.sync.get(["isLiveSpeedupMode"]).then((result) => {
  isLiveSpeedupMode = result.isLiveSpeedupMode
  console.log("Load Live Speedup Mode:", isLiveSpeedupMode)
});

// Loop
setInterval(async function () {
  // 登録チャンネルで検索
  if (window.location.href == "https://www.youtube.com/feed/subscriptions" && !isSearchSubscription) {
    let search = str2HTML(`<input type"text" id="searchVideoKey" value="">`)
    document.querySelector("#masthead-container #container #center").appendChild(search)
    search.addEventListener("input", function () {
      let searchKey = document.getElementById("searchVideoKey").value.toUpperCase()
      console.log(searchKey)
      videos = document.querySelectorAll("ytd-rich-item-renderer")
      for (i = 0; i < videos.length; i++) {
        console.log(i)
        let video = videos[i]
        video.removeAttribute("style")
        if (video.querySelector("#video-title").getAttribute("aria-label").toUpperCase().includes(searchKey)) continue
        video.style.display = "none"
      }
    })
    isSearchSubscription = true
    return
  }
  if (window.location.href != "https://www.youtube.com/feed/subscriptions" && isSearchSubscription) {
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
    let video = document.querySelector("video")

    // isLive?
    let timeLineWidth = document.querySelector("span.ytp-time-duration").offsetWidth
    if (timeLineWidth == 0) {
      let button = document.querySelector("button.ytp-live-badge.ytp-button")
      let live = document.querySelector("video")
      // isDelay && !isSpeedup
      if (!button.disabled && !isLiveSpeedup && isLiveSpeedupMode) {
        const LiveSpeed = await chrome.storage.sync.get(["liveSpeed"]).then((result) => { return result.liveSpeed })

        video.playbackRate = LiveSpeed
        button.innerText += `(SPEEDUP x${LiveSpeed})`
        isLiveSpeedup = true
        document.querySelector(".ytp-chrome-bottom").style.opacity = "1"
        console.log(`Live Is Delay(Change Speed To x${LiveSpeed})`)
        return
      }
      // !isDelay && isSpeedup
      if (button.disabled && isLiveSpeedup) {
        video.playbackRate = 1
        button.innerText = button.innerText.replace("(SPEEDUP)", "")
        isLiveSpeedup = false
        document.querySelector(".ytp-chrome-bottom").style.opacity = ""
        console.log("Live is NoDelay(Change Speed To x1)")
        return
      }
      // isSpeedup && !isLiveSpeedupMode
      if (isLiveSpeedup && !isLiveSpeedupMode) {
        video.playbackRate = 1
        button.innerText = button.innerText.replace("(SPEEDUP)", "")
        isLiveSpeedup = false
        document.querySelector(".ytp-chrome-bottom").style.opacity = ""
        console.log("Live Speedup Mode Is False(Change Speed To x1)")
      }
    }
    // isMovie
    if (beforeWatchVideoSrc != video.src) {
      beforeWatchVideoSrc = video.src
      // 時間差で実行
      setTimeout(function() {
      const settingButton = document.querySelector("button.ytp-button.ytp-settings-button")
      settingButton.click() //設定ボタンをクリック
      document.querySelectorAll("div.ytp-menuitem-label").forEach((el) => {
        if (el.innerText == "再生速度") {
          el.click() // 再生速度ボタンをクリック
        }
      })
      document.querySelectorAll("div.ytp-menuitem-label").forEach((el) => {
        if (el.innerText == "標準") {
          el.click()// 再生速度 標準ボタンをクリック
        }
      })
      settingButton.click() //設定ボタンをクリック == メニューを閉じる
      console.log("PlayBack Speed Set To Default(x1)")
      },1000)
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