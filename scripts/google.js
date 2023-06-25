let user = "Atomu"
let address = "Minecraft"
let postCode = "The_Overworld"

chrome.storage.sync.get(["isOpenAmazonMode"]).then(async (result) => {
  if (!result.isOpenAmazonMode) {
    // 仮CSS
    document.querySelector(`head`).innerHTML += `<link id="secretDummy" rel="stylesheet" href="${chrome.runtime.getURL('css/google.css')}">`
    // 置換準備
    let googleCss = await fetch(chrome.runtime.getURL('css/google.css'))
      .then(r => { return r.text() })
    // 置換
    googleCss = googleCss.replaceAll('${User}', user)
    googleCss = googleCss.replaceAll('${Address}', address)
    googleCss = googleCss.replaceAll('${PostCode}', postCode)
    console.log(googleCss)
    // 設置
    document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${googleCss}</style`)
    document.getElementById("secretDummy").remove()
  }
})