// Variable
const data = {
  intervalId: -1,
  playlist: {
    reloadInterval: 0
  },
  live: {
    isAccelerated: false
  },
  watch: {
    adSkipped: false,
    prevSrc: ""
  }
}

// MARK: Check URL change
let pathname = ""
const observer = new MutationObserver((mutations, observer) => {
  const path = window.location.pathname
  if (pathname === path) return
  console.log(`Change URL: "${pathname}" > "${path}"`)
  pathname = path

  if (data.intervalId !== -1) {
    clearInterval(data.intervalId)
    data.intervalId = -1
  }

  // MARK: > short
  if (path.startsWith("/shorts")) {
    if (data.intervalId !== -1) return
    data.intervalId = setInterval(youtubeShort, 100)
    return
  }

  // MARK: > watch
  if (path.startsWith("/watch")) {
    if (data.intervalId !== -1) return
    data.intervalId = setInterval(youtubeWatch, 100)
    return
  }
})

observer.observe(document, { childList: true, subtree: true })

// MARK: short()
function youtubeShort() {
  /** @type {HTMLAnchorElement | null} */
  const titleLink = document.querySelector("ytd-reel-video-renderer[is-active] a.ytp-title-link")
  if (!titleLink) return

  // Check match URL,titleLink
  if (titleLink.href !== window.location.href) return

  // Check valid toolbox-buttons
  if (!document.querySelector("ytd-reel-video-renderer[is-active] #toolbox-buttons")) {
    console.log("New toolbox-buttons")
    newToolButton()
  }
}

function newToolButton() {
  // Remove prev buttons
  const prevButtons = document.getElementById("toolbox-buttons")
  if (prevButtons) {
    prevButtons.remove()
  }

  /** @type {HTMLVideoElement|null} */
  const currentVideo = document.querySelector("ytd-reel-video-renderer[is-active] video")
  // Check current video
  if (!currentVideo) {
    setTimeout(newToolButton, 100)
    return
  }
  // Check current video times
  if (isNaN(currentVideo.currentTime) || isNaN(currentVideo.duration)) {
    setTimeout(newToolButton, 100)
    return
  }

  // Get sidebar
  const sidebar = document.querySelector("ytd-reel-video-renderer[is-active] #actions") ?? document.querySelector("ytd-reel-video-renderer[is-active] div.ytwReelsPlayerOverlayLayoutViewModelHostActionBar")
  if (!sidebar) {
    return
  }
  sidebar.appendChild(document.createElement("br"))

  // Toolbar parent
  const buttons = document.createElement("div")
  buttons.id = "toolbox-buttons"
  sidebar.append(buttons)

  // timestamp(現在時刻) 設置
  const currentTime = document.createElement("input")
  currentTime.type = "text"
  currentTime.classList.add("timestamp")
  currentTime.pattern = "~[0-9]+\.[0-9]+$"
  currentTime.addEventListener("click", () => {
    currentVideo.pause()
  })
  currentTime.addEventListener("change", () => {
    const targetTime = parseFloat(currentTime.value)
    if (targetTime < currentVideo.duration) {
      currentVideo.currentTime = targetTime
    }
  })
  currentVideo.addEventListener("timeupdate", () => {
    if (currentVideo.paused) return
    currentTime.value = currentVideo.currentTime.toFixed(2).padStart(6, "0")
  })
  buttons.appendChild(currentTime)

  // timestamp(終了時刻)を設置
  const durationTime = document.createElement("input")
  durationTime.type = "text"
  durationTime.classList.add("timestamp")
  currentVideo.addEventListener("timeupdate", () => {
    durationTime.value = currentVideo.duration.toFixed(2).padStart(6, "0")
  })
  buttons.appendChild(durationTime)

  // 再生速度(表示)
  const currentSpeed = document.createElement("span")
  currentSpeed.textContent = "Speed: x1.00"
  buttons.appendChild(currentSpeed)

  // 再生速度(変更)
  const shortSpeed = document.createElement("input")
  shortSpeed.type = "range"
  shortSpeed.classList.add("play-speed")
  shortSpeed.min = "0.1"
  shortSpeed.max = "2.0"
  shortSpeed.step = "0.1"
  shortSpeed.value = "1.0"
  shortSpeed.addEventListener("input", () => {
    currentVideo.playbackRate = parseFloat(shortSpeed.value)
    currentSpeed.innerText = `Speed: x${parseFloat(shortSpeed.value).toFixed(2)}`
  })
  buttons.appendChild(shortSpeed)
}

