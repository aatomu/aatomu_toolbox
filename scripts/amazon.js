chrome.storage.sync.get(["disableAddon"]).then((result) => {
  if (!result.disableAddon) {
    const amazonCss = chrome.runtime.getURL('css/amazon.css')
    console.log(amazonCss)
    document.querySelector(`head`).innerHTML += `<link rel="stylesheet" href="${chrome.runtime.getURL('css/amazon.css')}">`
  }
})