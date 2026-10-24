const CREEPER_ID = "creeper"
const CREEPER_CLASS = "creeper"
const BODY_WAIT_TIMEOUT_MS = 5000

// MARK: CheckContext()
function isExtensionContextValid() {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id)
}

// MARK: GetConfig()
async function getConfig() {
  try {
    return await chrome.storage.local.get(null)
  } catch (error) {
    console.warn("Failed to read config. Using defaults.", error)
    return null
  }
}

// MARK: WaitForBody()
function waitForBody() {
  if (document.body) return Promise.resolve(document.body)

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, BODY_WAIT_TIMEOUT_MS)

    const observer = new MutationObserver(() => {
      if (!document.body) return
      observer.disconnect()
      clearTimeout(timer)
      resolve(document.body)
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
  })
}

// MARK: GetCreeperParent()
function getCreeperParent() {
  return document.body ?? document.documentElement
}

// MARK: CreateCreeper()
function createCreeper() {
  const creeper = document.createElement("img")
  creeper.id = CREEPER_ID
  creeper.classList.add(CREEPER_CLASS)
  creeper.alt = ""
  creeper.draggable = false
  creeper.setAttribute("aria-hidden", "true")
  creeper.src = chrome.runtime.getURL("src/extension/content/creeper.webp")
  creeper.addEventListener("mouseover", () => {
    creeper.classList.add("creeper_fade")
  }, { once: true })
  creeper.addEventListener("error", () => {
    console.error("Failed to load creeper image:", creeper.src)
  }, { once: true })
  return creeper
}

// MARK: SetCreeperVisible()
function setCreeperVisible(visible) {
  try {
    const currentCreeper = document.getElementById(CREEPER_ID)
    if (!visible) {
      currentCreeper?.remove()
      return
    }
    if (currentCreeper) return
    if (!isExtensionContextValid()) return

    const parent = getCreeperParent()
    if (!parent) {
      console.warn("Creeper was not inserted because the document has no root element.")
      return
    }
    parent.appendChild(createCreeper())
  } catch (error) {
    console.error("Failed to show creeper:", error)
  }
}

// MARK: WatchCreeperSetting()
function watchCreeperSetting() {
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes.enableCreeper) return
      setCreeperVisible(Boolean(changes.enableCreeper.newValue))
    })
  } catch (error) {
    console.warn("Failed to watch creeper setting:", error)
  }
}

// MARK: OnLoad()
async function onLoad() {
  console.log("contents.js loaded")
  const body = await waitForBody()
  if (!body) {
    console.warn("document.body was not found. Creeper falls back to documentElement.")
  }

  const config = await getConfig()
  setCreeperVisible(config?.enableCreeper ?? true)
  watchCreeperSetting()
}
onLoad()
