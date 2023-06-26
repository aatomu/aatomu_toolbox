chrome.storage.sync.get(["isOpenAmazonMode","secretSettings"]).then(async (result) => {
  if (!result.isOpenAmazonMode) {
    // 仮CSS
    document.querySelector(`head`).innerHTML += `<link id="secretDummy" rel="stylesheet" href="${chrome.runtime.getURL('css/google.css')}">`
    // 置換準備
    let googleCss = await fetch(chrome.runtime.getURL('css/google.css'))
      .then(r => { return r.text() })
    // 置換
    googleCss = googleCss.replaceAll('${Address}', result.secretSettings.Address)
    googleCss = googleCss.replaceAll('${PostCode}', result.secretSettings.PostCode)
    console.log(googleCss)
    // 設置
    document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${googleCss}</style`)
    document.getElementById("secretDummy").remove()
  }
})