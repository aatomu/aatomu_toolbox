async function onLoaded() {
  const config = await chrome.storage.local.get(null)

  if (!config.amazon.enableSecret) return

  // 個人情報秘匿
  const secretCss = await fetch(chrome.runtime.getURL("src/amazon.css")).
    then(r => {
      return r.text()
    }).
    then(css => {
      return css.
        replaceAll('${User}', config.secret.name).
        replaceAll('${PostCode}', config.secret.postCode).
        replaceAll('${Address}', config.secret.address).
        replaceAll('${Greeting}', config.amazon.greeting)
    })
  console.log("Generat secret css:", secretCss)

  document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${secretCss}</style>`)

  // 購入ボタン
  if (config.amazon.showBuyButton) {
    let buttons = document.querySelectorAll("#submit\\.buy-now,#sc-buy-box-ptc-button")
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.add("amazon-unsafety")
    }
  }

  // 非表示解除
  document.body.classList.add("isSecretLoaded")
}

document.addEventListener("DOMContentLoaded", onLoaded)