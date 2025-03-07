document.addEventListener("DOMContentLoaded", async () => {
  // 読み込み
  const storage = await chrome.storage.sync.get(["Setting"]).then(result => { return result })

  // 置換
  let googleCSS = await fetch(chrome.runtime.getURL('css/google.css')).then(r => { return r.text() })
  googleCSS = googleCSS.replaceAll('${Address}', storage.Setting.Address)
  googleCSS = googleCSS.replaceAll('${PostCode}', storage.Setting.PostCode)
  console.log(googleCSS)

  // 設置
  document.querySelector(`head`).insertAdjacentHTML("beforeend", `<style>${googleCSS}</style>`)

  // 非表示解除
  document.body.classList.add("isSecretLoaded")
})