// MARK: Const
/** @type {Config} */
const DefaultPopupConfig = {
  enableCreeper: true,
  youtube: {
    isLiveAcceleration: false,
    liveAccelerationRate: 5
  },
  amazon: {
    enableSecret: true,
    showBuyButton: false,
    greeting: "おはー"
  },
  secret: {
    name: "Atomu",
    postCode: "minecraft:over_world",
    address: "Minecraft"
  }
}

/** @type {HTMLSpanElement} */
const bufferValue = /** @type {HTMLSpanElement} */ (document.getElementById("ExtensionBufferUseValue"))
/** @type {HTMLInputElement} */
const searchInput = /** @type {HTMLInputElement} */ (document.getElementById("searchInput"))
/** @type {HTMLFormElement} */
const settingsForm = /** @type {HTMLFormElement} */ (document.getElementById("settings-form"))
/** @type {HTMLInputElement} */
const enableCreeperInput = /** @type {HTMLInputElement} */ (document.getElementById("enable-creeper"))
/** @type {HTMLInputElement} */
const youtubeLiveAccelerationInput = /** @type {HTMLInputElement} */ (document.getElementById("youtube-live-acceleration"))
/** @type {HTMLInputElement} */
const youtubeLiveAccelerationRateInput = /** @type {HTMLInputElement} */ (document.getElementById("youtube-live-acceleration-rate"))
/** @type {HTMLInputElement} */
const amazonEnableSecretInput = /** @type {HTMLInputElement} */ (document.getElementById("amazon-enable-secret"))
/** @type {HTMLInputElement} */
const amazonShowBuyButtonInput = /** @type {HTMLInputElement} */ (document.getElementById("amazon-show-buy-button"))
/** @type {HTMLInputElement} */
const amazonGreetingInput = /** @type {HTMLInputElement} */ (document.getElementById("amazon-greeting"))
/** @type {HTMLInputElement} */
const secretNameInput = /** @type {HTMLInputElement} */ (document.getElementById("secret-name"))
/** @type {HTMLInputElement} */
const secretPostCodeInput = /** @type {HTMLInputElement} */ (document.getElementById("secret-post-code"))
/** @type {HTMLInputElement} */
const secretAddressInput = /** @type {HTMLInputElement} */ (document.getElementById("secret-address"))
/** @type {HTMLSpanElement} */
const configMessage = /** @type {HTMLSpanElement} */ (document.getElementById("config-message"))

/** @type {Config | null} */
let currentConfig = null

// MARK: OnLoaded()
async function onLoaded() {
  updateHistory("")

  try {
    const bufferBytes = await chrome.storage.local.getBytesInUse()
    bufferValue.textContent = bufferBytes.toString()
    const config = await chrome.storage.local.get(null)
    applyConfig(config)
  } catch (error) {
    console.error("Failed to load extension settings:", error)
    configMessage.textContent = "Load failed!!"
  }
}
onLoaded()

// MARK: ApplyConfig()
/**
 * @param {Config} config
 */
function applyConfig(config) {
  currentConfig = config
  enableCreeperInput.checked = config.enableCreeper ?? true
  youtubeLiveAccelerationInput.checked = config.youtube?.isLiveAcceleration ?? DefaultPopupConfig.youtube.isLiveAcceleration
  youtubeLiveAccelerationRateInput.value = String(config.youtube?.liveAccelerationRate ?? DefaultPopupConfig.youtube.liveAccelerationRate)
  amazonEnableSecretInput.checked = config.amazon?.enableSecret ?? DefaultPopupConfig.amazon.enableSecret
  amazonShowBuyButtonInput.checked = config.amazon?.showBuyButton ?? DefaultPopupConfig.amazon.showBuyButton
  amazonGreetingInput.value = config.amazon?.greeting ?? DefaultPopupConfig.amazon.greeting
  secretNameInput.value = config.secret?.name ?? DefaultPopupConfig.secret.name
  secretPostCodeInput.value = config.secret?.postCode ?? DefaultPopupConfig.secret.postCode
  secretAddressInput.value = config.secret?.address ?? DefaultPopupConfig.secret.address
}

// MARK: ReadConfig()
/**
 * @returns {Config}
 */
