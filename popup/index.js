// Init
// 使用量
chrome.storage.sync.getBytesInUse(function (result) {
  document.getElementById("ExtensionBufferUseValue").innerText = result
});
// History
updateHistory("")
// SecretSettings
chrome.storage.sync.get(["Setting"]).then((result) => {
  let setting = result.Setting
  document.getElementById("LiveSpeed").value = setting.LiveSpeed
  document.getElementById("LiveSpeedValue").innerText = setting.LiveSpeed
  document.getElementById("User").value = setting.User
  document.getElementById("Address").value = setting.Address
  document.getElementById("PostCode").value = setting.PostCode
  document.getElementById("Greeting").value = setting.Greeting
  document.getElementById("SecretAmazonMode").checked = setting.SecretAmazonMode
  document.getElementById("ShowAmazonBuyButton").checked = setting.ShowAmazonBuyButton
});


document.getElementById("LiveSpeed").addEventListener("change", function () {
  document.getElementById("LiveSpeedValue").innerText = document.getElementById("LiveSpeed").value
})

// 検索
document.getElementById("searchInput").addEventListener("input", function () {
  let keyword = document.getElementById("searchInput").value
  updateHistory(keyword)
})

function updateHistory(keyword) {
  const searchDate = new Date();
  searchDate.setDate(searchDate.getDate() - 7);
  chrome.history.search({ text: "", maxResults: 5000, startTime: searchDate.getTime() }, function (result) {
    let str = "";
    for (let i = 0; i < result.length; i++) {
      const title = result[i].title
      const url = result[i].url
      if (keyword != "") {
        if (!title.toUpperCase().includes(keyword.toUpperCase()) && !url.toUpperCase().includes(keyword.toUpperCase())) {
          continue
        }
      }

      const visitDate = new Date(result[i].lastVisitTime)
      const timeStamp = padding(visitDate.getHours(), 2) + ":" + padding(visitDate.getMinutes(), 2) + ":" + padding(visitDate.getSeconds(), 2)
      const date = visitDate.getFullYear() + "/" + padding((visitDate.getMonth() + 1), 2) + "/" + padding(visitDate.getDate(), 2) + " " + timeStamp
      str += `<a href="${url}" title="[${date}] ${url}" target="_blank">[${timeStamp}] ${HTMLescape(title)}</span><br>`
    }
    document.getElementById("history").innerHTML = str
  })
}

// SecretSettings更新
document.getElementById("SaveSetting").addEventListener("click", saveSecretSetting)

function saveSecretSetting() {
  chrome.storage.sync.set({
    Setting: {
      LiveSpeed: document.getElementById("LiveSpeed").value,
      User: document.getElementById("User").value,
      Address: document.getElementById("Address").value,
      PostCode: document.getElementById("PostCode").value,
      Greeting: document.getElementById("Greeting").value,
      SecretAmazonMode: document.getElementById("SecretAmazonMode").checked,
      ShowAmazonBuyButton: document.getElementById("ShowAmazonBuyButton").checked,
    }
  })
  document.getElementById("Saved").innerText = "Saved!"
}


function HTMLescape(str) {
  return str.replace(
    /[&'`"<>]/g,
    function (match) {
      return {
        '&': '&amp;',
        "'": '&#x27;',
        '`': '&#x60;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
      }[match]
    }
  );
}

function padding(str, n) {
  return ('000' + str).slice(-n)
}
// 待機
function sleep(waitSec, callbackFunc) {
  let spanedSec = 0;
  // 1秒間隔で無名関数を実行
  let id = setInterval(function () {
    spanedSec++;
    // 経過時間 >= 待機時間の場合、待機終了。
    if (spanedSec >= waitSec) {
      clearInterval(id);
      if (callbackFunc) callbackFunc();
    }
  }, 1000);
}
