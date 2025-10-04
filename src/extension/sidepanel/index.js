/** @type {HTMLDivElement}*/
// @ts-expect-error
const previewArea = document.getElementById("preview-area")
/** @type {HTMLImageElement}*/
// @ts-expect-error
const preview = document.getElementById("preview")

let currentScale = 1.00


chrome.runtime.onMessage.addListener(onMessage);

/**
 * @param {{command:string, arg: any}} message
 * @param {chrome.runtime.MessageSender} sender - 送信元の情報（タブなど）
 * @param {function(*): void} sendResponse - 応答を返す関数
 */
function onMessage(message, sender, sendResponse) {
  console.log(`Message:`, message);
  switch (message.command) {
    case "preview": {
      preview.src = message.arg
    }
  }
}

previewArea.addEventListener("wheel", (event) => {
  event.preventDefault(); // スクロールを防止

  // 1. 新しい拡大率を計算
  let newScale = 1
  if (event.deltaY < 0) {
    newScale = currentScale * 1.1
  } else {
    newScale = currentScale * 0.9
  }
  newScale = Math.max(0.2, Math.min(5.0, newScale));

  // 拡大率に変更がなければ終了
  if (newScale === currentScale) {
    return;
  }

  // 2. カーソルの位置を基準に transform-origin を計算
  const rect = preview.getBoundingClientRect(); // 画像要素の絶対位置とサイズを取得

  // カーソルの位置を画像要素の左上 (0, 0) を基準とした相対座標として計算
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 3. transform-origin を更新 (ピクセル値で設定)
  // これが拡大縮小の中心を設定します。
  preview.style.transformOrigin = `${x}px ${y}px`;

  // 4. 拡大率を更新し、transform を適用
  currentScale = newScale;
  preview.style.transform = `scale(${currentScale})`;

  // console.log(`Scale: ${currentScale.toFixed(2)}x, Origin: ${x}px ${y}px`);
})
