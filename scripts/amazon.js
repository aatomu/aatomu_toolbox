chrome.storage.sync.get(["isOpenAmazonMode"]).then((result) => {
  if (!result.isOpenAmazonMode) {
    const amazonCss = chrome.runtime.getURL('css/amazon.css')
    console.log(amazonCss)
    document.querySelector(`head`).innerHTML += `<link rel="stylesheet" href="${chrome.runtime.getURL('css/amazon.css')}">`
  }
})