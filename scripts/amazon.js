document.addEventListener("DOMContentLoaded", async () => {
  // CSS読み込み
  const storage = await chrome.storage.sync.get(["Setting"]).then(result => { return result })

  // secretモードか
  if (!storage.Setting.SecretAmazonMode) {
    return
  }

  // 置換
  let amazonCSS = await fetch(chrome.runtime.getURL('css/amazon.css')).then(r => { return r.text() })
  amazonCSS = amazonCSS.replaceAll('${User}', storage.Setting.User)
  amazonCSS = amazonCSS.replaceAll('${Address}', storage.Setting.Address)
  amazonCSS = amazonCSS.replaceAll('${PostCode}', storage.Setting.PostCode)
  amazonCSS = amazonCSS.replaceAll('${Greeting}', storage.Setting.Greeting)
  console.log(amazonCSS)

  // 設置
  document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${amazonCSS}</style>`)

  // 購入ボタンの表示
  if (storage.Setting.ShowAmazonBuyButton) {
    let buttons = document.querySelectorAll("#submit\\.buy-now,#sc-buy-box-ptc-button")
    for (i = 0; i < buttons.length; i++) {
      buttons[i].classList.add("amazon-unsafety")
    }
  }

  // 非表示解除
  document.body.classList.add("isSecretLoaded")
}, 500)