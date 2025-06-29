chrome.runtime.sendMessage({ injection: true });

// Variable
//  Shorts
let beforeShortNumber = -1
//  Live
let isLiveAcceleration = false
let isLiveAccelerated = false
//  Video Speed
let beforeWatchVideoSrc = ""
//  in Playlist
let videoEndedFreeze = 0
let reloadInterval = 0
// Live Acceleration
chrome.storage.sync.get(["Setting"]).then((result) => {
  isLiveAcceleration = result.Setting.LiveAcceleration
  console.log("Load Live Acceleration:", isLiveAcceleration)
});

// Loop
setInterval(async function () {
  // ショート
  if (window.location.href.startsWith("https://www.youtube.com/shorts/")) {
    const short = document.querySelector("ytd-reel-video-renderer[is-active]")
    if (short) {
      console.log("Found Short")
      if (beforeShortNumber != short.parentElement.id) {
        beforeShortNumber = short.parentElement.id
        UpdateShortButton()
      }
    }
  }


  // 動画
  if (window.location.href.startsWith("https://www.youtube.com/watch")) {
    const video = document.querySelector("video")
    if (!video) {
      return
    }

    // isPlaylist
    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.searchParams)
    const playlist = params.get("list")
    const title = document.querySelector("div#title").innerHTML
    if (playlist && title) {
      const playlistPanelTitle = document.querySelector("#content .title.style-scope.ytd-playlist-panel-renderer")
      
      if (!playlistPanelTitle) {
        console.log("Playlist embed notfound")
        if (reloadInterval > 0) {
          reloadInterval--
        } else {
          console.log("Window Reload Because By Playlist Panel Notfound")
          window.location.reload()
          reloadInterval = 5000
        }
      }
    }
    // isAd
    const adButton = document.querySelector("button.ytp-skip-ad-button")
    if (adButton) {
      console.log("Found Ad")
      if (adButton.style.display != "") return
      // video.currentTime = video.duration
    }
    // isLive
    const liveText = document.querySelector(".ytp-live")
    if (liveText) {
      const jumpToLiveButton = document.querySelector("button.ytp-live-badge.ytp-button")
      const isDelayed = (jumpToLiveButton.disabled == false)
      const videoToolBar = document.querySelector(".ytp-chrome-bottom")

      if (isDelayed && !isLiveAccelerated && isLiveAcceleration) {
        const acceleration = await chrome.storage.sync.get(["Setting"]).then((result) => { return result.Setting.LiveAccelerationRate })

        isLiveAccelerated = true
        video.playbackRate = acceleration
        jumpToLiveButton.innerText += `(SPEEDUP x${acceleration})`
        videoToolBar.style.opacity = "1"
        console.log(`Live is acceleration(x${acceleration})`)
      }
      if (!isDelayed && isLiveAccelerated) {
        isLiveAccelerated = false
        video.playbackRate = 1
        jumpToLiveButton.innerText = ""
        videoToolBar.style.opacity = "1"
        console.log(`Live is't acceleration`)
      }
      return
    }
    // isNewMovie
    if (video.src != "" && beforeWatchVideoSrc != video.src) {
      console.log("Found New video")
      beforeWatchVideoSrc = video.src
      videoEndedFreeze = 0
      // 時間差で実行
      setTimeout(function () {
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
      }, 1000)
      return
    }
    // isEndedVideo
    if (video.duration - video.currentTime < 0.5) {
      videoEndedFreeze++
      console.log(`Vide Is Ended`)
      if (videoEndedFreeze > 20) {
        // cancel auto next
        const isEndScreen = document.querySelector("div.ytp-autonav-endscreen-button-container").style.display != "none"
        const nextCancelButton = document.querySelector("button.ytp-autonav-endscreen-upnext-cancel-button")
        if (isEndScreen && nextCancelButton) {
          console.log("Click Cancel Auto Next Button")
          nextCancelButton.click()
        }
        // playlist
        const nextButton = document.querySelector("a.ytp-next-button")
        const nextVideo = nextButton.href
        if (nextVideo.includes("list=")) {
          console.log("Click Next Button")
          nextButton.click()
        }
      }
    }
    // shouldAfk
    const dialog = document.querySelector("tp-yt-paper-dialog:not([aria-hidden])")
    if (dialog) {
      const button = document.querySelector("tp-yt-paper-dialog:not([aria-hidden]) button")
      if (button.getAttribute("aria-label") == "はい") {
        button.click()
      }
    }
  }
}, 100)

function UpdateShortButton() {
  // info表示
  console.log(`ShortID:${beforeShortNumber}`)

  // 過去の追加した要素削除
  const oldShortButtons = document.getElementById("aatomuShortButtons")
  if (oldShortButtons) {
    oldShortButtons.remove()
  }

  // 再生中の動画
  const shortVideo = document.querySelector("ytd-reel-video-renderer[is-active] video")
  if (!shortVideo) {
    setTimeout(UpdateShortButton, 100)
    return
  }
  if (isNaN(shortVideo.currentTime) || isNaN(shortVideo.duration)) {
    setTimeout(UpdateShortButton, 100)
    return
  }

  const shortSidebar = document.querySelector("ytd-reel-video-renderer[is-active] #actions")
  if (!shortSidebar) {
    return
  }
  shortSidebar.appendChild(str2HTML(`<br>`))

  // 親生成
  const shortButtons = str2HTML(`<div id="aatomuShortButtons"></div>`)
  shortSidebar.appendChild(shortButtons)

  // timestamp(現在時刻) 設置
  const shortTimeNow = str2HTML(`<input type"text" class="timestamp" value="00.00">`)
  shortButtons.appendChild(shortTimeNow)
  shortTimeNow.addEventListener("click", function () {
    shortVideo.pause()
  })
  shortTimeNow.addEventListener("keydown", function (e) {
    const time = parseFloat(shortTimeNow.value)
    if (time < shortTimeEnd.value) {
      shortVideo.currentTime = time
    }
  })
  shortVideo.addEventListener("timeupdate", function () {
    if (shortVideo.paused) return
    shortTimeNow.value = (Math.floor(shortVideo.currentTime * 100) / 100).toFixed(2).padStart(6, "0")
  })
  shortButtons.appendChild(str2HTML(`<br>`))

  // timestamp(終了時刻)を設置
  const shortTimeEnd = str2HTML(`<input type"text" class="timestamp" value="000.00" disabled>`)
  shortTimeEnd.value = (Math.floor(shortVideo.duration * 100) / 100).toFixed(2).padStart(6, "0")
  shortButtons.appendChild(shortTimeEnd)

  // 再生速度(表示)
  shortButtons.appendChild(str2HTML(`<span id="aatomuShortSpeed">Speed: x1.00<span>`))

  // 再生速度(変更)
  const shortSpeed = str2HTML(`<input type="range" class="play-speed" id="aatomuShortSpeedChanger" min="0.1" max="2" step="0.1" value="1">`)
  shortButtons.appendChild(shortSpeed)
  shortSpeed.addEventListener("input", function () {
    shortVideo.playbackRate = parseFloat(shortSpeed.value)
    document.getElementById("aatomuShortSpeed").innerText = `Speed: x${(Math.floor(parseFloat(shortSpeed.value) * 100) / 100).toFixed(2)}`
  })
}

function str2HTML(html) {
  const dummyElement = document.createElement('div');
  dummyElement.innerHTML = html;
  return dummyElement.firstElementChild;
}
