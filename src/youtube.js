// Variable
const data = {
  intervalId: -1,
  live: {
    isAccelerated: false
  },
  shorts: {
    lastTime: 0,
    scrollTimeout: -1,
    scrollInterval: 0
  },
  watch: {
    adSkipped: false,
    prevSrc: "",
    isEnded: false,
  }
}

const PLAYLIST_RELOAD_KEY = "toolbox.playlistReloadAt"
const PLAYLIST_RELOAD_INTERVAL_MS = 60 * 1000

/** @type {ConfigYoutube} */
let youtubeConfig = {
  isLiveAcceleration: false,
  liveAccelerationRate: 5
}

// MARK: LoadConfig()
async function loadConfig() {
  try {
    const config = await chrome.storage.local.get(null)
    youtubeConfig = config.youtube ?? youtubeConfig
  } catch (error) {
    console.warn("Failed to load YouTube config:", error)
  }
}
loadConfig()

// MARK: WatchConfig()
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.youtube) return
  youtubeConfig = changes.youtube.newValue ?? youtubeConfig
})

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
    clearTimeout(data.shorts.scrollTimeout)
    data.shorts.scrollTimeout = -1
    data.shorts.scrollInterval = 5

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
  const titleLink = document.querySelector("ytd-reel-video-renderer a.ytp-title-link")
  if (!titleLink) return

  // Check match URL,titleLink
  if (titleLink.href !== window.location.href) return

  // Check valid toolbox-buttons
  if (!document.querySelector("#toolbox-buttons")) {
    console.log("New toolbox-buttons")
    newToolButton()
  }

  const currentVideo = document.querySelector("video")
  if (!currentVideo) {
    return
  }

  if (currentVideo.currentTime < data.shorts.lastTime && data.shorts.scrollTimeout == -1 && data.shorts.scrollInterval == 0) {
    console.log("Auto scroll call")
    data.shorts.scrollTimeout = setTimeout(() => {
      /** @type {HTMLButtonElement} */
      const nextBtn = document.querySelector('button[aria-label="次の動画"], button[aria-label="Next"]');
      if (nextBtn) nextBtn.click();
      data.shorts.scrollTimeout = -1
      data.shorts.scrollInterval = 5
      console.log("scrolled")
    }, 500)
  }
  if (currentVideo.paused) {
    clearTimeout(data.shorts.scrollTimeout)
    data.shorts.scrollTimeout = -1
  }
  data.shorts.lastTime = currentVideo.currentTime;
  if (data.shorts.scrollInterval > 0) data.shorts.scrollInterval--
}

function newToolButton() {
  // Remove prev buttons
  const prevButtons = document.getElementById("toolbox-buttons")
  if (prevButtons) {
    prevButtons.remove()
  }

  /** @type {HTMLVideoElement|null} */
  const currentVideo = document.querySelector("ytd-reel-video-renderer video")
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
  const adSidebar = document.querySelector("div.ytwReelsPlayerOverlayLayoutViewModelHostActionBar")
  const normalSidebar = document.querySelector("reel-action-bar-view-model")
  const sidebar = adSidebar ?? normalSidebar
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
  currentTime.pattern = "^[0-9]+\\.[0-9]+$"
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
    if (Number.isNaN(currentVideo.duration)) return
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
  const title = document.querySelector("div#title *[title]")
  if (playlist && title && title.textContent !== "") {
    const playlistPanelTitle = document.querySelector('a[href^="/playlist"]')?.textContent

    if (!playlistPanelTitle) {
      console.log("Playlist embed notfound")
      // リロードで変数が消えるため、sessionStorage で多重リロードを防ぐ
      const lastReloadAt = Number(sessionStorage.getItem(PLAYLIST_RELOAD_KEY) ?? "0")
      if (Date.now() - lastReloadAt >= PLAYLIST_RELOAD_INTERVAL_MS) {
        console.log("Window Reload Because By Playlist Panel Notfound")
        sessionStorage.setItem(PLAYLIST_RELOAD_KEY, String(Date.now()))
        window.location.reload()
      }
    }
  }

  // MARK: > ad
  /** @type {HTMLButtonElement} */
  const adButton = document.querySelector("button.ytp-skip-ad-button")
  if (adButton) {
    if (adButton.style.display != "") return
    if (!data.watch.adSkipped) {
      currentVideo.playbackRate = 5
      console.log("Call Ad skip(wait 500~3000ms")
      data.watch.adSkipped = true
      // setTimeout(async () => {
      //   while (isNaN(currentVideo.duration)) {
      //     await new Promise((r) => setTimeout(r, 500))
      //     console.log("ad duration loading...")
      //   }
      //   currentVideo.currentTime = currentVideo.duration
      //   data.watch.adSkipped = false
      // }, Math.random() * 5000 + 500)
    }
    return
  }
  if (data.watch.adSkipped) {
    // 広告終了後に加速を戻す
    data.watch.adSkipped = false
    currentVideo.playbackRate = 1
  }


  // MARK: > live
  const liveText = document.querySelector(".ytp-live")
  if (liveText) {
    /** @type {HTMLButtonElement} */
    const jumpToLiveButton = document.querySelector("button.ytp-live-badge.ytp-button")
    /** @type {HTMLDivElement} */
    const videoToolBar = document.querySelector(".ytp-chrome-bottom")
    if (!jumpToLiveButton || !videoToolBar) return

    const isDelayed = (jumpToLiveButton.disabled == false)

    const liveConfig = youtubeConfig
    if (isDelayed && !data.live.isAccelerated && liveConfig.isLiveAcceleration) {
      const acceleration = liveConfig.liveAccelerationRate ?? 1

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

  // MARK: > 閲覧確認
  const checkViorance = document.querySelector('*[aria-label="理解した上で続行する"]')
  if (checkViorance) {
    checkViorance.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))
  }

  // MARK: > movie.new
  if (currentVideo.src != data.watch.prevSrc) {
    data.watch.prevSrc = currentVideo.src
    data.watch.isEnded = false
    console.log("Found New video")
    // 時間差で実行
    setTimeout(function () {
      currentVideo.playbackRate = 1
      console.log("PlayBack speed force set x1")
    }, 1000)
    return
  }

  // MARK: > movie.ended
  if (currentVideo.duration - currentVideo.currentTime < 0.5 && !data.watch.isEnded) {
    data.watch.isEnded = true
    console.log("Video has ended.")

    // MARK: >> playlist auto next
    /** @type {HTMLAnchorElement} */
    const nextButton = document.querySelector("a.ytp-next-button")
    if (!nextButton) return
    const nextVideo = new URL(nextButton.href)
    if (nextVideo.searchParams.get("list")) {
      console.log("Click playlist next")
      nextButton.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))
      return
    }

    // MARK: >> canncel auto next
    /** @type {HTMLDivElement} */
    const endScreen = document.querySelector("div.ytp-autonav-endscreen-button-container")
    if (!endScreen) return
    const isEndScreen = endScreen.style.display != "none"
    /** @type {HTMLButtonElement} */
    const nextCancelButton = endScreen.querySelector("button.ytp-autonav-endscreen-upnext-cancel-button")
    if (isEndScreen && nextCancelButton) {
      nextCancelButton.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))
      return
    }
  }

  // MARK: > AFK check
  const dialog = document.querySelector("tp-yt-paper-dialog:not([aria-hidden])")
  if (dialog) {
    const button = document.querySelector("tp-yt-paper-dialog:not([aria-hidden]) button")
    if (button?.getAttribute("aria-label") == "はい") {
      button.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))
    }
  }
}