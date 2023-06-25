let user = "Atomu"
let address = "Minecraft"
let postCode = "The_Overworld"
let greeting = "/say"

chrome.storage.sync.get(["isOpenAmazonMode"]).then(async (result) => {
  if (!result.isOpenAmazonMode) {
    // 仮CSS
    document.querySelector(`head`).innerHTML += `<link id="secretDummy" rel="stylesheet" href="${chrome.runtime.getURL('css/amazon.css')}">`
    // 置換準備
    let amazonCss = await fetch(chrome.runtime.getURL('css/amazon.css'))
      .then(r => { return r.text() })
    // 置換
    amazonCss = amazonCss.replaceAll('${User}', user)
    amazonCss = amazonCss.replaceAll('${Address}', address)
    amazonCss = amazonCss.replaceAll('${PostCode}', postCode)
    amazonCss = amazonCss.replaceAll('${Greeting}', greeting)
    console.log(amazonCss)
    // 設置
    document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${amazonCss}</style`)
    document.getElementById("secretDummy").remove()
  }
})