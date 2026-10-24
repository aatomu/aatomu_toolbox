// MARK: ToCssString()
/**
 * @param {unknown} value
 * @returns {string}
 */
function toCssString(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll(/\r?\n/g, "\\A ")
}

// MARK: OnLoaded()
async function onLoaded() {
  try {
    const config = await chrome.storage.local.get(null)
    if (!config.amazon?.enableSecret) return

    // 個人情報秘匿
    const secret = config.secret ?? { name: "", postCode: "", address: "" }
    const secretCss = await fetch(chrome.runtime.getURL("src/amazon.css")).
      then(r => {
        if (!r.ok) throw new Error(`Failed to fetch amazon.css: ${r.status}`)
        return r.text()
      }).
      then(css => {
        return css.
          replaceAll('${User}', toCssString(secret.name ?? "")).
          replaceAll('${PostCode}', toCssString(secret.postCode ?? "")).
          replaceAll('${Address}', toCssString(secret.address ?? "")).
          replaceAll('${Greeting}', toCssString(config.amazon.greeting ?? ""))
      })
    console.log("Generat secret css:", secretCss)

    document.head?.insertAdjacentHTML("beforeend", `<style>${secretCss}</style>`)

    // 購入ボタン
    if (config.amazon.showBuyButton) {
      const buttons = document.querySelectorAll("#submit\\.buy-now,#sc-buy-box-ptc-button")
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.add("amazon-unsafety")
      }
    }
  } catch (error) {
    console.error("Failed to apply Amazon secret mode:", error)
  } finally {
    // 非表示解除
    document.body?.classList.add("isSecretLoaded")
  }
}

document.addEventListener("DOMContentLoaded", onLoaded)