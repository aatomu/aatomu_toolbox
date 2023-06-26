chrome.storage.sync.get(["isOpenAmazonMode","secretSettings"]).then(async (result) => {
  if (!result.isOpenAmazonMode) {
    // 仮CSS
    document.querySelector(`head`).innerHTML += `<link id="secretDummy" rel="stylesheet" href="${chrome.runtime.getURL('css/amazon.css')}">`
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
    document.getElementById("secretDummy").remove()
  }
})