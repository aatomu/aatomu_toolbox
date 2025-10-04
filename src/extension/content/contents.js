async function onLoad() {
  console.log("contents.js loaded")
  const HTML_Body = document.body
  if (!HTML_Body) return

  const config = await chrome.storage.local.get(null)

  // MARK: creeper
  if (config.enableCreeper) {
    const creeper = document.createElement('img');
    creeper.id = "creeper"
    creeper.classList.add("creeper")
    creeper.src = chrome.runtime.getURL("src/extension/content/creeper.webp")
    HTML_Body.appendChild(creeper)
    creeper.addEventListener("mouseover", function () {
      creeper.classList.add("creeper_fade")
    })
  }

  // MARK: Insert Script
  const insertScript = document.createElement('script');
  insertScript.src = chrome.runtime.getURL('src/extension/content/insert.js');
  insertScript.onload = function () {
    console.log("insert.js loaded")
    insertScript.remove();
  };
  HTML_Body.appendChild(insertScript)
}
onLoad()