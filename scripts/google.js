// 仮CSS
document.querySelector(`head`).insertAdjacentHTML("beforeend",`<link id="secretDummy" rel="stylesheet" href="${chrome.runtime.getURL('css/google.css')}">`)
// 読み込み
chrome.storage.sync.get(["secretSettings"]).then(async (result) => {
  // 置換準備
  let googleCss = await fetch(chrome.runtime.getURL('css/google.css'))
    .then(r => { return r.text() })
  // 置換
  googleCss = googleCss.replaceAll('${Address}', result.secretSettings.Address)
  googleCss = googleCss.replaceAll('${PostCode}', result.secretSettings.PostCode)
  console.log(googleCss)
  // 設置
  document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${googleCss}</style`)
})
// 仮CSS 削除
document.getElementById("secretDummy").remove()
// 非表示解除
setTimeout(function() {
  document.body.classList.add("isSecretLoaded")
},500)