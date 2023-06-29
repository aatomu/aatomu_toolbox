// 仮CSS
document.querySelector(`head`).insertAdjacentHTML("beforeend", `<link id="secretDummy" rel="stylesheet" href="${chrome.runtime.getURL('css/amazon.css')}">`)
// CSS読み込み
chrome.storage.sync.get(["isDisableSecretAmazonMode", "secretSettings", "isShowAmazonBuyButton"]).then(async (result) => {
  // secretモードか
  if (result.isDisableSecretAmazonMode) {
    return
  }
  // 置換準備
  let amazonCss = await fetch(chrome.runtime.getURL('css/amazon.css'))
    .then(r => { return r.text() })
  // 置換
  amazonCss = amazonCss.replaceAll('${User}', result.secretSettings.User)
  amazonCss = amazonCss.replaceAll('${Address}', result.secretSettings.Address)
  amazonCss = amazonCss.replaceAll('${PostCode}', result.secretSettings.PostCode)
  amazonCss = amazonCss.replaceAll('${Greeting}', result.secretSettings.Greeting)
  console.log(amazonCss)
  // 設置
  document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${amazonCss}</style`)

  // 購入ボタンの表示
  console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",result.isShowAmazonBuyButton)
  if (result.isShowAmazonBuyButton) {
    let buttons = document.querySelectorAll("#submit\\.buy-now,#sc-buy-box-ptc-button")
    for (i=0;i<buttons.length;i++) {
      buttons[i].classList.add("amazon-unsafety")
    }
  }
})
// 仮CSS削除
document.getElementById("secretDummy").remove()
// 非表示解除
setTimeout(function () {
  document.body.classList.add("isSecretLoaded")
}, 500)