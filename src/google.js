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
    const secret = config.secret ?? { name: "", postCode: "", address: "" }

    // 個人情報秘匿
    const secretCss = await fetch(chrome.runtime.getURL("src/google.css")).
      then(r => {
        if (!r.ok) throw new Error(`Failed to fetch google.css: ${r.status}`)
        return r.text()
      }).
      then(css => {
        return css.
          replaceAll('${PostCode}', toCssString(secret.postCode ?? "")).
          replaceAll('${Address}', toCssString(secret.address ?? ""))
      })
    console.log("Generat secret css:", secretCss)

    document.head?.insertAdjacentHTML("beforeend", `<style>${secretCss}</style>`)
  } catch (error) {
    console.error("Failed to apply Google secret mode:", error)
  } finally {
    // 非表示解除
    document.body?.classList.add("isSecretLoaded")
  }
}

document.addEventListener("DOMContentLoaded", onLoaded)