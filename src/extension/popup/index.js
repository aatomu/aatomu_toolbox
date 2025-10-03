/** @type {HTMLTextAreaElement} */
//@ts-expect-error
const configInput = document.getElementById("config-input")
/** @type {HTMLButtonElement} */
//@ts-expect-error
const configSave = document.getElementById("config-save")

async function onLoaded() {
  // History
  updateHistory("")

  document.getElementById("ExtensionBufferUseValue").innerText = (await chrome.storage.local.getBytesInUse()).toString()

  const config = await chrome.storage.local.get(null)
  configInput.value = JSON.stringify(config, null, "  ")
}

onLoaded()

// 検索
document.getElementById("searchInput").addEventListener("input", function () {
  /** @type {HTMLInputElement} */
  // @ts-expect-error
  const input = document.getElementById("searchInput")
  updateHistory(input.value)
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
document.getElementById("config-save").addEventListener("click", saveConfig)

async function saveConfig() {
  const oldConfig = chrome.storage.local.get(null)
  const newConfig = JSON.parse(configInput.value)
  if (deepCompare(oldConfig, newConfig)) {
    chrome.storage.local.set(newConfig)
  }
}

/**
 * @param {any} obj1 - 比較する最初の値（オブジェクト、配列、プリミティブ）。
 * @param {any} obj2 - 比較する2番目の値（オブジェクト、配列、プリミティブ）。
 * @returns {boolean} スキーマと型が完全に一致すれば true、そうでなければ false。
 */
function deepCompare(obj1, obj2) {
  const type1 = typeof obj1;
  const type2 = typeof obj2;

  // 型の不一致
  if (type1 !== type2) return false
  // 両方 null か(typeof null => objectのため)
  if (obj1 === null && obj2 === null) return true

  //  "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined"の一致("object" | "function"以外)
  if (type1 !== 'object' && type1 !== 'function') return true

  // 配列の比較
  const isArray1 = Array.isArray(obj1);
  const isArray2 = Array.isArray(obj2);

  // 片方だけ配列なら NG
  if (isArray1 !== isArray2) return false;

  if (isArray1) {
    // 両方 長さ 0
    if (obj1.length === 0 && obj2.length === 0) return true

    // 最初の要素の型だけ比較
    const element1 = obj1[0];
    const element2 = obj2[0];

    if (obj1.length > 0 && obj2.length > 0) return deepCompare(element1, element2);

    // 長さが異なる場合
    if (obj1.length !== obj2.length) {
      // 要素の型が一致していればOKとするか、厳密に length も比較するかは要件次第
      // ここでは、要素の型チェックのため、一旦 true を返します
      return true;
    }

    return true;
  }

  // 3. オブジェクトのキーセットの完全一致チェック
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Object key 違い
  if (keys1.length !== keys2.length) return false;

  const sortedKeys1 = keys1.sort();
  const sortedKeys2 = keys2.sort();

  for (let i = 0; i < sortedKeys1.length; i++) {
    if (sortedKeys1[i] !== sortedKeys2[i]) return false;
  }

  // 再帰的 型比較
  for (const key of keys1) {
    if (!deepCompare(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true; // すべてのチェックを通過
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