// MARK: watch()
async function youtubeWatch() {
  const currentVideo = document.querySelector("video")
  if (!currentVideo) {
    return
  }

  // MARK: > playlist
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.searchParams)
  const playlist = params.get("list")
  const title = document.querySelector("div#title").innerHTML
  if (playlist && title) {
    const playlistPanelTitle = document.querySelector("#content .title.style-scope.ytd-playlist-panel-renderer").innerHTML

    if (!playlistPanelTitle) {
      console.log("Playlist embed notfound")
      if (data.playlist.reloadInterval > 0) {
        data.playlist.reloadInterval--
      } else {
        console.log("Window Reload Because By Playlist Panel Notfound")
        window.location.reload()
        data.playlist.reloadInterval = 5000
      }
    }
  }

  // MARK: > ad
  /** @type {HTMLButtonElement} */
  const adButton = document.querySelector("button.ytp-skip-ad-button")
  if (adButton) {
    if (adButton.style.display != "") return
    currentVideo.playbackRate = 3
    if (!data.watch.adSkipped) {
      console.log("Call Ad skip(wait 500~3000ms")
      data.watch.adSkipped = true
      adButton.style.display = "none"
      setTimeout(async () => {
        currentVideo.playbackRate = 5
        while (currentVideo.readyState > 0) {
          console.log("Waint ad video loading...")
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        currentVideo.currentTime = currentVideo.duration
        data.watch.adSkipped = false
      }, Math.random() * 2500 + 500)
    }
    return
  }


  // MARK: > live
  const liveText = document.querySelector(".ytp-live")
  if (liveText) {
    /** @type {HTMLButtonElement} */
    const jumpToLiveButton = document.querySelector("button.ytp-live-badge.ytp-button")
    const isDelayed = (jumpToLiveButton.disabled == false)
    /** @type {HTMLDivElement} */
    const videoToolBar = document.querySelector(".ytp-chrome-bottom")

    const config = await chrome.storage.local.get(null)
    if (isDelayed && !data.live.isAccelerated && config.youtube.isLiveAcceleration) {
      const acceleration = config.youtube.liveAccelerationRate

      data.live.isAccelerated = true
      currentVideo.playbackRate = acceleration
      jumpToLiveButton.innerText += `(SPEEDUP x${acceleration})`
      videoToolBar.style.opacity = "1"
      console.log(`Live is acceleration(x${acceleration})`)
    }
    if (!isDelayed && data.live.isAccelerated) {
      data.live.isAccelerated = false
      currentVideo.playbackRate = 1
      jumpToLiveButton.innerText = ""
      videoToolBar.style.opacity = "1"
      console.log(`Live is't acceleration`)
    }
    return
  }

  // MARK: > movie.new
  if (currentVideo.src != data.watch.prevSrc) {
    data.watch.prevSrc = currentVideo.src
    console.log("Found New video")
    // 時間差で実行
    setTimeout(function () {
      currentVideo.playbackRate = 1
      console.log("PlayBack speed force set x1")
    }, 1000)

    // MARK: > movie.ended
    currentVideo.addEventListener("ended", () => {
      console.log("Video has ended.")

      // MARK: >> canncel auto next
      /** @type {HTMLDivElement} */
      const endScreen = document.querySelector("div.ytp-autonav-endscreen-button-container")
      const isEndScreen = endScreen.style.display != "none"
      /** @type {HTMLButtonElement} */
      const nextCancelButton = endScreen.querySelector("button.ytp-autonav-endscreen-upnext-cancel-button")
      if (isEndScreen && nextCancelButton) {
        nextCancelButton.dispatchEvent(new Event("click"))
      }

      // MARK: >> playlist auto next
      /** @type {HTMLAnchorElement} */
      const nextButton = document.querySelector("a.ytp-next-button")
      const nextVideo = new URL(nextButton.href)
      if (nextVideo.searchParams.get("list")) {
        console.log("Click playlist next")
        nextButton.dispatchEvent(new Event("click"))
      }
    })
  }
}