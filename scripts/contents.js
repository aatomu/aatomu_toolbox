console.log("contents.js loaded")
function str2HTML(html) {
  const dummyElement = document.createElement('div');
  dummyElement.innerHTML = html;
  return dummyElement.firstElementChild;
}

// Protocol Check
const HTML_Body = document.body
if (HTML_Body) {
  // Creeper
  chrome.storage.sync.get(["isViewCreeper"]).then(result => {
    if (result.isViewCreeper) {
      const creeper = str2HTML(`<img class="creeper" id="creeper" src="${chrome.runtime.getURL("images/creeper.webp")}">`)
      HTML_Body.appendChild(creeper)
      creeper.addEventListener("mouseover", function () {
        creeper.classList.add("creeper_fade")
      })
    }
  })

  const insertScript = document.createElement('script');
  insertScript.src = chrome.runtime.getURL('scripts/contents_insert.js');
  insertScript.onload = function () {
    console.log("contents_insert.js loaded")
    this.remove();
  };
  HTML_Body.appendChild(insertScript)
}