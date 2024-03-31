// Global
//// 文字列を変換
function str2HTML(html) {
  const dummyElement = document.createElement('div');
  dummyElement.innerHTML = html;
  return dummyElement.firstElementChild;
}

//// いろんなサイトのクリーパー
if (/https?/.test(location.protocol)) {
  chrome.storage.sync.get(["isViewCreeper"]).then(result => {
    if (result.isViewCreeper) {
      const el = str2HTML(`<img class="creeper" id="creeper" src="${chrome.runtime.getURL("images/creeper.webp")}">`)
      document.body.appendChild(el)
      document.getElementById("creeper").addEventListener("mouseover", function (e) {
        document.getElementById("creeper").classList.add("creeper_fade")
      })
    }
  })

}

//// 変数チェック
let s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/contents_insert.js');
s.onload = function () {
  this.remove();
};
document.getElementsByTagName("body")[0].appendChild(s);


// document.querySelectorAll("*").forEach(el => {
//   for (node of el.childNodes) {
//     if (node.nodeType == Node.TEXT_NODE && !"SCRIPT,STYLE".includes(node.parentNode.nodeName)) {
//       node.nodeValue = node.nodeValue.replace("ない", "無い")
//       node.nodeValue = node.nodeValue.replace(/[ぁ-んァ-ヴｦ-ﾟ]/g, "")
//       console.log(node)
//     }
//   }
// })