function readConfig() {
  const base = structuredClone(currentConfig ?? DefaultPopupConfig)
  const rate = Number.parseFloat(youtubeLiveAccelerationRateInput.value)
  const safeRate = Number.isFinite(rate) ? clamp(rate, 1, 16) : DefaultPopupConfig.youtube.liveAccelerationRate

  return {
    ...base,
    enableCreeper: enableCreeperInput.checked,
    youtube: {
      ...base.youtube,
      isLiveAcceleration: youtubeLiveAccelerationInput.checked,
      liveAccelerationRate: safeRate
    },
    amazon: {
      ...base.amazon,
      enableSecret: amazonEnableSecretInput.checked,
      showBuyButton: amazonShowBuyButtonInput.checked,
      greeting: amazonGreetingInput.value
    },
    secret: {
      ...base.secret,
      name: secretNameInput.value,
      postCode: secretPostCodeInput.value,
      address: secretAddressInput.value
    }
  }
}

// MARK: Clamp()
/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// MARK: Search
let searchTimer = 0
searchInput.addEventListener("input", function () {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    updateHistory(searchInput.value)
  }, 250)
})

// MARK: History()
/**
 * @param {string} keyword
 */
function updateHistory(keyword) {
  const searchDate = new Date();
  searchDate.setDate(searchDate.getDate() - 7);
  chrome.history.search({ text: "", maxResults: 5000, startTime: searchDate.getTime() }, function (result) {
    let str = "";
    for (let i = 0; i < result.length; i++) {
      const title = result[i].title ?? ""
      const url = result[i].url ?? ""
      if (keyword != "") {
        if (!title.toUpperCase().includes(keyword.toUpperCase()) && !url.toUpperCase().includes(keyword.toUpperCase())) {
          continue
        }
      }

      const visitDate = new Date(result[i].lastVisitTime ?? 0)
      const timeStamp = padding(visitDate.getHours(), 2) + ":" + padding(visitDate.getMinutes(), 2) + ":" + padding(visitDate.getSeconds(), 2)
      const date = visitDate.getFullYear() + "/" + padding((visitDate.getMonth() + 1), 2) + "/" + padding(visitDate.getDate(), 2) + " " + timeStamp
      const safeUrl = HTMLescape(url)
      str += `<a href="${safeUrl}" title="[${date}] ${safeUrl}" target="_blank">[${timeStamp}] ${HTMLescape(title)}</a><br>`
    }
    /** @type {HTMLElement} */
    const historyElement = /** @type {HTMLElement} */ (document.getElementById("history"))
    historyElement.innerHTML = str
  })
}

// MARK: SaveConfig()
settingsForm.addEventListener("submit", async function (event) {
  event.preventDefault()
  const newConfig = readConfig()

  if (currentConfig && deepCompare(currentConfig, newConfig)) {
    configMessage.textContent = "Change is nothing!!"
    clearMessageLater()
    return
  }

  try {
    await chrome.storage.local.set(newConfig)
    currentConfig = newConfig
    configMessage.textContent = "Saved!!"
  } catch (error) {
    console.error("Failed to save extension settings:", error)
    configMessage.textContent = "Save failed!!"
  }
  clearMessageLater()
})

// MARK: ClearMessageLater()
function clearMessageLater() {
  setTimeout(() => {
    configMessage.textContent = ""
  }, 1000)
}

// MARK: DeepCompare()
/**
 * @param {any} obj1 - 比較する最初の値（オブジェクト、配列、プリミティブ）。
 * @param {any} obj2 - 比較する2番目の値（オブジェクト、配列、プリミティブ）。
 * @returns {boolean} 値と型が完全に一致すれば true、そうでなければ false。
 */
function deepCompare(obj1, obj2) {
  if (Object.is(obj1, obj2)) return true
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false
  if (obj1 === null || obj2 === null) return false

  const isArray1 = Array.isArray(obj1)
  const isArray2 = Array.isArray(obj2)
  if (isArray1 !== isArray2) return false

  if (isArray1) {
    if (obj1.length !== obj2.length) return false
    return obj1.every((value, index) => deepCompare(value, obj2[index]))
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  if (keys1.length !== keys2.length) return false

  return keys1.every((key) => Object.hasOwn(obj2, key) && deepCompare(obj1[key], obj2[key]))
}

// MARK: HTMLescape()
/**
 * @param {unknown} value
 * @returns {string}
 */
function HTMLescape(value) {
  return String(value).replace(
    /[&'`"<>]/g,
    function (match) {
      return {
        '&': '&amp;',
        "'": '&#x27;',
        '`': '&#x60;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
      }[match]
    }
  );
}

// MARK: Padding()
/**
 * @param {number} value
 * @param {number} length
 * @returns {string}
 */
function padding(value, length) {
  return ('000' + value).slice(-length)
}
