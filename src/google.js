async function onLoaded() {
  const config = await chrome.storage.local.get(null)

  // 個人情報秘匿
  const secretCss = await fetch(chrome.runtime.getURL("src/google.css")).
    then(r => {
      return r.text()
    }).
    then(css => {
      return css.
        replaceAll('${PostCode}', config.secret.postCode).
        replaceAll('${Address}', config.secret.address)
    })
  console.log("Generat secret css:", secretCss)

  document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${secretCss}</style>`)

  // 非表示解除
  document.body.classList.add("isSecretLoaded")
}

document.addEventListener("DOMContentLoaded", onLoaded)